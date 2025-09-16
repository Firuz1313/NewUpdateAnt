/**
 * Конфигурация базы данных
 * Централизованная настройка подключения к PostgreSQL
 */

import dotenv from "dotenv";

// Загружаем переменные окружения
dotenv.config();

// Настройки подключения к базе данных
export const databaseConfig = {
  // Основные параметры подключения
  connection: {
    // Используем DATABASE_URL если доступен (приоритет для облачных БД)
    connectionString: process.env.DATABASE_URL,

    // Fallback настройки для локальной разработки
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "ant_support",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",

    // SSL настройки
    ssl: process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
  },

  // Настройки пула соединений
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis:
      parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    maxUses: 7500, // максимальное количество использований соединения
  },

  // Настройки для разработки
  development: {
    autoInitialize: process.env.NODE_ENV === "development",
    runMigrations: true,
    seedData: true,
    logQueries: process.env.DEBUG === "true",
  },

  // Настройки для продакшена
  production: {
    autoInitialize: false,
    runMigrations: false,
    seedData: false,
    logQueries: false,
  },
};

// Получить финальную конфигурацию на основе текущего окружения
export function getDatabaseConfig() {
  const baseConfig = {
    ...databaseConfig.connection,
    ...databaseConfig.pool,
  };

  const envConfig =
    process.env.NODE_ENV === "production"
      ? databaseConfig.production
      : databaseConfig.development;

  return {
    ...baseConfig,
    ...envConfig,
  };
}

// Проверить корректность конфигурации
export function validateDatabaseConfig() {
  const config = getDatabaseConfig();

  // Проверяем наличие обязательных параметров
  if (!config.connectionString && (!config.host || !config.database)) {
    throw new Error(
      "Не задана строка подключения DATABASE_URL или параметры host/database",
    );
  }

  if (
    config.connectionString &&
    !config.connectionString.startsWith("postgresql://")
  ) {
    throw new Error("DATABASE_URL должен начинаться с postgresql://");
  }

  return true;
}

// Экспорт для логирования
export function logDatabaseConfig() {
  const config = getDatabaseConfig();

  console.log("📊 Конфигурация базы данных:");

  if (config.connectionString) {
    // Маскируем пароль в строке подключения для безопасности
    const maskedUrl = config.connectionString.replace(/:([^:@]+)@/, ":***@");
    console.log(`   Строка подключения: ${maskedUrl}`);
  } else {
    console.log(`   Хост: ${config.host}:${config.port}`);
    console.log(`   База данных: ${config.database}`);
    console.log(`   Пользователь: ${config.user}`);
  }

  console.log(`   SSL: ${config.ssl ? "включен" : "отключен"}`);
  console.log(`   Мин. соединений: ${config.min}`);
  console.log(`   Макс. соединений: ${config.max}`);
  console.log(`   Таймаут простоя: ${config.idleTimeoutMillis}ms`);
  console.log(`   Автоинициализация: ${config.autoInitialize ? "да" : "нет"}`);
}

export default databaseConfig;
