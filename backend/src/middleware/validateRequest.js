import Joi from "joi";

// Общие схемы валидации
const commonSchemas = {
  id: Joi.string().min(1).max(255),
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().max(320).required(),
  password: Joi.string().min(6).max(255).required(),
  url: Joi.string().uri().max(500),
  text: Joi.string().max(1000),
  longText: Joi.string().max(10000),
  boolean: Joi.boolean(),
  integer: Joi.number().integer(),
  positiveInteger: Joi.number().integer().min(1),
  percentage: Joi.number().integer().min(0).max(100),
  timestamp: Joi.date().iso(),
  jsonObject: Joi.object().unknown(true),
  jsonArray: Joi.array().items(Joi.any()),
  color: Joi.string().pattern(
    /^(from-\w+-\d+\s+to-\w+-\d+|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})$/,
  ),
  status: Joi.string().valid(
    "active",
    "inactive",
    "draft",
    "published",
    "archived",
  ),
  category: Joi.string().valid("critical", "moderate", "minor", "other"),
  difficulty: Joi.string().valid("beginner", "intermediate", "advanced"),
  role: Joi.string().valid("admin", "moderator", "user"),
};

// Схемы валидации для устройств
export const deviceValidation = {
  create: Joi.object({
    id: commonSchemas.id,
    name: Joi.string().min(1).max(255).required(),
    brand: Joi.string().min(1).max(255).required(),
    model: Joi.string().min(1).max(255).required(),
    description: commonSchemas.text,
    image_url: Joi.string().uri().max(500).allow("", null).optional(),
    logo_url: Joi.string().uri().max(500).allow("", null).optional(),
    color: commonSchemas.color.default("from-gray-500 to-gray-600"),
    order_index: commonSchemas.integer.default(0),
    status: Joi.string()
      .valid("active", "inactive", "maintenance")
      .default("active"),
    metadata: commonSchemas.jsonObject,
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255),
    brand: Joi.string().min(1).max(255),
    model: Joi.string().min(1).max(255),
    description: commonSchemas.text,
    image_url: Joi.string().uri().max(500).allow("", null).optional(),
    logo_url: Joi.string().uri().max(500).allow("", null).optional(),
    color: commonSchemas.color,
    order_index: commonSchemas.integer,
    status: Joi.string().valid("active", "inactive", "maintenance"),
    is_active: commonSchemas.boolean,
    metadata: commonSchemas.jsonObject,
  }).min(1),
};

// Схемы валидации для проблем
export const problemValidation = {
  create: Joi.object({
    // ID убран из валидации - всегда генерируется сервером
    device_id: commonSchemas.id.required(),
    title: Joi.string().min(1).max(500).required(),
    description: commonSchemas.longText,
    category: commonSchemas.category.default("other"),
    icon: Joi.string().max(100).default("HelpCircle"),
    color: commonSchemas.color.default("from-blue-500 to-blue-600"),
    tags: commonSchemas.jsonArray.default([]),
    priority: commonSchemas.positiveInteger.default(1),
    estimated_time: commonSchemas.positiveInteger.default(5),
    difficulty: commonSchemas.difficulty.default("beginner"),
    success_rate: commonSchemas.percentage.default(100),
    status: Joi.string()
      .valid("draft", "published", "archived")
      .default("draft"),
    metadata: commonSchemas.jsonObject,
  }),

  update: Joi.object({
    device_id: commonSchemas.id.optional(),
    title: Joi.string().min(1).max(500).optional(),
    description: commonSchemas.longText.optional(),
    category: commonSchemas.category.optional(),
    icon: Joi.string().max(100).optional(),
    color: commonSchemas.color.optional(),
    tags: commonSchemas.jsonArray.optional(),
    priority: commonSchemas.positiveInteger.optional(),
    estimated_time: commonSchemas.positiveInteger.optional(),
    difficulty: commonSchemas.difficulty.optional(),
    success_rate: commonSchemas.percentage.optional(),
    completed_count: commonSchemas.integer.min(0).optional(),
    status: Joi.string().valid("draft", "published", "archived").optional(),
    is_active: commonSchemas.boolean.optional(),
    metadata: commonSchemas.jsonObject.optional(),
  }).min(1),
};

// Схемы валидации для диагностических шагов
export const stepValidation = {
  create: Joi.object({
    id: commonSchemas.id.optional(),
    problem_id: commonSchemas.id.required(),
    device_id: commonSchemas.id.required(),
    step_number: commonSchemas.positiveInteger.optional(),
    title: Joi.string().min(1).max(500).required(),
    description: commonSchemas.longText.optional(),
    instruction: commonSchemas.longText.required(),
    estimated_time: commonSchemas.positiveInteger.default(30),
    highlight_remote_button: Joi.string().max(255).optional(),
    highlight_tv_area: Joi.string().max(255).optional(),
    tv_interface_id: commonSchemas.id.optional(),
    remote_id: commonSchemas.id.optional(),
    action_type: Joi.string().valid(
      "button_press",
      "navigation",
      "wait",
      "check",
      "input",
      "selection",
      "confirmation",
      "custom",
    ),
    button_position: commonSchemas.jsonObject,
    svg_path: commonSchemas.longText,
    zone_id: Joi.string().max(255),
    required_action: Joi.string().max(500),
    validation_rules: commonSchemas.jsonArray.default([]),
    success_condition: Joi.string().max(500),
    failure_actions: commonSchemas.jsonArray.default([]),
    hint: commonSchemas.text,
    warning_text: commonSchemas.text,
    success_text: commonSchemas.text,
    media: commonSchemas.jsonArray.default([]),
    next_step_conditions: commonSchemas.jsonArray.default([]),
    metadata: commonSchemas.jsonObject,
  }),

  update: Joi.object({
    problem_id: commonSchemas.id.optional(),
    device_id: commonSchemas.id.optional(),
    step_number: commonSchemas.positiveInteger.optional(),
    title: Joi.string().min(1).max(500).optional(),
    description: commonSchemas.longText.optional(),
    instruction: commonSchemas.longText.optional(),
    estimated_time: commonSchemas.positiveInteger.optional(),
    highlight_remote_button: Joi.string().max(255).optional(),
    highlight_tv_area: Joi.string().max(255).optional(),
    tv_interface_id: commonSchemas.id.optional(),
    remote_id: commonSchemas.id.optional(),
    action_type: Joi.string().valid(
      "button_press",
      "navigation",
      "wait",
      "check",
      "input",
      "selection",
      "confirmation",
      "custom",
    ),
    button_position: commonSchemas.jsonObject,
    svg_path: commonSchemas.longText,
    zone_id: Joi.string().max(255),
    required_action: Joi.string().max(500),
    validation_rules: commonSchemas.jsonArray,
    success_condition: Joi.string().max(500),
    failure_actions: commonSchemas.jsonArray,
    hint: commonSchemas.text,
    warning_text: commonSchemas.text,
    success_text: commonSchemas.text,
    media: commonSchemas.jsonArray,
    next_step_conditions: commonSchemas.jsonArray,
    is_active: commonSchemas.boolean,
    metadata: commonSchemas.jsonObject,
  }).min(1),
};

// Схемы валидации для пультов
export const remoteValidation = {
  create: Joi.object({
    id: commonSchemas.id,
    device_id: commonSchemas.id,
    name: Joi.string().min(1).max(255).required(),
    manufacturer: Joi.string().min(1).max(255).required(),
    model: Joi.string().min(1).max(255).required(),
    description: commonSchemas.text,
    layout: Joi.string()
      .valid("standard", "compact", "smart", "custom")
      .default("standard"),
    color_scheme: Joi.string().max(50).default("dark"),
    image_url: commonSchemas.url,
    image_data: commonSchemas.longText,
    svg_data: commonSchemas.longText,
    dimensions: commonSchemas.jsonObject.default({ width: 200, height: 500 }),
    buttons: commonSchemas.jsonArray.default([]),
    zones: commonSchemas.jsonArray.default([]),
    is_default: commonSchemas.boolean.default(false),
    metadata: commonSchemas.jsonObject,
  }),

  update: Joi.object({
    device_id: commonSchemas.id,
    name: Joi.string().min(1).max(255),
    manufacturer: Joi.string().min(1).max(255),
    model: Joi.string().min(1).max(255),
    description: commonSchemas.text,
    layout: Joi.string().valid("standard", "compact", "smart", "custom"),
    color_scheme: Joi.string().max(50),
    image_url: commonSchemas.url,
    image_data: commonSchemas.longText,
    svg_data: commonSchemas.longText,
    dimensions: commonSchemas.jsonObject,
    buttons: commonSchemas.jsonArray,
    zones: commonSchemas.jsonArray,
    is_default: commonSchemas.boolean,
    usage_count: commonSchemas.integer.min(0),
    is_active: commonSchemas.boolean,
    metadata: commonSchemas.jsonObject,
  }).min(1),
};

// Схемы валидации для сессий
export const sessionValidation = {
  create: Joi.object({
    id: commonSchemas.id,
    device_id: commonSchemas.id.required(),
    problem_id: commonSchemas.id.required(),
    user_id: commonSchemas.id,
    session_id: commonSchemas.id.required(),
    user_agent: Joi.string().max(1000),
    ip_address: Joi.string().ip(),
    metadata: commonSchemas.jsonObject,
  }),

  update: Joi.object({
    feedback: commonSchemas.jsonObject,
    metadata: commonSchemas.jsonObject,
  }).min(1),
};

// Схемы для параметров запроса
export const queryValidation = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().max(50),
    order: Joi.string().valid("asc", "desc").default("desc"),
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(255),
    device_id: commonSchemas.id,
    category: commonSchemas.category,
    status: commonSchemas.status,
    tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  }),

  filters: Joi.object({
    device_id: commonSchemas.id,
    status: commonSchemas.status,
    category: commonSchemas.category,
    is_active: commonSchemas.boolean,
    created_after: commonSchemas.timestamp,
    created_before: commonSchemas.timestamp,
  }),
};

// Основная функция валидации
export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    let dataToValidate;

    switch (source) {
      case "body":
        dataToValidate = req.body;
        break;
      case "params":
        dataToValidate = req.params;
        break;
      case "query":
        dataToValidate = req.query;
        break;
      default:
        dataToValidate = req.body;
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      console.warn(`⚠️  Ошибка валидации ${source}:`, validationErrors);

      return res.status(400).json({
        success: false,
        error: "Ошибка валидации данных",
        errorType: "VALIDATION_ERROR",
        details: validationErrors,
        timestamp: new Date().toISOString(),
      });
    }

    // Заменяем исходные данные на валидированные и ��чище��ные
    switch (source) {
      case "body":
        req.body = value;
        break;
      case "params":
        req.params = value;
        break;
      case "query":
        req.query = value;
        break;
    }

    next();
  };
};

// Экспорт вспомогательных функций
export const validateId = validateRequest(
  Joi.object({ id: commonSchemas.id }),
  "params",
);
export const validatePagination = validateRequest(
  queryValidation.pagination,
  "query",
);
export const validateSearch = validateRequest(queryValidation.search, "query");

export default validateRequest;
