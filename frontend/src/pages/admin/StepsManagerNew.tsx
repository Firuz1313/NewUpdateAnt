import { useState, useRef, useEffect, useCallback } from "react";
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
  Home,
  Grid3X3,
  AlertTriangle,
  Crosshair,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  tvInterfacesAPI,
  TVInterfaceAPI,
  ClickableArea,
  HighlightArea,
} from "@/api/tvInterfaces";
import { tvInterfaceMarksAPI, TVInterfaceMark } from "@/api/tvInterfaceMarks";
import { useDevices } from "@/hooks/useDevices";
import { useProblems } from "@/hooks/useProblems";
import { stepsApi, remotesApi } from "@/api";

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
  tvInterfaceId?: string; // Обновлено для работы с настоя��ими интерфейсами
  requiredAction?: string;
  hint?: string;
  remoteId?: string;
  buttonPosition?: { x: number; y: number };
  tvAreaPosition?: { x: number; y: number }; // Позиция на ТВ
  tvAreaRect?: { x: number; y: number; width: number; height: number }; // П��ямоугольник на ТВ
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const StepsManagerNew = () => {
  // API hooks
  const { devices } = useDevices();
  const { problems } = useProblems();

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

      // Load steps (paginated, limited)
      const stepsResponse = await stepsApi.getSteps(1, 100);
      const stepsData = stepsResponse?.data || (stepsResponse as any) || [];
      setSteps(stepsData);

      // Load remotes (limited)
      const remotesResponse = await remotesApi.getAll({ limit: 200 });
      const remotesData = remotesResponse?.data || remotesResponse || [];
      setRemotes(remotesData);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Состояние для ТВ интерфейсов
  const [tvInterfaces, setTVInterfaces] = useState<TVInterfaceAPI[]>([]);
  const [selectedTVInterface, setSelectedTVInterface] =
    useState<TVInterfaceAPI | null>(null);
  const [isLoadingTVInterfaces, setIsLoadingTVInterfaces] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tvCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterProblem, setFilterProblem] = useState<string>("all");
  const [filterRemote, setFilterRemote] = useState<string>("all");
  const [selectedStep, setSelectedStep] = useState<DiagnosticStep | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoteEditorOpen, setIsRemoteEditorOpen] = useState(false);
  const [isTVEditorOpen, setIsTVEditorOpen] = useState(false);

  // Remote editor state
  const [selectedRemote, setSelectedRemote] = useState<any>(null);
  const [isPickingRemoteButton, setIsPickingRemoteButton] = useState(false);
  const [isPickingTVArea, setIsPickingTVArea] = useState(false);
  const [customRemoteImage, setCustomRemoteImage] = useState<string | null>(
    null,
  );

  const [formData, setFormData] = useState({
    deviceId: "",
    problemId: "",
    title: "",
    description: "",
    instruction: "",
    highlightRemoteButton: "none",
    highlightTVArea: "none",
    tvInterfaceId: "none",
    requiredAction: "",
    hint: "",
    remoteId: "none",
    buttonPosition: { x: 0, y: 0 },
    tvAreaPosition: { x: 0, y: 0 },
    tvAreaRect: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Загрузка ТВ интерфейсов п��и изменении устройства
  useEffect(() => {
    if (formData.deviceId && formData.deviceId !== "") {
      loadTVInterfacesForDevice(formData.deviceId);
    }
  }, [formData.deviceId]);

  const loadTVInterfacesForDevice = async (deviceId: string) => {
    try {
      setIsLoadingTVInterfaces(true);
      const response = await tvInterfacesAPI.getByDeviceId(deviceId);
      if (response.success && response.data) {
        setTVInterfaces(response.data);
      }
    } catch (error) {
      console.error("Error loading TV interfaces for device:", error);
      setTVInterfaces([]);
    } finally {
      setIsLoadingTVInterfaces(false);
    }
  };

  // Загрузка отметок для TV ��нтерфейса

  // Сох��анение отметок TV интерфейса
  const saveTVInterfaceMarks = async (marks: TVInterfaceMark[]) => {
    try {
      // Здесь можно реализ��вать ло��ику сохранения всех отметок
      // Для простоты сейчас пр��сто обновляем локальное состояние

      // Если есть выбранный шаг, связываем отметки с эт��м шагом
      if (selectedStep?.id) {
        for (const mark of marks) {
          if (mark.step_id !== selectedStep.id) {
            // Обновляем отметку, чтобы связать её с текущим шагом
            const updateData = { step_id: selectedStep.id };
            await tvInterfaceMarksAPI.update(mark.id, updateData);
          }
        }
      }

      console.log("TV interface marks saved:", marks);
    } catch (error) {
      console.error("Error saving TV interface marks:", error);
    }
  };

  // Сохранение отметки TV интерфейса для шага
  const saveTVInterfaceMarkForStep = async (
    stepId: string,
    tvInterfaceId: string,
    formData: any,
  ) => {
    try {
      // Create a TV interface mark based on the step's TV area data
      if (
        formData.tvAreaRect &&
        formData.tvAreaRect.width > 0 &&
        formData.tvAreaRect.height > 0
      ) {
        // Rectangle area marking
        const markData = {
          tv_interface_id: tvInterfaceId,
          step_id: stepId,
          name: `Область для "${formData.title}"`,
          description: `Интерактивная область для шага: ${formData.description}`,
          mark_type: "area" as const,
          shape: "rectangle" as const,
          position: { x: formData.tvAreaRect.x, y: formData.tvAreaRect.y },
          size: {
            width: formData.tvAreaRect.width,
            height: formData.tvAreaRect.height,
          },
          color: "#3b82f6",
          border_color: "#2563eb",
          border_width: 2,
          opacity: 0.3,
          is_clickable: true,
          is_highlightable: true,
          hint_text: formData.hint || "Нажмите на эту область",
          animation: "pulse" as const,
          priority: "normal" as const,
        };

        await tvInterfaceMarksAPI.create(markData);
      } else if (
        formData.tvAreaPosition.x > 0 &&
        formData.tvAreaPosition.y > 0
      ) {
        // Point marking
        const markData = {
          tv_interface_id: tvInterfaceId,
          step_id: stepId,
          name: `Точка для "${formData.title}"`,
          description: `Точка взаимодействия для шага: ${formData.description}`,
          mark_type: "point" as const,
          shape: "circle" as const,
          position: formData.tvAreaPosition,
          size: { width: 20, height: 20 },
          color: "#ef4444",
          border_color: "#dc2626",
          border_width: 2,
          opacity: 0.8,
          is_clickable: true,
          is_highlightable: true,
          hint_text: formData.hint || "Нажмите здесь",
          animation: "pulse" as const,
          priority: "high" as const,
        };

        await tvInterfaceMarksAPI.create(markData);
      }

      console.log("TV interface mark saved for step:", stepId);
    } catch (error) {
      console.error("Error saving TV interface mark:", error);
    }
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
    if (formData.deviceId) {
      return (problems || []).filter(
        (p) => p.deviceId === formData.deviceId && p.status === "published",
      );
    }
    return (problems || []).filter((p) => p.status === "published");
  };

  const getAvailableRemotes = () => {
    if (formData.deviceId) {
      return (remotes || []).filter((r) => r.deviceId === formData.deviceId);
    }
    return (remotes || []).filter((r) => r.isActive);
  };

  const getFilteredRemotes = () => {
    if (filterDevice === "all") {
      return (remotes || []).filter((r) => r.isActive);
    }
    return (remotes || []).filter((r) => r.deviceId === filterDevice);
  };

  const getAvailableTVInterfaces = () => {
    return tvInterfaces.filter((iface) => iface.is_active !== false);
  };

  const getTVInterfaceById = (id: string) => {
    return tvInterfaces.find((iface) => iface.id === id);
  };

  const openTVEditor = () => {
    if (formData.tvInterfaceId && formData.tvInterfaceId !== "none") {
      const tvInterface = getTVInterfaceById(formData.tvInterfaceId);
      setSelectedTVInterface(tvInterface || null);
      setIsTVEditorOpen(true);
    }
  };

  const handleCreate = async () => {
    try {
      const deviceSteps = steps.filter(
        (s) =>
          s.deviceId === formData.deviceId &&
          s.problemId === formData.problemId,
      );
      const maxStepNumber =
        deviceSteps.length > 0
          ? Math.max(...deviceSteps.map((s) => s.stepNumber))
          : 0;

      const stepData = {
        deviceId: formData.deviceId,
        problemId: formData.problemId,
        title: formData.title,
        description: formData.description,
        instruction: formData.instruction,
        tvInterfaceId:
          formData.tvInterfaceId === "none"
            ? undefined
            : formData.tvInterfaceId,
        remoteId: formData.remoteId === "none" ? undefined : formData.remoteId,
        buttonPosition:
          formData.buttonPosition.x === 0 && formData.buttonPosition.y === 0
            ? undefined
            : formData.buttonPosition,
        tvAreaPosition:
          formData.tvAreaPosition.x === 0 && formData.tvAreaPosition.y === 0
            ? undefined
            : formData.tvAreaPosition,
        tvAreaRect:
          !formData.tvAreaRect ||
          formData.tvAreaRect.width === 0 ||
          formData.tvAreaRect.height === 0
            ? undefined
            : formData.tvAreaRect,
        stepNumber: maxStepNumber + 1,
        hint: formData.hint,
        requiredAction: formData.requiredAction,
        isActive: true,
      };

      // Create step via API
      const createdStep = await stepsApi.createStep(stepData);

      // If step has TV interface markings, save them
      if (
        createdStep &&
        formData.tvInterfaceId !== "none" &&
        (formData.tvAreaPosition.x > 0 || formData.tvAreaRect?.width > 0)
      ) {
        await saveTVInterfaceMarkForStep(
          createdStep.id,
          formData.tvInterfaceId,
          formData,
        );
      }

      // Reload steps
      await loadInitialData();

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating step:", error);
    }
  };

  const handleEdit = async () => {
    if (!selectedStep) return;

    const updatedData = {
      title: formData.title,
      description: formData.description,
      instruction: formData.instruction,
      tvInterfaceId:
        formData.tvInterfaceId === "none" ? undefined : formData.tvInterfaceId,
      remoteId: formData.remoteId === "none" ? undefined : formData.remoteId,
      buttonPosition:
        formData.buttonPosition.x === 0 && formData.buttonPosition.y === 0
          ? undefined
          : formData.buttonPosition,
      tvAreaPosition:
        formData.tvAreaPosition.x === 0 && formData.tvAreaPosition.y === 0
          ? undefined
          : formData.tvAreaPosition,
      tvAreaRect:
        !formData.tvAreaRect ||
        formData.tvAreaRect.width === 0 ||
        formData.tvAreaRect.height === 0
          ? undefined
          : formData.tvAreaRect,
      hint: formData.hint,
      requiredAction: formData.requiredAction,
    };

    try {
      await stepsApi.updateStep(selectedStep.id, updatedData);

      // If step has TV interface markings, update them
      if (
        formData.tvInterfaceId !== "none" &&
        (formData.tvAreaPosition.x > 0 || formData.tvAreaRect?.width > 0)
      ) {
        // Delete existing marks for this step and create new ones
        await tvInterfaceMarksAPI.deleteByStepId(selectedStep.id);
        await saveTVInterfaceMarkForStep(
          selectedStep.id,
          formData.tvInterfaceId,
          formData,
        );
      }

      // Reload steps
      await loadInitialData();

      setIsEditDialogOpen(false);
      setSelectedStep(null);
      resetForm();
    } catch (error) {
      console.error("Error updating step:", error);
    }
  };

  const handleDelete = async (stepId: string) => {
    try {
      // Delete TV interface marks for this step first
      await tvInterfaceMarksAPI.deleteByStepId(stepId);

      // Delete the step
      await stepsApi.deleteStep(stepId);

      // Reload steps
      await loadInitialData();
    } catch (error) {
      console.error("Error deleting step:", error);
    }
  };

  const handleToggleStatus = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    try {
      await stepsApi.updateStep(stepId, {
        isActive: !step.isActive,
      });

      // Reload steps
      await loadInitialData();
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

    try {
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
      tvInterfaceId: step.tvInterfaceId || "none",
      requiredAction: step.requiredAction || "",
      hint: step.hint || "",
      remoteId: step.remoteId || "none",
      buttonPosition: step.buttonPosition || { x: 0, y: 0 },
      tvAreaPosition: step.tvAreaPosition || { x: 0, y: 0 },
    });

    // Загрузить интер��ейсы ��ля текущего устро��ства
    if (step.deviceId) {
      loadTVInterfacesForDevice(step.deviceId);
    }

    setIsEditDialogOpen(true);
  };

  const openRemoteEditor = () => {
    const remote = getRemoteById(formData.remoteId);
    if (remote) {
      setSelectedRemote(remote);
      setIsRemoteEditorOpen(true);
    }
  };

  const openTVEditor = () => {
    const tvInterface = getTVInterfaceById(formData.tvInterfaceId);
    if (tvInterface) {
      setSelectedTVInterface(tvInterface);
      setIsTVEditorOpen(true);
    }
  };

  const openTVAreaPicker = () => {
    const tvInterface = getTVInterfaceById(formData.tvInterfaceId);
    if (tvInterface) {
      setSelectedTVInterface(tvInterface);
      setIsTVEditorOpen(true);
    }
  };

  const handleRemoteCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (!isPickingRemoteButton || !canvasRef.current) return;

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

    setIsPickingRemoteButton(false);
  };

  // Drag-based rectangle selection on TV canvas
  const tvDragState = useRef<{
    startX: number;
    startY: number;
    dragging: boolean;
  }>({ startX: 0, startY: 0, dragging: false });

  const handleTVMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPickingTVArea || !tvCanvasRef.current) return;
    const canvas = tvCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    tvDragState.current = { startX: x, startY: y, dragging: true };
    setFormData((prev) => ({
      ...prev,
      tvAreaPosition: { x, y },
      tvAreaRect: { x, y, width: 0, height: 0 },
    }));
  };

  const handleTVMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      !isPickingTVArea ||
      !tvCanvasRef.current ||
      !tvDragState.current.dragging
    )
      return;
    const canvas = tvCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const startX = tvDragState.current.startX;
    const startY = tvDragState.current.startY;
    const width = Math.max(1, Math.abs(x - startX));
    const height = Math.max(1, Math.abs(y - startY));
    const rectData = {
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width,
      height,
    };
    setFormData((prev) => ({ ...prev, tvAreaRect: rectData }));
  };

  const handleTVMouseUp = () => {
    if (!isPickingTVArea) return;
    tvDragState.current.dragging = false;
    setIsPickingTVArea(false);
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
      tvInterfaceId: "none",
      requiredAction: "",
      hint: "",
      remoteId: "none",
      buttonPosition: { x: 0, y: 0 },
      tvAreaPosition: { x: 0, y: 0 },
    });
    setCustomRemoteImage(null);
    setTVInterfaces([]);
  };

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
    [remotes],
  );

  const getDeviceName = (deviceId: string) => {
    const device = (devices || []).find((d) => d.id === deviceId);
    return device?.name || "Неизвестная приставка";
  };

  const getProblemTitle = (problemId: string) => {
    const problem = (problems || []).find((p) => p.id === problemId);
    return problem?.title || "Неизвестная проблема";
  };

  const getRemoteById = (remoteId: string) => {
    return (remotes || []).find((r) => r.id === remoteId);
  };

  const getDefaultRemoteForDevice = (deviceId: string) => {
    return (remotes || []).find((r) => r.deviceId === deviceId && r.isDefault);
  };

  const getActiveDevices = () => {
    return (devices || []).filter((d) => d.isActive);
  };

  const getTVInterfaceName = (tvInterfaceId: string) => {
    const tvInterface = getTVInterfaceById(tvInterfaceId);
    return tvInterface?.name || "Неиз��естный интерфейс";
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
              onClick={handleRemoteCanvasClick}
            />

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

        <div className="w-full lg:w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Выбор позиции на пульте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={isPickingRemoteButton ? "default" : "outline"}
                  onClick={() =>
                    setIsPickingRemoteButton(!isPickingRemoteButton)
                  }
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isPickingRemoteButton ? "Отменить выбор" : "Выбрать позицию"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Загр��зить изображение
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {isPickingRemoteButton && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <Crosshair className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Кликните на изображение пульта, чтобы указать позицию
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
                        {Math.round(formData.buttonPosition.x)},{" "}
                        {Math.round(formData.buttonPosition.y)})
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

  const renderTVEditor = () => {
    if (!selectedTVInterface) return null;

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative">
            {selectedTVInterface.screenshot_data ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedTVInterface.screenshot_data}
                  alt={selectedTVInterface.name}
                  className="max-w-full max-h-full object-contain rounded"
                  style={{
                    width: "800px",
                    height: "450px",
                    objectFit: "contain",
                  }}
                />
                <canvas
                  ref={tvCanvasRef}
                  width={800}
                  height={450}
                  className="absolute inset-0 cursor-crosshair"
                  style={{
                    width: "800px",
                    height: "450px",
                  }}
                  onMouseDown={handleTVMouseDown}
                  onMouseMove={handleTVMouseMove}
                  onMouseUp={handleTVMouseUp}
                />
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={tvCanvasRef}
                  width={800}
                  height={450}
                  className="border border-gray-300 dark:border-gray-600 rounded cursor-crosshair mx-auto"
                  style={{
                    backgroundColor: "#f3f4f6",
                  }}
                  onClick={handleTVCanvasClick}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-500">
                    <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      Изображение интерфейса не загружено
                    </p>
                    <p className="text-sm">
                      Загрузите изображение в разделе "Интерфейсы ТВ"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Выбранная область (прямоугольник) или точка (fallback) */}
            {formData.tvAreaRect &&
            formData.tvAreaRect.width > 0 &&
            formData.tvAreaRect.height > 0 ? (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none z-10"
                style={{
                  left: `${(formData.tvAreaRect.x / 800) * 100}%`,
                  top: `${(formData.tvAreaRect.y / 450) * 100}%`,
                  width: `${(formData.tvAreaRect.width / 800) * 100}%`,
                  height: `${(formData.tvAreaRect.height / 450) * 100}%`,
                }}
              />
            ) : (
              formData.tvAreaPosition.x > 0 &&
              formData.tvAreaPosition.y > 0 && (
                <div
                  className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-lg pointer-events-none z-10"
                  style={{
                    left: `${(formData.tvAreaPosition.x / 800) * 100}%`,
                    top: `${(formData.tvAreaPosition.y / 450) * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Выбор области на ТВ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant={isPickingTVArea ? "default" : "outline"}
                onClick={() => setIsPickingTVArea(!isPickingTVArea)}
                className="w-full"
              >
                <Target className="h-4 w-4 mr-2" />
                {isPickingTVArea
                  ? "Завершить выделение"
                  : "Выбрать область (пе��етащите мышью)"}
              </Button>

              {isPickingTVArea && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Потяните мышью по экрану ТВ, чтобы выделить прямоугольную
                      область
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {formData.tvAreaPosition.x > 0 &&
                formData.tvAreaPosition.y > 0 && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      {formData.tvAreaRect &&
                      formData.tvAreaRect.width > 0 &&
                      formData.tvAreaRect.height > 0 ? (
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Область на ТВ: ({Math.round(formData.tvAreaRect.x)},{" "}
                          {Math.round(formData.tvAreaRect.y)}) —{" "}
                          {Math.round(formData.tvAreaRect.width)}×
                          {Math.round(formData.tvAreaRect.height)}
                        </p>
                      ) : (
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Позиция на ТВ: (
                          {Math.round(formData.tvAreaPosition.x)},{" "}
                          {Math.round(formData.tvAreaPosition.y)})
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

              {/* Спис��к областей интерфейса */}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const StepFormFields = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? "edit-deviceId" : "deviceId"}>
            Приставка
          </Label>
          <Select value={formData.deviceId} onValueChange={handleDeviceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Выбери��е приставку" />
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
              <SelectValue placeholder="Выберите ��роблему" />
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
          placeholder="Введ��те название шага"
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
          placeholder="Краткое описание ��ага"
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
          Интерфейс ТВ
        </Label>
        <div className="flex space-x-2">
          <Select
            value={formData.tvInterfaceId}
            onValueChange={(value) => handleFieldChange("tvInterfaceId", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Выберите интерфейс ��В" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без интерфейса</SelectItem>
              {isLoadingTVInterfaces ? (
                <SelectItem value="loading" disabled>
                  Загрузка...
                </SelectItem>
              ) : (
                getAvailableTVInterfaces().map((tvInterface) => (
                  <SelectItem key={tvInterface.id} value={tvInterface.id}>
                    <div className="flex items-center">
                      <Monitor className="h-3 w-3 mr-2" />
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
              onClick={openTVEditor}
              size="sm"
              className="whitespace-nowrap"
              title="Открыть ��едактор отметок интерфейса ТВ"
            >
              <Target className="h-4 w-4 mr-1" />
              Отметки
            </Button>
          )}
        </div>

        {/* TV Interface Position Status */}
        {formData.tvInterfaceId !== "none" &&
          formData.tvAreaPosition.x > 0 &&
          formData.tvAreaPosition.y > 0 && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Позиция на ТВ: ({formData.tvAreaPosition.x},{" "}
                    {formData.tvAreaPosition.y})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openTVEditor}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Изменить
                </Button>
              </div>
            </div>
          )}
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-remoteId" : "remoteId"}>Пульт</Label>
        <div className="flex space-x-2">
          <Select
            value={formData.remoteId}
            onValueChange={(value) => handleFieldChange("remoteId", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Выберите пульт" />
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
                          (по умолча��ию)
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
        <Label htmlFor={isEdit ? "edit-requiredAction" : "requiredAction"}>
          Требуемое действие
        </Label>
        <Input
          id={isEdit ? "edit-requiredAction" : "requiredAction"}
          value={formData.requiredAction}
          onChange={(e) => handleFieldChange("requiredAction", e.target.value)}
          placeholder="Действие для автоперехода"
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-hint" : "hint"}>Подсказка</Label>
        <Textarea
          id={isEdit ? "edit-hint" : "hint"}
          value={formData.hint}
          onChange={(e) => handleFieldChange("hint", e.target.value)}
          placeholder="Дополнительна�� подсказка для пользоват���ля"
        />
      </div>

      {formData.buttonPosition.x > 0 && formData.buttonPosition.y > 0 && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <Target className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm text-green-700 dark:text-green-300">
              Позиция кнопки на пульте: ({Math.round(formData.buttonPosition.x)}
              , {Math.round(formData.buttonPosition.y)})
            </p>
          </AlertDescription>
        </Alert>
      )}

      {formData.tvAreaPosition.x > 0 && formData.tvAreaPosition.y > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <Target className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Позиция обл��сти на ТВ: ({Math.round(formData.tvAreaPosition.x)},{" "}
              {Math.round(formData.tvAreaPosition.y)})
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление шагами
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание шагов диагностики с привязкой к приставкам, проблемам и
            интерфейсам ТВ
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
            <StepFormFields />
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
                  setFilterRemote("all");
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
                                  ��втопереход
                                </Badge>
                              )}
                              {step.remoteId && (
                                <Badge variant="outline">
                                  <MousePointer className="h-3 w-3 mr-1" />
                                  Пу��ьт
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
                                  Позиция пульта
                                </Badge>
                              )}
                              {step.tvAreaPosition && (
                                <Badge variant="outline">
                                  <Target className="h-3 w-3 mr-1" />
                                  Позиция ТВ
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
                              {step.tvInterfaceId && (
                                <span>
                                  ТВ: {getTVInterfaceName(step.tvInterfaceId)}
                                </span>
                              )}
                              {step.buttonPosition && (
                                <span>
                                  Пульт: ({Math.round(step.buttonPosition.x)},{" "}
                                  {Math.round(step.buttonPosition.y)})
                                </span>
                              )}
                              {step.tvAreaPosition && (
                                <span>
                                  ТВ: ({Math.round(step.tvAreaPosition.x)},{" "}
                                  {Math.round(step.tvAreaPosition.y)})
                                </span>
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
                            <DropdownMenuItem
                              onClick={() => openEditDialog(step)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
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
                                ? "Д��активировать"
                                : "Активировать"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(step.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Уд��лить
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

      {/* TV Editor Dialog */}
      <Dialog open={isTVEditorOpen} onOpenChange={setIsTVEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Выбор об��асти на ТВ: {selectedTVInterface?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">{renderTVEditor()}</div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsTVEditorOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => setIsTVEditorOpen(false)}>
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
            <DialogTitle>Редактировать ��аг</DialogTitle>
          </DialogHeader>
          <StepFormFields isEdit={true} />
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
              С��хранить
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
              Попробуйте изменит�� фильтры поиска или создайте новый шаг.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepsManagerNew;
