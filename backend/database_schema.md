# Схема базы данных ANT Support

## Обзор архитектуры

Схема базы данных спроектирована на основе анализа frontend компонентов и типов данных из `src/types/index.ts`. Система поддерживает полный цикл диагностики ТВ-приставок с интерактивными элементами.

## Основные таблицы

### 1. devices (Устройства)

Хранит информацию о поддерживаемых моделях ТВ-приставок.

```sql
CREATE TABLE devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    logo_url VARCHAR(500),
    color VARCHAR(100) NOT NULL DEFAULT 'from-gray-500 to-gray-600',
    order_index INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 2. problems (Проблемы)

Описания типичных проблем для каждого устройства.

```sql
CREATE TABLE problems (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (category IN ('critical', 'moderate', 'minor', 'other')),
    icon VARCHAR(100) NOT NULL DEFAULT 'HelpCircle',
    color VARCHAR(100) NOT NULL DEFAULT 'from-blue-500 to-blue-600',
    tags JSONB DEFAULT '[]'::jsonb,
    priority INTEGER NOT NULL DEFAULT 1,
    estimated_time INTEGER NOT NULL DEFAULT 5, -- в минутах
    difficulty VARCHAR(50) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    success_rate INTEGER NOT NULL DEFAULT 100 CHECK (success_rate >= 0 AND success_rate <= 100),
    completed_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 3. remotes (Пульты ДУ)

Интерактивные модели пультов дистанционного управления.

```sql
CREATE TABLE remotes (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) REFERENCES devices(id) ON DELETE SET NULL, -- NULL = универсальный пульт
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    description TEXT,
    layout VARCHAR(50) NOT NULL DEFAULT 'standard' CHECK (layout IN ('standard', 'compact', 'smart', 'custom')),
    color_scheme VARCHAR(50) NOT NULL DEFAULT 'dark',
    image_url VARCHAR(500),
    image_data TEXT, -- base64 encoded image
    svg_data TEXT,
    dimensions JSONB NOT NULL DEFAULT '{"width": 200, "height": 500}'::jsonb,
    buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
    zones JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 4. tv_interfaces (ТВ интерфейсы)

Снимки экранов приставок с интерактивными областями.

```sql
CREATE TABLE tv_interfaces (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) REFERENCES devices(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'custom' CHECK (type IN ('home', 'settings', 'channels', 'apps', 'guide', 'no-signal', 'error', 'custom')),
    screenshot_url VARCHAR(500),
    screenshot_data TEXT, -- base64 encoded image
    svg_overlay TEXT,
    clickable_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlight_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    responsive BOOLEAN NOT NULL DEFAULT false,
    breakpoints JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 5. diagnostic_steps (Диагностические шаги)

Пошаговые инструкции для решения проблем.

```sql
CREATE TABLE diagnostic_steps (
    id VARCHAR(255) PRIMARY KEY,
    problem_id VARCHAR(255) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    instruction TEXT NOT NULL,
    estimated_time INTEGER NOT NULL DEFAULT 30, -- в секундах

    -- Визуальные элементы
    highlight_remote_button VARCHAR(255),
    highlight_tv_area VARCHAR(255),
    tv_interface_id VARCHAR(255) REFERENCES tv_interfaces(id) ON DELETE SET NULL,

    -- Интерактивные элементы
    remote_id VARCHAR(255) REFERENCES remotes(id) ON DELETE SET NULL,
    action_type VARCHAR(50) CHECK (action_type IN ('button_press', 'navigation', 'wait', 'check', 'input', 'selection', 'confirmation', 'custom')),
    button_position JSONB, -- {"x": number, "y": number}
    svg_path TEXT,
    zone_id VARCHAR(255),

    -- Логика и валидация
    required_action VARCHAR(500),
    validation_rules JSONB DEFAULT '[]'::jsonb,
    success_condition VARCHAR(500),
    failure_actions JSONB DEFAULT '[]'::jsonb,

    -- Контент
    hint TEXT,
    warning_text TEXT,
    success_text TEXT,
    media JSONB DEFAULT '[]'::jsonb,

    -- Логика ветвления
    next_step_conditions JSONB DEFAULT '[]'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(problem_id, step_number)
);
```

### 6. diagnostic_sessions (Сессии диагностики)

Трекинг прохождения пользователем диагностики.

```sql
CREATE TABLE diagnostic_sessions (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL REFERENCES devices(id),
    problem_id VARCHAR(255) NOT NULL REFERENCES problems(id),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL, -- для группировки связанных сессий
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    completed_steps INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN,
    duration INTEGER, -- в секундах
    error_steps JSONB DEFAULT '[]'::jsonb,
    feedback JSONB, -- рейтинг, комментарии
    user_agent TEXT,
    ip_address INET,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 7. session_steps (Выполненные шаги в сессии)

Детальный трекинг каждого шага в сессии.

```sql
CREATE TABLE session_steps (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
    step_id VARCHAR(255) NOT NULL REFERENCES diagnostic_steps(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN NOT NULL DEFAULT false,
    result VARCHAR(50) CHECK (result IN ('success', 'failure', 'skipped', 'timeout')),
    time_spent INTEGER, -- в секундах
    errors JSONB DEFAULT '[]'::jsonb,
    user_input JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 8. users (Пользователи/Администраторы)

Учетные записи пользователей системы.

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
    permissions JSONB DEFAULT '[]'::jsonb,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 9. step_actions (Действия шагов)

Детализированные действия для каждого шага.

```sql
CREATE TABLE step_actions (
    id VARCHAR(255) PRIMARY KEY,
    step_id VARCHAR(255) NOT NULL REFERENCES diagnostic_steps(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('button_press', 'navigation', 'wait', 'check', 'input', 'selection', 'confirmation', 'custom')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    svg_path TEXT,
    icon_url VARCHAR(500),
    color VARCHAR(100) NOT NULL DEFAULT '#000000',
    animation VARCHAR(50) CHECK (animation IN ('pulse', 'glow', 'bounce', 'shake', 'fade', 'highlight', 'none')),
    target_element VARCHAR(255),
    coordinates JSONB, -- {"x": number, "y": number}
    gesture VARCHAR(50) CHECK (gesture IN ('click', 'double_click', 'long_press', 'swipe_left', 'swipe_right', 'swipe_up', 'swipe_down')),
    expected_result TEXT,
    timeout INTEGER,
    retry_count INTEGER DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 10. change_logs (Журнал изменений)

Аудит всех изменений в системе.

```sql
CREATE TABLE change_logs (
    id VARCHAR(255) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('device', 'problem', 'step', 'remote', 'tv_interface', 'user', 'session')),
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'archive')),
    changes JSONB NOT NULL,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 11. site_settings (Настройки сайта)

Глобальные настройки системы.

```sql
CREATE TABLE site_settings (
    id VARCHAR(255) PRIMARY KEY DEFAULT 'settings',
    site_name VARCHAR(255) NOT NULL DEFAULT 'ANT Support',
    site_description TEXT,
    default_language VARCHAR(10) NOT NULL DEFAULT 'ru',
    supported_languages JSONB DEFAULT '["ru", "tj", "uz"]'::jsonb,
    theme VARCHAR(50) NOT NULL DEFAULT 'professional',
    primary_color VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    accent_color VARCHAR(50) NOT NULL DEFAULT '#10b981',
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),

    -- Возможности
    enable_analytics BOOLEAN NOT NULL DEFAULT true,
    enable_feedback BOOLEAN NOT NULL DEFAULT true,
    enable_offline_mode BOOLEAN NOT NULL DEFAULT false,
    enable_notifications BOOLEAN NOT NULL DEFAULT true,

    -- Лимиты и квоты
    max_steps_per_problem INTEGER NOT NULL DEFAULT 20,
    max_media_size INTEGER NOT NULL DEFAULT 10, -- MB
    session_timeout INTEGER NOT NULL DEFAULT 30, -- минуты

    -- Расширенные настройки
    api_settings JSONB DEFAULT '{}'::jsonb,
    email_settings JSONB DEFAULT '{}'::jsonb,
    storage_settings JSONB DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## Индексы для оптимизации

```sql
-- Основные внешние ключи
CREATE INDEX idx_problems_device_id ON problems(device_id);
CREATE INDEX idx_steps_problem_id ON diagnostic_steps(problem_id);
CREATE INDEX idx_steps_device_id ON diagnostic_steps(device_id);
CREATE INDEX idx_sessions_device_id ON diagnostic_sessions(device_id);
CREATE INDEX idx_sessions_problem_id ON diagnostic_sessions(problem_id);
CREATE INDEX idx_session_steps_session_id ON session_steps(session_id);
CREATE INDEX idx_session_steps_step_id ON session_steps(step_id);

-- Фильтрация и поиск
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_active ON devices(is_active);
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_steps_step_number ON diagnostic_steps(step_number);
CREATE INDEX idx_sessions_success ON diagnostic_sessions(success);

-- Временные индексы
CREATE INDEX idx_sessions_start_time ON diagnostic_sessions(start_time);
CREATE INDEX idx_change_logs_created_at ON change_logs(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Со��тавные индексы
CREATE INDEX idx_problems_device_status ON problems(device_id, status);
CREATE INDEX idx_steps_problem_number ON diagnostic_steps(problem_id, step_number);
CREATE INDEX idx_sessions_device_time ON diagnostic_sessions(device_id, start_time);

-- Полнотекстовый поиск
CREATE INDEX idx_problems_title_search ON problems USING gin(to_tsvector('russian', title));
CREATE INDEX idx_problems_description_search ON problems USING gin(to_tsvector('russian', description));
CREATE INDEX idx_devices_name_search ON devices USING gin(to_tsvector('russian', name));

-- JSONB индексы
CREATE INDEX idx_devices_metadata ON devices USING gin(metadata);
CREATE INDEX idx_problems_tags ON problems USING gin(tags);
CREATE INDEX idx_steps_validation_rules ON diagnostic_steps USING gin(validation_rules);
```

## Триггеры для автоматических обновлений

```sql
-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применение триггеров ко всем таблицам
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostic_steps_updated_at BEFORE UPDATE ON diagnostic_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_remotes_updated_at BEFORE UPDATE ON remotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tv_interfaces_updated_at BEFORE UPDATE ON tv_interfaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostic_sessions_updated_at BEFORE UPDATE ON diagnostic_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_steps_updated_at BEFORE UPDATE ON session_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_actions_updated_at BEFORE UPDATE ON step_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_change_logs_updated_at BEFORE UPDATE ON change_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Начальные данные

```sql
-- Вставка дефолтных настроек
INSERT INTO site_settings (id, site_name, site_description) VALUES (
    'settings',
    'ANT Support',
    'Профессиональная платформа для диагностики цифровых ТВ-приставок'
) ON CONFLICT (id) DO NOTHING;

-- Создание админ пользователя (пароль нужно будет хешировать)
INSERT INTO users (id, username, email, password_hash, role, email_verified) VALUES (
    'admin-001',
    'admin',
    'admin@antsupport.local',
    '$2b$10$placeholder_hash', -- Заменить на реальный хеш
    'admin',
    true
) ON CONFLICT (username) DO NOTHING;
```
