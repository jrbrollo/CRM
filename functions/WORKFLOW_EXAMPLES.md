# Workflow Engine - Examples

Este documento contém exemplos completos de WorkflowDefinitions para o motor de workflows enterprise.

## Exemplo 1: Follow-up Automático com Delays e Condições

Este workflow:
1. É disparado quando um deal é criado
2. Aguarda 1 dia
3. Verifica se o deal ainda está ativo
4. Se ativo: envia email de follow-up e cria tarefa
5. Se não ativo: apenas registra atividade

```json
{
  "id": "auto-followup-v1",
  "name": "Follow-up Automático para Novos Deals",
  "description": "Envia email de follow-up 1 dia após criação do deal se ainda estiver ativo",
  "isActive": true,
  "version": 1,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "startNodeId": "trigger-1",
  "nodes": {
    "trigger-1": {
      "id": "trigger-1",
      "type": "trigger",
      "label": "Deal Criado",
      "trigger": "deal_created",
      "nextId": "delay-1"
    },
    "delay-1": {
      "id": "delay-1",
      "type": "delay",
      "label": "Aguardar 1 Dia",
      "delayDays": 1,
      "delayHours": 0,
      "delayMinutes": 0,
      "nextId": "condition-1"
    },
    "condition-1": {
      "id": "condition-1",
      "type": "condition",
      "label": "Deal Ainda Ativo?",
      "config": {
        "conditions": [
          {
            "field": "status",
            "operator": "equals",
            "value": "active"
          }
        ],
        "operator": "and"
      },
      "trueNextId": "action-send-email",
      "falseNextId": "action-log-skipped"
    },
    "action-send-email": {
      "id": "action-send-email",
      "type": "action",
      "label": "Enviar Email de Follow-up",
      "action": "send_email",
      "config": {
        "emailTo": "{{email}}",
        "emailSubject": "Olá {{contactName}}, como podemos ajudar?",
        "emailBody": "<p>Olá {{contactName}},</p><p>Vi que você demonstrou interesse em nossos serviços. Como posso ajudá-lo a avançar?</p><p>Att,<br>Equipe Braúna</p>"
      },
      "nextId": "action-create-task"
    },
    "action-create-task": {
      "id": "action-create-task",
      "type": "action",
      "label": "Criar Tarefa de Follow-up",
      "action": "create_task",
      "config": {
        "taskTitle": "Follow-up: {{title}}",
        "taskDescription": "Realizar follow-up do email enviado automaticamente para {{contactName}}",
        "taskAssignee": "{{assigneeId}}",
        "taskDueDate": "2"
      },
      "nextId": "end-1"
    },
    "action-log-skipped": {
      "id": "action-log-skipped",
      "type": "action",
      "label": "Registrar Skip",
      "action": "create_activity",
      "config": {
        "activityType": "workflow_skipped",
        "activityDescription": "Follow-up não enviado: deal não está mais ativo"
      },
      "nextId": "end-1"
    },
    "end-1": {
      "id": "end-1",
      "type": "end",
      "label": "Fim"
    }
  }
}
```

## Exemplo 2: Nurturing com Múltiplas Condições e Delays

Este workflow:
1. Disparado quando deal muda de stage para "Negociação"
2. Aguarda 2 dias
3. Verifica valor do deal E dias desde última atividade
4. Se deal > R$ 10.000 E sem atividade > 3 dias: Email + Tarefa urgente
5. Se deal < R$ 10.000: Email padrão + Tarefa normal
6. Caso contrário: Apenas registra

```json
{
  "id": "deal-nurturing-v1",
  "name": "Nurturing Inteligente por Valor",
  "description": "Ajusta estratégia de follow-up baseado no valor do deal",
  "isActive": true,
  "version": 1,
  "startNodeId": "trigger-1",
  "nodes": {
    "trigger-1": {
      "id": "trigger-1",
      "type": "trigger",
      "label": "Deal em Negociação",
      "trigger": "deal_stage_changed",
      "stageId": "negotiation-stage-id",
      "nextId": "delay-1"
    },
    "delay-1": {
      "id": "delay-1",
      "type": "delay",
      "label": "Aguardar 2 Dias",
      "delayDays": 2,
      "nextId": "condition-high-value"
    },
    "condition-high-value": {
      "id": "condition-high-value",
      "type": "condition",
      "label": "Deal de Alto Valor?",
      "config": {
        "conditions": [
          {
            "field": "value",
            "operator": "greater_than",
            "value": 10000
          },
          {
            "field": "status",
            "operator": "equals",
            "value": "active"
          }
        ],
        "operator": "and"
      },
      "trueNextId": "action-vip-email",
      "falseNextId": "condition-low-value"
    },
    "condition-low-value": {
      "id": "condition-low-value",
      "type": "condition",
      "label": "Deal de Valor Padrão?",
      "config": {
        "conditions": [
          {
            "field": "value",
            "operator": "less_or_equal",
            "value": 10000
          },
          {
            "field": "value",
            "operator": "greater_than",
            "value": 0
          },
          {
            "field": "status",
            "operator": "equals",
            "value": "active"
          }
        ],
        "operator": "and"
      },
      "trueNextId": "action-standard-email",
      "falseNextId": "action-log-skip"
    },
    "action-vip-email": {
      "id": "action-vip-email",
      "type": "action",
      "label": "Email VIP Personalizado",
      "action": "send_email",
      "config": {
        "emailTo": "{{email}}",
        "emailSubject": "{{contactName}}, proposta exclusiva para você",
        "emailBody": "<p>Olá {{contactName}},</p><p>Preparamos uma proposta exclusiva para o deal <strong>{{title}}</strong> no valor de <strong>R$ {{value}}</strong>.</p><p>Gostaria de agendar uma conversa?</p>"
      },
      "nextId": "action-vip-task"
    },
    "action-vip-task": {
      "id": "action-vip-task",
      "type": "action",
      "label": "Tarefa VIP Urgente",
      "action": "create_task",
      "config": {
        "taskTitle": "🔥 URGENTE: Follow-up VIP - {{title}}",
        "taskDescription": "Cliente de alto valor (R$ {{value}}). Priorizar contato pessoal.",
        "taskAssignee": "{{assigneeId}}",
        "taskDueDate": "1"
      },
      "nextId": "action-assign-manager"
    },
    "action-assign-manager": {
      "id": "action-assign-manager",
      "type": "action",
      "label": "Atribuir ao Gerente",
      "action": "assign_deal",
      "config": {
        "assigneeId": "manager-user-id",
        "teamId": "sales-team-id"
      },
      "nextId": "end-1"
    },
    "action-standard-email": {
      "id": "action-standard-email",
      "type": "action",
      "label": "Email Padrão",
      "action": "send_email",
      "config": {
        "emailTo": "{{email}}",
        "emailSubject": "Como está sua decisão, {{contactName}}?",
        "emailBody": "<p>Olá {{contactName}},</p><p>Vi que estamos negociando o <strong>{{title}}</strong>. Tem alguma dúvida que eu possa esclarecer?</p>"
      },
      "nextId": "action-standard-task"
    },
    "action-standard-task": {
      "id": "action-standard-task",
      "type": "action",
      "label": "Tarefa Padrão",
      "action": "create_task",
      "config": {
        "taskTitle": "Follow-up: {{title}}",
        "taskDescription": "Acompanhar negociação e responder dúvidas",
        "taskAssignee": "{{assigneeId}}",
        "taskDueDate": "3"
      },
      "nextId": "end-1"
    },
    "action-log-skip": {
      "id": "action-log-skip",
      "type": "action",
      "label": "Registrar Skip",
      "action": "create_activity",
      "config": {
        "activityType": "workflow_skipped",
        "activityDescription": "Nurturing não aplicado: condições não atendidas"
      },
      "nextId": "end-1"
    },
    "end-1": {
      "id": "end-1",
      "type": "end",
      "label": "Fim"
    }
  }
}
```

## Exemplo 3: Cadência de Vendas Completa (7 Dias)

Workflow complexo com múltiplos pontos de contato:

```json
{
  "id": "sales-cadence-7d-v1",
  "name": "Cadência de Vendas 7 Dias",
  "description": "Sequência automática de 3 emails espaçados ao longo de 7 dias",
  "isActive": true,
  "version": 1,
  "startNodeId": "trigger-1",
  "nodes": {
    "trigger-1": {
      "id": "trigger-1",
      "type": "trigger",
      "label": "Deal Criado",
      "trigger": "deal_created",
      "nextId": "action-email-1"
    },
    "action-email-1": {
      "id": "action-email-1",
      "type": "action",
      "label": "Email 1: Boas-vindas",
      "action": "send_email",
      "config": {
        "emailTo": "{{email}}",
        "emailSubject": "Bem-vindo, {{contactName}}!",
        "emailBody": "<p>Olá {{contactName}},</p><p>Obrigado pelo interesse! Vamos começar nossa jornada juntos.</p>"
      },
      "nextId": "delay-2d"
    },
    "delay-2d": {
      "id": "delay-2d",
      "type": "delay",
      "label": "Aguardar 2 Dias",
      "delayDays": 2,
      "nextId": "condition-still-active-1"
    },
    "condition-still-active-1": {
      "id": "condition-still-active-1",
      "type": "condition",
      "label": "Ainda Ativo?",
      "config": {
        "conditions": [
          {
            "field": "status",
            "operator": "equals",
            "value": "active"
          }
        ],
        "operator": "and"
      },
      "trueNextId": "action-email-2",
      "falseNextId": "end-converted"
    },
    "action-email-2": {
      "id": "action-email-2",
      "type": "action",
      "label": "Email 2: Conteúdo Educativo",
      "action": "send_email",
      "config": {
        "emailTo": "{{email}}",
        "emailSubject": "{{contactName}}, veja como podemos ajudar",
        "emailBody": "<p>Olá {{contactName}},</p><p>Preparei um material que pode te interessar...</p>"
      },
      "nextId": "delay-3d"
    },
    "delay-3d": {
      "id": "delay-3d",
      "type": "delay",
      "label": "Aguardar 3 Dias",
      "delayDays": 3,
      "nextId": "condition-still-active-2"
    },
    "condition-still-active-2": {
      "id": "condition-still-active-2",
      "type": "condition",
      "label": "Ainda Ativo?",
      "config": {
        "conditions": [
          {
            "field": "status",
            "operator": "equals",
            "value": "active"
          }
        ],
        "operator": "and"
      },
      "trueNextId": "action-email-3",
      "falseNextId": "end-converted"
    },
    "action-email-3": {
      "id": "action-email-3",
      "type": "action",
      "label": "Email 3: Call to Action",
      "action": "send_email",
      "config": {
        "emailTo": "{{email}}",
        "emailSubject": "Última chance: oferta especial para {{contactName}}",
        "emailBody": "<p>Olá {{contactName}},</p><p>Esta é sua última chance de aproveitar nossa oferta especial!</p>"
      },
      "nextId": "action-final-task"
    },
    "action-final-task": {
      "id": "action-final-task",
      "type": "action",
      "label": "Criar Tarefa Manual",
      "action": "create_task",
      "config": {
        "taskTitle": "Contato manual: {{title}}",
        "taskDescription": "Lead passou pela cadência de 7 dias sem conversão. Avaliar próximos passos.",
        "taskAssignee": "{{assigneeId}}",
        "taskDueDate": "1"
      },
      "nextId": "end-1"
    },
    "end-converted": {
      "id": "end-converted",
      "type": "end",
      "label": "Fim (Convertido)"
    },
    "end-1": {
      "id": "end-1",
      "type": "end",
      "label": "Fim (Cadência Completa)"
    }
  }
}
```

## Como Usar

### 1. Criar WorkflowDefinition no Firestore

```typescript
import { db } from './firebase/config';

const workflow = {
  // Use any of the JSON examples above
};

await db.collection('workflowDefinitions').add(workflow);
```

### 2. Enrollment será criado automaticamente

Quando um deal for criado/atualizado e atender às condições do trigger, o `workflowDealWatcher` criará automaticamente um enrollment:

```typescript
// Enrollment criado automaticamente
{
  id: "auto-generated-id",
  workflowId: "auto-followup-v1",
  targetType: "deal",
  targetId: "deal-123",
  status: "active",
  currentNodeId: "delay-1",
  visitedNodes: ["trigger-1"],
  executionPath: [...],
  context: {},
  startedAt: Timestamp.now(),
  errorCount: 0
}
```

### 3. O Engine executa automaticamente

O `workflowExecutionEngine` processa cada nó:
- **Actions**: Executados imediatamente
- **Conditions**: Avaliam e seguem true/false path
- **Delays**: Pausam (status='waiting') até nextExecutionAt
- **Scheduler**: Resume workflows pausados a cada minuto

## Variáveis Disponíveis

Use estas variáveis em emails, tarefas, etc:

- `{{contactName}}` - Nome do contato
- `{{email}}` - Email do contato
- `{{title}}` - Título do deal
- `{{value}}` - Valor do deal
- `{{status}}` - Status atual
- `{{stageId}}` - ID do stage
- `{{assigneeId}}` - ID do responsável
- `{{deal.customField}}` - Campos customizados
- `{{context.variableName}}` - Variáveis do contexto

## Operadores de Condição

- `equals`, `==`, `===` - Igual a
- `not_equals`, `!=`, `!==` - Diferente de
- `greater_than`, `>` - Maior que
- `less_than`, `<` - Menor que
- `greater_or_equal`, `>=` - Maior ou igual
- `less_or_equal`, `<=` - Menor ou igual
- `contains` - Contém (string)
- `not_contains` - Não contém
- `starts_with` - Começa com
- `ends_with` - Termina com
- `is_empty`, `is_null` - Vazio ou nulo
- `is_not_empty`, `is_not_null` - Não vazio
- `in` - Está em (array)
- `not_in` - Não está em (array)
- `matches_regex` - Regex match

## Triggers Disponíveis

- `deal_created` - Quando deal é criado
- `deal_updated` - Quando deal é atualizado (qualquer campo)
- `deal_status_changed` - Quando status muda (pode filtrar por statusValue)
- `deal_stage_changed` - Quando stage muda (pode filtrar por stageId)
- `contact_created` - Quando contato é criado (TODO)
- `task_completed` - Quando tarefa é completada (TODO)

## Monitoramento

Verifique a execução dos workflows:

```typescript
// Ver enrollments ativos
const enrollments = await db
  .collection('workflowEnrollments')
  .where('status', '==', 'active')
  .get();

// Ver histórico de execução
const enrollment = await db
  .collection('workflowEnrollments')
  .doc(enrollmentId)
  .get();

console.log(enrollment.data().executionPath); // Array com todos os nós executados
console.log(enrollment.data().visitedNodes); // Array com IDs visitados
console.log(enrollment.data().context); // Contexto atual

// Ver atividades criadas
const activities = await db
  .collection('activities')
  .where('source', '==', 'workflow')
  .orderBy('createdAt', 'desc')
  .get();
```
