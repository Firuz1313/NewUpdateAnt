// Core entity interfaces with proper relationships
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Device extends BaseEntity {
  name: string;
  brand: string;
  model: string;
  description: string;
  imageUrl?: string;
  logoUrl?: string;
  color: string;
  order: number;
  status: "active" | "inactive" | "maintenance";
  metadata?: Record<string, any>;
}

export interface Problem extends BaseEntity {
  deviceId: string;
  title: string;
  description: string;
  category: "critical" | "moderate" | "minor" | "other";
  icon: string;
  color: string;
  tags: string[];
  priority: number;
  estimatedTime: number; // in minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: number;
  completedCount: number;
  status: "draft" | "published" | "archived";
  metadata?: Record<string, any>;
}

export interface Step extends BaseEntity {
  problemId: string;
  deviceId: string;
  stepNumber: number;
  title: string;
  description: string;
  instruction: string;
  estimatedTime: number; // in seconds

  // Visual elements
  highlightRemoteButton?: string;
  highlightTVArea?: string;
  // ID выбранного TV интерфейса для шага (используется на странице диагностики)
  tvInterfaceId?: string;
  // Опционально: детальные данные интерфейса, если загружены отдельным запросом
  tvInterface?: TVInterface;

  // Interactive elements
  remoteId?: string;
  actionType?: StepActionType;
  buttonPosition?: { x: number; y: number };
  // Координаты области на экране ТВ, актуальны для выбранного интерфейса
  tvAreaPosition?: { x: number; y: number };
  // Прямоугольная область выделения на экране ТВ (в координатах 800x450)
  tvAreaRect?: { x: number; y: number; width: number; height: number };
  svgPath?: string;
  zoneId?: string;

  // Logic and validation
  requiredAction?: string;
  validationRules?: ValidationRule[];
  successCondition?: string;
  failureActions?: FailureAction[];

  // Content
  hint?: string;
  warningText?: string;
  successText?: string;
  media?: MediaContent[];

  // Branching logic
  nextStepConditions?: NextStepCondition[];

  metadata?: Record<string, any>;
}

export interface Remote extends BaseEntity {
  deviceId?: string; // Can be universal if null
  name: string;
  manufacturer: string;
  model: string;
  description: string;
  layout: "standard" | "compact" | "smart" | "custom";
  colorScheme: string;

  // Visual representation
  imageUrl?: string;
  imageData?: string; // base64
  svgData?: string;
  dimensions: { width: number; height: number };

  // Button definitions
  buttons: RemoteButton[];
  zones: RemoteZone[];

  // Usage and preferences
  isDefault: boolean;
  usageCount: number;
  lastUsed?: string;

  metadata?: Record<string, any>;
}

export interface RemoteButton {
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  shape: "rectangle" | "circle" | "rounded" | "custom";
  color: string;
  textColor: string;
  fontSize: number;
  action: string;
  svgPath?: string;
  zoneId?: string;
  isVisible: boolean;
}

export interface RemoteZone {
  id: string;
  name: string;
  description?: string;
  path: string; // SVG path
  color: string;
  opacity: number;
  action?: string;
  isClickable: boolean;
}

// TV Interface types - новые типы для конструктора интерфейса ТВ
export interface TVInterface extends BaseEntity {
  name: string;
  description: string;
  deviceId: string;
  deviceName?: string; // Для отображения
  screenshotUrl?: string;
  screenshotData?: string; // base64 encoded image
}

export interface ClickableArea {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  shape: "rectangle" | "circle" | "polygon";
  action: string;
  coordinates?: number[]; // for polygon shapes
}

export interface HighlightArea {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  opacity: number;
  animation?: "pulse" | "glow" | "blink" | "none";
  duration?: number;
}

export interface StepAction extends BaseEntity {
  stepId: string;
  type: StepActionType;
  name: string;
  description: string;

  // Visual representation
  svgPath?: string;
  iconUrl?: string;
  color: string;
  animation?: AnimationType;

  // Interaction data
  targetElement?: string;
  coordinates?: { x: number; y: number };
  gesture?: GestureType;

  // Validation
  expectedResult?: string;
  timeout?: number;
  retryCount?: number;

  metadata?: Record<string, any>;
}

// Type definitions
export type StepActionType =
  | "button_press"
  | "navigation"
  | "wait"
  | "check"
  | "input"
  | "selection"
  | "confirmation"
  | "custom";

export type AnimationType =
  | "pulse"
  | "glow"
  | "bounce"
  | "shake"
  | "fade"
  | "highlight"
  | "none";

export type GestureType =
  | "click"
  | "double_click"
  | "long_press"
  | "swipe_left"
  | "swipe_right"
  | "swipe_up"
  | "swipe_down";

export interface ValidationRule {
  type: "required" | "pattern" | "custom";
  value?: string | RegExp;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FailureAction {
  condition: string;
  action: "retry" | "skip" | "restart" | "abort" | "branch";
  target?: string;
  message?: string;
}

export interface NextStepCondition {
  condition: string;
  nextStepId: string;
  probability?: number;
}

export interface MediaContent {
  type: "image" | "video" | "audio" | "gif";
  url: string;
  alt?: string;
  position: "above" | "below" | "inline" | "overlay";
  size?: { width: number; height: number };
}

// Analytics and logging
export interface DiagnosticSession extends BaseEntity {
  deviceId: string;
  problemId: string;
  userId?: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  completedSteps: number;
  totalSteps: number;
  success: boolean;
  duration: number; // in seconds
  errorSteps: string[];
  feedback?: UserFeedback;
  metadata?: Record<string, any>;
}

export interface UserFeedback {
  rating: number; // 1-5
  comment?: string;
  helpfulSteps: string[];
  difficultSteps: string[];
  suggestions?: string;
}

export interface ChangeLog extends BaseEntity {
  entityType: "device" | "problem" | "step" | "remote" | "tv_interface";
  entityId: string;
  action: "create" | "update" | "delete" | "publish" | "archive";
  changes: Record<string, { old: any; new: any }>;
  userId: string;
  userRole: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  version: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and search types
export interface FilterOptions {
  deviceId?: string;
  category?: string;
  status?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchResults<T> {
  results: T[];
  total: number;
  query: string;
  filters: FilterOptions;
  suggestions: string[];
}

// Import/Export types
export interface ExportOptions {
  format: "json" | "csv" | "xlsx" | "xml";
  entities: ("devices" | "problems" | "steps" | "remotes" | "tv_interfaces")[];
  filters?: FilterOptions;
  includeMetadata: boolean;
  includeMedia: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  createdIds: string[];
  updatedIds: string[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value: any;
}

// Settings and configuration
export interface SiteSettings extends BaseEntity {
  siteName: string;
  siteDescription: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  theme: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;

  // Features
  enableAnalytics: boolean;
  enableFeedback: boolean;
  enableOfflineMode: boolean;
  enableNotifications: boolean;

  // Limits and quotas
  maxStepsPerProblem: number;
  maxMediaSize: number; // in MB
  sessionTimeout: number; // in minutes

  // Advanced settings
  apiSettings: APISettings;
  emailSettings: EmailSettings;
  storageSettings: StorageSettings;

  metadata?: Record<string, any>;
}

export interface APISettings {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimiting: boolean;
  caching: boolean;
  compression: boolean;
}

export interface EmailSettings {
  enabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface StorageSettings {
  provider: "local" | "s3" | "cloudinary" | "azure";
  maxFileSize: number;
  allowedFormats: string[];
  compression: boolean;
  cdnUrl?: string;
}

// Экспорт типов для TV Interface
export type {
  TVInterface,
  ClickableArea,
  HighlightArea
} from './tvInterface';
