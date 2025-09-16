import { useState } from "react";
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
  Search,
  MoreVertical,
  Tv,
  Eye,
  EyeOff,
  Upload,
  Download,
  Settings,
  Zap,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDevices } from "@/hooks/useDevices";
import { useProblems } from "@/hooks/useProblems";
import { devicesApi, problemsApi } from "@/api";

interface Device {
  id: string;
  name: string;
  brand: string;
  model: string;
  description: string;
  imageUrl?: string;
  logoUrl?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DeviceManager = () => {
  const {
    data: devicesResponse,
    isLoading: loading,
    error,
    refetch,
  } = useDevices();
  const { data: problemsResponse } = useProblems();

  // Извлекаем массивы данных из ответа API
  const devices = devicesResponse?.data || [];
  const problems = problemsResponse?.data || [];

  // Helper function to get problems count for device
  const getProblemsForDevice = (deviceId: string) => {
    return problems.filter((p) => p.device_id === deviceId);
  };
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    description: "",
    imageUrl: "",
    logoUrl: "",
    color: "from-blue-500 to-blue-600",
  });

  const colorOptions = [
    {
      value: "from-blue-500 to-blue-600",
      label: "Синий",
      preview: "bg-blue-500",
    },
    {
      value: "from-green-500 to-green-600",
      label: "Зеленый",
      preview: "bg-green-500",
    },
    {
      value: "from-purple-500 to-purple-600",
      label: "Фиолетовый",
      preview: "bg-purple-500",
    },
    {
      value: "from-yellow-500 to-yellow-600",
      label: "Золотой",
      preview: "bg-yellow-500",
    },
    {
      value: "from-red-500 to-red-600",
      label: "Красный",
      preview: "bg-red-500",
    },
    {
      value: "from-indigo-500 to-indigo-600",
      label: "Индиго",
      preview: "bg-indigo-500",
    },
    {
      value: "from-pink-500 to-pink-600",
      label: "Розовый",
      preview: "bg-pink-500",
    },
    {
      value: "from-gray-500 to-gray-600",
      label: "Серый",
      preview: "bg-gray-500",
    },
  ];

  const filteredDevices = devices.filter(
    (device: any) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getDeviceIcon = (deviceId: string) => {
    switch (deviceId) {
      case "openbox":
        return <Tv className="h-6 w-6" />;
      case "uclan":
        return <Zap className="h-6 w-6" />;
      case "hdbox":
        return <Settings className="h-6 w-6" />;
      case "openbox_gold":
        return <Star className="h-6 w-6" />;
      default:
        return <Tv className="h-6 w-6" />;
    }
  };

  const handleCreate = async () => {
    try {
      // Generate a unique timestamp
      const timestamp = Date.now();

      // Create unique name and ID if using default values
      const uniqueName =
        formData.name === "New"
          ? `${formData.brand} ${timestamp}`
          : formData.name;
      const deviceId = `${formData.brand.toLowerCase().replace(/\s+/g, "-")}-${uniqueName.toLowerCase().replace(/\s+/g, "-")}-${timestamp}`;

      // Prepare device data, excluding empty URLs
      const deviceData = {
        id: deviceId,
        name: uniqueName,
        brand: formData.brand,
        model: formData.model,
        description: formData.description,
        color: formData.color,
        status: "active",
      };

      // Only add URLs if they are not empty
      if (formData.imageUrl && formData.imageUrl.trim()) {
        deviceData.image_url = formData.imageUrl;
      }
      if (formData.logoUrl && formData.logoUrl.trim()) {
        deviceData.logo_url = formData.logoUrl;
      }

      await devicesApi.createDevice(deviceData);
      await refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating device:", error);

      // Show user-friendly error message based on error type
      let errorMessage = "Ошибка при создании устройства";

      if (error.response) {
        if (error.response.error) {
          errorMessage = error.response.error;
        } else if (error.response.message) {
          errorMessage = error.response.message;
        }
      } else if (error.message) {
        if (error.message.includes("409")) {
          errorMessage = "Устройство с таким названием уже существует";
        } else if (error.message.includes("400")) {
          errorMessage = "Неверные данные. Проверьте все поля.";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    }
  };

  const handleEdit = async () => {
    if (!selectedDevice) return;

    try {
      await devicesApi.updateDevice(selectedDevice.id, formData);
      await refetch();
      setIsEditDialogOpen(false);
      setSelectedDevice(null);
      resetForm();
    } catch (error) {
      console.error("Error updating device:", error);
    }
  };

  const handleDelete = async (deviceId: string, forceDelete: boolean = false) => {
    const problemsCount = getProblemsForDevice(deviceId).length;
    if (problemsCount > 0 && !forceDelete) {
      const confirmForce = confirm(
        `У приставки ${problemsCount} активных проблем. Удалить принудительно?`
      );
      if (!confirmForce) return;
      forceDelete = true;
    }

    const confirmMessage = forceDelete
      ? "Вы уверены, что хотите ПОЛНОСТЬЮ удалить приставку? Это действие нельзя отменить!"
      : "Вы уверены, что хотите деактивировать приставку?";

    if (!confirm(confirmMessage)) return;

    try {
      await devicesApi.deleteDevice(deviceId, forceDelete);
      await refetch();
      alert(forceDelete ? "Приставка удалена полностью" : "Приставка деактивирована");
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("��шибка при удалении приставки");
    }
  };

  const handleToggleStatus = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    try {
      await devicesApi.updateDevice(deviceId, {
        isActive: !device.isActive,
      });
      await refetch();
    } catch (error) {
      console.error("Error toggling device status:", error);
      alert("Ошибка при изменении статуса приставки");
    }
  };

  const openEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      brand: device.brand,
      model: device.model,
      description: device.description,
      imageUrl: device.imageUrl || "",
      logoUrl: device.logoUrl || "",
      color: device.color,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      model: "",
      description: "",
      imageUrl: "",
      logoUrl: "",
      color: "from-blue-500 to-blue-600",
    });
  };

  const handleClearAllDevices = async () => {
    if (
      !confirm(
        "Вы уверены, что хотите удалить ВСЕ устройства? Это ��ействие нельзя отменить!",
      )
    )
      return;

    try {
      // Удаляем все устройства по одному
      for (const device of devices) {
        await devicesApi.deleteDevice(device.id, true); // force delete
      }

      await refetch(); // Обновляем список
      alert("Все устройства удалены!");
    } catch (error) {
      console.error("Error clearing devices:", error);
      alert("Ошибка при удалении устройств");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление приставками
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание и настройка моделей ТВ-��риставок для системы поддержки
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleClearAllDevices}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Очистить всё
          </Button>
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
                Добавить приставку
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить новую п��иставку</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="OpenBox"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Бренд</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      placeholder="OpenBox"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="model">Модель</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="Standard"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Описание п��иставки"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imageUrl">URL изображения</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="logoUrl">URL логотипа</Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, logoUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="color">Цв��товая схема</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) =>
                      setFormData({ ...formData, color: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded ${option.preview} mr-2`}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name || !formData.brand}
                  >
                    Создать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск приставок..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDevices.map((device) => {
          const problemsCount = getProblemsForDevice(device.id).length;

          return (
            <Card
              key={device.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${device.color} rounded-xl flex items-center justify-center text-white`}
                  >
                    {getDeviceIcon(device.id)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={device.isActive ? "default" : "secondary"}>
                      {device.isActive ? "А��тивна" : "Неактивна"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{device.name}</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {device.brand} {device.model}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {device.description}
                </p>

                {/* Statistics */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      Проблем:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {problemsCount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(device.id)}
                      title={
                        device.isActive ? "Деактивировать" : "Активировать"
                      }
                    >
                      {device.isActive ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(device)}
                      title="Редактировать"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Экспортировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(device.id, false)}
                        className="text-orange-600"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Деактивировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(device.id, true)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить полностью
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать приставку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Название</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="OpenBox"
                />
              </div>
              <div>
                <Label htmlFor="edit-brand">Бренд</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="OpenBox"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-model">Модель</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="Standard"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Описани�� приставки"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-imageUrl">URL изображения</Label>
                <Input
                  id="edit-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="edit-logoUrl">URL логотипа</Label>
                <Input
                  id="edit-logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, logoUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-color">Цветовая схема</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded ${option.preview} mr-2`}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!formData.name || !formData.brand}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Tv className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Приставки не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте изменить поисковый запрос или создайте новую приставку.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeviceManager;
