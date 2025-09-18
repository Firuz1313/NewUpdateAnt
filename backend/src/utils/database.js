import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Modules helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка переменных окружения
dotenv.config();

const { Pool, Client } = pkg;

// Определяем строку подключения из популярных переменных окружения (Vercel/Neon)
const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.VERCEL_POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

// Конфигурация подключения к PostgreSQL
let dbConfig;

if (CONNECTION_STRING) {
  // Use common connection string (Neon/Vercel/Heroku)
  dbConfig = {
    connectionString: CONNECTION_STRING,
    ssl:
      CONNECTION_STRING.includes("neon.tech") ||
      CONNECTION_STRING.includes("sslmode=require") ||
      process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,

    // Настройки pool соединений (увел��чены для TV interface операций)
    max: 50, // максимальное количество соединений в pool (увеличено с 20)
    min: 5, // минимальное количество соединений (увеличено с 2)
    idleTimeoutMillis: 60000, // время простоя перед закрытием соединения (увеличено)
    connectionTimeoutMillis: 15000, // таймаут п��дключения (увеличено)
    maxUses: 7500, // максимальное количество использований соединения
  };
} else {
  // Fallback to individual env vars
  dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "ant_support",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,

    // Настройки pool соединений (увеличены для TV interface операций)
    max: 50, // максимальное количество соединений в pool (увеличено с 20)
    min: 10, // минимальное количество соединений (увеличено с 5)
    idleTimeoutMillis: 60000, // время простоя перед закрытием соединения (увеличено)
    connectionTimeoutMillis: 15000, // таймаут подключения (увеличено)
    maxUses: 7500, // максимальное количество использований соединения
  };
}

// Создание pool соединений
const pool = new Pool(dbConfig);

// Обработка событий pool
pool.on("connect", (client) => {
  console.log("📊 Новое подключение к PostgreSQL установлено");
});

pool.on("error", (err, client) => {
  console.error("📊 Ошибка подключения к PostgreSQL:", err.message);
});

pool.on("acquire", (client) => {
  if (process.env.DEBUG_SQL === "true") {
    console.log("📊 Клиент получен из pool");
  }
});

pool.on("release", (client) => {
  if (process.env.DEBUG_SQL === "true") {
    console.log("📊 Клиент возвращен в pool");
  }
});

// PostgreSQL only configuration

// Фу��кция проверки подключения к базе данных
export async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT NOW() as current_time, version() as postgres_version",
    );

    console.log("✅ Подключение к PostgreSQL успешно");
    console.log(`🕐 Время сервера: ${result.rows[0].current_time}`);
    console.log(
      `📋 Версия PostgreSQL: ${result.rows[0].postgres_version.split(" ")[0]}`,
    );

    return {
      success: true,
      serverTime: result.rows[0].current_time,
      version: result.rows[0].postgres_version,
    };
  } catch (error) {
    console.error("❌ Ошибка подключения к PostgreSQL:", error.message);

    // PostgreSQL connection failed
    console.error("❌ Failed to connect to PostgreSQL database");

    return {
      success: false,
      error: error.message,
      connectionStringUsed: CONNECTION_STRING ? "env-connection-string" : "host-params",
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Функция выполнения запрос�� с логированием
export async function query(text, params = []) {
  const start = Date.now();
  let client;

  try {
    client = await pool.connect();

    if (process.env.DEBUG_SQL === "true") {
      console.log("🔍 SQL Query:", text);
      console.log("🔍 Parameters:", params);
    }

    const result = await client.query(text, params);
    const duration = Date.now() - start;

    if (process.env.DEBUG_SQL === "true") {
      console.log(`⏱️  Query completed in ${duration}ms`);
      console.log(`📊 Rows affected: ${result.rowCount}`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ SQL Error after ${duration}ms:`, error.message);
    console.error("🔍 Query:", text);
    console.error("🔍 Parameters:", params);

    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Функция выполнения транзакции
export async function transaction(callback) {
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    try {
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Функция создания базы данных (если не существует)
export async function createDatabase() {
  const adminConfig = {
    ...dbConfig,
    database: "postgres", // подключаемся к системной БД для создания новой
  };

  let client;

  try {
    client = new Client(adminConfig);
    await client.connect();

    // Проверяем, существует ли база данных
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database],
    );

    if (checkResult.rows.length === 0) {
      console.log(`📊 Создание базы данных: ${dbConfig.database}`);
      await client.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log("��� База данных создана ��спешно");
    } else {
      console.log(`📊 База данных ${dbConfig.database} уже существует`);
    }
  } catch (error) {
    console.error("❌ Ошибка создания базы данных:", error.message);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Функция выполнения миграций
function splitSqlStatements(sql) {
  const statements = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1] || "";

    // handle line comments
    if (inLineComment) {
      cur += ch;
      if (ch === "\n") inLineComment = false;
      continue;
    }

    // handle block comments
    if (inBlockComment) {
      cur += ch;
      if (ch === "*" && next === "/") {
        cur += "/";
        inBlockComment = false;
        i++; // skip next
      }
      continue;
    }

    // handle dollar-quoted strings
    if (dollarTag) {
      cur += ch;
      if (ch === "$" && sql.slice(i - dollarTag.length + 1, i + 1) === dollarTag) {
        // close tag
        dollarTag = null;
      }
      continue;
    }

    // detect start of dollar tag
    if (ch === "$" && !inSingle && !inDouble) {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        dollarTag = m[0];
        cur += m[0];
        i += m[0].length - 1;
        continue;
      }
    }

    // handle quotes
    if (inSingle) {
      cur += ch;
      if (ch === "'") inSingle = false;
      if (ch === "\\") {
        // escape next char
        i++;
        cur += sql[i] || "";
      }
      continue;
    }

    if (inDouble) {
      cur += ch;
      if (ch === '"') inDouble = false;
      if (ch === "\\") {
        i++;
        cur += sql[i] || "";
      }
      continue;
    }

    // start quotes or comments
    if (ch === "-" && next === "-") {
      inLineComment = true;
      cur += "--";
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      cur += "/*";
      i++;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      cur += ch;
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      cur += ch;
      continue;
    }

    // split on semicolon when not inside any structure
    if (ch === ";") {
      // push statement including semicolon
      const stmt = cur.trim();
      if (stmt.length > 0) statements.push(stmt + ";");
      cur = "";
      continue;
    }

    cur += ch;
  }

  if (cur.trim().length > 0) statements.push(cur);
  return statements;
}

export async function runMigrations() {
  try {
    console.log("🔄 Запуск миграций базы данных...");

    // Создаем таблицу для отслеживания миграций
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Получаем список выполненных миграций
    const executedResult = await query(
      "SELECT filename FROM migrations ORDER BY id",
    );
    const executedMigrations = new Set(
      executedResult.rows.map((row) => row.filename),
    );

    // Читаем файлы миграций
    const migrationsDir = path.join(__dirname, "../../migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`📁 Найдено ${migrationFiles.length} файлов миграций`);

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        console.log(`⏭️  Миграция ${filename} уже выполнена, пропускаем`);
        continue;
      }

      console.log(`🔄 Выполнение миграц��и: ${filename}`);

      const migrationPath = path.join(migrationsDir, filename);
      const migrationSQL = fs.readFileSync(migrationPath, "utf8");

      try {
        // Попытка выполнить всю миграцию разом
        try {
          await query(migrationSQL);
        } catch (fullErr) {
          console.warn(`⚠️ Полный запуск миграции ${filename} завершился с ошибкой, пытаемся по-частям: ${fullErr.message}`);

          // Фоллбек: выполняем по отдельным выражениям
          const statements = splitSqlStatements(migrationSQL).map((s) => s.trim()).filter((s) => s.length > 0);

          for (const stmt of statements) {
            try {
              await query(stmt);
            } catch (stmtErr) {
              const msg = (stmtErr && stmtErr.message) || String(stmtErr);
              // Игнорируем ожидаемые ошибки (уже существует, колонка отсутствует для необязательных индексов и т.д.)
              if (/already exists|duplicate key|relation .* already exists|column ".*" does not exist|index .* already exists/i.test(msg)) {
                console.warn(`ℹ️ Пропущено выражение из-за допустимой ошибки: ${msg}`);
                continue;
              }

              console.error(`❌ Ошибка при выполнении выражения в миграции ${filename}:`, msg);
              throw stmtErr;
            }
          }
        }

        // Помечаем миграцию как выполненную
        try {
          await query("INSERT INTO migrations (filename) VALUES ($1)", [filename]);
        } catch (insErr) {
          if (!/duplicate key|already exists/i.test((insErr && insErr.message) || "")) {
            throw insErr;
          }
        }

        console.log(`✅ Миграция ${filename} выполнена успешно`);
      } catch (migErr) {
        console.error(`❌ Ошибка выполнения миграции ${filename}:`, (migErr && migErr.message) || String(migErr));
        throw migErr;
      }
    }

    console.log("🎉 Все миграции выполнены успешно");
  } catch (error) {
    console.error("❌ Ошибка выполнения миграций:", error.message);
    throw error;
  }
}

// Функция исправления схемы tv_interfaces
export async function fixTVInterfacesSchema() {
  try {
    console.log("🔧 Проверка и исправление схемы tv_interfaces...");

    // Проверяем какие колонки существуют
    const columnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tv_interfaces' AND column_name IN ('clickable_areas', 'highlight_areas');
    `;

    const existingColumns = await query(columnsQuery);
    const hasClickableAreas = existingColumns.rows.some(
      (row) => row.column_name === "clickable_areas",
    );
    const hasHighlightAreas = existingColumns.rows.some(
      (row) => row.column_name === "highlight_areas",
    );

    // Добавляем недостающие колонки
    if (!hasClickableAreas) {
      await query(`
        ALTER TABLE tv_interfaces
        ADD COLUMN clickable_areas JSONB NOT NULL DEFAULT '[]'::jsonb
      `);
      console.log("✅ Добавлена колонка clickable_areas");
    }

    if (!hasHighlightAreas) {
      await query(`
        ALTER TABLE tv_interfaces
        ADD COLUMN highlight_areas JSONB NOT NULL DEFAULT '[]'::jsonb
      `);
      console.log("✅ Добавлена колонка highlight_areas");
    }

    if (hasClickableAreas && hasHighlightAreas) {
      console.log("✅ Все необходимые колонки уже существуют");
    }

    console.log("🎉 Схема tv_interfaces исправлена");
    return true;
  } catch (error) {
    console.error("❌ Ошибка исправления схемы tv_interfaces:", error.message);
    throw error;
  }
}

// Функция создания таблицы tv_interface_marks
export async function createTVInterfaceMarksTable() {
  try {
    console.log("🔧 Проверка и создание таблицы tv_interface_marks...");

    // Проверяем существование таблицы
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tv_interface_marks'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("❌ Таблица tv_interface_marks ��е существует");
      console.log("🔧 Создание таблицы tv_interface_marks...");

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

      // Создаем индексы
      await query(`
        CREATE INDEX idx_tv_interface_marks_tv_interface_id ON tv_interface_marks(tv_interface_id);
        CREATE INDEX idx_tv_interface_marks_step_id ON tv_interface_marks(step_id);
        CREATE INDEX idx_tv_interface_marks_mark_type ON tv_interface_marks(mark_type);
        CREATE INDEX idx_tv_interface_marks_active ON tv_interface_marks(is_active);
      `);

      console.log("✅ Таблица tv_interface_marks создана успешно");
    } else {
      console.log("✅ Таблица tv_interface_marks уже существует");
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Ошибка создания таблицы tv_interface_marks:",
      error.message,
    );
    throw error;
  }
}

// Функция исправления схемы diagnostic_sessions и diagnostic_steps
export async function fixDiagnosticSessionsSchema() {
  try {
    console.log("🔧 Проверка и исправление схемы diagnostic_sessions...");

    // Проверяем какие колонки существуют в diagnostic_sessions
    const sessionsColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'diagnostic_sessions' AND column_name IN ('is_active', 'end_time');
    `;

    const sessionsColumns = await query(sessionsColumnsQuery);
    const existingSessionsColumns = sessionsColumns.rows.map(
      (row) => row.column_name,
    );

    const hasSessionsIsActive = existingSessionsColumns.includes("is_active");
    const hasSessionsEndTime = existingSessionsColumns.includes("end_time");

    if (!hasSessionsIsActive) {
      await query(`
        ALTER TABLE diagnostic_sessions
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("✅ Добавлена колонка is_active в diagnostic_sessions");
    }

    if (!hasSessionsEndTime) {
      await query(`
        ALTER TABLE diagnostic_sessions
        ADD COLUMN end_time TIMESTAMP WITH TIME ZONE
      `);
      console.log("✅ Добавлена колонка end_time в diagnostic_sessions");
    }

    // Проверяем есть ли колонка is_active в diagnostic_steps
    const stepsColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'diagnostic_steps' AND column_name = 'is_active';
    `;

    const stepsColumns = await query(stepsColumnsQuery);
    const hasStepsIsActive = stepsColumns.rows.length > 0;

    if (!hasStepsIsActive) {
      await query(`
        ALTER TABLE diagnostic_steps
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("✅ Добавлена колонка is_active в diagnostic_steps");
    }

    if (hasSessionsIsActive && hasSessionsEndTime && hasStepsIsActive) {
      console.log("✅ Все необходимые колонки уже существуют");
    }

    console.log("🎉 Схема diagnostic_sessions исправлена");
    return true;
  } catch (error) {
    console.error(
      "❌ Ошибка исправления схемы diagnostic_sessions:",
      error.message,
    );
    throw error;
  }
}

// Фу��кция получения статистики базы данных
export async function getDatabaseStats() {
  try {
    const stats = await query(`
      SELECT
        schemaname,
        relname as table_name,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as row_count,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);

    const dbSize = await query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    return {
      tables: stats.rows,
      databaseSize: dbSize.rows[0].size,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Ошибка получения статистики БД:", error.message);
    throw error;
  }
}

// Функци���� безопасного закрытия всех соединений
export async function closePool() {
  try {
    console.log("🔄 Закрытие пула соединений PostgreSQL...");
    await pool.end();
    console.log("✅ Пул со���динений закрыт");
  } catch (error) {
    console.error("❌ Ошибка закрытия п��ла:", error.message);
  }
}

// Функция очистки старых данных (maintenance)
export async function cleanupOldData(daysToKeep = 90) {
  try {
    console.log(`🧹 Очистка данных старше ${daysToKeep} дней...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Удаляем старые сессии
    const sessionsResult = await query(
      `
      DELETE FROM diagnostic_sessions 
      WHERE start_time < $1 AND end_time IS NOT NULL
    `,
      [cutoffDate],
    );

    // Удаляем старые л��ги изменений
    const logsResult = await query(
      `
      DELETE FROM change_logs 
      WHERE created_at < $1
    `,
      [cutoffDate],
    );

    console.log(`✅ Удалено сессий: ${sessionsResult.rowCount}`);
    console.log(`✅ Уд��лено логов: ${logsResult.rowCount}`);

    // О��новляем статистику
    await query("ANALYZE");

    return {
      deletedSessions: sessionsResult.rowCount,
      deletedLogs: logsResult.rowCount,
    };
  } catch (error) {
    console.error("❌ Ошибка оч��с��ки данных:", error.message);
    throw error;
  }
}

// Функция для полнотекстового поиска
export async function searchText(
  searchTerm,
  tables = ["problems", "devices", "diagnostic_steps"],
) {
  try {
    const searchResults = {};

    for (const table of tables) {
      let searchQuery;

      switch (table) {
        case "problems":
          searchQuery = `
            SELECT id, title, description, 
                   ts_rank(to_tsvector('russian', title || ' ' || COALESCE(description, '')), plainto_tsquery('russian', $1)) as rank
            FROM problems 
            WHERE to_tsvector('russian', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('russian', $1)
            AND is_active = true
            ORDER BY rank DESC
            LIMIT 20
          `;
          break;

        case "devices":
          searchQuery = `
            SELECT id, name, brand, model, description,
                   ts_rank(to_tsvector('russian', name || ' ' || brand || ' ' || COALESCE(description, '')), plainto_tsquery('russian', $1)) as rank
            FROM devices
            WHERE to_tsvector('russian', name || ' ' || brand || ' ' || COALESCE(description, '')) @@ plainto_tsquery('russian', $1)
            AND is_active = true
            ORDER BY rank DESC
            LIMIT 20
          `;
          break;

        case "diagnostic_steps":
          searchQuery = `
            SELECT id, title, description, instruction,
                   ts_rank(to_tsvector('russian', title || ' ' || COALESCE(description, '') || ' ' || instruction), plainto_tsquery('russian', $1)) as rank
            FROM diagnostic_steps
            WHERE to_tsvector('russian', title || ' ' || COALESCE(description, '') || ' ' || instruction) @@ plainto_tsquery('russian', $1)
            AND is_active = true
            ORDER BY rank DESC
            LIMIT 20
          `;
          break;
      }

      if (searchQuery) {
        const result = await query(searchQuery, [searchTerm]);
        searchResults[table] = result.rows;
      }
    }

    return searchResults;
  } catch (error) {
    console.error("❌ Ошибка полнотекстового пои��ка:", error.message);
    throw error;
  }
}

// Экспорт pool для прямого ис��ользования в с����чае необходимости
export { pool };

export default {
  query,
  transaction,
  testConnection,
  createDatabase,
  runMigrations,
  getDatabaseStats,
  closePool,
  cleanupOldData,
  searchText,
  pool,
};
