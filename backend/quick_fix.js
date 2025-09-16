import pkg from "pg";
const { Pool } = pkg;

// Simple connection for the fix
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/ant_support",
});

async function quickFix() {
  try {
    console.log("🔧 Quick fix for tv_interfaces table...");

    // Add missing columns if they don't exist
    await pool.query(`
      ALTER TABLE tv_interfaces 
      ADD COLUMN IF NOT EXISTS clickable_areas JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    await pool.query(`
      ALTER TABLE tv_interfaces 
      ADD COLUMN IF NOT EXISTS highlight_areas JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    console.log("✅ Fixed tv_interfaces table schema");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

quickFix();
