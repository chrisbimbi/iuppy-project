// backend/tools/seed-new-tenant.ts
import 'tsconfig-paths/register'
import 'dotenv/config'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '../../shared/src/types/Role'
import type { ChannelType } from './../../shared/src/types/Channel'

// ================== CONFIG ==================
const TENANT_NAME = process.env.SEED_TENANT_NAME || 'contateste'
const API_RAW = process.env.API_URL || 'http://localhost:4000' // use http://localhost:4000/api se houver prefixo global
const API = API_RAW.replace(/\/$/, '') // remove barra final

/** Módulos que serão ligados para o tenant (se endpoint existir) */
const MODULES = [
    { key: 'news', enabled: true, config: {} },
    { key: 'channels', enabled: true, config: {} },
    { key: 'groups', enabled: true, config: {} },
    { key: 'surveys', enabled: true, config: {} },
]

/** Usuários do tenant com NOVOS ROLES */
const USERS = (companyId: string) => {
    const domain = `${TENANT_NAME}.com`
    return [
        { email: `admin@${domain}`, name: 'Company Admin', displayName: 'Admin', password: 'P@ssw0rd!', role: Role.CompanyAdmin, companyId },
        { email: `rh@${domain}`, name: 'HR Admin', displayName: 'RH', password: 'P@ssw0rd!', role: Role.HRAdmin, companyId },
        { email: `content@${domain}`, name: 'Content Admin', displayName: 'Conteúdo', password: 'P@ssw0rd!', role: Role.ContentAdmin, companyId },
        { email: `manager@${domain}`, name: 'Manager', displayName: 'Gestor', password: 'P@ssw0rd!', role: Role.Manager, companyId },
        { email: `editor@${domain}`, name: 'Editor', displayName: 'Editor', password: 'P@ssw0rd!', role: Role.Editor, companyId },
        { email: `viewer@${domain}`, name: 'Viewer', displayName: 'Leitor', password: 'P@ssw0rd!', role: Role.Viewer, companyId },
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
    type: ChannelType
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
    // 0) Usa a company existente (ou gera)
    const companyId = process.env.SEED_COMPANY_ID || '6acb2d84-f8c3-40e1-bae0-96b7586c30d4'
    console.log(`🚀 Seed do tenant "${TENANT_NAME}" com companyId (UUID): ${companyId}`)
    console.log(`API: ${API}`)

    // 1) Ativa módulos (se endpoint existir) — ignora 404
    console.log('→ Ativando módulos…')
    for (const m of MODULES) {
        try {
            await axios.patch(
                `${API}/modules/${companyId}/company-modules/${m.key}`,
                { enabled: m.enabled, config: m.config ?? {} }
            )
        } catch (e: any) {
            if (e?.response?.status === 404) {
                console.log(`ℹ modules endpoint ausente; já ativado via SQL: ${m.key}`)
                continue
            }
            throw e
        }
    }

    // 2) Cria 2 spaces (slug é obrigatório)
    console.log('→ Criando spaces…')
    const spacesPayload: CreateSpaceDto[] = [
        { name: 'HQ', slug: 'hq', description: 'Headquarters', priority: 1, active: true, companyId },
        { name: 'Branch', slug: 'branch', description: 'Branch office', priority: 2, active: true, companyId },
    ]
    const spacesResp = await Promise.all(spacesPayload.map(s => axios.post(`${API}/spaces`, s)))
    const spaces = spacesResp.map(r => r.data as { id: string, companyId: string })
    const spaceIds = spaces.map(s => s.id)
    console.log('✓ Spaces:', spaceIds)

    // 3) Cria 2 canais (type OBRIGATÓRIO: 'articles' | 'media' | 'updates')
    console.log('→ Criando channels…')
    const channelsPayload: CreateChannelDto[] = [
        { name: 'General', description: 'Geral da empresa', companyId, spaceIds, type: 'articles' as ChannelType },
        { name: 'Team', description: 'Times e squads', companyId, spaceIds, type: 'updates' as ChannelType },
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

    // 5) (Opcional) News de boas-vindas — tenta, mas não trava o seed
    try {
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
    } catch (e: any) {
        console.log('ℹ news falhou (provável DTO rígido); seguimos:', e?.response?.data || e?.message)
    }

    console.log('✅ Seed concluído!')
    console.log('→ Faça login no CMS com:')
    console.log(`   email: admin@${TENANT_NAME}.com`)
    console.log(`   senha: P@ssw0rd!`)
    console.log(`   (companyId do usuário: ${companyId})`)
}

run().catch((err) => {
    console.error('❌ Seed error:', err?.response?.data || err.message)
    process.exit(1)
})