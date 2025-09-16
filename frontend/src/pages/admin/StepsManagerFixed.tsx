import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Move,
  Search,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreVertical,
  Layers,
  PlayCircle,
  MousePointer,
  Target,
  Palette,
  ImageIcon,
  Save,
  Tv,
  EyeOff,
  Monitor,
  Settings,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useDevices } from "@/hooks/useDevices";
import { useProblems } from "@/hooks/useProblems";
import { tvInterfacesAPI } from "@/api/tvInterfaces";
import { TVInterface, tvInterfaceUtils } from "@/types/tvInterface";
import { stepsApi, remotesApi } from "@/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DiagnosticStep {
  id: string;
  problemId: string;
  deviceId: string;
  stepNumber: number;
  title: string;
  description: string;
  instruction: string;
  highlightRemoteButton?: string;
  highlightTVArea?: string;
  tvInterface?: "home" | "settings" | "channels" | "no-signal";
  tvInterfaceId?: string;
  requiredAction?: string;
  hint?: string;
  remoteId?: string;
  buttonPosition?: { x: number; y: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Memoized form component to prevent recreation and maintain input focus
const StepFormFields = React.memo<{
  isEdit: boolean;
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  onDeviceChange: (value: string) => void;
  devices: any[];
  problems: any[];
  remotes: any[];
  tvInterfaces: any[];
  loadingTVInterfaces: boolean;
  onTVInterfaceEditor: (tvInterface: any) => void;
  onRemoteEditor: () => void;
}>(
  ({
    isEdit,
    formData,
    onFieldChange,
    onDeviceChange,
    devices,
    problems,
    remotes,
    tvInterfaces,
    loadingTVInterfaces,
    onTVInterfaceEditor,
    onRemoteEditor,
  }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Preserve scroll position during re-renders
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (container && scrollPosition > 0) {
        container.scrollTop = scrollPosition;
      }
    });

    // Save scroll position before any potential re-render
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollPosition(e.currentTarget.scrollTop);
    }, []);

    // Memoized computed values to prevent recalculation
    const activeDevices = useMemo(
      () => devices.filter((d: any) => d.isActive !== false),
      [devices],
    );

    const availableProblems = useMemo(() => {
      if (formData.deviceId) {
        return problems.filter((p: any) => p.deviceId === formData.deviceId);
      }
      return problems.filter((p) => p.status === "published");
    }, [problems, formData.deviceId]);

    const availableRemotes = useMemo(() => {
      if (formData.deviceId) {
        return remotes.filter((r: any) => r.deviceId === formData.deviceId);
      }
      return remotes.filter((r: any) => r.isActive !== false);
    }, [remotes, formData.deviceId]);

    // Stable input change handlers to prevent re-creation
    const handleTitleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFieldChange("title", e.target.value);
      },
      [onFieldChange],
    );

    const handleDescriptionChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onFieldChange("description", e.target.value);
      },
      [onFieldChange],
    );

    const handleInstructionChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onFieldChange("instruction", e.target.value);
      },
      [onFieldChange],
    );

    const handleHintChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onFieldChange("hint", e.target.value);
      },
      [onFieldChange],
    );

    const handleTVInterfaceChange = useCallback(
      (value: string) => {
        onFieldChange("tvInterfaceId", value);
      },
      [onFieldChange],
    );

    const handleRemoteChange = useCallback(
      (value: string) => {
        onFieldChange("remoteId", value);
      },
      [onFieldChange],
    );

    const handleProblemChange = useCallback(
      (value: string) => {
        onFieldChange("problemId", value);
      },
      [onFieldChange],
    );

    const handleTVInterfaceEditClick = useCallback(() => {
      const tvInterface = tvInterfaces.find(
        (ti) => ti.id === formData.tvInterfaceId,
      );
      if (tvInterface) onTVInterfaceEditor(tvInterface);
    }, [tvInterfaces, formData.tvInterfaceId, onTVInterfaceEditor]);

    return (
      <div
        ref={scrollContainerRef}
        className="space-y-4 max-h-96 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={isEdit ? "edit-deviceId" : "deviceId"}>
              Приставка *
            </Label>
            <Select value={formData.deviceId} onValueChange={onDeviceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите приставку" />
              </SelectTrigger>
              <SelectContent>
                {activeDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded bg-gradient-to-br ${device.color} mr-2`}
                      />
                      {device.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={isEdit ? "edit-problemId" : "problemId"}>
              Проблем�� *
            </Label>
            <Select
              value={formData.problemId}
              onValueChange={handleProblemChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите проблему" />
              </SelectTrigger>
              <SelectContent>
                {availableProblems.map((problem) => (
                  <SelectItem key={problem.id} value={problem.id}>
                    {problem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-title" : "title"}>
            Название шага *
          </Label>
          <Input
            id={isEdit ? "edit-title" : "title"}
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Введите название шага"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-description" : "description"}>
            Описание
          </Label>
          <Textarea
            id={isEdit ? "edit-description" : "description"}
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Краткое описание шага"
          />
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-instruction" : "instruction"}>
            Инструкция *
          </Label>
          <Textarea
            id={isEdit ? "edit-instruction" : "instruction"}
            value={formData.instruction}
            onChange={handleInstructionChange}
            placeholder="Подробная инструкция для пользователя"
          />
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-tvInterfaceId" : "tvInterfaceId"}>
            Ин��ерфейс ТВ
          </Label>
          <div className="flex space-x-2">
            <Select
              value={formData.tvInterfaceId}
              onValueChange={handleTVInterfaceChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Выберите интерфейс" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без интерфейса</SelectItem>
                {loadingTVInterfaces ? (
                  <SelectItem value="loading" disabled>
                    Загрузка...
                  </SelectItem>
                ) : (
                  tvInterfaces.map((tvInterface) => (
                    <SelectItem key={tvInterface.id} value={tvInterface.id}>
                      <div className="flex items-center">
                        <Monitor className="w-3 h-3 mr-2" />
                        {tvInterface.name}
                        <span className="ml-2 text-xs text-gray-500">
                          ({tvInterface.type})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formData.tvInterfaceId !== "none" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTVInterfaceEditClick}
                size="sm"
              >
                <Target className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-remoteId" : "remoteId"}>Пульт</Label>
          <div className="flex space-x-2">
            <Select
              value={formData.remoteId}
              onValueChange={handleRemoteChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Выберите пульт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без пульта</SelectItem>
                {availableRemotes.map((remote) => {
                  const device = devices.find((d) => d.id === remote.deviceId);
                  return (
                    <SelectItem key={remote.id} value={remote.id}>
                      <div className="flex items-center">
                        {device && (
                          <div
                            className={`w-3 h-3 rounded bg-gradient-to-br ${device.color} mr-2`}
                          />
                        )}
                        {remote.name}
                        {remote.isDefault && (
                          <span className="ml-2 text-xs text-blue-600">
                            (по умолчан��ю)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formData.remoteId !== "none" && (
              <Button
                type="button"
                variant="outline"
                onClick={onRemoteEditor}
                size="sm"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-hint" : "hint"}>Подсказка</Label>
          <Textarea
            id={isEdit ? "edit-hint" : "hint"}
            value={formData.hint}
            onChange={handleHintChange}
            placeholder="Дополнительная подсказка для пользовате��я"
          />
        </div>

        {formData.buttonPosition.x > 0 && formData.buttonPosition.y > 0 && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm text-green-700 dark:text-green-300">
                Позиция кнопки: ({(formData.buttonPosition.x * 100).toFixed(1)}
                %, {(formData.buttonPosition.y * 100).toFixed(1)}%)
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  },
);

StepFormFields.displayName = "StepFormFields";

// Sortable Step Item Component
const SortableStepItem = React.memo<{
  step: DiagnosticStep;
  getRemoteById: (id: string) => any;
  onEdit: (step: DiagnosticStep) => void;
  onToggleStatus: (stepId: string) => void;
  onDelete: (step: DiagnosticStep) => void;
}>(({ step, getRemoteById, onEdit, onToggleStatus, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Drag Handle (Hamburger Icon) */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Перетащите для изменения порядка"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {step.stepNumber}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h4>
              <Badge variant={step.isActive ? "default" : "secondary"}>
                {step.isActive ? "Активный" : "Неактив��ый"}
              </Badge>
              {step.requiredAction && (
                <Badge variant="outline">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Автопереход
                </Badge>
              )}
              {step.remoteId && (
                <Badge variant="outline">
                  <MousePointer className="h-3 w-3 mr-1" />
                  Пульт
                </Badge>
              )}
              {step.tvInterfaceId && (
                <Badge variant="outline">
                  <Monitor className="h-3 w-3 mr-1" />
                  ТВ интерфейс
                </Badge>
              )}
              {step.buttonPosition && (
                <Badge variant="outline">
                  <Target className="h-3 w-3 mr-1" />
                  Позиция
                </Badge>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {step.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              {step.remoteId && (
                <span>
                  Пульт: {getRemoteById(step.remoteId)?.name || "Неизвестный"}
                </span>
              )}
              {step.buttonPosition && (
                <span>
                  Позиция: ({(step.buttonPosition.x * 100).toFixed(1)}%,{" "}
                  {(step.buttonPosition.y * 100).toFixed(1)}%)
                </span>
              )}
              {step.tvInterfaceId && (
                <span>ТВ интерфейс: {step.tvInterfaceId}</span>
              )}
              <span>Обновлено: {step.updatedAt}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(step)}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(step.id)}>
              {step.isActive ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {step.isActive ? "Деактивировать" : "Активировать"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(step)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удали��ь
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

SortableStepItem.displayName = "SortableStepItem";

const StepsManagerFixed = () => {
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const {
    data: devicesResponse,
    isLoading: devicesLoading,
    error: devicesError,
  } = useDevices();
  const {
    data: problemsResponse,
    isLoading: problemsLoading,
    error: problemsError,
  } = useProblems();
  const { toast } = useToast();

  // Extract data arrays from API responses - MUST be before other hooks that depend on them
  const devices = devicesResponse?.data || [];
  const problems = problemsResponse?.data || [];

  // Local state for steps and remotes
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [remotes, setRemotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // TV Interfaces state
  const [tvInterfaces, setTVInterfaces] = useState<TVInterface[]>([]);
  const [selectedTVInterface, setSelectedTVInterface] =
    useState<TVInterface | null>(null);
  const [loadingTVInterfaces, setLoadingTVInterfaces] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterProblem, setFilterProblem] = useState<string>("all");
  const [filterRemote, setFilterRemote] = useState<string>("all");
  const [selectedStep, setSelectedStep] = useState<DiagnosticStep | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoteEditorOpen, setIsRemoteEditorOpen] = useState(false);
  const [isTVInterfaceEditorOpen, setIsTVInterfaceEditorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<DiagnosticStep | null>(null);

  // Remote editor state
  const [selectedRemote, setSelectedRemote] = useState<any>(null);
  const [isPickingButton, setIsPickingButton] = useState(false);
  const [customRemoteImage, setCustomRemoteImage] = useState<string | null>(
    null,
  );
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [remoteNaturalSize, setRemoteNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Form data state with proper initialization
  const [formData, setFormData] = useState({
    deviceId: "",
    problemId: "",
    title: "",
    description: "",
    instruction: "",
    highlightRemoteButton: "none",
    highlightTVArea: "none",
    tvInterface: "home" as DiagnosticStep["tvInterface"],
    tvInterfaceId: "none",
    requiredAction: "",
    hint: "",
    remoteId: "none",
    buttonPosition: { x: 0, y: 0 },
  });

  // Define loadInitialData function before useEffect
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load steps
      const stepsResponse = await stepsApi.getSteps(1, 1000);
      console.log("🔍 Steps response:", stepsResponse);

      const stepsData = stepsResponse?.data || [];
      setSteps(Array.isArray(stepsData) ? stepsData : []);

      // Load remotes
      const remotesResponse = await remotesApi.getAll();
      console.log("🔍 Remotes response:", remotesResponse);

      const remotesData = remotesResponse?.data || remotesResponse || [];
      setRemotes(Array.isArray(remotesData) ? remotesData : []);

      console.log("✅ Loaded data:", {
        steps: Array.isArray(stepsData) ? stepsData.length : 0,
        remotes: Array.isArray(remotesData) ? remotesData.length : 0,
      });
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные шагов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Optimized device change effect that doesn't interfere with input focus
  useEffect(() => {
    if (
      formData.deviceId &&
      formData.deviceId !== "all" &&
      !loadingTVInterfaces
    ) {
      // Use setTimeout to defer the loading and prevent focus interference
      const timeoutId = setTimeout(() => {
        loadTVInterfacesForDevice(formData.deviceId);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.deviceId]); // Removed loadingTVInterfaces dependency to prevent loops

  // Helper functions that are used in useCallback hooks - MUST be defined before hooks that use them
  const getRemoteById = (id: string) => remotes.find((r: any) => r.id === id);

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name || "Неизвестная приставка";
  };

  const getProblemTitle = (problemId: string) => {
    const problem = problems.find((p) => p.id === problemId);
    return problem?.title || "Неизвестная проблема";
  };

  // Memoized stable field change handler
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Memoized stable device change handler
  const handleDeviceChange = useCallback(
    (value: string) => {
      const defaultRemote = remotes.find(
        (r: any) => r.deviceId === value && r.isDefault,
      );
      setFormData((prev) => ({
        ...prev,
        deviceId: value,
        problemId: "", // Reset problem when device changes
        remoteId: defaultRemote?.id || "none",
      }));
    },
    [remotes],
  );

  // Memoized computed values for optimal performance
  const filteredSteps = useMemo(() => {
    return steps.filter((step) => {
      const matchesSearch =
        step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDevice =
        filterDevice === "all" || step.deviceId === filterDevice;
      const matchesProblem =
        filterProblem === "all" || step.problemId === filterProblem;
      const matchesRemote =
        filterRemote === "all" ||
        step.remoteId === filterRemote ||
        (!step.remoteId && filterRemote === "none");
      return matchesSearch && matchesDevice && matchesProblem && matchesRemote;
    });
  }, [steps, searchTerm, filterDevice, filterProblem, filterRemote]);

  const groupedSteps = useMemo(() => {
    return filteredSteps.reduce(
      (acc, step) => {
        const key = `${step.deviceId}-${step.problemId}`;
        if (!acc[key]) {
          acc[key] = {
            deviceId: step.deviceId,
            problemId: step.problemId,
            steps: [],
          };
        }
        acc[key].steps.push(step);
        return acc;
      },
      {} as Record<
        string,
        { deviceId: string; problemId: string; steps: DiagnosticStep[] }
      >,
    );
  }, [filteredSteps]);

  const activeDevices = useMemo(
    () => devices.filter((d: any) => d.isActive !== false),
    [devices],
  );

  const activeRemotes = useMemo(
    () => remotes.filter((r: any) => r.isActive !== false),
    [remotes],
  );

  const filteredRemotes = useMemo(() => {
    if (filterDevice === "all") {
      return activeRemotes;
    }
    return remotes.filter((r: any) => r.deviceId === filterDevice);
  }, [filterDevice, activeRemotes, remotes]);

  // Handle drag end - defined after groupedSteps to avoid circular dependency
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      // Find the group and steps being reordered
      let targetGroup: {
        deviceId: string;
        problemId: string;
        steps: DiagnosticStep[];
      } | null = null;
      let activeStep: DiagnosticStep | null = null;
      let overStep: DiagnosticStep | null = null;

      // Find the group containing the dragged step
      Object.values(groupedSteps).forEach((group) => {
        const activeStepInGroup = group.steps.find(
          (step) => step.id === active.id,
        );
        const overStepInGroup = group.steps.find((step) => step.id === over.id);

        if (activeStepInGroup && overStepInGroup) {
          targetGroup = group;
          activeStep = activeStepInGroup;
          overStep = overStepInGroup;
        }
      });

      if (!targetGroup || !activeStep || !overStep) {
        console.error("Could not find steps for reordering");
        return;
      }

      try {
        // Get the current order of steps in this group
        const currentSteps = [...targetGroup.steps].sort(
          (a, b) => a.stepNumber - b.stepNumber,
        );
        const activeIndex = currentSteps.findIndex(
          (step) => step.id === active.id,
        );
        const overIndex = currentSteps.findIndex((step) => step.id === over.id);

        if (activeIndex === -1 || overIndex === -1) {
          console.error("Could not find step indexes");
          return;
        }

        // Reorder the steps array
        const reorderedSteps = arrayMove(currentSteps, activeIndex, overIndex);

        // Create the new step IDs array in the correct order
        const stepIds = reorderedSteps.map((step) => step.id);

        console.log("Reordering steps:", {
          problemId: targetGroup.problemId,
          stepIds,
          from: activeIndex + 1,
          to: overIndex + 1,
        });

        // Update local state immediately for smooth UX
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps];

          // Update step numbers for the reordered steps
          reorderedSteps.forEach((step, index) => {
            const stepIndex = newSteps.findIndex((s) => s.id === step.id);
            if (stepIndex !== -1) {
              newSteps[stepIndex] = {
                ...newSteps[stepIndex],
                stepNumber: index + 1,
              };
            }
          });

          return newSteps;
        });

        // Send reorder request to backend
        await stepsApi.reorderSteps(targetGroup.problemId, stepIds);

        toast({
          title: "Успех",
          description: `Порядок шагов обновлен: шаг "${activeStep.title}" перемещен с позиции ${activeIndex + 1} на позицию ${overIndex + 1}`,
          variant: "default",
        });

        // Reload data to ensure consistency
        await loadInitialData();
      } catch (error) {
        console.error("Error reordering steps:", error);

        // Revert local changes on error
        await loadInitialData();

        toast({
          title: "Ошибка",
          description: `Не удалось изменить порядок шагов: ${error?.message || "Неизвестная ошибка"}`,
          variant: "destructive",
        });
      }
    },
    [groupedSteps, toast, loadInitialData],
  );

  const openRemoteEditor = useCallback(() => {
    const remote = getRemoteById(formData.remoteId);
    if (remote) {
      setSelectedRemote(remote);
      setIsRemoteEditorOpen(true);
    }
  }, [formData.remoteId, getRemoteById]);

  const openTVInterfaceEditor = useCallback((tvInterface: TVInterface) => {
    console.log("Opening TV Interface Editor with:", tvInterface);
    setSelectedTVInterface(tvInterface);
    setIsTVInterfaceEditorOpen(true);
  }, []);

  const loadTVInterfacesForDevice = async (deviceId: string) => {
    setLoadingTVInterfaces(true);
    try {
      console.log(`🔄 Loading TV interfaces for device: ${deviceId}`);
      const response = await tvInterfacesAPI.getByDeviceId(deviceId);

      if (response.success && response.data) {
        const normalizedInterfaces = response.data.map((tvInterface) => ({
          ...tvInterface,
          screenshotData:
            tvInterface.screenshotData || tvInterface.screenshot_data,
          clickableAreas:
            tvInterface.clickableAreas || tvInterface.clickable_areas || [],
          highlightAreas:
            tvInterface.highlightAreas || tvInterface.highlight_areas || [],
          deviceId: tvInterface.deviceId || tvInterface.device_id,
          isActive:
            tvInterface.isActive !== undefined
              ? tvInterface.isActive
              : tvInterface.is_active,
        }));

        setTVInterfaces(normalizedInterfaces);
        console.log(
          `�� Loaded ${normalizedInterfaces.length} TV interfaces:`,
          normalizedInterfaces,
        );
      } else {
        console.warn(
          `⚠️ No TV interfaces found for device ${deviceId}:`,
          response.error,
        );
        setTVInterfaces([]);
      }
    } catch (error) {
      console.error(
        `❌ Error loading TV interfaces for device ${deviceId}:`,
        error,
      );
      setTVInterfaces([]);
    } finally {
      setLoadingTVInterfaces(false);
    }
  };

  const handleCreate = async () => {
    console.log("🔄 Creating step with form data:", formData);

    // Validate required fields
    if (
      !formData.deviceId ||
      !formData.problemId ||
      !formData.title ||
      !formData.instruction
    ) {
      toast({
        title: "Ошибка валидации",
        description:
          "Заполн��те все обязательные поля: устройство, проблема, название и инстр��кция",
        variant: "destructive",
      });
      return;
    }

    try {
      // Do not send stepNumber; let backend auto-assign next available number
      const stepData = {
        problemId: formData.problemId,
        deviceId: formData.deviceId,
        title: formData.title,
        description: formData.description || "",
        instruction: formData.instruction,
        highlightRemoteButton:
          formData.highlightRemoteButton === "none"
            ? undefined
            : formData.highlightRemoteButton,
        highlightTVArea:
          formData.highlightTVArea === "none"
            ? undefined
            : formData.highlightTVArea,
        remoteId: formData.remoteId === "none" ? undefined : formData.remoteId,
        tvInterfaceId:
          formData.tvInterfaceId === "none"
            ? undefined
            : formData.tvInterfaceId,
        buttonPosition:
          formData.buttonPosition.x === 0 && formData.buttonPosition.y === 0
            ? undefined
            : formData.buttonPosition,
        requiredAction: formData.requiredAction || undefined,
        hint: formData.hint || undefined,
      };

      console.log("🔄 Sending step data to API:", stepData);

      const response = await stepsApi.createStep(stepData);
      console.log("✅ Step created successfully:", response);

      // Update local state
      if (response.data) {
        setSteps((prev) => [...prev, response.data]);
      }

      // Reload data to ensure consistency
      await loadInitialData();

      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: "Ус��ех",
        description: "Шаг успешно создан",
        variant: "default",
      });
    } catch (error) {
      console.error("❌ Error creating step:", error);
      toast({
        title: "Ошибка создания",
        description: `Не удалось создать шаг: ${error?.message || "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedStep) return;

    console.log("🔄 Updating step with form data:", formData);

    // Validate required fields
    if (
      !formData.deviceId ||
      !formData.problemId ||
      !formData.title ||
      !formData.instruction
    ) {
      toast({
        title: "Ошибка валидации",
        description:
          "Заполните все обяза��ельные п��ля: устройство, проблема, название и инст��ук��ия",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedFormData = {
        problemId: formData.problemId,
        deviceId: formData.deviceId,
        title: formData.title,
        description: formData.description || "",
        instruction: formData.instruction,
        highlightRemoteButton:
          formData.highlightRemoteButton === "none"
            ? undefined
            : formData.highlightRemoteButton,
        highlightTVArea:
          formData.highlightTVArea === "none"
            ? undefined
            : formData.highlightTVArea,
        remoteId: formData.remoteId === "none" ? undefined : formData.remoteId,
        tvInterfaceId:
          formData.tvInterfaceId === "none"
            ? undefined
            : formData.tvInterfaceId,
        buttonPosition:
          formData.buttonPosition.x === 0 && formData.buttonPosition.y === 0
            ? undefined
            : formData.buttonPosition,
        requiredAction: formData.requiredAction || undefined,
        hint: formData.hint || undefined,
      };

      console.log("🔄 Sending update data to API:", updatedFormData);

      const response = await stepsApi.updateStep(
        selectedStep.id,
        updatedFormData,
      );
      console.log("�� Step updated successfully:", response);

      // Update local state
      if (response.data) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === selectedStep.id ? { ...step, ...response.data } : step,
          ),
        );
      }

      // Reload data to ensure consistency
      await loadInitialData();

      setIsEditDialogOpen(false);
      setSelectedStep(null);
      resetForm();

      toast({
        title: "Успех",
        description: "Ш��г успешно обновлен",
        variant: "default",
      });
    } catch (error) {
      console.error("�� Error updating step:", error);
      toast({
        title: "Ошибка обновления",
        description: `Не удалось обновить шаг: ${error?.message || "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    }
  };

  const openDeleteModal = (step: DiagnosticStep) => {
    setStepToDelete(step);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!stepToDelete) return;

    try {
      await stepsApi.deleteStep(stepToDelete.id);

      // Update local state
      setSteps((prev) => prev.filter((step) => step.id !== stepToDelete.id));

      // Close the modal
      setIsDeleteModalOpen(false);
      setStepToDelete(null);

      // Reload data to ensure consistency
      await loadInitialData();

      toast({
        title: "Успех",
        description: "Шаг успешно удален",
        variant: "default",
      });
    } catch (error) {
      console.error("❌ Error deleting step:", error);

      // Close the modal
      setIsDeleteModalOpen(false);
      setStepToDelete(null);

      toast({
        title: "Ошибка удалени��",
        description: `Не удалось удалить шаг: ${error?.message || "Неизвестн��я ошибка"}`,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    try {
      const response = await stepsApi.updateStep(stepId, {
        isActive: !step.isActive,
      });

      // Update local state
      if (response.data) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === stepId ? { ...s, isActive: !step.isActive } : s,
          ),
        );
      }

      toast({
        title: "Успех",
        description: `Шаг ${!step.isActive ? "активирован" : "деактивирован"}`,
        variant: "default",
      });
    } catch (error) {
      console.error("❌ Error toggling step status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус шага",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (step: DiagnosticStep) => {
    console.log("🔄 Opening edit dialog for step:", step);

    setSelectedStep(step);
    setFormData({
      deviceId: step.deviceId,
      problemId: step.problemId,
      title: step.title,
      description: step.description,
      instruction: step.instruction,
      highlightRemoteButton: step.highlightRemoteButton || "none",
      highlightTVArea: step.highlightTVArea || "none",
      tvInterface: step.tvInterface || "home",
      tvInterfaceId: step.tvInterfaceId || "none",
      requiredAction: step.requiredAction || "",
      hint: step.hint || "",
      remoteId: step.remoteId || "none",
      buttonPosition: step.buttonPosition || { x: 0, y: 0 },
    });

    setIsEditDialogOpen(true);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPickingButton || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Пре��отвращаем дефолтное поведение и всплытие для максимальной точности
    event.preventDefault();
    event.stopPropagation();

    // Используем более точные координаты с дробными значениями
    const preciseX = event.clientX - rect.left;
    const preciseY = event.clientY - rect.top;

    // Нормализуем координаты к диапазону 0-1 относительно области изображения (учёт letterbox)
    const box = getImageBox(rect.width, rect.height);
    const xInImg = preciseX - box.left;
    const yInImg = preciseY - box.top;
    const normalizedX = Math.max(0, Math.min(1, xInImg / box.width));
    const normalizedY = Math.max(0, Math.min(1, yInImg / box.height));

    console.log("🎯 ULTRA PRECISE Click coordinates:", {
      raw: { clientX: event.clientX, clientY: event.clientY },
      canvasRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      relative: { x: preciseX, y: preciseY },
      normalized: { x: normalizedX, y: normalizedY },
      percentage: {
        x: (normalizedX * 100).toFixed(3),
        y: (normalizedY * 100).toFixed(3),
      },
    });

    setFormData({
      ...formData,
      buttonPosition: { x: normalizedX, y: normalizedY },
    });

    setIsPickingButton(false);
  };

  const handleCanvasMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (!isPickingButton || !canvasRef.current) {
      setHoverPosition(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const preciseX = event.clientX - rect.left;
    const preciseY = event.clientY - rect.top;

    const box = getImageBox(rect.width, rect.height);
    const xInImg = preciseX - box.left;
    const yInImg = preciseY - box.top;

    const normalizedX = Math.max(0, Math.min(1, xInImg / box.width));
    const normalizedY = Math.max(0, Math.min(1, yInImg / box.height));

    setHoverPosition({ x: normalizedX, y: normalizedY });
  };

  const handleCanvasMouseLeave = () => {
    setHoverPosition(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomRemoteImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const src =
      customRemoteImage ||
      selectedRemote?.imageData ||
      selectedRemote?.image_data ||
      null;
    if (!src) {
      setRemoteNaturalSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setRemoteNaturalSize({
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
      });
    };
    img.src = src;
  }, [customRemoteImage, selectedRemote]);

  const getImageBox = (containerW: number, containerH: number) => {
    const canvasAR = containerW / containerH;
    const imgAR =
      remoteNaturalSize &&
      remoteNaturalSize.width > 0 &&
      remoteNaturalSize.height > 0
        ? remoteNaturalSize.width / remoteNaturalSize.height
        : canvasAR;

    if (canvasAR > imgAR) {
      const imgH = containerH;
      const imgW = imgAR * imgH;
      const left = (containerW - imgW) / 2;
      const top = 0;
      return { left, top, width: imgW, height: imgH };
    } else {
      const imgW = containerW;
      const imgH = imgW / imgAR;
      const left = 0;
      const top = (containerH - imgH) / 2;
      return { left, top, width: imgW, height: imgH };
    }
  };

  const resetForm = () => {
    setFormData({
      deviceId: "",
      problemId: "",
      title: "",
      description: "",
      instruction: "",
      highlightRemoteButton: "none",
      highlightTVArea: "none",
      tvInterface: "home",
      tvInterfaceId: "none",
      requiredAction: "",
      hint: "",
      remoteId: "none",
      buttonPosition: { x: 0, y: 0 },
    });
    setCustomRemoteImage(null);
  };

  const renderRemoteEditor = () => {
    const remoteImage = customRemoteImage || selectedRemote?.imageData;

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            {/* Precise overlay wrapper exactly matching canvas */}
            <div
              className="relative mx-auto"
              style={{ width: 400, height: 600 }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={600}
                className={`absolute inset-0 border border-gray-300 dark:border-gray-600 rounded transition-all duration-200 ${
                  isPickingButton
                    ? "cursor-crosshair border-blue-500 shadow-lg ring-2 ring-blue-200"
                    : "cursor-pointer hover:border-gray-400"
                }`}
                style={{
                  backgroundImage: remoteImage ? `url(${remoteImage})` : "none",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundColor: remoteImage ? "transparent" : "#f3f4f6",
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
              />

              {/* Hover indicator - показывается при наведении (relative to canvas) */}
              {isPickingButton &&
                hoverPosition &&
                (() => {
                  const box = getImageBox(400, 600);
                  const leftPercent =
                    ((box.left + hoverPosition.x * box.width) / 400) * 100;
                  const topPercent =
                    ((box.top + hoverPosition.y * box.height) / 600) * 100;
                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        zIndex: 999,
                      }}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2 -translate-x-[12px] -translate-y-[20px] rotate-[-28deg]">
                        <span className="absolute w-3.5 h-3.5 rounded-full border-2 border-cyan-300 left-[0px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple"></span>
                        <span className="absolute w-3.5 h-3.5 rounded-full border-2 border-cyan-300 left-[0px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple-delayed"></span>
                        <div className="text-[30px] leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] select-none animate-tap-bounce">
                          👆
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Выбранная позиция - постоянный индикатор (relative to canvas) */}
              {formData.buttonPosition.x > 0 &&
                formData.buttonPosition.y > 0 &&
                (() => {
                  const box = getImageBox(400, 600);
                  const leftPercent =
                    ((box.left + formData.buttonPosition.x * box.width) / 400) *
                    100;
                  const topPercent =
                    ((box.top + formData.buttonPosition.y * box.height) / 600) *
                    100;
                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        zIndex: 1000,
                      }}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2 -translate-x-[14px] -translate-y-[24px] rotate-[-28deg]">
                        <span className="absolute w-4 h-4 rounded-full border-2 border-cyan-300 left-[2px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple"></span>
                        <span className="absolute w-4 h-4 rounded-full border-2 border-cyan-300 left-[2px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple-delayed"></span>
                        <div className="text-[36px] leading-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] select-none animate-tap-bounce">
                          👆
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Выбор позиции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant={isPickingButton ? "default" : "outline"}
                  onClick={() => setIsPickingButton(!isPickingButton)}
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isPickingButton ? "Отмен����ть выбор" : "Выбрать позицию"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Загрузить изображение
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {isPickingButton && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Кликните на из��бражение пульта, ��тобы указать позицию
                      кнопки
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {formData.buttonPosition.x > 0 &&
                formData.buttonPosition.y > 0 && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Позиция выбрана: (
                        {(formData.buttonPosition.x * 100).toFixed(1)}%,{" "}
                        {(formData.buttonPosition.y * 100).toFixed(1)}%)
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const isLoadingAll = loading || devicesLoading || problemsLoading;

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
        <span className="text-lg">Загрузка данных...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление шагами (Исправлено)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание шагов диагностики с привязкой к приставкам и проблемам
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Создать новый шаг
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый шаг</DialogTitle>
            </DialogHeader>
            <StepFormFields
              isEdit={false}
              formData={formData}
              onFieldChange={handleFieldChange}
              onDeviceChange={handleDeviceChange}
              devices={devices}
              problems={problems}
              remotes={remotes}
              tvInterfaces={tvInterfaces}
              loadingTVInterfaces={loadingTVInterfaces}
              onTVInterfaceEditor={openTVInterfaceEditor}
              onRemoteEditor={openRemoteEditor}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !formData.deviceId ||
                  !formData.problemId ||
                  !formData.title ||
                  !formData.instruction
                }
              >
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск шагов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filterDevice}
                onValueChange={(value) => {
                  setFilterDevice(value);
                  setFilterRemote("all");
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Приставка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приставки</SelectItem>
                  {activeDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded bg-gradient-to-br ${device.color} mr-2`}
                        />
                        {device.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterProblem} onValueChange={setFilterProblem}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Проблема" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все проблемы</SelectItem>
                  {problems
                    .filter((p) => p.status === "published")
                    .map((problem) => (
                      <SelectItem key={problem.id} value={problem.id}>
                        {problem.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={filterRemote} onValueChange={setFilterRemote}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Пульт" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пульты</SelectItem>
                  <SelectItem value="none">Без пульта</SelectItem>
                  {filteredRemotes.map((remote) => {
                    const device = devices.find(
                      (d) => d.id === remote.deviceId,
                    );
                    return (
                      <SelectItem key={remote.id} value={remote.id}>
                        <div className="flex items-center">
                          {device && (
                            <div
                              className={`w-3 h-3 rounded bg-gradient-to-br ${device.color} mr-2`}
                            />
                          )}
                          {remote.name}
                          {remote.isDefault && (
                            <span className="ml-2 text-xs text-blue-600">
                              (по умолчанию)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps List - Grouped by Device and Problem with Drag-and-Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {Object.entries(groupedSteps).map(([key, group]) => {
            const sortedSteps = group.steps.sort(
              (a, b) => a.stepNumber - b.stepNumber,
            );

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layers className="h-5 w-5 mr-2" />
                    <Tv className="h-4 w-4 mr-2" />
                    {getDeviceName(group.deviceId)} -{" "}
                    {getProblemTitle(group.problemId)}
                    <Badge variant="secondary" className="ml-2">
                      {group.steps.length} шагов
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    💡 Используйте иконку ��� ��ля изменения порядка шагов
                    методом перетаскивания
                  </p>
                </CardHeader>
                <CardContent>
                  <SortableContext
                    items={sortedSteps.map((step) => step.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {sortedSteps.map((step) => (
                        <SortableStepItem
                          key={step.id}
                          step={step}
                          getRemoteById={getRemoteById}
                          onEdit={openEditDialog}
                          onToggleStatus={handleToggleStatus}
                          onDelete={openDeleteModal}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DndContext>

      {/* Remote Editor Dialog */}
      <Dialog open={isRemoteEditorOpen} onOpenChange={setIsRemoteEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              ���ыбор позиции на пульте: {selectedRemote?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">{renderRemoteEditor()}</div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsRemoteEditorOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={() => setIsRemoteEditorOpen(false)}>
              <Save className="h-4 w-4 mr-2" />
              Сохранить позицию
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать шаг</DialogTitle>
          </DialogHeader>
          <StepFormFields
            isEdit={true}
            formData={formData}
            onFieldChange={handleFieldChange}
            onDeviceChange={handleDeviceChange}
            devices={devices}
            problems={problems}
            remotes={remotes}
            tvInterfaces={tvInterfaces}
            loadingTVInterfaces={loadingTVInterfaces}
            onTVInterfaceEditor={openTVInterfaceEditor}
            onRemoteEditor={openRemoteEditor}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !formData.deviceId ||
                !formData.problemId ||
                !formData.title ||
                !formData.instruction
              }
            >
              Сох��анить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удал��ть шаг?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите ПОЛНОСТЬЮ УДАЛИТЬ этот шаг из баз�� данных?
              Это действие нельзя отменить! Шаг "{stepToDelete?.title}" будет
              удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setStepToDelete(null);
              }}
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить навсегда
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {Object.keys(groupedSteps).length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Шаги не найд��ны
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Создайте первый шаг диагностики или измените пар��метры фильтрации
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepsManagerFixed;
