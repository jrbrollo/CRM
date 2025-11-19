# 🔑 Como Pegar as Credenciais do Firebase

Guia visual passo-a-passo para obter todas as credenciais necessárias.

---

## 📋 Credenciais Necessárias

Você precisa de **6 credenciais** para o arquivo `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 🚀 Passo a Passo

### **1. Acesse o Firebase Console**

👉 **Link**: https://console.firebase.google.com

- Faça login com sua conta Google
- Se não tiver conta, crie gratuitamente

---

### **2. Criar Projeto (Se ainda não tem)**

Se você JÁ tem um projeto, pule para o passo 3.

#### 2.1. Clicar em "Adicionar Projeto" ou "Create a project"

#### 2.2. Nome do Projeto
- Digite: **"CRM Pro"** (ou o nome que preferir)
- Clique em **"Continuar"**

#### 2.3. Google Analytics (Opcional)
- Pode desabilitar se quiser
- Clique em **"Criar projeto"**

#### 2.4. Aguarde
- Leva ~30 segundos
- Clique em **"Continuar"** quando terminar

---

### **3. Pegar as Credenciais**

Agora com o projeto aberto:

#### 3.1. Ir para Configurações do Projeto
```
1. Clique no ícone de ENGRENAGEM ⚙️ (topo esquerdo)
2. Clique em "Configurações do projeto" ou "Project Settings"
```

#### 3.2. Adicionar Aplicativo Web

**Se você JÁ tem um app web cadastrado:**
- Role para baixo até "Seus aplicativos"
- Clique no app existente
- Pule para o passo 3.3

**Se NÃO tem um app web:**
```
1. Role para baixo até "Seus aplicativos"
2. Clique no ícone </> (Web)
3. Digite um apelido: "CRM Web App"
4. NÃO marque "Firebase Hosting" ainda
5. Clique em "Registrar app"
6. Clique em "Continuar no console"
```

#### 3.3. Ver as Credenciais

Você verá um bloco de código assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

### **4. Copiar para o .env**

Copie cada valor e cole no arquivo `.env`:

```env
# ⚠️ NUNCA COMMITE ESTE ARQUIVO!

# 1. apiKey → VITE_FIREBASE_API_KEY
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 2. authDomain → VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com

# 3. projectId → VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_PROJECT_ID=seu-projeto

# 4. storageBucket → VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com

# 5. messagingSenderId → VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012

# 6. appId → VITE_FIREBASE_APP_ID
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## ✅ Verificar se está Correto

Depois de preencher o `.env`:

### 1. Testar Localmente

```bash
npm run dev
```

- Acesse: http://localhost:5173
- Tente fazer login ou criar conta
- Se aparecer erro de Firebase, confira as credenciais

### 2. Verificar no Console do Browser

Abra as DevTools (F12) e veja se há erros relacionados ao Firebase.

**Erros Comuns:**

❌ `Firebase: Error (auth/invalid-api-key)`
→ Confira o `VITE_FIREBASE_API_KEY`

❌ `Firebase: Error (auth/project-not-found)`
→ Confira o `VITE_FIREBASE_PROJECT_ID`

---

## 🔐 Habilitar Autenticação

Para o login funcionar, você precisa habilitar Authentication:

### 1. No Firebase Console

```
1. Clique em "Authentication" no menu lateral
2. Clique em "Get Started" ou "Começar"
3. Clique na aba "Sign-in method"
4. Clique em "Email/Password"
5. HABILITE "Email/Password"
6. Clique em "Salvar"
```

---

## 🗄️ Habilitar Firestore

Para salvar dados, habilite o Firestore:

### 1. No Firebase Console

```
1. Clique em "Firestore Database" no menu lateral
2. Clique em "Criar banco de dados"
3. Selecione "Iniciar no modo de produção"
4. Escolha uma localização (recomendo: southamerica-east1 - São Paulo)
5. Clique em "Ativar"
```

### 2. Deploy das Security Rules

Depois que o Firestore estiver criado:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 📦 Habilitar Storage (Opcional)

Para upload de arquivos:

### 1. No Firebase Console

```
1. Clique em "Storage" no menu lateral
2. Clique em "Começar"
3. Aceite as regras padrão
4. Escolha uma localização (mesma do Firestore)
5. Clique em "Concluído"
```

### 2. Deploy das Storage Rules

```bash
firebase deploy --only storage
```

---

## ⚡ Habilitar Cloud Functions (Para Workflows)

**⚠️ IMPORTANTE**: Cloud Functions requer **Blaze Plan** (pay-as-you-go)

### 1. Upgrade do Plano

```
1. No Firebase Console, clique em "Upgrade" (canto superior)
2. Selecione "Blaze Plan"
3. Adicione um cartão de crédito
4. Defina limites de gastos (recomendo: $10/mês)
```

**Tranquilo!** Firebase tem:
- ✅ Free tier generoso
- ✅ Pay-as-you-go (só paga o que usar)
- ✅ Primeiro milhão de invocações GRÁTIS

### 2. Deploy das Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## 🎯 Checklist Final

Use este checklist para garantir que está tudo configurado:

- [ ] Projeto Firebase criado
- [ ] App Web registrado
- [ ] Credenciais copiadas para `.env`
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore Database criado
- [ ] Security Rules deployadas
- [ ] Indexes deployados
- [ ] Storage habilitado (opcional)
- [ ] Cloud Functions deployadas (opcional)
- [ ] Teste local funcionando (`npm run dev`)

---

## 🆘 Problemas Comuns

### "Invalid API Key"
- Confira se copiou o `apiKey` corretamente
- Certifique-se que não tem espaços extras
- Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

### "Project not found"
- Verifique o `projectId`
- Certifique-se que o projeto existe no Firebase Console

### "Authentication not enabled"
- Vá em Authentication → Sign-in method
- Habilite "Email/Password"

### ".env não está carregando"
- Variáveis DEVEM começar com `VITE_`
- Reinicie o servidor após editar `.env`
- Arquivo deve estar na raiz do projeto

---

## 📞 Links Úteis

- 🔥 **Firebase Console**: https://console.firebase.google.com
- 📖 **Docs Firebase**: https://firebase.google.com/docs
- 💰 **Pricing**: https://firebase.google.com/pricing
- 🎓 **Tutoriais**: https://firebase.google.com/docs/web/setup

---

## 🎉 Pronto!

Depois de seguir este guia:
1. Suas credenciais estarão no `.env`
2. Firebase estará configurado
3. Você pode rodar: `./scripts/dev.sh`

**Boa sorte!** 🚀
