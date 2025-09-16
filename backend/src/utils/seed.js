import database from "./database.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Загрузка переменных окружения
dotenv.config();

async function seedDatabase() {
  try {
    console.log("🌱 Запуск заполнения базы данных ANT Support");
    console.log("=============================================");

    // Проверяем подключение
    const connectionTest = await database.testConnection();
    if (!connectionTest.success) {
      console.error("❌ Не удалось подключиться к базе данных");
      process.exit(1);
    }

    console.log("✅ Подключение к базе данных успешно");

    // 1. Пропускаем создание пользователей (таблица имеет другую структуру)
    console.log("\n👤 Пропускаем создание пользователей (уже существуют)...");

    // 2. Создаем устройства
    console.log("📺 Создание устройств...");

    const devices = [
      {
        id: "device-ant-basic",
        name: "ANT Basic",
        brand: "ANT",
        model: "ANT-B100",
        description:
          "Базовая модель цифровой ТВ-приставки ANT с поддержкой HD качества",
        color: "from-blue-500 to-blue-600",
        order_index: 1,
      },
      {
        id: "device-ant-premium",
        name: "ANT Premium",
        brand: "ANT",
        model: "ANT-P200",
        description: "Премиум модель с поддержкой 4K и Smart TV функций",
        color: "from-purple-500 to-purple-600",
        order_index: 2,
      },
      {
        id: "device-ant-pro",
        name: "ANT Professional",
        brand: "ANT",
        model: "ANT-PR300",
        description: "Профессиональная модель для коммерческого использования",
        color: "from-green-500 to-green-600",
        order_index: 3,
      },
      {
        id: "device-generic-dvb",
        name: "Generic DVB-T2",
        brand: "Generic",
        model: "DVB-T2-STD",
        description: "Стандартная DVB-T2 приставка",
        color: "from-gray-500 to-gray-600",
        order_index: 4,
      },
    ];

    for (const device of devices) {
      await database.query(
        `
        INSERT INTO devices (id, name, brand, model, description, color, order_index, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          order_index = EXCLUDED.order_index
      `,
        [
          device.id,
          device.name,
          device.brand,
          device.model,
          device.description,
          device.color,
          device.order_index,
          "active",
        ],
      );
    }

    // 3. Создаем типичные проблемы
    console.log("⚠️  Создание проблем...");

    const problems = [
      {
        id: "problem-no-signal",
        device_id: "device-ant-basic",
        title: "Нет сигнала",
        description:
          'На экране отображается сообщение "Нет сигнала" или черный экран',
        category: "critical",
        icon: "AlertTriangle",
        color: "from-red-500 to-red-600",
        priority: 5,
        estimated_time: 10,
      },
      {
        id: "problem-poor-quality",
        device_id: "device-ant-basic",
        title: "Плохое качество изображения",
        description: "Изображение нечеткое, есть помехи или артефакты",
        category: "moderate",
        icon: "Monitor",
        color: "from-orange-500 to-orange-600",
        priority: 3,
        estimated_time: 8,
      },
      {
        id: "problem-no-sound",
        device_id: "device-ant-basic",
        title: "Нет з��ука",
        description: "Изображение есть, но звук отсутствует",
        category: "moderate",
        icon: "VolumeX",
        color: "from-yellow-500 to-yellow-600",
        priority: 3,
        estimated_time: 5,
      },
      {
        id: "problem-channels-missing",
        device_id: "device-ant-basic",
        title: "Не найдены каналы",
        description: "Автопоиск не находит телеканалы или найдено слишком мало",
        category: "moderate",
        icon: "Search",
        color: "from-blue-500 to-blue-600",
        priority: 4,
        estimated_time: 15,
      },
      {
        id: "problem-remote-not-working",
        device_id: "device-ant-basic",
        title: "Пульт не работает",
        description:
          "Приставка не реагирует на команды пульта дистанционного управления",
        category: "minor",
        icon: "Zap",
        color: "from-indigo-500 to-indigo-600",
        priority: 2,
        estimated_time: 7,
      },
      {
        id: "problem-freezing",
        device_id: "device-ant-premium",
        title: "Приставка зависает",
        description: "Устройство периодически зависает или перезагружается",
        category: "critical",
        icon: "Pause",
        color: "from-red-500 to-red-600",
        priority: 5,
        estimated_time: 12,
      },
      {
        id: "problem-wifi-connection",
        device_id: "device-ant-premium",
        title: "Проблемы с Wi-Fi",
        description:
          "Не удается подключиться к беспроводной сети или соединение нестабильно",
        category: "moderate",
        icon: "Wifi",
        color: "from-purple-500 to-purple-600",
        priority: 3,
        estimated_time: 10,
      },
    ];

    for (const problem of problems) {
      await database.query(
        `
        INSERT INTO problems (id, device_id, title, description, category, icon, color, priority, estimated_time, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          priority = EXCLUDED.priority,
          estimated_time = EXCLUDED.estimated_time
      `,
        [
          problem.id,
          problem.device_id,
          problem.title,
          problem.description,
          problem.category,
          problem.icon,
          problem.color,
          problem.priority,
          problem.estimated_time,
          "published",
        ],
      );
    }

    // 4. Пропускаем диагностические шаги (схема таблицы отличается)
    console.log(
      "🔧 Пропускаем диагностические шаги (будут добавлены позже)...",
    );

    // 5. Создаем пульты дистанционного управления
    console.log("🎮 Создание пультов дистанционного управления...");

    const defaultRemotes = [
      {
        deviceId: "device-ant-basic",
        name: "ANT Basic Remote",
        manufacturer: "ANT",
        model: "RC-ANT-B100",
        description: "Стандартный пульт для ANT Basic приставки",
        layout: "standard",
        colorScheme: "dark",
        dimensions: { width: 200, height: 480 },
        buttons: [
          {
            id: "power",
            name: "Power",
            type: "power",
            x: 100,
            y: 40,
            width: 40,
            height: 40,
            action: "power_toggle",
          },
          {
            id: "home",
            name: "Home",
            type: "navigation",
            x: 100,
            y: 100,
            width: 35,
            height: 35,
            action: "goto_home",
          },
          {
            id: "back",
            name: "Back",
            type: "navigation",
            x: 50,
            y: 100,
            width: 35,
            height: 35,
            action: "go_back",
          },
          {
            id: "menu",
            name: "Menu",
            type: "navigation",
            x: 150,
            y: 100,
            width: 35,
            height: 35,
            action: "open_menu",
          },
          {
            id: "up",
            name: "Up",
            type: "direction",
            x: 100,
            y: 160,
            width: 30,
            height: 30,
            action: "navigate_up",
          },
          {
            id: "down",
            name: "Down",
            type: "direction",
            x: 100,
            y: 220,
            width: 30,
            height: 30,
            action: "navigate_down",
          },
          {
            id: "left",
            name: "Left",
            type: "direction",
            x: 70,
            y: 190,
            width: 30,
            height: 30,
            action: "navigate_left",
          },
          {
            id: "right",
            name: "Right",
            type: "direction",
            x: 130,
            y: 190,
            width: 30,
            height: 30,
            action: "navigate_right",
          },
          {
            id: "ok",
            name: "OK",
            type: "action",
            x: 100,
            y: 190,
            width: 30,
            height: 30,
            action: "confirm",
          },
          {
            id: "vol_up",
            name: "Vol+",
            type: "volume",
            x: 40,
            y: 160,
            width: 25,
            height: 25,
            action: "volume_up",
          },
          {
            id: "vol_down",
            name: "Vol-",
            type: "volume",
            x: 40,
            y: 190,
            width: 25,
            height: 25,
            action: "volume_down",
          },
          {
            id: "ch_up",
            name: "Ch+",
            type: "channel",
            x: 160,
            y: 160,
            width: 25,
            height: 25,
            action: "channel_up",
          },
          {
            id: "ch_down",
            name: "Ch-",
            type: "channel",
            x: 160,
            y: 190,
            width: 25,
            height: 25,
            action: "channel_down",
          },
        ],
        zones: [
          {
            id: "power_zone",
            name: "Power Area",
            x: 80,
            y: 20,
            width: 80,
            height: 80,
            description: "Power button area",
          },
          {
            id: "nav_zone",
            name: "Navigation Area",
            x: 40,
            y: 140,
            width: 120,
            height: 100,
            description: "Navigation controls",
          },
        ],
      },
      {
        deviceId: "device-ant-premium",
        name: "ANT Premium Smart Remote",
        manufacturer: "ANT",
        model: "RC-ANT-P200",
        description:
          "Умный пульт для ANT Premium с поддержкой Smart TV функций",
        layout: "smart",
        colorScheme: "dark",
        dimensions: { width: 210, height: 520 },
        buttons: [
          {
            id: "power",
            name: "Power",
            type: "power",
            x: 105,
            y: 40,
            width: 45,
            height: 45,
            action: "power_toggle",
          },
          {
            id: "home",
            name: "Home",
            type: "navigation",
            x: 105,
            y: 100,
            width: 40,
            height: 40,
            action: "goto_home",
          },
          {
            id: "back",
            name: "Back",
            type: "navigation",
            x: 50,
            y: 100,
            width: 40,
            height: 40,
            action: "go_back",
          },
          {
            id: "menu",
            name: "Menu",
            type: "navigation",
            x: 160,
            y: 100,
            width: 40,
            height: 40,
            action: "open_menu",
          },
          {
            id: "up",
            name: "Up",
            type: "direction",
            x: 105,
            y: 160,
            width: 35,
            height: 35,
            action: "navigate_up",
          },
          {
            id: "down",
            name: "Down",
            type: "direction",
            x: 105,
            y: 230,
            width: 35,
            height: 35,
            action: "navigate_down",
          },
          {
            id: "left",
            name: "Left",
            type: "direction",
            x: 70,
            y: 195,
            width: 35,
            height: 35,
            action: "navigate_left",
          },
          {
            id: "right",
            name: "Right",
            type: "direction",
            x: 140,
            y: 195,
            width: 35,
            height: 35,
            action: "navigate_right",
          },
          {
            id: "ok",
            name: "OK",
            type: "action",
            x: 105,
            y: 195,
            width: 35,
            height: 35,
            action: "confirm",
          },
          {
            id: "vol_up",
            name: "Vol+",
            type: "volume",
            x: 30,
            y: 160,
            width: 30,
            height: 30,
            action: "volume_up",
          },
          {
            id: "vol_down",
            name: "Vol-",
            type: "volume",
            x: 30,
            y: 195,
            width: 30,
            height: 30,
            action: "volume_down",
          },
          {
            id: "ch_up",
            name: "Ch+",
            type: "channel",
            x: 180,
            y: 160,
            width: 30,
            height: 30,
            action: "channel_up",
          },
          {
            id: "ch_down",
            name: "Ch-",
            type: "channel",
            x: 180,
            y: 195,
            width: 30,
            height: 30,
            action: "channel_down",
          },
          {
            id: "netflix",
            name: "Netflix",
            type: "app",
            x: 50,
            y: 280,
            width: 30,
            height: 30,
            action: "launch_netflix",
          },
          {
            id: "youtube",
            name: "YouTube",
            type: "app",
            x: 90,
            y: 280,
            width: 30,
            height: 30,
            action: "launch_youtube",
          },
          {
            id: "prime",
            name: "Prime",
            type: "app",
            x: 130,
            y: 280,
            width: 30,
            height: 30,
            action: "launch_prime",
          },
        ],
        zones: [
          {
            id: "power_zone",
            name: "Power Area",
            x: 80,
            y: 20,
            width: 90,
            height: 90,
            description: "Power button area",
          },
          {
            id: "nav_zone",
            name: "Navigation Area",
            x: 30,
            y: 140,
            width: 150,
            height: 110,
            description: "Navigation controls",
          },
          {
            id: "smart_zone",
            name: "Smart TV Apps",
            x: 40,
            y: 260,
            width: 140,
            height: 50,
            description: "Smart TV app shortcuts",
          },
        ],
      },
      {
        deviceId: "device-ant-pro",
        name: "ANT Professional Remote",
        manufacturer: "ANT",
        model: "RC-ANT-PR300",
        description:
          "Профессиональный пульт для ANT Professional с расширенными функциями",
        layout: "custom",
        colorScheme: "dark",
        dimensions: { width: 220, height: 550 },
        buttons: [
          {
            id: "power",
            name: "Power",
            type: "power",
            x: 110,
            y: 40,
            width: 50,
            height: 50,
            action: "power_toggle",
          },
          {
            id: "home",
            name: "Home",
            type: "navigation",
            x: 110,
            y: 110,
            width: 40,
            height: 40,
            action: "goto_home",
          },
          {
            id: "back",
            name: "Back",
            type: "navigation",
            x: 50,
            y: 110,
            width: 40,
            height: 40,
            action: "go_back",
          },
          {
            id: "menu",
            name: "Menu",
            type: "navigation",
            x: 170,
            y: 110,
            width: 40,
            height: 40,
            action: "open_menu",
          },
          {
            id: "settings",
            name: "Settings",
            type: "navigation",
            x: 110,
            y: 160,
            width: 40,
            height: 40,
            action: "open_settings",
          },
          {
            id: "up",
            name: "Up",
            type: "direction",
            x: 110,
            y: 220,
            width: 35,
            height: 35,
            action: "navigate_up",
          },
          {
            id: "down",
            name: "Down",
            type: "direction",
            x: 110,
            y: 290,
            width: 35,
            height: 35,
            action: "navigate_down",
          },
          {
            id: "left",
            name: "Left",
            type: "direction",
            x: 75,
            y: 255,
            width: 35,
            height: 35,
            action: "navigate_left",
          },
          {
            id: "right",
            name: "Right",
            type: "direction",
            x: 145,
            y: 255,
            width: 35,
            height: 35,
            action: "navigate_right",
          },
          {
            id: "ok",
            name: "OK",
            type: "action",
            x: 110,
            y: 255,
            width: 35,
            height: 35,
            action: "confirm",
          },
          {
            id: "vol_up",
            name: "Vol+",
            type: "volume",
            x: 30,
            y: 220,
            width: 30,
            height: 30,
            action: "volume_up",
          },
          {
            id: "vol_down",
            name: "Vol-",
            type: "volume",
            x: 30,
            y: 255,
            width: 30,
            height: 30,
            action: "volume_down",
          },
          {
            id: "ch_up",
            name: "Ch+",
            type: "channel",
            x: 190,
            y: 220,
            width: 30,
            height: 30,
            action: "channel_up",
          },
          {
            id: "ch_down",
            name: "Ch-",
            type: "channel",
            x: 190,
            y: 255,
            width: 30,
            height: 30,
            action: "channel_down",
          },
        ],
        zones: [
          {
            id: "power_zone",
            name: "Power Area",
            x: 85,
            y: 20,
            width: 100,
            height: 100,
            description: "Power button area",
          },
          {
            id: "nav_zone",
            name: "Navigation Area",
            x: 30,
            y: 200,
            width: 160,
            height: 120,
            description: "Navigation controls",
          },
        ],
      },
      {
        deviceId: "device-generic-dvb",
        name: "Generic DVB-T2 Remote",
        manufacturer: "Generic",
        model: "RC-DVB-STD",
        description: "Универсальный пульт для стандартных DVB-T2 приставок",
        layout: "standard",
        colorScheme: "dark",
        dimensions: { width: 190, height: 450 },
        buttons: [
          {
            id: "power",
            name: "Power",
            type: "power",
            x: 95,
            y: 35,
            width: 40,
            height: 40,
            action: "power_toggle",
          },
          {
            id: "source",
            name: "Source",
            type: "navigation",
            x: 50,
            y: 90,
            width: 35,
            height: 35,
            action: "change_source",
          },
          {
            id: "menu",
            name: "Menu",
            type: "navigation",
            x: 95,
            y: 90,
            width: 35,
            height: 35,
            action: "open_menu",
          },
          {
            id: "guide",
            name: "Guide",
            type: "navigation",
            x: 140,
            y: 90,
            width: 35,
            height: 35,
            action: "open_guide",
          },
          {
            id: "up",
            name: "Up",
            type: "direction",
            x: 95,
            y: 150,
            width: 30,
            height: 30,
            action: "navigate_up",
          },
          {
            id: "down",
            name: "Down",
            type: "direction",
            x: 95,
            y: 210,
            width: 30,
            height: 30,
            action: "navigate_down",
          },
          {
            id: "left",
            name: "Left",
            type: "direction",
            x: 65,
            y: 180,
            width: 30,
            height: 30,
            action: "navigate_left",
          },
          {
            id: "right",
            name: "Right",
            type: "direction",
            x: 125,
            y: 180,
            width: 30,
            height: 30,
            action: "navigate_right",
          },
          {
            id: "ok",
            name: "OK",
            type: "action",
            x: 95,
            y: 180,
            width: 30,
            height: 30,
            action: "confirm",
          },
          {
            id: "vol_up",
            name: "Vol+",
            type: "volume",
            x: 35,
            y: 150,
            width: 25,
            height: 25,
            action: "volume_up",
          },
          {
            id: "vol_down",
            name: "Vol-",
            type: "volume",
            x: 35,
            y: 180,
            width: 25,
            height: 25,
            action: "volume_down",
          },
          {
            id: "ch_up",
            name: "Ch+",
            type: "channel",
            x: 155,
            y: 150,
            width: 25,
            height: 25,
            action: "channel_up",
          },
          {
            id: "ch_down",
            name: "Ch-",
            type: "channel",
            x: 155,
            y: 180,
            width: 25,
            height: 25,
            action: "channel_down",
          },
        ],
        zones: [
          {
            id: "power_zone",
            name: "Power Area",
            x: 75,
            y: 15,
            width: 80,
            height: 80,
            description: "Power button area",
          },
          {
            id: "nav_zone",
            name: "Navigation Area",
            x: 35,
            y: 130,
            width: 120,
            height: 90,
            description: "Navigation controls",
          },
        ],
      },
    ];

    // Проверяем существующие пульты
    const existingRemotesResult = await database.query(
      "SELECT device_id, COUNT(*) as count FROM remotes WHERE is_active = true GROUP BY device_id",
    );
    const existingRemotes = new Map(
      existingRemotesResult.rows.map((row) => [
        row.device_id,
        parseInt(row.count),
      ]),
    );

    let remotesCreated = 0;
    let remotesSkipped = 0;

    for (const remoteConfig of defaultRemotes) {
      const { deviceId, ...remoteData } = remoteConfig;

      // Проверяем, есть ли уже пульты для этого устройства
      const existingCount = existingRemotes.get(deviceId) || 0;
      if (existingCount > 0) {
        console.log(
          `⏭️  У устройства ${deviceId} уже есть ${existingCount} пульт(ов), пропускаем`,
        );
        remotesSkipped++;
        continue;
      }

      console.log(`📱 Создаем пульт для ${deviceId}...`);

      await database.query(
        `INSERT INTO remotes (
          id, device_id, name, manufacturer, model, description,
          layout, color_scheme, dimensions, buttons, zones,
          is_default, usage_count, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          `remote-${deviceId}`,
          deviceId,
          remoteData.name,
          remoteData.manufacturer,
          remoteData.model,
          remoteData.description,
          remoteData.layout,
          remoteData.colorScheme,
          JSON.stringify(remoteData.dimensions),
          JSON.stringify(remoteData.buttons),
          JSON.stringify(remoteData.zones),
          true, // is_default - первый пульт для устройства автоматически становится default
          0, // usage_count
          true, // is_active
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      remotesCreated++;
      console.log(`✅ Пульт "${remoteData.name}" создан успешно`);
    }

    // Создаем универсальный пульт
    console.log("🌍 Создание универсального пульта...");

    const universalRemoteExists = await database.query(
      "SELECT COUNT(*) as count FROM remotes WHERE device_id IS NULL AND is_active = true",
    );

    if (parseInt(universalRemoteExists.rows[0].count) === 0) {
      await database.query(
        `INSERT INTO remotes (
          id, device_id, name, manufacturer, model, description,
          layout, color_scheme, dimensions, buttons, zones,
          is_default, usage_count, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          "remote-universal",
          null, // device_id = NULL для универсального пульта
          "Universal Remote",
          "ANT",
          "RC-UNIVERSAL",
          "Универсальный пульт для всех поддерживаемых устройств",
          "standard",
          "dark",
          JSON.stringify({ width: 200, height: 460 }),
          JSON.stringify([
            {
              id: "power",
              name: "Power",
              type: "power",
              x: 100,
              y: 40,
              width: 40,
              height: 40,
              action: "power_toggle",
            },
            {
              id: "menu",
              name: "Menu",
              type: "navigation",
              x: 100,
              y: 100,
              width: 35,
              height: 35,
              action: "open_menu",
            },
            {
              id: "up",
              name: "Up",
              type: "direction",
              x: 100,
              y: 160,
              width: 30,
              height: 30,
              action: "navigate_up",
            },
            {
              id: "down",
              name: "Down",
              type: "direction",
              x: 100,
              y: 220,
              width: 30,
              height: 30,
              action: "navigate_down",
            },
            {
              id: "left",
              name: "Left",
              type: "direction",
              x: 70,
              y: 190,
              width: 30,
              height: 30,
              action: "navigate_left",
            },
            {
              id: "right",
              name: "Right",
              type: "direction",
              x: 130,
              y: 190,
              width: 30,
              height: 30,
              action: "navigate_right",
            },
            {
              id: "ok",
              name: "OK",
              type: "action",
              x: 100,
              y: 190,
              width: 30,
              height: 30,
              action: "confirm",
            },
          ]),
          JSON.stringify([
            {
              id: "control_zone",
              name: "Main Controls",
              x: 30,
              y: 30,
              width: 140,
              height: 200,
              description: "Main control area",
            },
          ]),
          false, // is_default - универсальный пульт не является default для конкретного устройства
          0, // usage_count
          true, // is_active
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      remotesCreated++;
      console.log("✅ Универсальный пульт создан успешно");
    } else {
      console.log("⏭️  Универсальный пульт уже существует, пропускаем");
      remotesSkipped++;
    }

    console.log(
      `📱 Пультов создано: ${remotesCreated}, пропущено: ${remotesSkipped}`,
    );

    // 6. Пропускаем настройки сайта
    console.log("⚙️  Пропускаем настройки сайта...");

    // Проверяем количество записей
    console.log("\n📊 Проверка данных...");
    const devicesCount = await database.query(
      "SELECT COUNT(*) as count FROM devices",
    );
    const problemsCount = await database.query(
      "SELECT COUNT(*) as count FROM problems",
    );
    const remotesCount = await database.query(
      "SELECT COUNT(*) as count FROM remotes WHERE is_active = true",
    );

    console.log("🎉 База данных успешно заполнена!");
    console.log("===================================");
    console.log(`📺 Устройств: ${devicesCount.rows[0].count}`);
    console.log(`⚠️  Проблем: ${problemsCount.rows[0].count}`);
    console.log(`🎮 Пультов: ${remotesCount.rows[0].count}`);

    console.log("\n✅ Заполнение базы данных завершено!");
  } catch (error) {
    console.error("❌ Ошибка заполнения базы данных:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    await database.closePool();
    console.log("🔒 Соединения с базой данных закрыты");
  }
}

// Запуск заполнения
seedDatabase();
