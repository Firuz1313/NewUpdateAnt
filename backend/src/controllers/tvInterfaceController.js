import TVInterface from "../models/TVInterface.js";
import { v4 as uuidv4 } from "uuid";

const tvInterfaceModel = new TVInterface();

// Получить все TV интерфейсы
export const getAllTVInterfaces = async (req, res) => {
  try {
    const filters = {
      device_id: req.query.device_id,
      type: req.query.type,
      is_active:
        req.query.is_active !== undefined
          ? req.query.is_active === "true"
          : undefined,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    // Убираем undefined значения
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    const tvInterfaces = await tvInterfaceModel.getAll(filters);

    res.json({
      success: true,
      data: tvInterfaces,
      message: "TV интерфейсы успешно получены",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getAllTVInterfaces:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении TV интерфейсов",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Получить TV интерфейс по ID
export const getTVInterfaceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const tvInterface = await tvInterfaceModel.getById(id);

    if (!tvInterface) {
      return res.status(404).json({
        success: false,
        error: "TV интерфейс не найден",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: tvInterface,
      message: "TV интерфейс успешно получен",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getTVInterfaceById:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получени�� TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Получит�� TV интерфейсы по device_id
export const getTVInterfacesByDeviceId = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: "ID устройства обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const tvInterfaces = await tvInterfaceModel.getByDeviceId(deviceId);

    res.json({
      success: true,
      data: tvInterfaces,
      message: "TV интерфейсы для устройства успешно получены",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getTVInterfacesByDeviceId:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении TV интерфейсов для устройства",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Создать новый TV интерфейс (с оптимизаци��й таймаутов)
export const createTVInterface = async (req, res) => {
  const startTime = Date.now();

  // Устанавливаем расширенный таймаут для ответа
  req.setTimeout(600000); // 10 минут для о��работки запроса
  res.setTimeout(600000); // 10 минут для отправки ответа

  try {
    const {
      name,
      description,
      type,
      device_id,
      screenshot_url,
      screenshot_data,
      clickable_areas,
      highlight_areas,
    } = req.body;

    console.log("🔄 Starting TV interface creation:", {
      name: name?.substring(0, 50),
      type,
      device_id,
      hasScreenshot: !!screenshot_data,
      screenshotSize: screenshot_data
        ? Math.round(screenshot_data.length / 1024) + "KB"
        : "None",
    });

    // Проверяем размер screenshot_data и предупреждаем о больших файлах
    if (screenshot_data) {
      const screenshotSize = screenshot_data.length;
      const sizeInMB = (screenshotSize / 1024 / 1024).toFixed(2);
      console.log(`📷 Screenshot data size: ${sizeInMB}MB`);

      // Проверка лимита размера файла (50MB)
      if (screenshotSize > 50 * 1024 * 1024) {
        // 50MB
        return res.status(413).json({
          success: false,
          error: "Размер скриншота превышает лимит 50МБ",
          details: `Размер загружаемого скриншота: ${sizeInMB}МБ. Максимальный размер: 50МБ`,
          timestamp: new Date().toISOString(),
        });
      }

      // Предупреждение для больших файлов
      if (screenshotSize > 20 * 1024 * 1024) {
        // 20MB
        console.warn(
          `⚠️ Large screenshot detected (${sizeInMB}MB) - this will take longer to process and store`,
        );
      }
    }

    // Валидация
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Название интерфейса обязательно",
        timestamp: new Date().toISOString(),
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: "Тип интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    if (!device_id) {
      return res.status(400).json({
        success: false,
        error: "Устройство обязательно для выбора",
        timestamp: new Date().toISOString(),
      });
    }

    const tvInterfaceData = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || "",
      type,
      device_id,
      screenshot_url: screenshot_url || null,
      screenshot_data: screenshot_data || null,
      clickable_areas: clickable_areas || [],
      highlight_areas: highlight_areas || [],
    };

    console.log("🔍 Calling optimized model create for TV interface");

    // Создаем Promise с таймаутом для операции базы данных
    const dbOperationTimeout = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            "Database operation timeout - операция создания превысила лимит времени",
          ),
        );
      }, 540000); // 9 минут для операции БД (увеличено для больших изображений)

      tvInterfaceModel
        .create(tvInterfaceData)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });

    const tvInterface = await dbOperationTimeout;

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ TV interface creation completed in ${duration}ms`);

    res.status(201).json({
      success: true,
      data: tvInterface,
      message: "TV интерфейс успешно создан",
      processingTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(
      `❌ TV interface creation failed after ${duration}ms:`,
      error,
    );
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"), // Первые 5 строк стека
    });

    // Специальная обработка таймаутов
    if (
      error.message.includes("timeout") ||
      error.message.includes("превысила лимит времени")
    ) {
      return res.status(408).json({
        success: false,
        error: "Операция создания превысила лимит времени",
        details:
          "Создание интерфейса заняло слишком много времени. Возможные причины: большой ��азмер изображения, проблемы с сетью или высокая нагрузка на сервер.",
        suggestions: [
          "Попробуйте уменьшить размер изображения",
          "Попробуйте позже, когда нагрузка на сервер будет мен��ше",
          "Обратитесь к администратору, если проблема повторяется",
        ],
        processingTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    if (
      error.message.includes("не найдено") ||
      error.message.includes("обязательно")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Проверяем на специфические ошибки базы ��анных
    if (
      error.message.includes("connection") ||
      error.message.includes("ECONNRESET")
    ) {
      return res.status(503).json({
        success: false,
        error: "Ошибка подключения к базе данных",
        details:
          "Временные проблемы с соединением к базе данных. Попробуйте позже.",
        timestamp: new Date().toISOString(),
      });
    }

    // Обработка ошибок памяти или ресурсов
    if (
      error.message.includes("out of memory") ||
      error.message.includes("ENOMEM")
    ) {
      return res.status(413).json({
        success: false,
        error: "Недостаточно памяти для обработки запрос��",
        details:
          "Размер данных слишком вели�� для обработки. Попробуйте уменьшить размер изображения.",
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка при создании TV интерфейса",
      details: error.message,
      processingTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

// Обновить TV интерфейс (с улучш��нной обработкой ошибок и таймаутов)
export const updateTVInterface = async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const updateData = req.body;

  // Устанавливаем расширенный таймаут для ответа
  req.setTimeout(600000); // 10 минут для обработки запроса
  res.setTimeout(600000); // 10 минут для отправки ответа

  try {
    console.log(`🔄 Starting TV interface update: ${id}`);
    console.log(
      `📊 Update data size: ${JSON.stringify(updateData).length} characters`,
    );

    // Проверяем размер screenshot_data и предупреждаем о больших файл��х
    if (updateData.screenshot_data) {
      const screenshotSize = updateData.screenshot_data.length;
      const sizeInMB = (screenshotSize / 1024 / 1024).toFixed(2);
      console.log(`📷 Screenshot data size: ${sizeInMB}MB`);

      // Предупреждение для очень больших файлов
      if (screenshotSize > 50 * 1024 * 1024) {
        // 50MB
        console.warn(
          `⚠️ Large screenshot data detected (${sizeInMB}MB) - this may take longer to process`,
        );
      }

      // Проверка лимита размера файла (50MB)
      if (screenshotSize > 50 * 1024 * 1024) {
        // 50MB
        return res.status(413).json({
          success: false,
          error: "Размер скриншота превышает лимит 50МБ",
          details: `Размер загружаемого скриншота: ${sizeInMB}МБ. Максимальный размер: 50МБ`,
          timestamp: new Date().toISOString(),
        });
      }

      // Предупреждение для больших файлов
      if (screenshotSize > 20 * 1024 * 1024) {
        // 20MB
        console.warn(
          `⚠️ Large screenshot detected (${sizeInMB}MB) - this will take longer to process and store`,
        );
      }
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🔍 Calling optimized model update for TV interface: ${id}`);

    // Создаем Promise с та��маутом для операции базы данных
    const dbOperationTimeout = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            "Database operation timeout - опе��ация превысила лимит времени",
          ),
        );
      }, 540000); // 9 ��инут для операции БД (увеличено для больших изображений)

      tvInterfaceModel
        .update(id, updateData)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });

    const tvInterface = await dbOperationTimeout;

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ TV interface update completed in ${duration}ms`);

    res.json({
      success: true,
      data: tvInterface,
      message: "TV интерфейс успешно обновлен",
      timestamp: new Date().toISOString(),
      processingTime: `${duration}ms`,
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`❌ TV interface update failed after ${duration}ms:`, error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"), // Первые 5 строк стека
    });

    // Специальная обработка таймаутов
    if (
      error.message.includes("timeout") ||
      error.message.includes("превысила ��имит времени")
    ) {
      return res.status(408).json({
        success: false,
        error: "Операция превысила лимит времени",
        details:
          "Обно��л��ние интерфейса заняло слишком много времени. Возможные причины: большой размер изображения, проблемы с сетью или высокая нагрузка на сервер.",
        suggestions: [
          "Попробуйте уменьшить размер изображения",
          "Попробуйте позже, когда нагрузка на сер��ер будет меньше",
          "Обратитесь к администратору, если проблема повторяется",
        ],
        processingTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.message.includes("не найден")) {
      return res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (
      error.message.includes("не найдено") ||
      error.message.includes("обязательно")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Проверяем на специфические ошибки базы данных
    if (
      error.message.includes("connection") ||
      error.message.includes("ECONNRESET")
    ) {
      return res.status(503).json({
        success: false,
        error: "Ошибка подключения к базе данных",
        details:
          "Временные проблемы с соединением к базе данных. Попробуйте позже.",
        timestamp: new Date().toISOString(),
      });
    }

    // Обработка ошибок памяти или ре��урсов
    if (
      error.message.includes("out of memory") ||
      error.message.includes("ENOMEM")
    ) {
      return res.status(413).json({
        success: false,
        error: "Недостаточно памяти для обработки запроса",
        details:
          "Размер данных слишком велик для обработки. Попробуйте уменьшить размер изображения.",
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка при обновлении TV интер��ейса",
      details: error.message,
      processingTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

// Удалить TV интерфейс
export const deleteTVInterface = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    // Проверяем существование
    const existing = await tvInterfaceModel.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "TV инт��рфейс не найден",
        timestamp: new Date().toISOString(),
      });
    }

    await tvInterfaceModel.delete(id);

    res.json({
      success: true,
      message: "TV интерфейс успешно удален",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in deleteTVInterface:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при удалении TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Переключить статус активности
export const toggleTVInterfaceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const tvInterface = await tvInterfaceModel.toggleStatus(id);

    res.json({
      success: true,
      data: tvInterface,
      message: `TV интерфейс ${tvInterface.is_active ? "активирова��" : "деактивирован"}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in toggleTVInterfaceStatus:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка при изменении статуса TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Дублировать TV интерфейс
export const duplicateTVInterface = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const tvInterface = await tvInterfaceModel.duplicate(id, name);

    res.status(201).json({
      success: true,
      data: tvInterface,
      message: "TV интерфейс успешно дуб��ирован",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in duplicateTVInterface:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка при дублировании TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Полу��ить статистику TV интерфейсов
export const getTVInterfaceStats = async (req, res) => {
  try {
    const stats = await tvInterfaceModel.getStats();

    res.json({
      success: true,
      data: stats,
      message: "Статистика TV интерфейсов успешно получена",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getTVInterfaceStats:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении статистики TV интерфейсов",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Экспор��ировать TV интерфейс в JSON
export const exportTVInterface = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const tvInterface = await tvInterfaceModel.getById(id);

    if (!tvInterface) {
      return res.status(404).json({
        success: false,
        error: "TV интерфейс не найден",
        timestamp: new Date().toISOString(),
      });
    }

    // Под��отавливаем данные для экспорта
    const exportData = {
      name: tvInterface.name,
      description: tvInterface.description,
      type: tvInterface.type,
      device_info: {
        name: tvInterface.device_name,
        brand: tvInterface.device_brand,
        model: tvInterface.device_model,
      },
      screenshot_data: tvInterface.screenshot_data,
      clickable_areas: tvInterface.clickable_areas,
      highlight_areas: tvInterface.highlight_areas,
      exported_at: new Date().toISOString(),
      version: "1.0",
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tv-interface-${tvInterface.name.replace(/[^a-zA-Z0-9]/g, "-")}.json"`,
    );

    res.json({
      success: true,
      data: exportData,
      message: "TV интерфейс успешно экспортирован",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in exportTVInterface:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при экспорте TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default {
  getAllTVInterfaces,
  getTVInterfaceById,
  getTVInterfacesByDeviceId,
  createTVInterface,
  updateTVInterface,
  deleteTVInterface,
  toggleTVInterfaceStatus,
  duplicateTVInterface,
  getTVInterfaceStats,
  exportTVInterface,
};
