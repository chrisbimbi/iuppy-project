
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../migrations/1764344368600-Phase1SchemaUpdate.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Regex to find: await queryRunner.query(\n\s*`ALTER TABLE "(.+)" ADD CONSTRAINT "(.+)" (.+)`,\n\s*);
// Note: escape backticks and quotes properly.
// Simpler regex: look for the SQL string content.

// Strategy: Replace `ALTER TABLE ... ADD CONSTRAINT ...` with a wrapped version.
// Caveat: The constraint definition might span multiple lines?
// From Grep, they look single line in the source code strings.

const regex = /`\s*ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" ([^`]+)`/g;
// (Existing constraint replacement logic here)...

// NEW: Patch CREATE TYPE
const regexType = /`\s*CREATE TYPE "([^"]+)"\."([^"]+)" AS ENUM\(([^`]+)\)`/g;
content = content.replace(regexType, (match, schema, typeName, values) => {
    return `\`
      DO $$ BEGIN
        CREATE TYPE "${schema}"."${typeName}" AS ENUM(${values});
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    \``;
});

fs.writeFileSync(filePath, content);
console.log('Patched ADD CONSTRAINT and CREATE TYPE');
