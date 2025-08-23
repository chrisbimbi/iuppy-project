// backend/tools/seed-contateste-structure.ts
import 'tsconfig-paths/register'
import 'dotenv/config'
import axios from 'axios'
import { ChannelType } from '../../shared/src/types/Channel'

/**
 * Pré-requisitos:
 * - API rodando em http://localhost:4000 (ou ajuste API_URL)
 * - Autenticação opcional: se as rotas exigirem JWT, coloque um token admin em AUTH_TOKEN abaixo.
 */
const API = process.env.API_URL || 'http://localhost:4000'
const COMPANY_ID = '000c0911-58b3-4c80-84bc-fe015eec1961'
const AUTH_TOKEN = process.env.SEED_ACCESS_TOKEN || '' // ex.: 'Bearer eyJ...'

const http = axios.create({
    baseURL: API,
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
    withCredentials: true,
})

// Ajuste de nomes/slug dos spaces
const SPACES = [
    { name: 'BR FILIAL 1', slug: 'br-filial-1', description: 'Brasil - Filial 1' },
    { name: 'BR FILIAL 2', slug: 'br-filial-2', description: 'Brasil - Filial 2' },
    { name: 'US FILIAL 1', slug: 'us-filial-1', description: 'USA - Branch 1' },
    { name: 'US FILIAL 2', slug: 'us-filial-2', description: 'USA - Branch 2' },
    { name: 'ES FILIAL 1', slug: 'es-filial-1', description: 'España - Sucursal 1' },
]

async function run() {
    console.log(`🚀 Criando estrutura para COMPANY_ID=${COMPANY_ID} em ${API}`)

    // 1) Spaces
    console.log('→ Criando spaces…')
    const spaceIds: string[] = []
    for (const [i, s] of SPACES.entries()) {
        const payload = {
            name: s.name,
            slug: s.slug,
            description: s.description,
            priority: i + 1,
            active: true,
            companyId: COMPANY_ID,
        }
        const { data } = await http.post('/spaces', payload)
        spaceIds.push(data.id)
    }
    console.log('✓ Spaces criados:', spaceIds)

    // 2) Channels (2 por space; alterna types)
    console.log('→ Criando channels…')
    const types = [ChannelType.ARTICLES, ChannelType.MEDIA, ChannelType.UPDATES]
    const created: string[] = []
    for (const sid of spaceIds) {
        const c1 = {
            name: 'Comunicados',
            description: 'Avisos e comunicados',
            companyId: COMPANY_ID,
            spaceIds: [sid],
            type: types[0],
        }
        const c2 = {
            name: 'Highlights',
            description: 'Destaques e mídia',
            companyId: COMPANY_ID,
            spaceIds: [sid],
            type: types[1],
        }
        const r1 = await http.post('/channels', c1)
        const r2 = await http.post('/channels', c2)
        created.push(r1.data.id, r2.data.id)
        // roda o array de types para variar
        types.push(types.shift()!)
    }
    console.log('✓ Channels criados:', created)

    console.log('✅ Estrutura concluída!')
}

run().catch((err) => {
    console.error('❌ Seed error:', err?.response?.data || err.message)
    process.exit(1)
})