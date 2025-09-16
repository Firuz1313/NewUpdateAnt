import database from "./src/utils/database.js";

async function fixSchema() {
  try {
    console.log("🔧 Checking and fixing tv_interfaces schema...");

    // Check if columns exist
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tv_interfaces' AND column_name IN ('clickable_areas', 'highlight_areas');
    `;

    const existingColumns = await database.query(columnsQuery);
    console.log(`Found ${existingColumns.rows.length} matching columns`);

    if (existingColumns.rows.length < 2) {
      console.log("Adding missing columns...");

      // Add missing columns
      await database.query(`
        ALTER TABLE tv_interfaces 
        ADD COLUMN IF NOT EXISTS clickable_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS highlight_areas JSONB NOT NULL DEFAULT '[]'::jsonb;
      `);

      console.log("✅ Columns added successfully");
    } else {
      console.log("✅ All columns exist");
    }

    // Verify the fix
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'tv_interfaces' 
      ORDER BY ordinal_position;
    `;

    const result = await database.query(verifyQuery);
    console.log("Current tv_interfaces schema:");
    result.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`,
      );
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await database.closePool();
  }
}

fixSchema();
