import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
// Removed useData import - no longer using DataContext
import {
  GripVertical,
  Move,
  Copy,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Archive,
  Download,
  Upload,
  Filter,
  Search,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit,
  Plus,
  Minus,
  RotateCcw,
  Settings,
  Target,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DragItem {
  id: string;
  type: "device" | "problem" | "step" | "remote";
  title: string;
  description?: string;
  status?: string;
  deviceId?: string;
  problemId?: string;
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: any;
  action: (items: DragItem[]) => Promise<void>;
  requiresConfirmation: boolean;
  destructive?: boolean;
}

const DragDropManager = () => {
  // Mock data and functions for removed static functionality
  const devices: any[] = [];
  const problems: any[] = [];
  const steps: any[] = [];
  const remotes: any[] = [];
  const bulkUpdateDevices = async (deviceIds: string[], data: any) => {};
  const bulkDeleteProblems = async (problemIds: string[]) => {};
  const duplicateProblem = async (problemId: string) => {};
  const reorderSteps = async (problemId: string, stepIds: string[]) => {};
  const updateProblem = async (id: string, data: any) => {};
  const updateStep = async (id: string, data: any) => {};

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropZone, setDropZone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedBulkOperation, setSelectedBulkOperation] =
    useState<BulkOperation | null>(null);

  // Convert data to drag items
  const getDragItems = (): DragItem[] => {
    const items: DragItem[] = [];

    devices.forEach((device) => {
      items.push({
        id: device.id,
        type: "device",
        title: device.name,
        description: device.description,
        status: device.status,
      });
    });

    problems.forEach((problem) => {
      items.push({
        id: problem.id,
        type: "problem",
        title: problem.title,
        description: problem.description,
        status: problem.status,
        deviceId: problem.deviceId,
      });
    });

    steps.forEach((step) => {
      items.push({
        id: step.id,
        type: "step",
        title: step.title,
        description: step.description,
        status: step.isActive ? "active" : "inactive",
        deviceId: step.deviceId,
        problemId: step.problemId,
      });
    });

    remotes.forEach((remote) => {
      items.push({
        id: remote.id,
        type: "remote",
        title: remote.name,
        description: remote.description,
        status: remote.isActive ? "active" : "inactive",
        deviceId: remote.deviceId,
      });
    });

    return items;
  };

  const filteredItems = getDragItems()
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue = a.title;
      let bValue = b.title;

      if (sortBy === "type") {
        aValue = a.type;
        bValue = b.type;
      } else if (sortBy === "status") {
        aValue = a.status || "";
        bValue = b.status || "";
      }

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Bulk operations
  const bulkOperations: BulkOperation[] = [
    {
      id: "activate",
      name: "Активировать",
      description: "Активировать выбранные элементы",
      icon: CheckCircle,
      action: async (items) => {
        // Implementation for bulk activation
        console.log("Activating items:", items);
      },
      requiresConfirmation: false,
    },
    {
      id: "deactivate",
      name: "Деактивировать",
      description: "Деактивировать выбранные элементы",
      icon: EyeOff,
      action: async (items) => {
        // Implementation for bulk deactivation
        console.log("Deactivating items:", items);
      },
      requiresConfirmation: true,
    },
    {
      id: "duplicate",
      name: "Дублировать",
      description: "Создать копии выбранных элементов",
      icon: Copy,
      action: async (items) => {
        for (const item of items) {
          if (item.type === "problem") {
            await duplicateProblem(item.id);
          }
        }
      },
      requiresConfirmation: false,
    },
    {
      id: "archive",
      name: "Архивировать",
      description: "Перенести в архив",
      icon: Archive,
      action: async (items) => {
        // Implementation for archiving
        console.log("Archiving items:", items);
      },
      requiresConfirmation: true,
    },
    {
      id: "delete",
      name: "Удалить",
      description: "Удалить выбранные элементы",
      icon: Trash2,
      action: async (items) => {
        const problemIds = items
          .filter((item) => item.type === "problem")
          .map((item) => item.id);
        if (problemIds.length > 0) {
          await bulkDeleteProblems(problemIds);
        }
      },
      requiresConfirmation: true,
      destructive: true,
    },
  ];

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropZone(targetId);
  };

  const handleDragLeave = () => {
    setDropZone(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItem: DragItem) => {
    e.preventDefault();
    setDropZone(null);

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // Handle different drop scenarios
    if (
      draggedItem.type === "step" &&
      targetItem.type === "step" &&
      draggedItem.problemId === targetItem.problemId
    ) {
      // Reorder steps within the same problem
      const problemSteps = steps.filter(
        (s) => s.problemId === draggedItem.problemId,
      );
      const draggedStepIndex = problemSteps.findIndex(
        (s) => s.id === draggedItem.id,
      );
      const targetStepIndex = problemSteps.findIndex(
        (s) => s.id === targetItem.id,
      );

      if (draggedStepIndex !== -1 && targetStepIndex !== -1) {
        const newOrder = [...problemSteps];
        const [removed] = newOrder.splice(draggedStepIndex, 1);
        newOrder.splice(targetStepIndex, 0, removed);

        await reorderSteps(
          draggedItem.problemId!,
          newOrder.map((s) => s.id),
        );
      }
    } else if (draggedItem.type === "problem" && targetItem.type === "device") {
      // Move problem to different device
      await updateProblem(draggedItem.id, { deviceId: targetItem.id });
    } else if (draggedItem.type === "step" && targetItem.type === "problem") {
      // Move step to different problem
      await updateStep(draggedItem.id, { problemId: targetItem.id });
    }

    setDraggedItem(null);
  };

  // Selection handlers
  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedItems.length === 0) {
      alert("Выберите элементы для выполнения операции");
      return;
    }

    if (operation.requiresConfirmation) {
      const confirmed = confirm(
        `Вы уверены, что хотите ${operation.name.toLowerCase()} ${selectedItems.length} элементов?`,
      );
      if (!confirmed) return;
    }

    try {
      const selectedItemsData = filteredItems.filter((item) =>
        selectedItems.includes(item.id),
      );
      await operation.action(selectedItemsData);
      setSelectedItems([]);
      setIsBulkDialogOpen(false);
      alert(`${operation.name} выполнено успешно`);
    } catch (error) {
      console.error("Bulk operation failed:", error);
      alert("Ошибка выполнения операции: " + error);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "device":
        return "📱";
      case "problem":
        return "⚠️";
      case "step":
        return "🔧";
      case "remote":
        return "📺";
      default:
        return "📄";
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case "device":
        return "bg-blue-100 border-blue-300";
      case "problem":
        return "bg-orange-100 border-orange-300";
      case "step":
        return "bg-green-100 border-green-300";
      case "remote":
        return "bg-purple-100 border-purple-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление перетаскиванием
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Перетаскивайте элементы для изменения порядка и структуры
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSelectAll}>
            {selectedItems.length === filteredItems.length
              ? "Снять выделение"
              : "Выбрать все"}
          </Button>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedItems.length === 0}>
                <Settings className="h-4 w-4 mr-2" />
                Массовые операции ({selectedItems.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Массовые операции</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Выбрано элементов: {selectedItems.length}
                </p>
                <div className="space-y-2">
                  {bulkOperations.map((operation) => {
                    const Icon = operation.icon;
                    return (
                      <Button
                        key={operation.id}
                        variant={
                          operation.destructive ? "destructive" : "outline"
                        }
                        className="w-full justify-start"
                        onClick={() => handleBulkOperation(operation)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{operation.name}</div>
                          <div className="text-xs text-gray-500">
                            {operation.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск элементов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="device">Устройства</SelectItem>
                  <SelectItem value="problem">Проблемы</SelectItem>
                  <SelectItem value="step">Шаги</SelectItem>
                  <SelectItem value="remote">Пульты</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">По названию</SelectItem>
                  <SelectItem value="type">По типу</SelectItem>
                  <SelectItem value="status">По статусу</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag and Drop Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Элементы ({filteredItems.length})
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedItems.length} выбрано
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              const isDraggedOver = dropZone === item.id;
              const device = item.deviceId
                ? devices.find((d) => d.id === item.deviceId)
                : null;
              const problem = item.problemId
                ? problems.find((p) => p.id === item.problemId)
                : null;

              return (
                <div
                  key={item.id}
                  className={`
                    flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}
                    ${isDraggedOver ? "border-green-500 bg-green-50 dark:bg-green-900/20" : ""}
                    ${getItemColor(item.type)}
                    hover:shadow-md
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleItemSelect(item.id, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                  </div>

                  <div className="text-2xl">{getItemIcon(item.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.status && (
                        <Badge
                          variant={
                            item.status === "active" ||
                            item.status === "published"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {item.description}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      {device && (
                        <span className="flex items-center">
                          📱 {device.name}
                        </span>
                      )}
                      {problem && (
                        <span className="flex items-center">
                          ⚠️ {problem.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleItemSelect(item.id, !isSelected)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isSelected ? "Снять выделение" : "Выделить"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Дублировать
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Элементы не найдены
                </h3>
                <p>Попробуйте изменить фильтры поиска</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {devices.map((device) => (
          <Card
            key={device.id}
            className={`border-2 border-dashed transition-all ${
              dropZone === device.id
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-300 dark:border-gray-600"
            }`}
            onDragOver={(e) => handleDragOver(e, device.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) =>
              handleDrop(e, {
                id: device.id,
                type: "device",
                title: device.name,
              })
            }
          >
            <CardContent className="p-4 text-center">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${device.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
              >
                <span className="text-white text-xl">📱</span>
              </div>
              <div className="font-medium text-sm">{device.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {problems.filter((p) => p.deviceId === device.id).length}{" "}
                проблем
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Move className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Как использовать перетаскивание
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>
                  • Перетащите шаги для изменения их порядка в рамках одной
                  проблемы
                </li>
                <li>
                  • Перетащите проблемы на устройства для смены принадлежности
                </li>
                <li>• Выберите несколько элементов для массов��х операций</li>
                <li>
                  • Используйте фильтры для быстрого поиска нужных элементов
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DragDropManager;
