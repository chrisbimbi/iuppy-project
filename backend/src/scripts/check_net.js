
const net = require('net');

function check(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
            console.log(`✅ Connected to ${host}:${port}`);
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            console.log(`❌ Timeout ${host}:${port}`);
            socket.destroy();
            resolve(false);
        });
        socket.on('error', (err) => {
            console.log(`❌ Error ${host}:${port}: ${err.message}`);
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function run() {
    await check('localhost', 5433);
    await check('127.0.0.1', 5433);
    await check('127.0.0.1', 5432);
}

run();
