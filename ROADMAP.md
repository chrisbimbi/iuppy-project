# ROADMAP

**Contexto geral:**  
Opção 2 escolhida – vamos terminar o módulo de Comunicação (Etapa 2) e em seguida assumir um fluxo completo end-to-end com empresas, usuários, push, estatísticas e segmentação.

---

## Etapa 2: Refactor Módulo de Comunicação  
- [x] Migrar controller, views e providers de `news/` → `communication/`  
- [x] Wizard, steps e validações em `ContentForm`  
- [x] Ajustes de criação, edição e duplicação (incluindo thumbnails e ordenação)  
- [x] Bulk actions (seleção múltipla: duplicar, publicar/despublicar, excluir)  
- [x] Confirmação de exclusão em modal Metronic  
## Próximas Etapas

**Etapa 3: CRUD de UserGroups & Segmentação Fina**  
- Modelar entidade UserGroup (+ relação com usuário)  
- Endpoints e DTOs no back-end  
- CRUD no CMS para criar/editar/excluir grupos  
- Step 2 do wizard: substituir “Público Alvo” por multi-select de grupos reais  

**Etapa 4: CRUD de Companies & Users**  
- Modelagem de Company & User  
- Autenticação real (JWT)  
- Views no CMS para gerenciar empresas e contas  

**Etapa 5: Integração App Mobile**  
- Esqueleto React Native / Expo  
- Login e consumo das APIs de conteúdo  
- Feed + segmentação funcionando no app  

**(Depois: Etapa 6: Push Notifications, Etapa 7: Dashboard de Estatísticas, Etapa 8+: módulos MVP…)**