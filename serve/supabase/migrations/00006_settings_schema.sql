-- Migration: 00006_settings_schema.sql
-- Description: Add phone and email to restaurants, and a unique public code directly to tables.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'phone'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'email'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN email TEXT;
    END IF;
END $$;
