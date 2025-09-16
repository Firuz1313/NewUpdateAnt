import Device from '../models/Device.js';
import { deviceValidation, validateRequest } from '../middleware/validateRequest.js';

const deviceModel = new Device();

/**
 * Контроллер для управления устройствами
 */
class DeviceController {
  /**
   * Получение списка устройств
   * GET /api/v1/devices
   */
  async getDevices(req, res, next) {
    try {
      const { 
        search, 
        status, 
        is_active, 
        page = 1, 
        limit = 20, 
        sort = 'order_index', 
        order = 'asc',
        include_stats = false,
        admin = false
      } = req.query;

      const filters = {};
      if (search) filters.search = search;
      if (status) filters.status = status;
      if (is_active !== undefined) filters.is_active = is_active === 'true';

      const options = {
        limit: Math.min(parseInt(limit), 100),
        offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 100),
        sortBy: sort,
        sortOrder: order.toUpperCase()
      };

      let devices;
      if (admin === 'true') {
        // Для админ панели - расширенная информация
        devices = await deviceModel.getForAdmin(filters, options);
      } else if (include_stats === 'true') {
        // С статистикой
        devices = await deviceModel.findAllWithStats(filters, options);
      } else {
        // Обычный список
        devices = await deviceModel.findAll(filters, options);
      }

      // Подсчет общего количества для пагинации
      const total = await deviceModel.count(filters);
      const totalPages = Math.ceil(total / options.limit);

      res.json({
        success: true,
        data: devices,
        pagination: {
          page: parseInt(page),
          limit: options.limit,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение устройства по ID
   * GET /api/v1/devices/:id
   */
  async getDeviceById(req, res, next) {
    try {
      const { id } = req.params;
      const { include_stats = false } = req.query;

      let device;
      if (include_stats === 'true') {
        device = await deviceModel.findByIdWithStats(id);
      } else {
        device = await deviceModel.findById(id);
      }

      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Устройство не найдено',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: device,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создание нового устройства
   * POST /api/v1/devices
   */
  async createDevice(req, res, next) {
    try {
      const deviceData = req.body;

      // Проверяем уникальность названия для активных устройств
      const existingDevice = await deviceModel.findOne({
        name: deviceData.name,
        is_active: true
      });

      if (existingDevice) {
        return res.status(409).json({
          success: false,
          error: 'Устройство с таким названием уже существует',
          errorType: 'DUPLICATE_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const newDevice = await deviceModel.create(deviceData);

      res.status(201).json({
        success: true,
        data: newDevice,
        message: 'Устройство успешно создано',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление устройства
   * PUT /api/v1/devices/:id
   */
  async updateDevice(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Проверяем существование устройства
      const existingDevice = await deviceModel.findById(id);
      if (!existingDevice) {
        return res.status(404).json({
          success: false,
          error: 'Устройство не найдено',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Проверяем уникальность названия при изменении
      if (updateData.name && updateData.name !== existingDevice.name) {
        const duplicateDevice = await deviceModel.findOne({
          name: updateData.name,
          is_active: true
        });

        if (duplicateDevice && duplicateDevice.id !== id) {
          return res.status(409).json({
            success: false,
            error: 'Устройство с таким названием уже существует',
            errorType: 'DUPLICATE_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      }

      const updatedDevice = await deviceModel.updateById(id, updateData);

      res.json({
        success: true,
        data: updatedDevice,
        message: 'Устройство успешно обновлено',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление устройства
   * DELETE /api/v1/devices/:id
   */
  async deleteDevice(req, res, next) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      // Проверяем существование устройства
      const existingDevice = await deviceModel.findById(id);
      if (!existingDevice) {
        return res.status(404).json({
          success: false,
          error: 'Устройство не найдено',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Проверяем возможность удаления
      const deleteCheck = await deviceModel.canDelete(id);
      if (!deleteCheck.canDelete && force !== 'true') {
        return res.status(409).json({
          success: false,
          error: deleteCheck.reason,
          errorType: 'CONSTRAINT_ERROR',
          suggestion: deleteCheck.suggestion,
          canForceDelete: false, // В данном случае не разрешаем принудительное удаление
          timestamp: new Date().toISOString()
        });
      }

      let deletedDevice;
      if (force === 'true') {
        // Жесткое удаление (осторожно!)
        deletedDevice = await deviceModel.delete(id);
      } else {
        // Мягкое удаление
        deletedDevice = await deviceModel.softDelete(id);
      }

      res.json({
        success: true,
        data: deletedDevice,
        message: force === 'true' ? 'Устройство удалено безвозвратно' : 'Устройство архивировано',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Восстановление архивированного устройства
   * POST /api/v1/devices/:id/restore
   */
  async restoreDevice(req, res, next) {
    try {
      const { id } = req.params;

      const restoredDevice = await deviceModel.restore(id);
      if (!restoredDevice) {
        return res.status(404).json({
          success: false,
          error: 'Устройство не найдено или уже активно',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: restoredDevice,
        message: 'Устройство успешно восстановлено',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Поиск устройств
   * GET /api/v1/devices/search
   */
  async searchDevices(req, res, next) {
    try {
      const { q: searchTerm, limit = 20, offset = 0 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Поисковый запрос должен содержать минимум 2 символа',
          errorType: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const devices = await deviceModel.search(searchTerm.trim(), {
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: devices,
        query: searchTerm.trim(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение популярных устройств
   * GET /api/v1/devices/popular
   */
  async getPopularDevices(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const devices = await deviceModel.getPopular(Math.min(parseInt(limit), 20));

      res.json({
        success: true,
        data: devices,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление порядка устройств
   * PUT /api/v1/devices/reorder
   */
  async reorderDevices(req, res, next) {
    try {
      const { deviceIds } = req.body;

      if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Необходимо предоставить массив ID устройств',
          errorType: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const updatedDevices = await deviceModel.updateOrder(deviceIds);

      res.json({
        success: true,
        data: updatedDevices,
        message: 'Порядок устройств обновлен',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики устройств
   * GET /api/v1/devices/stats
   */
  async getDeviceStats(req, res, next) {
    try {
      const stats = await deviceModel.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Массовое обновление устройств
   * PUT /api/v1/devices/bulk
   */
  async bulkUpdateDevices(req, res, next) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Необходимо предоставить массив обновлений',
          errorType: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      // Валидация каждого обновления
      for (const update of updates) {
        if (!update.id || !update.data) {
          return res.status(400).json({
            success: false,
            error: 'Каждое обновление должно содержать id и data',
            errorType: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      }

      const updatedDevices = await deviceModel.bulkUpdate(updates);

      res.json({
        success: true,
        data: updatedDevices,
        message: `Обновлено устройств: ${updatedDevices.length}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Экспорт устройств
   * GET /api/v1/devices/export
   */
  async exportDevices(req, res, next) {
    try {
      const { format = 'json', include_problems = false } = req.query;

      const devices = await deviceModel.findAll({ is_active: true });

      let exportData = devices;

      if (include_problems === 'true') {
        // Здесь можно добавить логику включения проблем
        // Для этого понадобится импорт Problem модели
      }

      if (format === 'json') {
        res.json({
          success: true,
          data: exportData,
          meta: {
            exportedAt: new Date().toISOString(),
            totalRecords: exportData.length,
            format: 'json'
          }
        });
      } else {
        // Другие форматы можно добавить позже (CSV, XML и т.д.)
        res.status(400).json({
          success: false,
          error: 'Неподдерживаемый формат экспорта',
          supportedFormats: ['json'],
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

// Создаем экземпляр контроллера
const deviceController = new DeviceController();

// Применяем валидацию к методам
const validateDeviceCreation = validateRequest(deviceValidation.create);
const validateDeviceUpdate = validateRequest(deviceValidation.update);

// Экспортируем методы с примененной валидацией
export const getDevices = deviceController.getDevices.bind(deviceController);
export const getDeviceById = deviceController.getDeviceById.bind(deviceController);
export const createDevice = [validateDeviceCreation, deviceController.createDevice.bind(deviceController)];
export const updateDevice = [validateDeviceUpdate, deviceController.updateDevice.bind(deviceController)];
export const deleteDevice = deviceController.deleteDevice.bind(deviceController);
export const restoreDevice = deviceController.restoreDevice.bind(deviceController);
export const searchDevices = deviceController.searchDevices.bind(deviceController);
export const getPopularDevices = deviceController.getPopularDevices.bind(deviceController);
export const reorderDevices = deviceController.reorderDevices.bind(deviceController);
export const getDeviceStats = deviceController.getDeviceStats.bind(deviceController);
export const bulkUpdateDevices = deviceController.bulkUpdateDevices.bind(deviceController);
export const exportDevices = deviceController.exportDevices.bind(deviceController);

export default deviceController;
