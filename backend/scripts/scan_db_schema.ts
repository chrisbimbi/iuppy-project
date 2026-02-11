
import * as fs from 'fs';
import * as path from 'path';

// Regex to find @Column definitions
// Matches: @Column( ... ) fieldName: type;
// Simplistic regex, but good enough for collision detection
const columnRegex = /@Column\s*\([^)]*\)\s*\n?\s*([a-zA-Z0-9_]+)/g;
const entityRegex = /@Entity\s*\(['"]([^'"]+)['"]\)/;

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entityMatch = content.match(entityRegex);
    if (entityMatch) {
        const tableName = entityMatch[1];
        console.log(`\nTABLE: ${tableName} (${path.basename(filePath)})`);

        let match;
        // Reset regex index
        columnRegex.lastIndex = 0;
        const columns: string[] = [];

        // Match simple @Column decorators
        while ((match = columnRegex.exec(content)) !== null) {
            columns.push(match[1]);
        }

        // Also look for simple @Column() with no args if logic changes, 
        // but typically it has args or is just @Column() line
        // Let's add a more generic one for "propName"

        if (columns.length > 0) {
            console.log('  Columns:', columns.join(', '));
            if (columns.includes('isNr1')) {
                console.error(`  [WARN] COLLISION DETECTED: 'isNr1' already exists in ${tableName}!`);
            }
        } else {
            // Fallback for simple properties
            // console.log('  (No columns detected by simple regex)');
        }
    }
}

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

const srcDir = path.join(__dirname, '../src');
console.log('--- DB SCHEMA SCAN START ---');
walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.entity.ts')) {
        scanFile(filePath);
    }
});
console.log('\n--- DB SCHEMA SCAN END ---');
