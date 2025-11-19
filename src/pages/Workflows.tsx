import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrmLayout } from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkflows, useUpdateWorkflow, useDeleteWorkflow } from "@/lib/hooks/useWorkflows";
import { Workflow as WorkflowIcon, Plus, Search, MoreVertical, Play, Pause, Archive, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Workflow } from "@/lib/types/workflow.types";

export default function Workflows() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: workflows, isLoading } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const filteredWorkflows = workflows?.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (workflowId: string, newStatus: Workflow["status"]) => {
    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        data: { status: newStatus },
      });

      const statusMessages = {
        active: "Workflow ativado com sucesso!",
        paused: "Workflow pausado",
        archived: "Workflow arquivado",
        draft: "Workflow movido para rascunhos",
      };

      toast.success(statusMessages[newStatus]);
    } catch (error) {
      toast.error("Erro ao atualizar workflow");
    }
  };

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o workflow "${workflowName}"?`)) {
      try {
        await deleteWorkflow.mutateAsync(workflowId);
        toast.success("Workflow excluído com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir workflow");
      }
    }
  };

  const getStatusBadge = (status: Workflow["status"]) => {
    const variants = {
      active: { variant: "default" as const, label: "Ativo" },
      paused: { variant: "secondary" as const, label: "Pausado" },
      draft: { variant: "outline" as const, label: "Rascunho" },
      archived: { variant: "secondary" as const, label: "Arquivado" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <WorkflowIcon className="h-8 w-8 text-primary" />
              Workflows
            </h1>
            <p className="text-muted-foreground mt-1">
              Automatize seus processos de vendas e relacionamento
            </p>
          </div>
          <Button onClick={() => navigate("/workflows/new")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Workflows</CardTitle>
              <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows?.filter((w) => w.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inscrito</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows?.reduce((sum, w) => sum + (w.stats?.totalEnrolled || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows?.length
                  ? Math.round(
                      (workflows.reduce((sum, w) => sum + (w.stats?.completed || 0), 0) /
                        Math.max(workflows.reduce((sum, w) => sum + (w.stats?.totalEnrolled || 0), 0), 1)) *
                        100
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Workflows List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando workflows...</p>
          </div>
        ) : filteredWorkflows && filteredWorkflows.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {workflow.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>

                        {workflow.status !== "active" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(workflow.id, "active")}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Ativar
                          </DropdownMenuItem>
                        )}

                        {workflow.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(workflow.id, "paused")}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleStatusChange(workflow.id, "archived")}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDelete(workflow.id, workflow.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(workflow.status)}
                    <Badge variant="outline">
                      {workflow.steps.length} {workflow.steps.length === 1 ? "passo" : "passos"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inscritos:</span>
                      <span className="font-medium">
                        {workflow.stats?.currentlyEnrolled || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Concluídos:</span>
                      <span className="font-medium">
                        {workflow.stats?.completed || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trigger:</span>
                      <span className="font-medium capitalize">
                        {workflow.trigger.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <WorkflowIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum workflow encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Crie seu primeiro workflow para começar a automatizar"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/workflows/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Workflow
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </CrmLayout>
  );
}
