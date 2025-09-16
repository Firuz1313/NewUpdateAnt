import express from 'express';
import {
  getSteps,
  getStepById,
  createStep,
  updateStep,
  deleteStep,
  restoreStep,
  getStepsByProblem,
  searchSteps,
  reorderSteps,
  insertStep,
  duplicateStep,
  getNextStep,
  getPreviousStep,
  getStepStats,
  validateStepOrder,
  fixStepNumbering
} from '../controllers/stepController.js';

const router = express.Router();

/**
 * @route GET /api/v1/steps
 * @desc Получение списка диагностических шагов
 * @access Public
 * @query {string} [problem_id] - Фильтр по проблеме
 * @query {string} [device_id] - Фильтр по устройству
 * @query {string} [search] - Поисковый запрос
 * @query {boolean} [is_active] - Фильтр по активности
 * @query {number} [page=1] - Номер страницы
 * @query {number} [limit=20] - Количество элементов на странице
 * @query {string} [sort=step_number] - Поле для сортировки
 * @query {string} [order=asc] - Направление сортировки (asc, desc)
 * @query {boolean} [include_details=false] - Включить детальную информацию
 */
router.get('/', getSteps);

/**
 * @route GET /api/v1/steps/search
 * @desc Поиск диагностических шагов
 * @access Public
 * @query {string} q - Поисковый запрос (минимум 2 символа)
 * @query {number} [limit=20] - Максимальное количество результатов
 * @query {number} [offset=0] - Смещение для пагинации
 */
router.get('/search', searchSteps);

/**
 * @route GET /api/v1/steps/problem/:problemId
 * @desc Получение шагов по проблеме
 * @access Public
 * @params {string} problemId - ID проблемы
 * @query {boolean} [is_active=true] - Фильтр по активности
 */
router.get('/problem/:problemId', getStepsByProblem);

/**
 * @route GET /api/v1/steps/validate/:problemId
 * @desc Валидация порядка шагов в проблеме
 * @access Admin
 * @params {string} problemId - ID проблемы
 */
router.get('/validate/:problemId', validateStepOrder);

/**
 * @route GET /api/v1/steps/:id
 * @desc Получение шага по ID
 * @access Public
 * @params {string} id - ID шага
 * @query {boolean} [include_details=false] - Включить детальную информацию
 * @query {boolean} [include_stats=false] - Включить статистику использования
 */
router.get('/:id', getStepById);

/**
 * @route GET /api/v1/steps/:id/next
 * @desc Получение следующего шага
 * @access Public
 * @params {string} id - ID текущего шага
 */
router.get('/:id/next', getNextStep);

/**
 * @route GET /api/v1/steps/:id/previous
 * @desc Получение предыдущего шага
 * @access Public
 * @params {string} id - ID текущего шага
 */
router.get('/:id/previous', getPreviousStep);

/**
 * @route GET /api/v1/steps/:id/stats
 * @desc Получение статистики использования шага
 * @access Admin
 * @params {string} id - ID шага
 */
router.get('/:id/stats', getStepStats);

/**
 * @route POST /api/v1/steps
 * @desc Создание нового диагностического шага
 * @access Admin
 * @body {object} step - Данные шага
 * @body {string} step.problem_id - ID проблемы
 * @body {string} step.device_id - ID устройства
 * @body {number} [step.step_number] - Номер шага (автоматический если не указан)
 * @body {string} step.title - Название шага
 * @body {string} [step.description] - Описание шага
 * @body {string} step.instruction - Инструкция для выполнения
 * @body {number} [step.estimated_time] - Ожидаемое время выполнения
 * @body {string} [step.highlight_remote_button] - Подсветка кнопки пульта
 * @body {string} [step.highlight_tv_area] - Подсветка области ТВ
 * @body {string} [step.tv_interface_id] - ID интерфейса ТВ
 * @body {string} [step.remote_id] - ID пульта
 * @body {string} [step.action_type] - Тип действия
 * @body {object} [step.button_position] - Позиция кнопки
 * @body {string} [step.svg_path] - SVG путь
 * @body {string} [step.zone_id] - ID зоны
 * @body {string} [step.required_action] - Требуемое действие
 * @body {array} [step.validation_rules] - Правила валидации
 * @body {string} [step.success_condition] - Условие успеха
 * @body {array} [step.failure_actions] - Действия при неудаче
 * @body {string} [step.hint] - Подсказка
 * @body {string} [step.warning_text] - Предупреждение
 * @body {string} [step.success_text] - Текст при успехе
 * @body {array} [step.media] - Медиа материалы
 * @body {array} [step.next_step_conditions] - Условия следующего шага
 * @body {object} [step.metadata] - Дополнительные данные
 */
router.post('/', createStep);

/**
 * @route POST /api/v1/steps/insert
 * @desc Вставка шага между существующими шагами
 * @access Admin
 * @body {string} problem_id - ID проблемы
 * @body {number} after_step_number - Номер шага, после которого вставить
 * @body {object} stepData - Данные нового шага
 */
router.post('/insert', insertStep);

/**
 * @route POST /api/v1/steps/fix-numbering/:problemId
 * @desc Автоматическое исправление нумерации шагов
 * @access Admin
 * @params {string} problemId - ID проблемы
 */
router.post('/fix-numbering/:problemId', fixStepNumbering);

/**
 * @route POST /api/v1/steps/:id/duplicate
 * @desc Дублирование шага
 * @access Admin
 * @params {string} id - ID шага для дублирования
 * @body {string} [target_problem_id] - ID целевой проблемы
 */
router.post('/:id/duplicate', duplicateStep);

/**
 * @route POST /api/v1/steps/:id/restore
 * @desc Восстановление архивированного шага
 * @access Admin
 * @params {string} id - ID шага
 */
router.post('/:id/restore', restoreStep);

/**
 * @route PUT /api/v1/steps/reorder
 * @desc Переупорядочивание шагов
 * @access Admin
 * @body {string} problem_id - ID проблемы
 * @body {array} step_ids - Массив ID шагов в новом порядке
 */
router.put('/reorder', reorderSteps);

/**
 * @route PUT /api/v1/steps/:id
 * @desc Обновление шага
 * @access Admin
 * @params {string} id - ID шага
 * @body {object} step - Данные для обновления
 */
router.put('/:id', updateStep);

/**
 * @route DELETE /api/v1/steps/:id
 * @desc Удаление шага
 * @access Admin
 * @params {string} id - ID шага
 * @query {boolean} [force=false] - Принудительное удаление
 * @query {boolean} [reorder=true] - Переупорядочить оставшиеся шаги
 */
router.delete('/:id', deleteStep);

export default router;
