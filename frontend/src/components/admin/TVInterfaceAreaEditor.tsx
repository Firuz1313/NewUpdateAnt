import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MousePointer,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Undo,
  Target,
  Square,
  Circle,
  ImageIcon,
  Settings,
} from "lucide-react";
import { TVInterface } from "@/types/tvInterface";
import { cn } from "@/lib/utils";
import { tvInterfacesAPI } from "@/api/tvInterfaces";

interface ClickableArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action?: string;
  color?: string;
  shape: "rectangle" | "circle";
}

interface HighlightArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color?: string;
  opacity?: number;
  shape: "rectangle" | "circle";
}

interface TVInterfaceAreaEditorProps {
  tvInterface: TVInterface;
  onSave: (
    clickableAreas: ClickableArea[],
    highlightAreas: HighlightArea[],
  ) => void;
  className?: string;
}

const TVInterfaceAreaEditor: React.FC<TVInterfaceAreaEditorProps> = ({
  tvInterface,
  onSave,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingArea, setDrawingArea] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [clickableAreas, setClickableAreas] = useState<ClickableArea[]>(() => {
    const areas = tvInterface.clickableAreas || tvInterface.clickable_areas;
    return Array.isArray(areas) ? areas : [];
  });
  const [highlightAreas, setHighlightAreas] = useState<HighlightArea[]>(() => {
    const areas = tvInterface.highlightAreas || tvInterface.highlight_areas;
    return Array.isArray(areas) ? areas : [];
  });

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedAreaType, setSelectedAreaType] = useState<
    "clickable" | "highlight"
  >("clickable");
  const [showAreas, setShowAreas] = useState(true);
  const [currentTool, setCurrentTool] = useState<
    "select" | "rectangle" | "circle"
  >("select");

  const [newAreaData, setNewAreaData] = useState({
    label: "",
    action: "",
    color: "#3b82f6",
  });

  // Load screenshot image
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [tempScreenshot, setTempScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const screenshotSrc =
      tempScreenshot ||
      tvInterface.screenshotData ||
      tvInterface.screenshot_data;
    if (screenshotSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        // Set canvas size to match container while maintaining aspect ratio
        const container = containerRef.current;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const aspectRatio = img.width / img.height;

        let displayWidth = containerWidth;
        let displayHeight = displayWidth / aspectRatio;

        if (displayHeight > containerHeight) {
          displayHeight = containerHeight;
          displayWidth = displayHeight * aspectRatio;
        }

        canvas.width = displayWidth;
        canvas.height = displayHeight;

        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);

        // Draw the image
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

        // Draw existing areas
        drawAreas(ctx);
      };
      img.src = screenshotSrc;
    }
  }, [
    tempScreenshot,
    tvInterface.screenshotData,
    tvInterface.screenshot_data,
    clickableAreas,
    highlightAreas,
    showAreas,
  ]);

  const drawAreas = (ctx: CanvasRenderingContext2D) => {
    if (!showAreas || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scaleX = canvas.width / imageDimensions.width;
    const scaleY = canvas.height / imageDimensions.height;

    // Draw highlight areas
    highlightAreas.forEach((area) => {
      const x = area.x * scaleX;
      const y = area.y * scaleY;
      const width = area.width * scaleX;
      const height = area.height * scaleY;

      ctx.save();
      ctx.fillStyle = area.color || "#fbbf24";
      ctx.globalAlpha = area.opacity || 0.3;

      if (area.shape === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          2 * Math.PI,
        );
        ctx.fill();
      } else {
        ctx.fillRect(x, y, width, height);
      }

      ctx.restore();

      // Draw label
      ctx.fillStyle = area.color || "#fbbf24";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(area.label, x, y - 5);
    });

    // Draw clickable areas
    clickableAreas.forEach((area) => {
      const x = area.x * scaleX;
      const y = area.y * scaleY;
      const width = area.width * scaleX;
      const height = area.height * scaleY;

      ctx.strokeStyle = area.color || "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash(selectedAreaId === area.id ? [5, 5] : []);

      if (area.shape === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          2 * Math.PI,
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, width, height);
      }

      // Draw label
      ctx.fillStyle = area.color || "#3b82f6";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(area.label, x, y - 5);
    });

    // Draw current drawing area
    if (drawingArea && isDrawing) {
      const { startX, startY, currentX, currentY } = drawingArea;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      ctx.strokeStyle = newAreaData.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      if (currentTool === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          2 * Math.PI,
        );
        ctx.stroke();
      } else if (currentTool === "rectangle") {
        ctx.strokeRect(x, y, width, height);
      }
    }
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const convertToImageCoordinates = (canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const scaleX = imageDimensions.width / canvas.width;
    const scaleY = imageDimensions.height / canvas.height;

    return {
      x: Math.round(canvasX * scaleX),
      y: Math.round(canvasY * scaleY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === "select") return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawingArea({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingArea) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setDrawingArea((prev) =>
      prev
        ? {
            ...prev,
            currentX: coords.x,
            currentY: coords.y,
          }
        : null,
    );

    // Redraw canvas
    const screenshotSrc =
      tempScreenshot ||
      tvInterface.screenshotData ||
      tvInterface.screenshot_data;
    if (canvasRef.current && screenshotSrc) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height,
          );
          ctx.drawImage(
            img,
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height,
          );
          drawAreas(ctx);
        };
        img.src = screenshotSrc;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingArea || currentTool === "select") return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    // Convert to image coordinates
    const startImg = convertToImageCoordinates(
      drawingArea.startX,
      drawingArea.startY,
    );
    const endImg = convertToImageCoordinates(coords.x, coords.y);

    const x = Math.min(startImg.x, endImg.x);
    const y = Math.min(startImg.y, endImg.y);
    const width = Math.abs(endImg.x - startImg.x);
    const height = Math.abs(endImg.y - startImg.y);

    // Only create area if it has meaningful size
    if (width > 10 && height > 10) {
      const newArea = {
        id: `area-${Date.now()}`,
        x,
        y,
        width,
        height,
        label:
          newAreaData.label ||
          `Область ${selectedAreaType === "clickable" ? (Array.isArray(clickableAreas) ? clickableAreas.length + 1 : 1) : Array.isArray(highlightAreas) ? highlightAreas.length + 1 : 1}`,
        color: newAreaData.color,
        shape: currentTool as "rectangle" | "circle",
      };

      if (selectedAreaType === "clickable") {
        const clickableArea: ClickableArea = {
          ...newArea,
          action: newAreaData.action,
        };
        setClickableAreas((prev) => [...prev, clickableArea]);
      } else {
        const highlightArea: HighlightArea = {
          ...newArea,
          opacity: 0.3,
        };
        setHighlightAreas((prev) => [...prev, highlightArea]);
      }
    }

    setIsDrawing(false);
    setDrawingArea(null);
  };

  const handleDeleteArea = (
    areaId: string,
    type: "clickable" | "highlight",
  ) => {
    if (type === "clickable") {
      setClickableAreas((prev) => prev.filter((area) => area.id !== areaId));
    } else {
      setHighlightAreas((prev) => prev.filter((area) => area.id !== areaId));
    }

    if (selectedAreaId === areaId) {
      setSelectedAreaId(null);
    }
  };

  const handleSave = () => {
    onSave(clickableAreas, highlightAreas);
  };

  const handleScreenshotUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setTempScreenshot(result);
          // Автоматически сохраняем загруженный скриншот
          handleSaveScreenshot(result);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Ошибка загрузки скриншота:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveScreenshot = async (screenshotData: string) => {
    try {
      // Обновляем интерфейс через API
      await tvInterfacesAPI.update(tvInterface.id, {
        screenshotData,
      });

      // Обновляем локальное состояние
      Object.assign(tvInterface, {
        screenshotData,
        screenshot_data: screenshotData,
      });
      setImageLoaded(false); // Перезагружаем изображение
    } catch (error) {
      console.error("Ошибка сохранения скриншота:", error);
    }
  };

  const createTestScreenshot = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Заливаем фон
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 800, 600);

    // Рисуем заголовок
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Главное меню", 400, 80);

    // Рисуем псевдо-элементы интерфейса
    const items = [
      { x: 100, y: 150, text: "Каналы", color: "#3b82f6" },
      { x: 300, y: 150, text: "Настройки", color: "#10b981" },
      { x: 500, y: 150, text: "Приложения", color: "#f59e0b" },
      { x: 100, y: 320, text: "Фильмы", color: "#ef4444" },
      { x: 300, y: 320, text: "Музыка", color: "#8b5cf6" },
      { x: 500, y: 320, text: "Игры", color: "#06b6d4" },
    ];

    items.forEach((item) => {
      // Рису��м блок
      ctx.fillStyle = item.color;
      ctx.fillRect(item.x, item.y, 150, 120);

      // Рамка
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x, item.y, 150, 120);

      // Текст
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.text, item.x + 75, item.y + 70);
    });

    // Добавляем время в углу
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "right";
    const now = new Date();
    ctx.fillText(now.toLocaleTimeString(), 780, 30);

    return canvas.toDataURL("image/png");
  };

  // Debug information
  console.log("TV Interface Data:", {
    id: tvInterface.id,
    name: tvInterface.name,
    screenshotData: tvInterface.screenshotData ? "present" : "missing",
    screenshot_data: tvInterface.screenshot_data ? "present" : "missing",
    tempScreenshot: tempScreenshot ? "present" : "missing",
    clickableAreas: {
      type: typeof tvInterface.clickableAreas,
      isArray: Array.isArray(tvInterface.clickableAreas),
      value: tvInterface.clickableAreas,
    },
    clickable_areas: {
      type: typeof tvInterface.clickable_areas,
      isArray: Array.isArray(tvInterface.clickable_areas),
      value: tvInterface.clickable_areas,
    },
    highlightAreas: {
      type: typeof tvInterface.highlightAreas,
      isArray: Array.isArray(tvInterface.highlightAreas),
      value: tvInterface.highlightAreas,
    },
    highlight_areas: {
      type: typeof tvInterface.highlight_areas,
      isArray: Array.isArray(tvInterface.highlight_areas),
      value: tvInterface.highlight_areas,
    },
  });

  if (
    !tvInterface.screenshotData &&
    !tvInterface.screenshot_data &&
    !tempScreenshot
  ) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              Нет скриншота для редактирования областей
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Загрузите скриншот интерфейса, чтобы начать работу с областями
            </p>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Отладка:</strong> Интерфейс "{tvInterface.name}" (ID:{" "}
                {tvInterface.id})
                <br />
                screenshotData: {tvInterface.screenshotData ? "✓" : "✗"}
                <br />
                screenshot_data: {tvInterface.screenshot_data ? "✓" : "✗"}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleScreenshotUpload(file);
                }
              }}
              className="hidden"
              id="screenshot-upload"
              disabled={isUploading}
            />
            <Button asChild variant="outline" disabled={isUploading}>
              <label htmlFor="screenshot-upload" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? "Загружается..." : "Загрузить скриншот"}
              </label>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const testScreenshot = createTestScreenshot();
                if (testScreenshot) {
                  handleSaveScreenshot(testScreenshot);
                }
              }}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Создать тестовый скри��шот
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // Переходим в TV Interface Builder для добавления скриншота
                window.open(
                  `/admin/tv-interface-builder?edit=${tvInterface.id}`,
                  "_blank",
                );
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Редактировать в TV Builder
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Поддерживаются форматы: JPG, PNG, GIF
              <br />
              Или добавьте скриншот через TV Interface Builder
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Редактор областей интерфейса
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Tool Selection */}
            <div className="flex gap-2">
              <Button
                variant={currentTool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("select")}
              >
                <MousePointer className="h-4 w-4 mr-1" />
                Выбор
              </Button>
              <Button
                variant={currentTool === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("rectangle")}
              >
                <Square className="h-4 w-4 mr-1" />
                Прямоугольник
              </Button>
              <Button
                variant={currentTool === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("circle")}
              >
                <Circle className="h-4 w-4 mr-1" />
                Круг
              </Button>
            </div>

            {/* Area Type */}
            <div className="flex gap-2">
              <Badge
                variant={
                  selectedAreaType === "clickable" ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => setSelectedAreaType("clickable")}
              >
                Кликабельные области
              </Badge>
              <Badge
                variant={
                  selectedAreaType === "highlight" ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => setSelectedAreaType("highlight")}
              >
                Подсветка областей
              </Badge>
            </div>

            {/* Area Data */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Название области"
                value={newAreaData.label}
                onChange={(e) =>
                  setNewAreaData((prev) => ({ ...prev, label: e.target.value }))
                }
                className="w-32"
              />
              {selectedAreaType === "clickable" && (
                <Input
                  placeholder="Действие"
                  value={newAreaData.action}
                  onChange={(e) =>
                    setNewAreaData((prev) => ({
                      ...prev,
                      action: e.target.value,
                    }))
                  }
                  className="w-32"
                />
              )}
              <input
                type="color"
                value={newAreaData.color}
                onChange={(e) =>
                  setNewAreaData((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-8 h-8 rounded border"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAreas(!showAreas)}
              >
                {showAreas ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Сохранить области
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Canvas */}
      <Card>
        <CardContent className="p-4">
          <div
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
          >
            {imageLoaded && (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="absolute inset-0 cursor-crosshair"
                style={{
                  cursor: currentTool === "select" ? "default" : "crosshair",
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Areas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clickable Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Клик��бел��ные области (
              {Array.isArray(clickableAreas) ? clickableAreas.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.isArray(clickableAreas) &&
                clickableAreas.map((area) => (
                  <div
                    key={area.id}
                    className={cn(
                      "flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded",
                      selectedAreaId === area.id && "ring-2 ring-blue-500",
                    )}
                    onClick={() => setSelectedAreaId(area.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{area.label}</div>
                      <div className="text-xs text-gray-500">
                        {area.action && `Действие: ${area.action}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {area.x}, {area.y} • {area.width}×{area.height}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArea(area.id, "clickable");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              {(!Array.isArray(clickableAreas) ||
                clickableAreas.length === 0) && (
                <div className="text-center text-gray-500 py-4">
                  Нет ���ликабельных областей
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Highlight Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Области подсветки (
              {Array.isArray(highlightAreas) ? highlightAreas.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.isArray(highlightAreas) &&
                highlightAreas.map((area) => (
                  <div
                    key={area.id}
                    className={cn(
                      "flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded",
                      selectedAreaId === area.id && "ring-2 ring-blue-500",
                    )}
                    onClick={() => setSelectedAreaId(area.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{area.label}</div>
                      <div className="text-xs text-gray-400">
                        {area.x}, {area.y} • {area.width}×{area.height}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArea(area.id, "highlight");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              {(!Array.isArray(highlightAreas) ||
                highlightAreas.length === 0) && (
                <div className="text-center text-gray-500 py-4">
                  Нет областей подсветки
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TVInterfaceAreaEditor;
