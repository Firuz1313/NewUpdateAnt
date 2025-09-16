// TV Interface Types для работы с бэкендом

// Тип интерфейса
export type TVInterfaceType =
  | "home"
  | "settings"
  | "channels"
  | "apps"
  | "guide"
  | "no-signal"
  | "error"
  | "custom";

// Кликабельная област��
export interface ClickableArea {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  shape: "rectangle" | "circle" | "polygon";
  action: string;
  coordinates?: number[]; // для polygon shapes
}

// Область подсветки
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

// Основной интерфейс TV Interface
export interface TVInterface {
  id: string;
  name: string;
  description: string;
  type: TVInterfaceType;
  deviceId: string; // Переименован для консистентности с фронтендом
  device_id: string; // Поле из бэкенда
  deviceName?: string; // Для отображения (приходит из бэкенда как device_name)
  device_name?: string; // Поле из бэкенда
  device_brand?: string; // Поле из бэкенда
  device_model?: string; // Поле из бэкенда
  screenshotUrl?: string; // screenshot_url из бэкенда
  screenshot_url?: string; // Поле из бэкенда
  screenshotData?: string; // screenshot_data из бэкенда
  screenshot_data?: string; // Поле из бэкенда
  clickableAreas: ClickableArea[]; // clickable_areas из бэкенда
  clickable_areas?: ClickableArea[]; // Поле из бэкенда
  highlightAreas: HighlightArea[]; // highlight_areas из бэкенда
  highlight_areas?: HighlightArea[]; // Поле из бэкенда
  isActive: boolean; // is_active из бэкенда
  is_active?: boolean; // Поле из бэкенда
  createdAt: string; // created_at из бэкенда
  created_at?: string; // Поле из бэкенда
  updatedAt: string; // updated_at из бэкенда
  updated_at?: string; // Поле из бэкенда
}

// Данные для создания TV Interface
export interface CreateTVInterfaceData {
  name: string;
  description?: string;
  type: TVInterfaceType;
  deviceId: string;
  screenshotUrl?: string;
  screenshotData?: string;
  clickableAreas?: ClickableArea[];
  highlightAreas?: HighlightArea[];
}

// Данные для обновления TV Interface
export interface UpdateTVInterfaceData extends Partial<CreateTVInterfaceData> {
  isActive?: boolean;
}

// Фильтры для поиска TV Interface
export interface TVInterfaceFilters {
  deviceId?: string;
  device_id?: string;
  type?: TVInterfaceType;
  isActive?: boolean;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// API Response types для TV Interface
export interface TVInterfaceApiResponse {
  success: boolean;
  data?: TVInterface;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface TVInterfaceListResponse {
  success: boolean;
  data?: TVInterface[];
  error?: string;
  message?: string;
  timestamp?: string;
}

// Статистика TV Interface
export interface TVInterfaceStats {
  total: number;
  active: number;
  inactive: number;
  devices_with_interfaces: number;
}

// Экспорт данных TV Interface
export interface TVInterfaceExportData {
  name: string;
  description: string;
  type: TVInterfaceType;
  device_info: {
    name: string;
    brand: string;
    model: string;
  };
  screenshot_data?: string;
  clickable_areas: ClickableArea[];
  highlight_areas: HighlightArea[];
  exported_at: string;
  version: string;
}

// Опции интерфейса для селекта
export interface TVInterfaceTypeOption {
  value: TVInterfaceType;
  label: string;
  description: string;
}

// Константы для типов интерфейсов
export const TV_INTERFACE_TYPES: TVInterfaceTypeOption[] = [
  {
    value: "home",
    label: "Домашний экран",
    description: "Главный экран приставки с приложениями",
  },
  {
    value: "settings",
    label: "Настройки",
    description: "Экран настроек системы",
  },
  {
    value: "channels",
    label: "Каналы",
    description: "Список телевизионных каналов",
  },
  {
    value: "apps",
    label: "Приложения",
    description: "Магазин или список приложений",
  },
  {
    value: "guide",
    label: "Телегид",
    description: "Программа телепередач",
  },
  {
    value: "no-signal",
    label: "Нет сигнала",
    description: "Экран отсутствия сигнала",
  },
  {
    value: "error",
    label: "Ошибка",
    description: "Экран ошибки системы",
  },
  {
    value: "custom",
    label: "Пользовательский",
    description: "Кастомный интерфейс",
  },
];

// Утилиты для работы с TV Interface
export const tvInterfaceUtils = {
  // Нормализация данных с бэкенда
  normalizeFromBackend: (backendData: any): TVInterface => {
    return {
      id: backendData.id,
      name: backendData.name,
      description: backendData.description || "",
      type: backendData.type,
      deviceId: backendData.deviceId || backendData.device_id, // Поддержка обоих форматов
      device_id: backendData.device_id || backendData.deviceId, // Поддержка обоих форматов
      deviceName: backendData.deviceName || backendData.device_name,
      device_name: backendData.device_name || backendData.deviceName,
      device_brand: backendData.device_brand,
      device_model: backendData.device_model,
      screenshotUrl: backendData.screenshotUrl || backendData.screenshot_url,
      screenshot_url: backendData.screenshot_url || backendData.screenshotUrl,
      screenshotData: backendData.screenshotData || backendData.screenshot_data,
      screenshot_data:
        backendData.screenshot_data || backendData.screenshotData,
      clickableAreas: Array.isArray(backendData.clickable_areas)
        ? backendData.clickable_areas
        : [],
      clickable_areas: Array.isArray(backendData.clickable_areas)
        ? backendData.clickable_areas
        : [],
      highlightAreas: Array.isArray(backendData.highlight_areas)
        ? backendData.highlight_areas
        : [],
      highlight_areas: Array.isArray(backendData.highlight_areas)
        ? backendData.highlight_areas
        : [],
      isActive:
        backendData.isActive !== false && backendData.is_active !== false,
      is_active:
        backendData.is_active !== false && backendData.isActive !== false,
      createdAt: backendData.createdAt || backendData.created_at,
      created_at: backendData.created_at || backendData.createdAt,
      updatedAt: backendData.updatedAt || backendData.updated_at,
      updated_at: backendData.updated_at || backendData.updatedAt,
    };
  },

  // Получение названия типа интерфейса
  getTypeLabel: (type: TVInterfaceType): string => {
    const typeOption = TV_INTERFACE_TYPES.find((t) => t.value === type);
    return typeOption?.label || type;
  },

  // Получение описания типа интерфейса
  getTypeDescription: (type: TVInterfaceType): string => {
    const typeOption = TV_INTERFACE_TYPES.find((t) => t.value === type);
    return typeOption?.description || "";
  },

  // Проверка наличия скриншота
  hasScreenshot: (tvInterface: TVInterface): boolean => {
    // Для списочного представления проверяем has_screenshot_data (оптимизация)
    if ((tvInterface as any).has_screenshot_data !== undefined) {
      return !!(tvInterface as any).has_screenshot_data;
    }
    // Для детального представления проверяем actual data
    return !!(
      tvInterface.screenshotData ||
      tvInterface.screenshot_data ||
      tvInterface.screenshotUrl ||
      tvInterface.screenshot_url
    );
  },

  // Получение URL скриншота
  getScreenshotUrl: (tvInterface: TVInterface): string | null => {
    return (
      tvInterface.screenshotData ||
      tvInterface.screenshot_data ||
      tvInterface.screenshotUrl ||
      tvInterface.screenshot_url ||
      null
    );
  },

  // Проверка активности интерфейса
  isActive: (tvInterface: TVInterface): boolean => {
    return tvInterface.isActive !== false && tvInterface.is_active !== false;
  },
};
