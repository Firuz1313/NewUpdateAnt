import React, { useState, useEffect, useRef } from "react";
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
import { tvInterfacesAPI } from "@/api/tvInterfaces";
import { useDevices } from "@/hooks/useDevices";
import {
  TVInterface,
  CreateTVInterfaceData,
  TVInterfaceType,
  TV_INTERFACE_TYPES,
  tvInterfaceUtils,
} from "@/types/tvInterface";
import {
  Monitor,
  Upload,
  Save,
  Eye,
  Edit3,
  Trash2,
  Power,
  PowerOff,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  X,
  RefreshCw,
  Download,
  Copy,
  FolderOpen,
} from "lucide-react";
import ScreenshotBrowser from "@/components/admin/ScreenshotBrowser";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TVInterfaceBuilder = () => {
  const { data: devicesResponse } = useDevices();

  // Извлекаем массивы данных из ответа API
  const devices = devicesResponse?.data || [];
  const { toast } = useToast();

  // State
  const [tvInterfaces, setTVInterfaces] = useState<TVInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] =
    useState<TVInterface | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeviceFilter, setSelectedDeviceFilter] =
    useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState<CreateTVInterfaceData>({
    name: "",
    description: "",
    type: "home",
    deviceId: "",
    screenshotData: undefined,
  });

  // Image upload
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isScreenshotBrowserOpen, setIsScreenshotBrowserOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state for TV interfaces
  const [page, setPage] = useState(1);
  const limit = 20;

  // Load TV interfaces on component mount and when filters/page change
  useEffect(() => {
    loadTVInterfaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, selectedDeviceFilter, selectedTypeFilter]);

  const loadTVInterfaces = async () => {
    setIsLoading(true);
    try {
      console.log("📡 Loading TV interfaces (paginated)...", { page, limit });
      const offset = (page - 1) * limit;
      const filters: any = { limit, offset };
      if (selectedDeviceFilter && selectedDeviceFilter !== "all") {
        filters.device_id = selectedDeviceFilter;
      }
      if (selectedTypeFilter && selectedTypeFilter !== "all") {
        filters.type = selectedTypeFilter;
      }
      if (searchTerm && searchTerm.trim().length > 0) {
        filters.search = searchTerm.trim();
      }

      const response = await tvInterfacesAPI.getAll(filters);
      console.log("📡 TV interfaces response:", response);

      if (response.success && response.data) {
        // Нормализуем данные с бэкенда
        const normalizedInterfaces = response.data.map((iface) =>
          tvInterfaceUtils.normalizeFromBackend(iface),
        );
        setTVInterfaces(normalizedInterfaces);
        console.log("📡 Total interfaces loaded:", normalizedInterfaces.length);
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось загрузить TV интерфейсы",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading TV interfaces:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке TV интерфейсов",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл изображения",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 10 МБ",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setFormData((prev) => ({ ...prev, screenshotData: base64String }));
      setPreviewImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded image
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, screenshotData: undefined }));
    setPreviewImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  // Remove image during edit (reset to original if no new image)
  const removeImageEdit = () => {
    setFormData((prev) => ({ ...prev, screenshotData: undefined }));
    // При редактировании возвращаем к исходному скриншоту
    if (selectedInterface) {
      setPreviewImageUrl(tvInterfaceUtils.getScreenshotUrl(selectedInterface));
    } else {
      setPreviewImageUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  // Handle screenshot selection from browser
  const handleScreenshotSelect = (screenshotData: string) => {
    setFormData((prev) => ({ ...prev, screenshotData }));
    setPreviewImageUrl(screenshotData);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "home",
      deviceId: "",
      screenshotData: undefined,
    });
    setPreviewImageUrl(null);
    setSelectedInterface(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название интерфейса",
        variant: "destructive",
      });
      return;
    }

    if (!formData.deviceId) {
      toast({
        title: "Ошибка",
        description: "Выберите устройство",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("📤 Creating TV interface with data:", {
        name: formData.name,
        type: formData.type,
        deviceId: formData.deviceId,
        hasScreenshot: !!formData.screenshotData,
        screenshotSize: formData.screenshotData
          ? Math.round(formData.screenshotData.length / 1024) + "KB"
          : "None",
      });

      const response = await tvInterfacesAPI.create(formData);
      console.log("📤 Create response:", response);

      if (response.success) {
        toast({
          title: "Успех",
          description: response.message || "TV интерфейс создан",
        });
        setIsCreateDialogOpen(false);
        resetForm();

        // Форсированная перезагрузка через небольшую задержку
        setTimeout(() => {
          console.log("🔄 Force reloading interfaces after create...");
          loadTVInterfaces();
        }, 500);
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось создать TV интерфейс",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating TV interface:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании TV интерфейса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedInterface) return;

    setIsLoading(true);
    try {
      // Подготавливаем данные для обновления, включая толь��о измененные поля
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        deviceId: formData.deviceId,
      };

      // Добав��яем screenshot_data только если был загружен новый скриншот
      if (
        formData.screenshotData &&
        formData.screenshotData.startsWith("data:")
      ) {
        updateData.screenshotData = formData.screenshotData;
      }

      console.log("📤 Updating TV interface:", selectedInterface.id, {
        hasNewScreenshot: !!updateData.screenshotData,
        screenshotSize: updateData.screenshotData
          ? Math.round(updateData.screenshotData.length / 1024) + "KB"
          : "None",
      });

      const response = await tvInterfacesAPI.update(
        selectedInterface.id,
        updateData,
      );
      console.log("📤 Update response:", response);

      if (response.success) {
        toast({
          title: "Успех",
          description: response.message || "TV интерфейс обновлен",
        });
        setIsEditDialogOpen(false);
        resetForm();

        // Форсированная перезагрузка через небольшую задерж��у
        setTimeout(() => {
          console.log("🔄 Force reloading interfaces after update...");
          loadTVInterfaces();
        }, 500);
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось обновить TV интерфейс",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating TV interface:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении TV интерфейса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (interfaceId: string) => {
    setIsLoading(true);
    try {
      const response = await tvInterfacesAPI.delete(interfaceId);
      if (response.success) {
        toast({
          title: "Успех",
          description: response.message || "TV интерфейс удален",
        });
        loadTVInterfaces();
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось удалить TV интерфейс",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting TV interface:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении TV интерфейса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (interfaceId: string) => {
    setIsLoading(true);
    try {
      const response = await tvInterfacesAPI.toggleStatus(interfaceId);
      if (response.success) {
        toast({
          title: "Успех",
          description: response.message || "Статус изменен",
        });
        loadTVInterfaces();
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось изменить статус",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при изменении статуса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle duplicate
  const handleDuplicate = async (interfaceId: string, name: string) => {
    try {
      const response = await tvInterfacesAPI.duplicate(
        interfaceId,
        `${name} (копия)`,
      );
      if (response.success) {
        toast({
          title: "Успех",
          description: response.message || "TV интерфейс дублирован",
        });
        loadTVInterfaces();
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось дублировать TV интерфейс",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error duplicating TV interface:", error);
      toast({
        title: "Оши��ка",
        description: "Произошла ошибка при дублировании TV интерфейса",
        variant: "destructive",
      });
    }
  };

  // Handle cleanup and create user TV interfaces
  const handleCleanupTVInterfaces = async () => {
    setIsLoading(true);
    try {
      // Cleanup functionality removed
      const response = { success: false };
      if (response.success) {
        toast({
          title: "Успех",
          description:
            response.data?.message || "Все TV интерфейсы успешно удалены",
        });
        loadTVInterfaces();
      } else {
        toast({
          title: "Ошибка",
          description:
            response.error || "Не удалось выполнить очистку TV интерфейсов",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cleaning up TV interfaces:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при очистке TV интерфейсов",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (tvInterface: TVInterface) => {
    setSelectedInterface(tvInterface);
    setFormData({
      name: tvInterface.name,
      description: tvInterface.description,
      type: tvInterface.type,
      deviceId: tvInterface.deviceId,
      screenshotData: undefined, // Не устанавливаем существующий скриншот ��ак дан��ые
    });
    // Показываем текущий скриншот как превью, но не как данные для отправки
    setPreviewImageUrl(tvInterfaceUtils.getScreenshotUrl(tvInterface));
    setIsEditDialogOpen(true);
  };

  // Filter interfaces
  const filteredInterfaces = tvInterfaces.filter((iface) => {
    const matchesSearch =
      searchTerm === "" ||
      iface.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iface.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iface.deviceName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice =
      selectedDeviceFilter === "all" || iface.deviceId === selectedDeviceFilter;
    const matchesType =
      selectedTypeFilter === "all" || iface.type === selectedTypeFilter;

    return matchesSearch && matchesDevice && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Конструктор интерфейса ТВ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание и управ��ение интерф��йсами ТВ-приставок с полной
            интеграцией с бэкендом
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={loadTVInterfaces}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить все интерфейсы
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Очистить все TV интерфейсы?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие удалит все существующие TV интерфейсы. После
                  очистки вы сможете создавать свои собственные интерфейсы
                  вручную чере�� UI.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupTVInterfaces}>
                  Очистить все
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Создать интерфейс
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать новый TV интерфейс</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Введите название интерфейса"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Тип интерфейса</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: TVInterfaceType) =>
                        setFormData((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип интерфейса" />
                      </SelectTrigger>
                      <SelectContent>
                        {TV_INTERFACE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="device">Устройство</Label>
                  <Select
                    value={formData.deviceId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, deviceId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите уст��ойство" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-xs text-gray-500">
                              {device.brand} {device.model}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Введите описание интерфейса"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="screenshot">Скриншот интерфейса</Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Загрузить файл
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsScreenshotBrowserOpen(true)}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Из библиотеки
                      </Button>
                      {previewImageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                          title="Удалить скриншот"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {previewImageUrl && (
                      <div className="border rounded-lg p-4">
                        <img
                          src={previewImageUrl}
                          alt="Preview"
                          className="max-w-full h-48 object-contain mx-auto rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleCreate} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Созда��ь
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск интерфейсов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select
                value={selectedDeviceFilter}
                onValueChange={setSelectedDeviceFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по устройству" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все устройства</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                value={selectedTypeFilter}
                onValueChange={setSelectedTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по типу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {TV_INTERFACE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TV Interfaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && tvInterfaces.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredInterfaces.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Интерфейсы не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ||
              selectedDeviceFilter !== "all" ||
              selectedTypeFilter !== "all"
                ? "Попробуйте изменить фильтры поиска"
                : "Создавайте первый TV интерфейс для начала работы"}
            </p>
            {!searchTerm &&
              selectedDeviceFilter === "all" &&
              selectedTypeFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать интерфейс
                </Button>
              )}
          </div>
        ) : (
          filteredInterfaces.map((tvInterface) => (
            <Card key={tvInterface.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Interface Preview */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                  {tvInterfaceUtils.hasScreenshot(tvInterface) &&
                  tvInterfaceUtils.getScreenshotUrl(tvInterface) ? (
                    <img
                      src={tvInterfaceUtils.getScreenshotUrl(tvInterface)!}
                      alt={tvInterface.name}
                      className="w-full h-full object-cover"
                    />
                  ) : tvInterfaceUtils.hasScreenshot(tvInterface) ? (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Скриншот есть</p>
                      <p className="text-xs text-gray-400">
                        Открыть для просмотра
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Нет скриншота</p>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        tvInterfaceUtils.isActive(tvInterface)
                          ? "default"
                          : "secondary"
                      }
                    >
                      {tvInterfaceUtils.isActive(tvInterface)
                        ? "Активен"
                        : "Неактивен"}
                    </Badge>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="bg-white/80 text-black">
                      {tvInterfaceUtils.getTypeLabel(tvInterface.type)}
                    </Badge>
                  </div>
                </div>

                {/* Interface Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {tvInterface.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tvInterface.deviceName || tvInterface.device_name}
                    </p>
                  </div>

                  {tvInterface.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {tvInterface.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    Создан:{" "}
                    {(() => {
                      const dateStr =
                        tvInterface.createdAt || tvInterface.created_at;
                      if (!dateStr) return "Неизвестно";
                      try {
                        const date = new Date(dateStr);
                        return isNaN(date.getTime())
                          ? "Неизвестно"
                          : date.toLocaleDateString("ru");
                      } catch {
                        return "Неизвестно";
                      }
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(tvInterface)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(tvInterface.id)}
                        disabled={isLoading}
                      >
                        {tvInterfaceUtils.isActive(tvInterface) ? (
                          <PowerOff className="h-3 w-3" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDuplicate(tvInterface.id, tvInterface.name)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Удалить интерфейс?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. TV интерфейс "
                            {tvInterface.name}" будет удален навсегда.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(tvInterface.id)}
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog - аналогично Create Dialog с теми же полями */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ре��актировать TV интерфейс</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Название</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Вве��ите название интерфейса"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Тип интерфейса</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TVInterfaceType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип инте��фейса" />
                  </SelectTrigger>
                  <SelectContent>
                    {TV_INTERFACE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-device">Устройство</Label>
              <Select
                value={formData.deviceId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, deviceId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выбери��е устройство" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-gray-500">
                          {device.brand} {device.model}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Введите описание интерфейса"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-screenshot">Скриншот интерфейса</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить файл
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScreenshotBrowserOpen(true)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Из библиотеки
                  </Button>
                  {previewImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImageEdit}
                      title="Сбросить к исходному скриншоту"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {previewImageUrl && (
                  <div className="border rounded-lg p-4">
                    <img
                      src={previewImageUrl}
                      alt="Preview"
                      className="max-w-full h-48 object-contain mx-auto rounded"
                    />
                    <div className="mt-2 text-sm text-gray-500 text-center">
                      {formData.screenshotData &&
                      formData.screenshotData.startsWith("data:")
                        ? "Новый скриншот будет сохранен"
                        : "Текущий скриншот интерфейса"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                ��тмена
              </Button>
              <Button onClick={handleEdit} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Browser */}
      <ScreenshotBrowser
        open={isScreenshotBrowserOpen}
        onOpenChange={setIsScreenshotBrowserOpen}
        onSelectScreenshot={handleScreenshotSelect}
        currentDeviceId={formData.deviceId}
      />
    </div>
  );
};

export default TVInterfaceBuilder;
