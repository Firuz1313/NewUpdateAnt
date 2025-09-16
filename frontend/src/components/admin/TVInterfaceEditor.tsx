import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crosshair,
  Square,
  Circle,
  Polygon,
  Target,
  MousePointer,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  MoreVertical,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Layers,
  Settings,
  Info,
  Plus,
  Move,
} from "lucide-react";

// Types for TV Interface Marks
interface TVInterfaceMark {
  id: string;
  tv_interface_id: string;
  step_id?: string;
  name: string;
  description: string;
  mark_type: "point" | "zone" | "area";
  shape: "circle" | "rectangle" | "polygon" | "ellipse";
  position: { x: number; y: number };
  size?: { width: number; height: number };
  coordinates?: { x: number; y: number }[];
  color: string;
  background_color?: string;
  border_color?: string;
  border_width: number;
  opacity: number;
  is_clickable: boolean;
  is_highlightable: boolean;
  click_action?: string;
  hover_action?: string;
  action_value?: string;
  action_description?: string;
  expected_result?: string;
  hint_text?: string;
  tooltip_text?: string;
  warning_text?: string;
  animation?: "pulse" | "glow" | "bounce" | "shake" | "fade" | "blink" | "none";
  animation_duration?: number;
  animation_delay?: number;
  display_order: number;
  priority: "low" | "normal" | "high" | "critical";
  is_active: boolean;
  is_visible: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface TVInterfaceEditorProps {
  tvInterfaceId: string;
  stepId?: string;
  imageUrl: string;
  imageData?: string;
  initialMarks?: TVInterfaceMark[];
  onMarksChange?: (marks: TVInterfaceMark[]) => void;
  onSave?: (marks: TVInterfaceMark[]) => void;
  readonly?: boolean;
  showControls?: boolean;
  className?: string;
}

const TVInterfaceEditor: React.FC<TVInterfaceEditorProps> = ({
  tvInterfaceId,
  stepId,
  imageUrl,
  imageData,
  initialMarks = [],
  onMarksChange,
  onSave,
  readonly = false,
  showControls = true,
  className = "",
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Editor state
  const [marks, setMarks] = useState<TVInterfaceMark[]>(initialMarks);
  const [selectedMark, setSelectedMark] = useState<TVInterfaceMark | null>(
    null,
  );
  const [editingMark, setEditingMark] = useState<TVInterfaceMark | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Tool state
  const [activeTool, setActiveTool] = useState<
    "select" | "point" | "rectangle" | "circle" | "polygon"
  >("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number }[]>([]);

  // Canvas state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Form state for editing marks
  const [markForm, setMarkForm] = useState({
    name: "",
    description: "",
    mark_type: "point" as "point" | "zone" | "area",
    shape: "circle" as "circle" | "rectangle" | "polygon" | "ellipse",
    color: "#3b82f6",
    background_color: "rgba(59, 130, 246, 0.2)",
    border_color: "#3b82f6",
    border_width: 2,
    opacity: 0.8,
    is_clickable: true,
    is_highlightable: true,
    click_action: "",
    hover_action: "",
    action_value: "",
    action_description: "",
    expected_result: "",
    hint_text: "",
    tooltip_text: "",
    warning_text: "",
    animation: "none" as
      | "pulse"
      | "glow"
      | "bounce"
      | "shake"
      | "fade"
      | "blink"
      | "none",
    animation_duration: 1000,
    animation_delay: 0,
    priority: "normal" as "low" | "normal" | "high" | "critical",
  });

  // Load image and initialize canvas
  useEffect(() => {
    const loadImage = () => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const src = imageData || imageUrl;
      if (!src) return;

      img.onload = () => {
        setImageLoaded(true);
        setCanvasSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        redrawCanvas();
      };

      img.src = src;
    };

    loadImage();
  }, [imageUrl, imageData]);

  // Redraw canvas when marks or state changes
  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [marks, selectedMark, scale, offset, imageLoaded, tempPoints]);

  // Notify parent of marks changes
  useEffect(() => {
    onMarksChange?.(marks);
  }, [marks, onMarksChange]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width * scale;
    canvas.height = canvasSize.height * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transformations
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    // Draw image
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);

    // Draw marks
    marks
      .filter((mark) => mark.is_visible)
      .forEach((mark) => {
        drawMark(ctx, mark, mark.id === selectedMark?.id);
      });

    // Draw temporary shapes while drawing
    if (isDrawing && drawingStart && activeTool !== "select") {
      drawTemporaryShape(ctx);
    }

    // Draw polygon temp points
    if (activeTool === "polygon" && tempPoints.length > 0) {
      drawPolygonPreview(ctx);
    }

    // Restore context
    ctx.restore();
  }, [
    marks,
    selectedMark,
    scale,
    offset,
    imageLoaded,
    canvasSize,
    isDrawing,
    drawingStart,
    tempPoints,
    activeTool,
  ]);

  const drawMark = (
    ctx: CanvasRenderingContext2D,
    mark: TVInterfaceMark,
    isSelected: boolean,
  ) => {
    ctx.save();

    // Set styles
    ctx.fillStyle = mark.background_color || "rgba(59, 130, 246, 0.2)";
    ctx.strokeStyle = isSelected ? "#ef4444" : mark.border_color || mark.color;
    ctx.lineWidth = isSelected ? mark.border_width + 2 : mark.border_width;
    ctx.globalAlpha = mark.opacity;

    const pos = mark.position;
    const size = mark.size || { width: 20, height: 20 };

    // Draw based on shape
    switch (mark.shape) {
      case "circle":
      case "ellipse":
        ctx.beginPath();
        if (mark.shape === "circle") {
          const radius = Math.max(size.width, size.height) / 2;
          ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        } else {
          ctx.ellipse(
            pos.x,
            pos.y,
            size.width / 2,
            size.height / 2,
            0,
            0,
            Math.PI * 2,
          );
        }
        ctx.fill();
        ctx.stroke();
        break;

      case "rectangle":
        ctx.fillRect(
          pos.x - size.width / 2,
          pos.y - size.height / 2,
          size.width,
          size.height,
        );
        ctx.strokeRect(
          pos.x - size.width / 2,
          pos.y - size.height / 2,
          size.width,
          size.height,
        );
        break;

      case "polygon":
        if (mark.coordinates && mark.coordinates.length > 2) {
          ctx.beginPath();
          ctx.moveTo(mark.coordinates[0].x, mark.coordinates[0].y);
          mark.coordinates.slice(1).forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;
    }

    // Draw selection handles
    if (isSelected && !readonly) {
      drawSelectionHandles(ctx, mark);
    }

    // Draw label
    if (mark.name) {
      drawMarkLabel(ctx, mark, isSelected);
    }

    ctx.restore();
  };

  const drawSelectionHandles = (
    ctx: CanvasRenderingContext2D,
    mark: TVInterfaceMark,
  ) => {
    ctx.save();
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;

    const handleSize = 3 / scale; // Scale handles inversely to zoom (reduced from 6 to match diagnostic page)

    if (mark.shape === "rectangle") {
      const pos = mark.position;
      const size = mark.size || { width: 20, height: 20 };
      const handles = [
        { x: pos.x - size.width / 2, y: pos.y - size.height / 2 }, // top-left
        { x: pos.x + size.width / 2, y: pos.y - size.height / 2 }, // top-right
        { x: pos.x + size.width / 2, y: pos.y + size.height / 2 }, // bottom-right
        { x: pos.x - size.width / 2, y: pos.y + size.height / 2 }, // bottom-left
      ];

      handles.forEach((handle) => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize,
        );
        ctx.strokeRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize,
        );
      });
    } else if (mark.shape === "polygon" && mark.coordinates) {
      mark.coordinates.forEach((point) => {
        ctx.fillRect(
          point.x - handleSize / 2,
          point.y - handleSize / 2,
          handleSize,
          handleSize,
        );
        ctx.strokeRect(
          point.x - handleSize / 2,
          point.y - handleSize / 2,
          handleSize,
          handleSize,
        );
      });
    } else {
      // Circle/ellipse - draw center handle
      const pos = mark.position;
      ctx.fillRect(
        pos.x - handleSize / 2,
        pos.y - handleSize / 2,
        handleSize,
        handleSize,
      );
      ctx.strokeRect(
        pos.x - handleSize / 2,
        pos.y - handleSize / 2,
        handleSize,
        handleSize,
      );
    }

    ctx.restore();
  };

  const drawMarkLabel = (
    ctx: CanvasRenderingContext2D,
    mark: TVInterfaceMark,
    isSelected: boolean,
  ) => {
    ctx.save();

    const fontSize = 12 / scale; // Scale font inversely to zoom
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isSelected ? "#ef4444" : "#1f2937";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 / scale;

    const pos = mark.position;
    const textY = pos.y - (mark.size?.height || 20) / 2 - 5 / scale;

    // Draw text outline
    ctx.strokeText(mark.name, pos.x, textY);
    // Draw text fill
    ctx.fillText(mark.name, pos.x, textY);

    ctx.restore();
  };

  const drawTemporaryShape = (ctx: CanvasRenderingContext2D) => {
    if (!drawingStart) return;

    ctx.save();
    ctx.strokeStyle = "#3b82f6";
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Get current mouse position (this would be passed from mouse events)
    // For now, we'll use a placeholder
    const currentPos = { x: drawingStart.x + 50, y: drawingStart.y + 50 };

    switch (activeTool) {
      case "rectangle":
        const width = currentPos.x - drawingStart.x;
        const height = currentPos.y - drawingStart.y;
        ctx.fillRect(drawingStart.x, drawingStart.y, width, height);
        ctx.strokeRect(drawingStart.x, drawingStart.y, width, height);
        break;

      case "circle":
        const radius = Math.sqrt(
          Math.pow(currentPos.x - drawingStart.x, 2) +
            Math.pow(currentPos.y - drawingStart.y, 2),
        );
        ctx.beginPath();
        ctx.arc(drawingStart.x, drawingStart.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();
  };

  const drawPolygonPreview = (ctx: CanvasRenderingContext2D) => {
    if (tempPoints.length < 2) return;

    ctx.save();
    ctx.strokeStyle = "#3b82f6";
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
    tempPoints.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    if (tempPoints.length > 2) {
      ctx.fill();
    }
    ctx.stroke();

    // Draw points
    ctx.setLineDash([]);
    ctx.fillStyle = "#3b82f6";
    tempPoints.forEach((point) => {
      ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
    });

    ctx.restore();
  };

  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale - offset.x;
    const y = (event.clientY - rect.top) / scale - offset.y;

    return { x, y };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readonly) return;

    const coords = getCanvasCoordinates(event);

    switch (activeTool) {
      case "select":
        handleSelectClick(coords);
        break;
      case "point":
        handlePointClick(coords);
        break;
      case "polygon":
        handlePolygonClick(coords);
        break;
    }
  };

  const handleCanvasMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (readonly) return;

    const coords = getCanvasCoordinates(event);

    if (activeTool === "rectangle" || activeTool === "circle") {
      setIsDrawing(true);
      setDrawingStart(coords);
    }
  };

  const handleCanvasMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readonly || !isDrawing || !drawingStart) return;

    const coords = getCanvasCoordinates(event);

    if (activeTool === "rectangle") {
      handleRectangleComplete(drawingStart, coords);
    } else if (activeTool === "circle") {
      handleCircleComplete(drawingStart, coords);
    }

    setIsDrawing(false);
    setDrawingStart(null);
  };

  const handleSelectClick = (coords: { x: number; y: number }) => {
    // Find clicked mark
    const clickedMark = marks.find((mark) => isPointInMark(coords, mark));
    setSelectedMark(clickedMark || null);
  };

  const handlePointClick = (coords: { x: number; y: number }) => {
    createMark({
      mark_type: "point",
      shape: "circle",
      position: coords,
      size: { width: 20, height: 20 },
    });
  };

  const handlePolygonClick = (coords: { x: number; y: number }) => {
    // Double click to complete polygon
    if (event && (event as any).detail === 2) {
      if (tempPoints.length >= 3) {
        createMark({
          mark_type: "zone",
          shape: "polygon",
          position: { x: coords.x, y: coords.y },
          coordinates: [...tempPoints],
        });
      }
      setTempPoints([]);
    } else {
      setTempPoints((prev) => [...prev, coords]);
    }
  };

  const handleRectangleComplete = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;

    if (width > 5 && height > 5) {
      // Minimum size check
      createMark({
        mark_type: "zone",
        shape: "rectangle",
        position: { x: centerX, y: centerY },
        size: { width, height },
      });
    }
  };

  const handleCircleComplete = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const radius = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
    );

    if (radius > 5) {
      // Minimum radius check
      createMark({
        mark_type: "zone",
        shape: "circle",
        position: start,
        size: { width: radius * 2, height: radius * 2 },
      });
    }
  };

  const isPointInMark = (
    point: { x: number; y: number },
    mark: TVInterfaceMark,
  ): boolean => {
    const pos = mark.position;
    const size = mark.size || { width: 20, height: 20 };

    switch (mark.shape) {
      case "circle":
        const radius = Math.max(size.width, size.height) / 2;
        const distance = Math.sqrt(
          Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2),
        );
        return distance <= radius;

      case "rectangle":
        return (
          point.x >= pos.x - size.width / 2 &&
          point.x <= pos.x + size.width / 2 &&
          point.y >= pos.y - size.height / 2 &&
          point.y <= pos.y + size.height / 2
        );

      case "polygon":
        if (!mark.coordinates || mark.coordinates.length < 3) return false;
        // Point-in-polygon algorithm
        let inside = false;
        const coords = mark.coordinates;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          if (
            coords[i].y > point.y !== coords[j].y > point.y &&
            point.x <
              ((coords[j].x - coords[i].x) * (point.y - coords[i].y)) /
                (coords[j].y - coords[i].y) +
                coords[i].x
          ) {
            inside = !inside;
          }
        }
        return inside;

      default:
        return false;
    }
  };

  const createMark = (partialMark: Partial<TVInterfaceMark>) => {
    const newMark: TVInterfaceMark = {
      id: `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tv_interface_id: tvInterfaceId,
      step_id: stepId,
      name: `Mark ${marks.length + 1}`,
      description: "",
      mark_type: "point",
      shape: "circle",
      position: { x: 0, y: 0 },
      color: "#3b82f6",
      background_color: "rgba(59, 130, 246, 0.2)",
      border_color: "#3b82f6",
      border_width: 2,
      opacity: 0.8,
      is_clickable: true,
      is_highlightable: true,
      display_order: marks.length,
      priority: "normal",
      is_active: true,
      is_visible: true,
      animation_duration: 1000,
      animation_delay: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...partialMark,
    };

    setMarks((prev) => [...prev, newMark]);
    setSelectedMark(newMark);
    setActiveTool("select");

    toast({
      title: "Отметка создана",
      description: `Создана новая отметка "${newMark.name}"`,
    });
  };

  const updateMark = (markId: string, updates: Partial<TVInterfaceMark>) => {
    setMarks((prev) =>
      prev.map((mark) =>
        mark.id === markId
          ? { ...mark, ...updates, updated_at: new Date().toISOString() }
          : mark,
      ),
    );

    if (selectedMark?.id === markId) {
      setSelectedMark((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteMark = (markId: string) => {
    setMarks((prev) => prev.filter((mark) => mark.id !== markId));
    if (selectedMark?.id === markId) {
      setSelectedMark(null);
    }

    toast({
      title: "Отметка удалена",
      description: "Отметка была успешно удалена",
    });
  };

  const openEditDialog = (mark: TVInterfaceMark) => {
    setEditingMark(mark);
    setMarkForm({
      name: mark.name,
      description: mark.description,
      mark_type: mark.mark_type,
      shape: mark.shape,
      color: mark.color,
      background_color: mark.background_color || "rgba(59, 130, 246, 0.2)",
      border_color: mark.border_color || mark.color,
      border_width: mark.border_width,
      opacity: mark.opacity,
      is_clickable: mark.is_clickable,
      is_highlightable: mark.is_highlightable,
      click_action: mark.click_action || "",
      hover_action: mark.hover_action || "",
      action_value: mark.action_value || "",
      action_description: mark.action_description || "",
      expected_result: mark.expected_result || "",
      hint_text: mark.hint_text || "",
      tooltip_text: mark.tooltip_text || "",
      warning_text: mark.warning_text || "",
      animation: mark.animation || "none",
      animation_duration: mark.animation_duration || 1000,
      animation_delay: mark.animation_delay || 0,
      priority: mark.priority,
    });
    setIsEditDialogOpen(true);
  };

  const saveMarkEdit = () => {
    if (!editingMark) return;

    updateMark(editingMark.id, {
      ...markForm,
      updated_at: new Date().toISOString(),
    });

    setIsEditDialogOpen(false);
    setEditingMark(null);

    toast({
      title: "Отметка обновлена",
      description: `Отметка "${markForm.name}" была успешно обновлена`,
    });
  };

  const handleSave = () => {
    onSave?.(marks);
    toast({
      title: "Изменения сохранены",
      description: `Сохранено ${marks.length} отметок`,
    });
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.1));
  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className={`tv-interface-editor ${className}`}>
      {/* Hidden image element for loading */}
      <img ref={imageRef} style={{ display: "none" }} alt="TV Interface" />

      {/* Toolbar */}
      {showControls && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              TV Interface Editor
              {marks.length > 0 && (
                <Badge variant="secondary">{marks.length} отметок</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tools */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  size="sm"
                  variant={activeTool === "select" ? "default" : "ghost"}
                  onClick={() => setActiveTool("select")}
                  disabled={readonly}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === "point" ? "default" : "ghost"}
                  onClick={() => setActiveTool("point")}
                  disabled={readonly}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === "rectangle" ? "default" : "ghost"}
                  onClick={() => setActiveTool("rectangle")}
                  disabled={readonly}
                >
                  <Square className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === "circle" ? "default" : "ghost"}
                  onClick={() => setActiveTool("circle")}
                  disabled={readonly}
                >
                  <Circle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === "polygon" ? "default" : "ghost"}
                  onClick={() => setActiveTool("polygon")}
                  disabled={readonly}
                >
                  <Polygon className="h-4 w-4" />
                </Button>
              </div>

              {/* View controls */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button size="sm" variant="ghost" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm font-mono">
                  {Math.round(scale * 100)}%
                </span>
                <Button size="sm" variant="ghost" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleResetView}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              {!readonly && (
                <div className="flex items-center gap-1">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Сохранить
                  </Button>
                </div>
              )}

              {/* Selected mark info */}
              {selectedMark && (
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline">{selectedMark.name}</Badge>
                  {!readonly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(selectedMark)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateMark(selectedMark.id, {
                              is_visible: !selectedMark.is_visible,
                            })
                          }
                        >
                          {selectedMark.is_visible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Скрыть
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Показать
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMark(selectedMark.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-900"
        style={{ height: "600px" }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          style={{
            display: imageLoaded ? "block" : "none",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />

        {!imageLoaded && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Загрузка изображения...</p>
            </div>
          </div>
        )}
      </div>

      {/* Marks List */}
      {showControls && marks.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Отметки ({marks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {marks.map((mark) => (
                <div
                  key={mark.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMark?.id === mark.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMark(mark)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: mark.color }}
                      />
                      <span className="font-medium truncate">{mark.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {mark.mark_type}
                      </Badge>
                      {!mark.is_visible && (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {mark.description && (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {mark.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{mark.shape}</span>
                    <span>
                      ({Math.round(mark.position.x)},{" "}
                      {Math.round(mark.position.y)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Mark Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать отметку</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="mark-name">Название</Label>
                <Input
                  id="mark-name"
                  value={markForm.name}
                  onChange={(e) =>
                    setMarkForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Название отметки"
                />
              </div>

              <div>
                <Label htmlFor="mark-description">Описание</Label>
                <Textarea
                  id="mark-description"
                  value={markForm.description}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Описание отметки"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Тип</Label>
                  <Select
                    value={markForm.mark_type}
                    onValueChange={(value: "point" | "zone" | "area") =>
                      setMarkForm((prev) => ({ ...prev, mark_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="point">Точка</SelectItem>
                      <SelectItem value="zone">Зона</SelectItem>
                      <SelectItem value="area">Область</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Приоритет</Label>
                  <Select
                    value={markForm.priority}
                    onValueChange={(
                      value: "low" | "normal" | "high" | "critical",
                    ) => setMarkForm((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="normal">Обычный</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions & Hints */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="action-value">Значение действия</Label>
                <Input
                  id="action-value"
                  value={markForm.action_value}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      action_value: e.target.value,
                    }))
                  }
                  placeholder="Значение или данные действия"
                />
              </div>

              <div>
                <Label htmlFor="action-description">Описание действия</Label>
                <Textarea
                  id="action-description"
                  value={markForm.action_description}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      action_description: e.target.value,
                    }))
                  }
                  placeholder="Что должен сделать пользователь"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="hint-text">Подсказка</Label>
                <Textarea
                  id="hint-text"
                  value={markForm.hint_text}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      hint_text: e.target.value,
                    }))
                  }
                  placeholder="Подсказка для пользователя"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="expected-result">Ожидаемый результат</Label>
                <Input
                  id="expected-result"
                  value={markForm.expected_result}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      expected_result: e.target.value,
                    }))
                  }
                  placeholder="Что должно произойти"
                />
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Внешний вид</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="mark-color">Цвет</Label>
                <Input
                  id="mark-color"
                  type="color"
                  value={markForm.color}
                  onChange={(e) =>
                    setMarkForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="border-width">Толщина границы</Label>
                <Input
                  id="border-width"
                  type="number"
                  min="1"
                  max="10"
                  value={markForm.border_width}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      border_width: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="opacity">Прозрачность</Label>
                <Input
                  id="opacity"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={markForm.opacity}
                  onChange={(e) =>
                    setMarkForm((prev) => ({
                      ...prev,
                      opacity: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <Label>Анимация</Label>
                <Select
                  value={markForm.animation}
                  onValueChange={(value: any) =>
                    setMarkForm((prev) => ({ ...prev, animation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Нет</SelectItem>
                    <SelectItem value="pulse">Пульсация</SelectItem>
                    <SelectItem value="glow">Свечение</SelectItem>
                    <SelectItem value="bounce">Подпрыгивание</SelectItem>
                    <SelectItem value="shake">Тряска</SelectItem>
                    <SelectItem value="fade">Затухание</SelectItem>
                    <SelectItem value="blink">Мигание</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={saveMarkEdit}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TVInterfaceEditor;
