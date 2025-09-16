#!/usr/bin/env node

/**
 * Тест создания проблем для проверки валидации дубликатов
 * Использует API для тестирования функциональности после исправления BaseModel
 */

const API_BASE = "http://localhost:5000/api/v1";

async function makeRequest(url, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Ошибка запроса:", error);
    return { status: 0, error: error.message };
  }
}

async function testProblemCreation() {
  console.log("🧪 Тестирование создания проблем и валидации дубликатов\n");

  // 1. Получаем список устройств
  console.log("1️⃣ Получение списка устройств...");
  const devicesResponse = await makeRequest(`${API_BASE}/devices`);

  if (devicesResponse.status !== 200) {
    console.error("❌ Не удалось получить список устройств:", devicesResponse);
    return;
  }

  const devices = devicesResponse.data.data;
  if (!devices || devices.length === 0) {
    console.error("❌ Нет доступных устройств для тестирования");
    return;
  }

  const testDevice = devices[0];
  console.log(
    `✅ Найдено устройство для тестирования: ${testDevice.name} (ID: ${testDevice.id})\n`,
  );

  // 2. Создаем тестовую проблему
  const uniqueTitle = `Тестовая проблема ${Date.now()}`;
  const testProblem = {
    title: uniqueTitle,
    description: "Это тестовая проблема для проверки валидации дубликатов",
    device_id: testDevice.id,
    category: "minor",
    priority: 1,
    status: "draft",
  };

  console.log("2️⃣ Создание новой проблемы...");
  console.log("Данные проблемы:", JSON.stringify(testProblem, null, 2));

  const createResponse = await makeRequest(
    `${API_BASE}/problems`,
    "POST",
    testProblem,
  );

  if (createResponse.status === 201) {
    console.log("✅ Проблема успешно создана:", createResponse.data.data.id);
    const createdProblem = createResponse.data.data;

    // 3. Пытаемся создать дубликат
    console.log("\n3️⃣ Попытка создания дубликата...");
    const duplicateResponse = await makeRequest(
      `${API_BASE}/problems`,
      "POST",
      testProblem,
    );

    if (duplicateResponse.status === 409) {
      console.log("✅ Валидация дубликатов работает корректно");
      console.log(
        "Ответ сервера:",
        JSON.stringify(duplicateResponse.data, null, 2),
      );

      // Проверяем структуру ответа об ошибке
      if (
        duplicateResponse.data.errorType === "DUPLICATE_ERROR" &&
        duplicateResponse.data.existingProblem &&
        duplicateResponse.data.details?.suggestions
      ) {
        console.log("✅ С��руктура ответа об ошибке корректна");
      } else {
        console.log("⚠️ Структура ответа об ошибке неполная");
      }
    } else {
      console.log("❌ Валидация дубликатов НЕ работает:", duplicateResponse);
    }

    // 4. Создаем проблему с другим названием
    console.log("\n4️⃣ Создание проблемы с другим названием...");
    const differentProblem = {
      ...testProblem,
      title: `${uniqueTitle} - отличается`,
    };

    const differentResponse = await makeRequest(
      `${API_BASE}/problems`,
      "POST",
      differentProblem,
    );

    if (differentResponse.status === 201) {
      console.log("✅ Проблема с отличающимся названием создана успешно");

      // Очистка - удаляем тестовые проблемы
      console.log("\n🧹 Очистка тестовых данных...");
      await makeRequest(
        `${API_BASE}/problems/${createdProblem.id}?force=true`,
        "DELETE",
      );
      await makeRequest(
        `${API_BASE}/problems/${differentResponse.data.data.id}?force=true`,
        "DELETE",
      );
      console.log("✅ Тестовые данные удалены");
    } else {
      console.log(
        "❌ Не удалось создать проблему с отличающимся названием:",
        differentResponse,
      );
    }
  } else {
    console.log("❌ Не удалось создать тестовую проблему:", createResponse);
  }

  console.log("\n🏁 Тестирование завершено");
}

// Проверяем статус API перед тестированием
async function checkApiStatus() {
  console.log("🔍 Проверка статуса API...");
  const statusResponse = await makeRequest(`${API_BASE}/status`);

  if (statusResponse.status === 200) {
    console.log("✅ API доступен\n");
    return true;
  } else {
    console.log("❌ API недоступен:", statusResponse);
    return false;
  }
}

// Запуск тестов
async function main() {
  const isApiReady = await checkApiStatus();
  if (isApiReady) {
    await testProblemCreation();
  }
}

// Проверяем доступность fetch
if (typeof fetch === "undefined") {
  console.log("📦 Устанавливаем node-fetch...");
  try {
    const { default: fetch } = await import("node-fetch");
    global.fetch = fetch;
    await main();
  } catch (error) {
    console.error(
      "❌ Не удалось импорт��ровать node-fetch. Установите его: npm install node-fetch",
    );
  }
} else {
  await main();
}
