import database from "./database.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ES Modules helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка переменных окружения
dotenv.config();

async function runMigrations() {
  try {
    console.log("🚀 Запуск системы миграций ANT Support");
    console.log("===================================");

    // Проверяем подключение к базе данных
    console.log("🔌 Проверка подключения к базе данных...");
    const connectionTest = await database.testConnection();

    if (!connectionTest.success) {
      console.error("❌ Не удалось подключиться к базе данных:");
      console.error(connectionTest.error);
      process.exit(1);
    }

    console.log("✅ Подключение к базе данных успешно");
    console.log(`🕐 Время сервера: ${connectionTest.serverTime}`);
    console.log(`📋 Версия: ${connectionTest.version}`);

    // Выполняем миграции
    console.log("\n🔄 Выполнение миграций...");
    await database.runMigrations();

    console.log("\n📊 Получение статистики базы данных...");
    const stats = await database.getDatabaseStats();

    console.log(`📏 Размер базы данных: ${stats.databaseSize}`);
    console.log(`📋 Количество таблиц: ${stats.tables.length}`);

    if (stats.tables.length > 0) {
      console.log("\n📊 Статистика таблиц:");
      stats.tables.forEach((table) => {
        console.log(`  📄 ${table.tablename}: ${table.live_rows} записей`);
      });
    }

    console.log("\n🎉 Миграции выполнены успешно!");
    console.log("===================================");
  } catch (error) {
    console.error("❌ Ошибка выполнения миграций:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    // Закрываем пул соединений
    await database.closePool();
    console.log("🔒 Соединения с базой данных закрыты");
  }
}

// Запуск миграций
runMigrations();
