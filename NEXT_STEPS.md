# 🚀 Próximos Passos - Integração Workflow Builder

## 📊 Situação Atual

### ✅ O que já está pronto:
- **Frontend completo** com React Flow, drag-and-drop, validações
- **Conversão Frontend → Backend** gerando estrutura de grafo (nextId, trueNextId, falseNextId)
- **Custom Nodes** incluindo ConditionNode com 2 saídas
- **UI/UX profissional** estilo HubSpot/Zapier

### ⚠️ O que precisa ser atualizado:
O **Backend (Firebase Functions)** atualmente:
- ✅ Executa steps sequencialmente (array com `order`)
- ❌ NÃO suporta estrutura de grafo (nextId, trueNextId, falseNextId)
- ❌ NÃO executa condições com caminhos true/false
- ❌ Delay não implementado com Cloud Tasks (só log)

---

## 🔧 OPÇÃO 1: Atualizar Backend para Grafo (Recomendado)

Esta é a opção mais robusta e escalável. Permite workflows complexos com condições.

### Passo 1: Atualizar `workflowEngine.ts`

**Arquivo:** `functions/src/automation/workflowEngine.ts`

```typescript
// SUBSTITUIR a função executeWorkflow() atual por:

interface WorkflowGraphNode {
  id: string;
  type: string;
  nextId?: string;         // Para nós lineares
  trueNextId?: string;     // Para condições (caminho verdadeiro)
  falseNextId?: string;    // Para condições (caminho falso)
  config: Record<string, any>;
}

interface WorkflowGraph {
  nodes: Record<string, WorkflowGraphNode>;
  triggerNodeId: string;   // Ponto de entrada
}

export async function executeWorkflow(
  workflowId: string,
  entityId: string,
  entityType: "contact" | "deal"
): Promise<void> {
  functions.logger.info(
    `Executing workflow ${workflowId} for ${entityType} ${entityId}`
  );

  try {
    const workflowDoc = await db.collection("workflows").doc(workflowId).get();

    if (!workflowDoc.exists) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflowData = workflowDoc.data();

    // Verificar se é formato novo (grafo) ou antigo (array)
    if (workflowData.graph) {
      // NOVO FORMATO: Executar como grafo
      await executeWorkflowGraph(
        workflowData.graph,
        entityId,
        entityType,
        workflowId
      );
    } else {
      // FORMATO ANTIGO: Executar sequencialmente (compatibilidade)
      await executeWorkflowLegacy(workflowData, entityId, entityType, workflowId);
    }

  } catch (error) {
    functions.logger.error(
      `Failed to execute workflow ${workflowId}:`,
      error
    );
    throw error;
  }
}

/**
 * Executa workflow no formato de grafo (NOVO)
 */
async function executeWorkflowGraph(
  graph: WorkflowGraph,
  entityId: string,
  entityType: "contact" | "deal",
  workflowId: string
): Promise<void> {

  const enrollmentRef = db.collection("workflow_enrollments").doc();
  await enrollmentRef.set({
    workflowId,
    entityId,
    entityType,
    status: "in_progress",
    currentNodeId: graph.triggerNodeId,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Começar pelo nó trigger
  let currentNodeId: string | undefined = graph.triggerNodeId;
  let executedNodes = new Set<string>(); // Prevenir loops infinitos

  while (currentNodeId) {
    // Proteção contra loops
    if (executedNodes.has(currentNodeId)) {
      throw new Error(`Loop detected at node ${currentNodeId}`);
    }
    executedNodes.add(currentNodeId);

    const node = graph.nodes[currentNodeId];

    if (!node) {
      throw new Error(`Node ${currentNodeId} not found in workflow graph`);
    }

    functions.logger.info(`Executing node: ${currentNodeId} (${node.type})`);

    try {
      // Executar o step
      const stepResult = await executeStep(
        node,
        entityId,
        entityType,
        workflowId
      );

      // Atualizar enrollment
      await enrollmentRef.update({
        currentNodeId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Determinar próximo nó
      if (node.type === "conditional") {
        // Nó de condição - avaliar e escolher caminho
        const conditionResult = await evaluateCondition(
          node.config,
          entityId,
          entityType
        );

        currentNodeId = conditionResult ? node.trueNextId : node.falseNextId;

        functions.logger.info(
          `Condition evaluated to ${conditionResult}, next node: ${currentNodeId}`
        );
      } else {
        // Nó linear - seguir para nextId
        currentNodeId = node.nextId;
      }

    } catch (error) {
      functions.logger.error(
        `Error executing node ${currentNodeId}:`,
        error
      );

      await enrollmentRef.update({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  }

  // Workflow completado
  await enrollmentRef.update({
    status: "completed",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info(`Workflow ${workflowId} completed successfully`);
}

/**
 * Executa workflow no formato antigo (array sequencial)
 * Mantido para compatibilidade com workflows existentes
 */
async function executeWorkflowLegacy(
  workflowData: any,
  entityId: string,
  entityType: "contact" | "deal",
  workflowId: string
): Promise<void> {
  // Copiar código atual do executeWorkflow() aqui
  // (linhas 65-132 do arquivo atual)
}

/**
 * Avalia uma condição e retorna true/false
 */
async function evaluateCondition(
  config: Record<string, any>,
  entityId: string,
  entityType: "contact" | "deal"
): Promise<boolean> {

  const { field, operator, value } = config;

  // Buscar entidade
  const entityDoc = await db.collection(entityType + "s").doc(entityId).get();

  if (!entityDoc.exists) {
    throw new Error(`${entityType} ${entityId} not found`);
  }

  const entityData = entityDoc.data();
  const fieldValue = entityData[field];

  // Avaliar condição baseado no operador
  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "not_equals":
      return fieldValue !== value;
    case "greater_than":
      return Number(fieldValue) > Number(value);
    case "less_than":
      return Number(fieldValue) < Number(value);
    case "contains":
      return String(fieldValue).includes(String(value));
    case "not_contains":
      return !String(fieldValue).includes(String(value));
    case "is_empty":
      return !fieldValue || fieldValue === "";
    case "is_not_empty":
      return fieldValue && fieldValue !== "";
    default:
      functions.logger.warn(`Unknown operator: ${operator}`);
      return false;
  }
}
```

### Passo 2: Atualizar o Frontend para salvar no formato correto

**Arquivo:** `src/pages/WorkflowBuilder.tsx`

Modificar a função `handleSave()` (linha 238):

```typescript
const handleSave = async (status: 'draft' | 'active' = 'draft') => {
  // ... validações existentes ...

  try {
    // Converter para backend format
    const backendNodes = convertFlowToBackend(nodes, edges);
    const triggerNodeId = findTriggerNodeId(nodes);

    if (!triggerNodeId) {
      toast.error('Workflow deve ter um nó Gatilho');
      return;
    }

    // NOVO: Criar estrutura de grafo
    const workflowData: CreateWorkflowInput = {
      name: workflowName,
      description: workflowDescription,
      status,
      trigger: {
        type: triggerType,
        conditions: {
          operator: 'AND',
          filters: [],
        },
      },
      // ADICIONAR: Estrutura de grafo
      graph: {
        nodes: backendNodes,
        triggerNodeId,
      },
      // MANTER: Array de steps para compatibilidade
      steps: nodes
        .filter((n) => n.type !== 'trigger')
        .map((node, index) => ({
          type: node.data.stepType as WorkflowStepType,
          config: node.data.config || {},
          order: index,
        })),
      enrollmentSettings: {
        allowReEnrollment: false,
        suppressForContacts: [],
      },
      createdBy: userDoc.id,
    };

    // Salvar...
  }
}
```

### Passo 3: Atualizar Types do TypeScript

**Arquivo:** `src/lib/types/workflow.types.ts`

```typescript
export interface WorkflowGraphNode {
  id: string;
  type: WorkflowStepType;
  nextId?: string;
  trueNextId?: string;
  falseNextId?: string;
  config: StepConfig;
}

export interface WorkflowGraph {
  nodes: Record<string, WorkflowGraphNode>;
  triggerNodeId: string;
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  status: 'draft' | 'active';
  trigger: WorkflowTrigger;
  graph?: WorkflowGraph;  // NOVO: Formato de grafo
  steps: WorkflowStep[];  // Mantido para compatibilidade
  enrollmentSettings: EnrollmentSettings;
  createdBy: string;
}
```

### Passo 4: Implementar Configuração de Condições

**Arquivo:** `src/components/workflows/StepConfigDialog.tsx`

Adicionar caso para `conditional` (linha ~956):

```typescript
const renderConditionalConfig = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="conditionField">Campo para Avaliar</Label>
      <Input
        id="conditionField"
        placeholder="Ex: status, value, stage"
        {...register('field')}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="conditionOperator">Operador</Label>
      <Select
        value={watch('operator') || 'equals'}
        onValueChange={(value: any) => setValue('operator', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">É igual a</SelectItem>
          <SelectItem value="not_equals">É diferente de</SelectItem>
          <SelectItem value="greater_than">É maior que</SelectItem>
          <SelectItem value="less_than">É menor que</SelectItem>
          <SelectItem value="contains">Contém</SelectItem>
          <SelectItem value="not_contains">Não contém</SelectItem>
          <SelectItem value="is_empty">Está vazio</SelectItem>
          <SelectItem value="is_not_empty">Não está vazio</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="conditionValue">Valor para Comparar</Label>
      <Input
        id="conditionValue"
        placeholder="Ex: won, 5000, approved"
        {...register('value')}
      />
    </div>
  </div>
);

// No switch do renderConfigForm():
case 'conditional':
  return renderConditionalConfig();
```

---

## 🔧 OPÇÃO 2: Adapter Pattern (Mais Rápido, Menos Robusto)

Se você quer testar rapidamente sem mexer muito no backend:

### Criar um Adapter no Frontend

**Arquivo:** `src/lib/utils/workflowAdapter.ts`

```typescript
/**
 * Converte estrutura de grafo para array sequencial
 * (Workaround temporário até backend suportar grafo)
 */
export function convertGraphToLegacySteps(
  nodes: Node[],
  edges: Edge[]
): WorkflowStep[] {
  const backendNodes = convertFlowToBackend(nodes, edges);
  const triggerNodeId = findTriggerNodeId(nodes);

  if (!triggerNodeId) {
    throw new Error('No trigger node found');
  }

  // Fazer BFS/DFS para linearizar o grafo
  const steps: WorkflowStep[] = [];
  const visited = new Set<string>();
  const queue = [triggerNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = backendNodes[currentId];

    steps.push({
      type: node.type,
      config: node.config,
      order: steps.length,
    });

    // Adicionar próximos nós à fila
    if (node.nextId) queue.push(node.nextId);
    if (node.trueNextId) queue.push(node.trueNextId);
    if (node.falseNextId) queue.push(node.falseNextId);
  }

  return steps;
}
```

**⚠️ Limitação:** Condições não funcionarão corretamente - os dois caminhos serão executados sequencialmente.

---

## 📝 Checklist de Implementação

### Backend (Firebase Functions)
- [ ] Atualizar `workflowEngine.ts` com função `executeWorkflowGraph()`
- [ ] Implementar `evaluateCondition()` para condições
- [ ] Adicionar `executeWorkflowLegacy()` para compatibilidade
- [ ] Testar execução de workflow linear
- [ ] Testar execução de workflow com condição
- [ ] Deploy das Functions: `firebase deploy --only functions`

### Frontend
- [ ] Atualizar `handleSave()` para enviar estrutura de grafo
- [ ] Atualizar types em `workflow.types.ts`
- [ ] Adicionar configuração de condições no `StepConfigDialog`
- [ ] Testar criação de workflow
- [ ] Testar edição de workflow
- [ ] Testar validações

### Firestore Structure
Exemplo de documento no formato novo:

```json
{
  "id": "workflow123",
  "name": "Lead Qualification",
  "status": "active",
  "trigger": {
    "type": "deal_created"
  },
  "graph": {
    "triggerNodeId": "node-1",
    "nodes": {
      "node-1": {
        "id": "node-1",
        "type": "send_email",
        "nextId": "node-2",
        "config": {
          "emailSubject": "Welcome!",
          "emailBody": "..."
        }
      },
      "node-2": {
        "id": "node-2",
        "type": "conditional",
        "trueNextId": "node-3",
        "falseNextId": "node-4",
        "config": {
          "field": "value",
          "operator": "greater_than",
          "value": 5000
        }
      },
      "node-3": {
        "id": "node-3",
        "type": "create_task",
        "config": {...}
      },
      "node-4": {
        "id": "node-4",
        "type": "send_notification",
        "config": {...}
      }
    }
  }
}
```

---

## 🧪 Testando

1. **Criar workflow de teste simples:**
   - Gatilho → Email → Task

2. **Criar workflow com condição:**
   - Gatilho → Condição → (Sim: Email) / (Não: Notificação)

3. **Verificar logs do Firebase:**
   ```bash
   firebase functions:log
   ```

4. **Verificar enrollments:**
   ```
   Firestore > workflow_enrollments
   ```

---

## 🚨 Importante

1. **Backup antes de mexer no backend:**
   ```bash
   firebase firestore:backup gs://your-bucket/backup-$(date +%Y%m%d)
   ```

2. **Testar em ambiente de desenvolvimento primeiro**

3. **Migração gradual:**
   - Manter formato antigo funcionando
   - Adicionar formato novo
   - Migrar workflows aos poucos

---

## 📞 Dúvidas?

Se tiver dúvidas sobre qualquer passo, é só perguntar! Posso:
- Implementar qualquer uma das funções acima
- Criar scripts de migração de workflows
- Adicionar testes automatizados
- Configurar Cloud Tasks para delays
- Melhorar a avaliação de condições

**Recomendação:** Comece pela **Opção 1** (atualizar backend), pois é a solução mais robusta e escalável! 🚀
