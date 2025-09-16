import TVInterfaceMarkSimplified from "../models/TVInterfaceMarkSimplified.js";
import { v4 as uuidv4 } from "uuid";

const tvInterfaceMarkModel = new TVInterfaceMarkSimplified();

// Получить все отметки для TV интерфейса
export const getMarksByTVInterfaceId = async (req, res) => {
  try {
    const { tvInterfaceId } = req.params;

    if (!tvInterfaceId) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const options = {
      is_active:
        req.query.is_active !== undefined
          ? req.query.is_active === "true"
          : undefined,
      is_visible:
        req.query.is_visible !== undefined
          ? req.query.is_visible === "true"
          : undefined,
      mark_type: req.query.mark_type,
      step_id: req.query.step_id,
    };

    // Убираем undefined значения
    Object.keys(options).forEach(
      (key) => options[key] === undefined && delete options[key],
    );

    const marks = await tvInterfaceMarkModel.getByTVInterfaceId(
      tvInterfaceId,
      options,
    );

    res.json({
      success: true,
      data: marks,
      message: "Отметки TV интерфейса успешно получены",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getMarksByTVInterfaceId:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении отметок TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Получить отметки для шага
export const getMarksByStepId = async (req, res) => {
  try {
    const { stepId } = req.params;

    if (!stepId) {
      return res.status(400).json({
        success: false,
        error: "ID шага обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const marks = await tvInterfaceMarkModel.getByStepId(stepId);

    res.json({
      success: true,
      data: marks,
      message: "Отметки шага успешно получены",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getMarksByStepId:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении отметок шага",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Получить отметку по ID
export const getMarkById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID отметки обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const mark = await tvInterfaceMarkModel.getById(id);

    if (!mark) {
      return res.status(404).json({
        success: false,
        error: "Отметка не найдена",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: mark,
      message: "Отметка успешно получена",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getMarkById:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении отметки",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Создать новую отметку
export const createMark = async (req, res) => {
  try {
    const {
      tv_interface_id,
      step_id,
      name,
      description,
      mark_type,
      shape,
      position,
      size,
      coordinates,
      color,
      background_color,
      border_color,
      border_width,
      opacity,
      is_clickable,
      is_highlightable,
      click_action,
      hover_action,
      action_value,
      action_description,
      expected_result,
      hint_text,
      tooltip_text,
      warning_text,
      animation,
      animation_duration,
      animation_delay,
      display_order,
      priority,
      metadata,
      tags,
    } = req.body;

    // Валидация
    if (!tv_interface_id) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Назв��ние отметки обязательно",
        timestamp: new Date().toISOString(),
      });
    }

    if (!position || typeof position !== "object") {
      return res.status(400).json({
        success: false,
        error: "Позиция отметки обязательна",
        timestamp: new Date().toISOString(),
      });
    }

    const markData = {
      id: uuidv4(),
      tv_interface_id,
      step_id,
      name: name.trim(),
      description: description?.trim() || "",
      mark_type: mark_type || "point",
      shape: shape || "circle",
      position,
      size,
      coordinates,
      color,
      background_color,
      border_color,
      border_width,
      opacity,
      is_clickable,
      is_highlightable,
      click_action,
      hover_action,
      action_value,
      action_description,
      expected_result,
      hint_text,
      tooltip_text,
      warning_text,
      animation,
      animation_duration,
      animation_delay,
      display_order,
      priority,
      metadata,
      tags,
    };

    const mark = await tvInterfaceMarkModel.create(markData);

    res.status(201).json({
      success: true,
      data: mark,
      message: "Отметка успешно создана",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in createMark:", error);

    if (
      error.message.includes("не найден") ||
      error.message.includes("обязательно")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка при создании отметки",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Обновить отметку
export const updateMark = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID отметки обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const mark = await tvInterfaceMarkModel.update(id, updateData);

    res.json({
      success: true,
      data: mark,
      message: "Отметка успешно обновлена",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in updateMark:", error);

    if (error.message.includes("не найдена")) {
      return res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка при обновлении отметки",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Удалить отметку
export const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID отметки обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    // Проверяем существование
    const existing = await tvInterfaceMarkModel.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Отметка не найдена",
        timestamp: new Date().toISOString(),
      });
    }

    await tvInterfaceMarkModel.delete(id);

    res.json({
      success: true,
      message: "Отметка успешно удалена",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in deleteMark:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при удалении отметки",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Удалить все отметки TV интерфейса
export const deleteMarksByTVInterfaceId = async (req, res) => {
  try {
    const { tvInterfaceId } = req.params;

    if (!tvInterfaceId) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const deletedCount =
      await tvInterfaceMarkModel.deleteByTVInterfaceId(tvInterfaceId);

    res.json({
      success: true,
      data: { deleted_count: deletedCount },
      message: `Удалено отметок: ${deletedCount}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in deleteMarksByTVInterfaceId:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при удалении отметок TV интерфейса",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Удалить все отметки шага
export const deleteMarksByStepId = async (req, res) => {
  try {
    const { stepId } = req.params;

    if (!stepId) {
      return res.status(400).json({
        success: false,
        error: "ID шага обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    const deletedCount = await tvInterfaceMarkModel.deleteByStepId(stepId);

    res.json({
      success: true,
      data: { deleted_count: deletedCount },
      message: `Удалено отметок: ${deletedCount}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in deleteMarksByStepId:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при удалении отметок шага",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Изменить порядок отметок
export const reorderMarks = async (req, res) => {
  try {
    const { tvInterfaceId } = req.params;
    const { mark_ids } = req.body;

    if (!tvInterfaceId) {
      return res.status(400).json({
        success: false,
        error: "ID TV интерфейса обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    if (!Array.isArray(mark_ids)) {
      return res.status(400).json({
        success: false,
        error: "Массив ID отметок обязателен",
        timestamp: new Date().toISOString(),
      });
    }

    await tvInterfaceMarkModel.reorder(tvInterfaceId, mark_ids);

    res.json({
      success: true,
      message: "Порядок отметок успешно обновлен",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in reorderMarks:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при изменении порядка отметок",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Получить статистику отметок
export const getMarksStats = async (req, res) => {
  try {
    const stats = await tvInterfaceMarkModel.getStats();

    res.json({
      success: true,
      data: stats,
      message: "Статистика отметок успешно получена",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getMarksStats:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении статистики отметок",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default {
  getMarksByTVInterfaceId,
  getMarksByStepId,
  getMarkById,
  createMark,
  updateMark,
  deleteMark,
  deleteMarksByTVInterfaceId,
  deleteMarksByStepId,
  reorderMarks,
  getMarksStats,
};
