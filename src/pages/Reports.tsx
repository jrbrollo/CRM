import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmLayout } from "@/components/CrmLayout";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useDeals } from "@/lib/hooks/useDeals";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  const { data: deals = [], isLoading } = useDeals();

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Filter deals by month
    const dealsThisMonth = deals.filter(d => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt);
      return isWithinInterval(createdAt, { start: thisMonthStart, end: thisMonthEnd });
    });

    const dealsLastMonth = deals.filter(d => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt);
      return isWithinInterval(createdAt, { start: lastMonthStart, end: lastMonthEnd });
    });

    // Calculate revenue from won deals
    const revenue = deals
      .filter(d => d.status === 'won')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const revenueThisMonth = dealsThisMonth
      .filter(d => d.status === 'won')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const revenueLastMonth = dealsLastMonth
      .filter(d => d.status === 'won')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const revenueGrowth = revenueLastMonth > 0
      ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
      : 0;

    // Conversion rates
    const wonDealsThisMonth = dealsThisMonth.filter(d => d.status === 'won').length;
    const conversionRate = dealsThisMonth.length > 0
      ? ((wonDealsThisMonth / dealsThisMonth.length) * 100).toFixed(1)
      : 0;

    const wonDealsLastMonth = dealsLastMonth.filter(d => d.status === 'won').length;
    const lastMonthConversionRate = dealsLastMonth.length > 0
      ? ((wonDealsLastMonth / dealsLastMonth.length) * 100).toFixed(1)
      : 0;

    const conversionRateChange = Number(conversionRate) - Number(lastMonthConversionRate);

    // Active clients
    const activeClients = deals.filter(d => d.status === 'active').length;

    return {
      totalDeals: deals.length,
      dealsThisMonth: dealsThisMonth.length,
      revenue,
      revenueGrowth: Number(revenueGrowth),
      conversionRate: Number(conversionRate),
      conversionRateChange: Number(conversionRateChange.toFixed(1)),
      activeClients,
    };
  }, [deals]);

  // Deals by source
  const dealsBySource = useMemo(() => {
    const sourceCounts = new Map<string, number>();
    deals.forEach(deal => {
      const source = deal.sourceId || 'Sem fonte';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });

    const total = deals.length || 1;
    return Array.from(sourceCounts.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: ((count / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 sources
  }, [deals]);

  // Monthly performance (last 3 months)
  const monthlyPerformance = useMemo(() => {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthDeals = deals.filter(d => {
        const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      });

      const conversions = monthDeals.filter(d => d.status === 'won').length;

      months.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        leads: monthDeals.length,
        conversions,
        rate: monthDeals.length > 0
          ? ((conversions / monthDeals.length) * 100).toFixed(1)
          : '0.0',
      });
    }
    return months;
  }, [deals]);

  // Generate insights
  const insights = useMemo(() => {
    const insights = [];

    // Top source insight
    if (dealsBySource.length > 0) {
      const topSource = dealsBySource[0];
      if (Number(topSource.percentage) > 30) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: `${topSource.source} está gerando resultados`,
          description: `${topSource.percentage}% dos seus deals vêm desta fonte. Continue investindo neste canal.`,
        });
      }
    }

    // Conversion rate insight
    if (stats.conversionRate < 15) {
      insights.push({
        type: 'warning',
        icon: Target,
        title: 'Taxa de conversão abaixo da meta',
        description: `Sua taxa de conversão está em ${stats.conversionRate}%. Meta recomendada: 20%. Foque em qualificar melhor os leads.`,
      });
    } else if (stats.conversionRate >= 20) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'Excelente taxa de conversão!',
        description: `Sua taxa de conversão de ${stats.conversionRate}% está acima da meta. Parabéns!`,
      });
    }

    // Growth insight
    if (stats.revenueGrowth > 10) {
      insights.push({
        type: 'success',
        icon: DollarSign,
        title: 'Crescimento acelerado',
        description: `Receita cresceu ${stats.revenueGrowth}% este mês. Continue com o bom trabalho!`,
      });
    } else if (stats.revenueGrowth < 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Atenção: queda na receita',
        description: `Receita caiu ${Math.abs(stats.revenueGrowth)}% este mês. Revise sua estratégia de vendas.`,
      });
    }

    // If no insights, add a neutral one
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        icon: Users,
        title: 'Continue trabalhando!',
        description: 'Mantenha o foco na geração e qualificação de leads para melhorar seus resultados.',
      });
    }

    return insights;
  }, [dealsBySource, stats]);

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
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Análise completa do desempenho do CRM</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>Exportar PDF</Button>
            <Button disabled>Gerar Relatório</Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Deals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.dealsThisMonth} este mês
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.conversionRate}%</div>
              <div className={`flex items-center text-xs ${stats.conversionRateChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.conversionRateChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {stats.conversionRateChange >= 0 ? '+' : ''}{stats.conversionRateChange}% vs mês anterior
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {stats.revenue.toLocaleString('pt-BR')}
              </div>
              <div className={`flex items-center text-xs ${stats.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% crescimento
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.activeClients}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                Em andamento
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Deals por Fonte */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Deals por Fonte</CardTitle>
            </CardHeader>
            <CardContent>
              {dealsBySource.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum deal com fonte cadastrada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dealsBySource.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-orange-600' :
                          index === 3 ? 'bg-purple-600' : 'bg-gray-600'
                        }`} />
                        <span className="text-sm font-medium">{item.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{item.count}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Mensal */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Performance Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyPerformance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="font-medium capitalize">{item.month}</div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold text-blue-600">{item.leads}</div>
                        <div className="text-xs text-muted-foreground">Deals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-600">{item.conversions}</div>
                        <div className="text-xs text-muted-foreground">Ganhos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-success">
                          {item.rate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Taxa</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Insights e Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                const colorClasses = {
                  success: 'bg-success/10 border-success/20 text-success',
                  warning: 'bg-warning/10 border-warning/20 text-warning',
                  info: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
                };

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${colorClasses[insight.type]}`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${colorClasses[insight.type].split(' ').pop()}`} />
                    <div>
                      <h4 className={`font-medium ${colorClasses[insight.type].split(' ').pop()}`}>
                        {insight.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}
