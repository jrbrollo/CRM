import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { CrmLayout } from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Play, Settings } from "lucide-react";
import { useWorkflow, useCreateWorkflow, useUpdateWorkflow } from "@/lib/hooks/useWorkflows";
import { useAuth } from "@/contexts/AuthContext";
import { StepConfigDialog } from "@/components/workflows/StepConfigDialog";
import type { CreateWorkflowInput, WorkflowStepType, WorkflowTriggerType, StepConfig } from "@/lib/types/workflow.types";

const nodeTypes = {
  // We could add custom node components here
};

const stepTypeOptions: { value: WorkflowStepType; label: string }[] = [
  { value: "delay", label: "Aguardar (Delay)" },
  { value: "send_email", label: "Enviar Email" },
  { value: "send_whatsapp", label: "Enviar WhatsApp" },
  { value: "create_task", label: "Criar Tarefa" },
  { value: "update_property", label: "Atualizar Propriedade" },
  { value: "branch", label: "Ramificação (If/Else)" },
  { value: "webhook", label: "Webhook" },
  { value: "add_to_list", label: "Adicionar à Lista" },
  { value: "remove_from_list", label: "Remover da Lista" },
];

const triggerTypeOptions: { value: WorkflowTriggerType; label: string }[] = [
  { value: "manual_enrollment", label: "Inscrição Manual" },
  { value: "contact_created", label: "Contato Criado" },
  { value: "contact_property_change", label: "Mudança de Propriedade do Contato" },
  { value: "deal_stage_change", label: "Mudança de Estágio do Deal" },
  { value: "form_submission", label: "Envio de Formulário" },
  { value: "email_event", label: "Evento de Email" },
  { value: "scheduled", label: "Agendado" },
];

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { userDoc } = useAuth();

  const { data: workflow } = useWorkflow(id || "");
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  // Workflow metadata
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>("manual_enrollment");

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Load workflow data when editing
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || "");
      setTriggerType(workflow.trigger.type);

      // Convert workflow steps to React Flow nodes
      const flowNodes: Node[] = workflow.steps.map((step, index) => ({
        id: step.id,
        type: "default",
        position: { x: 250, y: 100 + index * 150 },
        data: {
          label: `${stepTypeOptions.find((opt) => opt.value === step.type)?.label || step.type}`,
          stepType: step.type,
          config: step.config,
        },
      }));

      // Create edges based on step order
      const flowEdges: Edge[] = [];
      for (let i = 0; i < flowNodes.length - 1; i++) {
        flowEdges.push({
          id: `e${flowNodes[i].id}-${flowNodes[i + 1].id}`,
          source: flowNodes[i].id,
          target: flowNodes[i + 1].id,
        });
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [workflow]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addStep = (stepType: WorkflowStepType) => {
    const newNode: Node = {
      id: `step-${Date.now()}`,
      type: "default",
      position: {
        x: 250,
        y: 100 + nodes.length * 150,
      },
      data: {
        label: stepTypeOptions.find((opt) => opt.value === stepType)?.label || stepType,
        stepType,
        config: {},
      },
    };

    setNodes((nds) => [...nds, newNode]);

    // Auto-connect to previous node
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      setEdges((eds) => [
        ...eds,
        {
          id: `e${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
        },
      ]);
    }

    toast.success("Passo adicionado ao workflow");
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
    );
    setSelectedNode(null);

    toast.success("Passo removido");
  };

  const saveStepConfig = (config: StepConfig) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );

    toast.success("Configuração salva");
  };

  const handleSave = async (status: "draft" | "active" = "draft") => {
    if (!workflowName.trim()) {
      toast.error("Nome do workflow é obrigatório");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Adicione pelo menos um passo ao workflow");
      return;
    }

    if (!userDoc?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const workflowData: CreateWorkflowInput = {
        name: workflowName,
        description: workflowDescription,
        status,
        trigger: {
          type: triggerType,
          conditions: {
            operator: 'AND',
            filters: [],
          },
        },
        steps: nodes.map((node, index) => ({
          type: node.data.stepType as WorkflowStepType,
          config: node.data.config || {},
          order: index,
        })),
        enrollmentSettings: {
          allowReEnrollment: false,
          suppressForContacts: [],
        },
        createdBy: userDoc.id,
      };

      if (isEditing && id) {
        await updateWorkflow.mutateAsync({
          workflowId: id,
          data: workflowData,
        });
        toast.success("Workflow atualizado com sucesso!");
      } else {
        await createWorkflow.mutateAsync(workflowData);
        toast.success("Workflow criado com sucesso!");
        navigate("/workflows");
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error("Erro ao salvar workflow");
    }
  };

  return (
    <CrmLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/workflows")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? "Editar Workflow" : "Novo Workflow"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Arraste passos para o canvas e conecte-os para criar seu fluxo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleSave("draft")}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button onClick={() => handleSave("active")}>
                <Play className="h-4 w-4 mr-2" />
                Salvar e Ativar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Sidebar - Workflow Settings */}
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Configure seu workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow-name">Nome do Workflow</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Ex: Boas-vindas a novos leads"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflow-description">Descrição</Label>
                  <Textarea
                    id="workflow-description"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Descreva o objetivo deste workflow..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger-type">Gatilho (Trigger)</Label>
                  <Select value={triggerType} onValueChange={(value: any) => setTriggerType(value)}>
                    <SelectTrigger id="trigger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Add Steps */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Adicionar Passos</CardTitle>
                <CardDescription>Clique para adicionar ao workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stepTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addStep(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Selected Node Details */}
            {selectedNode && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Passo Selecionado</CardTitle>
                  <CardDescription>{selectedNode.data.label}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setConfigDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Passo
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={deleteSelectedNode}
                  >
                    Remover Passo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* React Flow Canvas */}
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
              <Panel position="top-center" className="bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
                <div className="text-sm font-medium">
                  {nodes.length} {nodes.length === 1 ? "passo" : "passos"} no workflow
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Step Configuration Dialog */}
        {selectedNode && (
          <StepConfigDialog
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            stepType={selectedNode.data.stepType as WorkflowStepType}
            config={selectedNode.data.config || {}}
            onSave={saveStepConfig}
          />
        )}
      </div>
    </CrmLayout>
  );
}
