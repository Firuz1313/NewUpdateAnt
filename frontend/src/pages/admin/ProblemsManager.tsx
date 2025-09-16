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
  Search,
  MoreVertical,
  Signal,
  Power,
  Monitor,
  Volume2,
  Wifi,
  PlayCircle,
  Settings,
  AlertTriangle,
  TrendingUp,
  Eye,
  EyeOff,
  Upload,
  Download,
  Tv,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDevices } from "@/hooks/useDevices";
import {
  useProblems,
  useCreateProblem,
  useUpdateProblem,
  useDeleteProblem,
  useDuplicateProblem,
} from "@/hooks/useProblems";

const iconMap = {
  Signal,
  Power,
  Monitor,
  Volume2,
  Wifi,
  PlayCircle,
  Settings,
  AlertTriangle,
  TrendingUp,
};

interface Problem {
  id: string;
  title: string;
  description: string;
  category: "critical" | "moderate" | "minor" | "other";
  icon: string;
  color: string;
  stepsCount: number;
  completions: number;
  successRate: number;
  status: "active" | "inactive";
  deviceId: string;
  createdAt: string;
  updatedAt: string;
}

const ProblemsManager = () => {
  const { data: devicesResponse } = useDevices();
  const { data: problemsResponse } = useProblems(1, 20, { admin: true });

  // Извлекаем массивы данных из ответа API
  const devices = devicesResponse?.data || [];
  const problems = problemsResponse?.data || [];

  // API mutations
  const createProblemMutation = useCreateProblem();
  const updateProblemMutation = useUpdateProblem();
  const deleteProblemMutation = useDeleteProblem();
  const duplicateProblemMutation = useDuplicateProblem();

  const getActiveDevices = () =>
    devices.filter((d: any) => d.is_active !== false);
  const getStepsForProblem = (problemId: string) => {
    // TODO: Implement actual steps fetching logic
    // For now return empty array to allow deletion
    console.log(`🔍 Checking steps for problem ${problemId}: 0 steps found`);
    return [];
  };

  // Check if a problem with the same title and device already exists
  const checkForDuplicateTitle = (title: string, deviceId: string): boolean => {
    return problems.some(
      (problem) =>
        problem.title.toLowerCase().trim() === title.toLowerCase().trim() &&
        (problem.device_id === deviceId || problem.deviceId === deviceId) &&
        problem.is_active !== false,
    );
  };
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdProblemTitle, setCreatedProblemTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "moderate" as Problem["category"],
    icon: "AlertTriangle",
    color: "from-yellow-500 to-yellow-600",
    deviceId: "",
  });

  const categories = [
    {
      value: "critical",
      label: "Критическая",
      color: "from-red-500 to-red-600",
    },
    {
      value: "moderate",
      label: "Умеренная",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      value: "minor",
      label: "Незначительная",
      color: "from-green-500 to-green-600",
    },
    { value: "other", label: "Другое", color: "from-gray-500 to-gray-600" },
  ];

  const iconOptions = [
    "Signal",
    "Power",
    "Monitor",
    "Volume2",
    "Wifi",
    "PlayCircle",
    "Settings",
    "AlertTriangle",
    "TrendingUp",
  ];

  const colorOptions = [
    {
      value: "from-red-500 to-red-600",
      label: "Красный",
      preview: "bg-red-500",
    },
    {
      value: "from-yellow-500 to-yellow-600",
      label: "Желтый",
      preview: "bg-yellow-500",
    },
    {
      value: "from-green-500 to-green-600",
      label: "Зеленый",
      preview: "bg-green-500",
    },
    {
      value: "from-blue-500 to-blue-600",
      label: "Синий",
      preview: "bg-blue-500",
    },
    {
      value: "from-purple-500 to-purple-600",
      label: "Фиолетовый",
      preview: "bg-purple-500",
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

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDevice =
      filterDevice === "all" ||
      (problem.device_id || problem.deviceId) === filterDevice;
    const matchesCategory =
      filterCategory === "all" || problem.category === filterCategory;
    return matchesSearch && matchesDevice && matchesCategory;
  });

  const getIcon = (iconName: string) => {
    const IconComponent =
      iconMap[iconName as keyof typeof iconMap] || AlertTriangle;
    return <IconComponent className="h-5 w-5" />;
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name || "Неизвестная приставка";
  };

  const getCategoryInfo = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return (
      cat || {
        value: "other",
        label: "Другое",
        color: "from-gray-500 to-gray-600",
      }
    );
  };

  const handleCreate = async () => {
    console.log("🔄 Начало создания проблемы");
    console.log("📝 Данные формы:", formData);
    console.log("🔄 Состояние mutation:", {
      isLoading: createProblemMutation.isPending,
      isError: createProblemMutation.isError,
      error: createProblemMutation.error,
    });

    if (!formData.title) {
      alert("Пожалуйста, введите название проблемы");
      return;
    }

    if (!formData.deviceId) {
      alert("Пожалуйста, выберите прист��вку");
      return;
    }

    // Client-side duplicate check for better UX
    if (checkForDuplicateTitle(formData.title, formData.deviceId)) {
      alert(
        `Проблема с названием "${formData.title}" уже существует для этого устройства.\n\n��ожалуйста, выберите другое ��азвание.`,
      );
      return;
    }

    try {
      const problemData = {
        deviceId: formData.deviceId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        priority: 1,
        estimatedTime: 5,
        difficulty: "beginner",
        tags: [],
        status: "published",
      };

      console.log("🚀 Отпра��ка данных:", problemData);

      const result = await createProblemMutation.mutateAsync(problemData);

      console.log("✅ Проблема создана успешно:", result);

      setIsCreateDialogOpen(false);
      resetForm();

      // Show success modal instead of alert
      setCreatedProblemTitle(problemData.title);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("❌ Ошибка при создании проблем��:", error);
      console.error("❌ Дет��ли ошибки:", {
        message: (error as any)?.message,
        response: (error as any)?.response,
        stack: (error as any)?.stack,
      });

      const errorResponse = (error as any)?.response?.data;
      const errorMessage = (error as any)?.message || "Неизвестная ошибка";

      if (errorResponse?.errorType === "RATE_LIMIT") {
        const retryAfter = errorResponse.retryAfter || 5;
        alert(
          `Слишком частые попытки создания проблем.\n\nПожалуйста, подождите ${retryAfter} секунд${retryAfter > 1 && retryAfter < 5 ? "ы" : ""} перед следующей попыткой.`,
        );
      } else if (errorResponse?.errorType === "DUPLICATE_ERROR") {
        const existingProblem = errorResponse.existingProblem;
        const suggestions = errorResponse.details?.suggestions || [];

        let alertMessage = `Проблема с таким названием уже существует для этого устройства.\n\n`;
        alertMessage += `Существующая проблема:\n`;
        alertMessage += `• Название: "${existingProblem?.title}"\n`;
        alertMessage += `• Статус: ${existingProblem?.status}\n`;
        alertMessage += `• Создана: ${existingProblem?.created_at ? new Date(existingProblem.created_at).toLocaleDateString() : "н/д"}\n\n`;

        if (suggestions.length > 0) {
          alertMessage += `Рекомендации:\n${suggestions.map((s) => `• ${s}`).join("\n")}`;
        }

        alert(alertMessage);
      } else if (errorMessage.includes("уже существует")) {
        alert(
          "Проблема с таким названием уже существует для этого устройства. Попробуйте другое название.",
        );
      } else {
        alert("Ошибка при создании проблемы: " + errorMessage);
      }
    }
  };

  const handleEdit = async () => {
    if (!selectedProblem) return;

    try {
      await updateProblemMutation.mutateAsync({
        id: selectedProblem.id,
        data: {
          deviceId: formData.deviceId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          icon: formData.icon,
          color: formData.color,
        },
      });
      setIsEditDialogOpen(false);
      setSelectedProblem(null);
      resetForm();
    } catch (error) {
      console.error("Error updating problem:", error);
      alert("Ошибка при обновлении проблемы: " + (error as any)?.message);
    }
  };

  const openDeleteModal = (problem: Problem) => {
    setProblemToDelete(problem);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!problemToDelete) return;

    console.log(
      `🗑️ Hard delete requested for problem ID: ${problemToDelete.id}`,
    );
    console.log(
      `🚀 Starting hard delete mutation for problem ${problemToDelete.id}`,
    );
    try {
      // Явно указываем force: true для полного удаления из базы
      const result = await deleteProblemMutation.mutateAsync({
        id: problemToDelete.id,
        force: true,
      });
      console.log(`✅ Hard delete successful:`, result);
      console.log(
        `🔄 React Query should automatically invalidate and refetch problems list`,
      );

      // Close the modal
      setIsDeleteModalOpen(false);
      setProblemToDelete(null);
    } catch (error) {
      console.error("❌ Error deleting problem:", error);

      // Close the modal
      setIsDeleteModalOpen(false);
      setProblemToDelete(null);

      alert("Ошибка при удалении проблемы: " + (error as any)?.message);
    }
  };

  const handleToggleStatus = async (problemId: string) => {
    const problem = problems.find((p) => p.id === problemId);
    if (!problem) return;

    try {
      const currentStatus = problem.status || problem.is_active;
      await updateProblemMutation.mutateAsync({
        id: problemId,
        data: {
          status:
            currentStatus === "published" || currentStatus === "active"
              ? "draft"
              : "published",
        },
      });
    } catch (error) {
      console.error("Error toggling problem status:", error);
      alert(
        "Ошибка при изменении статуса проблемы: " + (error as any)?.message,
      );
    }
  };

  const handleDuplicate = async (problem: Problem) => {
    try {
      console.log("🔄 Дублирование проблемы:", problem.id);
      await duplicateProblemMutation.mutateAsync({
        id: problem.id,
        targetDeviceId: problem.device_id || problem.deviceId,
      });
      console.log("✅ Проблема успешно продублирована");
    } catch (error) {
      console.error("Ошибка при дублировании проблемы:", error);

      const errorResponse = (error as any)?.response?.data;
      if (errorResponse?.errorType === "DUPLICATE_ERROR") {
        const existingProblem = errorResponse.existingProblem;
        alert(
          `Не удалось создать копию: проблема с названием "${existingProblem?.title} (копия)" уже существует ��ля этого устройства.\n\nПопробуйте переименовать существующую копию или создать новую п��облему вручную.`,
        );
      } else {
        alert(
          "Ошибка при дублировании проблемы: " +
            ((error as any)?.message || "Неизвестная ошибка"),
        );
      }
    }
  };

  const openEditDialog = (problem: Problem) => {
    setSelectedProblem(problem);
    setFormData({
      title: problem.title,
      description: problem.description,
      category: problem.category,
      icon: problem.icon,
      color: problem.color,
      deviceId: problem.device_id || problem.deviceId,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "moderate",
      icon: "AlertTriangle",
      color: "from-yellow-500 to-yellow-600",
      deviceId: "",
    });
  };

  const handleActivateAllProblems = async () => {
    if (
      !confirm(
        "Вы уверены, что хотите активировать ВСЕ проблемы? Все проблемы будут переведены в статус 'published'.",
      )
    )
      return;

    try {
      console.log("🔄 Массовая активация проблем...");

      // Активируем все проб��емы по одной
      for (const problem of problems) {
        await updateProblemMutation.mutateAsync({
          id: problem.id,
          data: {
            status: "published",
            is_active: true,
          },
        });
      }

      alert(`Все проблемы (${problems.length}) успешно активированы!`);
    } catch (error) {
      console.error("Ошибка при активации проблем:", error);
      alert("Ошибка при активации проблем: " + (error as any)?.message);
    }
  };

  const handleClearAllProblems = async () => {
    if (
      !confirm(
        "Вы уверены, что хотите удалить ВСЕ проблемы? Это действие нельзя отменить!",
      )
    )
      return;

    try {
      // Удаляем все проблемы по одной
      for (const problem of problems) {
        await deleteProblemMutation.mutateAsync({ id: problem.id });
      }

      alert("Все проблемы удалены!");
    } catch (error) {
      console.error("Error clearing problems:", error);
      alert("Ошибка при удалении проблем: " + (error as any)?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление проблемами
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание и настройка проблем для различных моделей приставок
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log("🧪 Тестирование API создания проблемы");

              // Генерируем действительно уникальный ID
              const timestamp = Date.now();
              const randomPart = Math.random().toString(36).substring(2, 11);
              const microTime = performance.now().toString().replace(".", "");
              const uniqueId = `${timestamp}_${randomPart}_${microTime.slice(-6)}`;

              let testTitle = `TEST-${uniqueId}`;

              // Проверяем уникальность на клиенте
              while (checkForDuplicateTitle(testTitle, "openbox")) {
                console.warn(
                  `⚠️  Название ${testTitle} уже существует, генерируем новое`,
                );
                const newRandom = Math.random().toString(36).substring(2, 11);
                testTitle = `TEST-${timestamp}_${newRandom}_${Date.now().toString().slice(-4)}`;
              }

              const testData = {
                deviceId: "openbox",
                title: testTitle,
                description: `Автоматически сгенерированная тестовая проблема, создана ${new Date().toLocaleString()}`,
                category: "critical" as any,
                icon: "AlertTriangle",
                color: "from-red-500 to-red-600",
                priority: 1,
                estimatedTime: 5,
                difficulty: "beginner" as any,
                tags: ["тест", "автоматически созданная"],
                status: "published" as any,
              };
              console.log("📦 Тестовые данные:", testData);
              createProblemMutation
                .mutateAsync(testData)
                .then(() => {
                  console.log("✅ Тестовая проблема создана успешно");
                  setCreatedProblemTitle(testTitle);
                  setIsSuccessModalOpen(true);
                })
                .catch((error) => {
                  console.error(
                    "❌ Ошибка при создании тестовой проблемы:",
                    error,
                  );

                  const errorResponse = error?.response?.data;
                  if (errorResponse?.errorType === "RATE_LIMIT") {
                    const retryAfter = errorResponse.retryAfter || 5;
                    alert(
                      `Слишком частое тестирование API.\n\nПодождите ${retryAfter} секунд${retryAfter > 1 && retryAfter < 5 ? "ы" : ""} перед следующей попыткой.`,
                    );
                  } else if (errorResponse?.errorType === "DUPLICATE_ERROR") {
                    alert(
                      `Не удалось с��здать тестовую проблему: проблема с таким названием уже существует.\n\nПопробуйте сначала удалить старые тестовые проблемы.`,
                    );
                  } else {
                    alert(
                      "Ошибка при создани�� тест��вой проблемы: " +
                        (error?.message || "Неизвестная ошибка"),
                    );
                  }
                });
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            disabled={createProblemMutation.isPending}
          >
            {createProblemMutation.isPending ? "⏳" : "🧪"} Тест API
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (
                !confirm(
                  "Удалить все тестовые проблемы (начинающиеся с TEST-)?",
                )
              )
                return;

              try {
                const testProblems = problems.filter((p) =>
                  p.title.startsWith("TEST-"),
                );
                console.log(
                  `🧹 Удаление ${testProblems.length} тестовых проблем`,
                );

                for (const problem of testProblems) {
                  await deleteProblemMutation.mutateAsync({ id: problem.id });
                }

                alert(`Удалено ${testProblems.length} тестовых проблем`);
              } catch (error) {
                console.error("Ошибка при удалении тестовых проблем:", error);
                alert("Ошибка при удалении тестовых проблем");
              }
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            disabled={!problems.some((p) => p.title.startsWith("TEST-"))}
          >
            🧹 Очистить тесты
          </Button>
          <Button
            variant="outline"
            onClick={handleActivateAllProblems}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            Активировать все
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAllProblems}
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
                Создать проблему
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новую проблему</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deviceId">Приставка</Label>
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
                      {getActiveDevices().map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded bg-gradient-to-br ${device.color} mr-2`}
                            />
                            {device.name} ({device.model})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Название проблемы</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Нет сигнала"
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
                    placeholder="Подробное описание проблемы"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          category: value as Problem["category"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="icon">Иконка</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) =>
                        setFormData({ ...formData, icon: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center">
                              {getIcon(icon)}
                              <span className="ml-2">{icon}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="color">Цветовая схема</Label>
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
                    onClick={() => {
                      console.log("🔘 ��ажата кнопка создания ��роблемы");
                      handleCreate();
                    }}
                    disabled={
                      !formData.title ||
                      !formData.deviceId ||
                      createProblemMutation.isPending ||
                      (formData.title &&
                        formData.deviceId &&
                        checkForDuplicateTitle(
                          formData.title,
                          formData.deviceId,
                        ))
                    }
                  >
                    {createProblemMutation.isPending
                      ? "Создание..."
                      : formData.title &&
                          formData.deviceId &&
                          checkForDuplicateTitle(
                            formData.title,
                            formData.deviceId,
                          )
                        ? "Название уже существует"
                        : "Создать"}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск проблем..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterDevice} onValueChange={setFilterDevice}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Приставка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приставки</SelectItem>
                  {getActiveDevices().map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblems.map((problem) => {
          const categoryInfo = getCategoryInfo(problem.category);
          const stepsCount = getStepsForProblem(problem.id).length;

          return (
            <Card
              key={problem.id}
              className={`group hover:shadow-lg transition-shadow ${
                problem.is_active === false || problem.status === "archived"
                  ? "opacity-60 border-dashed border-gray-300"
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${problem.color} rounded-xl flex items-center justify-center text-white shadow-lg`}
                  >
                    {getIcon(problem.icon)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        problem.is_active === false ||
                        problem.status === "archived"
                          ? "destructive"
                          : problem.status === "published" ||
                              problem.status === "active" ||
                              problem.is_active
                            ? "default"
                            : "secondary"
                      }
                    >
                      {problem.is_active === false ||
                      problem.status === "archived"
                        ? "Неактивна"
                        : problem.status === "published" ||
                            problem.status === "active" ||
                            problem.is_active
                          ? "Активна"
                          : "Черновик"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{problem.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Tv className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getDeviceName(problem.device_id || problem.deviceId)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {problem.description}
                </p>

                <div className="flex items-center space-x-2">
                  <Badge
                    className={`bg-gradient-to-r ${categoryInfo.color} text-white text-xs`}
                  >
                    {categoryInfo.label}
                  </Badge>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stepsCount}
                    </div>
                    <div className="text-xs text-gray-500">шагов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {(problem.success_rate !== undefined
                        ? problem.success_rate
                        : problem.successRate) || 0}
                      %
                    </div>
                    <div className="text-xs text-gray-500">успеха</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {(problem.completed_count !== undefined
                        ? problem.completed_count
                        : problem.completions) || 0}
                    </div>
                    <div className="text-xs text-gray-500">решений</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(problem.id)}
                      title={
                        problem.status === "published" ||
                        problem.status === "active" ||
                        problem.is_active
                          ? "Деактивировать"
                          : "Активировать"
                      }
                    >
                      {problem.status === "published" ||
                      problem.status === "active" ||
                      problem.is_active ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(problem)}
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
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(problem)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Дубли��овать
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Экспортирова��ь
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteModal(problem)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить навсегда
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
            <DialogTitle>Редактировать проблему</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-deviceId">Приставка</Label>
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
                  {getActiveDevices().map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded bg-gradient-to-br ${device.color} mr-2`}
                        />
                        {device.name} ({device.model})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-title">Название проблемы</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Нет сигнала"
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
                placeholder="Подробное описание проблемы"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Категория</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as Problem["category"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-icon">Иконка</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center">
                          {getIcon(icon)}
                          <span className="ml-2">{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                От��ена
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!formData.title || !formData.deviceId}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredProblems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Пр��блемы не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте измени��ь фильтры поиска ��ли создайт�� новую проблему.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success Modal */}
      <AlertDialog
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Проблема успешно создана!</AlertDialogTitle>
            <AlertDialogDescription>
              Проблема "{createdProblemTitle}" была успешно добавлена в систему
              и готова к использованию.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsSuccessModalOpen(false)}>
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проблему?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите ПОЛНОСТЬЮ УДАЛИТЬ эту проблему из базы
              данных? Это действие нельзя отменить! Проблема "
              {problemToDelete?.title}" будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProblemToDelete(null);
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
    </div>
  );
};

export default ProblemsManager;
