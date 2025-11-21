/**
 * Custom Workflow Nodes
 *
 * Professional custom nodes using shadcn/ui Cards with proper handles for React Flow.
 * Each node type has specific handle configurations for workflow logic.
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Mail,
  Clock,
  GitBranch,
  CheckCircle2,
  Zap,
  Bell,
  Phone,
  Webhook,
  UserPlus,
  FileText,
  Target,
  ArrowRight,
  Activity
} from 'lucide-react';
import type { WorkflowStepType } from '@/lib/types/workflow.types';

// Node data interface
export interface WorkflowNodeData {
  label: string;
  stepType: WorkflowStepType;
  config?: any;
}

// Icon mapping for each step type
const getIconForStepType = (stepType: WorkflowStepType) => {
  const iconMap: Record<WorkflowStepType, any> = {
    // Deal Actions
    assign_round_robin: UserPlus,
    create_deal: FileText,
    update_deal: FileText,
    move_deal_stage: ArrowRight,

    // Task Actions
    create_task: CheckCircle2,
    complete_task: CheckCircle2,

    // Notification Actions
    send_notification: Bell,
    send_email: Mail,
    send_whatsapp: Phone,

    // Tracking Actions
    increment_counter: Target,
    track_sla_violation: Activity,
    log_activity: Activity,

    // Control Actions
    wait: Clock,
    conditional: GitBranch,

    // Integration
    webhook: Webhook,
  } as any;

  return iconMap[stepType] || Zap;
};

// Color mapping for each step type category
const getColorForStepType = (stepType: WorkflowStepType) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    // Deal Actions
    assign_round_robin: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    create_deal: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    update_deal: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    move_deal_stage: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },

    // Task Actions
    create_task: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    complete_task: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },

    // Notification Actions
    send_notification: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    send_email: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    send_whatsapp: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },

    // Tracking Actions
    increment_counter: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    track_sla_violation: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    log_activity: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },

    // Control Actions
    wait: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    conditional: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },

    // Integration
    webhook: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  };

  return colorMap[stepType] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
};

/**
 * Trigger Node - Only has output handle (source)
 * Used as the starting point of the workflow
 */
export const TriggerNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const Icon = Play;
  const colors = { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };

  return (
    <div className="relative">
      <Card
        className={`min-w-[220px] transition-all cursor-pointer shadow-md ${
          selected
            ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
            : 'hover:shadow-lg'
        }`}
      >
        <CardContent className={`p-4 ${colors.bg} ${colors.border} border-2 rounded-lg`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colors.text} bg-white/60`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-medium">
                  Gatilho
                </Badge>
                {hasConfig && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>
              <div className="font-semibold text-sm leading-tight">{data.label}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Handle (Bottom) - Only output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-emerald-500 border-2 border-white"
        isConnectable={true}
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

/**
 * Action Node - Has 1 input and 1 output
 * Used for actions like send email, create task, etc.
 */
export const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const Icon = getIconForStepType(data.stepType);
  const colors = getColorForStepType(data.stepType);

  return (
    <div className="relative">
      {/* Target Handle (Top) - Input */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />

      <Card
        className={`min-w-[220px] transition-all cursor-pointer shadow-md ${
          selected
            ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
            : 'hover:shadow-lg'
        }`}
      >
        <CardContent className={`p-4 ${colors.bg} ${colors.border} border-2 rounded-lg`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colors.text} bg-white/60`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-medium">
                  Ação
                </Badge>
                {hasConfig && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>
              <div className="font-semibold text-sm leading-tight">{data.label}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Handle (Bottom) - Output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

/**
 * Delay Node - Has 1 input and 1 output
 * Used for wait/delay actions
 */
export const DelayNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const Icon = Clock;
  const colors = { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };

  // Extract delay information from config
  const getDelayText = () => {
    if (!data.config) return '';
    const { delayMinutes, delayHours, delayDays } = data.config;
    if (delayDays) return `${delayDays} dia(s)`;
    if (delayHours) return `${delayHours} hora(s)`;
    if (delayMinutes) return `${delayMinutes} min`;
    return '';
  };

  const delayText = getDelayText();

  return (
    <div className="relative">
      {/* Target Handle (Top) - Input */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />

      <Card
        className={`min-w-[220px] transition-all cursor-pointer shadow-md ${
          selected
            ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
            : 'hover:shadow-lg'
        }`}
      >
        <CardContent className={`p-4 ${colors.bg} ${colors.border} border-2 rounded-lg`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colors.text} bg-white/60`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-medium">
                  Delay
                </Badge>
                {hasConfig && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>
              <div className="font-semibold text-sm leading-tight">{data.label}</div>
              {delayText && (
                <div className="text-xs text-muted-foreground mt-1">{delayText}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Handle (Bottom) - Output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';

/**
 * Condition Node - Has 1 input and 2 outputs (true/false)
 * CRITICAL: This is the most important node - it must have 2 separate source handles
 */
export const ConditionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const Icon = GitBranch;
  const colors = { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' };

  return (
    <div className="relative">
      {/* Target Handle (Top) - Input */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        isConnectable={true}
      />

      <Card
        className={`min-w-[260px] transition-all cursor-pointer shadow-md ${
          selected
            ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
            : 'hover:shadow-lg'
        }`}
      >
        <CardContent className={`p-4 ${colors.bg} ${colors.border} border-2 rounded-lg`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg ${colors.text} bg-white/60`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-medium">
                  Condição
                </Badge>
                {hasConfig && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>
              <div className="font-semibold text-sm leading-tight">{data.label}</div>
            </div>
          </div>

          {/* Two output indicators */}
          <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-pink-200">
            <div className="text-green-700">
              Sim
            </div>
            <div className="text-red-700">
              Não
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRITICAL: Two source handles at the bottom */}
      {/* Left side - True/Yes path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
        isConnectable={true}
      />

      {/* Right side - False/No path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
        isConnectable={true}
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

/**
 * Node type mapping
 * This object is used by React Flow to map node types to components
 */
export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
  condition: ConditionNode,
};

/**
 * Helper function to determine which node component to use based on step type
 */
export const getNodeTypeForStep = (stepType: WorkflowStepType): keyof typeof nodeTypes => {
  if (stepType === 'wait') return 'delay';
  if (stepType === 'conditional') return 'condition';

  // Default to action for all other types
  return 'action';
};
