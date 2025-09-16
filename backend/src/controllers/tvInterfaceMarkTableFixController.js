import { query } from "../utils/database.js";

// Полная диагностика и исправление таблицы tv_interface_marks
export const fullTableDiagnosis = async (req, res) => {
  try {
    console.log("🔍 Starting full table diagnosis...");

    // Получаем все колонки и их типы
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks'
      ORDER BY ordinal_position
    `;
    const columnsResult = await query(columnsQuery);

    console.log("📋 All columns:");
    columnsResult.rows.forEach((col) => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });

    // Ищем UUID колонки
    const uuidColumns = columnsResult.rows.filter(
      (col) => col.data_type === "uuid" || col.udt_name === "uuid",
    );

    console.log(
      "🔍 UUID columns found:",
      uuidColumns.map((col) => col.column_name),
    );

    res.json({
      success: true,
      data: {
        allColumns: columnsResult.rows,
        uuidColumns: uuidColumns,
        totalColumns: columnsResult.rows.length,
        hasUuidColumns: uuidColumns.length > 0,
      },
      message: "Table diagnosis completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Table diagnosis failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to diagnose table",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Исправить все UUID колонки на VARCHAR
export const fixAllUuidColumns = async (req, res) => {
  try {
    console.log("🔧 Starting UUID columns fix...");

    // Получаем все UUID колонки
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable, 
        column_default
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks'
      AND (data_type = 'uuid' OR udt_name = 'uuid')
    `;
    const columnsResult = await query(columnsQuery);
    const uuidColumns = columnsResult.rows;

    console.log(
      "🔍 Found UUID columns:",
      uuidColumns.map((col) => col.column_name),
    );

    if (uuidColumns.length === 0) {
      return res.json({
        success: true,
        data: {
          message: "No UUID columns found to fix",
        },
        timestamp: new Date().toISOString(),
      });
    }

    let operationsPerformed = [];

    // Проверяем количество записей
    const recordCount = await query(
      "SELECT COUNT(*) as count FROM tv_interface_marks",
    );
    console.log(`📊 Records in table: ${recordCount.rows[0].count}`);
    operationsPerformed.push(`Table has ${recordCount.rows[0].count} records`);

    // Если есть записи, очищаем таблицу для безопасного изменения типов
    if (parseInt(recordCount.rows[0].count) > 0) {
      console.log("🗑️ Clearing table for safe column type changes...");
      await query("DELETE FROM tv_interface_marks");
      operationsPerformed.push(
        "Cleared existing records for safe type conversion",
      );
    }

    // Удаляем внешние ключи перед изменением типов
    console.log("🔗 Dropping foreign key constraints...");
    const constraints = await query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'tv_interface_marks' 
      AND constraint_type = 'FOREIGN KEY'
    `);

    for (const constraint of constraints.rows) {
      try {
        console.log(`🗑️ Dropping constraint: ${constraint.constraint_name}`);
        await query(
          `ALTER TABLE tv_interface_marks DROP CONSTRAINT ${constraint.constraint_name}`,
        );
        operationsPerformed.push(
          `Dropped constraint: ${constraint.constraint_name}`,
        );
      } catch (error) {
        console.warn(
          `⚠️ Could not drop constraint ${constraint.constraint_name}:`,
          error.message,
        );
        operationsPerformed.push(
          `Failed to drop constraint: ${constraint.constraint_name}`,
        );
      }
    }

    // Исправляем каждую UUID колонку
    for (const column of uuidColumns) {
      try {
        console.log(
          `🔄 Converting ${column.column_name} from UUID to VARCHAR...`,
        );

        if (column.column_name === "id") {
          // Для ID колонки убираем DEFAULT и делаем VARCHAR
          await query(`
            ALTER TABLE tv_interface_marks 
            ALTER COLUMN ${column.column_name} DROP DEFAULT,
            ALTER COLUMN ${column.column_name} TYPE VARCHAR(255)
          `);
        } else {
          // Для других колонок просто меняем тип
          await query(`
            ALTER TABLE tv_interface_marks 
            ALTER COLUMN ${column.column_name} TYPE VARCHAR(255)
          `);
        }

        console.log(
          `✅ Successfully converted ${column.column_name} to VARCHAR(255)`,
        );
        operationsPerformed.push(
          `Converted ${column.column_name} from UUID to VARCHAR(255)`,
        );
      } catch (error) {
        console.warn(
          `⚠️ Could not convert ${column.column_name}:`,
          error.message,
        );
        operationsPerformed.push(
          `Failed to convert ${column.column_name}: ${error.message}`,
        );
      }
    }

    // Восстанавливаем внешние ключи
    console.log("🔗 Re-adding foreign key constraints...");
    if (uuidColumns.find((col) => col.column_name === "tv_interface_id")) {
      try {
        await query(`
          ALTER TABLE tv_interface_marks 
          ADD CONSTRAINT fk_tv_interface_marks_tv_interface_id 
          FOREIGN KEY (tv_interface_id) REFERENCES tv_interfaces(id) ON DELETE CASCADE
        `);
        console.log("✅ Successfully re-added tv_interface_id foreign key");
        operationsPerformed.push(
          "Re-added tv_interface_id foreign key constraint",
        );
      } catch (error) {
        console.warn(
          "⚠️ Could not re-add tv_interface_id foreign key:",
          error.message,
        );
        operationsPerformed.push(
          "Failed to re-add tv_interface_id foreign key",
        );
      }
    }

    // Обновляем статистику
    console.log("📊 Updating table statistics...");
    await query("ANALYZE tv_interface_marks");
    operationsPerformed.push("Updated table statistics");

    // Проверяем финальную структуру
    const finalColumnsResult = await query(columnsQuery);

    res.json({
      success: true,
      data: {
        initialUuidColumns: uuidColumns,
        finalUuidColumns: finalColumnsResult.rows,
        operationsPerformed,
      },
      message: "UUID columns fix completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ UUID columns fix failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix UUID columns",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default {
  fullTableDiagnosis,
  fixAllUuidColumns,
};
