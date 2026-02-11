# Guia de Implementação: Analytics no App Mobile (Flutter)

Este guia detalha o que o desenvolvedor Mobile precisa implementar para alimentar o novo sistema de Power Analytics.

## 1. Search Analytics (Fase 1)
**Objetivo**: Saber o que os usuários estão buscando e identificar lacunas de conteúdo (zero resultados).

### Chamada da API:
Ao realizar uma busca no App, deve-se chamar o endpoint de busca v2 para registrar o log:

- **Endpoint**: `POST /v2/search`
- **Payload**:
```json
{
  "q": "termo da busca",
  "filters": {},
  "limit": 10
}
```
*O backend registrará automaticamente o ID do usuário e do grupo de usuários para análise.*

---

## 2. Inteligência de Conteúdo & Tempo de Leitura (Fase 2)
**Objetivo**: Saber quanto tempo o usuário passou lendo cada notícia.

### Fluxo Sugerido:
1. Iniciar um timer quando a tela de notícia for aberta.
2. Ao fechar a tela ou o app entrar em background, calcular o `durationMs`.
3. Enviar o evento para o backend.

- **Endpoint**: `POST /v2/news/:id/open`
- **Payload**:
```json
{
  "meta": {
    "durationMs": 15500, // Tempo em milissegundos
    "origin": "mobile"
  }
}
```

---

## 3. Atribuição de Tráfego (Fase 3)
**Objetivo**: Saber se o usuário abriu a notícia via Push Notification ou Navegação Orgânica.

### Fluxo Sugerido:
Ao abrir uma notícia vinda de uma Notificação Push, adicione os parâmetros de origem no `meta`.

- **Endpoint**: `POST /v2/news/:id/open`
- **Payload (via Push)**:
```json
{
  "meta": {
    "origin": "push",
    "utm_source": "firebase_push",
    "utm_medium": "mobile_app",
    "utm_campaign": "news_alert_id_123"
  }
}
```

---

## 4. Chat Behavioral Analytics (Fase 4)
**Objetivo**: Analisar padrões de conversa e risco de churn.

**Ação Necessária**: Nenhuma mudança no envio de mensagens é estritamente necessária se o app já usa a entidade `chat_message` padrão. O backend utiliza os registros existentes para calcular:
- Tempo de resposta (Response Time)
- Usuários inativos (Churn Risk)
- Volume diário

---

## 5. Funil de Engajamento (Fase 5)
**Objetivo**: Segmentar o funil por Departamento/Cargo.

**Ação Necessária**: O App deve garantir que o perfil do usuário (campo `department`, `jobTitle`, `location`) esteja preenchido ou sincronizado com o ERP. O backend cruzará esses dados automaticamente no Funil.

---

## Resumo de Checkpoints para Mobile:

1. [ ] **Busca**: Chamar `POST /v2/search` ao pesquisar.
2. [ ] **Engajamento**: Enviar `durationMs` no `POST /v2/news/:id/open`.
3. [ ] **Origem**: Enviar `origin: 'push'` se a abertura for via notificação.
4. [ ] **Contexto**: Garantir que as chamadas herdem o token JWT correto (onde o `companyId` está embutido).
