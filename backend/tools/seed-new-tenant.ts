// backend/tools/seed-new-tenant.ts
import 'tsconfig-paths/register'
import 'dotenv/config'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '../../shared/src/types/Role'

// ================== CONFIG ==================
/**
 * Nome “amigável” do tenant para e-mails/domínios. NÃO é o ID.
 * O ID real da empresa (companyId) será um UUID v4.
 */
const TENANT_NAME = process.env.SEED_TENANT_NAME || 'acme'
const API = process.env.API_URL || 'http://localhost:4000' // fora do container
// se rodar DENTRO do container do api, troque para: 'http://api:3000'

/** Módulos que serão ligados para o tenant */
const MODULES = [
  { key: 'news', enabled: true, config: {} },
  { key: 'channels', enabled: true, config: {} },
  { key: 'groups', enabled: true, config: {} },
  { key: 'surveys', enabled: true, config: {} },
]

/** Usuários do tenant com NOVOS ROLES */
const USERS = (companyId: string) => {
  const short = companyId.slice(0, 8)
  const domain = `${TENANT_NAME}.iuppy.dev`
  return [
    {
      email: `admin+${short}@${domain}`,
      name: 'Company Admin',
      displayName: 'Admin',
      password: 'P@ssw0rd!',
      role: Role.CompanyAdmin,
      companyId,
    },
    {
      email: `rh+${short}@${domain}`,
      name: 'HR Admin',
      displayName: 'RH',
      password: 'P@ssw0rd!',
      role: Role.HRAdmin,
      companyId,
    },
    {
      email: `content+${short}@${domain}`,
      name: 'Content Admin',
      displayName: 'Conteúdo',
      password: 'P@ssw0rd!',
      role: Role.ContentAdmin,
      companyId,
    },
    {
      email: `manager+${short}@${domain}`,
      name: 'Manager',
      displayName: 'Gestor',
      password: 'P@ssw0rd!',
      role: Role.Manager,
      companyId,
    },
    {
      email: `editor+${short}@${domain}`,
      name: 'Editor',
      displayName: 'Editor',
      password: 'P@ssw0rd!',
      role: Role.Editor,
      companyId,
    },
    {
      email: `viewer+${short}@${domain}`,
      name: 'Viewer',
      displayName: 'Leitor',
      password: 'P@ssw0rd!',
      role: Role.Viewer,
      companyId,
    },
  ]
}

// ======= Types locais p/ requests =======
type CreateSpaceDto = {
  name: string
  slug?: string
  description?: string
  imageUrl?: string
  priority?: number
  active?: boolean
  companyId: string
}

type CreateChannelDto = {
  name: string
  description?: string
  companyId: string
  spaceIds?: string[]
  groupIds?: string[]
}

type CreateUserDto = {
  email: string
  name: string
  displayName?: string
  password: string
  role: Role
  companyId: string
  spaceId?: string
  groups?: string[]
  visibleGroups?: string[]
}

type CreateNewsDto = {
  title: string
  subtitle?: string
  content: string
  channelId: string
  authorId: string
  companyId: string
  type: 'ANNOUNCEMENT' | 'UPDATE' | 'ALERT'
  isPublished: boolean
  attachments: any[]
  highlightImages: any[]
  settings: {
    visibility: 'public' | 'private' | 'specific_groups'
    allowComments: boolean
    moderateComments: boolean
    allowReactions: boolean
    notifyUsers: boolean
    pushNotification: boolean
    emailNotification: boolean
    allowSharing: boolean
    showAuthor: boolean
    showPublishDate: boolean
    pinToTop: boolean
    schedulePublication: boolean
    expirePublication: boolean
    pushTitle: string
    pushContent: string
    targetAudience: string[]
    expirationDate?: string
    schedulePublishDate?: string
  }
}

async function run() {
  // 0) Gera companyId = UUID v4
  const companyId = uuidv4()
  console.log(`🚀 Seed do tenant "${TENANT_NAME}" com companyId (UUID): ${companyId}`)
  console.log(`API: ${API}`)

  // 1) Ativa módulos p/ companyId (UUID)
  console.log('→ Ativando módulos…')
  for (const m of MODULES) {
    await axios.patch(
      `${API}/modules/${companyId}/company-modules/${m.key}`,
      { enabled: m.enabled, config: m.config ?? {} }
    )
  }

  // 2) Cria 2 spaces
  console.log('→ Criando spaces…')
  const spacesPayload: CreateSpaceDto[] = [
    { name: 'HQ', slug: 'hq', description: 'Headquarters', priority: 1, active: true, companyId },
    { name: 'Branch', slug: 'branch', description: 'Branch office', priority: 2, active: true, companyId },
  ]
  const spacesResp = await Promise.all(spacesPayload.map(s => axios.post(`${API}/spaces`, s)))
  const spaces = spacesResp.map(r => r.data as { id: string, companyId: string })
  const spaceIds = spaces.map(s => s.id)
  console.log('✓ Spaces:', spaceIds)

  // 3) Cria 2 canais vinculados aos spaces
  console.log('→ Criando channels…')
  const channelsPayload: CreateChannelDto[] = [
    { name: 'General', description: 'Geral da empresa', companyId, spaceIds },
    { name: 'Team', description: 'Times e squads', companyId, spaceIds },
  ]
  const channelsResp = await Promise.all(channelsPayload.map(c => axios.post(`${API}/channels`, c)))
  const channels = channelsResp.map(r => r.data as { id: string })
  console.log('✓ Channels:', channels.map(c => c.id))

  // 4) Cria usuários do tenant com os NOVOS roles
  console.log('→ Criando usuários…')
  const usersPayload: CreateUserDto[] = USERS(companyId).map(u => ({ ...u, spaceId: spaceIds[0] }))
  const usersResp = await Promise.all(usersPayload.map(u => axios.post(`${API}/users`, u)))
  const users = usersResp.map(r => r.data as { id: string, email: string })
  console.log('✓ Users:', users.map(u => u.email).join(', '))

  // 5) (Opcional) News de boas-vindas no canal "General"
  console.log('→ Criando news de exemplo…')
  const authorId = users[0].id // CompanyAdmin autor
  const channelId = channels[0].id
  const newsPayload: CreateNewsDto = {
    title: `Bem-vindos à ${TENANT_NAME.toUpperCase()}!`,
    subtitle: 'Tenant inicial',
    content: 'Esta é uma notícia de boas-vindas.',
    channelId,
    authorId,
    companyId,
    type: 'ANNOUNCEMENT',
    isPublished: true,
    attachments: [],
    highlightImages: [],
    settings: {
      visibility: 'public',
      allowComments: true,
      moderateComments: false,
      allowReactions: true,
      notifyUsers: false,
      pushNotification: false,
      emailNotification: false,
      allowSharing: true,
      showAuthor: true,
      showPublishDate: true,
      pinToTop: false,
      schedulePublication: false,
      expirePublication: false,
      pushTitle: '',
      pushContent: '',
      targetAudience: [spaceIds[0]],
    },
  }
  await axios.post(`${API}/news`, newsPayload)
  console.log('✓ News criada')

  const short = companyId.slice(0, 8)
  console.log('✅ Seed concluído!')
  console.log('→ Faça login no CMS com:')
  console.log(`   email: admin+${short}@${TENANT_NAME}.iuppy.dev`)
  console.log(`   senha: P@ssw0rd!`)
  console.log(`   (companyId do usuário: ${companyId})`)
}

run().catch((err) => {
  console.error('❌ Seed error:', err?.response?.data || err.message)
  process.exit(1)
})