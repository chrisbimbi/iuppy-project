# ROADMAP

Este documento serve como ponto de partida para guiar o desenvolvimento do projeto Iuppy, garantindo que sigamos as etapas definidas e mantenhamos o foco.

Estrutura de Trabalho

1. Canvas como Fonte Única de Verdade
 • Os documentos de cada etapa (Análise, Backlog de Features, Skeleton de Código) devem ficar disponíveis no Canvas do ChatGPT.
 • Sempre referenciar o título da etapa ao iniciar uma tarefa ou PR.

2. Recapitulação de Contexto
 • Como usar: Antes de qualquer solicitação de código, cole o prompt inical:
_Recap: estamos na Etapa X, [descrição breve]_
 • Isso garante que o contexto esteja sempre alinhado.

3. Checklist de Revisão
 • Após implementar cada bloco de código, complete o checklist:
 • Funcionalidade testada e funcionando no front-end
 • Imports e paths corretos conforme communication/...
 • Testes manuais básicos realizados

4. Versionamento de Branches
 • Nomeie branches seguindo o padrão: feature/etapaX-descrição-curta.
 • Exemplo: feature/etapa2-communication-structure

5. Atualização do ROADMAP.md
 • Ao concluir cada etapa, atualize este arquivo:
 • Marque a etapa como concluída
 • Adicione data de finalização e referência ao PR

6. Responsabilidades
 • Você (desenvolvedor):
 • Mantém o roadmap atualizado e inclui o título da etapa nas solicitações
 • Executa o checklist e reporta status
 • IA (ChatGPT):
 • Garante que as respostas e códigos respeitem o roadmap e etapas definidas
 • Fornece recapitulações e lembretes sempre que solicitado

Próximas Etapas

 1. Etapa 2: Migrar o módulo de Comunicação para a estrutura controller/service/provider/view.
 2. Etapa 3: Implementar Formulários Customizáveis.
 3. Etapa 4: Incluir Enquetes Nativas.
 4. Etapa 5: Dashboard Básico de Estatísticas.
…e assim por diante.

⸻

## Etapa 2: Refactor do módulo de Comunicação

- [x] Migrar controller, views e providers de `news/` para `communication/`
- [x] Passar wizard, steps e validation para `communication/views/ContentForm`
- [x] Refatorar imports e renomear DTOs de “News” para “Content”
- [x] Bug: modal de criação agora salva corretamente
- [x] Bug: edição e duplicação de conteúdo
##Etapa 2.1
- [x] ENTIDADES, TYPOS, DTOS E CRUD BACKEND FUNCIONAL
- [ ] frontend com UI, rotas, modals e crud completo
  

Dica: Sempre valide este arquivo no início de cada sprint para garantir que estamos no caminho certo!
