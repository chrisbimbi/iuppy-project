# RODE NA RAIZ DO REPO: iuppy-project/
# (precisa existir backend/src e shared/src/types)

set -euo pipefail

if [ ! -d "backend/src" ] || [ ! -d "shared/src/types" ]; then
  echo "⚠️  Rode este script na raiz do monorepo (onde há backend/ e shared/)."
  exit 1
fi

echo "📁 Criando pastas v2…"
mkdir -p backend/src/v2/{common,me,news,spaces,channels,analytics,search,push,audience,feed,interactions/entities}
mkdir -p shared/src/types/v2

echo "📄 Criando arquivos (vazios)…"
# shared types v2
touch shared/src/types/v2/segmentation.ts
touch shared/src/types/v2/interactions.ts
touch shared/src/types/v2/feed.ts
touch shared/src/types/v2/analytics.ts

# backend v2 (controllers/services/modules — vazios)
touch backend/src/v2/common/v2.module.ts

touch backend/src/v2/me/me.controller.ts
touch backend/src/v2/me/me.service.ts

touch backend/src/v2/feed/feed.service.ts

touch backend/src/v2/spaces/spaces.controller.ts
touch backend/src/v2/spaces/spaces.service.ts

touch backend/src/v2/channels/channels.controller.ts
touch backend/src/v2/channels/channels.service.ts

touch backend/src/v2/news/news.controller.ts
touch backend/src/v2/news/news.service.ts

touch backend/src/v2/analytics/analytics.controller.ts
touch backend/src/v2/analytics/analytics.service.ts

touch backend/src/v2/search/search.controller.ts
touch backend/src/v2/search/search.service.ts

touch backend/src/v2/push/push.controller.ts
touch backend/src/v2/push/push.service.ts

touch backend/src/v2/audience/audience.service.ts
touch backend/src/v2/interactions/interactions.service.ts

# entities v2 (vazios — para futuras migrations)
touch backend/src/v2/interactions/entities/news-reaction.entity.ts
touch backend/src/v2/interactions/entities/news-comment.entity.ts
touch backend/src/v2/interactions/entities/news-share.entity.ts
touch backend/src/v2/interactions/entities/interaction-event.entity.ts
touch backend/src/v2/interactions/entities/news-audience.entity.ts
touch backend/src/v2/interactions/entities/news-metrics-daily.entity.ts
touch backend/src/v2/interactions/entities/user-metrics-daily.entity.ts
touch backend/src/v2/interactions/entities/search-metrics-daily.entity.ts

# doc opcional
touch backend/src/v2/README.md

echo "✅ Estrutura criada (vazia)."
echo "   Dica: 'git status' vai mostrar os novos arquivos."