import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmLayout } from "@/components/CrmLayout";
import { Plus, TrendingUp, Users, UserCheck, Target } from "lucide-react";

// Dados mockados para demonstração
const mockStats = {
  totalLeads: 47,
  newLeads: 12,
  qualifiedLeads: 8,
  convertedClients: 3,
  conversionRate: 18.5
};

const recentLeads = [
  { id: 1, name: "Maria Silva", email: "maria@email.com", status: "new", source: "Meta Ads" },
  { id: 2, name: "João Santos", email: "joao@email.com", status: "contacted", source: "Site" },
  { id: 3, name: "Ana Costa", email: "ana@email.com", status: "qualified", source: "Meta Ads" },
  { id: 4, name: "Pedro Lima", email: "pedro@email.com", status: "converted", source: "Indicação" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "new": return "text-lead-new";
    case "contacted": return "text-lead-contacted";
    case "qualified": return "text-lead-qualified";
    case "converted": return "text-lead-converted";
    default: return "text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "new": return "Novo";
    case "contacted": return "Contatado";
    case "qualified": return "Qualificado";
    case "converted": return "Convertido";
    default: return status;
  }
};

export default function Dashboard() {
  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu CRM</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                +12% do mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
              <UserCheck className="h-4 w-4 text-lead-new" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lead-new">{mockStats.newLeads}</div>
              <p className="text-xs text-muted-foreground">
                Esta semana
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              <Target className="h-4 w-4 text-lead-qualified" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lead-qualified">{mockStats.qualifiedLeads}</div>
              <p className="text-xs text-muted-foreground">
                Prontos para conversão
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-lead-converted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lead-converted">{mockStats.convertedClients}</div>
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
              <div className="text-2xl font-bold text-success">{mockStats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Meta: 20%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-sm font-medium text-accent-foreground">
                        {lead.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {lead.source}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}