
import axios from 'axios';
// import { login } from './utils';


const API_URL = 'http://localhost:4000';
// Standard login credentials for verifying
const USER_EMAIL = 'admin@iuppy.com.br';
const USER_PASS = '123';

async function verifyEnablement() {
    console.log('--- [1] Logging In ---');
    try {
        const { access_token, companyId } = await login(API_URL, USER_EMAIL, USER_PASS);
        console.log(`✅ Login Success. Company: ${companyId}`);

        console.log('\n--- [2] Enabling NR-1 Module ---');
        // Enable NR-1
        await axios.patch(`${API_URL}/modules/${companyId}/company-modules/nr1`, {
            enabled: true,
            config: {}
        }, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        console.log('✅ NR-1 Module Enabled Successfully');

        // Check list
        console.log('\n--- [3] Verifying List ---');
        const listRes = await axios.get(`${API_URL}/modules/${companyId}/company-modules`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const nr1Mod = listRes.data.find((m: any) => m.key === 'nr1');
        if (nr1Mod && nr1Mod.enabled) {
            console.log('✅ NR-1 found in module list and ENABLED');
        } else {
            console.error('❌ NR-1 NOT found or NOT enabled in list', nr1Mod);
            process.exit(1);
        }

    } catch (e: any) {
        console.error('❌ Test Failed:', e.response ? e.response.data : e.message);
        process.exit(1);
    }
}

// Simple login helper if utils not available
async function login(url: string, email: string, pass: string) {
    const res = await axios.post(`${url}/auth/login`, { email, password: pass });
    // Assuming structure, might need adjustment based on real auth response
    // Decode token or fetch profile to get companyId if not in response
    const token = res.data.accessToken;

    // Get profile for companyId
    const meRes = await axios.get(`${url}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    return { access_token: token, companyId: meRes.data.companyId };
}

verifyEnablement();
