-- Миграция для создания таблицы tv_interfaces
-- Создание таблицы TV интерфейсов

CREATE TABLE IF NOT EXISTS tv_interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('home', 'settings', 'channels', 'apps', 'guide', 'no-signal', 'error', 'custom')),
    device_id UUID NOT NULL,
    screenshot_url TEXT,
    screenshot_data TEXT, -- base64 данные изображения
    clickable_areas JSONB DEFAULT '[]'::jsonb,
    highlight_areas JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Внешний ключ к таблице devices
    CONSTRAINT fk_tv_interfaces_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES devices(id) 
        ON DELETE CASCADE,
    
    -- Уникальный индекс для предотвращения дублирования названий в рамках одного устройства
    CONSTRAINT unique_tv_interface_name_per_device 
        UNIQUE (name, device_id, deleted_at)
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_device_id ON tv_interfaces(device_id);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_type ON tv_interfaces(type);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_is_active ON tv_interfaces(is_active);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_created_at ON tv_interfaces(created_at);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_deleted_at ON tv_interfaces(deleted_at);

-- Индекс для поиска по названию и описанию
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_search ON tv_interfaces USING gin(to_tsvector('russian', name || ' ' || COALESCE(description, '')));

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_tv_interfaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_tv_interfaces_updated_at ON tv_interfaces;
CREATE TRIGGER trigger_update_tv_interfaces_updated_at
    BEFORE UPDATE ON tv_interfaces
    FOR EACH ROW
    EXECUTE FUNCTION update_tv_interfaces_updated_at();

-- Комментарии к таблице и колонкам
COMMENT ON TABLE tv_interfaces IS 'Таблица для хранения интерфейсов ТВ приставок';
COMMENT ON COLUMN tv_interfaces.id IS 'Уникальный идентификатор интерфейса';
COMMENT ON COLUMN tv_interfaces.name IS 'Название интерфейса';
COMMENT ON COLUMN tv_interfaces.description IS 'Описание интерфейса';
COMMENT ON COLUMN tv_interfaces.type IS 'Тип интерфейса (home, settings, channels, apps, guide, no-signal, error, custom)';
COMMENT ON COLUMN tv_interfaces.device_id IS 'ID устройства, для которого создан интерфейс';
COMMENT ON COLUMN tv_interfaces.screenshot_url IS 'URL скриншота интерфейса';
COMMENT ON COLUMN tv_interfaces.screenshot_data IS 'Base64 данные скриншота интерфейса';
COMMENT ON COLUMN tv_interfaces.clickable_areas IS 'JSON массив кликабельных областей на интерфейсе';
COMMENT ON COLUMN tv_interfaces.highlight_areas IS 'JSON массив областей подсветки на интерфейсе';
COMMENT ON COLUMN tv_interfaces.is_active IS 'Флаг активности интерфейса';
COMMENT ON COLUMN tv_interfaces.created_at IS 'Дата и время создания';
COMMENT ON COLUMN tv_interfaces.updated_at IS 'Дата и время последнего обновления';
COMMENT ON COLUMN tv_interfaces.deleted_at IS 'Дата и время удаления (soft delete)';

-- Вставка примеров данных (опционально)
INSERT INTO tv_interfaces (name, description, type, device_id, is_active) 
SELECT 
    'Домашний экран ' || d.name,
    'Стандартный домашний экран для ' || d.name,
    'home',
    d.id,
    true
FROM devices d
WHERE d.deleted_at IS NULL
ON CONFLICT (name, device_id, deleted_at) DO NOTHING;

INSERT INTO tv_interfaces (name, description, type, device_id, is_active) 
SELECT 
    'Настройки ' || d.name,
    'Экран настроек для ' || d.name,
    'settings',
    d.id,
    true
FROM devices d
WHERE d.deleted_at IS NULL
ON CONFLICT (name, device_id, deleted_at) DO NOTHING;

-- Вывод информации о созданной таблице
SELECT 
    'tv_interfaces table created successfully' as status,
    COUNT(*) as total_interfaces,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_interfaces,
    COUNT(DISTINCT device_id) as devices_with_interfaces
FROM tv_interfaces
WHERE deleted_at IS NULL;
