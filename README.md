# 🔥 CRM Pro - Workflow Automation System

Sistema completo de CRM com automação de workflows similar ao HubSpot, desenvolvido com React + Firebase.

## ⚡ Quick Start (3 Comandos!)

```bash
# 1. Setup completo automático
./setup-firebase.sh

# 2. Editar variáveis de ambiente
nano .env

# 3. Iniciar desenvolvimento
./scripts/dev.sh
```

Pronto! Acesse: http://localhost:5173

---

## 🎯 Features Principais

- ✅ **Workflow Engine** - Automação similar ao HubSpot
- ✅ **Visual Builder** - Editor drag-and-drop com React Flow
- ✅ **9 Tipos de Steps** - Email, WhatsApp, Tasks, Delays, Webhooks, etc
- ✅ **Triggers Automáticos** - Auto-execute workflows
- ✅ **RBAC** - Role-based access control (admin, planner, viewer)
- ✅ **Real-time** - Firebase Firestore real-time updates
- ✅ **12 Cloud Functions** - Backend serverless
- ✅ **TypeScript 100%** - Type-safe end-to-end
- ✅ **React Query** - Smart caching and state management

---

## 📋 Pré-requisitos

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- Conta Firebase ([create here](https://console.firebase.google.com))
- Git

---

## 🚀 Setup Completo (Método Automático)

### Opção 1: Script Automatizado (Recomendado)

```bash
# Clonar repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Executar setup automático
./setup-firebase.sh

# Seguir as instruções no terminal
```

O script faz tudo automaticamente:
- Instala Firebase CLI
- Faz login
- Configura projeto
- Deploy de rules e indexes
- Build e deploy (opcional)

### Opção 2: Manual

Se preferir fazer manualmente, consulte [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🛠️ Desenvolvimento

### Iniciar Ambiente de Desenvolvimento

```bash
# Inicia Firebase Emulators + Vite dev server
./scripts/dev.sh
```

Isso abre:
- 📱 Frontend: http://localhost:5173
- 🔥 Emulator UI: http://localhost:4000
- 🗄️ Firestore: http://localhost:8080
- ⚡ Functions: http://localhost:5001

### Comandos Úteis

```bash
# Development
npm run dev              # Apenas Vite dev server
npm run build            # Build de produção
npm run preview          # Preview do build

# Firebase
firebase emulators:start # Apenas emulators
firebase deploy          # Deploy completo
firebase functions:log   # Ver logs das functions

# Scripts personalizados
./scripts/dev.sh         # Dev completo (emulators + vite)
./scripts/deploy.sh      # Deploy automático
./scripts/create-admin.sh # Helper para criar admin
```

---

## 🌐 Deploy em Produção

```bash
# Build e deploy automático
./scripts/deploy.sh
```

Ou manualmente:
```bash
npm run build
firebase deploy
```

Consulte [DEPLOYMENT.md](./DEPLOYMENT.md) para guia completo.

---

## 👑 Criar Primeiro Usuário Admin

```bash
# Helper script com instruções
./scripts/create-admin.sh
```

Ou manualmente:
1. Acesse `/login` → "Criar Conta"
2. Crie sua conta
3. No Firebase Console:
   - Firestore → users → [seu_user_id]
   - Edite `role` para `"admin"`

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guia completo de deploy (600+ linhas) |
| [WORKFLOWS.md](./WORKFLOWS.md) | Sistema de workflows (700+ linhas) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura do sistema (300+ linhas) |
| [scripts/README.md](./scripts/README.md) | Documentação dos scripts |

---

## 🏗️ Estrutura do Projeto

```
CRM/
├── src/
│   ├── pages/           # Páginas React
│   │   ├── Login.tsx
│   │   ├── Workflows.tsx
│   │   ├── WorkflowBuilder.tsx
│   │   ├── Activities.tsx
│   │   ├── Contacts.tsx
│   │   └── Deals.tsx
│   ├── lib/
│   │   ├── firebase/    # Config Firebase
│   │   ├── services/    # Business logic (6 services)
│   │   ├── hooks/       # React Query hooks (60+)
│   │   ├── types/       # TypeScript types (70+)
│   │   └── validators/  # Zod schemas
│   ├── contexts/        # React contexts
│   └── components/      # UI components
├── functions/           # Cloud Functions
│   └── src/
│       ├── automation/  # Workflow engine
│       └── api/         # API endpoints
├── scripts/             # Automation scripts
│   ├── dev.sh
│   ├── deploy.sh
│   └── create-admin.sh
├── setup-firebase.sh    # Setup automático
├── firebase.json        # Firebase config
├── firestore.rules      # Security rules
└── firestore.indexes.json # Performance indexes
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Com Firebase Emulators
firebase emulators:exec "npm test"
```

---

## 🔐 Security

- **Firestore Rules**: RBAC implementado
- **Authentication**: Firebase Auth
- **Environment Variables**: Nunca commite `.env`!
- **Service Account**: Nunca commite keys JSON!

---

## 📊 Status do Projeto

| Componente | Status |
|------------|--------|
| Frontend | ✅ 95% |
| Backend (Functions) | ✅ 95% |
| Documentation | ✅ 100% |
| Tests | 🟡 40% |
| **TOTAL** | ✅ **95%** |

---

## 🤝 Contributing

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 License

Este projeto é privado e confidencial.

---

## 🆘 Suporte

- 📖 Consulte a documentação acima
- 🐛 Abra uma issue no GitHub
- 💬 Entre em contato com o time

---

## 🙏 Acknowledgments

- Firebase - Backend infrastructure
- React - Frontend framework
- React Flow - Workflow builder
- TanStack Query - State management
- Shadcn/UI - Component library

---

**Desenvolvido com ❤️ para planejamento financeiro**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/cab66f49-9386-4853-b3a0-88e8fb898fef) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 🔥 Firebase Setup

This CRM uses **Firebase** for backend services (Firestore, Authentication, Storage, Cloud Functions).

### Prerequisites

1. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)
2. **Node.js**: Version 18+ (check with `node --version`)

### Step-by-Step Setup

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "CRM Planejamento Financeiro")
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2. Enable Firebase Services

**Enable Firestore Database:**
1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select "Start in test mode" (we'll add security rules later)
4. Choose your location (e.g., `southamerica-east1` for São Paulo)
5. Click "Enable"

**Enable Authentication:**
1. Go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. Click "Save"

**Enable Storage:**
1. Go to **Build > Storage**
2. Click "Get started"
3. Start in test mode
4. Click "Done"

#### 3. Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ > Project settings
2. Scroll down to "Your apps"
3. Click the **Web icon** (</>)
4. Register your app (name: "CRM Web App")
5. Copy the `firebaseConfig` object

#### 4. Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Fill in the Firebase credentials from step 3:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### 5. Install Firebase CLI (for Cloud Functions)

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Storage
- ✅ Hosting (optional)

#### 6. Deploy Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }

    match /contacts/{contactId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated();
    }

    match /deals/{dealId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated();
    }

    match /workflows/{workflowId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

#### 7. Create Composite Indexes

**Firestore Indexes** (`firestore.indexes.json`):
```json
{
  "indexes": [
    {
      "collectionGroup": "contacts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
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
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

#### 8. Run the Project

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Troubleshooting

**Error: Missing Firebase configuration**
- Make sure `.env` file exists and contains all required variables
- Restart the dev server after creating `.env`

**Error: Permission denied**
- Check if Firestore security rules are deployed
- Verify user is authenticated
- Check user role in Firestore `users` collection

**Error: Network request failed**
- Check internet connection
- Verify Firebase project is active
- Check Firebase quota limits (free tier has limits)

### Architecture Documentation

For detailed information about the system architecture, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [WORKFLOWS.md](./WORKFLOWS.md) - Workflow engine documentation (coming soon)
- [API.md](./API.md) - API documentation (coming soon)

### Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **State Management**: TanStack Query
- **Backend**: Firebase (Firestore + Functions)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Routing**: React Router DOM
