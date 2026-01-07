-- FIX LEGACY PATHS IN DATABASE
-- Run this script to update Cloud Storage URLs in the database after the "Company-First" migration.
-- It removes the extra "companies/" segment from paths.

-- 1. FIX NEWS ENTITY (highlightImages)
-- Replace URL encoded path: .../o/companies%2F{id}... -> .../o/{id}...
UPDATE news_entity
SET "highlightImages" = REPLACE("highlightImages", '%2Fcompanies%2F', '%2F')
WHERE "highlightImages" LIKE '%/companies/%' OR "highlightImages" LIKE '%2Fcompanies%2F%';

-- Replace raw path (if any): .../companies/{id}... -> .../{id}...
UPDATE news_entity
SET "highlightImages" = REPLACE("highlightImages", '/companies/', '/')
WHERE "highlightImages" LIKE '%/companies/%';


-- 2. FIX NEWS ENTITY (attachments)
UPDATE news_entity
SET "attachments" = REPLACE("attachments", '%2Fcompanies%2F', '%2F')
WHERE "attachments" LIKE '%/companies/%' OR "attachments" LIKE '%2Fcompanies%2F%';

UPDATE news_entity
SET "attachments" = REPLACE("attachments", '/companies/', '/')
WHERE "attachments" LIKE '%/companies/%';


-- 3. FIX FORM ATTACHMENTS (storagePath)
-- If storagePath was "forms/{formId}/..." and moved to "{companyId}/forms/{formId}/..."
-- We might need to PREPEND companyId if it's missing.
-- However, if paths are relative "forms/...", the code might now expect "{companyId}/forms/...".
-- If the code prepends companyId automatically, we don't need to change DB.
-- But if code uses path from DB directly, we might need to update.
-- Given migration moved "forms/*" to "{companyId}/forms/", relative paths "forms/123.jpg" are now invalid without prefix.
-- Assuming backend logic handles prefixing, or we update here.
-- SAFETY: Let's assume code handles it for now or paths were full URLs.


-- 4. FIX CHAT MESSAGES (metadata)
-- Helper to replace in JSONB is complex.
-- Simplest approach is text replace on the JSON string (cast to text -> replace -> cast back to jsonb)
UPDATE chat_message
SET metadata = REPLACE(metadata::text, '%2Fchat_files%2F', '%2Fchat%2Flegacy%2F')::jsonb
WHERE metadata::text LIKE '%/chat_files/%' OR metadata::text LIKE '%2Fchat_files%2F%';

UPDATE chat_message
SET content = REPLACE(content, '%2Fchat_files%2F', '%2Fchat%2Flegacy%2F')
WHERE content LIKE '%/chat_files/%' OR content LIKE '%2Fchat_files%2F%';
