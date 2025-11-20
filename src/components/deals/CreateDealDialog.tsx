/**
 * Create Deal Dialog - Braúna Version
 *
 * Complete deal creation with all Braúna-specific fields:
 * - Nome da negociação
 * - Funil e Etapa
 * - Fonte e Campanha
 * - Dados do Contato
 * - Cliente Ativo
 * - Filial Braúna
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDeal } from '@/lib/hooks/useDeals';
import { usePipelines } from '@/lib/hooks/usePipelines';
import { useSources, useCampaigns } from '@/lib/hooks/useCustomFields';
import { useAuth } from '@/contexts/AuthContext';
import { BRANCH_LABELS, type BranchLocation } from '@/lib/types/customFields.types';
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
import { Separator } from '@/components/ui/separator';
import { SourcesManager } from '@/components/settings/SourcesManager';
import { CampaignsManager } from '@/components/settings/CampaignsManager';
import { Loader2, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const createDealSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Nome da negociação é obrigatório').max(200),
  pipelineId: z.string().min(1, 'Funil é obrigatório'),
  stageId: z.string().min(1, 'Etapa é obrigatória'),

  // Contact Person fields
  contactFullName: z.string().min(1, 'Nome completo é obrigatório'),
  contactPhone: z.string().min(1, 'Telefone é obrigatório'),
  contactEmail: z.string().email('Email inválido'),
  contactJobTitle: z.string().optional(),
  contactCompany: z.string().optional(),

  // Braúna-specific fields
  sourceId: z.string().optional(),
  campaignId: z.string().optional(),
  isActiveClient: z.enum(['yes', 'no']).optional(),
  branch: z.string().optional(),

  // Optional fields
  value: z.number().min(0, 'Valor deve ser positivo').optional(),
  expectedCloseDate: z.string().optional(),
  description: z.string().max(1000).optional(),
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
  const createDeal = useCreateDeal();
  const { data: pipelines } = usePipelines();
  const { data: sources } = useSources();
  const { data: campaigns } = useCampaigns();

  const [sourcesManagerOpen, setSourcesManagerOpen] = useState(false);
  const [campaignsManagerOpen, setCampaignsManagerOpen] = useState(false);

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
      isActiveClient: 'no',
    },
  });

  const watchedPipelineId = watch('pipelineId');
  const selectedPipeline = pipelines?.find((p) => p.id === watchedPipelineId);
  const stages = selectedPipeline?.stages || [];

  // Reset stage when pipeline changes
  useEffect(() => {
    if (watchedPipelineId && stages.length > 0) {
      setValue('stageId', stages[0].id);
    }
  }, [watchedPipelineId, stages, setValue]);

  const onSubmit = async (data: CreateDealFormData) => {
    if (!userDoc?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const dealData = {
        title: data.title,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        ownerId: userDoc.id,
        value: data.value || 0,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        description: data.description,
        probability: stages.find((s) => s.id === data.stageId)?.probability || 0,

        // Braúna-specific fields
        sourceId: data.sourceId || undefined,
        campaignId: data.campaignId || undefined,
        isActiveClient: data.isActiveClient === 'yes',
        branch: data.branch as BranchLocation | undefined,

        // Contact Person
        contactPerson: {
          fullName: data.contactFullName,
          phone: data.contactPhone,
          email: data.contactEmail,
          jobTitle: data.contactJobTitle,
          company: data.contactCompany,
        },

        status: 'open' as const,
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Negociação</DialogTitle>
          <DialogDescription>
            Preencha os dados da negociação de planejamento financeiro
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SEÇÃO 1: Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações da Negociação</h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">
                  Nome da Negociação <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Planejamento Financeiro - João Silva"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pipeline">
                  Funil <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watchedPipelineId}
                  onValueChange={(value) => setValue('pipelineId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funil" />
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
                  <p className="text-sm text-destructive mt-1">{errors.pipelineId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="stage">
                  Etapa do Funil <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('stageId')}
                  onValueChange={(value) => setValue('stageId', value)}
                  disabled={!watchedPipelineId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
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
                  <p className="text-sm text-destructive mt-1">{errors.stageId.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 2: Fonte e Campanha */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Origem da Negociação</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="source">Fonte</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSourcesManagerOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                </div>
                <Select value={watch('sourceId')} onValueChange={(value) => setValue('sourceId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {sources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  De onde veio essa negociação
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="campaign">Campanha</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCampaignsManagerOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                </div>
                <Select value={watch('campaignId')} onValueChange={(value) => setValue('campaignId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {campaigns?.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Iniciativa ou campanha relacionada
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 3: Dados do Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Dados do Contato</h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="contactFullName">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactFullName"
                  placeholder="Ex: João da Silva"
                  {...register('contactFullName')}
                />
                {errors.contactFullName && (
                  <p className="text-sm text-destructive mt-1">{errors.contactFullName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPhone">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  placeholder="(11) 98765-4321"
                  {...register('contactPhone')}
                />
                {errors.contactPhone && (
                  <p className="text-sm text-destructive mt-1">{errors.contactPhone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactEmail">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="joao@email.com"
                  {...register('contactEmail')}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactJobTitle">Cargo de Trabalho</Label>
                <Input
                  id="contactJobTitle"
                  placeholder="Ex: Gerente de Vendas"
                  {...register('contactJobTitle')}
                />
              </div>

              <div>
                <Label htmlFor="contactCompany">Empresa</Label>
                <Input
                  id="contactCompany"
                  placeholder="Ex: Empresa ABC Ltda"
                  {...register('contactCompany')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 4: Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações Adicionais</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="isActiveClient">Cliente Ativo (Já é pagante?)</Label>
                <Select
                  value={watch('isActiveClient')}
                  onValueChange={(value: any) => setValue('isActiveClient', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branch">Filial Braúna</Label>
                <Select value={watch('branch')} onValueChange={(value) => setValue('branch', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BRANCH_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Valor Estimado (R$)</Label>
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
                <Label htmlFor="expectedCloseDate">Data Prevista de Fechamento</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  {...register('expectedCloseDate')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Observações</Label>
              <Textarea
                id="description"
                placeholder="Observações sobre esta negociação..."
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
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

    {/* Sources Manager */}
    <SourcesManager open={sourcesManagerOpen} onOpenChange={setSourcesManagerOpen} />

    {/* Campaigns Manager */}
    <CampaignsManager open={campaignsManagerOpen} onOpenChange={setCampaignsManagerOpen} />
    </>
  );
}
