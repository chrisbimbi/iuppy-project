
import axios from 'axios';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const API_URL = 'http://localhost:4000';
const EMAIL = 'admin@iuppy.com.br';
const PASSWORD = '123';

let TOKEN = '';
let COMPANY_ID = '';

async function login() {
    try {
        console.log('--- [1] Logging In ---');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: '123',
        });
        TOKEN = res.data.accessToken;
        // Decode token to get companyId for tests if needed, or fetch user profile
        // For now assume we get company from a profile call or similar if needed. 
        // Let's fetch profile.
        const profile = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${TOKEN}` } });
        COMPANY_ID = profile.data.companyId;

        console.log(`✅ Login Success. Token 10 chars: ${TOKEN.substring(0, 10)}... Company: ${COMPANY_ID}`);
        console.log(`✅ Login Success. Token 10 chars: ${TOKEN.substring(0, 10)}... Company: ${COMPANY_ID}`);
    } catch (error: any) {
        console.error('❌ Login Failed:', JSON.stringify(error.response?.data || error.message));
        process.exit(1);
    }
}

async function testNews() {
    console.log('\n--- [2] Testing News (NR-1 vs Standard) ---');
    try {
        // 0. Fetch a valid channel
        const channels = await axios.get(`${API_URL}/channels?companyId=${COMPANY_ID}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
        const channelId = channels.data[0]?.id;
        if (!channelId) throw new Error('No channels found');
        console.log(`Using Channel: ${channelId}`);

        // 1. Create Normal News
        // Using V1 endpoint for creation as V2 is read-only/interaction
        const normalNews = await axios.post(`${API_URL}/news`, {
            title: `Normal News ${randomUUID()}`,
            content: 'Standard content',
            channelId: channelId,
            isPublished: true,
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        console.log(`✅ Normal News Created: ${normalNews.data.id} | isNr1: ${normalNews.data.isNr1}`);

        // 2. Create NR-1 News
        const nr1News = await axios.post(`${API_URL}/news`, {
            title: `NR-1 News ${randomUUID()}`,
            content: 'Safety First content',
            channelId: channelId,
            isPublished: true,
            isNr1: true
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        console.log(`✅ NR-1 News Created: ${nr1News.data.id} | isNr1: ${nr1News.data.isNr1}`);

        if (nr1News.data.isNr1 !== true) console.warn('⚠️ WARNING: NR-1 Flag not persisted!');

        return { normalId: normalNews.data.id, nr1Id: nr1News.data.id };
    } catch (e: any) {
        console.error('❌ News Test Failed:', e.response?.data || e.message);
    }
}

async function testInteractions(newsId: string) {
    console.log('\n--- [3] Testing Interactions (Legal Audit) ---');
    try {
        const meta = { ip: '127.0.0.1', userAgent: 'Bot/TestScript', disclaimerParams: { accepted: true } };
        // Correct Route: /v2/news/:id/ack and pass meta in body
        await axios.post(`${API_URL}/v2/news/${newsId}/ack`, {
            meta
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        console.log('✅ Acknowledge sent with meta data');
    } catch (e: any) {
        console.error('❌ Interactions Test Failed:', JSON.stringify(e.response?.data || e.message));
    }
}

async function testRisks() {
    console.log('\n--- [4] Testing NR-1 Risks & Types ---');
    try {
        // 1. Create Risk Type
        // Note: We need to register the Controller for RiskTypes first? or is it in generic risks?
        // Checking the plan, we created the Entity but did we expose a controller for Types?
        // The plan said "Settings/RiskTypesCrud.tsx" which implies a CRUD endpoint. 
        // Checking `Nr1Module`, we didn't explicitly add `Nr1RiskTypesController`. 
        // We might have missed creating the Controller! 
        // We will test Risk Record creation directly linking a type if possible, or just standard fields.

        const risk = await axios.post(`${API_URL}/nr1/risks`, {
            company_id: COMPANY_ID,
            processo: "Automated Test",
            perigo: "Radiation",
            classificacao_risco: "a", // Alto
            ambiente: "Lab",
            atividade: "Testing",
            fonte_circunstancia: "Source X",
            possiveis_lesoes: "Burning",
            grupos_expostos: ["Scientists"],
            medidas_prevencao: [],
            caracterizacao_exposicao: "Rare"
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        console.log(`✅ Risk Created: ${risk.data.id}`);

        // 2. Publish
        await axios.post(`${API_URL}/nr1/risks/publish`, { companyId: COMPANY_ID }, { headers: { Authorization: `Bearer ${TOKEN}` } });
        console.log('✅ Risk Version Published');
    } catch (e: any) {
        console.error('❌ Risk Test Failed:', e.response?.data || e.message);
    }
}

async function testRiskTypes() {
    console.log('\n--- [4.5] Testing Risk Types ---');
    try {
        const typeName = `Type ${randomUUID().substring(0, 8)}`;
        const res = await axios.post(`${API_URL}/nr1/risk-types`, {
            name: typeName,
            description: "Auto Generated",
            color: "#FF0000"
        }, { headers: { Authorization: `Bearer ${TOKEN}` } });

        console.log(`✅ Risk Type Created: ${res.data.id} - ${res.data.name}`);

        const list = await axios.get(`${API_URL}/nr1/risk-types`, { headers: { Authorization: `Bearer ${TOKEN}` } });
        const found = list.data.find((t: any) => t.id === res.data.id);
        if (found) console.log('✅ Risk Type found in list');
        else console.warn('⚠️ Risk Type NOT found in list');

    } catch (e: any) {
        console.error('❌ Risk Types Test Failed:', e.response?.data || e.message);
    }
}

async function testAnalytics() {
    console.log('\n--- [5] Testing Analytics V2 (Hub) ---');
    try {
        const res = await axios.get(`${API_URL}/nr1/analytics/dashboard?companyId=${COMPANY_ID}`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        console.log('✅ Analytics Data:', JSON.stringify(res.data, null, 2));

        // Assert we see some numbers
        if (res.data.content && res.data.content.totalNews > 0) {
            console.log('✅ CORRECT: Analytics is seeing the NR-1 News we created.');
        } else {
            console.warn('⚠️ WARNING: Analytics did not count the NR-1 News? (Might be async or cache)');
        }
    } catch (e: any) {
        console.error('❌ Analytics Test Failed:', e.response?.data || e.message);
    }
}

async function run() {
    await login();
    const newsIds = await testNews();
    if (newsIds?.nr1Id) {
        await testInteractions(newsIds.nr1Id);
    }
    await testRisks();
    await testRiskTypes();
    await testAnalytics();
}

run();
