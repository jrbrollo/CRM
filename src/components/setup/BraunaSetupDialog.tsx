/**
 * Braúna Setup Dialog
 *
 * One-click setup wizard to create the 3 Braúna pipelines
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePipeline } from '@/lib/hooks/usePipelines';
import { getBraunaPipelines } from '@/lib/utils/braunaPipelines';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BraunaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BraunaSetupDialog({ open, onOpenChange }: BraunaSetupDialogProps) {
  const { userDoc } = useAuth();
  const createPipeline = useCreatePipeline();
  const [isCreating, setIsCreating] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const handleSetup = async () => {
    if (!userDoc?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsCreating(true);
    setCreatedCount(0);

    try {
      const pipelines = getBraunaPipelines(userDoc.id);

      for (const pipeline of pipelines) {
        await createPipeline.mutateAsync(pipeline);
        setCreatedCount((prev) => prev + 1);
      }

      toast.success('Pipelines Braúna criados com sucesso!');
      onOpenChange(false);

      // Reset counter after closing
      setTimeout(() => setCreatedCount(0), 500);
    } catch (error) {
      console.error('Error creating Braúna pipelines:', error);
      toast.error('Erro ao criar pipelines');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Pipelines Braúna</DialogTitle>
          <DialogDescription>
            Criar os 3 funis de planejamento financeiro com um clique
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este assistente criará automaticamente os 3 pipelines (funis) do Braúna:
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {/* Funil Prospecção */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {createdCount >= 1 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                <h4 className="font-semibold">1. Funil Prospecção</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Pipeline de prospecção de novos leads
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Etapas:</strong> Lead Frio → Lead Recebido → Fazer Contato →
                Não Atendido/Novo [GARGALO] → Contato Feito → Reunião Agendada
              </div>
            </div>

            {/* Funil Venda */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {createdCount >= 2 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                <h4 className="font-semibold">2. Funil Venda</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Pipeline de fechamento de vendas
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Etapas:</strong> Análise Agendada → Análise Feita → Proposta Feita →
                Elaboração de Contrato → Assinatura de Contrato → Pagamento → Planejamento Pago
              </div>
            </div>

            {/* Funil Montagem */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {createdCount >= 3 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                <h4 className="font-semibold">3. Funil Montagem</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Pipeline de elaboração e entrega do planejamento
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Etapas:</strong> Dados Solicitados → Dados Recebidos →
                Elaboração - Planejamento → Reunião Agendada → Reunião Realizada
              </div>
            </div>
          </div>

          {isCreating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Criando pipelines... ({createdCount}/3)
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button onClick={handleSetup} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando {createdCount}/3...
              </>
            ) : (
              'Criar Pipelines Braúna'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
