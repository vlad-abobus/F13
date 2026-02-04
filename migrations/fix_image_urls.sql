-- Migration script to fix invalid image URLs in the database
-- This script ensures image_url columns are NULL for empty or invalid values
-- Compatible with both PostgreSQL and SQLite

-- ============================================
-- 1. Fix posts.image_url
-- ============================================
-- Set NULL for empty strings, whitespace-only strings, or invalid URLs
UPDATE posts 
SET image_url = NULL 
WHERE image_url IS NOT NULL 
  AND (
    TRIM(image_url) = '' 
    OR image_url = 'null'
    OR image_url = 'NULL'
    OR image_url = 'undefined'
    OR LENGTH(TRIM(image_url)) = 0
  );

-- ============================================
-- 2. Fix users.avatar_url
-- ============================================
UPDATE users 
SET avatar_url = NULL 
WHERE avatar_url IS NOT NULL 
  AND (
    TRIM(avatar_url) = '' 
    OR avatar_url = 'null'
    OR avatar_url = 'NULL'
    OR avatar_url = 'undefined'
    OR LENGTH(TRIM(avatar_url)) = 0
  );

-- ============================================
-- 3. Fix profile_posts.image_url
-- ============================================
UPDATE profile_posts 
SET image_url = NULL 
WHERE image_url IS NOT NULL 
  AND (
    TRIM(image_url) = '' 
    OR image_url = 'null'
    OR image_url = 'NULL'
    OR image_url = 'undefined'
    OR LENGTH(TRIM(image_url)) = 0
  );

-- ============================================
-- 4. Verify the changes (optional, for checking)
-- ============================================
-- Uncomment to see counts of NULL vs non-NULL values:
-- SELECT 
--   'posts' as table_name,
--   COUNT(*) FILTER (WHERE image_url IS NULL) as null_count,
--   COUNT(*) FILTER (WHERE image_url IS NOT NULL) as non_null_count
-- FROM posts
-- UNION ALL
-- SELECT 
--   'users' as table_name,
--   COUNT(*) FILTER (WHERE avatar_url IS NULL) as null_count,
--   COUNT(*) FILTER (WHERE avatar_url IS NOT NULL) as non_null_count
-- FROM users
-- UNION ALL
-- SELECT 
--   'profile_posts' as table_name,
--   COUNT(*) FILTER (WHERE image_url IS NULL) as null_count,
--   COUNT(*) FILTER (WHERE image_url IS NOT NULL) as non_null_count
-- FROM profile_posts;
