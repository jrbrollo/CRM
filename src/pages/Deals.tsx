import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { CreateDealDialog } from "@/components/deals/CreateDealDialog";
import { CreatePipelineDialog } from "@/components/pipelines/CreatePipelineDialog";
import { useDeals, useDealStats } from "@/lib/hooks/useDeals";
import { usePipelines } from "@/lib/hooks/usePipelines";
import {
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Percent,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Deals() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPipelineDialogOpen, setCreatePipelineDialogOpen] = useState(false);

  const { data: pipelines, isLoading: loadingPipelines } = usePipelines();
  const { data: deals, isLoading: loadingDeals } = useDeals();
  const { data: stats } = useDealStats();

  // Set default pipeline if not set
  if (!selectedPipelineId && pipelines && pipelines.length > 0) {
    setSelectedPipelineId(pipelines[0].id);
  }

  const selectedPipeline = pipelines?.find((p) => p.id === selectedPipelineId);

  const filteredDeals = deals?.filter((deal) => deal.pipelineId === selectedPipelineId);

  const getDealsByStage = (stageId: string) => {
    return filteredDeals?.filter((deal) => deal.stageId === stageId) || [];
  };

  const getTotalValue = (stageId: string) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + deal.value, 0);
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  };

  const isLoading = loadingPipelines || loadingDeals;

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Negociações</h1>
            <p className="text-muted-foreground">
              Gerencie seus funis de prospecção e vendas
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Negociação
          </Button>
        </div>

        {/* Create Deal Dialog */}
        <CreateDealDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        {/* Create Pipeline Dialog */}
        <CreatePipelineDialog
          open={createPipelineDialogOpen}
          onOpenChange={setCreatePipelineDialogOpen}
        />

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Negociação</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalDeals || 0} negociações ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.conversionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageTimeToClose || 0} dias
              </div>
              <p className="text-xs text-muted-foreground">Para fechamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.averageValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Por negociação</p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Selector */}
        {pipelines && pipelines.length > 0 && (
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                {pipelines.map((pipeline) => (
                  <Button
                    key={pipeline.id}
                    variant={selectedPipelineId === pipeline.id ? "default" : "outline"}
                    onClick={() => setSelectedPipelineId(pipeline.id)}
                    className="gap-2"
                  >
                    <Target className="h-4 w-4" />
                    {pipeline.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Carregando pipeline...</p>
          </div>
        ) : !selectedPipeline ? (
          <Card className="shadow-soft">
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum pipeline encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro pipeline para começar a gerenciar negociações
              </p>
              <Button onClick={() => setCreatePipelineDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Pipeline
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pipeline Board */}
            <div className="overflow-x-auto pb-4">
              <div className="inline-flex gap-4 min-w-full">
                {selectedPipeline.stages.map((stage) => {
                  const stageDeals = getDealsByStage(stage.id);
                  const stageValue = getTotalValue(stage.id);

                  return (
                    <div
                      key={stage.id}
                      className="w-80 flex-shrink-0 space-y-4"
                    >
                      {/* Stage Header */}
                      <Card className="shadow-soft">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color || "#6366f1" }}
                            />
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium">
                                {stage.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {stageDeals.length} negociação(ões) •{" "}
                                {formatCurrency(stageValue)}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Stage Deals */}
                      <div className="space-y-3">
                        {stageDeals.map((deal) => (
                          <Card
                            key={deal.id}
                            className="shadow-soft hover:shadow-medium transition-all cursor-pointer"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">{deal.title}</h4>
                                <div className="text-xs text-muted-foreground">
                                  {deal.contactId && (
                                    <p>Contato vinculado</p>
                                  )}
                                  {deal.companyName && (
                                    <p>{deal.companyName}</p>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {formatCurrency(deal.value)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(deal.updatedAt)}
                                  </span>
                                </div>
                                {deal.expectedCloseDate && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Prev: {formatDate(deal.expectedCloseDate)}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Add Deal Button */}
                      <Button
                        variant="ghost"
                        className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Negociação
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty State for Pipeline with no deals */}
            {filteredDeals && filteredDeals.length === 0 && (
              <Card className="shadow-soft mt-6">
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma negociação neste pipeline
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira negociação para começar
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Negociação
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </CrmLayout>
  );
}
