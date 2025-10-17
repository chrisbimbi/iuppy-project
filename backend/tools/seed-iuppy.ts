/* eslint-disable no-console */
import axios from 'axios'
import { randomUUID } from 'crypto'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import { ChannelType, Role } from '../../shared/src/types'

const exec = promisify(_exec)

type Created = { id: string }

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

async function main() {
    // ========= ENV =========
    const API_URL = process.env.API_URL || 'http://localhost:4000'
    const COMPANY_NAME = process.env.SEED_COMPANY_NAME || 'iuppy'
    const COMPANY_ID = (process.env.SEED_COMPANY_ID || randomUUID()).toLowerCase()
    const EMAIL_DOMAIN = process.env.SEED_EMAIL_DOMAIN || 'iuppy.com.br'

    // Docker/psql (ajuste se seu compose usar nomes diferentes)
    const DOCKER_POSTGRES_SERVICE = process.env.SEED_DOCKER_PG_SERVICE || 'postgres'
    const PGUSER = process.env.SEED_PGUSER || 'iuppy_admin'
    const PGDB = process.env.SEED_PGDB || 'iuppy_dev'

    console.log('🚀 Seed Iuppy')
    console.log({ API_URL, COMPANY_NAME, COMPANY_ID, EMAIL_DOMAIN })

    // ========= 1) COMPANY (linha na tabela companies, via psql no container) =========
    // Alguns schemas têm FK em company_settings/company_modules → precisamos garantir companies primeiro
    {
        const sql = `
      INSERT INTO companies (id, name)
      VALUES ('${COMPANY_ID}', '${COMPANY_NAME}')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `.trim()

        const cmd = `docker compose exec -T ${DOCKER_POSTGRES_SERVICE} psql -U ${PGUSER} -d ${PGDB} -c "${sql.replace(/\n/g, ' ')}"`
        console.log('→ Upsert company via psql…')
        try {
            const { stdout, stderr } = await exec(cmd)
            if (stdout?.trim()) console.log(stdout.trim())
            if (stderr?.trim()) console.error(stderr.trim())
        } catch (err: any) {
            console.error('❌ Erro ao inserir empresa via psql:', err?.stderr || err?.message || err)
            process.exit(1)
        }
    }

    // helper http
    const http = axios.create({
        baseURL: API_URL,
        // cookies do /auth/login serão setados pelo servidor (refresh), mas aqui usamos só o accessToken no header
        validateStatus: () => true,
    })

    // ========= 2) USERS =========
    const short = COMPANY_ID.slice(0, 8)
    const emailsByRole: Record<Role, string> = {
        [Role.SuperAdmin]: `super_admin+${short}@${EMAIL_DOMAIN}`,
        [Role.CompanyAdmin]: `company_admin+${short}@${EMAIL_DOMAIN}`,
        [Role.HRAdmin]: `hr_admin+${short}@${EMAIL_DOMAIN}`,
        [Role.ContentAdmin]: `content_admin+${short}@${EMAIL_DOMAIN}`,
        [Role.Manager]: `manager+${short}@${EMAIL_DOMAIN}`,
        [Role.Editor]: `editor+${short}@${EMAIL_DOMAIN}`,
        [Role.Viewer]: `viewer+${short}@${EMAIL_DOMAIN}`,
    }

    async function createUser(role: Role, name: string) {
        const payload = {
            email: emailsByRole[role],
            name,
            password: 'P@ssw0rd!',
            role,
            companyId: COMPANY_ID,
        }
        const res = await http.post<Created>('/users', payload)
        if (res.status >= 400) {
            throw new Error(`Falha ao criar user ${role}: ${res.status} ${JSON.stringify(res.data)}`)
        }
        return res.data.id
    }

    console.log('→ Criando usuários (todos os perfis principais)…')
    const SUPERADMIN_ID = await createUser(Role.SuperAdmin, 'Super Admin')
    const COMPANYADMIN_ID = await createUser(Role.CompanyAdmin, 'Company Admin')
    const HRADMIN_ID = await createUser(Role.HRAdmin, 'HR Admin')
    const CONTENTADMIN_ID = await createUser(Role.ContentAdmin, 'Content Admin')
    const VIEWER_ID = await createUser(Role.Viewer, 'Viewer')

    console.log('✓ Users criados:', {
        SUPERADMIN_ID, COMPANYADMIN_ID, HRADMIN_ID, CONTENTADMIN_ID, VIEWER_ID,
    })

    // ========= 3) LOGIN (pega accessToken) =========
    console.log('→ Login como SuperAdmin…')
    const loginRes = await http.post<{ accessToken: string }>(
        '/auth/login',
        { email: emailsByRole[Role.SuperAdmin], password: 'P@ssw0rd!' }
    )
    if (loginRes.status >= 400 || !loginRes.data?.accessToken) {
        throw new Error(`Falha no login: ${loginRes.status} ${JSON.stringify(loginRes.data)}`)
    }
    const ACCESS_TOKEN = loginRes.data.accessToken
    const authz = { Authorization: `Bearer ${ACCESS_TOKEN}` }
    console.log('✓ accessToken obtido')

    // Pequena espera só para garantir que o refresh hash foi persistido
    await sleep(200)

    // ========= 4) COMPANY SETTINGS =========
    console.log('→ Upsert Company Settings (pt, en, es)…')
    {
        const res = await http.patch(
            `/modules/${COMPANY_ID}/company-settings`,
            {
                defaultLocale: 'pt',
                supportedLocales: ['pt', 'en', 'es'],
                branding: {
                    logoUrl: null,
                    primary: null,
                    success: null,
                    info: null,
                    warning: null,
                    danger: null,
                    gray900: null,
                    gray600: null,
                },
            },
            { headers: authz }
        )
        if (res.status >= 400) {
            console.warn('⚠️  company-settings PATCH respondeu:', res.status, res.data)
        } else {
            console.log('✓ Settings OK')
        }
    }

    // ========= 5) COMPANY MODULES (liga news e surveys) =========
    console.log('→ Ligando módulos news e surveys…')
    for (const key of ['news', 'surveys'] as const) {
        const res = await http.patch(
            `/modules/${COMPANY_ID}/company-modules/${key}`,
            { enabled: true },
            { headers: authz }
        )
        if (res.status >= 400) {
            console.warn(`⚠️  modules PATCH ${key}:`, res.status, res.data)
        } else {
            console.log(`✓ módulo ${key} ON`)
        }
    }

    // ========= 6) SPACES =========
    console.log('→ Criando spaces…')
    async function createSpace(input: {
        name: string; slug: string; description?: string; priority: number
    }) {
        const res = await http.post<Created>('/spaces', {
            companyId: COMPANY_ID,
            name: input.name,
            slug: input.slug,
            description: input.description || null,
            priority: input.priority,
            active: true,
            distributionChannels: ['app'],
        })
        if (res.status >= 400) {
            throw new Error(`Falha ao criar space ${input.slug}: ${res.status} ${JSON.stringify(res.data)}`)
        }
        return res.data.id
    }

    const SPACE_HQ_ID = await createSpace({ name: 'HQ', slug: 'hq', description: 'Headquarters', priority: 1 })
    const SPACE_FIELD_ID = await createSpace({ name: 'Field', slug: 'field', description: 'Frontline teams', priority: 2 })
    console.log('✓ Spaces:', { SPACE_HQ_ID, SPACE_FIELD_ID })

    // ========= 7) CHANNELS =========
    console.log('→ Criando channels…')
    async function createChannel(name: string, type: ChannelType, desc: string, spaceId: string) {
        const res = await http.post<Created>('/channels', {
            name,
            type,
            description: desc,
            companyId: COMPANY_ID,
            spaceIds: [spaceId],
        })
        if (res.status >= 400) {
            throw new Error(`Falha ao criar channel ${name}: ${res.status} ${JSON.stringify(res.data)}`)
        }
        return res.data.id
    }

    const CH_ARTICLES = await createChannel('Company Announcements', ChannelType.ARTICLES, 'Official news', SPACE_HQ_ID)
    const CH_MEDIA = await createChannel('Media Gallery', ChannelType.MEDIA, 'Photos & videos', SPACE_FIELD_ID)
    const CH_UPDATES = await createChannel('Team Updates', ChannelType.UPDATES, 'Daily updates', SPACE_FIELD_ID)
    console.log('✓ Channels:', { CH_ARTICLES, CH_MEDIA, CH_UPDATES })

    // ========= 8) LISTAR (sanity check) =========
    const spacesList = await http.get(`/spaces?companyId=${COMPANY_ID}`)
    const channelsList = await http.get(`/channels?companyId=${COMPANY_ID}`)

    console.log('\n================ RESULTADOS ================')
    console.log('COMPANY_ID:', COMPANY_ID, `(${COMPANY_NAME})`)
    console.log('LOGIN (CMS):', emailsByRole[Role.SuperAdmin], '/ P@ssw0rd!')
    console.log('ACCESS_TOKEN:', ACCESS_TOKEN)
    console.log('Spaces:', spacesList.data)
    console.log('Channels:', channelsList.data)
    console.log('===========================================\n')

    console.log('✅ Seed concluído com sucesso!')
}

main().catch(err => {
    console.error('❌ Seed falhou:', err?.response?.data || err?.message || err)
    process.exit(1)
})