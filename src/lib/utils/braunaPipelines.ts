/**
 * Braúna Pipelines Configuration
 *
 * Default pipeline setup for Planejamento Financeiro
 */

import type { CreatePipelineInput } from '../types/pipeline.types';

export function getBraunaPipelines(createdBy: string): CreatePipelineInput[] {
  return [
    // FUNIL 1: PROSPECÇÃO
    {
      name: 'Funil Prospecção',
      description: 'Pipeline de prospecção de novos leads',
      isActive: true,
      stages: [
        {
          id: 'lead_frio',
          name: 'Lead Frio',
          probability: 5,
          order: 0,
        },
        {
          id: 'lead_recebido',
          name: 'Lead Recebido',
          probability: 10,
          order: 1,
        },
        {
          id: 'fazer_contato',
          name: 'Fazer Contato',
          probability: 15,
          order: 2,
        },
        {
          id: 'nao_atendido',
          name: 'Não Atendido/Novo [GARGALO]',
          probability: 20,
          order: 3,
        },
        {
          id: 'contato_feito',
          name: 'Contato Feito',
          probability: 40,
          order: 4,
        },
        {
          id: 'reuniao_agendada',
          name: 'Reunião Agendada',
          probability: 60,
          order: 5,
        },
      ],
      createdBy,
    },

    // FUNIL 2: VENDA
    {
      name: 'Funil Venda',
      description: 'Pipeline de fechamento de vendas',
      isActive: true,
      stages: [
        {
          id: 'analise_agendada',
          name: 'Análise Agendada',
          probability: 70,
          order: 0,
        },
        {
          id: 'analise_feita',
          name: 'Análise Feita',
          probability: 75,
          order: 1,
        },
        {
          id: 'proposta_feita',
          name: 'Proposta Feita',
          probability: 80,
          order: 2,
        },
        {
          id: 'elaboracao_contrato',
          name: 'Elaboração de Contrato',
          probability: 85,
          order: 3,
        },
        {
          id: 'assinatura_contrato',
          name: 'Assinatura de Contrato',
          probability: 90,
          order: 4,
        },
        {
          id: 'pagamento',
          name: 'Pagamento',
          probability: 95,
          order: 5,
        },
        {
          id: 'planejamento_pago',
          name: 'Planejamento Pago',
          probability: 98,
          order: 6,
        },
      ],
      createdBy,
    },

    // FUNIL 3: MONTAGEM
    {
      name: 'Funil Montagem',
      description: 'Pipeline de elaboração e entrega do planejamento',
      isActive: true,
      stages: [
        {
          id: 'dados_solicitados',
          name: 'Dados Solicitados',
          probability: 70,
          order: 0,
        },
        {
          id: 'dados_recebidos',
          name: 'Dados Recebidos',
          probability: 80,
          order: 1,
        },
        {
          id: 'elaboracao_planejamento',
          name: 'Elaboração - Planejamento',
          probability: 85,
          order: 2,
        },
        {
          id: 'reuniao_agendada_final',
          name: 'Reunião Agendada',
          probability: 90,
          order: 3,
        },
        {
          id: 'reuniao_realizada',
          name: 'Reunião Realizada',
          probability: 95,
          order: 4,
        },
      ],
      createdBy,
    },
  ];
}
