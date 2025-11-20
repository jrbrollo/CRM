/**
 * Create Pipeline Dialog
 *
 * Create a new sales pipeline with stages.
 * Based on HubSpot's pipeline creation wizard.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDefaultPipeline } from '@/lib/hooks/usePipelines';
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
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const createPipelineSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
});

type CreatePipelineFormData = z.infer<typeof createPipelineSchema>;

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePipelineDialog({
  open,
  onOpenChange,
}: CreatePipelineDialogProps) {
  const createDefaultPipeline = useCreateDefaultPipeline();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreatePipelineFormData>({
    resolver: zodResolver(createPipelineSchema),
  });

  const onSubmit = async (data: CreatePipelineFormData) => {
    try {
      // Create default pipeline with standard stages
      await createDefaultPipeline.mutateAsync();
      
      reset();
      onOpenChange(false);
      toast.success('Pipeline padrão criado com sucesso!');
    } catch (error) {
      console.error('Error creating pipeline:', error);
      toast.error('Erro ao criar pipeline');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Pipeline Padrão</DialogTitle>
          <DialogDescription>
            Um pipeline com estágios padrão será criado para você começar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O pipeline padrão inclui os estágios: Qualificação (10%), Proposta (25%),
              Negociação (50%), Fechamento (90%)
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Após criar o pipeline padrão, você poderá personalizá-lo adicionando ou
              removendo estágios conforme necessário.
            </p>
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
                'Criar Pipeline Padrão'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
