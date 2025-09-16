import database from "./src/utils/database.js";
import { v4 as uuidv4 } from "uuid";

async function createTestRemote() {
  try {
    console.log("🔧 Создание тестового пульта...");

    // Check if device exists
    const deviceCheck = await database.query(
      "SELECT id, name FROM devices WHERE id = $1",
      ["device-ant-basic"],
    );

    if (deviceCheck.rows.length === 0) {
      console.log("❌ Устройство device-ant-basic не найдено");
      return;
    }

    console.log(`✅ Устройство найдено: ${deviceCheck.rows[0].name}`);

    // Check if remote already exists
    const remoteCheck = await database.query(
      "SELECT COUNT(*) as count FROM remotes WHERE device_id = $1",
      ["device-ant-basic"],
    );

    if (parseInt(remoteCheck.rows[0].count) > 0) {
      console.log("⚠️  Пульт уже существует для этого устройства");
      return;
    }

    // Create test remote
    const remoteId = uuidv4();
    const buttons = [
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
    ];

    const zones = [
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
    ];

    await database.query(
      `INSERT INTO remotes (
        id, device_id, name, manufacturer, model, description, 
        layout, color_scheme, dimensions, buttons, zones, 
        is_default, usage_count, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        remoteId,
        "device-ant-basic",
        "ANT Basic Remote",
        "ANT",
        "RC-ANT-B100",
        "Стандартный пульт для ANT Basic приставки",
        "standard",
        "dark",
        JSON.stringify({ width: 200, height: 480 }),
        JSON.stringify(buttons),
        JSON.stringify(zones),
        true, // is_default
        0, // usage_count
        true, // is_active
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );

    console.log("✅ Тестовый пульт создан успешно!");
    console.log(`🆔 Remote ID: ${remoteId}`);

    // Test the API endpoint
    const testRemote = await database.query(
      "SELECT * FROM remotes WHERE device_id = $1 AND is_default = true",
      ["device-ant-basic"],
    );

    if (testRemote.rows.length > 0) {
      console.log("🎉 Пульт по умолчанию найден! API должен работать.");
    }
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  } finally {
    await database.closePool();
  }
}

createTestRemote();
