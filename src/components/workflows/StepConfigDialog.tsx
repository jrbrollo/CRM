/**
 * Step Configuration Dialog
 *
 * Dialog for configuring individual workflow step parameters.
 * Supports different configuration forms based on step type.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

// Schemas for different step types
const delayConfigSchema = z.object({
  delayType: z.enum(['duration', 'until_date', 'until_event']),
  duration: z.object({
    value: z.number().min(1),
    unit: z.enum(['minutes', 'hours', 'days', 'weeks']),
  }).optional(),
  untilDate: z.string().optional(),
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
  assignToOwnerId: z.boolean().optional(),
  taskDueIn: z.object({
    value: z.number().min(1),
    unit: z.enum(['days', 'weeks']),
  }).optional(),
});

const updatePropertyConfigSchema = z.object({
  propertyName: z.string().min(1, 'Nome da propriedade é obrigatório'),
  propertyValue: z.string().min(1, 'Valor é obrigatório'),
});

const whatsappConfigSchema = z.object({
  whatsappMessage: z.string().min(1, 'Mensagem é obrigatória').max(1000),
});

const webhookConfigSchema = z.object({
  webhookUrl: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
  webhookMethod: z.enum(['GET', 'POST']),
  webhookBody: z.string().optional(),
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

  // Determine which schema to use
  const getSchema = () => {
    switch (stepType) {
      case 'delay':
        return delayConfigSchema;
      case 'send_email':
        return emailConfigSchema;
      case 'send_whatsapp':
        return whatsappConfigSchema;
      case 'create_task':
        return taskConfigSchema;
      case 'update_property':
        return updatePropertyConfigSchema;
      case 'webhook':
        return webhookConfigSchema;
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

  const renderDelayConfig = () => {
    const delayType = watch('delayType') || 'duration';

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delayType">Tipo de Espera</Label>
          <Select value={delayType} onValueChange={(value) => setValue('delayType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="duration">Duração Específica</SelectItem>
              <SelectItem value="until_date">Até uma Data</SelectItem>
              <SelectItem value="until_event">Até um Evento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {delayType === 'duration' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration.value">Quantidade</Label>
              <Input
                id="duration.value"
                type="number"
                min="1"
                {...register('duration.value', { valueAsNumber: true })}
              />
              {errors.duration?.value && (
                <p className="text-sm text-destructive">{errors.duration.value.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration.unit">Unidade</Label>
              <Select
                value={watch('duration.unit') || 'days'}
                onValueChange={(value) => setValue('duration.unit', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                  <SelectItem value="weeks">Semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {delayType === 'until_date' && (
          <div className="space-y-2">
            <Label htmlFor="untilDate">Data</Label>
            <Input id="untilDate" type="date" {...register('untilDate')} />
          </div>
        )}
      </div>
    );
  };

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
          placeholder="Ex: Ligar para o lead"
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
          <Label htmlFor="taskDueIn.value">Prazo (quantidade)</Label>
          <Input
            id="taskDueIn.value"
            type="number"
            min="1"
            placeholder="Ex: 2"
            {...register('taskDueIn.value', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taskDueIn.unit">Prazo (unidade)</Label>
          <Select
            value={watch('taskDueIn.unit') || 'days'}
            onValueChange={(value) => setValue('taskDueIn.unit', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Dias</SelectItem>
              <SelectItem value="weeks">Semanas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderUpdatePropertyConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="propertyName">
          Nome da Propriedade <span className="text-destructive">*</span>
        </Label>
        <Input
          id="propertyName"
          placeholder="Ex: status, leadScore"
          {...register('propertyName')}
        />
        {errors.propertyName && (
          <p className="text-sm text-destructive">{errors.propertyName.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyValue">
          Novo Valor <span className="text-destructive">*</span>
        </Label>
        <Input
          id="propertyValue"
          placeholder="Ex: qualified"
          {...register('propertyValue')}
        />
        {errors.propertyValue && (
          <p className="text-sm text-destructive">{errors.propertyValue.message as string}</p>
        )}
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
      case 'delay':
        return renderDelayConfig();
      case 'send_email':
        return renderEmailConfig();
      case 'send_whatsapp':
        return renderWhatsAppConfig();
      case 'create_task':
        return renderTaskConfig();
      case 'update_property':
        return renderUpdatePropertyConfig();
      case 'webhook':
        return renderWebhookConfig();
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
      delay: 'Configurar Atraso',
      send_email: 'Configurar Email',
      send_whatsapp: 'Configurar WhatsApp',
      create_task: 'Configurar Tarefa',
      update_property: 'Atualizar Propriedade',
      branch: 'Configurar Ramificação',
      webhook: 'Configurar Webhook',
      add_to_list: 'Adicionar à Lista',
      remove_from_list: 'Remover da Lista',
    };
    return titles[stepType] || 'Configurar Passo';
  };

  const hasConfigForm = [
    'delay',
    'send_email',
    'send_whatsapp',
    'create_task',
    'update_property',
    'webhook',
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
