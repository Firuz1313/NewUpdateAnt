import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Загрузка переменных окружения
dotenv.config();

// ES Modules helper для __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Импорт главного роутера API
import apiRoutes from "./routes/index.js";

// Импорт middleware
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import validateRequest from "./middleware/validateRequest.js";
import decamelizeBody from "./middleware/decamelizeBody.js";
import camelizeResponse from "./middleware/camelizeResponse.js";
import { query } from "./utils/database.js";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Trust proxy for production deployment (required for rate limiting with X-Forwarded-For)
if (NODE_ENV === "production" || process.env.FLY_APP_NAME) {
  // Trust first proxy (Fly.io) for accurate IP detection
  app.set("trust proxy", 1);
}

// Настрой��а CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
    ];

    // В облачной среде разрешаем все origins
    if (
      NODE_ENV === "development" ||
      !origin ||
      origin.includes("fly.dev") ||
      origin.includes("builder.codes") ||
      origin.includes("projects.builder.my") ||
      origin.includes("localhost") ||
      allowedOrigins.indexOf(origin) !== -1
    ) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));

// Безопасность
if (process.env.HELMET_ENABLED !== "false") {
  app.use(
    helmet({
      contentSecurityPolicy: false, // Отключаем для разработки
      crossOriginEmbedderPolicy: false,
    }),
  );
}

// Сжатие
if (process.env.COMPRESSION_ENABLED !== "false") {
  app.use(compression());
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max:
    NODE_ENV === "development" || process.env.FLY_APP_NAME
      ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000 // 10000 запр��сов для разработки и облачных сред
      : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 для продакшена
  message: {
    error: "Слишком много запросов с этого IP, попробуйте позже.",
    retryAfter: Math.ceil(
      (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000,
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Пропускаем rate limiting для локальных IP в разработке
    if (NODE_ENV === "development") {
      const ip = req.ip || req.connection.remoteAddress;
      if (ip === "127.0.0.1" || ip === "::1" || ip?.includes("localhost")) {
        return true;
      }
    }

    // Пропускаем rate limiting для облачных proxy IP
    if (process.env.FLY_APP_NAME || NODE_ENV === "development") {
      const clientIP =
        req.headers["fly-client-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip;
      console.log(
        `📊 Rate limit check - Client IP: ${clientIP}, Skipping: true`,
      );
      return true;
    }

    return false;
  },
});

app.use("/api/", limiter);

// Логирование
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Парсинг JSON и URL-encoded данных с увеличенным таймаутом
app.use(
  express.json({
    limit: "100mb", // Увеличиваем лимит до 100MB
    parameterLimit: 100000,
    type: ["application/json", "application/*+json"],
    // Добавляем обработчик для отслеживания больших запросов
    verify: (req, res, buf, encoding) => {
      if (buf.length > 1024 * 1024) {
        // Больше 1MB
        console.log(
          `📦 Large request detected: ${req.method} ${req.url} - ${(buf.length / 1024 / 1024).toFixed(2)}MB`,
        );
      }
    },
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "100mb",
    parameterLimit: 100000,
  }),
);

// Увеличиваем таймауты для сервера
app.use((req, res, next) => {
  // Увеличиваем таймаут для TV interface операций
  if (
    req.url.includes("/tv-interfaces") &&
    (req.method === "PUT" || req.method === "POST")
  ) {
    req.setTimeout(180000, () => {
      // 180 seconds (3 minutes)
      console.log(
        `⏰ Request timeout for TV interface operation: ${req.method} ${req.url}`,
      );
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: "Request timeout - операци�� заняла ��лишком много времени",
          timestamp: new Date().toISOString(),
        });
      }
    });
    res.setTimeout(180000, () => {
      // 180 seconds (3 minutes)
      console.log(
        `⏰ Response timeout for TV interface operation: ${req.method} ${req.url}`,
      );
    });
  }
  next();
});

// Преобразование camelCase ключей в snake_case для совместимости с базой данных
app.use(decamelizeBody);

// Преобразование snake_case ключей в camelCase в ответах для frontend
app.use(camelizeResponse);

// Статические файлы
app.use("/media", express.static(path.join(__dirname, "../uploads")));

// Кастомный middleware для логирования запросов
app.use(requestLogger);

// Дополнительное логирование для отладки
app.use((req, res, next) => {
  console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`🔍 Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`🔍 Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API routes
app.use("/api", apiRoutes);

// 404 handler для API роутов
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint не най��ен",
    message: `Маршрут ${req.method} ${req.path} не существует`,
    availableEndpoints: "/api/v1",
  });
});

// Обработка ошибок
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📄 Получен сигнал SIGTERM. Изящное завершение работы...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("📄 Получен сигнал SIGINT. Изящное завершение работы...");
  process.exit(0);
});

// Функция инициализации ��ервера
async function ensureAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return;
    const role = "admin";
    const username = email.split("@")[0];
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const hash = await bcrypt.hash(password, rounds);
    const sql = `
      INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING id, email, role;
    `;
    const id = uuidv4();
    const res = await query(sql, [id, username, email, hash, role]);
    console.log("👤 Admin bootstrap ready:", res.rows[0]);
  } catch (e) {
    console.error("⚠️ Admin bootstrap failed:", e.message);
  }
}

async function startServer() {
  try {
    // Исправляем схему tv_interfaces при старте
    const {
      fixTVInterfacesSchema,
      createTVInterfaceMarksTable,
      fixDiagnosticSessionsSchema,
    } = await import("./utils/database.js");
    await fixTVInterfacesSchema();
    await createTVInterfaceMarksTable();
    await fixDiagnosticSessionsSchema();
  } catch (error) {
    console.error(
      "⚠️ Ошибка исправления схемы, продолжаем запуск:",
      error.message,
    );
  }

  await ensureAdminUser();
  // Запуск сервера
  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 ANT Support API Server started successfully!");
    console.log(`📍 Server running on 0.0.0.0:${PORT}`);
    console.log(`🌐 API available at: http://0.0.0.0:${PORT}/api/v1`);
    console.log(`🌐 API also available at: http://127.0.0.1:${PORT}/api/v1`);
    console.log(`🏥 Health check: http://127.0.0.1:${PORT}/health`);
    console.log(`📝 Environment: ${NODE_ENV}`);

    if (NODE_ENV === "development") {
      console.log(
        "🔧 Development mode - CORS enabled for localhost and cloud environments",
      );
      console.log("📁 Static files served from: /media");
      console.log(
        "🔄 Vite proxy should forward /api/* requests from port 8080 to port 3000",
      );
    }
  });
}

// Запуск сервера
startServer();

export default app;
