import { query } from "./src/utils/database.js";

async function checkTVMarksTable() {
  try {
    console.log("Checking tv_interface_marks table...");

    // Check if table exists
    const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'tv_interface_marks'
            );
        `);

    if (!tableCheck.rows[0].exists) {
      console.log("❌ tv_interface_marks table does not exist");
      console.log("🔧 Creating tv_interface_marks table...");

      await query(`
                CREATE TABLE tv_interface_marks (
                    id VARCHAR(255) PRIMARY KEY,
                    tv_interface_id VARCHAR(255) NOT NULL REFERENCES tv_interfaces(id) ON DELETE CASCADE,
                    step_id VARCHAR(255) REFERENCES diagnostic_steps(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    mark_type VARCHAR(50) NOT NULL DEFAULT 'point' CHECK (mark_type IN ('point', 'zone', 'area')),
                    shape VARCHAR(50) NOT NULL DEFAULT 'circle' CHECK (shape IN ('circle', 'rectangle', 'polygon', 'ellipse')),
                    position JSONB NOT NULL,
                    size JSONB,
                    coordinates JSONB,
                    color VARCHAR(50) DEFAULT '#3b82f6',
                    background_color VARCHAR(50),
                    border_color VARCHAR(50),
                    border_width INTEGER DEFAULT 2,
                    opacity DECIMAL(3,2) DEFAULT 0.8,
                    is_clickable BOOLEAN DEFAULT true,
                    is_highlightable BOOLEAN DEFAULT true,
                    click_action VARCHAR(255),
                    hover_action VARCHAR(255),
                    action_value VARCHAR(255),
                    action_description TEXT,
                    expected_result TEXT,
                    hint_text TEXT,
                    tooltip_text TEXT,
                    warning_text TEXT,
                    animation VARCHAR(50) DEFAULT 'none' CHECK (animation IN ('pulse', 'glow', 'bounce', 'shake', 'fade', 'blink', 'none')),
                    animation_duration INTEGER DEFAULT 1000,
                    animation_delay INTEGER DEFAULT 0,
                    display_order INTEGER DEFAULT 0,
                    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
                    is_active BOOLEAN DEFAULT true,
                    is_visible BOOLEAN DEFAULT true,
                    metadata JSONB DEFAULT '{}',
                    tags JSONB DEFAULT '[]',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);

      // Create indexes
      await query(`
                CREATE INDEX idx_tv_interface_marks_tv_interface_id ON tv_interface_marks(tv_interface_id);
                CREATE INDEX idx_tv_interface_marks_step_id ON tv_interface_marks(step_id);
                CREATE INDEX idx_tv_interface_marks_mark_type ON tv_interface_marks(mark_type);
                CREATE INDEX idx_tv_interface_marks_active ON tv_interface_marks(is_active);
            `);

      console.log("✅ tv_interface_marks table created successfully");
    } else {
      console.log("✅ tv_interface_marks table exists");

      // Check columns
      const columns = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'tv_interface_marks' 
                ORDER BY ordinal_position;
            `);

      console.log("Table columns:", columns.rows);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

checkTVMarksTable();
