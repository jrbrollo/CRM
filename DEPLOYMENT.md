# 🚀 Guia de Deploy - CRM Workflow Automation

Este guia cobre todos os passos necessários para deploy completo da aplicação em produção.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Firebase](#configuração-do-firebase)
3. [Deploy do Frontend](#deploy-do-frontend)
4. [Deploy das Cloud Functions](#deploy-das-cloud-functions)
5. [Configuração do Firestore](#configuração-do-firestore)
6. [Testes](#testes)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)

---

## 🛠️ Pré-requisitos

### Software Necessário

```bash
# Node.js 18+
node --version  # v18.0.0 ou superior

# Firebase CLI
npm install -g firebase-tools

# Git
git --version
```

### Contas Necessárias

- [ ] Conta Google/Firebase
- [ ] Projeto Firebase criado
- [ ] Billing habilitado (para Cloud Functions)

---

## 🔥 Configuração do Firebase

### 1. Login no Firebase

```bash
firebase login
```

### 2. Inicializar Projeto

```bash
# No diretório raiz do projeto
firebase init
```

Selecione:
- ✅ Hosting
- ✅ Functions
- ✅ Firestore
- ✅ Storage

### 3. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha com suas credenciais do Firebase Console:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 4. Configurar Firebase Admin (Cloud Functions)

No Firebase Console → Project Settings → Service Accounts:
1. Gere uma nova chave privada
2. Baixe o arquivo JSON
3. **NÃO COMMITE** este arquivo no Git!

```bash
# Opcional: Configure localmente para desenvolvimento
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

---

## 🌐 Deploy do Frontend

### 1. Build de Produção

```bash
# Instalar dependências
npm install

# Build
npm run build

# Preview local (opcional)
npm run preview
```

### 2. Testar Localmente

```bash
# Testar com Firebase Hosting Emulator
firebase serve
```

Acesse: `http://localhost:5000`

### 3. Deploy

```bash
firebase deploy --only hosting
```

Sua aplicação estará disponível em: `https://seu-projeto.web.app`

---

## ⚡ Deploy das Cloud Functions

### 1. Instalar Dependências das Functions

```bash
cd functions
npm install
cd ..
```

### 2. Build das Functions

```bash
cd functions
npm run build
cd ..
```

### 3. Testar Localmente (Opcional)

```bash
# Iniciar emuladores
firebase emulators:start

# Ou apenas Functions
firebase emulators:start --only functions
```

### 4. Deploy das Functions

```bash
# Deploy todas as functions
firebase deploy --only functions

# Ou deploy individual
firebase deploy --only functions:onContactCreated
```

**⚠️ IMPORTANTE**: Deploy de Functions requer **Blaze Plan** (pay-as-you-go)

### 5. Verificar Deploy

```bash
# Listar functions deployadas
firebase functions:list

# Ver logs
firebase functions:log
```

---

## 🗄️ Configuração do Firestore

### 1. Firestore Security Rules

Crie/atualize `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isPlanner() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'planner'];
    }

    function isOwner(ownerId) {
      return isAuthenticated() && request.auth.uid == ownerId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Contacts collection
    match /contacts/{contactId} {
      allow read: if isAuthenticated();
      allow create: if isPlanner();
      allow update: if isPlanner();
      allow delete: if isAdmin();
    }

    // Deals collection
    match /deals/{dealId} {
      allow read: if isAuthenticated();
      allow create: if isPlanner();
      allow update: if isPlanner();
      allow delete: if isAdmin();
    }

    // Workflows collection
    match /workflows/{workflowId} {
      allow read: if isAuthenticated();
      allow write: if isPlanner();
    }

    // Activities collection
    match /activities/{activityId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isPlanner();
    }

    // Pipelines collection
    match /pipelines/{pipelineId} {
      allow read: if isAuthenticated();
      allow write: if isPlanner();
    }

    // Checklists collection
    match /checklists/{checklistId} {
      allow read: if isAuthenticated();
      allow write: if isPlanner();
    }

    // Workflow enrollments
    match /workflow_enrollments/{enrollmentId} {
      allow read: if isAuthenticated();
      allow create: if isPlanner();
      allow update: if isPlanner();
      allow delete: if isAdmin();
    }
  }
}
```

### 2. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Firestore Indexes

Crie `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "contacts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "contacts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "deals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "pipelineId", "order": "ASCENDING" },
        { "fieldPath": "stageId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workflows",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "trigger.type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entityType", "order": "ASCENDING" },
        { "fieldPath": "entityId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 4. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

**⚠️ Nota**: Indexes podem levar alguns minutos para serem criados

---

## 🧪 Testes

### 1. Testes Unitários

```bash
npm test
```

### 2. Testes E2E (Opcional)

```bash
npm run test:e2e
```

### 3. Testes de Integração Firebase

```bash
# Usar emulators
firebase emulators:start

# Em outro terminal
npm run test:integration
```

---

## 📊 Monitoramento

### 1. Firebase Console

Acesse: https://console.firebase.google.com

Monitore:
- **Authentication**: Usuários ativos
- **Firestore**: Leituras/escritas
- **Functions**: Execuções, erros, latência
- **Hosting**: Tráfego, banda
- **Performance**: Core Web Vitals

### 2. Logs das Functions

```bash
# Ver logs em tempo real
firebase functions:log --only onContactCreated

# Ver logs de todas as functions
firebase functions:log
```

### 3. Alertas (Recomendado)

Configure alertas no Firebase Console:
- Erros em Cloud Functions
- Picos de uso
- Quotas próximas do limite

---

## 🔧 Troubleshooting

### Problema: "Permission denied" no Firestore

**Solução**:
1. Verifique as Security Rules
2. Confirme que o usuário está autenticado
3. Verifique o role do usuário

```bash
firebase deploy --only firestore:rules
```

### Problema: Cloud Function timeout

**Solução**:
1. Aumente o timeout na configuração:

```typescript
export const myFunction = functions
  .runWith({ timeoutSeconds: 540 }) // 9 minutos
  .https.onCall(async (data, context) => {
    // ...
  });
```

2. Otimize queries do Firestore
3. Use batching para operações em massa

### Problema: "Index required" error

**Solução**:
O erro mostra um link direto para criar o index. Clique no link ou:

```bash
firebase deploy --only firestore:indexes
```

### Problema: Environment variables não carregam

**Solução**:
1. Verifique se o arquivo `.env` existe
2. Variáveis devem começar com `VITE_`
3. Reinicie o servidor de desenvolvimento

```bash
npm run dev
```

### Problema: Firebase Functions cold start lento

**Solução**:
1. Use "keep-alive" para functions críticas
2. Configure mínimo de instâncias:

```typescript
export const criticalFunction = functions
  .runWith({
    minInstances: 1,
    maxInstances: 10
  })
  .https.onCall(async (data, context) => {
    // ...
  });
```

---

## 🎯 Deploy Completo (Checklist)

Execute em ordem:

```bash
# 1. Build do frontend
npm run build

# 2. Build das functions
cd functions && npm run build && cd ..

# 3. Deploy tudo
firebase deploy

# 4. Verificar
firebase functions:list
firebase hosting:sites:list
```

---

## 🔒 Segurança em Produção

### Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Security Rules testadas
- [ ] Service Account Key NÃO commitada
- [ ] HTTPS ativado (automático no Firebase)
- [ ] CORS configurado nas functions
- [ ] Rate limiting configurado (opcional)
- [ ] Backup automático ativado

### Backup do Firestore

Configure backup automático:

```bash
# Via gcloud (requer Cloud Shell)
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=weekly \
  --retention=4w
```

---

## 📚 Recursos Adicionais

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Security Rules Guide](https://firebase.google.com/docs/rules)

---

## 🆘 Suporte

Se encontrar problemas:
1. Consulte [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Consulte [WORKFLOWS.md](./WORKFLOWS.md)
3. Verifique os logs: `firebase functions:log`
4. Abra uma issue no repositório

---

**Última atualização**: 2025-11-19
