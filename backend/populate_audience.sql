-- Populate news_audience for all users and published news
INSERT INTO news_audience ("companyId", "newsId", "userId")
SELECT 
    n."companyId"::uuid,
    n.id,
    u.id
FROM news_entity n
CROSS JOIN user_entity u
WHERE n."companyId" = '2af4557f-9259-4eed-818d-1d0ffe0b8982'
  AND u."companyId" = '2af4557f-9259-4eed-818d-1d0ffe0b8982'
  AND n."isPublished" = true
  AND n."deletedAt" IS NULL
ON CONFLICT DO NOTHING;
