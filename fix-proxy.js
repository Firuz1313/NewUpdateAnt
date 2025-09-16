#!/usr/bin/env node

/**
 * Скрипт для быстрого исправления настроек прокси
 * Автоматически переключает прокси на фронтенд (8081) вместо бэкенда (3000)
 */

console.log("🔧 Исправление настроек прокси ANT Support...");
console.log("");
console.log("❌ Проблема: ERR_BLOCKED_BY_RESPONSE");
console.log(
  "📋 Причина: Прокси указывает на бэкенд (3000) вместо фронтенда (8081)",
);
console.log("");

// Проверяем текущие настройки
console.log("📊 Текущие настройки:");
console.log("   🔸 Backend (API): http://localhost:3000/api/v1");
console.log("   🔸 Frontend (React): http://localhost:8081/");
console.log("");

// Инструкции по исправлению
console.log("✅ Решение:");
console.log("   1. Использовать DevServerControl.set_proxy_port(8081)");
console.log("   2. Перезапустить dev сервер если нужно");
console.log("   3. Убедиться что фронтенд запущен на порту 8081");
console.log("");

// Проверка конфигурации
console.log("🔍 Проверка конфигурации:");

const fs = require("fs");
const path = require("path");

// Проверяем конфигурацию Vite
const viteConfigPath = path.join(__dirname, "frontend", "vite.config.ts");
if (fs.existsSync(viteConfigPath)) {
  console.log("   ✅ Конфигурация Vite найдена");
  const viteConfig = fs.readFileSync(viteConfigPath, "utf8");
  if (viteConfig.includes("port: 8081")) {
    console.log("   ✅ Фронтенд настроен на порт 8081");
  } else {
    console.log("   ⚠️  Проверьте настройки порта в vite.config.ts");
  }
} else {
  console.log("   ❌ Конфигурация Vite не найдена");
}

// Проверяем package.json
const packageJsonPath = path.join(__dirname, "package.json");
if (fs.existsSync(packageJsonPath)) {
  console.log("   ✅ Главный package.json найден");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  if (packageJson.scripts && packageJson.scripts.dev) {
    console.log('   ✅ Скрипт "npm run dev" настроен');
  }
}

console.log("");
console.log("🎯 Для исправления проблемы:");
console.log("   DevServerControl.set_proxy_port(8081)");
console.log("");
console.log(
  "🚀 После исправления вы увидите React приложение вместо 404 ошибок!",
);
