import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { Plus, Target, TrendingUp, User, Calendar, FileText, PenTool, DollarSign, CheckCircle } from "lucide-react";

// Dados mockados para demonstração
const mockDeals = [
  {
    id: 1,
    title: "Consultoria Silva & Co",
    contactName: "Maria Silva",
    company: "Silva & Co",
    value: 15000,
    stage: "lead-frio",
    funnel: "prospectacao",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15"
  },
  {
    id: 2,
    title: "Projeto Santos Tech",
    contactName: "João Santos",
    company: "Santos Tech",
    value: 25000,
    stage: "fazer-contato",
    funnel: "prospectacao",
    createdAt: "2024-01-14",
    updatedAt: "2024-01-16"
  },
  {
    id: 3,
    title: "Consultoria Costa",
    contactName: "Ana Costa",
    company: "Costa Consultoria",
    value: 18000,
    stage: "reuniao-feita",
    funnel: "venda",
    createdAt: "2024-01-13",
    updatedAt: "2024-01-17"
  },
  {
    id: 4,
    title: "Projeto Lima Solutions",
    contactName: "Pedro Lima",
    company: "Lima Solutions",
    value: 30000,
    stage: "assinatura-contrato",
    funnel: "venda",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-18"
  }
];

const prospectingStages = [
  { key: "lead-frio", label: "Lead Frio", icon: User, color: "bg-slate-500" },
  { key: "fazer-contato", label: "Fazer Contato", icon: Target, color: "bg-blue-500" },
  { key: "nao-atendido", label: "Não Atendido/Tentar Novamente", icon: TrendingUp, color: "bg-yellow-500" },
  { key: "contato-feito", label: "Contato Feito", icon: CheckCircle, color: "bg-green-500" },
  { key: "reuniao-agendada", label: "Reunião Agendada", icon: Calendar, color: "bg-purple-500" }
];

const salesStages = [
  { key: "reuniao-agendada", label: "Reunião Agendada", icon: Calendar, color: "bg-purple-500" },
  { key: "reuniao-feita", label: "Reunião Feita", icon: CheckCircle, color: "bg-green-500" },
  { key: "proposta-feita", label: "Proposta Feita", icon: FileText, color: "bg-blue-500" },
  { key: "elaboracao-contrato", label: "Elaboração de Contrato", icon: PenTool, color: "bg-orange-500" },
  { key: "assinatura-contrato", label: "Assinatura de Contrato", icon: FileText, color: "bg-indigo-500" },
  { key: "pagamento", label: "Pagamento", icon: DollarSign, color: "bg-green-600" },
  { key: "venda-efetuada", label: "Venda Efetuada", icon: CheckCircle, color: "bg-emerald-600" }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const moveDeal = (dealId: number, newStage: string, newFunnel?: string) => {
  // Esta função seria implementada com backend real
  console.log(`Moving deal ${dealId} to stage ${newStage}${newFunnel ? ` in funnel ${newFunnel}` : ''}`);
};

export default function Deals() {
  const [selectedFunnel, setSelectedFunnel] = useState<"prospectacao" | "venda">("prospectacao");

  const currentStages = selectedFunnel === "prospectacao" ? prospectingStages : salesStages;
  const filteredDeals = mockDeals.filter(deal => deal.funnel === selectedFunnel);

  const getDealsByStage = (stageKey: string) => {
    return filteredDeals.filter(deal => deal.stage === stageKey);
  };

  const getTotalValue = (stageKey: string) => {
    return getDealsByStage(stageKey).reduce((sum, deal) => sum + deal.value, 0);
  };

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Negociações</h1>
            <p className="text-muted-foreground">Gerencie seus funis de prospecção e vendas</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Negociação
          </Button>
        </div>

        {/* Funnel Selector */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                variant={selectedFunnel === "prospectacao" ? "default" : "outline"}
                onClick={() => setSelectedFunnel("prospectacao")}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Funil de Prospecção
              </Button>
              <Button
                variant={selectedFunnel === "venda" ? "default" : "outline"}
                onClick={() => setSelectedFunnel("venda")}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Funil de Vendas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {currentStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.key);
            const stageValue = getTotalValue(stage.key);
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="space-y-4">
                {/* Stage Header */}
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${stage.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {stageDeals.length} negociação(ões) • {formatCurrency(stageValue)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Stage Deals */}
                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="shadow-soft hover:shadow-medium transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{deal.title}</h4>
                          <div className="text-xs text-muted-foreground">
                            <p>{deal.contactName}</p>
                            <p>{deal.company}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(deal.value)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(deal.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Deal Button */}
                <Button
                  variant="ghost"
                  className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                  onClick={() => console.log(`Add deal to stage: ${stage.key}`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Negociação
                </Button>
              </div>
            );
          })}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Total em Negociação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(filteredDeals.reduce((sum, deal) => sum + deal.value, 0))}
              </p>
              <p className="text-sm text-muted-foreground">{filteredDeals.length} negociações ativas</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">78%</p>
              <p className="text-sm text-muted-foreground">Nos últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">15 dias</p>
              <p className="text-sm text-muted-foreground">Para fechamento</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CrmLayout>
  );
}