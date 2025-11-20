/**
 * Create Deal Dialog
 *
 * Modal dialog for creating new deals with full validation.
 * Includes pipeline, stage, value, and contact association.
 * 
 * Based on HubSpot's deal creation flow.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDeal } from '@/lib/hooks/useDeals';
import { usePipelines } from '@/lib/hooks/usePipelines';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const createDealSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  pipelineId: z.string().min(1, 'Pipeline é obrigatório'),
  stageId: z.string().min(1, 'Estágio é obrigatório'),
  value: z.number().min(0, 'Valor deve ser positivo'),
  expectedCloseDate: z.string().optional(),
  description: z.string().max(1000).optional(),
  contactId: z.string().optional(),
  companyName: z.string().max(200).optional(),
});

type CreateDealFormData = z.infer<typeof createDealSchema>;

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: string;
}

export function CreateDealDialog({
  open,
  onOpenChange,
  defaultContactId,
}: CreateDealDialogProps) {
  const { userDoc } = useAuth();
  const { data: pipelines } = usePipelines();
  const createDeal = useCreateDeal();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      contactId: defaultContactId,
      value: 0,
    },
  });

  const watchedPipelineId = watch('pipelineId');

  // Get stages for selected pipeline
  const selectedPipeline = pipelines?.find((p) => p.id === watchedPipelineId);
  const stages = selectedPipeline?.stages || [];

  // Auto-select first stage when pipeline changes
  if (watchedPipelineId !== selectedPipelineId && stages.length > 0) {
    setSelectedPipelineId(watchedPipelineId);
    setValue('stageId', stages[0].id);
  }

  const onSubmit = async (data: CreateDealFormData) => {
    try {
      if (!userDoc?.id) {
        toast.error('Você precisa estar logado para criar negociações');
        return;
      }

      const dealData = {
        ...data,
        ownerId: userDoc.id,
        ownerName: userDoc.name,
        status: 'open' as const,
        probability: stages.find((s) => s.id === data.stageId)?.probability || 0,
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : undefined,
      };

      await createDeal.mutateAsync(dealData);
      
      reset();
      onOpenChange(false);
      toast.success('Negociação criada com sucesso!');
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Erro ao criar negociação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Negociação</DialogTitle>
          <DialogDescription>
            Crie uma nova oportunidade de venda no seu pipeline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Venda de produto X para empresa Y"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Pipeline and Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pipeline">
                Pipeline <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedPipelineId}
                onValueChange={(value) => setValue('pipelineId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pipelineId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.pipelineId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="stage">
                Estágio <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('stageId')}
                onValueChange={(value) => setValue('stageId', value)}
                disabled={!watchedPipelineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} ({stage.probability}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.stageId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.stageId.message}
                </p>
              )}
            </div>
          </div>

          {/* Value and Close Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">
                Valor (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('value', { valueAsNumber: true })}
              />
              {errors.value && (
                <p className="text-sm text-destructive mt-1">{errors.value.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expectedCloseDate">Data de Fechamento Prevista</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                {...register('expectedCloseDate')}
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              placeholder="Ex: Empresa ABC Ltda"
              {...register('companyName')}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhes sobre esta oportunidade..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Negociação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
