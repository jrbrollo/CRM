# 🔧 Automation Scripts

Estes scripts automatizam tarefas comuns de desenvolvimento e deploy.

---

## 📜 Scripts Disponíveis

### `setup-firebase.sh` (No diretório raiz)
**Setup inicial completo do Firebase**

```bash
./setup-firebase.sh
```

**O que faz:**
- ✅ Instala Firebase CLI (se necessário)
- ✅ Faz login no Firebase
- ✅ Configura o projeto
- ✅ Deploy de rules e indexes
- ✅ Instala dependências
- ✅ Build e deploy (opcional)

**Quando usar:** Primeira vez configurando o projeto

---

### `scripts/dev.sh`
**Inicia ambiente de desenvolvimento completo**

```bash
./scripts/dev.sh
```

**O que faz:**
- 🔥 Inicia Firebase Emulators
- ⚡ Inicia Vite dev server
- 📱 Abre app em http://localhost:5173
- 🧪 Emulator UI em http://localhost:4000

**Quando usar:** Desenvolvimento diário

---

### `scripts/deploy.sh`
**Deploy completo para produção**

```bash
./scripts/deploy.sh
```

**O que faz:**
- 🏗️ Build do frontend
- ⚡ Build das functions
- 🚀 Deploy completo (hosting + functions + rules)
- ✅ Mostra URLs de produção

**Quando usar:** Deploy em produção

---

### `scripts/create-admin.sh`
**Helper para criar primeiro usuário admin**

```bash
./scripts/create-admin.sh
```

**O que faz:**
- 👑 Instruções passo a passo
- 📝 Guia para configurar role de admin
- 🔐 Explicação de roles

**Quando usar:** Após primeiro deploy

---

## 🚀 Workflow Típico

### Primeira Vez (Setup):
```bash
# 1. Setup inicial
./setup-firebase.sh

# 2. Editar .env com credenciais
nano .env

# 3. Testar localmente
./scripts/dev.sh
```

### Desenvolvimento Diário:
```bash
# Iniciar ambiente de dev
./scripts/dev.sh

# Fazer alterações...
# Testar no browser...

# Ctrl+C para parar
```

### Deploy em Produção:
```bash
# Build e deploy
./scripts/deploy.sh

# Criar admin
./scripts/create-admin.sh
```

---

## 🔧 Comandos Úteis

### Ver Logs das Functions:
```bash
firebase functions:log
```

### Listar Functions Deployadas:
```bash
firebase functions:list
```

### Ver Sites de Hosting:
```bash
firebase hosting:sites:list
```

### Rollback de Deploy:
```bash
firebase hosting:rollback
```

### Deletar Function:
```bash
firebase functions:delete functionName
```

---

## 🐛 Troubleshooting

### Erro: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Erro: "Not logged in"
```bash
firebase login
```

### Erro: "Project not found"
```bash
firebase use --add
# Selecione seu projeto
```

### Emulators não iniciam:
```bash
# Matar processos
pkill -f firebase
pkill -f vite

# Tentar novamente
./scripts/dev.sh
```

### Functions não deployam:
```bash
# Verificar billing
firebase projects:list

# Upgrade para Blaze Plan necessário
# https://console.firebase.google.com
```

---

## 📚 Mais Informações

Consulte os documentos principais:
- **DEPLOYMENT.md** - Guia completo de deploy
- **README.md** - Documentação principal
- **WORKFLOWS.md** - Sistema de workflows
- **ARCHITECTURE.md** - Arquitetura do sistema
