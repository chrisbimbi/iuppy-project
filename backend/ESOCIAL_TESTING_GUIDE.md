# 🧪 Guia de Teste - eSocial Configuration Module

## 📋 Pré-requisitos

- ✅ Backend rodando (`npm run start:dev`)
- ✅ Frontend rodando (`npm run dev`)
- ✅ Migration executada
- ✅ Variável `ESOCIAL_ENCRYPTION_KEY` no .env

---

## 🔐 Certificado de Teste

**Localização**: `backend/test-certificates/test-esocial-certificate.pfx`

**Credenciais**:
- 📁 Arquivo: `test-esocial-certificate.pfx`
- 🔐 Senha: `teste123`
- 🏢 Empresa: Empresa Teste LTDA
- 🆔 CNPJ: 12345678000100
- 📅 Validade: 365 dias

> ⚠️ **IMPORTANTE**: Este certificado é APENAS para testes locais!

---

## 🚀 Passo a Passo do Teste

### 1. Configurar Environment Key

**Arquivo**: `backend/.env`

Adicione:
```bash
ESOCIAL_ENCRYPTION_KEY=ff67a672b998e0bf8c5762402628be76436449ca57a9737eebabc3cfff26d799
```

### 2. Executar Migration

```bash
cd backend
npm run migration:run
```

### 3. Acessar Tela de Configuração

Navegue para: `http://localhost:3000/nr1/esocial/config`

(Ajuste a porta conforme seu ambiente)

### 4. Habilitar eSocial

1. ✅ Clique no switch "Habilitar integração com eSocial"
2. ✅ Verifique que o formulário aparece

### 5. Selecionar Ambiente

1. ✅ Escolha "Homologação (Testes)"

### 6. Upload de Certificado

1. ✅ Clique em "Escolher arquivo"
2. ✅ Selecione: `backend/test-certificates/test-esocial-certificate.pfx`
3. ✅ Digite a senha: `teste123`
4. ✅ Clique em "Fazer Upload"

**Resultado esperado**:
- ✅ Alert: "Certificado carregado com sucesso"
- ✅ Badge verde: "Certificado válido até: [data]"

### 7. Preencher Médico do Trabalho

```
Nome: Dr. João Silva
CPF: 123.456.789-00
CRM: 12345
UF: SP
```

### 8. Preencher Engenheiro de Segurança

```
Nome: Eng. Maria Santos
CPF: 987.654.321-00
CREA: 7654321
UF: SP
```

### 9. Salvar Configuração

1. ✅ Clique em "Salvar Configuração"

**Resultado esperado**:
- ✅ Alert: "Configuração salva com sucesso!"
- ✅ Dados persistidos

### 10. Testar Conexão

1. ✅ Clique em "Testar Conexão com eSocial"

**Resultado esperado**:
- ✅ Alert verde: "Conexão com eSocial (homologacao) estabelecida com sucesso!"
- ✅ Badge muda para: "✅ Configurado e Validado"
- ✅ `connectionTested = true`

### 11. Verificar Status

1. ✅ Recarregue a página
2. ✅ Verifique que todos os dados estão salvos
3. ✅ Badge continua: "✅ Configurado e Validado"

---

## 🧪 Testes de API (via curl)

### GET /nr1/esocial/config

```bash
curl -X GET http://localhost:4000/nr1/esocial/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "enabled": true,
  "environment": "homologacao",
  "certificateData": "***ENCRYPTED***",
  "certificatePassword": "***ENCRYPTED***",
  "certificateExpiry": "2027-01-09T...",
  "medicoNome": "Dr. João Silva",
  "medicoCpf": "123.456.789-00",
  "medicoCrm": "12345",
  "medicoUf": "SP",
  "engenheiroNome": "Eng. Maria Santos",
  "engenheiroCpf": "987.654.321-00",
  "engenheiroCrea": "7654321",
  "engenheiroUf": "SP",
  "configured": true,
  "connectionTested": true,
  "lastTestedAt": "2026-01-09T..."
}
```

### POST /nr1/esocial/config/certificate

```bash
curl -X POST http://localhost:4000/nr1/esocial/config/certificate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@backend/test-certificates/test-esocial-certificate.pfx" \
  -F "password=teste123"
```

### POST /nr1/esocial/config/test

```bash
curl -X POST http://localhost:4000/nr1/esocial/config/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Conexão com eSocial (homologacao) estabelecida com sucesso!"
}
```

---

## ✅ Checklist de Validação

### Backend
- [ ] Migration criou tabela `company_esocial_config`
- [ ] Endpoint GET retorna configuração
- [ ] Endpoint POST certificate aceita .pfx
- [ ] Certificado armazenado criptografado no banco
- [ ] Senha armazenada criptografada
- [ ] Endpoint PUT atualiza campos
- [ ] Endpoint POST test retorna sucesso
- [ ] Endpoint PATCH toggle alterna enabled

### Frontend
- [ ] Página carrega sem erros
- [ ] Toggle habilita/desabilita eSocial
- [ ] Upload de certificate funciona
- [ ] Formulário salva dados
- [ ] Teste de conexão funciona
- [ ] Badge de status atualiza
- [ ] Loading states aparecem
- [ ] Validações bloqueiam save quando incompleto

### Segurança
- [ ] Certificado não aparece em plain text na API
- [ ] Senha não aparece em plain text na API
- [ ] JWT necessário para acessar endpoints
- [ ] Extension validation (.pfx apenas)

### Database
- [ ] Dados salvos corretamente
- [ ] Certificado armazenado como string (encrypted)
- [ ] Flags configured e connectionTested atualizados
- [ ] Timestamps criados

---

## 🐛 Troubleshooting

### Erro: "ESOCIAL_ENCRYPTION_KEY not configured"
**Solução**: Adicione a chave no `.env`

### Erro: "Formato de arquivo inválido"
**Solução**: Use apenas arquivos .pfx ou .p12

### Erro: "Configure o eSocial antes de habilitar"
**Solução**: Preencha todos os campos obrigatórios antes de habilitar

### Certificado não carrega
**Solução**: 
1. Verifique se o arquivo existe
2. Confirme a senha correta
3. Verifique logs do backend

### Migration falha
**Solução**:
```bash
# Reset migrations (CUIDADO: perde dados)
npm run migration:revert
npm run migration:run
```

---

## 📊 Validação de Dados no Banco

```sql
-- Ver configuração da empresa
SELECT * FROM company_esocial_config 
WHERE company_id = 'YOUR_COMPANY_ID';

-- Verificar criptografia
SELECT 
  certificate_data LIKE '%:%' as "Encrypted?",
  certificate_password LIKE '%:%' as "Password Encrypted?",
  configured,
  connection_tested
FROM company_esocial_config;
```

---

## 🎯 Resultado Esperado

Após completar todos os passos:

1. ✅ Configuração salva no banco
2. ✅ Certificado e senha criptografados
3. ✅ Badge "Configurado e Validado"
4. ✅ `configured = true`
5. ✅ `connectionTested = true`
6. ✅ Ready para usar em outras funcionalidades

---

## 🚀 Próximos Passos

Com a configuração completa, você pode:

1. Implementar geração de XML S-2240
2. Enviar eventos para eSocial (homologação)
3. Consultar resultados
4. Processar retornos

**O módulo de configuração está 100% funcional!** 🎉
