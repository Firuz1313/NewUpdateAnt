const { query } = require("./src/utils/database.js");

async function checkTable() {
  try {
    console.log("Checking diagnostic_sessions table structure...");

    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'diagnostic_sessions' 
      ORDER BY ordinal_position
    `);

    console.log("diagnostic_sessions table columns:");
    if (result.rows.length === 0) {
      console.log("  Table does not exist or has no columns");
    } else {
      result.rows.forEach((row) => {
        console.log(
          `  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || "none"})`,
        );
      });
    }

    // Also check if table exists at all
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'diagnostic_sessions'
      );
    `);
    console.log(`Table exists: ${tableExists.rows[0].exists}`);
  } catch (error) {
    console.error("Error checking table:", error.message);
  }

  process.exit(0);
}

checkTable();
