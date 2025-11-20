/**
 * Braúna Workflows - Pre-configured
 *
 * 22 workflows essenciais para operação de planejamento financeiro
 */

import type { CreateWorkflowInput } from '../types/workflow.types';

export function getBraunaWorkflows(
  createdBy: string,
  pipelineIds: {
    prospeccao: string;
    venda: string;
    montagem: string;
  }
): CreateWorkflowInput[] {
  return [
    // ========================================================================
    // CATEGORIA 1: DISTRIBUIÇÃO E ATRIBUIÇÃO DE LEADS
    // ========================================================================

    // WORKFLOW 1: Distribuição Automática de Lead Novo
    {
      name: 'Distribuição Automática de Lead Novo',
      description:
        'Atribui leads automaticamente baseado em critérios (renda, origem, round-robin)',
      category: 'distribution',
      isActive: true,
      priority: 100,
      trigger: {
        type: 'deal_created',
        config: {
          pipelineId: pipelineIds.prospeccao,
        },
      },
      actions: [
        {
          type: 'assign_round_robin',
          config: {
            assignTo: 'round_robin',
            assignToTeamId: 'default-team',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Primeiro Contato',
            taskDescription: 'Fazer primeiro contato com o lead',
            taskType: 'call',
            taskPriority: 'urgent',
            taskDueInMinutes: 30,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Novo Lead Atribuído',
            notificationMessage: 'Você recebeu um novo lead. Prazo: 30 minutos.',
            notificationPriority: 'high',
            notifyUsers: ['deal_owner'],
          },
        },
        {
          type: 'update_deal',
          config: {
            updateLastActivityAt: true,
            setClientStatus: 'lead',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 2: Reassignment por Inatividade (SLA Breach)
    {
      name: 'Reassignment por Inatividade - SLA Violado',
      description: 'Reatribui lead se tarefa não foi executada em 30 minutos',
      category: 'distribution',
      isActive: true,
      priority: 99,
      trigger: {
        type: 'task_not_completed',
        config: {
          taskType: 'call',
          slaMinutes: 30,
        },
      },
      actions: [
        {
          type: 'track_sla_violation',
          config: {
            slaType: 'primeiro_contato',
            slaExpectedMinutes: 30,
          },
        },
        {
          type: 'assign_round_robin',
          config: {
            assignTo: 'round_robin',
            assignToTeamId: 'default-team',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Primeiro Contato - URGENTE',
            taskDescription: 'Lead reatribuído por inatividade',
            taskType: 'call',
            taskPriority: 'urgent',
            taskDueInMinutes: 30,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'SLA Violado - Lead Reatribuído',
            notificationMessage: 'Um planejador perdeu um lead por inatividade',
            notificationPriority: 'urgent',
            notifyUsers: ['team_leader'],
          },
        },
      ],
      createdBy,
    },

    // ========================================================================
    // CATEGORIA 2: PROGRESSÃO DE FUNIL E TAREFAS AUTOMÁTICAS
    // ========================================================================

    // WORKFLOW 3: Lead Movido para "Contato Feito"
    {
      name: 'Lead - Contato Feito',
      description: 'Criar follow-up quando contato inicial é feito',
      category: 'progression',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.prospeccao,
          toStageId: 'contato_feito',
        },
      },
      actions: [
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow-up 2 - Qualificar Lead',
            taskDescription: 'Fazer follow-up e qualificar o lead',
            taskType: 'call',
            taskPriority: 'high',
            taskDueInHours: 24,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'update_deal',
          config: {
            updateLastActivityAt: true,
          },
        },
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Obrigado pelo contato!',
            emailBody: 'Agradecemos o seu contato. Em breve retornaremos.',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 4: Lead Movido para "Não Atendido/Novo"
    {
      name: 'Lead - Não Atendido',
      description: 'Criar retentativas automáticas e nurturing',
      category: 'progression',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.prospeccao,
          toStageId: 'nao_atendido',
        },
      },
      actions: [
        {
          type: 'increment_counter',
          config: {
            counterField: 'contactAttempts',
            incrementBy: 1,
          },
        },
        {
          type: 'conditional',
          config: {
            ifConditions: [
              {
                field: 'contactAttempts',
                operator: 'equals',
                value: 1,
              },
            ],
            thenActions: [
              {
                type: 'create_task',
                config: {
                  taskTitle: 'Retentativa 2',
                  taskType: 'call',
                  taskPriority: 'medium',
                  taskDueInHours: 24,
                  taskAssignTo: 'deal_owner',
                },
              },
            ],
            elseActions: [
              {
                type: 'create_task',
                config: {
                  taskTitle: 'Tentativa Final - Considerar Perdido',
                  taskType: 'call',
                  taskPriority: 'low',
                  taskDueInHours: 72,
                  taskAssignTo: 'deal_owner',
                },
              },
            ],
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 5: Reunião Agendada
    {
      name: 'Reunião Agendada - Prospecção',
      description: 'Enviar confirmações e lembretes de reunião',
      category: 'progression',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.prospeccao,
          toStageId: 'reuniao_agendada',
        },
      },
      actions: [
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Confirmação de Reunião',
            emailBody: 'Sua reunião foi agendada com sucesso.',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Preparar Material para Reunião',
            taskType: 'document',
            taskPriority: 'high',
            taskDueInHours: 24,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Lembrete de Reunião',
            taskDescription: 'Reunião acontece em 1 hora',
            taskType: 'meeting',
            taskPriority: 'urgent',
            taskDueInMinutes: 60,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_whatsapp',
          config: {
            whatsappTo: 'contact',
            whatsappMessage:
              'Olá! Este é um lembrete da sua reunião marcada. Até breve!',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 6: Deal Ganho em Prospecção → Transição para Venda
    {
      name: 'Ganho Prospecção → Criar Deal em Venda',
      description: 'Cria automaticamente deal no funil de Venda',
      category: 'progression',
      isActive: true,
      priority: 95,
      trigger: {
        type: 'deal_won',
        config: {
          pipelineId: pipelineIds.prospeccao,
        },
      },
      actions: [
        {
          type: 'create_deal',
          config: {
            newDealTitle: 'Venda - {title}',
            newDealPipelineId: pipelineIds.venda,
            newDealStageId: 'analise_agendada',
            copyFieldsFromOriginal: [
              'contactPerson',
              'sourceId',
              'campaignId',
              'branch',
              'value',
            ],
            linkDeals: true,
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Confirmar Data de Análise Financeira',
            taskType: 'meeting',
            taskPriority: 'high',
            taskDueInHours: 24,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'update_deal',
          config: {
            setClientStatus: 'in_analysis',
          },
        },
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Próximos Passos - Análise Financeira',
            emailBody:
              'Parabéns! Vamos iniciar sua análise financeira. Aguarde nosso contato.',
          },
        },
      ],
      createdBy,
    },

    // ========================================================================
    // CATEGORIA 3: FUNIL DE VENDA
    // ========================================================================

    // WORKFLOW 7: Análise Financeira Realizada
    {
      name: 'Análise Feita',
      description: 'Preparar proposta comercial após análise',
      category: 'sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.venda,
          toStageId: 'analise_feita',
        },
      },
      actions: [
        {
          type: 'create_task',
          config: {
            taskTitle: 'Preparar Proposta Comercial',
            taskType: 'document',
            taskPriority: 'high',
            taskDueInDays: 2,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Obrigado pela Reunião!',
            emailBody: 'Foi ótimo conversar com você. Em breve enviaremos a proposta.',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 8: Proposta Enviada
    {
      name: 'Proposta Enviada',
      description: 'Follow-ups automáticos após envio de proposta',
      category: 'sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.venda,
          toStageId: 'proposta_feita',
        },
      },
      actions: [
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Proposta Comercial Enviada',
            emailBody: 'Segue em anexo nossa proposta. Qualquer dúvida, estamos à disposição.',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow-up Proposta',
            taskType: 'call',
            taskPriority: 'high',
            taskDueInDays: 2,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow-up 2 Proposta',
            taskType: 'call',
            taskPriority: 'medium',
            taskDueInDays: 5,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Proposta Enviada',
            notificationMessage: 'Proposta comercial foi enviada ao cliente',
            notifyUsers: ['team_leader'],
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 9: Contrato em Elaboração
    {
      name: 'Elaboração de Contrato',
      description: 'Preparar e enviar contrato',
      category: 'sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.venda,
          toStageId: 'elaboracao_contrato',
        },
      },
      actions: [
        {
          type: 'create_task',
          config: {
            taskTitle: 'Enviar Contrato',
            taskType: 'document',
            taskPriority: 'urgent',
            taskDueInDays: 1,
            taskAssignTo: 'deal_owner',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 10: Aguardando Pagamento
    {
      name: 'Aguardando Pagamento',
      description: 'Follow-ups de pagamento e lembretes',
      category: 'sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.venda,
          toStageId: 'pagamento',
        },
      },
      actions: [
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Instruções de Pagamento',
            emailBody: 'Segue as instruções para realizar o pagamento do planejamento.',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Verificar Pagamento',
            taskType: 'review',
            taskPriority: 'medium',
            taskDueInDays: 3,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow-up Pagamento Atrasado',
            taskType: 'call',
            taskPriority: 'high',
            taskDueInDays: 7,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_whatsapp',
          config: {
            whatsappTo: 'contact',
            whatsappMessage: 'Lembrete: Aguardamos confirmação do pagamento.',
          },
          delay: 5 * 24 * 60, // 5 days in minutes
        },
      ],
      createdBy,
    },

    // WORKFLOW 11: Pagamento Confirmado → Transição para Montagem
    {
      name: 'Pagamento Confirmado → Criar Deal em Montagem',
      description: 'Cria deal no funil de Montagem',
      category: 'sales',
      isActive: true,
      priority: 95,
      trigger: {
        type: 'deal_won',
        config: {
          pipelineId: pipelineIds.venda,
        },
      },
      actions: [
        {
          type: 'create_deal',
          config: {
            newDealTitle: 'Montagem - {title}',
            newDealPipelineId: pipelineIds.montagem,
            newDealStageId: 'dados_solicitados',
            copyFieldsFromOriginal: [
              'contactPerson',
              'sourceId',
              'campaignId',
              'branch',
              'value',
            ],
            linkDeals: true,
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Solicitar Documentos ao Cliente',
            taskType: 'email',
            taskPriority: 'high',
            taskDueInHours: 24,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'update_deal',
          config: {
            setClientStatus: 'active_client',
          },
        },
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Documentos Necessários',
            emailBody: 'Segue a lista de documentos necessários para elaboração do planejamento.',
          },
        },
        {
          type: 'send_whatsapp',
          config: {
            whatsappTo: 'contact',
            whatsappMessage: 'Checklist de documentos enviado por email. Confira!',
          },
        },
      ],
      createdBy,
    },

    // ========================================================================
    // CATEGORIA 4: FUNIL DE MONTAGEM (PÓS-VENDA)
    // ========================================================================

    // WORKFLOW 12: Documentos Recebidos
    {
      name: 'Documentos Recebidos',
      description: 'Iniciar elaboração do planejamento',
      category: 'post_sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.montagem,
          toStageId: 'dados_recebidos',
        },
      },
      actions: [
        {
          type: 'create_task',
          config: {
            taskTitle: 'Iniciar Elaboração do Planejamento',
            taskType: 'other',
            taskPriority: 'high',
            taskDueInDays: 1,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Documentos Recebidos',
            emailBody: 'Recebemos seus documentos. Prazo estimado de entrega: 15 dias úteis.',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 13: Planejamento em Elaboração
    {
      name: 'Planejamento em Elaboração',
      description: 'Checkpoints e revisões',
      category: 'post_sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.montagem,
          toStageId: 'elaboracao_planejamento',
        },
      },
      actions: [
        {
          type: 'create_task',
          config: {
            taskTitle: 'Checkpoint 50% - Revisar Progresso',
            taskType: 'review',
            taskPriority: 'medium',
            taskDueInDays: 7,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Revisar Planejamento',
            taskType: 'review',
            taskPriority: 'high',
            taskDueInDays: 13,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Agendar Reunião de Apresentação',
            taskType: 'meeting',
            taskPriority: 'high',
            taskDueInDays: 14,
            taskAssignTo: 'deal_owner',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 14: Reunião de Apresentação Agendada
    {
      name: 'Reunião de Apresentação Agendada',
      description: 'Lembretes e preparação',
      category: 'post_sales',
      isActive: true,
      trigger: {
        type: 'deal_stage_changed',
        config: {
          pipelineId: pipelineIds.montagem,
          toStageId: 'reuniao_agendada',
        },
      },
      actions: [
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Confirmação - Reunião de Apresentação',
            emailBody: 'Sua reunião de apresentação do planejamento foi confirmada.',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Preparar Apresentação',
            taskType: 'document',
            taskPriority: 'high',
            taskDueInDays: 1,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_whatsapp',
          config: {
            whatsappTo: 'contact',
            whatsappMessage: 'Lembrete: Reunião marcada para apresentação do planejamento!',
          },
          delay: 24 * 60, // 1 day
        },
      ],
      createdBy,
    },

    // WORKFLOW 15: Planejamento Entregue
    {
      name: 'Planejamento Entregue',
      description: 'Pós-entrega, NPS e relacionamento',
      category: 'post_sales',
      isActive: true,
      trigger: {
        type: 'deal_won',
        config: {
          pipelineId: pipelineIds.montagem,
        },
      },
      actions: [
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Obrigado!',
            emailBody: 'Foi um prazer trabalhar com você. Conte conosco sempre!',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Solicitar Depoimento/Indicações',
            taskType: 'email',
            taskPriority: 'low',
            taskDueInDays: 7,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow-up de Implementação',
            taskType: 'call',
            taskPriority: 'medium',
            taskDueInDays: 30,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'update_deal',
          config: {
            setClientStatus: 'satisfied_client',
          },
        },
      ],
      createdBy,
    },

    // ========================================================================
    // CATEGORIA 5: DEALS PERDIDOS E REENGAJAMENTO
    // ========================================================================

    // WORKFLOW 16: Deal Perdido - Não Atendeu
    {
      name: 'Deal Perdido - Não Atendeu',
      description: 'Régua de reengajamento',
      category: 'engagement',
      isActive: true,
      trigger: {
        type: 'deal_lost',
        config: {
          lostReason: 'nao_atendeu',
        },
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Deal Perdido',
            notificationMessage: 'Deal perdido: cliente não atendeu',
            notifyUsers: ['team_leader'],
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 17: Deal Perdido - Preço/Sem Interesse
    {
      name: 'Deal Perdido - Preço Alto ou Sem Interesse',
      description: 'Despedida e nurturing de longo prazo',
      category: 'engagement',
      isActive: true,
      trigger: {
        type: 'deal_lost',
        config: {},
      },
      conditions: [
        {
          field: 'lostReason',
          operator: 'in',
          value: ['preco_alto', 'sem_interesse'],
        },
      ],
      actions: [
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Até breve!',
            emailBody:
              'Entendemos sua decisão. Estamos sempre à disposição caso precise no futuro.',
          },
        },
      ],
      createdBy,
    },

    // ========================================================================
    // CATEGORIA 6: MONITORAMENTO E ALERTAS
    // ========================================================================

    // WORKFLOW 18: Deal Parado há Mais de 7 Dias
    {
      name: 'Deal Parado - 7 Dias Sem Atividade',
      description: 'Alerta de deal sem movimento',
      category: 'monitoring',
      isActive: true,
      trigger: {
        type: 'deal_stale',
        config: {
          daysInactive: 7,
        },
      },
      actions: [
        {
          type: 'update_deal',
          config: {
            dealUpdates: {
              isStale: true,
            },
          },
        },
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Deal Parado',
            notificationMessage: 'Este deal está sem atividade há 7 dias',
            notificationPriority: 'high',
            notifyUsers: ['deal_owner', 'team_leader'],
          },
        },
        {
          type: 'create_task',
          config: {
            taskTitle: 'Reativar Deal Parado',
            taskType: 'call',
            taskPriority: 'urgent',
            taskDueInHours: 24,
            taskAssignTo: 'deal_owner',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 19: Cliente Inativo - Pós-Entrega
    {
      name: 'Cliente Inativo - 6 Meses Sem Contato',
      description: 'Reengajamento de clientes antigos',
      category: 'monitoring',
      isActive: true,
      trigger: {
        type: 'deal_stale',
        config: {
          daysInactive: 180, // 6 months
        },
      },
      conditions: [
        {
          field: 'clientStatus',
          operator: 'equals',
          value: 'satisfied_client',
        },
      ],
      actions: [
        {
          type: 'create_task',
          config: {
            taskTitle: 'Follow-up Revisão de Planejamento',
            taskType: 'call',
            taskPriority: 'low',
            taskDueInDays: 7,
            taskAssignTo: 'deal_owner',
          },
        },
        {
          type: 'send_email',
          config: {
            emailTo: 'contact',
            emailSubject: 'Que tal uma revisão gratuita?',
            emailBody: 'Faz tempo que não conversamos! Oferecemos revisão gratuita do seu planejamento.',
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 20: Alerta de Meta Mensal
    {
      name: 'Alerta de Meta Mensal - Dia 20',
      description: 'Verificação de performance vs meta',
      category: 'monitoring',
      isActive: true,
      trigger: {
        type: 'recurring',
        config: {
          recurringPattern: 'monthly',
          recurringDay: 20,
          recurringTime: '09:00',
        },
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Verificação de Meta Mensal',
            notificationMessage: 'Dia 20: Verifique o progresso da meta do time',
            notificationPriority: 'high',
            notifyUsers: ['team_leader'],
          },
        },
      ],
      createdBy,
    },

    // ========================================================================
    // CATEGORIA 7: ONBOARDING E GESTÃO INTERNA
    // ========================================================================

    // WORKFLOW 21: Novo Planejador Adicionado
    {
      name: 'Novo Planejador - Onboarding',
      description: 'Processo de onboarding automático',
      category: 'internal',
      isActive: true,
      trigger: {
        type: 'user_created',
        config: {},
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Bem-vindo à Braúna!',
            notificationMessage: 'Seja bem-vindo! Confira os materiais de treinamento.',
            notificationPriority: 'high',
            notifyUsers: ['specific_user'],
          },
        },
      ],
      createdBy,
    },

    // WORKFLOW 22: Férias/Ausência de Planejador
    {
      name: 'Planejador Ausente - Reatribuir Deals',
      description: 'Reatribui deals quando planejador sai de férias',
      category: 'internal',
      isActive: true,
      trigger: {
        type: 'user_status_changed',
        config: {
          userStatus: 'on_leave',
        },
      },
      actions: [
        {
          type: 'reassign_deals',
          config: {},
        },
        {
          type: 'send_notification',
          config: {
            notificationTitle: 'Planejador Ausente',
            notificationMessage: 'Deals foram reatribuídos durante ausência',
            notifyUsers: ['team_leader'],
          },
        },
      ],
      createdBy,
    },
  ];
}
