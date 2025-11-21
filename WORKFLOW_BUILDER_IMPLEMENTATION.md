# Workflow Builder - Implementação Completa

## 📋 Visão Geral

Implementação de um **Workflow Builder visual de nível empresarial** usando React Flow e shadcn/ui, similar ao HubSpot e Zapier. O sistema permite criar fluxos de trabalho complexos através de uma interface drag-and-drop profissional.

---

## 🎯 Arquivos Criados

### 1. **CustomNodes.tsx** (`src/components/workflows/CustomNodes.tsx`)
Componentes visuais customizados para cada tipo de nó:

#### **TriggerNode**
- Nó de início do workflow
- Apenas 1 saída (source handle)
- Cor verde para identificação
- Ícone: Play

#### **ActionNode**
- Nó padrão para ações
- 1 entrada (target) + 1 saída (source)
- Cores categorizadas por tipo de ação
- Ícones específicos por tipo

#### **DelayNode**
- Nó de espera/delay
- 1 entrada + 1 saída
- Exibe tempo configurado (minutos/horas/dias)
- Cor amarela
- Ícone: Clock

#### **ConditionNode** ⚠️ **CRÍTICO**
- Nó de ramificação (If/Else)
- 1 entrada + **2 saídas**
- Handle "true" (ID: "true", cor verde, label "Sim")
- Handle "false" (ID: "false", cor vermelha, label "Não")
- Cor rosa para identificação
- Ícone: GitBranch

**Detalhe Importante:** Os handles têm `position` e `id` corretos, essenciais para a conversão Backend.

---

### 2. **WorkflowSidebar.tsx** (`src/components/workflows/WorkflowSidebar.tsx`)
Sidebar lateral com componentes arrastáveis:

#### Funcionalidades:
- Componentes organizados por categorias:
  - **Início**: Gatilho
  - **Deal**: Atribuir, Criar, Atualizar, Mover etapa
  - **Tarefa**: Criar, Completar
  - **Comunicação**: Email, WhatsApp, Notificação
  - **Rastreamento**: Contador, SLA, Atividade
  - **Controle**: Delay, Condição
  - **Integração**: Webhook

#### UX:
- Seções colapsáveis
- Badge com contagem de componentes
- Drag-and-drop nativo
- Instruções de uso
- Visual profissional com shadcn/ui Cards

---

### 3. **useWorkflowStore.ts** (`src/lib/stores/useWorkflowStore.ts`)
Store Zustand para gerenciamento de estado:

#### Estado:
```typescript
{
  nodes: Node[]           // Nós do React Flow
  edges: Edge[]           // Conexões do React Flow
  selectedNodeId: string | null
}
```

#### Ações:
- `setNodes()` / `setEdges()`: Setters básicos
- `onNodesChange()` / `onEdgesChange()`: Handlers do React Flow
- `onConnect()`: Conecta nós
- `addNode()`: Adiciona novo nó (com auto-posicionamento e auto-conexão)
- `updateNodeConfig()`: Atualiza configuração do nó
- `deleteNode()`: Remove nó e suas conexões
- `clearWorkflow()`: Limpa tudo
- `getSelectedNode()`: Retorna nó selecionado

---

### 4. **workflowConverter.ts** (`src/lib/utils/workflowConverter.ts`) ⚠️ **MAIS IMPORTANTE**

Este é o arquivo mais crítico do sistema. Contém toda a lógica de conversão e validação.

#### **Estrutura Backend Esperada:**
```typescript
interface BackendNode {
  id: string;
  type: string;              // WorkflowStepType
  nextId?: string;           // Para nós lineares
  trueNextId?: string;       // Para condições (caminho SIM)
  falseNextId?: string;      // Para condições (caminho NÃO)
  config: StepConfig;        // Dados do property editor
}
```

#### **Função: `validateWorkflow()`**
Validações antes de salvar:

1. ✅ Deve ter pelo menos um nó
2. ✅ Deve ter exatamente um nó Gatilho
3. ✅ Não pode ter nós órfãos (sem conexões)
4. ✅ Nós de Condição devem ter ambos os caminhos (true E false) conectados
5. ✅ Todos os nós devem ser alcançáveis a partir do Gatilho (BFS)

**Retorna:**
```typescript
{
  isValid: boolean;
  errors: ValidationError[];
}
```

#### **Função: `convertFlowToBackend()` ⚠️ CRÍTICA**
Converte a estrutura do React Flow para o formato esperado pelo Backend.

**Algoritmo:**
```typescript
Para cada nó:
  1. Encontrar todas as edges saindo dele (outgoingEdges)
  2. Criar objeto base { id, type, config }
  3. Se nó é CONDITION:
     - Encontrar edge com sourceHandle === "true" → trueNextId
     - Encontrar edge com sourceHandle === "false" → falseNextId
  4. Se nó é LINEAR (action, delay, trigger):
     - Pegar primeira edge → nextId
  5. Adicionar ao objeto Record<id, BackendNode>
```

**Entrada:**
```typescript
nodes: Node[] = [
  { id: "n1", type: "trigger", data: {...} },
  { id: "n2", type: "action", data: {...} },
  { id: "n3", type: "condition", data: {...} },
  { id: "n4", type: "action", data: {...} },
  { id: "n5", type: "action", data: {...} }
]

edges: Edge[] = [
  { source: "n1", target: "n2", sourceHandle: "output" },
  { source: "n2", target: "n3", sourceHandle: "output" },
  { source: "n3", target: "n4", sourceHandle: "true" },
  { source: "n3", target: "n5", sourceHandle: "false" }
]
```

**Saída:**
```typescript
{
  "n1": { id: "n1", type: "trigger", nextId: "n2", config: {...} },
  "n2": { id: "n2", type: "send_email", nextId: "n3", config: {...} },
  "n3": {
    id: "n3",
    type: "conditional",
    trueNextId: "n4",
    falseNextId: "n5",
    config: {...}
  },
  "n4": { id: "n4", type: "create_task", config: {...} },
  "n5": { id: "n5", type: "send_notification", config: {...} }
}
```

#### **Função: `convertBackendToFlow()`**
Faz o caminho reverso: Backend → React Flow (para carregar workflows existentes).

#### **Função: `findTriggerNodeId()`**
Encontra o ID do nó gatilho (ponto de entrada do workflow).

---

### 5. **WorkflowBuilder.tsx** (`src/pages/WorkflowBuilder.tsx`)
Componente principal que integra tudo:

#### Estrutura:
```
┌─────────────────────────────────────────────────────────┐
│                    Header + Actions                      │
├──────────┬──────────────────────────────┬───────────────┤
│          │                              │               │
│ Sidebar  │      React Flow Canvas       │  Properties   │
│  (Drag)  │     (Drop Zone + Nodes)      │    Sidebar    │
│          │                              │               │
└──────────┴──────────────────────────────┴───────────────┘
```

#### Funcionalidades:

**1. Drag & Drop:**
- `onDragOver()`: Permite drop
- `onDrop()`:
  - Lê dados do `dataTransfer`
  - Converte coordenadas tela → flow
  - Cria novo nó na posição
  - Adiciona ao store

**2. Configuração de Nós:**
- Clique no nó → seleciona
- Botão "Configurar" → abre `StepConfigDialog`
- Salva config no `node.data.config`

**3. Salvamento:**
```typescript
async handleSave(status: 'draft' | 'active') {
  // 1. Validação básica (nome, nós existentes)
  // 2. validateWorkflow(nodes, edges)
  // 3. Se inválido → mostra AlertDialog com erros
  // 4. Se válido:
  //    - convertFlowToBackend(nodes, edges)
  //    - Monta CreateWorkflowInput
  //    - Chama API (create ou update)
  //    - Navega para lista ou mostra sucesso
}
```

**4. State Management:**
- Usa `useWorkflowStore()` (Zustand)
- React Flow integrado com store
- Estado sincronizado automaticamente

---

### 6. **workflow-builder.css** (`src/styles/workflow-builder.css`)
Estilos customizados para melhorar UX:

- Handles mais visíveis e bonitos
- Animações suaves
- Cores do tema shadcn/ui
- Hover effects
- Selection ring
- Controls estilizados
- Cursor feedback (grab/grabbing)

---

## 🎨 Visual & UX

### Cores dos Nós por Categoria:
- **Gatilho**: Verde esmeralda (`emerald`)
- **Deal**: Azul (`blue`)
- **Tarefa**: Verde (`green`)
- **Comunicação**: Roxo (`purple`)
- **Rastreamento**: Laranja (`orange`)
- **Delay**: Amarelo (`yellow`)
- **Condição**: Rosa (`pink`)
- **Integração**: Índigo (`indigo`)

### Feedback Visual:
- ✅ Checkmark verde quando nó está configurado
- 🎯 Ring de seleção no nó ativo
- 🎨 Cores nos handles (verde=true, vermelho=false)
- 🔄 Animações nas conexões
- 💫 Sombras e hover effects

---

## 🔧 Stack Técnica

```json
{
  "reactflow": "^11.11.4",
  "zustand": "^5.0.2",
  "shadcn/ui": "latest",
  "lucide-react": "icons",
  "react-hook-form": "forms",
  "zod": "validation"
}
```

---

## 📦 Estrutura de Arquivos

```
src/
├── components/
│   └── workflows/
│       ├── CustomNodes.tsx          # Nós visuais customizados
│       ├── WorkflowSidebar.tsx      # Sidebar drag-and-drop
│       └── StepConfigDialog.tsx     # Property editor (já existia)
│
├── lib/
│   ├── stores/
│   │   └── useWorkflowStore.ts      # State management (Zustand)
│   └── utils/
│       └── workflowConverter.ts     # Conversão + Validação CRÍTICA
│
├── pages/
│   └── WorkflowBuilder.tsx          # Componente principal
│
└── styles/
    └── workflow-builder.css         # Estilos customizados
```

---

## 🚀 Como Usar

### 1. Criar Novo Workflow:
1. Navegue para `/workflows/new`
2. Preencha nome, descrição e gatilho na sidebar direita
3. Arraste componentes da sidebar esquerda para o canvas
4. Conecte os nós clicando e arrastando dos handles
5. Clique em cada nó para configurar
6. Clique em "Salvar e Ativar"

### 2. Editar Workflow Existente:
1. Navegue para `/workflows/:id/edit`
2. O workflow será carregado automaticamente
3. Modifique conforme necessário
4. Salve as alterações

---

## ⚠️ Pontos Críticos de Atenção

### 1. **Handles do ConditionNode**
Os handles DEVEM ter IDs corretos:
```tsx
<Handle id="true" /> // Caminho SIM
<Handle id="false" /> // Caminho NÃO
```

### 2. **Validação Obrigatória**
Sempre validar antes de salvar:
```typescript
const validation = validateWorkflow(nodes, edges);
if (!validation.isValid) {
  // Mostrar erros
  return;
}
```

### 3. **Conversão para Backend**
Usar a função fornecida:
```typescript
const backendNodes = convertFlowToBackend(nodes, edges);
// backendNodes agora tem nextId, trueNextId, falseNextId
```

### 4. **Step Type vs Node Type**
- `node.type`: Tipo visual ("trigger", "action", "delay", "condition")
- `node.data.stepType`: Tipo de ação do backend ("send_email", "create_task", etc.)

---

## 🎯 Fluxo de Dados

```
┌─────────────┐
│   Sidebar   │ (Drag)
│ Components  │
└──────┬──────┘
       │ onDrop
       ↓
┌─────────────────┐
│  Zustand Store  │ ← → React Flow Canvas
│  (nodes, edges) │
└────────┬────────┘
         │ Save
         ↓
┌─────────────────┐
│  Validation     │
│ (validateFlow)  │
└────────┬────────┘
         │ Valid?
         ↓
┌─────────────────┐
│  Conversion     │
│ (convertToBack) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Backend API   │
│  (Firebase)     │
└─────────────────┘
```

---

## 🧪 Testes Recomendados

1. ✅ Criar workflow linear simples
2. ✅ Criar workflow com condição (dois caminhos)
3. ✅ Tentar salvar com nó órfão (deve falhar)
4. ✅ Tentar salvar condição sem caminho false (deve falhar)
5. ✅ Deletar nós e verificar edges removidas
6. ✅ Carregar workflow existente
7. ✅ Configurar cada tipo de nó
8. ✅ Drag and drop de múltiplos nós
9. ✅ Conectar nós manualmente

---

## 🎉 Conclusão

Implementação completa de um Workflow Builder enterprise-grade com:

✅ Interface drag-and-drop profissional
✅ Nós customizados com shadcn/ui
✅ Nós de condição com duas saídas (true/false)
✅ Conversão correta para formato Backend
✅ Validação robusta antes de salvar
✅ State management com Zustand
✅ Visual limpo e profissional (HubSpot/Zapier style)
✅ Código TypeScript type-safe
✅ Documentação completa

O sistema está pronto para uso em produção!

---

## 📞 Suporte

Para dúvidas sobre a implementação:
1. Consulte este documento
2. Revise os comentários no código
3. Verifique os tipos TypeScript
4. Teste com console.log() na função de conversão

**Autor:** Claude (Anthropic)
**Data:** 2025-11-21
**Versão:** 1.0.0
