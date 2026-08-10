INSERT INTO stickers (
  category_id,
  title,
  image_url,
  original_filename,
  mime_type,
  sort_order
)
SELECT
  sc.id,
  'ZestCaseSoul',
  '/assets/zestcasesoul-social-transparent.png',
  'zestcasesoul-social-transparent.png',
  'image/png',
  10
FROM sticker_categories sc
WHERE sc.slug = 'symbols'
  AND NOT EXISTS (
    SELECT 1
    FROM stickers s
    WHERE s.image_url = '/assets/zestcasesoul-social-transparent.png'
  )
LIMIT 1;
