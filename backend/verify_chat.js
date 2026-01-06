// verify_chat.js
const http = require('http');

// CONFIG
const BASE_URL = 'http://localhost:3000';
// YOU MUST SET A VALID TOKEN HERE FOR A TEST USER
const TOKEN = 'YOUR_TEST_TOKEN_HERE';

async function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        };

        //console.log(`${method} ${path}`);

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) { resolve(data); }
                } else {
                    reject(`Error ${res.statusCode}: ${data}`);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log('--- STARTING CHAT VERIFICATION ---');

        // 1. Get Me (verify token)
        // const me = await request('GET', '/users/me');
        // console.log(`Logged in as: ${me.email}`);
        // const myId = me.id;

        // 2. Create Conversation
        // Need another user ID. Mocking a fake one or using a known one is tricky.
        // For this script to work generically, we just list conversations first.

        console.log('Fetching initial conversations...');
        const initialList = await request('GET', '/chat/conversations');
        console.log(`Found ${initialList.length} conversations.`);

        if (initialList.length > 0) {
            const targetConv = initialList[0];
            console.log(`Using conversation: ${targetConv.id} (${targetConv.name})`);

            // 3. Send Message
            const msgContent = `Automated Check ${Date.now()}`;
            console.log(`Sending message: "${msgContent}"`);

            // Use Socket Gateway usually, but verify via REST if we had one?
            // Wait, current implementation uses Socket for sending... do we have a REST endpoint for sending?
            // Checking ChatController... NO. ChatController only has GET messages.
            // Sending is via Gateway.

            console.log('WARN: Sending is via Socket.io only. Cannot verify send via REST script without socket client.');
            console.log('Checking GET messages endpoint...');

            const messages = await request('GET', `/chat/conversations/${targetConv.id}/messages`);
            console.log(`Fetched ${messages.length} messages.`);

            // 4. Verify Unread
            const unread = await request('GET', '/chat/unread-count');
            console.log('Unread count:', unread);
        } else {
            console.log('No conversations found to test. Create one in UI first.');
        }

        console.log('--- VERIFICATION COMPLETE ---');
    } catch (e) {
        console.error('FAILED:', e);
    }
}

run();
