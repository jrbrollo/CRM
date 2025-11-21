# Configuração do Resend para Envio de Emails

## 1. Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita (3.000 emails/mês grátis)
3. Verifique seu email

## 2. Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: "CRM Brauna Production")
4. Copie a API key (começa com `re_`)

## 3. Configurar domínio (recomendado para produção)

### Opção A: Usar domínio próprio
1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Adicione seu domínio (ex: `seudominio.com.br`)
4. Adicione os registros DNS fornecidos pelo Resend:
   - TXT record para verificação
   - MX records para recebimento (opcional)
   - SPF/DKIM records para autenticação

### Opção B: Usar domínio teste do Resend
- Durante desenvolvimento, pode usar `onboarding@resend.dev`
- Limite: 1 email por dia
- Para produção, **configure domínio próprio**

## 4. Configurar Firebase Functions

### Desenvolvimento local:
```bash
cd functions
firebase functions:config:set resend.api_key="re_sua_api_key_aqui"
```

### Produção (Firebase):
```bash
firebase functions:config:set resend.api_key="re_sua_api_key_aqui" --project=production
firebase deploy --only functions
```

## 5. Atualizar o domínio no código

Edite o arquivo `/functions/src/services/emailService.ts`:

```typescript
// Linha 36: Substitua pelo seu domínio
from = "CRM Braúna <noreply@seudominio.com.br>",
```

## 6. Testar envio de email

Após deployment, teste criando um workflow com ação "Enviar Email".

### Verificar logs:
```bash
firebase functions:log --only=executeSendEmail
```

## 7. Monitoramento

- **Dashboard Resend**: Ver emails enviados, taxa de entrega, bounces
- **Firebase Logs**: Erros de envio e debugging

## Custos

### Plano Free:
- 3.000 emails/mês
- 100 emails/dia
- Perfeito para começar

### Plano Pago (se precisar):
- $20/mês: 50.000 emails
- $80/mês: 100.000 emails

## Troubleshooting

### Erro: "Resend API key not configured"
- Verifique se configurou a API key: `firebase functions:config:get`
- Faça deploy novamente: `firebase deploy --only functions`

### Emails não chegam:
- Verifique spam/lixeira
- Confirme que o domínio está verificado no Resend
- Cheque os logs do Firebase para erros

### Erro 403:
- API key inválida ou expirada
- Recrie a API key no dashboard do Resend
