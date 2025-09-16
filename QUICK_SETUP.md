# 🚀 Быстрая настройка ANT Support

## ⚡ За 5 минут

### 1. Установка

```bash
git clone <repository-url>
cd ant-support-fullstack
npm run install:all
```

### 2. База данных (выберите вариант)

#### 🌩️ Neon Cloud (рекомендуется)

```bash
# 1. Скопируйте конфигурацию
cp backend/.env.example backend/.env

# 2. Отредактируйте backend/.env:
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DB_SSL=true
USE_MOCK_DB=false

# 3. Инициализация
cd backend && npm run db:init
```

#### 💻 Локальная PostgreSQL

```bash
# 1. Установите PostgreSQL
sudo apt install postgresql  # Ubuntu
brew install postgresql      # macOS

# 2. Создайте БД
sudo -u postgres psql
CREATE DATABASE ant_support;
CREATE USER ant_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE ant_support TO ant_user;
\q

# 3. Настройте backend/.env:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ant_support
DB_USER=ant_user
DB_PASSWORD=password
DB_SSL=false
USE_MOCK_DB=false

# 4. Инициализация
cd backend && npm run db:init
```

### 3. Запуск

```bash
npm run dev
```

**✅ Готово! Приложение доступно на http://localhost:8081**

---

## 📋 Полезные команды

### База данных

```bash
cd backend

npm run db:check    # Проверка подключения
npm run db:init     # Полная инициализация
npm run db:migrate  # Только миграции
npm run db:seed     # Только данные
npm run db:stats    # Статистика таблиц
```

### Разработка

```bash
npm run dev         # Запуск frontend + backend
npm run build       # Сборка для продакшена
npm start          # Запуск продакшен версии
```

### Тестирование

```bash
cd backend && npm test     # Backend тесты
cd frontend && npm test    # Frontend тесты
```

---

## 🔧 Устранение проблем

### Ошибка подключения к БД

```bash
# Проверьте настройки
cat backend/.env

# Проверьте подключение
cd backend && npm run db:check
```

### 429 Rate Limit ошибки

```bash
# В backend/.env добавьте:
RATE_LIMIT_MAX_REQUESTS=10000
```

### CORS ошибки

```bash
# В backend/.env обновите:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

---

## 📚 Подробная документация

- [README.md](README.md) - Полная документация
- [backend/README.md](backend/README.md) - Backend API документация
- [API Documentation](http://localhost:3000/api/docs) - Интерактивная документация API

---

**🐜 ANT Support Team**
