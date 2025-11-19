# 🔄 Sistema de Workflows e Automação

Documentação completa do **Workflow Engine** do CRM de Planejamento Financeiro.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Fundamentais](#conceitos-fundamentais)
3. [Estrutura de um Workflow](#estrutura-de-um-workflow)
4. [Tipos de Steps (Ações)](#tipos-de-steps-ações)
5. [Triggers (Gatilhos)](#triggers-gatilhos)
6. [Lógica Condicional](#lógica-condicional)
7. [Listas de Obrigatoriedade (Checklists)](#listas-de-obrigatoriedade-checklists)
8. [Sistema de Enrollment](#sistema-de-enrollment)
9. [Como Usar na Prática](#como-usar-na-prática)
10. [Arquitetura Técnica](#arquitetura-técnica)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Workflow Engine** é o coração da automação do CRM. Ele permite criar fluxos inteligentes que automatizam processos de vendas, onboarding de clientes, cobrança de prazos e muito mais.

### Funcionalidades Principais

✅ **Fluxos Inteligentes**
- Automação de múltiplos funis e processos
- Sequências de ações com delays programados
- Lógica condicional (if/then/else)
- Passagem de bastão automática

✅ **Listas de Obrigatoriedade**
- Checklists condicionais com 5 tipos de items
- Bloqueia avanço até items obrigatórios estarem completos
- Dependências entre items (A depende de B)
- Templates reutilizáveis

✅ **Ações Automáticas**
- Envio de emails
- Criação de tarefas
- Atualização de campos
- Webhooks externos
- Cobrança de prazos

---

## 📚 Conceitos Fundamentais

### Workflow

Um **workflow** é uma sequência automatizada de ações que são executadas quando determinadas condições são atendidas.

**Componentes:**
- **Trigger**: O que inicia o workflow (ex: novo contato criado)
- **Steps**: Ações executadas sequencialmente
- **Conditions**: Lógica condicional (if/then)
- **Enrollment Settings**: Regras de inscrição

### Enrollment (Inscrição)

Quando um contato "entra" em um workflow, criamos um **enrollment** que rastreia:
- Posição atual no workflow (qual step está executando)
- Status (active, completed, failed, unenrolled)
- Histórico de execução
- Metadata personalizada

### Checklist (Lista de Obrigatoriedade)

Um **checklist** é anexado a um workflow/deal/contact e contém:
- Items obrigatórios que bloqueiam progressão
- Items opcionais para tracking
- Lógica condicional (items aparecem só se condição for atendida)
- Dependências entre items

---

## 🏗️ Estrutura de um Workflow

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';

  // Gatilho que inicia o workflow
  trigger: {
    type: 'contact_created' | 'deal_stage_change' | 'manual_enrollment' | ...;
    conditions: WorkflowCondition; // Filtros para ativar
    schedule?: { ... }; // Para triggers agendados
  };

  // Sequência de ações
  steps: WorkflowStep[];

  // Configurações de inscrição
  enrollmentSettings: {
    allowReEnrollment: boolean;
    suppressForContacts: string[];
    goalCriteria?: WorkflowCondition; // Auto-unenroll quando goal atingido
  };

  // Estatísticas
  stats: {
    totalEnrolled: number;
    currentlyEnrolled: number;
    completed: number;
    goalsMet: number;
  };
}
```

---

## ⚡ Tipos de Steps (Ações)

### 1. **Delay (Espera)**

Aguarda um período de tempo antes de executar o próximo step.

```typescript
{
  type: 'delay',
  config: {
    delayType: 'duration',
    duration: { value: 2, unit: 'days' }
  }
}
```

**Variações:**
- `duration`: Espera X tempo (minutos, horas, dias, semanas)
- `until_date`: Espera até uma data específica
- `until_event`: Espera até um evento acontecer

---

### 2. **Send Email (Enviar Email)**

Envia um email para o contato.

```typescript
{
  type: 'send_email',
  config: {
    emailTemplateId: 'template-123',
    // OU
    emailSubject: 'Bem-vindo ao nosso serviço!',
    emailBody: '<html>...',
    fromName: 'Equipe CRM',
    replyTo: 'contato@empresa.com'
  }
}
```

**Features:**
- Templates reutilizáveis com variáveis
- Merge tags: `{{contact.firstName}}`, `{{deal.amount}}`
- Tracking de abertura e cliques (futuro)

---

### 3. **Create Task (Criar Tarefa)**

Cria uma tarefa para um usuário.

```typescript
{
  type: 'create_task',
  config: {
    taskTitle: 'Ligar para o cliente',
    taskDescription: 'Confirmar interesse no serviço',
    assignToOwnerId: true, // Atribui ao owner do contato
    // OU
    assignToUserId: 'user-123',
    taskDueIn: { value: 1, unit: 'days' }
  }
}
```

**Casos de uso:**
- Tarefas de follow-up
- Lembretes de cobrança
- Agendamento de reuniões

---

### 4. **Update Property (Atualizar Campo)**

Atualiza um campo do contato ou deal.

```typescript
{
  type: 'update_property',
  config: {
    propertyName: 'leadScore',
    propertyValue: 75
  }
}
```

**Exemplos:**
- Aumentar lead score após engagement
- Mudar status de deal
- Adicionar tags automaticamente

---

### 5. **Branch (Condição If/Then)**

Cria ramificações condicionais no workflow.

```typescript
{
  type: 'branch',
  config: {
    branches: [
      {
        id: 'high-score-branch',
        condition: {
          operator: 'AND',
          filters: [
            { property: 'leadScore', operator: 'greater_than', value: 70 }
          ]
        },
        steps: [
          // Steps para leads com score alto
        ]
      },
      {
        id: 'low-score-branch',
        condition: { ... },
        steps: [
          // Steps para leads com score baixo
        ]
      }
    ]
  }
}
```

**Uso:**
- Segmentar leads por qualificação
- Direcionar para diferentes sequências
- Personalizar comunicação

---

### 6. **Webhook (Integração Externa)**

Chama uma URL externa (ex: Zapier, Make.com, API própria).

```typescript
{
  type: 'webhook',
  config: {
    webhookUrl: 'https://api.empresa.com/webhook',
    webhookMethod: 'POST',
    webhookHeaders: {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json'
    },
    webhookBody: JSON.stringify({
      contactId: '{{contact.id}}',
      email: '{{contact.email}}'
    })
  }
}
```

---

### 7. **Add/Remove from List (Listas)**

Adiciona ou remove contato de listas de segmentação.

```typescript
{
  type: 'add_to_list',
  config: {
    listId: 'list-high-value-clients'
  }
}
```

---

## 🎯 Triggers (Gatilhos)

### Tipos de Triggers

| Trigger Type | Quando Dispara | Exemplo |
|--------------|----------------|---------|
| `contact_created` | Novo contato criado | Workflow de boas-vindas |
| `contact_property_change` | Campo de contato muda | Status vira "qualified" |
| `deal_stage_change` | Deal muda de estágio | Deal entra em "Proposta Feita" |
| `form_submission` | Formulário enviado | Lead do Meta Ads |
| `manual_enrollment` | Inscrição manual | Planejador adiciona contato |
| `scheduled` | Agendado (diário/semanal) | Relatórios automáticos |

### Exemplo de Trigger com Condições

```typescript
trigger: {
  type: 'contact_created',
  conditions: {
    operator: 'AND',
    filters: [
      { property: 'source', operator: 'equals', value: 'meta_ads' },
      { property: 'leadScore', operator: 'greater_than', value: 50 }
    ]
  }
}
```

**Significa:** "Dispara quando um novo contato é criado E veio do Meta Ads E tem lead score > 50"

---

## 🔀 Lógica Condicional

### Operadores de Condição

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `equals` | Igual a | status = 'client' |
| `not_equals` | Diferente de | source != 'spam' |
| `contains` | Contém | email contém '@gmail' |
| `not_contains` | Não contém | tags não contém 'blocked' |
| `greater_than` | Maior que | income > 5000 |
| `less_than` | Menor que | leadScore < 30 |
| `is_known` | Campo preenchido | CPF existe |
| `is_unknown` | Campo vazio | income não preenchido |
| `is_member_of_list` | Está na lista | list = 'vip-clients' |

### Operadores Lógicos

- **AND**: Todas as condições devem ser verdadeiras
- **OR**: Pelo menos uma condição deve ser verdadeira

### Exemplo Completo

```typescript
{
  operator: 'AND',
  filters: [
    { property: 'status', operator: 'equals', value: 'lead' },
    {
      operator: 'OR',
      filters: [
        { property: 'source', operator: 'equals', value: 'meta_ads' },
        { property: 'source', operator: 'equals', value: 'google_ads' }
      ]
    },
    { property: 'income', operator: 'greater_than', value: 3000 }
  ]
}
```

**Lê-se:** "Status é lead E (origem é Meta Ads OU Google Ads) E renda > 3000"

---

## ✅ Listas de Obrigatoriedade (Checklists)

### Conceito

**Checklists** são listas condicionais de items que **bloqueiam a progressão** em um workflow/deal até que todos os items obrigatórios estejam completos.

### 5 Tipos de Items

#### 1. **Action (Ação)**

Ação que precisa ser completada.

```typescript
{
  type: 'action',
  title: 'Enviar contrato por email',
  required: true,
  config: {
    actionType: 'manual',
    actionDetails: 'Enviar contrato assinado para análise'
  }
}
```

#### 2. **Question (Pergunta)**

Pergunta que precisa ser respondida.

```typescript
{
  type: 'question',
  title: 'Cliente confirmou orçamento?',
  required: true,
  config: {
    questionType: 'yes_no',
    answer: null // Será preenchido quando respondido
  }
}
```

**Tipos de pergunta:**
- `yes_no`: Sim/Não
- `multiple_choice`: Múltipla escolha
- `text`: Resposta livre

#### 3. **Data (Campo de Dados)**

Campo de dados que precisa ser preenchido.

```typescript
{
  type: 'data',
  title: 'CPF do Cliente',
  required: true,
  config: {
    fieldName: 'cpf',
    fieldType: 'cpf',
    fieldValue: null, // Será preenchido
    validation: {
      required: true,
      pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$'
    }
  }
}
```

**Tipos de campo:**
- `text`, `number`, `date`, `currency`
- `cpf`, `email`, `phone` (com validação automática)

#### 4. **Document (Documento)**

Documento que precisa ser enviado.

```typescript
{
  type: 'document',
  title: 'Comprovante de Renda',
  required: true,
  config: {
    documentType: 'Comprovante de Renda',
    fileUrl: null, // URL do arquivo após upload
    fileName: null
  }
}
```

#### 5. **Approval (Aprovação)**

Aprovação de um usuário específico.

```typescript
{
  type: 'approval',
  title: 'Aprovação do Gerente',
  required: true,
  config: {
    approverUserId: 'user-manager-123',
    approvedAt: null,
    approvalNotes: null
  }
}
```

---

### Lógica Condicional em Checklists

Items podem ter **condições** para aparecer:

```typescript
{
  type: 'data',
  title: 'Comprovante de Renda (se renda > R$ 5.000)',
  required: true,
  condition: {
    operator: 'AND',
    filters: [
      { property: 'income', operator: 'greater_than', value: 5000 }
    ]
  },
  config: { ... }
}
```

**Resultado:** Item só aparece se renda > R$ 5.000

---

### Dependências entre Items

Items podem **depender** de outros:

```typescript
{
  type: 'approval',
  title: 'Aprovação Final',
  required: true,
  dependsOn: ['item-cpf-id', 'item-comprovante-id'],
  config: { ... }
}
```

**Resultado:** Item de aprovação só aparece depois que CPF e Comprovante forem preenchidos

---

### Flag `canProgress`

O checklist calcula automaticamente se pode progredir:

```typescript
checklist.canProgress // true ou false
```

**`canProgress = true`** quando:
- Todos os items `required` estão `completed`
- Todos os items visíveis (respeitando condições) foram tratados

**Uso:**
```typescript
if (!checklist.canProgress) {
  // Bloqueia avanço no workflow
  toast.error('Complete todos os items obrigatórios antes de avançar');
  return;
}
```

---

## 👥 Sistema de Enrollment

### Estados de Enrollment

| Status | Descrição |
|--------|-----------|
| `active` | Contato inscrito e workflow executando |
| `completed` | Workflow completou todos os steps |
| `failed` | Workflow falhou (erro não recuperável) |
| `unenrolled` | Contato desinscrito manualmente |

### Enrollment Tracking

```typescript
interface WorkflowEnrollment {
  id: string;
  workflowId: string;
  contactId: string;
  status: 'active' | 'completed' | 'failed' | 'unenrolled';
  currentStepId?: string; // Step atual
  currentStepIndex: number; // Posição no workflow
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  metadata: Record<string, any>; // Dados customizados
}
```

### Re-enrollment

Workflows podem permitir re-inscrição:

```typescript
enrollmentSettings: {
  allowReEnrollment: true,
  reEnrollmentTrigger: 'property_change' // Re-inscreve se propriedade mudar
}
```

**Casos de uso:**
- Workflow de nurturing recorrente
- Campanhas sazonais
- Lembretes periódicos

---

## 💻 Como Usar na Prática

### 1. Criar um Workflow Simples

```typescript
import { useCreateWorkflow } from '@/lib/hooks';

const createWorkflow = useCreateWorkflow();

await createWorkflow.mutateAsync({
  name: 'Boas-vindas para Novos Leads',
  description: 'Sequência automática para novos leads do Meta Ads',
  status: 'draft',
  createdBy: userId,

  trigger: {
    type: 'contact_created',
    conditions: {
      operator: 'AND',
      filters: [
        { property: 'source', operator: 'equals', value: 'meta_ads' }
      ]
    }
  },

  steps: [
    {
      type: 'send_email',
      order: 0,
      config: {
        emailSubject: 'Bem-vindo!',
        emailBody: 'Olá {{contact.firstName}}, bem-vindo!'
      }
    },
    {
      type: 'delay',
      order: 1,
      config: {
        delayType: 'duration',
        duration: { value: 2, unit: 'days' }
      }
    },
    {
      type: 'create_task',
      order: 2,
      config: {
        taskTitle: 'Follow-up com {{contact.firstName}}',
        taskDescription: 'Ligar para entender necessidades',
        assignToOwnerId: true,
        taskDueIn: { value: 1, unit: 'days' }
      }
    }
  ],

  enrollmentSettings: {
    allowReEnrollment: false,
    suppressForContacts: []
  }
});
```

### 2. Ativar Workflow

```typescript
import { useActivateWorkflow } from '@/lib/hooks';

const activateWorkflow = useActivateWorkflow();

await activateWorkflow.mutateAsync(workflowId);
// Workflow agora está ativo e processará novos contatos automaticamente
```

### 3. Inscrever Contato Manualmente

```typescript
import { useManuallyEnrollContact } from '@/lib/hooks';

const enrollContact = useManuallyEnrollContact();

await enrollContact.mutateAsync({
  workflowId: 'workflow-123',
  contactId: 'contact-456'
});
```

### 4. Criar Checklist para Deal

```typescript
import { useCreateChecklist } from '@/lib/hooks';

const createChecklist = useCreateChecklist();

await createChecklist.mutateAsync({
  name: 'Documentação Obrigatória',
  entityType: 'deal',
  entityId: dealId,
  createdBy: userId,

  items: [
    {
      type: 'data',
      title: 'CPF do Cliente',
      required: true,
      order: 0,
      config: {
        fieldName: 'cpf',
        fieldType: 'cpf',
        validation: { required: true }
      }
    },
    {
      type: 'document',
      title: 'Comprovante de Residência',
      required: true,
      order: 1,
      dependsOn: [], // Não depende de nada
      config: {
        documentType: 'Comprovante de Residência'
      }
    },
    {
      type: 'approval',
      title: 'Aprovação do Gerente',
      required: true,
      order: 2,
      dependsOn: ['item-cpf', 'item-comprovante'],
      config: {
        approverUserId: managerId
      }
    }
  ]
});
```

### 5. Completar Item do Checklist

```typescript
import { useCompleteChecklistItem } from '@/lib/hooks';

const completeItem = useCompleteChecklistItem();

await completeItem.mutateAsync({
  checklistId: 'checklist-123',
  itemId: 'item-456',
  userId: currentUserId,
  answer: '123.456.789-00' // Valor do CPF
});
```

### 6. Verificar se Pode Progredir

```typescript
import { useCanProgressWithChecklist } from '@/lib/hooks';

const { data: canProgress } = useCanProgressWithChecklist(checklistId);

if (!canProgress) {
  // Bloqueia avanço
  const { data: incompleteItems } = useIncompleteRequiredItems(checklistId);

  alert(`Complete os seguintes items: ${incompleteItems.map(i => i.title).join(', ')}`);
}
```

---

## 🏛️ Arquitetura Técnica

### Componentes Principais

```
Frontend (React + Vite)
├── Services (workflowService.ts)
│   └── CRUD de workflows e enrollments
│
├── Hooks (useWorkflows.ts)
│   └── React Query integration
│
└── Components
    ├── WorkflowList
    ├── WorkflowBuilder (React Flow)
    └── ChecklistComponent

Backend (Firebase Functions)
├── Automation Engine
│   ├── Trigger Detection
│   ├── Condition Evaluation
│   ├── Step Execution
│   └── Error Handling
│
├── Cloud Tasks (Scheduling)
│   └── Delayed steps
│
└── Firestore Triggers
    └── Auto-enrollment

Database (Firestore)
├── workflows/
├── workflow_enrollments/
├── checklists/
├── checklist_templates/
└── automation_logs/
```

### Fluxo de Execução

```
1. Trigger Detectado (ex: novo contato)
   ↓
2. Busca Workflows Ativos com trigger matching
   ↓
3. Avalia Condições do Trigger
   ↓
4. Cria Enrollment (se passou nas condições)
   ↓
5. Executa Step 0
   ↓
6. Se step é delay → Agenda Cloud Task
   Se step é email → Envia imediatamente
   Se step é task → Cria atividade
   ↓
7. Atualiza currentStepIndex
   ↓
8. Repete até terminar todos steps
   ↓
9. Marca enrollment como completed
```

---

## 🔧 Troubleshooting

### Workflow não está disparando

**Checklist:**
- [ ] Workflow está com status 'active'?
- [ ] Trigger conditions estão corretas?
- [ ] Contato atende aos filtros do trigger?
- [ ] Firestore triggers estão funcionando?

**Solução:**
```typescript
// Verificar se workflow está ativo
const workflow = await getWorkflow(workflowId);
console.log('Status:', workflow.status); // Deve ser 'active'

// Testar condições manualmente
const contact = await getContact(contactId);
// Verificar se contact passa nos filtros
```

### Contato não progride no workflow

**Causas possíveis:**
1. Checklist com items required não completos
2. Step com delay ainda aguardando
3. Erro na execução de um step

**Solução:**
```typescript
// Verificar enrollment
const enrollments = await getContactEnrollments(contactId);
console.log('Enrollment status:', enrollments[0].status);
console.log('Current step:', enrollments[0].currentStepIndex);

// Verificar checklist
const checklist = await getChecklist(checklistId);
console.log('Can progress?', checklist.canProgress);
console.log('Incomplete items:', checklist.items.filter(i => i.required && i.status !== 'completed'));
```

### Checklist não bloqueia avanço

**Causa:** Flag `required: false` ou lógica não implementada no frontend

**Solução:**
```typescript
// Sempre verificar antes de avançar
const canProgress = await canProgressWithChecklist(checklistId);

if (!canProgress) {
  const incompleteItems = await getIncompleteRequiredItems(checklistId);

  toast.error(
    `Complete os items obrigatórios: ${incompleteItems.map(i => i.title).join(', ')}`
  );

  return; // Bloqueia ação
}

// Só avança se canProgress = true
await moveDealToNextStage(dealId);
```

---

## 📖 Recursos Adicionais

### Documentação Relacionada

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura completa do sistema
- [README.md](./README.md) - Setup e instalação
- [API.md](./API.md) - Documentação da API (futuro)

### Exemplos de Workflows Prontos

1. **Nurturing de Lead Frio**
   - Email inicial → Delay 3 dias → Email follow-up → Delay 7 dias → Task para ligar

2. **Onboarding de Cliente**
   - Email boas-vindas → Criar checklist documentação → Task reunião → Email tutorial

3. **Cobrança de Prazos**
   - Trigger: task vencida → Email lembrete → Delay 1 dia → Email urgente → Task para gerente

4. **Qualificação de Lead**
   - Branch por lead score → Score alto = Atribui para vendedor → Score baixo = Nurturing automático

---

## ✨ Próximas Features (Roadmap)

- [ ] Visual Workflow Builder (React Flow)
- [ ] A/B Testing de workflows
- [ ] Analytics avançado (taxas de conversão por step)
- [ ] Templates de workflows prontos
- [ ] Integração com WhatsApp
- [ ] Gatilhos baseados em eventos externos
- [ ] Machine Learning para otimização de timing

---

**Versão:** 1.0.0
**Última Atualização:** 2025-11-19
**Autor:** Time de Desenvolvimento CRM
