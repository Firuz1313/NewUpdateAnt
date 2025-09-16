const fetch = require("node-fetch");

const testData = {
  device_id: "openbox",
  title: `TEST-JSON-FIX-${Date.now()}`,
  description: "Тест исправления JSON сериализации",
  category: "critical",
  icon: "AlertTriangle",
  color: "from-red-500 to-red-600",
  tags: ["тест", "json-fix"], // Это массив, который должен быть сериализован
  priority: 1,
  estimated_time: 5,
  difficulty: "beginner",
  status: "published",
};

console.log("�� Тестируем создание проблемы с JSON полями...");
console.log("📦 Данные для отправки:", JSON.stringify(testData, null, 2));

fetch("http://localhost:3000/api/v1/problems", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(testData),
})
  .then((response) => {
    console.log(`📊 Статус ответа: ${response.status}`);
    return response.json();
  })
  .then((data) => {
    if (data.success) {
      console.log("✅ Успех! Проблема создана:", data.data.title);
      console.log("🆔 ID:", data.data.id);
      console.log("🏷️  Теги (сериализованы):", data.data.tags);
    } else {
      console.log("❌ Ошибка:", data.error);
      if (data.errorType) {
        console.log("🔧 Тип ошибки:", data.errorType);
      }
    }
  })
  .catch((error) => {
    console.error("💥 Ошибка сети:", error.message);
  });
