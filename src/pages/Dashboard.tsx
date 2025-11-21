import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmLayout } from "@/components/CrmLayout";
import { Plus, TrendingUp, Users, UserCheck, Target, Loader2 } from "lucide-react";
import { useDeals } from "@/lib/hooks/useDeals";
import { useContacts } from "@/lib/hooks/useContacts";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();

  const isLoading = dealsLoading || contactsLoading;

  // Calculate real stats
  const stats = useMemo(() => {
    // Get current date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter deals by date ranges
    const dealsThisWeek = deals.filter(d => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt);
      return createdAt >= startOfWeek;
    });

    const dealsThisMonth = deals.filter(d => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt);
      return createdAt >= startOfMonth;
    });

    const dealsLastMonth = deals.filter(d => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt);
      return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
    });

    // Count by status
    const wonDealsThisMonth = dealsThisMonth.filter(d => d.status === 'won').length;
    const activeDeals = deals.filter(d => d.status === 'active').length;

    // Calculate conversion rate
    const totalDealsThisMonth = dealsThisMonth.length;
    const conversionRate = totalDealsThisMonth > 0
      ? ((wonDealsThisMonth / totalDealsThisMonth) * 100).toFixed(1)
      : 0;

    // Calculate growth
    const growthRate = dealsLastMonth.length > 0
      ? (((dealsThisMonth.length - dealsLastMonth.length) / dealsLastMonth.length) * 100).toFixed(0)
      : 0;

    return {
      totalDeals: deals.length,
      newDealsThisWeek: dealsThisWeek.length,
      activeDeals,
      wonDealsThisMonth,
      conversionRate: Number(conversionRate),
      growthRate: Number(growthRate),
    };
  }, [deals]);

  // Get recent deals (last 5)
  const recentDeals = useMemo(() => {
    return [...deals]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [deals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-blue-600";
      case "won": return "text-green-600";
      case "lost": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "won": return "Ganho";
      case "lost": return "Perdido";
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <CrmLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CrmLayout>
    );
  }

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu CRM</p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/deals')}>
            <Plus className="h-4 w-4" />
            Novo Deal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Deals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}% do mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos (Semana)</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.newDealsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.activeDeals}</div>
              <p className="text-xs text-muted-foreground">
                Em andamento
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos (Mês)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.wonDealsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Meta: 20%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deals */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Deals Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum deal cadastrado ainda.</p>
                <Button variant="link" onClick={() => navigate('/deals')} className="mt-2">
                  Criar primeiro deal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeals.map((deal) => {
                  const createdAt = deal.createdAt?.toDate?.() || new Date(deal.createdAt);
                  const timeAgo = formatDistanceToNow(createdAt, {
                    addSuffix: true,
                    locale: ptBR
                  });

                  return (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer rounded px-2 transition-colors"
                      onClick={() => navigate(`/deals`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-sm font-medium text-accent-foreground">
                            {deal.contactName?.charAt(0) || deal.title?.charAt(0) || 'D'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{deal.title || 'Deal sem título'}</p>
                          <p className="text-sm text-muted-foreground">
                            {deal.contactName || 'Sem contato'} • {timeAgo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {deal.value && (
                          <span className="text-sm font-medium text-muted-foreground">
                            R$ {deal.value.toLocaleString('pt-BR')}
                          </span>
                        )}
                        <span className={`text-sm font-medium ${getStatusColor(deal.status)}`}>
                          {getStatusLabel(deal.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}
