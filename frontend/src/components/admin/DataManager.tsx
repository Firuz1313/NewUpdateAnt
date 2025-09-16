import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Checkbox } from "@/components/ui/checkbox";
// Removed useData import - no longer using DataContext
import {
  Download,
  Upload,
  FileText,
  Database,
  History,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  FileDown,
  FileUp,
  Archive,
  RotateCcw,
} from "lucide-react";

interface ImportProgress {
  total: number;
  current: number;
  status: "pending" | "processing" | "completed" | "error";
  message: string;
}

const DataManager = () => {
  // Mock functions for removed static functionality
  const changeLogs: any[] = [];
  const exportData = async (options: any) => ({ downloadUrl: "" });
  const importData = async (file: File, options: any) => ({
    importedCount: 0,
    failedCount: 0,
  });
  const clearCache = () => {};
  const refreshData = async () => {};

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [exportOptions, setExportOptions] = useState({
    format: "json" as "json" | "csv" | "xlsx",
    entities: [] as string[],
    includeMetadata: true,
    includeMedia: false,
  });

  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [historyFilter, setHistoryFilter] = useState("all");

  // Export functionality
  const handleExport = async () => {
    if (exportOptions.entities.length === 0) {
      alert("Выберите хотя бы одну сущность для экспорта");
      return;
    }

    try {
      const result = await exportData(exportOptions);

      // Create download link
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = `ant-support-export-${new Date().toISOString().split("T")[0]}.${exportOptions.format}`;
      link.click();

      setIsExportDialogOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Ошибка экспорта: " + error);
    }
  };

  // Import functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Выберите файл для импорта");
      return;
    }

    setImportProgress({
      total: 100,
      current: 0,
      status: "processing",
      message: "Подготовка к импорту...",
    });

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        setImportProgress({
          total: 100,
          current: i,
          status: "processing",
          message:
            i === 0
              ? "Чтение файла..."
              : i === 20
                ? "Валидация данных..."
                : i === 40
                  ? "Обработка устройств..."
                  : i === 60
                    ? "Обработка проблем..."
                    : i === 80
                      ? "Обработка шагов..."
                      : "Завершение импорта...",
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const result = await importData(selectedFile, {});

      setImportProgress({
        total: 100,
        current: 100,
        status: "completed",
        message: `Импорт завершен: ${result.importedCount} записей импортировано, ${result.failedCount} ошибок`,
      });

      setTimeout(() => {
        setImportProgress(null);
        setSelectedFile(null);
        setIsImportDialogOpen(false);
      }, 2000);
    } catch (error) {
      setImportProgress({
        total: 100,
        current: 0,
        status: "error",
        message: "Ошибка импорта: " + error,
      });
    }
  };

  const handleEntityToggle = (entity: string, checked: boolean) => {
    if (checked) {
      setExportOptions({
        ...exportOptions,
        entities: [...exportOptions.entities, entity],
      });
    } else {
      setExportOptions({
        ...exportOptions,
        entities: exportOptions.entities.filter((e) => e !== entity),
      });
    }
  };

  const filteredLogs = changeLogs.filter((log) => {
    if (historyFilter === "all") return true;
    return log.entityType === historyFilter;
  });

  const handleClearCache = async () => {
    if (
      confirm(
        "Вы уверены, что хотите очистить кэш? Это действие нельзя отменить.",
      )
    ) {
      clearCache();
      alert("Кэш очищен");
    }
  };

  const handleRefresh = async () => {
    await refreshData();
    alert("Данные обновлены");
  };

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Download className="h-5 w-5 mr-2 text-blue-600" />
              ��кспорт данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Экспорт системных данных в различных форматах для резервного
              копирования или миграции
            </p>
            <Dialog
              open={isExportDialogOpen}
              onOpenChange={setIsExportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Начать экспорт
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Экспорт данных</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="format">Формат файла</Label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value) =>
                        setExportOptions({
                          ...exportOptions,
                          format: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Сущности для экспорта</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { id: "devices", label: "Устройства" },
                        { id: "problems", label: "Проблемы" },
                        { id: "steps", label: "Шаги" },
                        { id: "remotes", label: "Пульты" },
                        { id: "tv_interfaces", label: "ТВ интерфейсы" },
                      ].map((entity) => (
                        <div
                          key={entity.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={entity.id}
                            checked={exportOptions.entities.includes(entity.id)}
                            onCheckedChange={(checked) =>
                              handleEntityToggle(entity.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={entity.id} className="text-sm">
                            {entity.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metadata"
                        checked={exportOptions.includeMetadata}
                        onCheckedChange={(checked) =>
                          setExportOptions({
                            ...exportOptions,
                            includeMetadata: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="metadata" className="text-sm">
                        Включить метаданные
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="media"
                        checked={exportOptions.includeMedia}
                        onCheckedChange={(checked) =>
                          setExportOptions({
                            ...exportOptions,
                            includeMedia: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="media" className="text-sm">
                        Включить медиафайлы
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsExportDialogOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button onClick={handleExport}>Экспортировать</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Import */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Upload className="h-5 w-5 mr-2 text-green-600" />
              Импорт данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Импорт данных из файлов резервных копий или внешних источников
            </p>
            <Dialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <FileUp className="h-4 w-4 mr-2" />
                  Начать импорт
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Импорт данных</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!importProgress ? (
                    <>
                      <div>
                        <Label htmlFor="file">Выбрать фай��</Label>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {selectedFile ? selectedFile.name : "Выбрать файл"}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,.csv,.xlsx"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-sm font-medium">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsImportDialogOpen(false)}
                        >
                          Отмена
                        </Button>
                        <Button onClick={handleImport} disabled={!selectedFile}>
                          Импортировать
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div
                          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                            importProgress.status === "processing"
                              ? "bg-blue-100"
                              : importProgress.status === "completed"
                                ? "bg-green-100"
                                : importProgress.status === "error"
                                  ? "bg-red-100"
                                  : "bg-gray-100"
                          }`}
                        >
                          {importProgress.status === "processing" && (
                            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                          )}
                          {importProgress.status === "completed" && (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          )}
                          {importProgress.status === "error" && (
                            <AlertCircle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <div className="font-medium">
                          {importProgress.message}
                        </div>
                      </div>

                      <Progress
                        value={importProgress.current}
                        className="w-full"
                      />

                      <div className="text-center text-sm text-gray-600">
                        {importProgress.current}% завершено
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <History className="h-5 w-5 mr-2 text-purple-600" />
              История изменений
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Просмотр логов всех изменений в системе и истории действий
              пользователей
            </p>
            <Dialog
              open={isHistoryDialogOpen}
              onOpenChange={setIsHistoryDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Посмотреть историю
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>История изменений</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Select
                      value={historyFilter}
                      onValueChange={setHistoryFilter}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все изменения</SelectItem>
                        <SelectItem value="device">Устройства</SelectItem>
                        <SelectItem value="problem">Проблемы</SelectItem>
                        <SelectItem value="step">Шаги</SelectItem>
                        <SelectItem value="remote">Пульты</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary">
                      {filteredLogs.length} записей
                    </Badge>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                log.action === "create"
                                  ? "bg-green-100"
                                  : log.action === "update"
                                    ? "bg-blue-100"
                                    : log.action === "delete"
                                      ? "bg-red-100"
                                      : "bg-gray-100"
                              }`}
                            >
                              {log.action === "create" && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {log.action === "update" && (
                                <RefreshCw className="h-4 w-4 text-blue-600" />
                              )}
                              {log.action === "delete" && (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {log.action === "create" && "Создано"}
                                {log.action === "update" && "Обновлено"}
                                {log.action === "delete" && "Удалено"}{" "}
                                {log.entityType === "device" && "устройство"}
                                {log.entityType === "problem" && "проблема"}
                                {log.entityType === "step" && "шаг"}
                                {log.entityType === "remote" && "пульт"}
                              </div>
                              <div className="text-xs text-gray-600 flex items-center space-x-2">
                                <User className="h-3 w-3" />
                                <span>{log.userId}</span>
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(log.createdAt).toLocaleString("ru")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.entityType}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {filteredLogs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>История изменений пуста</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Системное обслуживание
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить данные
            </Button>
            <Button variant="outline" onClick={handleClearCache}>
              <Archive className="h-4 w-4 mr-2" />
              Очистить кэш
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Оптимизироват�� БД
            </Button>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Восстановить
            </Button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  Осторожно с операциями обслуживания
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Операции очистки кэша и оптимизации базы данных могут временно
                  повлиять на производительность системы. Рекомендуется
                  выполнять эти операции в нерабочее время.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManager;
