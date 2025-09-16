-- Fix TV Interface Marks Table Structure
-- Add missing columns that the model expects

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tv_interface_marks'
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add mark_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'mark_type') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN mark_type VARCHAR(50) NOT NULL DEFAULT 'point' 
        CHECK (mark_type IN ('point', 'zone', 'area'));
    END IF;

    -- Add step_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'step_id') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN step_id VARCHAR(255) REFERENCES diagnostic_steps(id) ON DELETE CASCADE;
    END IF;

    -- Add shape column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'shape') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN shape VARCHAR(50) NOT NULL DEFAULT 'circle' 
        CHECK (shape IN ('circle', 'rectangle', 'polygon', 'ellipse'));
    END IF;

    -- Add size column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'size') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN size JSONB;
    END IF;

    -- Add coordinates column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'coordinates') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN coordinates JSONB;
    END IF;

    -- Add background_color column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'background_color') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN background_color VARCHAR(50);
    END IF;

    -- Add is_clickable column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'is_clickable') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN is_clickable BOOLEAN DEFAULT true;
    END IF;

    -- Add is_highlightable column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'is_highlightable') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN is_highlightable BOOLEAN DEFAULT true;
    END IF;

    -- Add click_action column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'click_action') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN click_action VARCHAR(255);
    END IF;

    -- Add hover_action column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'hover_action') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN hover_action VARCHAR(255);
    END IF;

    -- Add animation column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'animation') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN animation VARCHAR(50) DEFAULT 'none' 
        CHECK (animation IN ('pulse', 'glow', 'bounce', 'shake', 'fade', 'blink', 'none'));
    END IF;

    -- Add priority column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tv_interface_marks' 
                   AND column_name = 'priority') THEN
        ALTER TABLE tv_interface_marks 
        ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'critical'));
    END IF;

END $$;

-- Update statistics
ANALYZE tv_interface_marks;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tv_interface_marks'
ORDER BY ordinal_position;
