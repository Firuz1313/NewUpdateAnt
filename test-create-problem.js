// Простой тест для создания проблемы
async function testCreateProblem() {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://acda120aedd441349b3374c520906a2d-73ca7d7b38f348b8a1b98f465.fly.dev"
      : "http://localhost:8081";

  const testData = {
    device_id: "openbox",
    title: "Тестовая проблема " + Date.now(),
    description: "Описание тестовой проблемы",
    category: "critical",
    icon: "AlertTriangle",
    color: "from-red-500 to-red-600",
    priority: 1,
    estimated_time: 5,
    difficulty: "beginner",
    success_rate: 100,
    status: "published",
  };

  try {
    console.log("🚀 Отправка POST запроса:", baseUrl + "/api/v1/problems");
    console.log("📦 Данные:", testData);

    const response = await fetch(baseUrl + "/api/v1/problems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log("📡 Статус ответа:", response.status);
    console.log("📡 Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📃 Ответ (text):", responseText);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log("✅ Проблема создана:", result);
        return result;
      } catch (e) {
        console.log("⚠️  Ответ не является JSON");
      }
    } else {
      console.error("❌ Ошибка HTTP:", response.status, responseText);
    }
  } catch (error) {
    console.error("❌ Сетевая ошибка:", error);
  }
}

// Запуск в Node.js
if (typeof module !== "undefined" && module.exports) {
  testCreateProblem();
}

// Экспорт для использования в браузере
if (typeof window !== "undefined") {
  window.testCreateProblem = testCreateProblem;
}
