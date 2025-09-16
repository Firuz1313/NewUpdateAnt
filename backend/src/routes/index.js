import express from "express";
import deviceRoutes from "./deviceRoutes.js";
import problemRoutes from "./problemRoutes.js";
import stepRoutes from "./stepRoutes.js";
import sessionRoutes from "./sessionRoutes.js";
import tvInterfaceRoutes from "./tvInterfaceRoutes.js";
import tvInterfaceMarkRoutes from "./tvInterfaceMarkRoutes.js";
import remoteRoutes from "./remoteRoutes.js";
import optimizationRoutes from "./optimizationRoutes.js";

const router = express.Router();

// API версия 1
const API_V1_PREFIX = "/v1";

/**
 * Health check endpoint
 * @route GET /api/health
 * @desc Проверка состояния API
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "ANT Support API работает",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * API Info endpoint
 * @route GET /api/info
 * @desc Информация об API
 * @access Public
 */
router.get("/info", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "ANT Support API",
      version: "1.0.0",
      description: "Backend API для системы диагностики ТВ приставок ANT",
      endpoints: {
        devices: `${API_V1_PREFIX}/devices`,
        problems: `${API_V1_PREFIX}/problems`,
        steps: `${API_V1_PREFIX}/steps`,
        sessions: `${API_V1_PREFIX}/sessions`,
        tvInterfaces: `${API_V1_PREFIX}/tv-interfaces`,
      },
      documentation: "/api/docs",
      health: "/api/health",
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Documentation endpoint
 * @route GET /api/docs
 * @desc Документация API
 * @access Public
 */
router.get("/docs", (req, res) => {
  res.json({
    success: true,
    data: {
      title: "ANT Support API Documentation",
      version: "1.0.0",
      description: "REST API для системы диагностики ТВ приставок ANT",
      baseUrl: "/api/v1",
      endpoints: {
        devices: {
          description: "У��равление устройствами (ТВ приставки)",
          routes: {
            "GET /devices": "Получени�� списка устройств",
            "GET /devices/:id": "Получение устройства по ID",
            "POST /devices": "Создание нового устройства",
            "PUT /devices/:id": "Обновление устройства",
            "DELETE /devices/:id": "Удаление устройства",
            "GET /devices/search": "Поиск устройств",
            "GET /devices/popular": "Популярные устройства",
            "GET /devices/stats": "Статистика устройств",
            "GET /devices/export": "Экспорт устройств",
            "PUT /devices/reorder": "Изменение порядка устройств",
            "PUT /devices/bulk": "Массовое обнов��ение",
            "POST /devices/:id/restore":
              "Восстановление архивированного устройства",
          },
        },
        problems: {
          description: "Управление проблемами диагностики",
          routes: {
            "GET /problems": "Получение списка проблем",
            "GET /problems/:id": "Получение проблемы по ID",
            "POST /problems": "Создание новой проблемы",
            "PUT /problems/:id": "Обновление проблемы",
            "DELETE /problems/:id": "Удаление проблемы",
            "GET /problems/search": "Поиск проблем",
            "GET /problems/popular": "Популярные проблемы",
            "GET /problems/stats": "Статистика проблем",
            "GET /problems/export": "Экспорт проблем",
            "GET /problems/device/:deviceId": "Проблемы по устройству",
            "GET /problems/category/:category": "Проблемы по категории",
            "POST /problems/:id/duplicate": "Дублирование проблемы",
            "POST /problems/:id/publish": "Публикация проблемы",
            "POST /problems/:id/unpublish": "Снятие с публикации",
            "POST /problems/:id/update-stats": "Обновление статистики",
            "POST /problems/:id/restore":
              "Восстановление архивированной проблемы",
          },
        },
        steps: {
          description: "Управление диагностическими шагами",
          routes: {
            "GET /steps": "Получение списка шагов",
            "GET /steps/:id": "Получение шага по ID",
            "POST /steps": "Создание нового шага",
            "PUT /steps/:id": "Обновление шага",
            "DELETE /steps/:id": "Удаление шага",
            "GET /steps/search": "Поиск шагов",
            "GET /steps/problem/:problemId": "Шаги по проблеме",
            "GET /steps/:id/next": "Следующий шаг",
            "GET /steps/:id/previous": "Предыдущий шаг",
            "GET /steps/:id/stats": "Статистика шага",
            "GET /steps/validate/:problemId": "Валидация порядка шагов",
            "POST /steps/insert": "Вставка шага",
            "POST /steps/fix-numbering/:problemId": "Исправление нумерации",
            "POST /steps/:id/duplicate": "Дублирование шага",
            "POST /steps/:id/restore": "Восстано��ление архивированного шага",
            "PUT /steps/reorder": "Переупорядочивание шагов",
          },
        },
        sessions: {
          description: "Управление диагностическими сессиями",
          routes: {
            "GET /sessions": "Получение списка сессий",
            "GET /sessions/:id": "Получение сессии по ID",
            "POST /sessions": "Создание новой сессии",
            "PUT /sessions/:id": "Обновление сессии",
            "DELETE /sessions/:id": "Удаление сессии",
            "GET /sessions/active": "Активные сессии",
            "GET /sessions/stats": "Статистика сессий",
            "GET /sessions/popular-problems": "Популярные п��облемы",
            "GET /sessions/analytics": "Ан��литика по времени",
            "GET /sessions/export": "Экспорт сессий",
            "POST /sessions/:id/complete": "Завершение сессии",
            "POST /sessions/:id/progress": "Обновление прогресса",
            "POST /sessions/cleanup": "Очистка с��арых сессий",
            "POST /sessions/:id/restore":
              "Восстановление архивированной сессии",
          },
        },
        tvInterfaces: {
          description: "Управление интерфейсами ТВ приставок",
          routes: {
            "GET /tv-interfaces": "Получение списка интерфейсов ТВ",
            "GET /tv-interfaces/:id": "Получение интерфейса ТВ по ID",
            "POST /tv-interfaces": "Создание нового интерфейса ТВ",
            "PUT /tv-interfaces/:id": "Обновление интерфейса ТВ",
            "DELETE /tv-interfaces/:id": "Удаление интерфейса ТВ",
            "POST /tv-interfaces/:id/duplicate": "Дублирование интерфейса ТВ",
            "PATCH /tv-interfaces/:id/toggle":
              "А��тивация/деактивация интерфейса ТВ",
            "GET /tv-interfaces/device/:deviceId": "Интерфейсы по устройству",
            "GET /tv-interfaces/stats": "Статистика интерфейсов",
            "GET /tv-interfaces/:id/export": "Экспорт интерфейс�� в JSON",
          },
        },
      },
      errorCodes: {
        400: "Bad Request - Ошибка валидации или некорректные параметры",
        401: "Unauthorized - Требуется авторизация",
        403: "Forbidden - Недостаточно прав доступа",
        404: "Not Found - Ресурс не найден",
        409: "Conflict - Конфликт данных (дубликаты, ограничения)",
        422: "Unprocessable Entity - Ошибка бизнес-логики",
        429: "Too Many Requests - Превышен лимит запросов",
        500: "Internal Server Error - Внутренняя ошибка сервера",
        503: "Service Unavailable - Сервис временно недоступен",
      },
      responseFormat: {
        success: {
          success: true,
          data: "object | array",
          message: "string (опционально)",
          pagination: "object (для списков)",
          timestamp: "ISO string",
        },
        error: {
          success: false,
          error: "string",
          errorType: "string",
          details: "array (для ошибок валидации)",
          suggestion: "string (опционально)",
          timestamp: "ISO string",
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ВРЕМЕННАЯ ЗАГЛУШКА для /api/paths
router.get("/paths", (req, res) => {
  res.json({ paths: [] });
});

// Подключение роутов для каждого ресурса
router.use(`${API_V1_PREFIX}/devices`, deviceRoutes);
router.use(`${API_V1_PREFIX}/problems`, problemRoutes);
router.use(`${API_V1_PREFIX}/steps`, stepRoutes);
router.use(`${API_V1_PREFIX}/sessions`, sessionRoutes);
router.use(`${API_V1_PREFIX}/tv-interfaces`, tvInterfaceRoutes);
router.use(`${API_V1_PREFIX}/tv-interface-marks`, tvInterfaceMarkRoutes);
router.use(`${API_V1_PREFIX}/remotes`, remoteRoutes);
router.use(`${API_V1_PREFIX}/optimization`, optimizationRoutes);

// Auth & Users
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
router.use(`${API_V1_PREFIX}/auth`, authRoutes);
router.use(`${API_V1_PREFIX}/users`, userRoutes);

// Обработчик для несуществующих эндпоинтов API
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `Эндпоинт ${req.originalUrl} не найден`,
    errorType: "NOT_FOUND",
    suggestion: "Проверьте документацию API по адресу /api/docs",
    availableEndpoints: [
      "/api/health",
      "/api/info",
      "/api/docs",
      `${API_V1_PREFIX}/devices`,
      `${API_V1_PREFIX}/problems`,
      `${API_V1_PREFIX}/steps`,
      `${API_V1_PREFIX}/sessions`,
      `${API_V1_PREFIX}/tv-interfaces`,
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
