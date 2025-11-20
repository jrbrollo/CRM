/**
 * Campaigns Manager
 *
 * Manage marketing campaigns and initiatives
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from '@/lib/hooks/useCustomFields';
import type { Campaign } from '@/lib/types/customFields.types';
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
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Loader2, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: z.enum(['digital', 'event', 'content', 'partnership', 'other']),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const CAMPAIGN_TYPE_LABELS = {
  digital: 'Aquisição Digital',
  event: 'Evento/Palestra',
  content: 'Conteúdo/Blog',
  partnership: 'Parceria',
  other: 'Outro',
};

interface CampaignsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignsManager({ open, onOpenChange }: CampaignsManagerProps) {
  const { userDoc } = useAuth();
  const { data: campaigns, isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      type: 'digital',
    },
  });

  const handleCreateNew = () => {
    setEditingCampaign(null);
    reset({
      name: '',
      type: 'digital',
      description: '',
      startDate: '',
      endDate: '',
    });
    setShowForm(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    reset({
      name: campaign.name,
      type: campaign.type,
      description: campaign.description || '',
      startDate: campaign.startDate
        ? new Date(campaign.startDate.toDate()).toISOString().split('T')[0]
        : '',
      endDate: campaign.endDate
        ? new Date(campaign.endDate.toDate()).toISOString().split('T')[0]
        : '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    try {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    if (!userDoc?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const campaignData = {
        name: data.name,
        type: data.type,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        createdBy: userDoc.id,
      };

      if (editingCampaign) {
        // Update existing
        await updateCampaign.mutateAsync({
          campaignId: editingCampaign.id,
          data: campaignData,
        });
      } else {
        // Create new
        await createCampaign.mutateAsync(campaignData);
      }

      setShowForm(false);
      reset();
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    return new Date(timestamp.toDate()).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Campanhas</DialogTitle>
            <DialogDescription>
              Campanhas são iniciativas de marketing ou eventos específicos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add New Button */}
            {!showForm && (
              <Button onClick={handleCreateNew} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Nova Campanha
              </Button>
            )}

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold">
                  {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
                </h3>

                <div>
                  <Label htmlFor="name">
                    Nome da Campanha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Palestra Planejamento Financeiro 2024"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">
                    Tipo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value: any) => setValue('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input id="startDate" type="date" {...register('startDate')} />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input id="endDate" type="date" {...register('endDate')} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Informações adicionais sobre esta campanha..."
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      reset();
                      setEditingCampaign(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : editingCampaign ? (
                      'Atualizar Campanha'
                    ) : (
                      'Criar Campanha'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Campanhas Cadastradas</h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-2">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {CAMPAIGN_TYPE_LABELS[campaign.type]}
                        </div>
                        {(campaign.startDate || campaign.endDate) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {campaign.startDate && formatDate(campaign.startDate)}
                            {campaign.startDate && campaign.endDate && ' - '}
                            {campaign.endDate && formatDate(campaign.endDate)}
                          </div>
                        )}
                        {campaign.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {campaign.description}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(campaign)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha cadastrada
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Deletar Campanha?"
        itemName={campaignToDelete?.name || 'esta campanha'}
        isDeleting={deleteCampaign.isPending}
      />
    </>
  );
}
