-- Migration 002: Adding indexes for performance optimization
-- Создание индексов для оптимизации запросо��

-- Основные внешние ключи
CREATE INDEX IF NOT EXISTS idx_problems_device_id ON problems(device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_problem_id ON diagnostic_steps(problem_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_device_id ON diagnostic_steps(device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_device_id ON diagnostic_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_problem_id ON diagnostic_sessions(problem_id);
CREATE INDEX IF NOT EXISTS idx_session_steps_session_id ON session_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_session_steps_step_id ON session_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_step_actions_step_id ON step_actions(step_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_entity_id ON change_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_remotes_device_id ON remotes(device_id);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_device_id ON tv_interfaces(device_id);

-- Фильтрация и поиск
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(is_active);
CREATE INDEX IF NOT EXISTS idx_devices_order ON devices(order_index);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_active ON problems(is_active);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_step_number ON diagnostic_steps(step_number);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_active ON diagnostic_steps(is_active);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diagnostic_sessions' AND column_name='success') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_success ON diagnostic_sessions(success)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_active ON diagnostic_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_remotes_default ON remotes(is_default);
CREATE INDEX IF NOT EXISTS idx_remotes_active ON remotes(is_active);

-- Временные индексы
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_start_time ON diagnostic_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_end_time ON diagnostic_sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_change_logs_created_at ON change_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_session_steps_started_at ON session_steps(started_at);
CREATE INDEX IF NOT EXISTS idx_session_steps_completed_at ON session_steps(completed_at);

-- Составные индексы
CREATE INDEX IF NOT EXISTS idx_problems_device_status ON problems(device_id, status);
CREATE INDEX IF NOT EXISTS idx_problems_device_active ON problems(device_id, is_active);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_problem_number ON diagnostic_steps(problem_id, step_number);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_problem_active ON diagnostic_steps(problem_id, is_active);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_device_time ON diagnostic_sessions(device_id, start_time);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diagnostic_sessions' AND column_name='success') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_device_success ON diagnostic_sessions(device_id, success)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_session_steps_session_number ON session_steps(session_id, step_number);
CREATE INDEX IF NOT EXISTS idx_change_logs_entity_type_id ON change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_user_time ON change_logs(user_id, created_at);

-- Полнотекстовый поиск (Russian language support)
CREATE INDEX IF NOT EXISTS idx_problems_title_search ON problems USING gin(to_tsvector('russian', title));
CREATE INDEX IF NOT EXISTS idx_problems_description_search ON problems USING gin(to_tsvector('russian', description));
CREATE INDEX IF NOT EXISTS idx_devices_name_search ON devices USING gin(to_tsvector('russian', name));
CREATE INDEX IF NOT EXISTS idx_devices_brand_search ON devices USING gin(to_tsvector('russian', brand));
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_title_search ON diagnostic_steps USING gin(to_tsvector('russian', title));
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_description_search ON diagnostic_steps USING gin(to_tsvector('russian', description));

-- JSONB индексы для метаданных и настроек
CREATE INDEX IF NOT EXISTS idx_devices_metadata ON devices USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_problems_metadata ON problems USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_validation_rules ON diagnostic_steps USING gin(validation_rules);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_media ON diagnostic_steps USING gin(media);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_metadata ON diagnostic_steps USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_feedback ON diagnostic_sessions USING gin(feedback);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_error_steps ON diagnostic_sessions USING gin(error_steps);
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING gin(permissions);
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING gin(preferences);
CREATE INDEX IF NOT EXISTS idx_remotes_buttons ON remotes USING gin(buttons);
CREATE INDEX IF NOT EXISTS idx_remotes_zones ON remotes USING gin(zones);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_clickable_areas ON tv_interfaces USING gin(clickable_areas);
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_highlight_areas ON tv_interfaces USING gin(highlight_areas);

-- Уникальные индексы для обеспечения целостности данных
CREATE UNIQUE INDEX IF NOT EXISTS idx_problems_device_title_unique ON problems(device_id, title) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE is_active = true;

-- Частичные индексы для активных записей (экономия места)
CREATE INDEX IF NOT EXISTS idx_devices_active_only ON devices(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_problems_published_only ON problems(id) WHERE status = 'published' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_active_only ON diagnostic_steps(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_remotes_active_only ON remotes(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tv_interfaces_active_only ON tv_interfaces(id) WHERE is_active = true;

-- Индексы д��я аналитики и отчетности
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diagnostic_sessions' AND column_name='success') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_analytics ON diagnostic_sessions(device_id, problem_id, success, start_time) WHERE is_active = true';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_session_steps_analytics ON session_steps(session_id, completed, result) WHERE result IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_analytics ON problems(device_id, category, completed_count, success_rate) WHERE is_active = true;

-- Индекс для поиска сессий по IP адресу (безопасность)
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_ip ON diagnostic_sessions(ip_address, start_time);

-- Индекс для очистки старых логов
CREATE INDEX IF NOT EXISTS idx_change_logs_cleanup ON change_logs(created_at) WHERE is_active = true;

-- Статистика по таблицам для планировщика запросов
ANALYZE devices;
ANALYZE problems;
ANALYZE diagnostic_steps;
ANALYZE remotes;
ANALYZE tv_interfaces;
ANALYZE users;
ANALYZE diagnostic_sessions;
ANALYZE session_steps;
ANALYZE step_actions;
ANALYZE change_logs;
ANALYZE site_settings;

-- Migration 002: Индексы для оптимизации созданы успешно
