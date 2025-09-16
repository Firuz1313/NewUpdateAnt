import database from "./src/utils/database.js";

async function fixDiagnosticSessionsSchema() {
  try {
    console.log("🔧 Checking and fixing diagnostic_sessions schema...");

    // Check if is_active column exists in diagnostic_sessions
    const checkDiagnosticSessionsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'diagnostic_sessions' AND column_name = 'is_active';
    `;

    const sessionsResult = await database.query(checkDiagnosticSessionsQuery);
    console.log(
      `Found ${sessionsResult.rows.length} is_active column in diagnostic_sessions`,
    );

    if (sessionsResult.rows.length === 0) {
      console.log("Adding missing is_active column to diagnostic_sessions...");

      await database.query(`
        ALTER TABLE diagnostic_sessions 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
      `);

      console.log("✅ is_active column added to diagnostic_sessions");
    } else {
      console.log("✅ is_active column already exists in diagnostic_sessions");
    }

    // Check if is_active column exists in diagnostic_steps
    const checkDiagnosticStepsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'diagnostic_steps' AND column_name = 'is_active';
    `;

    const stepsResult = await database.query(checkDiagnosticStepsQuery);
    console.log(
      `Found ${stepsResult.rows.length} is_active column in diagnostic_steps`,
    );

    if (stepsResult.rows.length === 0) {
      console.log("Adding missing is_active column to diagnostic_steps...");

      await database.query(`
        ALTER TABLE diagnostic_steps 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
      `);

      console.log("✅ is_active column added to diagnostic_steps");
    } else {
      console.log("✅ is_active column already exists in diagnostic_steps");
    }

    // Verify the fix
    console.log("\n🔍 Verifying diagnostic_sessions schema:");
    const verifySessionsQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'diagnostic_sessions' 
      ORDER BY ordinal_position;
    `;

    const sessionsSchema = await database.query(verifySessionsQuery);
    sessionsSchema.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`,
      );
    });

    console.log("\n🔍 Verifying diagnostic_steps schema:");
    const verifyStepsQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'diagnostic_steps' 
      ORDER BY ordinal_position;
    `;

    const stepsSchema = await database.query(verifyStepsQuery);
    stepsSchema.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (${row.is_nullable === "nullable" ? "nullable" : "not null"})`,
      );
    });

    console.log("\n🎉 Schema fix completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing schema:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    await database.closePool();
  }
}

fixDiagnosticSessionsSchema();
