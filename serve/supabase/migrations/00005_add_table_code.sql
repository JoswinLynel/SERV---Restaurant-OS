-- Migration: 00005_add_table_code.sql
-- Description: Add unique short table code to tables table and set codes for Madras Table demo

-- 1. Add code column if it does not already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'code'
    ) THEN
        ALTER TABLE tables ADD COLUMN code TEXT UNIQUE;
    END IF;
END $$;

-- 2. Populate codes for Madras Table existing tables (preserving all existing UUIDs)
UPDATE tables SET code = 'MT1' WHERE id = '30000000-0000-0000-0000-000000000001' AND (code IS NULL OR code != 'MT1');
UPDATE tables SET code = 'MT2' WHERE id = '30000000-0000-0000-0000-000000000002' AND (code IS NULL OR code != 'MT2');
UPDATE tables SET code = 'MT3' WHERE id = '30000000-0000-0000-0000-000000000003' AND (code IS NULL OR code != 'MT3');
UPDATE tables SET code = 'MT4' WHERE id = '30000000-0000-0000-0000-000000000004' AND (code IS NULL OR code != 'MT4');
UPDATE tables SET code = 'MT5' WHERE id = '30000000-0000-0000-0000-000000000005' AND (code IS NULL OR code != 'MT5');
UPDATE tables SET code = 'MT6' WHERE id = '30000000-0000-0000-0000-000000000006' AND (code IS NULL OR code != 'MT6');
