import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmLayout } from "@/components/CrmLayout";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Calendar } from "lucide-react";

// Dados mockados para demonstração
const mockReports = {
  summary: {
    totalLeads: 47,
    leadsThisMonth: 15,
    conversionRate: 18.5,
    revenue: 48000,
    revenueGrowth: 12.3,
    activeClients: 2
  },
  leadsBySource: [
    { source: "Meta Ads", count: 28, percentage: 59.6 },
    { source: "Site", count: 12, percentage: 25.5 },
    { source: "Indicação", count: 5, percentage: 10.6 },
    { source: "Google Ads", count: 2, percentage: 4.3 }
  ],
  monthlyData: [
    { month: "Nov", leads: 12, conversions: 2 },
    { month: "Dez", leads: 20, conversions: 4 },
    { month: "Jan", leads: 15, conversions: 3 }
  ]
};

export default function Reports() {
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
            <Button variant="outline">Exportar PDF</Button>
            <Button>Gerar Relatório</Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockReports.summary.totalLeads}</div>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{mockReports.summary.leadsThisMonth} este mês
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{mockReports.summary.conversionRate}%</div>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.1% vs mês anterior
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">R$ {mockReports.summary.revenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{mockReports.summary.revenueGrowth}% crescimento
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lead-qualified">{mockReports.summary.activeClients}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                Projetos em andamento
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Leads por Fonte */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Leads por Fonte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReports.leadsBySource.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-lead-new' :
                        index === 1 ? 'bg-lead-contacted' :
                        index === 2 ? 'bg-lead-qualified' : 'bg-lead-converted'
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
            </CardContent>
          </Card>

          {/* Performance Mensal */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Performance Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReports.monthlyData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="font-medium">{item.month}</div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold text-lead-new">{item.leads}</div>
                        <div className="text-xs text-muted-foreground">Leads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-lead-converted">{item.conversions}</div>
                        <div className="text-xs text-muted-foreground">Conversões</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-success">
                          {((item.conversions / item.leads) * 100).toFixed(1)}%
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
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <h4 className="font-medium text-success">Excelente Performance do Meta Ads</h4>
                  <p className="text-sm text-muted-foreground">
                    O Meta Ads está gerando 59.6% dos seus leads. Continue investindo neste canal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Target className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Oportunidade de Melhoria</h4>
                  <p className="text-sm text-muted-foreground">
                    Sua taxa de conversão está próxima da meta de 20%. Foque em qualificar melhor os leads do Google Ads.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-lead-new/10 border border-lead-new/20">
                <Users className="h-5 w-5 text-lead-new mt-0.5" />
                <div>
                  <h4 className="font-medium text-lead-new">Indicações em Crescimento</h4>
                  <p className="text-sm text-muted-foreground">
                    As indicações representam 10.6% dos leads. Considere criar um programa de referência.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}