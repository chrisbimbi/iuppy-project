
import * as fs from 'fs';
import * as path from 'path';

// Utils to recursively walk directories
function walkDir(dir: string, callback: (filePath: string) => void) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else {
            callback(filePath);
        }
    });
}

const services: string[] = [];
const controllers: string[] = [];
const entities: string[] = [];

console.log('--- ARCHITECTURE MAP START ---');

const srcDir = path.join(__dirname, '../src');

if (!fs.existsSync(srcDir)) {
    console.error('Source directory not found:', srcDir);
    process.exit(1);
}

walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.service.ts')) {
        services.push(filePath.replace(srcDir, ''));
    } else if (filePath.endsWith('.controller.ts')) {
        controllers.push(filePath.replace(srcDir, ''));
    } else if (filePath.endsWith('.entity.ts')) {
        entities.push(filePath.replace(srcDir, ''));
    }
});

console.log(`\n\n--- CONTROLLERS (${controllers.length}) ---`);
controllers.forEach(c => console.log(c));

console.log(`\n\n--- SERVICES (${services.length}) ---`);
services.forEach(s => console.log(s));

console.log(`\n\n--- ENTITIES (${entities.length}) ---`);
entities.forEach(e => console.log(e));

console.log('\n--- ARCHITECTURE MAP END ---');
