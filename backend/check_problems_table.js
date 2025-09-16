import { query } from "./src/utils/database.js";

async function checkProblemsTable() {
  try {
    console.log("🔍 Checking problems table...");

    // Check if table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'problems'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("❌ problems table does not exist");
      return;
    }

    console.log("✅ problems table exists");

    // Check columns
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'problems' 
      ORDER BY ordinal_position;
    `);

    console.log("📋 Table columns:");
    columns.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : "NULL"} ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`,
      );
    });

    // Count total problems
    const countResult = await query("SELECT COUNT(*) as total FROM problems");
    console.log(`📊 Total problems: ${countResult.rows[0].total}`);

    // Show sample data
    const sampleData = await query(`
      SELECT id, title, device_id, category, status, is_active, created_at
      FROM problems 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("📄 Recent problems:");
    sampleData.rows.forEach((row) => {
      console.log(
        `  - ${row.id}: "${row.title}" (${row.device_id}) [${row.category}] ${row.status} ${row.is_active ? "ACTIVE" : "INACTIVE"}`,
      );
    });

    // Check devices table
    console.log("\n🔍 Checking devices table...");
    const devicesCount = await query("SELECT COUNT(*) as total FROM devices");
    console.log(`📊 Total devices: ${devicesCount.rows[0].total}`);

    const devicesList = await query(`
      SELECT id, name, brand, model, is_active
      FROM devices 
      WHERE is_active = true
      ORDER BY name
    `);

    console.log("📄 Active devices:");
    devicesList.rows.forEach((row) => {
      console.log(`  - ${row.id}: ${row.name} (${row.brand} ${row.model})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

checkProblemsTable();
