-- Migration: Add post/comment cooldown tracking fields
-- Description: Adds last_post_time and last_comment_time to users table for spam prevention

-- For PostgreSQL
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_post_time TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_comment_time TIMESTAMP;

-- For SQLite (will be handled by SQLAlchemy if using SQLite)
-- Schema update is handled by SQLAlchemy during migration
