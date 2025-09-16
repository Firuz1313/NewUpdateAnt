# ANT Support - Система диагностики ТВ-приставок

Полнофункциональная система диагностики ТВ-приставок с веб-интерфейсом для пользователей и административной панелью.

## 📋 Содержание

- [Быстрый старт](#-быстрый-старт)
- [Настройка базы данных](#-настройка-базы-данных)
- [Конфигурация](#-конфигурация)
- [Структура проекта](#-структура-проекта)
- [API докуме��тация](#-api-документация)
- [Разработка](#-разработка)
- [Развертывание](#-развертывание)

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- PostgreSQL 14+ (или облачная база данных Neon)
- npm или yarn

### Установка и запуск

```bash
# 1. Клонирование репозитория
git clone <repository-url>
cd ant-support-fullstack

# 2. Установка зависимостей для всего проекта
npm run install:all

# 3. Настройка базы данных (см. раздел ниже)
# Скопируйте и настройте переменные окружения
cp backend/.env.example backend/.env

# 4. Инициализация базы данных
cd backend
npm run db:init

# 5. Запуск проекта (frontend + backend)
cd ..
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:8081`

## 🗄️ Настройка базы данных

### Вариант 1: Neon Cloud Database (Рекомендуется)

1. **Получение строки подключения**
   - Зайдите на [Neon.tech](https://neon.tech/)
   - Создайте новый проект или используйте существующий
   - Скопируйте строку подключения из дашборда

2. **Настройка переменных окружения**

   Создайте файл `backend/.env`:

   ```env
   # База данных Neon
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   DB_SSL=true

   # Настройки пула соединений
   DB_POOL_MIN=2
   DB_POOL_MAX=20
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=10000

   # Отключаем mock базу данных
   USE_MOCK_DB=false

   # Остальные настройки
   NODE_ENV=development
   PORT=3000
   DEBUG=true
   ```

3. **Автоматическая инициализация**
   ```bash
   cd backend
   npm run db:init
   ```

### Вариант 2: Локальная PostgreSQL

1. **Установка PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (с Homebrew)
   brew install postgresql
   brew services start postgresql

   # Windows - скачайте с официального сайта
   ```

2. **Создание базы данных**

   ```bash
   # Подключение к PostgreSQL
   sudo -u postgres psql

   # Создание базы данных и пользователя
   CREATE DATABASE ant_support;
   CREATE USER ant_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ant_support TO ant_user;
   \q
   ```

3. **Настройка .env**

   ```env
   # Локальная PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ant_support
   DB_USER=ant_user
   DB_PASSWORD=secure_password
   DB_SSL=false

   # Настройки пула
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=5000

   USE_MOCK_DB=false
   NODE_ENV=development
   PORT=3000
   ```

### Проверка подключения

```bash
cd backend

# Проверка соединения с базой данных
npm run db:check

# Инициализация схемы и данных
npm run db:init

# Проверка статистики
npm run db:stats
```

## ⚙️ Конфигурация

### Переменные окружения

#### Backend (`backend/.env`)

```env
# === БАЗА ДАННЫХ ===
# Для Neon Cloud:
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
# Или для локальной БД:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ant_support
DB_USER=postgres
DB_PASSWORD=password

DB_SSL=false                    # true для облачных БД
DB_POOL_MIN=2                   # Минимум соединений
DB_POOL_MAX=20                  # Максимум соединений
DB_IDLE_TIMEOUT=30000           # Таймаут простоя (мс)
DB_CONNECTION_TIMEOUT=10000     # Таймаут подключения (мс)

# === СЕРВЕР ===
NODE_ENV=development            # development | production
PORT=3000                       # Порт backend сервера
DEBUG=true                      # Отладочные сообщения

# === БЕЗОПАСНОСТЬ ===
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# === CORS ===
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:3000

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000     # 15 минут
RATE_LIMIT_MAX_REQUESTS=1000    # Макс запросов в окне

# === ЗАГРУЗКА ФАЙЛОВ ===
UPLOAD_MAX_SIZE=10485760        # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# === MIDDLEWARE ===
HELMET_ENABLED=true             # Security headers
COMPRESSION_ENABLED=true        # Gzip сжатие
REQUEST_LOGGING=true            # Логирование запросов

# === РАЗРАБОТКА ===
USE_MOCK_DB=false              # true для mock данных
LOG_LEVEL=debug                # error | warn | info | debug
```

### Скрипты NPM

#### Корневые скрипты

```bash
# Установка зависимостей для всего проекта
npm run install:all

# Запуск frontend + backend одновременно
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен версии
npm start
```

#### Backend скрипты

```bash
cd backend

# Разработка с hot reload
npm run dev

# Запуск в продакшен режиме
npm start

# === БАЗА ДАННЫХ ===
npm run db:init          # Полная инициализация БД
npm run db:migrate       # Только миграции
npm run db:seed          # Только заполнение данными
npm run db:check         # Проверка подключения
npm run db:stats         # Статистика таблиц

# === ТЕСТИРОВАНИЕ ===
npm test                 # Запуск тестов
npm run test:coverage    # Тесты с покрытием
npm run lint             # Проверка кода
npm run format           # Форматирование кода
```

#### Frontend скрипты

```bash
cd frontend

# Разработка
npm run dev

# Сборка
npm run build

# Предпросмотр собранной версии
npm run preview

# Тестирование
npm run test
npm run test:ui          # UI для тестов
npm run test:coverage    # Покрытие тестов

# Качество кода
npm run lint
npm run typecheck
npm run format
```

## 📁 Структура проекта

```
ant-support-fullstack/
├── 📂 backend/                 # Backend API
│   ├── 📂 src/
│   │   ├── 📂 controllers/     # API контроллеры
│   │   ├── 📂 models/          # Модели данных
│   │   ├── 📂 routes/          # API роуты
│   │   ├── 📂 middleware/      # Middleware функции
│   │   ├── 📂 utils/           # Утилиты и помощники
│   │   └── 📄 server.js        # Главный файл сервера
│   ├── 📂 migrations/          # SQL миграции
│   ├── 📂 scripts/             # Скрипты инициализации
│   ├── 📂 config/              # Конфигурационные фай��ы
│   ├── 📄 .env                 # Переменные окружения
│   └── 📄 package.json
├── 📂 frontend/                # Frontend React приложение
│   ├── 📂 src/
│   │   ├── 📂 components/      # React компоненты
│   │   ├── 📂 pages/           # Страницы приложения
│   │   ├── 📂 hooks/           # Custom React hooks
│   │   ├── 📂 api/             # API клиент
│   │   ├── 📂 types/           # TypeScript типы
│   │   └── 📄 main.tsx         # Точка входа
│   ├── 📄 vite.config.ts       # Конфигурация Vite
│   ├── 📄 tailwind.config.ts   # Конфигурация Tailwind
│   └── 📄 package.json
├── 📄 package.json             # Корневой package.json
├── 📄 README.md               # Эта документация
└── 📄 .gitignore
```

## 🔗 API документация

### Базовая информация

- **Base URL**: `http://localhost:3000/api/v1`
- **Формат**: JSON
- **Аутентификация**: JWT токены (в разработке)

### Основные эндпоинты

#### Устройства

```
GET    /api/v1/devices           # Список устройств
GET    /api/v1/devices/:id       # Устройство по ID
POST   /api/v1/devices           # Создание устройства
PUT    /api/v1/devices/:id       # Обновление устройства
DELETE /api/v1/devices/:id       # Удаление устройства
GET    /api/v1/devices/stats     # Статистика устройств
```

#### Проблемы

```
GET    /api/v1/problems          # Список проблем
GET    /api/v1/problems/:id      # Проблема по ID
POST   /api/v1/problems          # Создание проблемы
PUT    /api/v1/problems/:id      # Обновление проблемы
DELETE /api/v1/problems/:id      # Удаление проблемы
GET    /api/v1/problems/device/:deviceId  # Проблемы по устройству
```

#### TV интерфейсы

```
GET    /api/v1/tv-interfaces     # Список интерфейсов
POST   /api/v1/tv-interfaces     # Создание интерфейса
PUT    /api/v1/tv-interfaces/:id # Обновление интерфейса
DELETE /api/v1/tv-interfaces/:id # Удаление интерфейса
```

### Формат ответов

Успешный ответ:

```json
{
  "success": true,
  "data": [...],
  "message": "Операция выполнена успешно",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

Ошибка:

```json
{
  "success": false,
  "error": "Описание ошибки",
  "details": {...},
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 💻 Разработка

### Требования к окружению

- Node.js 18.0.0+
- PostgreSQL 14.0+ (или Neon cloud)
- Git

### Настройка среды разработки

1. **Клонирование и установка**

   ```bash
   git clone <repository-url>
   cd ant-support-fullstack
   npm run install:all
   ```

2. **Настройка базы данных**

   ```bash
   # Скопируйте пример конфигурации
   cp backend/.env.example backend/.env

   # Отредактируйте backend/.env с вашими настройками БД
   # Затем инициализируйте базу данных
   cd backend
   npm run db:init
   ```

3. **Запуск в режиме разработки**
   ```bash
   # Из корневой папки проекта
   npm run dev
   ```

### Работа с базой данных

#### Быстрые команды

```bash
# Проверить соединение
npm run db:check

# Пересоздать схему (ВНИМАНИЕ: удаляет все данные!)
npm run db:reset

# Создать бекап
npm run db:backup

# Восстановить из бекапа
npm run db:restore backup.sql
```

#### Добавление новой миграции

1. Создайте файл в `backend/migrations/`:

   ```sql
   -- backend/migrations/003_add_new_feature.sql

   -- Создание новой таблицы
   CREATE TABLE IF NOT EXISTS new_feature (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Добавление индекса
   CREATE INDEX IF NOT EXISTS idx_new_feature_name ON new_feature(name);
   ```

2. Обновите скрипт инициализации в `backend/scripts/init-database.js`

3. Запустите миграцию:
   ```bash
   npm run db:migrate
   ```

### Тестирование

```bash
# Backend тесты
cd backend
npm test

# Frontend тесты
cd frontend
npm test

# E2E тесты (если настроены)
npm run test:e2e
```

## 🚀 Развертывание

### Production окружение

1. **Настройка переменных о��ружения**

   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@prod-host/db?sslmode=require
   JWT_SECRET=very-secure-production-secret
   ALLOWED_ORIGINS=https://yourdomain.com
   PORT=3000
   ```

2. **Сборка и развертывание**

   ```bash
   # Сборка frontend
   npm run build

   # Запуск в production режиме
   NODE_ENV=production npm start
   ```

### Docker развертывание

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копирование package.json файлов
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка frontend
RUN npm run build

# Открытие портов
EXPOSE 3000 8081

# Запуск
CMD ["npm", "start"]
```

### Мониторинг

```bash
# Проверка здоровья API
curl http://localhost:3000/api/health

# Проверка метрик
curl http://localhost:3000/api/metrics
```

## 🔧 Устранение неполадок

### Частые проблемы

#### 1. Ошибка подключения к базе да��ных

```bash
# Проверьте настройки в .env файле
cat backend/.env

# Проверьте доступность базы данных
npm run db:check

# Пересоздайте подключение
npm run db:reconnect
```

#### 2. Ошибки миграции

```bash
# Проверьте логи миграции
npm run db:migrate -- --verbose

# Откатите последнюю миграцию
npm run db:rollback

# Принудительная инициализация
npm run db:init -- --force
```

#### 3. CORS ошибки

Обновите `ALLOWED_ORIGINS` в `backend/.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,https://yourdomain.com
```

#### 4. Rate limiting

Для разработки увеличьте лимиты в `backend/.env`:

```env
RATE_LIMIT_MAX_REQUESTS=10000
RATE_LIMIT_WINDOW_MS=60000
```

### Логи и отладка

```bash
# Включить подробные логи
DEBUG=true npm run dev

# Просмотр логов базы данных
npm run db:logs

# Просмотр API логов
tail -f backend/logs/api.log
```

## 📞 Поддержка

- **Документация**: В этом README файле
- **Issues**: GitHub Issues раздел
- **API документация**: `http://localhost:3000/api/docs`

## 📄 Лицензия

MIT License. Подробности в файле [LICENSE](LICENSE).

---

**Создано командой ANT Support** 🐜
