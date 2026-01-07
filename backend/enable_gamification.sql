-- Enable gamification module for first company
INSERT INTO company_modules (id, "companyId", key, enabled, config, "updatedAt") 
SELECT 
    gen_random_uuid(),
    id,
    'gamification',
    true,
    NULL,
    NOW()
FROM companies 
LIMIT 1
ON CONFLICT ("companyId", key) DO UPDATE 
SET enabled = true, "updatedAt" = NOW();
