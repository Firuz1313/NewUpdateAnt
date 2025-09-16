# Исправление проблем с созданием и редактированием диагностических шагов

## Обнаруженные проблемы

1. **Несоответствие имён полей** между frontend (camelCase) и backend (snake_case)
   - Frontend отправлял: `remoteId`, `tvInterfaceId`, `deviceId`, `problemId`
   - Backend ожидал: `remote_id`, `tv_interface_id`, `device_id`, `problem_id`

2. **Некорректная валидация** - поля помечались как обязательные, хотя должны были быть опциональными

3. **Проблемы с отображением данных** при редактировании - значения не загружались из snake_case полей

4. **Прокси настройки** - показывалось backend API вместо frontend интерфейса

## Реализованные исправления

### 1. Middleware для преобразования полей запросов
**Файл:** `backend/src/middleware/decamelizeBody.js`
- Автоматически преобразует camelCase → snake_case для входящих запросов
- Обрабатывает поля: remoteId → remote_id, tvInterfaceId → tv_interface_id, и т.д.

### 2. Middleware для преобразования полей ответов  
**Файл:** `backend/src/middleware/camelizeResponse.js`
- Автоматически преобразует snake_case → camelCase для исходящих ответов
- Обеспечивает корректное отображение данных во frontend

### 3. Исправление схемы валидации
**Файл:** `backend/src/middleware/validateRequest.js`
- Сделал поля `remote_id` и `tv_interface_id` опциональными
- Исправил схему `commonSchemas.id` (убрал автоматический `.required()`)

### 4. Настройка прокси
**Исправлено через DevServerControl:**
- `proxy_port`: 8081 (frontend) вместо 3000 (backend)
- `dev_command`: "npm run dev" (полный стек) вместо "npm start" (только backend)

## Результат

✅ **Создание шагов**: Все поля корректно сохраняются включая:
- Выбор приставки (deviceId)
- Выбор проблемы (problemId)  
- Выбор пульта (remoteId)
- Выбор созданного интерфейса (tvInterfaceId)
- Позиция кнопки на пульте (buttonPosition)
- Все текстовые поля (title, description, instruction, hint)

✅ **Редактирование шагов**: При открытии редактирования все ранее выбранные значения корректно отображаются

✅ **Статус шагов**: Шаги создаются как активные (isActive: true)

✅ **Прокси**: Корректно отображается frontend интерфейс

## Техническая реализация

### Server.js
```javascript
// Преобразование camelCase → snake_case (запросы)
app.use(decamelizeBody);

// Преобразование snake_case → camelCase (ответы)  
app.use(camelizeResponse);
```

### База данных
Схема БД остается в snake_case (стандарт PostgreSQL):
```sql
CREATE TABLE diagnostic_steps (
    remote_id VARCHAR(255) REFERENCES remotes(id),
    tv_interface_id VARCHAR(255) REFERENCES tv_interfaces(id),
    device_id VARCHAR(255) NOT NULL REFERENCES devices(id),
    problem_id VARCHAR(255) NOT NULL REFERENCES problems(id),
    -- остальные поля...
);
```

### Frontend типы
TypeScript интерфейсы остаются в camelCase (стандарт JavaScript):
```typescript
export interface Step extends BaseEntity {
    remoteId?: string;
    tvInterfaceId?: string;
    deviceId: string;
    problemId: string;
    // остальные поля...
}
```

## Проверка работоспособности

Для проверки работы системы:

1. **Создание шага:**
   - Откройте "Управление шагами"
   - Нажмите "Создать шаг"
   - Выберите приставку, проблему, интерфейс, пульт
   - Заполните все поля
   - Сохраните

2. **Редактирование шага:**
   - Найдите созданный шаг в списке
   - Нажмите "Редактировать"
   - Убедитесь что все ранее выбранные значения отображаются корректно

3. **Проверка сохранения:**
   - Все выбранные значения должны отображаться в списке шагов
   - Статус должен быть "Активный"
   - При повторном редактировании значения должны загружаться

Все исправления обратно совместимы и не влияют на существующие данные.
