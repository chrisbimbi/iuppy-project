// backend/tools/seed-content.ts
import 'tsconfig-paths/register'
import 'dotenv/config'
import axios from 'axios'
import { Role } from '../../shared/src/types/Role'

// ================== CONFIG ==================
const TENANT_NAME = process.env.SEED_TENANT_NAME || 'acme'
const API = process.env.API_URL || 'http://localhost:4000'
const COMPANY_ID = process.env.SEED_COMPANY_ID // <-- OBRIGATÓRIO: companyId já existente
const SUFFIX = process.env.SEED_SUFFIX || Math.random().toString(36).slice(2, 8)

if (!COMPANY_ID) {
    console.error('❌ Faltou SEED_COMPANY_ID (UUID da empresa já criada).')
    process.exit(1)
}

// ================== TIPOS LOCAIS (alinhados aos DTOs) ==================
type ChannelType = 'articles' | 'media' | 'updates'

type CreateChannelDto = {
    name: string
    type: ChannelType
    description?: string
    isPublished?: boolean
    companyId: string
    spaceIds?: string[]
    groupIds?: string[]
    contributorIds?: string[]
    adminIds?: string[]
    position?: number
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
    settings: Record<string, any>
}

function fmtErr(method: string, url: string, err: any) {
    const data = err?.response?.data
    return `(${method} ${url}) → ${err?.message}${data ? `\n  ↳ ${JSON.stringify(data)}` : ''}`
}

async function run() {
    console.log(`🚀 Seed de conteúdo para companyId: ${COMPANY_ID}`)
    console.log(`API: ${API}`)

    // 0) Buscar spaces existentes (vamos tentar usar nos channels/news)
    console.log('→ Buscando spaces existentes…')
    let spaceIds: string[] = []
    try {
        const { data } = await axios.get(`${API}/spaces`, { params: { companyId: COMPANY_ID } })
        spaceIds = Array.isArray(data) ? data.map((s: any) => s.id).filter(Boolean) : []
        console.log('✓ Spaces encontrados:', spaceIds)
    } catch (err) {
        console.warn('! Não consegui listar spaces (vou seguir sem spaceIds):', fmtErr('GET', `${API}/spaces?companyId=${COMPANY_ID}`, err))
    }

    // 1) Criar channels (agora com type válido!)
    console.log('→ Criando channels…')
    const channelsPayload: CreateChannelDto[] = [
        {
            name: 'Company News',
            type: 'articles',
            description: 'Notícias e artigos da empresa',
            isPublished: true,
            companyId: COMPANY_ID!,
            spaceIds: spaceIds.length ? [spaceIds[0]] : undefined,
        },
        {
            name: 'Mídia',
            type: 'media',
            description: 'Fotos e vídeos',
            isPublished: true,
            companyId: COMPANY_ID!,
            spaceIds: spaceIds.length > 1 ? [spaceIds[1]] : spaceIds.length ? [spaceIds[0]] : undefined,
        },
        {
            name: 'Atualizações',
            type: 'updates',
            description: 'Comunicados rápidos',
            isPublished: true,
            companyId: COMPANY_ID!,
            spaceIds: spaceIds.length ? [spaceIds[0]] : undefined,
        },
    ]

    const channels: Array<{ id: string; name: string }> = []
    for (const ch of channelsPayload) {
        const url = `${API}/channels`
        try {
            const { data } = await axios.post(url, ch, { headers: { 'Content-Type': 'application/json' } })
            channels.push({ id: data.id, name: ch.name })
            console.log(`  ✓ Channel criado: ${ch.name} (${data.id})`)
        } catch (err) {
            console.error(`  ❌ Falha ao criar channel "${ch.name}":`, fmtErr('POST', url, err))
            // segue para tentar os demais
        }
    }
    if (!channels.length) {
        console.error('❌ Nenhum channel criado. Interrompendo.')
        process.exit(1)
    }

    // 2) Criar usuários do tenant (com sufixo único para não colidir)
    console.log('→ Criando usuários…')
    const short = COMPANY_ID!.slice(0, 8)
    const domain = `${TENANT_NAME}.iuppy.dev`
    const usersPayload: CreateUserDto[] = [
        {
            email: `admin+${short}-${SUFFIX}@${domain}`,
            name: 'Company Admin',
            displayName: 'Admin',
            password: 'P@ssw0rd!',
            role: Role.CompanyAdmin,
            companyId: COMPANY_ID!,
            spaceId: spaceIds[0],
        },
        {
            email: `content+${short}-${SUFFIX}@${domain}`,
            name: 'Content Admin',
            displayName: 'Conteúdo',
            password: 'P@ssw0rd!',
            role: Role.ContentAdmin,
            companyId: COMPANY_ID!,
            spaceId: spaceIds[0],
        },
        {
            email: `viewer+${short}-${SUFFIX}@${domain}`,
            name: 'Viewer',
            displayName: 'Leitor',
            password: 'P@ssw0rd!',
            role: Role.Viewer,
            companyId: COMPANY_ID!,
            spaceId: spaceIds[0],
        },
    ]

    const users: Array<{ id: string; email: string }> = []
    for (const u of usersPayload) {
        const url = `${API}/users`
        try {
            const { data } = await axios.post(url, u, { headers: { 'Content-Type': 'application/json' } })
            users.push({ id: data.id, email: u.email })
            console.log(`  ✓ User criado: ${u.email}`)
        } catch (err) {
            console.error(`  ❌ Falha ao criar user "${u.email}":`, fmtErr('POST', url, err))
            // segue em frente
        }
    }
    if (!users.length) {
        console.error('❌ Nenhum usuário criado. Interrompendo.')
        process.exit(1)
    }

    // 3) Criar uma news de boas-vindas no primeiro channel
    console.log('→ Criando news de exemplo…')
    const authorId = users[0].id
    const channelId = channels[0].id

    const newsPayload: CreateNewsDto = {
        title: `Bem-vindos à ${TENANT_NAME.toUpperCase()}!`,
        subtitle: 'Tenant inicial',
        content: 'Esta é uma notícia de boas-vindas.',
        channelId,
        authorId,
        companyId: COMPANY_ID!,
        type: 'ANNOUNCEMENT',
        isPublished: true,
        attachments: [],
        highlightImages: [],
        // Mantenha o settings simples; o DTO aceita um JSON
        settings: {
            visibility: 'public',
            allowComments: true,
            allowReactions: true,
            showAuthor: true,
            showPublishDate: true,
            targetAudience: spaceIds.length ? [spaceIds[0]] : [],
        },
    }

    try {
        const { data } = await axios.post(`${API}/news`, newsPayload, { headers: { 'Content-Type': 'application/json' } })
        console.log(`✓ News criada (${data.id}) no canal ${channels[0].name}`)
    } catch (err) {
        console.error('❌ Falha ao criar news:', fmtErr('POST', `${API}/news`, err))
        process.exit(1)
    }

    console.log('✅ Seed de conteúdo concluído!')
    console.log('→ Faça login no CMS com:')
    console.log(`   email: ${users[0].email}`)
    console.log(`   senha: P@ssw0rd!`)
    console.log(`   (companyId do usuário: ${COMPANY_ID})`)
}

run().catch((err) => {
    console.error('❌ Seed error (fatal):', err?.response?.data || err.message)
    process.exit(1)
})