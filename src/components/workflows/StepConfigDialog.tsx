/**
 * Step Configuration Dialog
 *
 * Dialog for configuring individual workflow step parameters.
 * Supports different configuration forms based on step type.
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type {
  WorkflowStepType,
  DelayConfig,
  EmailConfig,
  TaskConfig,
  UpdatePropertyConfig,
  StepConfig,
} from '@/lib/types/workflow.types';
import { usePipelines } from '@/lib/hooks/usePipelines';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTeams } from '@/lib/hooks/useTeams';

// Schemas for different step types
const waitConfigSchema = z.object({
  delayMinutes: z.number().min(1).optional(),
  delayHours: z.number().min(1).optional(),
  delayDays: z.number().min(1).optional(),
});

const emailConfigSchema = z.object({
  emailSubject: z.string().min(1, 'Assunto é obrigatório'),
  emailBody: z.string().min(1, 'Conteúdo do email é obrigatório'),
  fromName: z.string().optional(),
  replyTo: z.string().email('Email inválido').optional().or(z.literal('')),
});

const taskConfigSchema = z.object({
  taskTitle: z.string().min(1, 'Título da tarefa é obrigatório'),
  taskDescription: z.string().optional(),
  taskType: z.enum(['call', 'email', 'meeting', 'follow_up', 'document', 'review', 'other']).optional(),
  taskPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  taskDueInMinutes: z.number().min(1).optional(),
  taskDueInHours: z.number().min(1).optional(),
  taskDueInDays: z.number().min(1).optional(),
  assignToUserId: z.string().optional(),
});

const whatsappConfigSchema = z.object({
  whatsappMessage: z.string().min(1, 'Mensagem é obrigatória').max(1000),
});

const webhookConfigSchema = z.object({
  webhookUrl: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
  webhookMethod: z.enum(['GET', 'POST']),
  webhookBody: z.string().optional(),
});

const assignRoundRobinConfigSchema = z.object({
  assignToTeamId: z.string().optional(),
});

const createDealConfigSchema = z.object({
  dealTitle: z.string().min(1, 'Título é obrigatório'),
  dealPipelineId: z.string().min(1, 'Pipeline é obrigatório'),
  dealStageId: z.string().min(1, 'Etapa é obrigatória'),
  dealValue: z.number().min(0).optional(),
  linkDeals: z.boolean().optional(),
  copyFields: z.boolean().optional(),
});

const updateDealConfigSchema = z.object({
  updateFields: z.string().min(1, 'Campos a atualizar (JSON) é obrigatório'),
});

const moveDealStageConfigSchema = z.object({
  targetStageId: z.string().min(1, 'Etapa de destino é obrigatória'),
});

const sendNotificationConfigSchema = z.object({
  notificationTitle: z.string().min(1, 'Título é obrigatório'),
  notificationMessage: z.string().min(1, 'Mensagem é obrigatória'),
  notificationType: z.enum(['task_assigned', 'task_overdue', 'deal_assigned', 'deal_won', 'deal_lost', 'sla_violation', 'team_alert', 'workflow_executed']).optional(),
  notificationPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notifyUserId: z.string().optional(),
  notifyTeamLeader: z.boolean().optional(),
});

const incrementCounterConfigSchema = z.object({
  counterField: z.string().min(1, 'Campo contador é obrigatório'),
  incrementBy: z.number().min(1).optional(),
});

const trackSLAViolationConfigSchema = z.object({
  violationType: z.string().optional(),
  notifyLeader: z.boolean().optional(),
});

const logActivityConfigSchema = z.object({
  activityType: z.string().min(1, 'Tipo de atividade é obrigatório'),
  activityNotes: z.string().optional(),
});

const conditionalConfigSchema = z.object({
  field: z.string().min(1, 'Campo é obrigatório'),
  operator: z.string().min(1, 'Operador é obrigatório'),
  value: z.any().optional(),
});

interface StepConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepType: WorkflowStepType;
  config: StepConfig;
  onSave: (config: StepConfig) => void;
}

export function StepConfigDialog({
  open,
  onOpenChange,
  stepType,
  config,
  onSave,
}: StepConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  // Fetch real data for selects
  const { data: pipelines = [] } = usePipelines();
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useTeams();

  // Get stages from selected pipeline
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const availableStages = selectedPipeline?.stages || [];

  // Determine which schema to use
  const getSchema = () => {
    switch (stepType) {
      case 'wait':
        return waitConfigSchema;
      case 'send_email':
        return emailConfigSchema;
      case 'send_whatsapp':
        return whatsappConfigSchema;
      case 'create_task':
        return taskConfigSchema;
      case 'webhook':
        return webhookConfigSchema;
      case 'assign_round_robin':
        return assignRoundRobinConfigSchema;
      case 'create_deal':
        return createDealConfigSchema;
      case 'update_deal':
        return updateDealConfigSchema;
      case 'move_deal_stage':
        return moveDealStageConfigSchema;
      case 'send_notification':
        return sendNotificationConfigSchema;
      case 'increment_counter':
        return incrementCounterConfigSchema;
      case 'track_sla_violation':
        return trackSLAViolationConfigSchema;
      case 'log_activity':
        return logActivityConfigSchema;
      case 'conditional':
        return conditionalConfigSchema;
      default:
        return z.object({});
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: config,
  });

  useEffect(() => {
    reset(config);
  }, [config, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      onSave(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWaitConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Configure quanto tempo aguardar antes do próximo passo. Preencha apenas um dos campos.
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="delayMinutes">Minutos</Label>
          <Input
            id="delayMinutes"
            type="number"
            min="1"
            placeholder="Ex: 30"
            {...register('delayMinutes', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delayHours">Horas</Label>
          <Input
            id="delayHours"
            type="number"
            min="1"
            placeholder="Ex: 24"
            {...register('delayHours', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delayDays">Dias</Label>
          <Input
            id="delayDays"
            type="number"
            min="1"
            placeholder="Ex: 7"
            {...register('delayDays', { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  );

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="emailSubject">
          Assunto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="emailSubject"
          placeholder="Ex: Bem-vindo à nossa plataforma!"
          {...register('emailSubject')}
        />
        {errors.emailSubject && (
          <p className="text-sm text-destructive">{errors.emailSubject.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailBody">
          Conteúdo do Email <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="emailBody"
          placeholder="Digite o conteúdo do email..."
          rows={6}
          {...register('emailBody')}
        />
        {errors.emailBody && (
          <p className="text-sm text-destructive">{errors.emailBody.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromName">Nome do Remetente</Label>
          <Input id="fromName" placeholder="Ex: Equipe de Vendas" {...register('fromName')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="replyTo">Email de Resposta</Label>
          <Input
            id="replyTo"
            type="email"
            placeholder="Ex: vendas@empresa.com"
            {...register('replyTo')}
          />
          {errors.replyTo && (
            <p className="text-sm text-destructive">{errors.replyTo.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderTaskConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="taskTitle">
          Título da Tarefa <span className="text-destructive">*</span>
        </Label>
        <Input
          id="taskTitle"
          placeholder="Ex: Primeiro Contato"
          {...register('taskTitle')}
        />
        {errors.taskTitle && (
          <p className="text-sm text-destructive">{errors.taskTitle.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="taskDescription">Descrição</Label>
        <Textarea
          id="taskDescription"
          placeholder="Descreva a tarefa..."
          rows={3}
          {...register('taskDescription')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taskType">Tipo</Label>
          <Select
            value={watch('taskType') || 'call'}
            onValueChange={(value: any) => setValue('taskType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Ligação</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="document">Documento</SelectItem>
              <SelectItem value="review">Revisão</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="taskPriority">Prioridade</Label>
          <Select
            value={watch('taskPriority') || 'medium'}
            onValueChange={(value: any) => setValue('taskPriority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Prazo (preencha apenas um)</Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taskDueInMinutes" className="text-xs">Minutos</Label>
            <Input
              id="taskDueInMinutes"
              type="number"
              min="1"
              placeholder="30"
              {...register('taskDueInMinutes', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskDueInHours" className="text-xs">Horas</Label>
            <Input
              id="taskDueInHours"
              type="number"
              min="1"
              placeholder="24"
              {...register('taskDueInHours', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskDueInDays" className="text-xs">Dias</Label>
            <Input
              id="taskDueInDays"
              type="number"
              min="1"
              placeholder="7"
              {...register('taskDueInDays', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignToUserId">Atribuir para (opcional)</Label>
        <Controller
          name="assignToUserId"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger id="assignToUserId">
                <SelectValue placeholder="Dono do deal (padrão)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Dono do deal (padrão)</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Se vazio, será atribuído automaticamente ao dono do deal
        </p>
      </div>
    </div>
  );

  const renderAssignRoundRobinConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Atribui o deal para o próximo planejador disponível usando round-robin.
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignToTeamId">Time (opcional)</Label>
        <Controller
          name="assignToTeamId"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger id="assignToTeamId">
                <SelectValue placeholder="Time padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Time padrão</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Se vazio, usará o time padrão da empresa
        </p>
      </div>
    </div>
  );

  const renderCreateDealConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Cria um novo deal em outro funil (usado para transições entre funis).
      </div>
      <div className="space-y-2">
        <Label htmlFor="dealTitle">
          Título do Deal <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dealTitle"
          placeholder="Ex: {'{'}contactName{'}'} - Venda"
          {...register('dealTitle')}
        />
        {errors.dealTitle && (
          <p className="text-sm text-destructive">{errors.dealTitle.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dealPipelineId">
            Pipeline <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="dealPipelineId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ''}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedPipelineId(value);
                }}
              >
                <SelectTrigger id="dealPipelineId">
                  <SelectValue placeholder="Selecione o pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.dealPipelineId && (
            <p className="text-sm text-destructive">{errors.dealPipelineId.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dealStageId">
            Etapa Inicial <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="dealStageId"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger id="dealStageId">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.dealStageId && (
            <p className="text-sm text-destructive">{errors.dealStageId.message as string}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dealValue">Valor Estimado (opcional)</Label>
        <Input
          id="dealValue"
          type="number"
          min="0"
          placeholder="Ex: 50000"
          {...register('dealValue', { valueAsNumber: true })}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <input
            id="linkDeals"
            type="checkbox"
            {...register('linkDeals')}
            className="rounded border-gray-300"
          />
          <Label htmlFor="linkDeals" className="text-sm font-normal">
            Vincular deals (previousDealId/nextDealId)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="copyFields"
            type="checkbox"
            {...register('copyFields')}
            className="rounded border-gray-300"
          />
          <Label htmlFor="copyFields" className="text-sm font-normal">
            Copiar campos do deal anterior
          </Label>
        </div>
      </div>
    </div>
  );

  const renderUpdateDealConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Atualiza campos do deal. Use JSON válido com os campos a atualizar.
      </div>
      <div className="space-y-2">
        <Label htmlFor="updateFields">
          Campos (JSON) <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="updateFields"
          placeholder={'{"contactAttempts": 1, "lastContactAttemptAt": "now"}'}
          rows={6}
          {...register('updateFields')}
        />
        {errors.updateFields && (
          <p className="text-sm text-destructive">{errors.updateFields.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Exemplo: {'{'}\"contactAttempts\": 1, \"isStale\": false{'}'}
        </p>
      </div>
    </div>
  );

  const renderMoveDealStageConfig = () => {
    // Get all stages from all pipelines
    const allStages = pipelines.flatMap(pipeline =>
      pipeline.stages.map(stage => ({
        ...stage,
        pipelineName: pipeline.name,
      }))
    );

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Move o deal para outra etapa do mesmo funil.
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetStageId">
            Etapa de Destino <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="targetStageId"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger id="targetStageId">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {allStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.pipelineName} → {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.targetStageId && (
            <p className="text-sm text-destructive">{errors.targetStageId.message as string}</p>
          )}
        </div>
      </div>
    );
  };

  const renderSendNotificationConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notificationTitle">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="notificationTitle"
          placeholder="Ex: Novo lead atribuído"
          {...register('notificationTitle')}
        />
        {errors.notificationTitle && (
          <p className="text-sm text-destructive">{errors.notificationTitle.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notificationMessage">
          Mensagem <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="notificationMessage"
          placeholder="Ex: Você recebeu um novo lead: {contactName}"
          rows={4}
          {...register('notificationMessage')}
        />
        {errors.notificationMessage && (
          <p className="text-sm text-destructive">{errors.notificationMessage.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="notificationType">Tipo</Label>
          <Select
            value={watch('notificationType') || 'workflow_executed'}
            onValueChange={(value: any) => setValue('notificationType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task_assigned">Tarefa Atribuída</SelectItem>
              <SelectItem value="task_overdue">Tarefa Atrasada</SelectItem>
              <SelectItem value="deal_assigned">Deal Atribuído</SelectItem>
              <SelectItem value="deal_won">Deal Ganho</SelectItem>
              <SelectItem value="deal_lost">Deal Perdido</SelectItem>
              <SelectItem value="sla_violation">Violação de SLA</SelectItem>
              <SelectItem value="team_alert">Alerta de Equipe</SelectItem>
              <SelectItem value="workflow_executed">Workflow Executado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notificationPriority">Prioridade</Label>
          <Select
            value={watch('notificationPriority') || 'medium'}
            onValueChange={(value: any) => setValue('notificationPriority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notifyUserId">Notificar Usuário (opcional)</Label>
        <Controller
          name="notifyUserId"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger id="notifyUserId">
                <SelectValue placeholder="Dono do deal (padrão)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Dono do deal (padrão)</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="notifyTeamLeader"
          type="checkbox"
          {...register('notifyTeamLeader')}
          className="rounded border-gray-300"
        />
        <Label htmlFor="notifyTeamLeader" className="text-sm font-normal">
          Também notificar o líder da equipe
        </Label>
      </div>
    </div>
  );

  const renderIncrementCounterConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Incrementa um campo contador do deal (ex: contactAttempts).
      </div>
      <div className="space-y-2">
        <Label htmlFor="counterField">
          Campo Contador <span className="text-destructive">*</span>
        </Label>
        <Input
          id="counterField"
          placeholder="Ex: contactAttempts"
          {...register('counterField')}
        />
        {errors.counterField && (
          <p className="text-sm text-destructive">{errors.counterField.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Campos disponíveis: contactAttempts, slaViolations
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="incrementBy">Incrementar por (opcional)</Label>
        <Input
          id="incrementBy"
          type="number"
          min="1"
          placeholder="1"
          {...register('incrementBy', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Padrão: 1
        </p>
      </div>
    </div>
  );

  const renderTrackSLAViolationConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Registra uma violação de SLA no deal e no perfil do planejador.
      </div>
      <div className="space-y-2">
        <Label htmlFor="violationType">Tipo de Violação (opcional)</Label>
        <Input
          id="violationType"
          placeholder="Ex: Tarefa não completada no prazo"
          {...register('violationType')}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="notifyLeader"
          type="checkbox"
          {...register('notifyLeader')}
          className="rounded border-gray-300"
        />
        <Label htmlFor="notifyLeader" className="text-sm font-normal">
          Notificar líder da equipe
        </Label>
      </div>
    </div>
  );

  const renderLogActivityConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Registra uma atividade no histórico do deal.
      </div>
      <div className="space-y-2">
        <Label htmlFor="activityType">
          Tipo de Atividade <span className="text-destructive">*</span>
        </Label>
        <Input
          id="activityType"
          placeholder="Ex: email_sent, call_made, meeting_scheduled"
          {...register('activityType')}
        />
        {errors.activityType && (
          <p className="text-sm text-destructive">{errors.activityType.message as string}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="activityNotes">Notas (opcional)</Label>
        <Textarea
          id="activityNotes"
          placeholder="Detalhes da atividade..."
          rows={3}
          {...register('activityNotes')}
        />
      </div>
    </div>
  );

  const renderConditionalConfig = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
          Como Funciona
        </h4>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Este nó avalia uma condição e segue por um dos dois caminhos:
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
          <li><strong>Sim (Verde):</strong> Se a condição for verdadeira</li>
          <li><strong>Não (Vermelho):</strong> Se a condição for falsa</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field">
          Campo para Avaliar <span className="text-destructive">*</span>
        </Label>
        <Input
          id="field"
          placeholder="Ex: value, status, contactAttempts"
          {...register('field')}
        />
        {errors.field && (
          <p className="text-sm text-destructive">{errors.field.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Nome do campo do deal a ser avaliado
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="operator">
          Operador <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('operator') || 'equals'}
          onValueChange={(value: any) => setValue('operator', value)}
        >
          <SelectTrigger id="operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">É igual a (=)</SelectItem>
            <SelectItem value="not_equals">É diferente de (≠)</SelectItem>
            <SelectItem value="greater_than">É maior que (&gt;)</SelectItem>
            <SelectItem value="less_than">É menor que (&lt;)</SelectItem>
            <SelectItem value="greater_than_or_equal">É maior ou igual a (≥)</SelectItem>
            <SelectItem value="less_than_or_equal">É menor ou igual a (≤)</SelectItem>
            <SelectItem value="contains">Contém</SelectItem>
            <SelectItem value="not_contains">Não contém</SelectItem>
            <SelectItem value="is_empty">Está vazio</SelectItem>
            <SelectItem value="is_not_empty">Não está vazio</SelectItem>
            <SelectItem value="starts_with">Começa com</SelectItem>
            <SelectItem value="ends_with">Termina com</SelectItem>
          </SelectContent>
        </Select>
        {errors.operator && (
          <p className="text-sm text-destructive">{errors.operator.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Valor para Comparar</Label>
        <Input
          id="value"
          placeholder="Ex: won, 5000, approved"
          {...register('value')}
        />
        {errors.value && (
          <p className="text-sm text-destructive">{errors.value.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Deixe vazio para operadores "está vazio" e "não está vazio"
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>Exemplo:</strong> Campo: <code>value</code>, Operador: <code>maior que</code>, Valor: <code>5000</code>
          <br />
          Resultado: Segue caminho "Sim" se valor do deal for maior que 5000
        </p>
      </div>
    </div>
  );

  const renderWhatsAppConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="whatsappMessage">
          Mensagem WhatsApp <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="whatsappMessage"
          placeholder="Digite a mensagem que será enviada via WhatsApp..."
          rows={6}
          {...register('whatsappMessage')}
        />
        {errors.whatsappMessage && (
          <p className="text-sm text-destructive">{errors.whatsappMessage.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Máximo: 1000 caracteres. Variáveis disponíveis: {'{'}nome{'}'}, {'{'}empresa{'}'}
        </p>
      </div>
    </div>
  );

  const renderWebhookConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhookUrl">
          URL do Webhook <span className="text-destructive">*</span>
        </Label>
        <Input
          id="webhookUrl"
          type="url"
          placeholder="https://api.exemplo.com/webhook"
          {...register('webhookUrl')}
        />
        {errors.webhookUrl && (
          <p className="text-sm text-destructive">{errors.webhookUrl.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookMethod">Método HTTP</Label>
        <Select
          value={watch('webhookMethod') || 'POST'}
          onValueChange={(value: any) => setValue('webhookMethod', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookBody">Body (JSON) - Opcional</Label>
        <Textarea
          id="webhookBody"
          placeholder='{"key": "value"}'
          rows={4}
          {...register('webhookBody')}
        />
        <p className="text-xs text-muted-foreground">
          Deixe vazio para GET. Para POST, use JSON válido.
        </p>
      </div>
    </div>
  );

  const renderConfigForm = () => {
    switch (stepType) {
      case 'wait':
        return renderWaitConfig();
      case 'send_email':
        return renderEmailConfig();
      case 'send_whatsapp':
        return renderWhatsAppConfig();
      case 'create_task':
        return renderTaskConfig();
      case 'webhook':
        return renderWebhookConfig();
      case 'assign_round_robin':
        return renderAssignRoundRobinConfig();
      case 'create_deal':
        return renderCreateDealConfig();
      case 'update_deal':
        return renderUpdateDealConfig();
      case 'move_deal_stage':
        return renderMoveDealStageConfig();
      case 'send_notification':
        return renderSendNotificationConfig();
      case 'increment_counter':
        return renderIncrementCounterConfig();
      case 'track_sla_violation':
        return renderTrackSLAViolationConfig();
      case 'log_activity':
        return renderLogActivityConfig();
      case 'conditional':
        return renderConditionalConfig();
      case 'complete_task':
        return (
          <div className="text-center py-6 text-muted-foreground">
            Este passo não requer configuração adicional.
          </div>
        );
      default:
        return (
          <div className="text-center py-6 text-muted-foreground">
            Configuração não disponível para este tipo de passo.
            <br />
            As configurações serão adicionadas em breve.
          </div>
        );
    }
  };

  const getTitle = () => {
    const titles: Record<WorkflowStepType, string> = {
      wait: 'Configurar Aguardar',
      send_email: 'Configurar Email',
      send_whatsapp: 'Configurar WhatsApp',
      create_task: 'Configurar Tarefa',
      complete_task: 'Completar Tarefa',
      webhook: 'Configurar Webhook',
      assign_round_robin: 'Configurar Atribuição Round-Robin',
      create_deal: 'Configurar Criação de Deal',
      update_deal: 'Configurar Atualização de Deal',
      move_deal_stage: 'Configurar Mudança de Etapa',
      send_notification: 'Configurar Notificação',
      increment_counter: 'Configurar Contador',
      track_sla_violation: 'Configurar Violação de SLA',
      log_activity: 'Configurar Registro de Atividade',
      conditional: 'Configurar Condicional',
    } as any;
    return titles[stepType] || 'Configurar Passo';
  };

  const hasConfigForm = [
    'wait',
    'send_email',
    'send_whatsapp',
    'create_task',
    'webhook',
    'assign_round_robin',
    'create_deal',
    'update_deal',
    'move_deal_stage',
    'send_notification',
    'increment_counter',
    'track_sla_violation',
    'log_activity',
    'conditional',
  ].includes(stepType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Configure os parâmetros deste passo do workflow
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {renderConfigForm()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            {hasConfigForm && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configuração'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
