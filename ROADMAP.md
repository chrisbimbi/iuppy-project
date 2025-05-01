# ROADMAP

Este documento serve como ponto de partida para guiar o desenvolvimento do projeto Iuppy, garantindo que sigamos as etapas definidas e mantenhamos o foco.

---

## 1. Canvas como Fonte Única de Verdade
- Os documentos de cada etapa (Análise, Backlog de Features, Skeleton de Código) devem ficar disponíveis no Canvas.
- Sempre referenciar o título da etapa ao iniciar uma tarefa ou PR.

## 2. Recapitulação de Contexto
Antes de qualquer solicitação de código, usar:
Recap: estamos na Etapa X, [descrição breve]

Isso garante que o contexto esteja sempre alinhado.

## 3. Checklist de Revisão
- [ ] Funcionalidade testada e funcionando no front-end  
- [ ] Imports e paths corretos conforme `communication/...`  
- [ ] Testes manuais básicos realizados  

## 4. Versionamento de Branches
- Nome de branches: `feature/etapaX-descrição-curta`  
- Exemplo: `feature/etapa3-groups-ui`  

## 5. Atualização do `ROADMAP.md`
Ao concluir cada etapa:
1. Marcar a etapa como concluída  
2. Adicionar data de finalização e referência ao PR  

## 6. Responsabilidades
- **Você (desenvolvedor)**  
  - Mantém o roadmap atualizado  
  - Executa o checklist e reporta status  
- **IA (ChatGPT)**  
  - Garante respostas e códigos respeitando o roadmap  
  - Fornece recapitulações e lembretes  

---

# Próximas Etapas

## Etapa 3: UI de Grupos (🚀 Início amanhã)
- **Objetivo**: CRUD completo de User Groups no CMS  
- **Backend**: já finalizado  
- **Frontend**:
  - Hooks React-Query: `useGroups()`, `useGroupActions()`  
  - Página de listagem com Metronic Table  
  - Modal de criar/editar grupo  
  - Integração no menu lateral (“Usuários e Grupos”)  
  - Validar navegação e URLs  

## Etapa 4: Formulários Customizáveis
- Wizard de configuração de formulários  
- Integração com backend  

## Etapa 5: Enquetes Nativas
- CRUD de surveys  
- Renderização no app  

## Etapa 6: Disparo de Notificações (Push / Email)
- Configuração de serviços externos  
- Integração nos settings dos posts  

## Etapa 7: Dashboard de Estatísticas
- Coleta de impressões, cliques, confirmações de leitura (acknowledge)  
- Frontend de visualização no CMS / Power BI export  

---

> **Recap**: concluímos hoje o **CRUD backend de Groups**, testado via Postman. Amanhã iniciamos **Etapa 3: UI de Grupos**.