# ANT Support Backend API

## Описание

Backend API для системы диагностики ТВ-приставок ANT Support. Предоставляет REST API для управления устройствами, проблемами, диагностическими шагами и сессиями диагностики.

## Технологии

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - База данных
- **pg** - PostgreSQL client для Node.js
- **Joi** - Валидация данных
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Безопасность
- **Morgan** - HTTP логирование
- **Compression** - Сжатие HTTP ответов
- **Rate Limiting** - Ограничение частоты запросов

## Структура проекта

```
backend/
├── src/
│   ├── controllers/          # Контроллеры API
│   │   ├── deviceController.js
│   │   ├── problemController.js
│   │   ├── stepController.js
│   │   └── sessionController.js
│   ├── models/              # Модели данных
│   │   ├── BaseModel.js
│   │   ├── Device.js
│   │   ├── Problem.js
│   │   ├── DiagnosticStep.js
│   │   └── DiagnosticSession.js
│   ├── routes/              # Роуты API
│   │   ├── index.js         # Главный роутер
│   │   ├── deviceRoutes.js
│   │   ├── problemRoutes.js
│   │   ├── stepRoutes.js
│   │   └── sessionRoutes.js
│   ├── middleware/          # Middleware функции
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── validateRequest.js
│   ├── utils/               # Утилиты
│   │   ├── database.js      # Подключение к БД
│   │   ├── initDb.js        # Инициализация БД
│   │   └── seedData.js      # Тестовые данные
│   └── server.js            # Главный файл сервера
├── migrations/              # SQL миграции
│   ├── 001_init_tables.sql
│   └── 002_add_indexes.sql
├── .env.example            # Пример переменных окружения
├── package.json
└── README.md
```

## Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка базы дан��ых

#### Вариант A: Neon Cloud Database (Рекомендуется)

1. **Создание проекта в Neon**
   - Зайдите на [Neon.tech](https://neon.tech/)
   - Создайте новый проект
   - Скопируйте строку подключения из Dashboard

2. **Настройка переменных окружения**

   ```bash
   cp .env.example .env
   ```

   Отредактируйте `.env` файл:

   ```env
   # NEON DATABASE CONFIGURATION
   DATABASE_URL=postgresql://neondb_owner:unpkg_4YeHe3BLxhOi@ep-royal-meadow-a5gnz7bg.us-east-2.aws.neon.tech/neondb?sslmode=require
   DB_SSL=true
   DB_POOL_MIN=2
   DB_POOL_MAX=20
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=10000

   # ОТКЛЮЧИТЬ MOCK БД
   USE_MOCK_DB=false

   # ОСНОВНЫЕ НАСТРОЙКИ
   NODE_ENV=development
   PORT=3000
   DEBUG=true

   # CORS
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080,http://localhost:8081

   # RATE LIMITING (для разработки)
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=10000

   # БЕЗОПАСНОСТЬ
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12

   # MIDDLEWARE
   HELMET_ENABLED=true
   COMPRESSION_ENABLED=true
   REQUEST_LOGGING=true
   ```

#### Вариант B: Локальная PostgreSQL

1. **Установка PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install postgresql postgresql-contrib

   # macOS с Homebrew
   brew install postgresql
   brew services start postgresql

   # Windows - скачайте с postgresql.org
   ```

2. **Создание базы данных**

   ```bash
   # Подключение к PostgreSQL
   sudo -u postgres psql

   # Создание базы и пользователя
   CREATE DATABASE ant_support;
   CREATE USER ant_user WITH PASSWORD 'secure_password123';
   GRANT ALL PRIVILEGES ON DATABASE ant_support TO ant_user;
   ALTER USER ant_user CREATEDB;
   \q
   ```

3. **Настройка .env для локальной БД**

   ```env
   # ЛОКАЛЬНАЯ POSTGRESQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ant_support
   DB_USER=ant_user
   DB_PASSWORD=secure_password123
   DB_SSL=false
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=5000

   USE_MOCK_DB=false
   NODE_ENV=development
   PORT=3000
   DEBUG=true
   ```

### 3. Инициализация базы данных

#### Автоматическая инициализация (рекомендуется)

```bash
# Полная инициализация: миграции + данные
npm run db:init
```

#### Пошаговая инициализация

```bash
# 1. Провер��а подключения
npm run db:check

# 2. Применение миграций
npm run db:migrate

# 3. Заполнение тестовыми данными
npm run db:seed

# 4. Проверка статистики
npm run db:stats
```

### 4. Запуск сервера

```bash
# Режим разработки (с hot reload)
npm run dev

# Режим продакшена
npm start
```

**Сервер будет доступен по адресу: `http://localhost:3000`**

## 🗄️ Детальная настройка базы данных

### Структура конфигурации

Система поддерживает несколько способов подключения к базе данных:

1. **DATABASE_URL** (приоритетный) - для облачных БД
2. **Отдельные параметры** (DB_HOST, DB_PORT, etc.) - для локальной БД
3. **Автоматическое определение** - система сама выберет оптимальную конфигурацию

### Файлы конфигурации

```
backend/
├── config/
│   └── database.js          # Централизованная конфигурация БД
├── src/utils/
│   ├── database.js          # Основные функции работы с БД
│   ├── migrate.js           # Утилита миграций
│   └── seed.js             # Утилита заполнения данными
├── scripts/
│   └── init-database.js     # Скрипт автоматической инициализации
├── migrations/
│   ├── 001_init_tables.sql  # Создание основных таблиц
│   └── 002_add_indexes.sql  # Добавление индексов
└── .env                     # Переменные окружения
```

### Переменные окружения БД

#### Обязательные

```env
# ДЛЯ NEON/ОБЛАЧНЫХ БД
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# ИЛИ ДЛЯ ЛОКАЛЬНОЙ БД
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ant_support
DB_USER=username
DB_PASSWORD=password
```

#### Дополнительные

```env
# SSL настройки
DB_SSL=true                     # true для облачных БД, false для локальных

# Pool соединений
DB_POOL_MIN=2                   # Минимальное количество соединений
DB_POOL_MAX=20                  # Максимальное количество соеди��ений
DB_IDLE_TIMEOUT=30000           # Время простоя соединения (мс)
DB_CONNECTION_TIMEOUT=10000     # Таймаут подключения (мс)

# Режимы работы
USE_MOCK_DB=false               # true = использовать моковые данные
DEBUG=true                      # Включить отладочные сообщения
```

### Команды для работы с БД

#### Основные команды

```bash
# Проверка подключения к БД
npm run db:check

# Полная инициализация (миграции + данные)
npm run db:init

# Только миграции
npm run db:migrate

# Только заполнение данными
npm run db:seed

# Статистика таблиц
npm run db:stats
```

#### Дополнительные команды

```bash
# Создание бекапа
npm run db:backup

# Восстановление из бекапа
npm run db:restore backup.sql

# Очистка всех данных (ОСТОРОЖНО!)
npm run db:clean

# Пересоздание с нуля (ОСТОРОЖНО!)
npm run db:reset
```

### Схема базы данных

#### Основные таблицы

```sql
-- Устройства (ТВ-приставки)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'tv_box',
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проблемы диагностики
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    severity VARCHAR(20) DEFAULT 'medium',
    solution_steps TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Диагностические шаги
CREATE TABLE diagnostic_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instruction TEXT,
    expected_result TEXT,
    step_type VARCHAR(50) DEFAULT 'instruction',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TV интерфейсы
CREATE TABLE tv_interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'home',
    screenshot_url VARCHAR(500),
    screenshot_data TEXT,
    clickable_areas JSONB DEFAULT '[]',
    highlight_areas JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Индексы

```sql
-- Оптимизация запросов
CREATE INDEX idx_devices_brand_model ON devices(brand, model);
CREATE INDEX idx_devices_active ON devices(is_active);
CREATE INDEX idx_problems_device ON problems(device_id);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_diagnostic_steps_problem ON diagnostic_steps(problem_id);
CREATE INDEX idx_tv_interfaces_device ON tv_interfaces(device_id);
```

### Проверка настройки

После настройки выполните проверку:

```bash
# 1. Проверка подключения
npm run db:check
# Ожидаемый результат: ✅ Подключение к базе данных установлено

# 2. Проверка таблиц
npm run db:stats
# Ожидаемый результат: Статистика всех таблиц

# 3. Проверка данных
npm run db:seed
# Ожидаемый результат: Таблицы заполнены тестовыми данными

# 4. Запуск сервера
npm run dev
# Ожидаемый результат: Сервер запущен без ошибок
```

### Устранение проблем

#### Ошибка подключения к Neon

```bash
# Проверьте правильность DATABASE_URL
echo $DATABASE_URL

# Проверьте настройки SSL
# В .env должно быть: DB_SSL=true

# Проверьте доступность хоста
ping ep-royal-meadow-a5gnz7bg.us-east-2.aws.neon.tech
```

#### Ошибка "relation does not exist"

```bash
# Выполните миграции
npm run db:migrate

# Или полную инициализацию
npm run db:init
```

#### Проблемы с правами доступа

```bash
# Для локальной БД убедитесь, что пользователь имеет права:
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE ant_support TO ant_user;
ALTER USER ant_user CREATEDB;
```

#### Rate limiting ошибки (429)

```bash
# Увеличьте лимиты в .env
RATE_LIMIT_MAX_REQUESTS=10000
RATE_LIMIT_WINDOW_MS=60000
```

## API Документация

### Базовые эндпоинты

- `GET /api/health` - Проверка состояния API
- `GET /api/info` - Информация об API
- `GET /api/docs` - Документация API

### Устройства

- `GET /api/v1/devices` - Получение списка устройств
- `GET /api/v1/devices/:id` - Получение устройства по ID
- `POST /api/v1/devices` - Создание устройства
- `PUT /api/v1/devices/:id` - Обновление устройства
- `DELETE /api/v1/devices/:id` - Удаление устройства
- `GET /api/v1/devices/search` - Поиск устройств
- `GET /api/v1/devices/popular` - Популярные устройства
- `GET /api/v1/devices/stats` - Статистика устройств

### Проблемы

- `GET /api/v1/problems` - Получение списка проблем
- `GET /api/v1/problems/:id` - Получение проблемы по ID
- `POST /api/v1/problems` - Создание проблемы
- `PUT /api/v1/problems/:id` - Обновление проблемы
- `DELETE /api/v1/problems/:id` - Удаление проблемы
- `GET /api/v1/problems/device/:deviceId` - Проблемы по устройству
- `GET /api/v1/problems/category/:category` - Проблемы по категории
- `POST /api/v1/problems/:id/publish` - Публикация проблемы

### Диагностические шаги

- `GET /api/v1/steps` - Получение списка шагов
- `GET /api/v1/steps/:id` - Получение шага по ID
- `POST /api/v1/steps` - Создание шага
- `PUT /api/v1/steps/:id` - Обновление шага
- `DELETE /api/v1/steps/:id` - Удаление шага
- `GET /api/v1/steps/problem/:problemId` - Шаги по проблеме
- `PUT /api/v1/steps/reorder` - Переупорядочивание шагов

### Диагностические сессии

- `GET /api/v1/sessions` - Получение списка сессий
- `GET /api/v1/sessions/:id` - Получение сессии по ID
- `POST /api/v1/sessions` - Создание сессии
- `PUT /api/v1/sessions/:id` - Обновление сессии
- `POST /api/v1/sessions/:id/complete` - Завершение сессии
- `POST /api/v1/sessions/:id/progress` - Обновление прогресса
- `GET /api/v1/sessions/active` - Активные сессии
- `GET /api/v1/sessions/stats` - Статист��ка сессий

## Схема базы данных

### Основные таблицы

1. **devices** - Устройства (ТВ-приставки)
2. **problems** - Проблемы диагностики
3. **diagnostic_steps** - Шаги диагностики
4. **diagnostic_sessions** - Сессии диагностики
5. **session_steps** - Выполненные шаги в сессии
6. **users** - Пользователи системы

### Связи

- Device → Problems (1:N)
- Problem → DiagnosticSteps (1:N)
- Device + Problem → DiagnosticSession (N:1)
- DiagnosticSession → SessionSteps (1:N)
- DiagnosticStep → SessionSteps (1:N)

## Валидация данных

API использует библиотеку Joi для валидации входящих данных. Все эндпоинты проверяют:

- Типы данных
- Обязательные поля
- Ограничения длины
- Формат значений (email, URL, etc.)
- Бизнес-правила

## Обработка ошибок

Все ошибки возвращаются в едином формате:

```json
{
  "success": false,
  "error": "Описание ошибки",
  "errorType": "VALIDATION_ERROR",
  "details": [...],
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Типы ошибок

- `VALIDATION_ERROR` - Ошибка валидации данных
- `NOT_FOUND` - Ресурс не найден
- `DUPLICATE_ERROR` - Дублирование данных
- `CONSTRAINT_ERROR` - Нарушение ограничений БД

## Безопасность

- **Helmet** - Установка security headers
- **CORS** - Настройка cross-origin requests
- **Rate Limiting** - Ограничение частоты запросов
- **Input Validation** - Валидация всех входящих данных
- **SQL Injection Protection** - Использование параметризованных запросов

## Логирование

- **Morgan** - HTTP запросы в development/production режимах
- **Custom Logger** - Логирование ошибок и важных событий
- **Request/Response** - Детальное логирование API вызовов

## Развертывание

### Development

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

### Production

```bash
npm install --production
npm run db:init
NODE_ENV=production npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Обязательные переменные для продакшена:

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=ant_support
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-super-secret-key
```

## Мониторинг и здоровье

### Health Check

```bash
curl http://localhost:3000/api/health
```

Ответ:

```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {...}
}
```

### Метрики

- Время ответа API
- Использование памяти
- Активные соединения к БД
- Количество запросов в секунду
- Статистика ошибок

## Тестирование

```bash
# Запуск тестов
npm test

# Запуск с покрытием
npm run test:coverage

# Линтинг кода
npm run lint

# Форматирование кода
npm run format
```

## API Клиент

Для frontend ин��еграции создан TypeScript клиент с:

- Автоматическая типизация
- React Query интеграция
- Обработка ошибок
- Кеширование данных
- Оптимистичные обновления

## Поддержка

- **Документация**: `/api/docs`
- **Проблемы**: GitHub Issues
- **Email**: support@ant-support.com

## Лицензия

MIT License - see LICENSE file for details.
