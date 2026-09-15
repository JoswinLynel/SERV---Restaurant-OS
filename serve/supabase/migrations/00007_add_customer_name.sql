-- Migration: Add customer_name column to orders table
-- This column stores the guest name captured during the welcome flow.
-- It is nullable to preserve backward compatibility with historical orders.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;

-- Add a comment for documentation
COMMENT ON COLUMN orders.customer_name IS 'Guest name captured at the welcome screen before ordering. NULL for historical/anonymous orders.';
