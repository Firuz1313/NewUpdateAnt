#!/usr/bin/env node

/**
 * Скрипт для автоматической инициализации базы данных
 * Выполняет миграции и заполнение н��чальными данными
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { query, testConnection } from "../src/utils/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Цвета для консоли
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Выполнить SQL файл
 */
async function executeSqlFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл не найден: ${filePath}`);
    }

    const sql = fs.readFileSync(filePath, "utf8");

    // Разделяем SQL на отдельные команды
    const commands = sql
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

    for (const command of commands) {
      if (command.trim()) {
        await query(command);
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Ошибка выполнения ${filePath}: ${error.message}`);
  }
}

/**
 * Проверить существование таблиц
 */
async function checkTablesExist() {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = result.rows.map((row) => row.table_name);
    return tables;
  } catch (error) {
    log.error(`Ошибка пров��рки таблиц: ${error.message}`);
    return [];
  }
}

/**
 * Проверить количество записей в таблицах
 */
async function checkDataExists() {
  try {
    const tables = ["devices", "problems"];
    const counts = {};

    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        counts[table] = 0;
      }
    }

    return counts;
  } catch (error) {
    log.error(`Ошибка проверки данных: ${error.message}`);
    return {};
  }
}

/**
 * Выполнить миграции
 */
async function runMigrations() {
  log.header("🔄 Выполнение миграций");

  const migrationsDir = join(__dirname, "../migrations");
  const migrationFiles = ["001_init_tables.sql", "002_add_indexes.sql"];

  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file);
    try {
      log.info(`Выполнение миграции: ${file}`);
      await executeSqlFile(filePath);
      log.success(`Миграция ${file} выполнена успешно`);
    } catch (error) {
      log.error(`Ошибка миграции ${file}: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Заполнить таблицы начальными данными
 */
async function seedDatabase() {
  log.header("🌱 Заполнение начальными данными");

  try {
    // Импортируем и выполняем сидинг
    const { seedDevices, seedProblems } = await import("../src/utils/seed.js");

    log.info("Заполнение таблицы devices...");
    await seedDevices();
    log.success("Таблица devices заполнена");

    log.info("Заполнение таблицы problems...");
    await seedProblems();
    log.success("Таблица problems заполнена");
  } catch (error) {
    log.error(`Ошибка заполнения данными: ${error.message}`);
    throw error;
  }
}

/**
 * Главная функция инициализации
 */
async function initializeDatabase() {
  try {
    log.header("🚀 Инициализация базы данных");

    // Проверяем подключение
    log.info("Проверка подключения к базе данных...");
    const connectionResult = await testConnection();

    if (!connectionResult.success) {
      throw new Error(
        `Не удается подключиться к базе данных: ${connectionResult.error}`,
      );
    }
    log.success("Подключение к базе данных установлено");

    // Проверяем существующие таблицы
    const existingTables = await checkTablesExist();
    log.info(`Найдено таблиц: ${existingTables.length}`);

    if (existingTables.length === 0) {
      // Если таблиц нет, выполняем полную инициали��ацию
      log.info("Таблицы не найдены, выполняем полную инициализацию...");
      await runMigrations();
      await seedDatabase();
    } else {
      log.info("Таблицы уже существуют, проверяем данные...");

      // Проверяем данные
      const dataCounts = await checkDataExists();
      log.info("Количество записей:");
      Object.entries(dataCounts).forEach(([table, count]) => {
        log.info(`  ${table}: ${count} записей`);
      });

      // Если данных мало, заполняем
      if (dataCounts.devices < 5 || dataCounts.problems < 10) {
        log.warn("Недостаточно данных, заполняем...");
        await seedDatabase();
      }
    }

    // Показываем финальную статистику
    log.header("📊 Статистика базы данных");
    try {
      const finalCounts = await checkDataExists();
      Object.entries(finalCounts).forEach(([table, count]) => {
        log.info(`${table}: ${count} записей`);
      });
    } catch (error) {
      log.warn(`Не удалось получить статистику: ${error.message}`);
    }

    log.success("База данных успешно инициализирована!");
  } catch (error) {
    log.error(`Ошибка инициализации: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем только если скрипт вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      log.success("Инициализация завершена успешно");
      process.exit(0);
    })
    .catch((error) => {
      log.error(`Критическая ошибка: ${error.message}`);
      process.exit(1);
    });
}

export { initializeDatabase };
