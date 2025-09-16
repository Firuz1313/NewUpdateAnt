import { query } from "../utils/database.js";

// Диагностика структуры таблицы tv_interface_marks
export const diagnoseTVInterfaceMarksTable = async (req, res) => {
  try {
    console.log("🔍 Starting TV interface marks table diagnosis...");

    // 1. Проверяем существование таблицы
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tv_interface_marks'
      )
    `;
    const tableExistsResult = await query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;

    if (!tableExists) {
      return res.json({
        success: false,
        error: "Table tv_interface_marks does not exist",
        data: {
          tableExists: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Получаем структуру таблицы
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks'
      ORDER BY ordinal_position
    `;
    const columnsResult = await query(columnsQuery);

    // 3. Получаем ограничения (constraints)
    const constraintsQuery = `
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'tv_interface_marks'
    `;
    const constraintsResult = await query(constraintsQuery);

    // 4. Получаем внешние ключи
    const foreignKeysQuery = `
      SELECT 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.key_column_usage AS kcu
      JOIN information_schema.constraint_column_usage AS ccu
        ON kcu.constraint_name = ccu.constraint_name
      WHERE kcu.table_name = 'tv_interface_marks'
        AND EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          WHERE tc.constraint_name = kcu.constraint_name
            AND tc.constraint_type = 'FOREIGN KEY'
        )
    `;
    const foreignKeysResult = await query(foreignKeysQuery);

    // 5. Получаем индексы
    const indexesQuery = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'tv_interface_marks'
    `;
    const indexesResult = await query(indexesQuery);

    // 6. Получаем количество записей
    const countQuery = `SELECT COUNT(*) as total FROM tv_interface_marks`;
    const countResult = await query(countQuery);

    // 7. Получаем примеры данных (если есть)
    const sampleQuery = `SELECT * FROM tv_interface_marks LIMIT 3`;
    const sampleResult = await query(sampleQuery);

    const diagnosis = {
      tableExists: true,
      totalRecords: parseInt(countResult.rows[0].total),
      columns: columnsResult.rows,
      constraints: constraintsResult.rows,
      foreignKeys: foreignKeysResult.rows,
      indexes: indexesResult.rows,
      sampleData: sampleResult.rows,
      expectedColumns: [
        "id",
        "tv_interface_id",
        "step_id",
        "name",
        "description",
        "mark_type",
        "shape",
        "position",
        "size",
        "coordinates",
        "color",
        "background_color",
        "border_color",
        "border_width",
        "opacity",
        "is_clickable",
        "is_highlightable",
        "click_action",
        "hover_action",
        "action_value",
        "action_description",
        "expected_result",
        "hint_text",
        "tooltip_text",
        "warning_text",
        "animation",
        "animation_duration",
        "animation_delay",
        "display_order",
        "priority",
        "is_active",
        "is_visible",
        "metadata",
        "tags",
        "created_at",
        "updated_at",
      ],
      missingColumns: [],
    };

    // Вычисляем отсутствующие колонки
    const existingColumnNames = columnsResult.rows.map(
      (row) => row.column_name,
    );
    diagnosis.missingColumns = diagnosis.expectedColumns.filter(
      (col) => !existingColumnNames.includes(col),
    );

    console.log("📋 Table diagnosis completed");
    console.log("Existing columns:", existingColumnNames);
    console.log("Missing columns:", diagnosis.missingColumns);

    res.json({
      success: true,
      data: diagnosis,
      message: "Table diagnosis completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Table diagnosis failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to diagnose table structure",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Создать минимальную структуру таблицы, если она не соответствует ожиданиям
export const createMinimalTVInterfaceMarksTable = async (req, res) => {
  try {
    console.log("🔧 Creating minimal TV interface marks table...");

    // Проверяем существование таблицы
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tv_interface_marks'
      )
    `;
    const tableExistsResult = await query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;

    if (!tableExists) {
      // Создаем таблицу с минимальной структурой
      const createTableQuery = `
        CREATE TABLE tv_interface_marks (
          id VARCHAR(255) PRIMARY KEY,
          tv_interface_id VARCHAR(255) NOT NULL REFERENCES tv_interfaces(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          position JSONB NOT NULL,
          color VARCHAR(50) DEFAULT '#3b82f6',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      await query(createTableQuery);

      // Создаем базовые индексы
      await query(
        "CREATE INDEX idx_tv_interface_marks_tv_interface_id ON tv_interface_marks(tv_interface_id)",
      );
      await query(
        "CREATE INDEX idx_tv_interface_marks_active ON tv_interface_marks(is_active)",
      );

      console.log("✅ Minimal table created successfully");
    } else {
      console.log(
        "ℹ️ Table already exists, checking for missing essential columns...",
      );

      // Получаем существующие колонки
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks'
      `;
      const columnsResult = await query(columnsQuery);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      // Добавляем критически важные колонки, если их нет
      const essentialColumns = [
        {
          name: "position",
          definition: 'JSONB NOT NULL DEFAULT \'{"x": 0, "y": 0}\'',
        },
        { name: "color", definition: "VARCHAR(50) DEFAULT '#3b82f6'" },
        { name: "is_active", definition: "BOOLEAN DEFAULT true" },
      ];

      for (const col of essentialColumns) {
        if (!existingColumns.includes(col.name)) {
          try {
            await query(
              `ALTER TABLE tv_interface_marks ADD COLUMN ${col.name} ${col.definition}`,
            );
            console.log(`✅ Added essential column: ${col.name}`);
          } catch (error) {
            console.warn(`⚠️ Could not add column ${col.name}:`, error.message);
          }
        }
      }
    }

    // Обновляем статистику
    await query("ANALYZE tv_interface_marks");

    res.json({
      success: true,
      message: "Minimal table structure ensured",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Failed to create minimal table:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create minimal table structure",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default {
  diagnoseTVInterfaceMarksTable,
  createMinimalTVInterfaceMarksTable,
};
