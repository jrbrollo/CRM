/**
 * Braúna Workflows Setup Dialog
 *
 * One-click setup for all 22 operational workflows
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePipelines } from '@/lib/hooks/usePipelines';
import { useCreateWorkflows } from '@/lib/hooks/useWorkflows';
import { getBraunaWorkflows } from '@/lib/utils/braunaWorkflows';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface BraunaWorkflowsSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BraunaWorkflowsSetupDialog({
  open,
  onOpenChange,
}: BraunaWorkflowsSetupDialogProps) {
  const { userDoc } = useAuth();
  const { data: pipelines } = usePipelines();
  const createWorkflows = useCreateWorkflows();

  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // Find the 3 Braúna pipelines
  const prospeccaoPipeline = pipelines?.find((p) =>
    p.name.includes('Prospecção')
  );
  const vendaPipeline = pipelines?.find((p) => p.name.includes('Venda'));
  const montagemPipeline = pipelines?.find((p) => p.name.includes('Montagem'));

  const hasAllPipelines =
    !!prospeccaoPipeline && !!vendaPipeline && !!montagemPipeline;

  const handleSetup = async () => {
    if (!userDoc?.id || !hasAllPipelines) {
      toast.error('Pipelines Braúna não encontrados. Configure-os primeiro.');
      return;
    }

    setIsCreating(true);

    try {
      const workflows = getBraunaWorkflows(userDoc.id, {
        prospeccao: prospeccaoPipeline.id,
        venda: vendaPipeline.id,
        montagem: montagemPipeline.id,
      });

      await createWorkflows.mutateAsync(workflows);

      setCreated(true);

      setTimeout(() => {
        onOpenChange(false);
        setCreated(false);
      }, 2000);
    } catch (error) {
      console.error('Error setting up workflows:', error);
      toast.error('Erro ao configurar workflows');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Configurar Workflows Braúna
          </DialogTitle>
          <DialogDescription>
            Configure automaticamente os 22 workflows essenciais para operação de
            planejamento financeiro
          </DialogDescription>
        </DialogHeader>

        {!hasAllPipelines ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você precisa configurar os 3 pipelines Braúna primeiro (Prospecção,
              Venda, Montagem) antes de criar os workflows.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6 py-4">
            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-lg mb-2">
                22 Workflows Operacionais
              </h3>
              <p className="text-sm text-muted-foreground">
                Sistema completo de automação para gestão de leads, vendas e
                pós-venda
              </p>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <WorkflowCategory
                title="Distribuição de Leads (2)"
                workflows={[
                  'Distribuição Automática de Lead Novo',
                  'Reassignment por Inatividade (SLA)',
                ]}
                created={created}
              />

              <WorkflowCategory
                title="Progressão de Funil (4)"
                workflows={[
                  'Lead - Contato Feito',
                  'Lead - Não Atendido',
                  'Reunião Agendada',
                  'Ganho Prospecção → Venda',
                ]}
                created={created}
              />

              <WorkflowCategory
                title="Vendas (5)"
                workflows={[
                  'Análise Feita',
                  'Proposta Enviada',
                  'Elaboração de Contrato',
                  'Aguardando Pagamento',
                  'Pagamento Confirmado → Montagem',
                ]}
                created={created}
              />

              <WorkflowCategory
                title="Pós-Venda (4)"
                workflows={[
                  'Documentos Recebidos',
                  'Planejamento em Elaboração',
                  'Reunião de Apresentação Agendada',
                  'Planejamento Entregue',
                ]}
                created={created}
              />

              <WorkflowCategory
                title="Reengajamento (2)"
                workflows={['Deal Perdido - Não Atendeu', 'Deal Perdido - Preço/Sem Interesse']}
                created={created}
              />

              <WorkflowCategory
                title="Monitoramento (3)"
                workflows={[
                  'Deal Parado - 7 Dias',
                  'Cliente Inativo - 6 Meses',
                  'Alerta de Meta Mensal',
                ]}
                created={created}
              />

              <WorkflowCategory
                title="Gestão Interna (2)"
                workflows={['Novo Planejador - Onboarding', 'Planejador Ausente']}
                created={created}
              />
            </div>

            {/* Features */}
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Funcionalidades Incluídas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Round-robin de distribuição de leads</li>
                <li>✅ SLA de 30 minutos no primeiro contato</li>
                <li>✅ Transições automáticas entre funis</li>
                <li>✅ Follow-ups agendados automaticamente</li>
                <li>✅ Notificações para planejadores e líderes</li>
                <li>✅ Detecção de deals parados (7 dias / 6 meses)</li>
                <li>✅ Tracking de performance e SLA violations</li>
                <li>✅ Réguas de nutrição e reengajamento</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSetup}
            disabled={!hasAllPipelines || isCreating || created}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando Workflows...
              </>
            ) : created ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Workflows Criados!
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Criar 22 Workflows
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for category display
function WorkflowCategory({
  title,
  workflows,
  created,
}: {
  title: string;
  workflows: string[];
  created: boolean;
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        {created && <Check className="h-4 w-4 text-green-600" />}
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1 pl-6">
        {workflows.map((workflow, idx) => (
          <li key={idx} className="list-disc">
            {workflow}
          </li>
        ))}
      </ul>
    </div>
  );
}
