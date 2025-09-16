import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
// Removed useData import - no longer using DataContext
import {
  Palette,
  MousePointer,
  Square,
  Circle,
  Triangle,
  Type,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Layers,
  Move,
  RotateCw,
  Copy,
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Crosshair,
  Settings,
  Play,
  Code,
  Image as ImageIcon,
} from "lucide-react";

interface SVGElement {
  id: string;
  type: "rect" | "circle" | "ellipse" | "polygon" | "path" | "text" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  r?: number;
  points?: string;
  d?: string;
  text?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
}

interface SVGProject {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  viewBox: string;
  elements: SVGElement[];
  remoteId?: string;
  deviceId?: string;
}

const SVGEditor = () => {
  // Mock functions for removed static functionality
  const remotes: any[] = [];
  const devices: any[] = [];
  const updateRemote = async (id: string, data: any) => {};

  const svgRef = useRef<SVGSVGElement>(null);
  const [project, setProject] = useState<SVGProject>({
    id: "new",
    name: "Новый проект",
    description: "",
    width: 400,
    height: 600,
    viewBox: "0 0 400 600",
    elements: [],
  });

  const [selectedElement, setSelectedElement] = useState<SVGElement | null>(
    null,
  );
  const [tool, setTool] = useState<
    "select" | "rect" | "circle" | "text" | "path"
  >("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<SVGElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [newElement, setNewElement] = useState<Partial<SVGElement>>({
    fill: "#4B5563",
    stroke: "#000000",
    strokeWidth: 1,
    opacity: 1,
    rotation: 0,
    visible: true,
    locked: false,
  });

  // Color presets
  const colorPresets = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#000080",
    "#008000",
  ];

  // Tools
  const tools = [
    { id: "select", icon: MousePointer, label: "Выбор" },
    { id: "rect", icon: Square, label: "Прямоугольник" },
    { id: "circle", icon: Circle, label: "Круг" },
    { id: "text", icon: Type, label: "Текст" },
    { id: "path", icon: Crosshair, label: "Контур" },
  ];

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  const addToHistory = (elements: SVGElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProject({ ...project, elements: [...history[historyIndex - 1]] });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProject({ ...project, elements: [...history[historyIndex + 1]] });
    }
  };

  const handleSVGClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (tool === "select") return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    let newSVGElement: SVGElement;

    switch (tool) {
      case "rect":
        newSVGElement = {
          id: generateId(),
          type: "rect",
          x,
          y,
          width: 80,
          height: 60,
          ...newElement,
        } as SVGElement;
        break;

      case "circle":
        newSVGElement = {
          id: generateId(),
          type: "circle",
          x,
          y,
          r: 30,
          ...newElement,
        } as SVGElement;
        break;

      case "text":
        newSVGElement = {
          id: generateId(),
          type: "text",
          x,
          y,
          text: "Текст",
          ...newElement,
        } as SVGElement;
        break;

      default:
        return;
    }

    const updatedElements = [...project.elements, newSVGElement];
    setProject({ ...project, elements: updatedElements });
    addToHistory(updatedElements);
    setSelectedElement(newSVGElement);
  };

  const handleElementClick = (element: SVGElement, event: React.MouseEvent) => {
    event.stopPropagation();
    if (tool === "select") {
      setSelectedElement(element);
    }
  };

  const updateSelectedElement = (updates: Partial<SVGElement>) => {
    if (!selectedElement) return;

    const updatedElements = project.elements.map((el) =>
      el.id === selectedElement.id ? { ...el, ...updates } : el,
    );

    const updatedElement = { ...selectedElement, ...updates };
    setProject({ ...project, elements: updatedElements });
    setSelectedElement(updatedElement);
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    const updatedElements = project.elements.filter(
      (el) => el.id !== selectedElement.id,
    );
    setProject({ ...project, elements: updatedElements });
    addToHistory(updatedElements);
    setSelectedElement(null);
  };

  const duplicateSelectedElement = () => {
    if (!selectedElement) return;

    const duplicate: SVGElement = {
      ...selectedElement,
      id: generateId(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };

    const updatedElements = [...project.elements, duplicate];
    setProject({ ...project, elements: updatedElements });
    addToHistory(updatedElements);
    setSelectedElement(duplicate);
  };

  const exportSVG = () => {
    const svgContent = generateSVGString();
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name}.svg`;
    link.click();
  };

  const generateSVGString = () => {
    return `<svg width="${project.width}" height="${project.height}" viewBox="${project.viewBox}" xmlns="http://www.w3.org/2000/svg">
      ${project.elements
        .filter((el) => el.visible)
        .map((element) => {
          const transform = element.rotation
            ? `transform="rotate(${element.rotation} ${element.x} ${element.y})"`
            : "";

          switch (element.type) {
            case "rect":
              return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" 
                    fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" 
                    opacity="${element.opacity}" ${transform} />`;

            case "circle":
              return `<circle cx="${element.x}" cy="${element.y}" r="${element.r}" 
                    fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" 
                    opacity="${element.opacity}" ${transform} />`;

            case "text":
              return `<text x="${element.x}" y="${element.y}" 
                    fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" 
                    opacity="${element.opacity}" ${transform}>${element.text}</text>`;

            default:
              return "";
          }
        })
        .join("\n")}
    </svg>`;
  };

  const saveToRemote = async () => {
    if (!project.remoteId) return;

    try {
      const svgData = generateSVGString();
      await updateRemote(project.remoteId, {
        svgData,
      });
      alert("SVG сохранен в пульт");
    } catch (error) {
      console.error("Error saving SVG to remote:", error);
      alert("Ошибка сохранения");
    }
  };

  return (
    <div className="h-screen flex">
      {/* Toolbar */}
      <div className="w-16 bg-gray-100 dark:bg-gray-800 border-r flex flex-col items-center py-4 space-y-2">
        {tools.map((toolItem) => {
          const Icon = toolItem.icon;
          return (
            <Button
              key={toolItem.id}
              variant={tool === toolItem.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool(toolItem.id as any)}
              className="w-10 h-10 p-0"
              title={toolItem.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}

        <div className="border-t border-gray-300 dark:border-gray-600 w-full my-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="w-10 h-10 p-0"
          title="Сетка"
        >
          <Grid className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="w-10 h-10 p-0"
          title="Предпросмотр"
        >
          {isPreviewMode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-12 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Input
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              className="w-48 h-8"
              placeholder="Название проекта"
            />
            <Badge variant="secondary">
              {project.elements.length} элементов
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>

            <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />

            <Button variant="outline" size="sm" onClick={exportSVG}>
              <Download className="h-4 w-4 mr-1" />
              Экспорт
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveToRemote}
              disabled={!project.remoteId}
            >
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto p-8">
          <div className="inline-block bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <svg
              ref={svgRef}
              width={project.width * zoom}
              height={project.height * zoom}
              viewBox={project.viewBox}
              className="border border-gray-300 dark:border-gray-600 cursor-crosshair"
              onClick={handleSVGClick}
            >
              {/* Grid */}
              {showGrid && (
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
              )}
              {showGrid && (
                <rect width="100%" height="100%" fill="url(#grid)" />
              )}

              {/* Elements */}
              {project.elements
                .filter((el) => el.visible || !isPreviewMode)
                .map((element) => {
                  const isSelected = selectedElement?.id === element.id;
                  const opacity = isPreviewMode
                    ? element.opacity
                    : element.opacity * 0.8;

                  const commonProps = {
                    key: element.id,
                    fill: element.fill,
                    stroke: isSelected ? "#3B82F6" : element.stroke,
                    strokeWidth: isSelected
                      ? element.strokeWidth + 1
                      : element.strokeWidth,
                    opacity,
                    transform: element.rotation
                      ? `rotate(${element.rotation} ${element.x} ${element.y})`
                      : undefined,
                    onClick: (e: React.MouseEvent) =>
                      handleElementClick(element, e),
                    className: "cursor-pointer",
                  };

                  switch (element.type) {
                    case "rect":
                      return (
                        <rect
                          {...commonProps}
                          x={element.x}
                          y={element.y}
                          width={element.width}
                          height={element.height}
                          rx={element.rx}
                          ry={element.ry}
                        />
                      );

                    case "circle":
                      return (
                        <circle
                          {...commonProps}
                          cx={element.x}
                          cy={element.y}
                          r={element.r}
                        />
                      );

                    case "text":
                      return (
                        <text
                          {...commonProps}
                          x={element.x}
                          y={element.y}
                          fontSize="14"
                          fontFamily="Arial"
                        >
                          {element.text}
                        </text>
                      );

                    default:
                      return null;
                  }
                })}
            </svg>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white dark:bg-gray-900 border-l overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Настройки проекта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="project-description">Описание</Label>
                <Textarea
                  id="project-description"
                  value={project.description}
                  onChange={(e) =>
                    setProject({ ...project, description: e.target.value })
                  }
                  placeholder="Описание проекта"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width">Ширина</Label>
                  <Input
                    id="width"
                    type="number"
                    value={project.width}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        width: parseInt(e.target.value) || 400,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="height">Высота</Label>
                  <Input
                    id="height"
                    type="number"
                    value={project.height}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        height: parseInt(e.target.value) || 600,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="remote-select">Привязать к пульту</Label>
                <Select
                  value={project.remoteId || ""}
                  onValueChange={(value) =>
                    setProject({ ...project, remoteId: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пульт" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без привязки</SelectItem>
                    {remotes.map((remote) => (
                      <SelectItem key={remote.id} value={remote.id}>
                        {remote.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Element Properties */}
          {selectedElement ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Свойства элемента
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={duplicateSelectedElement}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deleteSelectedElement}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="element-x">X</Label>
                    <Input
                      id="element-x"
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) =>
                        updateSelectedElement({
                          x: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="element-y">Y</Label>
                    <Input
                      id="element-y"
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) =>
                        updateSelectedElement({
                          y: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {(selectedElement.type === "rect" ||
                  selectedElement.type === "ellipse") && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="element-width">Ширина</Label>
                      <Input
                        id="element-width"
                        type="number"
                        value={selectedElement.width || 0}
                        onChange={(e) =>
                          updateSelectedElement({
                            width: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="element-height">Высота</Label>
                      <Input
                        id="element-height"
                        type="number"
                        value={selectedElement.height || 0}
                        onChange={(e) =>
                          updateSelectedElement({
                            height: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedElement.type === "circle" && (
                  <div>
                    <Label htmlFor="element-r">Радиус</Label>
                    <Input
                      id="element-r"
                      type="number"
                      value={selectedElement.r || 0}
                      onChange={(e) =>
                        updateSelectedElement({
                          r: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}

                {selectedElement.type === "text" && (
                  <div>
                    <Label htmlFor="element-text">Текст</Label>
                    <Input
                      id="element-text"
                      value={selectedElement.text || ""}
                      onChange={(e) =>
                        updateSelectedElement({ text: e.target.value })
                      }
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="element-fill">Заливка</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="element-fill"
                      type="color"
                      value={selectedElement.fill}
                      onChange={(e) =>
                        updateSelectedElement({ fill: e.target.value })
                      }
                      className="w-16 h-8 p-1"
                    />
                    <div className="flex flex-wrap gap-1">
                      {colorPresets.slice(0, 8).map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                          onClick={() => updateSelectedElement({ fill: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="element-stroke">Обводка</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="element-stroke"
                      type="color"
                      value={selectedElement.stroke}
                      onChange={(e) =>
                        updateSelectedElement({ stroke: e.target.value })
                      }
                      className="w-16 h-8 p-1"
                    />
                    <Input
                      type="number"
                      value={selectedElement.strokeWidth}
                      onChange={(e) =>
                        updateSelectedElement({
                          strokeWidth: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-16"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="element-opacity">Прозрачность</Label>
                  <Slider
                    value={[selectedElement.opacity * 100]}
                    onValueChange={([value]) =>
                      updateSelectedElement({ opacity: value / 100 })
                    }
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {Math.round(selectedElement.opacity * 100)}%
                  </div>
                </div>

                <div>
                  <Label htmlFor="element-rotation">Поворот</Label>
                  <Slider
                    value={[selectedElement.rotation]}
                    onValueChange={([value]) =>
                      updateSelectedElement({ rotation: value })
                    }
                    min={-180}
                    max={180}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {selectedElement.rotation}°
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={selectedElement.visible ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateSelectedElement({
                        visible: !selectedElement.visible,
                      })
                    }
                  >
                    {selectedElement.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant={selectedElement.locked ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateSelectedElement({ locked: !selectedElement.locked })
                    }
                  >
                    {selectedElement.locked
                      ? "Заблокировано"
                      : "Разблокировано"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MousePointer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Выберите элемент для редактирования его свойств
                </p>
              </CardContent>
            </Card>
          )}

          {/* Layers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                Слои
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {project.elements.map((element, index) => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                      selectedElement?.id === element.id
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    }`}
                    onClick={() => setSelectedElement(element)}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: element.fill }}
                      />
                      <span className="text-sm">
                        {element.type} {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSelectedElement({ visible: !element.visible });
                        }}
                      >
                        {element.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}

                {project.elements.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет элементов</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SVGEditor;
