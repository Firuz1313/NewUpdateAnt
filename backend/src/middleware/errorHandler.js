import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция логирования ошибок в файл
const logError = (error, req) => {
  const logDir = path.join(__dirname, "../../logs");

  // Создаем папку logs если не существует
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, "error.log");
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    method: req?.method,
    url: req?.url,
    userAgent: req?.headers?.["user-agent"],
    ip: req?.ip || req?.connection?.remoteAddress,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  };

  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
  } catch (logErr) {
    console.error("Ошибка записи в лог файл:", logErr.message);
  }
};

// Основной обработчик ошибок
const errorHandler = (error, req, res, next) => {
  // Логируем ошибку
  console.error("🚨 Ошибка сервера:", error.message);

  if (process.env.NODE_ENV === "development") {
    console.error("Stack trace:", error.stack);
  }

  // Логируем в файл
  logError(error, req);

  // Определяем тип ��шибки и соответствующий статус код
  let statusCode = 500;
  let message = "Внутренняя ошибка сервера";
  let errorType = "INTERNAL_ERROR";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Ошибка валидации данных";
    errorType = "VALIDATION_ERROR";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Неверный формат данных";
    errorType = "CAST_ERROR";
  } else if (error.code === "23505") {
    // PostgreSQL unique violation
    statusCode = 409;
    message = "Запись с такими данными уже существует";
    errorType = "DUPLICATE_ERROR";
  } else if (error.code === "23503") {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = "Нарушение связности данных";
    errorType = "FOREIGN_KEY_ERROR";
  } else if (error.code === "23502") {
    // PostgreSQL not null violation
    statusCode = 400;
    message = "Отсутствует обязательное поле";
    errorType = "NOT_NULL_ERROR";
  } else if (error.message.includes("jwt")) {
    statusCode = 401;
    message = "Ошибка аутентификации";
    errorType = "AUTH_ERROR";
  } else if (
    error.message.includes("permission") ||
    error.message.includes("access")
  ) {
    statusCode = 403;
    message = "Недостаточно прав доступа";
    errorType = "PERMISSION_ERROR";
  } else if (error.message.includes("not found")) {
    statusCode = 404;
    message = "Ресурс не найден";
    errorType = "NOT_FOUND_ERROR";
  }

  // Формируем ответ об ошибке
  const errorResponse = {
    success: false,
    error: message,
    errorType,
    timestamp: new Date().toISOString(),
    requestId:
      req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  // В режиме разработки добавляем дополнительную информацию
  if (process.env.NODE_ENV === "development") {
    errorResponse.debug = {
      originalMessage: error.message,
      stack: error.stack,
      code: error.code,
    };
  }

  // Отправляем ответ
  res.status(statusCode).json(errorResponse);
};

// Обработчик 404 ошибок
export const notFoundHandler = (req, res) => {
  const error = {
    success: false,
    error: "Маршрут не найден",
    errorType: "NOT_FOUND",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  console.warn(`⚠️  404 - Маршрут не найден: ${req.method} ${req.path}`);
  res.status(404).json(error);
};

// Обработчик необработанных Promise rejection
export const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 Необработанное отклонение Promise:", reason);

    // Логируем в файл
    logError(new Error(`Unhandled Promise Rejection: ${reason}`), null);

    // В продакшене можно завершить процесс
    if (process.env.NODE_ENV === "production") {
      console.log("🔄 Завершение процесса из-за критической ошибки...");
      process.exit(1);
    }
  });
};

// Обработчик необработанных исключений
export const handleUncaughtException = () => {
  process.on("uncaughtException", (error) => {
    console.error("🚨 Необработанное исключение:", error.message);
    console.error("Stack trace:", error.stack);

    // Логируем в файл
    logError(error, null);

    // Завершаем процесс
    console.log("🔄 Завершение процесса из-за критической ошибки...");
    process.exit(1);
  });
};

export default errorHandler;
