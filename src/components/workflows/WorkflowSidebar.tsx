/**
 * Workflow Sidebar
 *
 * Sidebar containing draggable node types that can be dropped onto the canvas.
 * Organized by category for better UX.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Clock,
  GitBranch,
  CheckCircle2,
  Bell,
  Phone,
  Webhook,
  UserPlus,
  FileText,
  Target,
  ArrowRight,
  Activity,
  Play,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { WorkflowStepType } from '@/lib/types/workflow.types';
import { cn } from '@/lib/utils';

interface NodeTemplate {
  type: WorkflowStepType;
  label: string;
  description: string;
  icon: any;
  category: string;
}

const nodeTemplates: NodeTemplate[] = [
  // Gatilho (special - only one allowed)
  {
    type: 'wait', // We'll use a special type for trigger
    label: 'Gatilho',
    description: 'Inicia o workflow',
    icon: Play,
    category: 'Início',
  },

  // Deal Actions
  {
    type: 'assign_round_robin',
    label: 'Atribuir Deal (Round-Robin)',
    description: 'Distribui automaticamente',
    icon: UserPlus,
    category: 'Deal',
  },
  {
    type: 'create_deal',
    label: 'Criar Novo Deal',
    description: 'Cria deal em outro funil',
    icon: FileText,
    category: 'Deal',
  },
  {
    type: 'update_deal',
    label: 'Atualizar Deal',
    description: 'Modifica campos do deal',
    icon: FileText,
    category: 'Deal',
  },
  {
    type: 'move_deal_stage',
    label: 'Mover para Etapa',
    description: 'Move deal para outra etapa',
    icon: ArrowRight,
    category: 'Deal',
  },

  // Task Actions
  {
    type: 'create_task',
    label: 'Criar Tarefa',
    description: 'Adiciona tarefa ao deal',
    icon: CheckCircle2,
    category: 'Tarefa',
  },
  {
    type: 'complete_task',
    label: 'Completar Tarefa',
    description: 'Marca tarefa como completa',
    icon: CheckCircle2,
    category: 'Tarefa',
  },

  // Communication Actions
  {
    type: 'send_email',
    label: 'Enviar Email',
    description: 'Envia email personalizado',
    icon: Mail,
    category: 'Comunicação',
  },
  {
    type: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    description: 'Envia mensagem via WhatsApp',
    icon: Phone,
    category: 'Comunicação',
  },
  {
    type: 'send_notification',
    label: 'Enviar Notificação',
    description: 'Notifica usuário no sistema',
    icon: Bell,
    category: 'Comunicação',
  },

  // Tracking Actions
  {
    type: 'increment_counter',
    label: 'Incrementar Contador',
    description: 'Aumenta valor de campo',
    icon: Target,
    category: 'Rastreamento',
  },
  {
    type: 'track_sla_violation',
    label: 'Registrar Violação de SLA',
    description: 'Marca violação de SLA',
    icon: Activity,
    category: 'Rastreamento',
  },
  {
    type: 'log_activity',
    label: 'Registrar Atividade',
    description: 'Adiciona log de atividade',
    icon: Activity,
    category: 'Rastreamento',
  },

  // Control Actions
  {
    type: 'wait',
    label: 'Aguardar (Delay)',
    description: 'Pausa antes do próximo passo',
    icon: Clock,
    category: 'Controle',
  },
  {
    type: 'conditional',
    label: 'Condição (If/Else)',
    description: 'Divide em dois caminhos',
    icon: GitBranch,
    category: 'Controle',
  },

  // Integration
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'Chama API externa',
    icon: Webhook,
    category: 'Integração',
  },
];

export function WorkflowSidebar() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Início', 'Deal', 'Comunicação', 'Controle'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Organize templates by category
  const categories = Array.from(new Set(nodeTemplates.map((t) => t.category)));

  const onDragStart = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: nodeTemplate.type,
        label: nodeTemplate.label,
      })
    );
  };

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Componentes</h2>
        <p className="text-sm text-muted-foreground">
          Arraste para o canvas
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {categories.map((category) => {
            const categoryTemplates = nodeTemplates.filter((t) => t.category === category);
            const isExpanded = expandedCategories.has(category);

            return (
              <Card key={category}>
                <CardHeader
                  className="cursor-pointer py-3 px-4"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {categoryTemplates.length}
                    </Badge>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-2">
                    {categoryTemplates.map((template) => {
                      const Icon = template.icon;

                      return (
                        <div
                          key={template.type + template.label}
                          draggable
                          onDragStart={(e) => onDragStart(e, template)}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border-2 border-dashed',
                            'cursor-grab active:cursor-grabbing',
                            'hover:bg-accent hover:border-primary/50',
                            'transition-all duration-200'
                          )}
                        >
                          <div className="p-1.5 rounded bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight mb-0.5">
                              {template.label}
                            </div>
                            <div className="text-xs text-muted-foreground leading-tight">
                              {template.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Instructions */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>1. Arraste componentes para o canvas</p>
              <p>2. Conecte os nós criando linhas entre eles</p>
              <p>3. Clique em um nó para configurá-lo</p>
              <p>4. Salve quando terminar</p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
