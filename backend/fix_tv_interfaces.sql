-- Fix tv_interfaces table by adding missing columns
-- This script adds the missing clickable_areas and highlight_areas columns

-- Add clickable_areas column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tv_interfaces' AND column_name = 'clickable_areas'
    ) THEN
        ALTER TABLE tv_interfaces 
        ADD COLUMN clickable_areas JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added clickable_areas column to tv_interfaces table';
    ELSE
        RAISE NOTICE 'clickable_areas column already exists in tv_interfaces table';
    END IF;
END $$;

-- Add highlight_areas column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tv_interfaces' AND column_name = 'highlight_areas'
    ) THEN
        ALTER TABLE tv_interfaces 
        ADD COLUMN highlight_areas JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added highlight_areas column to tv_interfaces table';
    ELSE
        RAISE NOTICE 'highlight_areas column already exists in tv_interfaces table';
    END IF;
END $$;

-- Verify the fix by showing the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tv_interfaces' 
ORDER BY ordinal_position;
