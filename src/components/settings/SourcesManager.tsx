/**
 * Sources Manager
 *
 * Manage lead sources (where deals come from)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import {
  useSources,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
} from '@/lib/hooks/useCustomFields';
import type { Source } from '@/lib/types/customFields.types';
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
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const sourceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: z.enum(['referral', 'planner', 'marketing', 'organic', 'other']),
  description: z.string().max(500).optional(),
});

type SourceFormData = z.infer<typeof sourceSchema>;

const SOURCE_TYPE_LABELS = {
  referral: 'Recomendação de Cliente',
  planner: 'Indicação de Planejador',
  marketing: 'Marketing',
  organic: 'Orgânico',
  other: 'Outro',
};

interface SourcesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourcesManager({ open, onOpenChange }: SourcesManagerProps) {
  const { userDoc } = useAuth();
  const { data: sources, isLoading } = useSources();
  const createSource = useCreateSource();
  const updateSource = useUpdateSource();
  const deleteSource = useDeleteSource();

  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      type: 'referral',
    },
  });

  const handleCreateNew = () => {
    setEditingSource(null);
    reset({
      name: '',
      type: 'referral',
      description: '',
    });
    setShowForm(true);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    reset({
      name: source.name,
      type: source.type,
      description: source.description || '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (source: Source) => {
    setSourceToDelete(source);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sourceToDelete) return;

    try {
      await deleteSource.mutateAsync(sourceToDelete.id);
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  const onSubmit = async (data: SourceFormData) => {
    if (!userDoc?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      if (editingSource) {
        // Update existing
        await updateSource.mutateAsync({
          sourceId: editingSource.id,
          data,
        });
      } else {
        // Create new
        await createSource.mutateAsync({
          ...data,
          createdBy: userDoc.id,
        });
      }

      setShowForm(false);
      reset();
      setEditingSource(null);
    } catch (error) {
      console.error('Error saving source:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Fontes</DialogTitle>
            <DialogDescription>
              Fontes indicam de onde vieram as negociações (recomendação, marketing, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add New Button */}
            {!showForm && (
              <Button onClick={handleCreateNew} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Nova Fonte
              </Button>
            )}

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold">
                  {editingSource ? 'Editar Fonte' : 'Nova Fonte'}
                </h3>

                <div>
                  <Label htmlFor="name">
                    Nome da Fonte <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Recomendação de cliente do marketing"
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
                      {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
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

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Informações adicionais sobre esta fonte..."
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
                      setEditingSource(null);
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
                    ) : editingSource ? (
                      'Atualizar Fonte'
                    ) : (
                      'Criar Fonte'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Fontes Cadastradas</h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sources && sources.length > 0 ? (
                <div className="space-y-2">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {SOURCE_TYPE_LABELS[source.type]}
                        </div>
                        {source.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {source.description}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(source)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(source)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma fonte cadastrada
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
        title="Deletar Fonte?"
        itemName={sourceToDelete?.name || 'esta fonte'}
        isDeleting={deleteSource.isPending}
      />
    </>
  );
}
