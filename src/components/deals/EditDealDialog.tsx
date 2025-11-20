/**
 * Edit Deal Dialog
 *
 * Modal dialog for editing existing deals.
 * Pre-populates with current deal data and validates changes.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateDeal } from '@/lib/hooks/useDeals';
import { usePipelines } from '@/lib/hooks/usePipelines';
import type { Deal } from '@/lib/types/deal.types';
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

const editDealSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  pipelineId: z.string().min(1, 'Pipeline é obrigatório'),
  stageId: z.string().min(1, 'Estágio é obrigatório'),
  value: z.number().min(0, 'Valor deve ser positivo'),
  expectedCloseDate: z.string().optional(),
  description: z.string().max(1000).optional(),
  companyName: z.string().max(200).optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
});

type EditDealFormData = z.infer<typeof editDealSchema>;

interface EditDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
}

export function EditDealDialog({
  open,
  onOpenChange,
  deal,
}: EditDealDialogProps) {
  const { data: pipelines } = usePipelines();
  const updateDeal = useUpdateDeal();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EditDealFormData>({
    resolver: zodResolver(editDealSchema),
    defaultValues: {
      title: deal.title,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      value: deal.value,
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate.toDate()).toISOString().split('T')[0]
        : '',
      description: deal.description || '',
      companyName: deal.companyName || '',
      status: deal.status,
    },
  });

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      reset({
        title: deal.title,
        pipelineId: deal.pipelineId,
        stageId: deal.stageId,
        value: deal.value,
        expectedCloseDate: deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate.toDate()).toISOString().split('T')[0]
          : '',
        description: deal.description || '',
        companyName: deal.companyName || '',
        status: deal.status,
      });
    }
  }, [deal, reset]);

  const watchedPipelineId = watch('pipelineId');
  const selectedPipeline = pipelines?.find((p) => p.id === watchedPipelineId);
  const stages = selectedPipeline?.stages || [];

  const onSubmit = async (data: EditDealFormData) => {
    try {
      await updateDeal.mutateAsync({
        dealId: deal.id,
        data: {
          ...data,
          probability: stages.find((s) => s.id === data.stageId)?.probability || deal.probability,
          expectedCloseDate: data.expectedCloseDate
            ? new Date(data.expectedCloseDate)
            : undefined,
        },
      });

      onOpenChange(false);
      toast.success('Negociação atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Erro ao atualizar negociação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Negociação</DialogTitle>
          <DialogDescription>
            Atualize as informações desta oportunidade de venda
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

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value: any) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="won">Ganha</SelectItem>
                <SelectItem value="lost">Perdida</SelectItem>
              </SelectContent>
            </Select>
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
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
