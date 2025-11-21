/**
 * Workflow Builder - Visual Flow Editor
 *
 * Enterprise-grade workflow builder using React Flow and shadcn/ui.
 * Features:
 * - Drag-and-drop interface
 * - Custom nodes with proper handles
 * - Condition nodes with dual outputs (true/false)
 * - Backend conversion with validation
 * - Professional UX similar to HubSpot/Zapier
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/styles/workflow-builder.css';

import { CrmLayout } from '@/components/CrmLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Play, Trash2, AlertCircle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkflow, useCreateWorkflow, useUpdateWorkflow } from '@/lib/hooks/useWorkflows';
import { useWorkflowStore } from '@/lib/stores/useWorkflowStore';
import { nodeTypes, getNodeTypeForStep } from '@/components/workflows/CustomNodes';
import { WorkflowSidebar } from '@/components/workflows/WorkflowSidebar';
import { StepConfigDialog } from '@/components/workflows/StepConfigDialog';
import {
  validateWorkflow,
  convertFlowToBackend,
  findTriggerNodeId,
  convertBackendToFlow,
} from '@/lib/utils/workflowConverter';

import type {
  CreateWorkflowInput,
  WorkflowTriggerType,
  WorkflowStepType,
  StepConfig,
} from '@/lib/types/workflow.types';

const triggerTypeOptions: { value: WorkflowTriggerType; label: string }[] = [
  { value: 'deal_created', label: 'Deal Criado' },
  { value: 'deal_updated', label: 'Deal Atualizado' },
  { value: 'deal_stage_changed', label: 'Mudança de Etapa do Deal' },
  { value: 'deal_won', label: 'Deal Ganho' },
  { value: 'deal_lost', label: 'Deal Perdido' },
  { value: 'deal_stale', label: 'Deal Inativo (Stale)' },
  { value: 'task_created', label: 'Tarefa Criada' },
  { value: 'task_completed', label: 'Tarefa Completada' },
  { value: 'task_overdue', label: 'Tarefa Atrasada' },
  { value: 'task_not_completed', label: 'Tarefa Não Completada (SLA)' },
  { value: 'scheduled', label: 'Agendado (Horário Fixo)' },
  { value: 'recurring', label: 'Recorrente (Periódico)' },
  { value: 'manual', label: 'Manual' },
];

function WorkflowBuilderContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { userDoc } = useAuth();
  const reactFlowInstance = useReactFlow();

  // Workflow metadata
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>('deal_created');

  // UI state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Zustand store
  const {
    nodes,
    edges,
    selectedNodeId,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    updateNodeConfig,
    deleteNode,
    getSelectedNode,
  } = useWorkflowStore();

  // API hooks
  const { data: workflow } = useWorkflow(id || '');
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Load existing workflow data
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      setTriggerType(workflow.trigger.type);

      // Convert backend format to React Flow format
      // For now, use simple sequential layout (TODO: improve with graph conversion)
      const flowNodes = workflow.steps.map((step, index) => ({
        id: step.id,
        type: getNodeTypeForStep(step.type),
        position: { x: 250, y: 100 + index * 150 },
        data: {
          label: step.type,
          stepType: step.type,
          config: step.config,
        },
      }));

      const flowEdges = [];
      for (let i = 0; i < flowNodes.length - 1; i++) {
        flowEdges.push({
          id: `e${flowNodes[i].id}-${flowNodes[i + 1].id}`,
          source: flowNodes[i].id,
          target: flowNodes[i + 1].id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        });
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [workflow, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: any, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  // Handle drag over (required for drop to work)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');

      if (!data || !reactFlowBounds) return;

      const { type, label } = JSON.parse(data);

      // Convert screen coordinates to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create new node
      const newNodeId = `node-${Date.now()}`;
      const nodeType = getNodeTypeForStep(type as WorkflowStepType);

      const newNode = {
        id: newNodeId,
        type: nodeType,
        position,
        data: {
          label,
          stepType: type,
          config: {},
        },
      };

      setNodes([...nodes, newNode]);
      setSelectedNodeId(newNodeId);

      toast.success(`${label} adicionado - clique para configurar`);
    },
    [reactFlowInstance, nodes, setNodes, setSelectedNodeId]
  );

  // Save step configuration
  const handleSaveConfig = (config: StepConfig) => {
    if (selectedNodeId) {
      updateNodeConfig(selectedNodeId, config);
      setConfigDialogOpen(false);
      toast.success('Configuração salva');
    }
  };

  // Delete selected node
  const handleDeleteNode = () => {
    if (selectedNodeId) {
      const node = getSelectedNode();
      deleteNode(selectedNodeId);
      toast.success(`${node?.data.label || 'Nó'} removido`);
    }
  };

  // Validate and save workflow
  const handleSave = async (status: 'draft' | 'active' = 'draft') => {
    // Basic validation
    if (!workflowName.trim()) {
      toast.error('Nome do workflow é obrigatório');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Adicione pelo menos um nó ao workflow');
      return;
    }

    if (!userDoc?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validate workflow structure
    const validation = validateWorkflow(nodes, edges);

    if (!validation.isValid) {
      setValidationErrors(validation.errors.map((e) => e.message));
      setValidationDialogOpen(true);
      return;
    }

    try {
      // Convert to backend format
      const backendNodes = convertFlowToBackend(nodes, edges);
      const triggerNodeId = findTriggerNodeId(nodes);

      if (!triggerNodeId) {
        toast.error('Workflow deve ter um nó Gatilho');
        return;
      }

      // For now, convert to simple steps array (TODO: use graph format)
      // This is a simplified conversion - the backend will need to be updated
      // to accept the graph format with nextId/trueNextId/falseNextId
      const steps = nodes
        .filter((n) => n.type !== 'trigger')
        .map((node, index) => ({
          type: node.data.stepType as WorkflowStepType,
          config: node.data.config || {},
          order: index,
        }));

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
        steps,
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
        toast.success('Workflow atualizado com sucesso!');
      } else {
        await createWorkflow.mutateAsync(workflowData);
        toast.success('Workflow criado com sucesso!');
        navigate('/workflows');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Erro ao salvar workflow');
    }
  };

  const selectedNode = getSelectedNode();

  return (
    <CrmLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? 'Editar Workflow' : 'Novo Workflow'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Arraste componentes da sidebar e conecte-os para criar seu fluxo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleSave('draft')}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button onClick={() => handleSave('active')}>
                <Play className="h-4 w-4 mr-2" />
                Salvar e Ativar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Components */}
          <WorkflowSidebar />

          {/* Canvas */}
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
              <Panel position="top-center" className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm">
                <div className="text-sm font-medium">
                  {nodes.length} {nodes.length === 1 ? 'nó' : 'nós'} no workflow
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Propriedades do workflow</CardDescription>
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
                  <Select
                    value={triggerType}
                    onValueChange={(value: any) => setTriggerType(value)}
                  >
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

            {/* Selected Node Card */}
            {selectedNode && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Nó Selecionado</CardTitle>
                  <CardDescription>{selectedNode.data.label}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setConfigDialogOpen(true)}
                  >
                    Configurar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteNode}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Configuration Dialog */}
        {selectedNode && (
          <StepConfigDialog
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            stepType={selectedNode.data.stepType as WorkflowStepType}
            config={selectedNode.data.config || {}}
            onSave={handleSaveConfig}
          />
        )}

        {/* Validation Error Dialog */}
        <AlertDialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Erros de Validação
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>Corrija os seguintes problemas antes de salvar:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setValidationDialogOpen(false)}>
                Entendi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CrmLayout>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
