import React, { useState, useRef } from "react";
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
  Upload,
  Download,
  Copy,
  Eye,
  MoreVertical,
  Smartphone as RemoteIcon,
  Palette,
  Settings,
  ImageIcon,
  Target,
  Save,
  MousePointer,
  Monitor,
  Crosshair,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RemoteControl from "@/components/RemoteControl";
import { useDevices } from "@/hooks/useDevices";
import {
  useRemotes,
  useCreateRemote,
  useUpdateRemote,
  useDeleteRemote,
  useSetDefaultRemote,
  useDuplicateRemote,
} from "@/hooks/useRemotes";
import { toast } from "sonner";
import type { RemoteFilters } from "@/api/remotes";
import { remotesApi } from "@/api";

console.log("���🔥🔥 RemoteBuilder: FILE LOADED! Imports completed! ��🔥🔥");

interface RemoteButton {
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  shape: "rectangle" | "circle" | "rounded" | "custom";
  color: string;
  textColor: string;
  fontSize: number;
  action: string;
  isVisible: boolean;
}

// Using backend API schema format
interface RemoteTemplate {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  description: string;
  layout: "standard" | "compact" | "smart" | "custom";
  colorScheme: string;
  imageUrl?: string;
  imageData?: string;
  svgData?: string;
  dimensions: { width: number; height: number };
  buttons: RemoteButton[];
  zones?: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    description?: string;
  }>;
  deviceId?: string | null;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  last_used?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const RemoteBuilder = () => {
  console.log("🔥🔥🔥 RemoteBuilder: COMPONENT STARTED! 🔥🔥🔥");

  const { data: devicesResponse } = useDevices();

  // Simple test of remotesApi
  React.useEffect(() => {
    console.log(
      "🚀🚀🚀 RemoteBuilder: useEffect STARTED! Testing remotesApi directly 🚀🚀🚀",
    );
    console.log("🚀🚀🚀 RemoteBuilder: remotesApi object:", remotesApi);
    console.log(
      "🚀🚀��� RemoteBuilder: remotesApi.getAll function:",
      remotesApi.getAll,
    );

    remotesApi
      .getAll()
      .then((result) => {
        console.log(
          "✅✅✅ RemoteBuilder: remotesApi.getAll SUCCESS ✅✅✅",
          result,
        );
      })
      .catch((error) => {
        console.error(
          "❌❌❌ RemoteBuilder: remotesApi.getAll ERROR ❌❌❌",
          error,
        );
      });
  }, []);

  console.log("🚀🚀🚀 RemoteBuilder: About to call useRemotes hook! 🚀🚀🚀");
  const {
    data: remotesResponse,
    isLoading: remotesLoading,
    error: remotesError,
  } = useRemotes();
  console.log("📊📊���� RemoteBuilder: useRemotes returned:", {
    remotesResponse,
    remotesLoading,
    remotesError,
  });

  const createRemoteMutation = useCreateRemote();
  const updateRemoteMutation = useUpdateRemote();
  const deleteRemoteMutation = useDeleteRemote();
  const setDefaultMutation = useSetDefaultRemote();
  const duplicateMutation = useDuplicateRemote();

  // Изв��екаем массивы данны�� из ответа API
  const devices = devicesResponse?.data || [];
  const remotes: RemoteTemplate[] = remotesResponse?.data || [];
  const getActiveDevices = () =>
    devices.filter((d: any) => d.isActive === true);
  const getDeviceById = (id: string) => devices.find((d: any) => d.id === id);
  const getRemotesForDevice = (deviceId: string) =>
    remotes.filter((r: any) => r.deviceId === deviceId);
  const canDeleteRemote = (id: string) => ({ canDelete: true, reason: "" });
  const getRemoteUsageCount = (id: string) => {
    const remote = remotes.find((r) => r.id === id);
    return remote?.usageCount || 0;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editorFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedRemote, setSelectedRemote] = useState<RemoteTemplate | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [remoteToDelete, setRemoteToDelete] = useState<RemoteTemplate | null>(
    null,
  );
  const [filterLayout, setFilterLayout] = useState<string>("all");
  const [filterDevice, setFilterDevice] = useState<string>("all");

  // Editor state
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedButton, setSelectedButton] = useState<RemoteButton | null>(
    null,
  );
  const [isCreatingButton, setIsCreatingButton] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    manufacturer: "",
    model: "",
    description: "",
    layout: "standard" as RemoteTemplate["layout"],
    colorScheme: "dark",
    deviceId: "universal",
  });

  const [buttonFormData, setButtonFormData] = useState({
    label: "",
    action: "",
    shape: "rectangle" as RemoteButton["shape"],
    color: "#4B5563",
    textColor: "#FFFFFF",
    fontSize: 12,
  });

  const activeDevices = getActiveDevices();

  const layouts = [
    { value: "standard", label: "Стандартный" },
    { value: "compact", label: "Компактный" },
    { value: "smart", label: "Умный ТВ" },
    { value: "custom", label: "Пользовательский" },
  ];

  const colorSchemes = [
    { value: "dark", label: "Темная", preview: "bg-gray-800" },
    { value: "light", label: "Светлая", preview: "bg-gray-200" },
    { value: "blue", label: "Синяя", preview: "bg-blue-600" },
    { value: "red", label: "Красная", preview: "bg-red-600" },
    { value: "green", label: "Зеленая", preview: "bg-green-600" },
  ];

  const actionTypes = [
    "power",
    "home",
    "back",
    "settings",
    "ok",
    "up",
    "down",
    "left",
    "right",
    "vol-up",
    "vol-down",
    "mute",
    "number-1",
    "number-2",
    "number-3",
    "number-4",
    "number-5",
    "number-6",
    "number-7",
    "number-8",
    "number-9",
    "number-0",
    "menu",
    "guide",
    "info",
    "exit",
    "red",
    "green",
    "yellow",
    "blue",
  ];

  const filteredRemotes = remotes.filter((remote) => {
    const matchesSearch =
      remote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remote.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remote.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLayout =
      filterLayout === "all" || remote.layout === filterLayout;
    const matchesDevice =
      filterDevice === "all" ||
      remote.deviceId === filterDevice ||
      (filterDevice === "universal" &&
        (!remote.deviceId || remote.deviceId === ""));
    return matchesSearch && matchesLayout && matchesDevice;
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    try {
      await createRemoteMutation.mutateAsync({
        name: formData.name,
        manufacturer: formData.manufacturer,
        model: formData.model,
        description: formData.description,
        device_id: formData.deviceId === "universal" ? null : formData.deviceId,
        layout: formData.layout,
        color_scheme: formData.colorScheme,
        dimensions: { width: 400, height: 600 },
        buttons: [],
        zones: [],
        image_data: previewImageUrl || undefined,
        is_default: false,
        is_active: true,
      });

      toast.success("Пульт создан успешно");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating remote:", error);
      toast.error(error?.message || "Ошиб��а при создании пульта");
    }
  };

  const handleEdit = async () => {
    if (!selectedRemote) return;

    try {
      await updateRemoteMutation.mutateAsync({
        id: selectedRemote.id,
        data: {
          name: formData.name,
          manufacturer: formData.manufacturer,
          model: formData.model,
          description: formData.description,
          device_id:
            formData.deviceId === "universal" ? null : formData.deviceId,
          layout: formData.layout,
          color_scheme: formData.colorScheme,
          image_data: previewImageUrl || selectedRemote.imageData,
        },
      });

      toast.success("Пульт обновлен успеш��о");
      setIsEditDialogOpen(false);
      setSelectedRemote(null);
      resetForm();
    } catch (error: any) {
      console.error("Error updating remote:", error);
      toast.error(error?.message || "Ошибка при обновлен��и пульта");
    }
  };

  const openDeleteModal = (remote: RemoteTemplate) => {
    setRemoteToDelete(remote);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!remoteToDelete) return;

    const deleteCheck = canDeleteRemote(remoteToDelete.id);
    if (!deleteCheck.canDelete) {
      toast.error(deleteCheck.reason);
      setIsDeleteModalOpen(false);
      setRemoteToDelete(null);
      return;
    }

    try {
      await deleteRemoteMutation.mutateAsync(remoteToDelete.id);
      toast.success("Пульт удален успешно");

      // Close the modal
      setIsDeleteModalOpen(false);
      setRemoteToDelete(null);
    } catch (error: any) {
      console.error("Error deleting remote:", error);
      toast.error(error?.message || "Ошибка при удалении пульта");

      // Close the modal
      setIsDeleteModalOpen(false);
      setRemoteToDelete(null);
    }
  };

  const handleToggleStatus = async (remoteId: string) => {
    const remote = remotes.find((r) => r.id === remoteId);
    if (!remote) return;

    try {
      await updateRemoteMutation.mutateAsync({
        id: remoteId,
        data: {
          is_active: !remote.isActive,
        },
      });
      toast.success(
        `Пульт ${remote.isActive ? "деакти��ирован" : "активирован"}`,
      );
    } catch (error: any) {
      console.error("Error toggling remote status:", error);
      toast.error(error?.message || "Ошибка при изменении статуса пульта");
    }
  };

  const handleSetDefault = async (remoteId: string) => {
    const remote = remotes.find((r) => r.id === remoteId);
    if (!remote?.deviceId) return;

    try {
      await setDefaultMutation.mutateAsync({
        remoteId,
        deviceId: remote.deviceId,
      });
      toast.success("Пульт устано����ен по умолчанию");
    } catch (error: any) {
      console.error("Error setting default remote:", error);
      toast.error(error?.message || "Ошибка при установке пульта по умолчанию");
    }
  };

  const handleDuplicate = async (remote: RemoteTemplate) => {
    try {
      await duplicateMutation.mutateAsync({
        id: remote.id,
        data: {
          name: `${remote.name} (копия)`,
        },
      });
      toast.success("Пульт дублирован успешно");
    } catch (error: any) {
      console.error("Error duplicating remote:", error);
      toast.error(error?.message || "Ошибк�� при дублировани�� пульта");
    }
  };

  const openEditDialog = (remote: RemoteTemplate) => {
    setSelectedRemote(remote);
    setFormData({
      name: remote.name || "",
      manufacturer: remote.manufacturer || "",
      model: remote.model || "",
      description: remote.description || "",
      layout: remote.layout || "standard",
      colorScheme: remote.colorScheme || "dark",
      deviceId: remote.deviceId || "universal",
    });
    setPreviewImageUrl(remote.imageData || null);
    setIsEditDialogOpen(true);
  };

  const openEditorDialog = (remote: RemoteTemplate) => {
    setSelectedRemote(remote);
    setPreviewImageUrl(remote.imageData || null);
    setIsEditorDialogOpen(true);
    setIsEditingMode(false);
    setSelectedButton(null);
    setIsPickingMode(false);
  };

  const handleCanvasMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setCursorPosition({ x, y });
  };

  const handleCanvasClick = async (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (!isCreatingButton || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const newButton: RemoteButton = {
      id: Date.now().toString(),
      label: buttonFormData.label || "Кнопка",
      position: { x, y },
      size: { width: 40, height: 40 },
      shape: buttonFormData.shape,
      color: buttonFormData.color,
      textColor: buttonFormData.textColor,
      fontSize: buttonFormData.fontSize,
      action: buttonFormData.action,
      isVisible: true,
    };

    if (selectedRemote) {
      const updatedRemote = {
        ...selectedRemote,
        buttons: [...(selectedRemote.buttons || []), newButton],
      };

      try {
        await updateRemoteMutation.mutateAsync({
          id: selectedRemote.id,
          data: {
            buttons: updatedRemote.buttons,
          },
        });
        setSelectedRemote(updatedRemote);
      } catch (error) {
        console.error("Error adding button:", error);
      }
    }

    setIsCreatingButton(false);
    resetButtonForm();
  };

  const handleButtonEdit = (button: RemoteButton) => {
    if (!button || typeof button !== "object") return;

    setSelectedButton(button);
    setButtonFormData({
      label: button.label || "",
      action: button.action || "",
      shape: button.shape || "rectangle",
      color: button.color || "#3b82f6",
      textColor: button.textColor || "#ffffff",
      fontSize: button.fontSize || 12,
    });
  };

  const handleButtonUpdate = async () => {
    if (!selectedButton || !selectedRemote) return;

    const updatedButton = {
      ...selectedButton,
      ...buttonFormData,
    };

    const updatedRemote = {
      ...selectedRemote,
      buttons: (selectedRemote.buttons || [])
        .filter((b) => b && typeof b === "object")
        .map((b) => (b.id === selectedButton.id ? updatedButton : b)),
      updatedAt: new Date().toISOString().split("T")[0],
    };

    try {
      await updateRemoteMutation.mutateAsync({
        id: selectedRemote.id,
        data: {
          buttons: updatedRemote.buttons,
        },
      });
      setSelectedRemote(updatedRemote);
      setSelectedButton(null);
      resetButtonForm();
    } catch (error) {
      console.error("Error updating button:", error);
    }
  };

  const handleButtonDelete = async (buttonId: string) => {
    if (!selectedRemote) return;

    const updatedRemote = {
      ...selectedRemote,
      buttons: (selectedRemote.buttons || [])
        .filter((b) => b && typeof b === "object")
        .filter((b) => b.id !== buttonId),
      updatedAt: new Date().toISOString().split("T")[0],
    };

    try {
      await updateRemoteMutation.mutateAsync({
        id: selectedRemote.id,
        data: {
          buttons: updatedRemote.buttons,
        },
      });
      setSelectedRemote(updatedRemote);
    } catch (error) {
      console.error("Error deleting button:", error);
    }
  };

  const saveRemoteChanges = async () => {
    if (!selectedRemote) return;

    try {
      await updateRemoteMutation.mutateAsync({
        id: selectedRemote.id,
        data: selectedRemote,
      });
      setIsEditorDialogOpen(false);
    } catch (error) {
      console.error("Error saving remote changes:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      manufacturer: "",
      model: "",
      description: "",
      layout: "standard",
      colorScheme: "dark",
      deviceId: "universal",
    });
    setPreviewImageUrl(null);
    setCurrentImageFile(null);
  };

  const resetButtonForm = () => {
    setButtonFormData({
      label: "",
      action: "",
      shape: "rectangle",
      color: "#4B5563",
      textColor: "#FFFFFF",
      fontSize: 12,
    });
  };

  const renderRemoteEditor = () => {
    if (!selectedRemote) return null;

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Area */}
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={600}
              className={`border border-gray-300 dark:border-gray-600 rounded mx-auto ${
                isCreatingButton ? "cursor-crosshair" : "cursor-default"
              }`}
              style={{
                backgroundImage: previewImageUrl
                  ? `url(${previewImageUrl})`
                  : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: previewImageUrl ? "transparent" : "#f3f4f6",
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
            />

            {/* Cursor position indicator */}
            {isCreatingButton &&
              cursorPosition &&
              cursorPosition.x !== undefined &&
              cursorPosition.y !== undefined && (
                <div
                  className="absolute bg-blue-500 text-white px-2 py-1 rounded text-xs pointer-events-none"
                  style={{
                    left: `${(cursorPosition.x / 400) * 100}%`,
                    top: `${(cursorPosition.y / 600) * 100 + 10}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {Math.round(cursorPosition.x)}, {Math.round(cursorPosition.y)}
                </div>
              )}

            {/* Render buttons on canvas */}
            {(() => {
              try {
                const buttons = selectedRemote?.buttons;
                if (!buttons || !Array.isArray(buttons)) {
                  console.log("No buttons or not an array:", buttons);
                  return null;
                }

                console.log("Processing buttons:", buttons.length);

                return buttons
                  .filter((button, index) => {
                    if (!button || typeof button !== "object") {
                      console.log(`Invalid button at index ${index}:`, button);
                      return false;
                    }
                    return true;
                  })
                  .map((button, index) => {
                    try {
                      const position = button.position || { x: 0, y: 0 };
                      const size = button.size || { width: 40, height: 40 };
                      const x = position.x ?? 0;
                      const y = position.y ?? 0;
                      const width = size.width ?? 40;
                      const height = size.height ?? 40;

                      return (
                        <div
                          key={button.id || `button-${index}`}
                          className="absolute border-2 border-blue-500 cursor-pointer hover:border-blue-700 transition-colors"
                          style={{
                            left: `${(x / 400) * 100}%`,
                            top: `${(y / 600) * 100}%`,
                            width: `${(width / 400) * 100}%`,
                            height: `${(height / 600) * 100}%`,
                            backgroundColor: (button.color || "#3b82f6") + "80",
                            color: button.textColor || "#ffffff",
                            fontSize: `${button.fontSize || 12}px`,
                            borderRadius:
                              button.shape === "circle"
                                ? "50%"
                                : button.shape === "rounded"
                                  ? "8px"
                                  : "0",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (button && typeof button === "object") {
                              handleButtonEdit(button);
                            }
                          }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {button.label || "Button"}
                          </span>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                        </div>
                      );
                    } catch (error) {
                      console.error(
                        "Error rendering button at index",
                        index,
                        ":",
                        error,
                        button,
                      );
                      return null;
                    }
                  });
              } catch (error) {
                console.error("Error in button rendering:", error);
                return (
                  <div className="text-red-500 p-2">
                    Error rendering buttons: {error.message}
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full lg:w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Управление
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={isCreatingButton ? "default" : "outline"}
                  onClick={() => {
                    setIsCreatingButton(!isCreatingButton);
                    setSelectedButton(null);
                  }}
                  className="w-full"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  {isCreatingButton ? "Отменить" : "Выбрать позицию"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => editorFileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Изображение
                </Button>
              </div>

              <input
                ref={editorFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {isCreatingButton && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <Crosshair className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="text-sm">
                        Кликните на изображение пульта д��я добавления кнопки
                      </p>
                      <div>
                        <Label htmlFor="button-label">Название кнопки</Label>
                        <Input
                          id="button-label"
                          value={buttonFormData.label || ""}
                          onChange={(e) =>
                            setButtonFormData({
                              ...buttonFormData,
                              label: e.target.value,
                            })
                          }
                          placeholder="Напри��ер: POWER"
                        />
                      </div>
                      <div>
                        <Label htmlFor="button-action">Действие</Label>
                        <Select
                          value={buttonFormData.action}
                          onValueChange={(value) =>
                            setButtonFormData({
                              ...buttonFormData,
                              action: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите действие" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map((action) => (
                              <SelectItem key={action} value={action}>
                                {action}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {selectedButton && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <Edit className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">
                        Редактир��вание: {selectedButton.label}
                      </p>
                      <div>
                        <Label htmlFor="edit-button-label">Название</Label>
                        <Input
                          id="edit-button-label"
                          value={buttonFormData.label || ""}
                          onChange={(e) =>
                            setButtonFormData({
                              ...buttonFormData,
                              label: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-button-action">Действие</Label>
                        <Select
                          value={buttonFormData.action}
                          onValueChange={(value) =>
                            setButtonFormData({
                              ...buttonFormData,
                              action: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map((action) => (
                              <SelectItem key={action} value={action}>
                                {action}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleButtonUpdate} size="sm">
                          <Save className="h-3 w-3 mr-1" />
                          Сохранить
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleButtonDelete(selectedButton.id)}
                          size="sm"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Buttons List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Кнопк�� ({(selectedRemote.buttons || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(selectedRemote.buttons || [])
                  .filter((button) => button && typeof button === "object")
                  .map((button) => (
                    <div
                      key={button.id}
                      className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedButton?.id === button.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      onClick={() => handleButtonEdit(button)}
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {button.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {button.action}
                        </div>
                      </div>
                      <MousePointer className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                {(selectedRemote.buttons || []).length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Нет кноп��к</p>
                    <p className="text-xs">
                      Используйте указатель для добавления
                    </p>
                  </div>
                )}
              </div>
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
            Конструктор пультов
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание и настройка интерактивных пультов с привязкой к приставкам
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Импорт
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Соз��ать пульт
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать новый пульт</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">��азвание</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Введите название пульта"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">П��оизводитель</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manufacturer: e.target.value,
                        })
                      }
                      placeholder="Производитель"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Модель</Label>
                    <Input
                      id="model"
                      value={formData.model || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="М��дель пульта"
                    />
                  </div>
                  <div>
                    <Label htmlFor="device">Приставка</Label>
                    <Select
                      value={formData.deviceId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, deviceId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите приставку" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="universal">Универсальный</SelectItem>
                        {activeDevices.length > 0 ? (
                          activeDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            Нет доступных устройств. Создайте устройство
                            сначала.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Введите описание пульта"
                  />
                </div>

                <div>
                  <Label htmlFor="image-upload">Изображение пульта</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {previewImageUrl
                        ? "Изменить изображение"
                        : "Загрузить изображение"}
                    </Button>
                  </div>
                  {previewImageUrl && (
                    <div className="mt-2">
                      <img
                        src={previewImageUrl}
                        alt="Предварительный просмотр"
                        className="w-full h-32 object-contain bg-gray-100 dark:bg-gray-800 rounded"
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="layout">Макет</Label>
                    <Select
                      value={formData.layout}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          layout: value as RemoteTemplate["layout"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layouts.map((layout) => (
                          <SelectItem key={layout.value} value={layout.value}>
                            {layout.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="colorScheme">Ц��етовая схема</Label>
                    <Select
                      value={formData.colorScheme}
                      onValueChange={(value) =>
                        setFormData({ ...formData, colorScheme: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorSchemes.map((scheme) => (
                          <SelectItem key={scheme.value} value={scheme.value}>
                            <div className="flex items-center">
                              <div
                                className={`w-4 h-4 rounded ${scheme.preview} mr-2`}
                              />
                              {scheme.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.name}>
                    Создать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <RemoteIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск пультов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterDevice} onValueChange={setFilterDevice}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Прис��авка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приставки</SelectItem>
                  <SelectItem value="universal">Универсальные</SelectItem>
                  {activeDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLayout} onValueChange={setFilterLayout}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Маке��" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все макеты</SelectItem>
                  {layouts.map((layout) => (
                    <SelectItem key={layout.value} value={layout.value}>
                      {layout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading and Error States */}
      {remotesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
          <span className="text-lg">Загрузка ��ультов...</span>
        </div>
      )}

      {remotesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Ошибка загрузки пультов: {(remotesError as any)?.message}
          </p>
        </div>
      )}

      {/* Remotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRemotes.map((remote) => {
          const device = remote.deviceId
            ? getDeviceById(remote.deviceId)
            : null;
          const usageCount = getRemoteUsageCount(remote.id);

          return (
            <Card key={remote.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{remote.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {remote.is_default && (
                      <Badge variant="default">По умолчанию</Badge>
                    )}
                    <Badge variant={remote.isActive ? "default" : "secondary"}>
                      {remote.isActive ? "А��тивный" : "Неактивный"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Device Badge */}
                  {device && (
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <Badge
                        variant="outline"
                        className={`bg-gradient-to-r ${device.color} text-white`}
                      >
                        {device.name}
                      </Badge>
                    </div>
                  )}

                  {/* Remote Preview */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center relative">
                    {remote.imageData ? (
                      <img
                        src={remote.imageData}
                        alt={remote.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="scale-50 origin-center">
                        <RemoteControl />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2" variant="outline">
                      {remote.buttons.length} кнопок
                    </Badge>
                  </div>

                  {/* Remote Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Производитель:
                      </span>
                      <span className="font-medium">{remote.manufacturer}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Модель:
                      </span>
                      <span className="font-medium">{remote.model}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Ма��ет:
                      </span>
                      <span className="font-medium">
                        {layouts.find((l) => l.value === remote.layout)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        И��пользований:
                      </span>
                      <span className="font-medium">{usageCount}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {remote.description}
                  </p>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditorDialog(remote)}
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(remote)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(remote)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(remote.id)}
                        >
                          {remote.isActive ? "Деактивировать" : "Активировать"}
                        </DropdownMenuItem>
                        {!remote.isDefault && remote.deviceId && (
                          <DropdownMenuItem
                            onClick={() => handleSetDefault(remote.id)}
                          >
                            Сделать по умолча��ию
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Экспортировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteModal(remote)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Editor Dialog */}
      <Dialog open={isEditorDialogOpen} onOpenChange={setIsEditorDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5" />
              Интерактивный редактор: {selectedRemote?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">{renderRemoteEditor()}</div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditorDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={saveRemoteChanges}>
              <Save className="h-4 w-4 mr-2" />
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактиров��ть пульт</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Название</Label>
                <Input
                  id="edit-name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Введите название пульта"
                />
              </div>
              <div>
                <Label htmlFor="edit-manufacturer">Производитель</Label>
                <Input
                  id="edit-manufacturer"
                  value={formData.manufacturer || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="Производитель"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-model">Модель</Label>
                <Input
                  id="edit-model"
                  value={formData.model || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="Модель пульта"
                />
              </div>
              <div>
                <Label htmlFor="edit-device">Приставка</Label>
                <Select
                  value={formData.deviceId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, deviceId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите прис��авку" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universal">Универсальный</SelectItem>
                    {activeDevices.length > 0 ? (
                      activeDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        Нет доступных устройств. Создайте устройство сначала.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Введите описание пульта"
              />
            </div>

            <div>
              <Label htmlFor="edit-image-upload">Изображение пульта</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {previewImageUrl
                    ? "Изменить изображение"
                    : "Загрузить изображение"}
                </Button>
              </div>
              {previewImageUrl && (
                <div className="mt-2">
                  <img
                    src={previewImageUrl}
                    alt="Предварительный просмотр"
                    className="w-full h-32 object-contain bg-gray-100 dark:bg-gray-800 rounded"
                  />
                </div>
              )}
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-layout">Макет</Label>
                <Select
                  value={formData.layout}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      layout: value as RemoteTemplate["layout"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layouts.map((layout) => (
                      <SelectItem key={layout.value} value={layout.value}>
                        {layout.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-colorScheme">Цветовая схема</Label>
                <Select
                  value={formData.colorScheme}
                  onValueChange={(value) =>
                    setFormData({ ...formData, colorScheme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((scheme) => (
                      <SelectItem key={scheme.value} value={scheme.value}>
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded ${scheme.preview} mr-2`}
                          />
                          {scheme.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleEdit} disabled={!formData.name}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пульт?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот пульт? Это действие нельзя
              отменить! Пульт "{remoteToDelete?.name}" будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setRemoteToDelete(null);
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

      {filteredRemotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <RemoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Пульты не н��йдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте изменить фильтры поиска или создайте новый пульт.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RemoteBuilder;
