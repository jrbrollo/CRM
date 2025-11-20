/**
 * Quick Task Dialog
 *
 * Fast task creation dialog for quick to-dos.
 * Based on HubSpot's quick task creation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTask } from '@/lib/hooks/useActivities';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const quickTaskSchema = z.object({
  subject: z.string().min(1, 'Assunto é obrigatório').max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().min(1, 'Data é obrigatória'),
});

type QuickTaskFormData = z.infer<typeof quickTaskSchema>;

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
  dealId?: string;
}

export function QuickTaskDialog({
  open,
  onOpenChange,
  contactId,
  dealId,
}: QuickTaskDialogProps) {
  const { userDoc } = useAuth();
  const createTask = useCreateTask();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuickTaskFormData>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      dueDate: new Date().toISOString().split('T')[0], // Today
    },
  });

  const onSubmit = async (data: QuickTaskFormData) => {
    try {
      if (!userDoc?.id) {
        toast.error('Você precisa estar logado');
        return;
      }

      await createTask.mutateAsync({
        ownerId: userDoc.id,
        subject: data.subject,
        description: data.description || '',
        dueDate: new Date(data.dueDate),
        contactId,
        dealId,
      });
      
      reset();
      onOpenChange(false);
      toast.success('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Crie uma tarefa rápida para não esquecer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="subject">
              Assunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Ligar para cliente..."
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dueDate">
              Data <span className="text-destructive">*</span>
            </Label>
            <Input id="dueDate" type="date" {...register('dueDate')} />
            {errors.dueDate && (
              <p className="text-sm text-destructive mt-1">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Adicione detalhes..."
              rows={3}
              {...register('description')}
            />
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
                'Criar Tarefa'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
