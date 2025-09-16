// Temporary script to add missing columns to tv_interfaces table
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/ant_support",
});

async function addMissingColumns() {
  const client = await pool.connect();

  try {
    console.log("🔧 Adding missing columns to tv_interfaces table...");

    // Add clickable_areas column
    await client.query(`
      ALTER TABLE tv_interfaces 
      ADD COLUMN IF NOT EXISTS clickable_areas JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    // Add highlight_areas column
    await client.query(`
      ALTER TABLE tv_interfaces 
      ADD COLUMN IF NOT EXISTS highlight_areas JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    console.log("✅ Successfully added missing columns");

    // Verify columns exist
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tv_interfaces' AND column_name IN ('clickable_areas', 'highlight_areas');
    `);

    console.log(
      `📊 Found ${result.rows.length} required columns:`,
      result.rows.map((r) => r.column_name),
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns();
