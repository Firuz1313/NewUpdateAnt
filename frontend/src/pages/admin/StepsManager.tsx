import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDevices } from "@/hooks/useDevices";
import { useProblems } from "@/hooks/useProblems";
import { tvInterfacesAPI } from "@/api/tvInterfaces";
import { TVInterface, tvInterfaceUtils } from "@/types/tvInterface";
import { stepsApi, remotesApi } from "@/api";
import TVInterfaceAreaEditor from "@/components/admin/TVInterfaceAreaEditor";

// Мемоизированный компонент формы для предот��ращения потери фокуса
const StepFormFieldsComponent = React.memo(
  ({
    isEdit = false,
    formData,
    handleFieldChange,
    handleDeviceChange,
    getActiveDevices,
    getAvailableProblems,
    getAvailableRemotes,
    devices,
    tvInterfaces,
    loadingTVInterfaces,
    openTVInterfaceEditor,
    openRemoteEditor,
  }: {
    isEdit?: boolean;
    formData: any;
    handleFieldChange: (field: string, value: any) => void;
    handleDeviceChange: (value: string) => void;
    getActiveDevices: () => any[];
    getAvailableProblems: () => any[];
    getAvailableRemotes: () => any[];
    devices: any[];
    tvInterfaces: any[];
    loadingTVInterfaces: boolean;
    openTVInterfaceEditor: (tvInterface: any) => Promise<void>;
    openRemoteEditor: () => void;
  }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? "edit-deviceId" : "deviceId"}>
            Приставка
          </Label>
          <Select value={formData.deviceId} onValueChange={handleDeviceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите приставку" />
            </SelectTrigger>
            <SelectContent>
              {getActiveDevices().map((device) => (
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
            Проблема
          </Label>
          <Select
            value={formData.problemId}
            onValueChange={(value) => handleFieldChange("problemId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выб��рите пробл��му" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableProblems().map((problem) => (
                <SelectItem key={problem.id} value={problem.id}>
                  {problem.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-title" : "title"}>Название шага</Label>
        <Input
          id={isEdit ? "edit-title" : "title"}
          value={formData.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          placeholder="Введит�� название шага"
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-description" : "description"}>
          Описание
        </Label>
        <Textarea
          id={isEdit ? "edit-description" : "description"}
          value={formData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Краткое описание шага"
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-instruction" : "instruction"}>
          Инструкция
        </Label>
        <Textarea
          id={isEdit ? "edit-instruction" : "instruction"}
          value={formData.instruction}
          onChange={(e) => handleFieldChange("instruction", e.target.value)}
          placeholder="Подробная инструкция для ��ользователя"
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-tvInterfaceId" : "tvInterfaceId"}>
          Созданный интерфейс
        </Label>
        <div className="flex space-x-2">
          <Select
            value={formData.tvInterfaceId}
            onValueChange={(value) => handleFieldChange("tvInterfaceId", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Выберите интерфейс" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без и���терф��йса</SelectItem>
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
              variant="outline"
              onClick={() => {
                const tvInterface = tvInterfaces.find(
                  (ti) => ti.id === formData.tvInterfaceId,
                );
                if (tvInterface) openTVInterfaceEditor(tvInterface);
              }}
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
            onValueChange={(value) => handleFieldChange("remoteId", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Выберите пуль��" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без пульта</SelectItem>
              {getAvailableRemotes().map((remote) => {
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
                          (по умолчанию)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {formData.remoteId !== "none" && (
            <Button variant="outline" onClick={openRemoteEditor} size="sm">
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
          onChange={(e) => handleFieldChange("hint", e.target.value)}
          placeholder="Главна�� ��одсказка данного шага решения"
        />
      </div>

      {formData.buttonPosition.x > 0 && formData.buttonPosition.y > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            Позиция кнопки: ({Math.round(formData.buttonPosition.x)},{" "}
            {Math.round(formData.buttonPosition.y)})
          </p>
        </div>
      )}
    </div>
  ),
);

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
  tvInterfaceId?: string; // ID созданного TV интерфейса
  requiredAction?: string;
  hint?: string;
  remoteId?: string;
  buttonPosition?: { x: number; y: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const StepsManager = () => {
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

  // Извлекаем массивы данных из ответа API
  const devices = devicesResponse?.data || [];
  const problems = problemsResponse?.data || [];

  // Debug logging
  console.log("🔍 StepsManager data:", {
    devicesResponse,
    problemsResponse,
    devices: devices.length,
    problems: problems.length,
    devicesLoading,
    problemsLoading,
    devicesError,
    problemsError,
  });

  // Local state for steps and remotes
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [remotes, setRemotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load steps
      const stepsResponse = await stepsApi.getSteps(1, 1000); // Get first 1000 steps
      console.log("🔍 Steps response:", stepsResponse);

      // PaginatedResponse has data property, but check both formats
      const stepsData = stepsResponse?.data || stepsResponse || [];
      setSteps(Array.isArray(stepsData) ? stepsData : []);

      // Load remotes
      const remotesResponse = await remotesApi.getAll();
      console.log("🔍 Remotes response:", remotesResponse);

      // API response format: { success: true, data: [...] }
      const remotesData = remotesResponse?.data || remotesResponse || [];
      setRemotes(Array.isArray(remotesData) ? remotesData : []);

      console.log("✅ Loaded data:", {
        steps: Array.isArray(stepsData) ? stepsData.length : 0,
        remotes: Array.isArray(remotesData) ? remotesData.length : 0,
        stepsType: typeof stepsData,
        remotesType: typeof remotesData,
      });
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Step management functions
  const createStep = async (step: DiagnosticStep) => {
    try {
      const response = await stepsApi.createStep(step);
      const newStep = response.data;
      setSteps((prev) => [...prev, newStep]);
      return newStep;
    } catch (error) {
      console.error("Error creating step:", error);
      throw error;
    }
  };

  const updateStep = async (id: string, data: any) => {
    try {
      const response = await stepsApi.updateStep(id, data);
      const updatedStep = response.data;
      setSteps((prev) =>
        prev.map((step) =>
          step.id === id ? { ...step, ...updatedStep } : step,
        ),
      );
      return updatedStep;
    } catch (error) {
      console.error("Error updating step:", error);
      throw error;
    }
  };

  const deleteStep = async (id: string) => {
    try {
      await stepsApi.deleteStep(id);
      setSteps((prev) => prev.filter((step) => step.id !== id));
    } catch (error) {
      console.error("Error deleting step:", error);
      throw error;
    }
  };

  const reorderSteps = async (problemId: string, stepIds: string[]) => {
    try {
      const response = await stepsApi.reorderSteps(problemId, stepIds);
      // Reload steps to get updated order
      await loadInitialData();
    } catch (error) {
      console.error("Error reordering steps:", error);
      throw error;
    }
  };
  const getActiveDevices = () => {
    const activeDevices = devices.filter((d: any) => d.isActive !== false);
    console.log("🔍 getActiveDevices called:", {
      totalDevices: devices.length,
      devicesArray: devices,
      activeDevices: activeDevices,
    });
    return activeDevices;
  };

  const getActiveRemotes = () => {
    const activeRemotes = remotes.filter((r: any) => r.isActive !== false);
    console.log("🔍 getActiveRemotes called:", {
      totalRemotes: remotes.length,
      remotesArray: remotes,
      activeRemotes: activeRemotes,
    });
    return activeRemotes;
  };

  const getRemoteById = (id: string) => remotes.find((r: any) => r.id === id);

  const getProblemsForDevice = (deviceId: string) => {
    const deviceProblems = problems.filter((p: any) => p.deviceId === deviceId);
    console.log("🔍 getProblemsForDevice called:", {
      deviceId,
      totalProblems: problems.length,
      deviceProblems: deviceProblems.length,
      allProblems: problems.map((p) => ({
        id: p.id,
        deviceId: p.deviceId,
        title: p.title,
      })),
    });
    return deviceProblems;
  };

  const getRemotesForDevice = (deviceId: string) => {
    const deviceRemotes = remotes.filter((r: any) => r.deviceId === deviceId);
    console.log("🔍 getRemotesForDevice called:", {
      deviceId,
      totalRemotes: remotes.length,
      deviceRemotes: deviceRemotes.length,
      allRemotes: remotes.map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        name: r.name,
      })),
    });
    return deviceRemotes;
  };
  const getDefaultRemoteForDevice = (deviceId: string) => {
    const defaultRemote = remotes.find(
      (r: any) => r.deviceId === deviceId && r.isDefault,
    );
    console.log("🔍 getDefaultRemoteForDevice called:", {
      deviceId,
      defaultRemote: defaultRemote
        ? { id: defaultRemote.id, name: defaultRemote.name }
        : null,
    });
    return defaultRemote;
  };

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const { toast } = useToast();

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

  // TV Interfaces state
  const [tvInterfaces, setTVInterfaces] = useState<TVInterface[]>([]);
  const [selectedTVInterface, setSelectedTVInterface] =
    useState<TVInterface | null>(null);
  const [loadingTVInterfaces, setLoadingTVInterfaces] = useState(false);

  // Form data state - ALL useState hooks must be before conditional returns
  const [formData, setFormData] = useState({
    deviceId: "",
    problemId: "",
    title: "",
    description: "",
    instruction: "",
    highlightRemoteButton: "none",
    highlightTVArea: "none",
    tvInterface: "home" as DiagnosticStep["tvInterface"],
    tvInterfaceId: "none", // Добавлено для выбора ��озданного интерфейса
    requiredAction: "",
    hint: "",
    remoteId: "none",
    buttonPosition: { x: 0, y: 0 },
  });

  // Remote editor state
  const [selectedRemote, setSelectedRemote] = useState<any>(null);
  const [isPickingButton, setIsPickingButton] = useState(false);
  const [customRemoteImage, setCustomRemoteImage] = useState<string | null>(
    null,
  );

  // ALL useEffect and useCallback hooks must be before conditional returns
  useEffect(() => {
    if (formData.deviceId && formData.deviceId !== "all") {
      loadTVInterfacesForDevice(formData.deviceId);
    }
  }, [formData.deviceId]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDeviceChange = useCallback(
    (value: string) => {
      const defaultRemote = getDefaultRemoteForDevice(value);
      setFormData((prev) => ({
        ...prev,
        deviceId: value,
        problemId: "",
        remoteId: defaultRemote?.id || "none",
      }));
    },
    [getDefaultRemoteForDevice],
  );

  // Show loading state while data is being fetched - AFTER ALL HOOKS
  if (loading || devicesLoading || problemsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
        <span className="text-lg">Загрузка данных...</span>
      </div>
    );
  }

  const loadTVInterfacesForDevice = async (deviceId: string) => {
    setLoadingTVInterfaces(true);
    try {
      console.log(`🔄 Loading TV interfaces for device: ${deviceId}`);
      const response = await tvInterfacesAPI.getByDeviceId(deviceId);

      if (response.success && response.data) {
        // Нормализуем данные с бэкенда
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
          `✅ Loaded ${normalizedInterfaces.length} TV interfaces:`,
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

      // Показываем пользователю информацию об ошибке
      if (error instanceof Error && error.message.includes("Сетевая ошибка")) {
        // Можно добавить toast уведомление
        console.error("П��облемы с подключением к с��рверу");
      }
    } finally {
      setLoadingTVInterfaces(false);
    }
  };

  const handleTVInterfaceAreaSave = async (
    clickableAreas: any[],
    highlightAreas: any[],
  ) => {
    if (!selectedTVInterface) return;

    try {
      await tvInterfacesAPI.update(selectedTVInterface.id, {
        clickableAreas,
        highlightAreas,
      });

      // Refresh TV interfaces
      if (formData.deviceId) {
        await loadTVInterfacesForDevice(formData.deviceId);
      }

      setIsTVInterfaceEditorOpen(false);
      setSelectedTVInterface(null);
    } catch (error) {
      console.error("Error saving TV interface areas:", error);
    }
  };

  const openTVInterfaceEditor = async (tvInterface: TVInterface) => {
    console.log("Opening TV Interface Editor with:", {
      id: tvInterface.id,
      name: tvInterface.name,
      screenshotData: tvInterface.screenshotData ? "present" : "missing",
      screenshot_data: tvInterface.screenshot_data ? "present" : "missing",
    });

    // Check if this interface still exists in our current list
    const interfaceExists = tvInterfaces.find((ti) => ti.id === tvInterface.id);
    if (!interfaceExists) {
      console.warn(
        `⚠️ TV interface ${tvInterface.id} not found in current list, reloading...`,
      );
      if (formData.deviceId) {
        await loadTVInterfacesForDevice(formData.deviceId);
      }
      toast({
        title: "Интерфейс не найден",
        description: `TV интерфейс "${tvInterface.name}" больше не доступен. Список о��н��влён.`,
        variant: "destructive",
      });
      return;
    }

    // Validate interface ID and fetch full interface data
    if (!tvInterface.id) {
      console.warn("⚠️ TV interface has no ID, using cached data");
      setSelectedTVInterface(tvInterface);
      setIsTVInterfaceEditorOpen(true);
      return;
    }

    try {
      console.log(`🔄 Fetching full TV interface data for: ${tvInterface.id}`);
      const response = await tvInterfacesAPI.getById(tvInterface.id);

      if (response.success && response.data) {
        const fullInterface = tvInterfaceUtils.normalizeFromBackend(
          response.data,
        );
        console.log("✅ Loaded full TV interface with screenshot:", {
          id: fullInterface.id,
          name: fullInterface.name,
          screenshotData: fullInterface.screenshotData ? "present" : "missing",
          screenshot_data: fullInterface.screenshot_data
            ? "present"
            : "missing",
        });
        setSelectedTVInterface(fullInterface);
      } else {
        console.warn(
          `⚠️ Failed to load full interface data for ${tvInterface.id}: ${response.error}. Checking if interface still exists.`,
        );

        // If interface not found, try reloading the TV interfaces list
        if (
          response.error?.includes("404") ||
          response.error?.includes("не найден")
        ) {
          console.log(
            "🔄 Interface not found, reloading TV interfaces list...",
          );
          if (formData.deviceId) {
            await loadTVInterfacesForDevice(formData.deviceId);
          }
          toast({
            title: "Интерфейс не найден",
            description: `TV интерфе��с "${tvInterface.name}" больше не существует. Спис��к интерфейсов обновлён.`,
            variant: "destructive",
          });
          return; // Don't open editor for non-existent interface
        }

        setSelectedTVInterface(tvInterface);
      }
    } catch (error) {
      console.error(
        `❌ Error loading full interface data for ${tvInterface.id}:`,
        error,
      );
      toast({
        title: "Предупреждение",
        description: `Не удалось загрузить по��ные данные интерфейса ${tvInterface.name}. Используются кэшированные данные.`,
        variant: "destructive",
      });
      setSelectedTVInterface(tvInterface);
    }

    setIsTVInterfaceEditorOpen(true);
  };

  const filteredSteps = steps.filter((step) => {
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

  const getAvailableProblems = () => {
    let availableProblems;
    if (formData.deviceId) {
      availableProblems = getProblemsForDevice(formData.deviceId);
    } else {
      availableProblems = problems.filter((p) => p.status === "published");
    }

    console.log("🔍 getAvailableProblems called:", {
      selectedDeviceId: formData.deviceId,
      totalProblems: problems.length,
      problemsArray: problems,
      availableProblems: availableProblems,
      availableCount: availableProblems.length,
    });

    return availableProblems;
  };

  const getAvailableRemotes = () => {
    const result = formData.deviceId
      ? getRemotesForDevice(formData.deviceId)
      : getActiveRemotes();

    console.log("🔍 getAvailableRemotes called:", {
      selectedDeviceId: formData.deviceId,
      returnedRemotes: result,
      resultLength: result.length,
    });

    return result;
  };

  const getFilteredRemotes = () => {
    if (filterDevice === "all") {
      return getActiveRemotes();
    }
    return getRemotesForDevice(filterDevice);
  };

  const handleCreate = async () => {
    const deviceSteps = steps.filter(
      (s) =>
        s.deviceId === formData.deviceId && s.problemId === formData.problemId,
    );
    const maxStepNumber =
      deviceSteps.length > 0
        ? Math.max(...deviceSteps.map((s) => s.stepNumber))
        : 0;

    const newStep: DiagnosticStep = {
      id: `step-${formData.deviceId}-${formData.problemId}-${Date.now()}`,
      ...formData,
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
        formData.tvInterfaceId === "none" ? undefined : formData.tvInterfaceId,
      buttonPosition:
        formData.buttonPosition.x === 0 && formData.buttonPosition.y === 0
          ? undefined
          : formData.buttonPosition,
      stepNumber: maxStepNumber + 1,
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    try {
      await createStep(newStep);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating step:", error);
    }
  };

  const handleEdit = async () => {
    if (!selectedStep) return;

    const updatedFormData = {
      ...formData,
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
        formData.tvInterfaceId === "none" ? undefined : formData.tvInterfaceId,
      buttonPosition:
        formData.buttonPosition.x === 0 && formData.buttonPosition.y === 0
          ? undefined
          : formData.buttonPosition,
    };

    try {
      await updateStep(selectedStep.id, updatedFormData);
      setIsEditDialogOpen(false);
      setSelectedStep(null);
      resetForm();
    } catch (error) {
      console.error("Error updating step:", error);
    }
  };

  const handleDelete = async (stepId: string) => {
    const stepToDelete = steps.find((s) => s.id === stepId);
    if (!stepToDelete) return;

    // Remove the step
    const remainingSteps = steps.filter((step) => step.id !== stepId);

    // Reorder step numbers for the same problem
    const reorderedSteps = remainingSteps.map((step) => {
      if (
        step.problemId === stepToDelete.problemId &&
        step.stepNumber > stepToDelete.stepNumber
      ) {
        return { ...step, stepNumber: step.stepNumber - 1 };
      }
      return step;
    });

    try {
      await deleteStep(stepId);
      // Step reordering handled automatically
    } catch (error) {
      console.error("Error deleting step:", error);
    }
  };

  const handleToggleStatus = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    try {
      await updateStep(stepId, {
        isActive: !step.isActive,
      });
    } catch (error) {
      console.error("Error toggling step status:", error);
    }
  };

  const handleMoveStep = async (stepId: string, direction: "up" | "down") => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const step = steps[stepIndex];
    if (!step) return;

    const problemSteps = steps
      .filter((s) => s.problemId === step.problemId)
      .sort((a, b) => a.stepNumber - b.stepNumber);

    const currentIndex = problemSteps.findIndex((s) => s.id === stepId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= problemSteps.length) return;

    const updatedSteps = steps.map((s) => {
      if (s.id === stepId) {
        return { ...s, stepNumber: problemSteps[newIndex].stepNumber };
      }
      if (s.id === problemSteps[newIndex].id) {
        return { ...s, stepNumber: step.stepNumber };
      }
      return s;
    });

    try {
      // Use the reorderSteps function
      const problemStepIds = problemSteps.map((s) => {
        if (s.id === stepId) return problemSteps[newIndex].id;
        if (s.id === problemSteps[newIndex].id) return stepId;
        return s.id;
      });
      await reorderSteps(step.problemId, problemStepIds);
    } catch (error) {
      console.error("Error moving step:", error);
    }
  };

  const openEditDialog = (step: DiagnosticStep) => {
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

  const openRemoteEditor = () => {
    const remote = getRemoteById(formData.remoteId);
    if (remote) {
      setSelectedRemote(remote);
      setIsRemoteEditorOpen(true);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPickingButton || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setFormData({
      ...formData,
      buttonPosition: { x, y },
    });

    setIsPickingButton(false);
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

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name || "Неизв��стная приставка";
  };

  const getProblemTitle = (problemId: string) => {
    const problem = problems.find((p) => p.id === problemId);
    return problem?.title || "Неизвестная проблема";
  };

  const getGroupedSteps = () => {
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
  };

  const renderRemoteEditor = () => {
    const remoteImage = customRemoteImage || selectedRemote?.imageData;

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Area */}
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={600}
              className="border border-gray-300 dark:border-gray-600 rounded cursor-crosshair mx-auto"
              style={{
                backgroundImage: remoteImage ? `url(${remoteImage})` : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: remoteImage ? "transparent" : "#f3f4f6",
              }}
              onClick={handleCanvasClick}
            />

            {/* Show selected position */}
            {formData.buttonPosition.x > 0 && formData.buttonPosition.y > 0 && (
              <div
                className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${(formData.buttonPosition.x / 400) * 100}%`,
                  top: `${(formData.buttonPosition.y / 600) * 100}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full lg:w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Выбор позиции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={isPickingButton ? "default" : "outline"}
                  onClick={() => setIsPickingButton(!isPickingButton)}
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isPickingButton ? "Отменить выбор" : "Выбрать п��зицию"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Загруз��ть изобр��жение
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
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Кликнит�� на изображение пульта, чтобы указать позици��
                    кнопки
                  </p>
                </div>
              )}

              {formData.buttonPosition.x > 0 &&
                formData.buttonPosition.y > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Позиция выбрана: ({Math.round(formData.buttonPosition.x)},{" "}
                      {Math.round(formData.buttonPosition.y)})
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление шагами
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создан��е шагов диагностики с привязкой к приставкам и проблемам
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Создать шаг
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый шаг</DialogTitle>
            </DialogHeader>
            <StepFormFieldsComponent
              isEdit={false}
              formData={formData}
              handleFieldChange={handleFieldChange}
              handleDeviceChange={handleDeviceChange}
              getActiveDevices={getActiveDevices}
              getAvailableProblems={getAvailableProblems}
              getAvailableRemotes={getAvailableRemotes}
              devices={devices}
              tvInterfaces={tvInterfaces}
              loadingTVInterfaces={loadingTVInterfaces}
              openTVInterfaceEditor={openTVInterfaceEditor}
              openRemoteEditor={openRemoteEditor}
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
                  !formData.deviceId || !formData.problemId || !formData.title
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
                  setFilterRemote("all"); // Reset remote filter when device changes
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Приставка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приставки</SelectItem>
                  {getActiveDevices().map((device) => (
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
                  {getFilteredRemotes().map((remote) => {
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

      {/* Steps List - Grouped by Device and Problem */}
      <div className="space-y-6">
        {Object.entries(getGroupedSteps()).map(([key, group]) => (
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
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.steps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step) => (
                    <div
                      key={step.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {step.stepNumber}
                              </span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveStep(step.id, "up")}
                                disabled={step.stepNumber === 1}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveStep(step.id, "down")}
                                disabled={
                                  step.stepNumber === group.steps.length
                                }
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {step.title}
                              </h4>
                              <Badge
                                variant={
                                  step.isActive ? "default" : "secondary"
                                }
                              >
                                {step.isActive ? "Активный" : "Неактивный"}
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
                                  Пульт:{" "}
                                  {getRemoteById(step.remoteId)?.name ||
                                    "Неизвестный"}
                                </span>
                              )}
                              {step.buttonPosition && (
                                <span>
                                  Пози���ия: (
                                  {Math.round(step.buttonPosition.x)},{" "}
                                  {Math.round(step.buttonPosition.y)})
                                </span>
                              )}
                              {step.highlightTVArea && (
                                <span>ТВ: {step.highlightTVArea}</span>
                              )}
                              {step.tvInterface && (
                                <span>Интерфейс: {step.tvInterface}</span>
                              )}
                              <span>Об��овлено: {step.updatedAt}</span>
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
                            <DropdownMenuItem
                              onClick={() => openEditDialog(step)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Реда��тировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(step.id)}
                            >
                              {step.isActive ? (
                                <EyeOff className="h-4 w-4 mr-2" />
                              ) : (
                                <Eye className="h-4 w-4 mr-2" />
                              )}
                              {step.isActive
                                ? "Деактивировать"
                                : "Активировать"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(step.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remote Editor Dialog */}
      <Dialog open={isRemoteEditorOpen} onOpenChange={setIsRemoteEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Выбор позиции на пульте: {selectedRemote?.name}
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
            <DialogTitle>Редактироват�� шаг</DialogTitle>
          </DialogHeader>
          <StepFormFieldsComponent
            isEdit={true}
            formData={formData}
            handleFieldChange={handleFieldChange}
            handleDeviceChange={handleDeviceChange}
            getActiveDevices={getActiveDevices}
            getAvailableProblems={getAvailableProblems}
            getAvailableRemotes={getAvailableRemotes}
            devices={devices}
            tvInterfaces={tvInterfaces}
            loadingTVInterfaces={loadingTVInterfaces}
            openTVInterfaceEditor={openTVInterfaceEditor}
            openRemoteEditor={openRemoteEditor}
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
                !formData.deviceId || !formData.problemId || !formData.title
              }
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {Object.keys(getGroupedSteps()).length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Шаги не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте измени��ь филь��ры поиска или создайте новый шаг.
            </p>
          </CardContent>
        </Card>
      )}

      {/* TV Interface Area Editor Dialog */}
      <Dialog
        open={isTVInterfaceEditorOpen}
        onOpenChange={setIsTVInterfaceEditorOpen}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Редакто�� областей интерфейса: {selectedTVInterface?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTVInterface && (
            <TVInterfaceAreaEditor
              tvInterface={selectedTVInterface}
              onSave={handleTVInterfaceAreaSave}
            />
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsTVInterfaceEditorOpen(false)}
            >
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Created TV Interfaces Section */}
      {formData.deviceId &&
        formData.deviceId !== "all" &&
        tvInterfaces.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Созданные интерфейсы для устройства
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tvInterfaces.map((tvInterface) => (
                  <Card key={tvInterface.id} className="relative">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Interface Preview */}
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          {tvInterface.screenshotData ? (
                            <img
                              src={tvInterface.screenshotData}
                              alt={tvInterface.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Tv className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Interface Info */}
                        <div>
                          <h4 className="font-medium text-sm">
                            {tvInterface.name}
                          </h4>
                          <p className="text-xs text-gray-500 capitalize">
                            {tvInterface.type}
                          </p>
                          {tvInterface.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {tvInterface.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              tvInterface.isActive ? "default" : "secondary"
                            }
                          >
                            {tvInterface.isActive ? "Активен" : "Неактивен"}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTVInterfaceEditor(tvInterface)}
                            >
                              <Target className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  tvInterfaceId: tvInterface.id,
                                })
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default StepsManager;
