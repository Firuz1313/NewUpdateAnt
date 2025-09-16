import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { tvInterfacesAPI } from "@/api/tvInterfaces";
import { TVInterface, tvInterfaceUtils } from "@/types/tvInterface";
import {
  Search,
  Bug,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const TVInterfaceDiagnostics = () => {
  const { toast } = useToast();
  const [interfaceId, setInterfaceId] = useState("");
  const [interface_, setInterface] = useState<TVInterface | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Автоматически проверяем проблемный интерфейс q1234567
  useEffect(() => {
    // Найдем интерфейс q1234567 автоматически
    loadInterfaceByName("q1234567");
  }, []);

  const loadInterfaceByName = async (name: string) => {
    setIsLoading(true);
    try {
      const response = await tvInterfacesAPI.getAll();
      if (response.success && response.data) {
        const foundInterface = response.data.find(
          (iface) => iface.name === name,
        );
        if (foundInterface) {
          setInterfaceId(foundInterface.id);
          await loadInterface(foundInterface.id);
        } else {
          toast({
            title: "Не найдено",
            description: `Интерфейс с именем "${name}" не найден`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error loading interface by name:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInterface = async (id: string) => {
    if (!id.trim()) return;

    setIsLoading(true);
    try {
      // Получаем интерфейс по ID
      const response = await tvInterfacesAPI.getById(id);
      console.log("🔍 Interface raw response:", response);

      if (response.success && response.data) {
        const rawInterface = response.data;
        const normalizedInterface =
          tvInterfaceUtils.normalizeFromBackend(rawInterface);

        setInterface(normalizedInterface);

        // Выполняем диагностику
        const diagnostics = {
          // Исходные данные с бэкенда
          raw: {
            id: rawInterface.id,
            name: rawInterface.name,
            description: rawInterface.description,
            created_at: rawInterface.created_at,
            updated_at: rawInterface.updated_at,
            screenshot_url: rawInterface.screenshot_url,
            screenshot_data_length: rawInterface.screenshot_data
              ? rawInterface.screenshot_data.length
              : 0,
            screenshot_data_preview: rawInterface.screenshot_data
              ? rawInterface.screenshot_data.substring(0, 100) + "..."
              : null,
            device_name: rawInterface.device_name,
            is_active: rawInterface.is_active,
          },

          // Нормализованные данные
          normalized: {
            id: normalizedInterface.id,
            name: normalizedInterface.name,
            description: normalizedInterface.description,
            createdAt: normalizedInterface.createdAt,
            updatedAt: normalizedInterface.updatedAt,
            screenshotUrl: normalizedInterface.screenshotUrl,
            screenshotData_length: normalizedInterface.screenshotData
              ? normalizedInterface.screenshotData.length
              : 0,
            screenshotData_preview: normalizedInterface.screenshotData
              ? normalizedInterface.screenshotData.substring(0, 100) + "..."
              : null,
            deviceName: normalizedInterface.deviceName,
            isActive: normalizedInterface.isActive,
          },

          // Результаты утилит
          utils: {
            hasScreenshot: tvInterfaceUtils.hasScreenshot(normalizedInterface),
            screenshotUrl:
              tvInterfaceUtils.getScreenshotUrl(normalizedInterface),
            isActive: tvInterfaceUtils.isActive(normalizedInterface),
          },

          // Проверки
          checks: {
            hasRawScreenshotData: !!rawInterface.screenshot_data,
            hasNormalizedScreenshotData: !!normalizedInterface.screenshotData,
            screenshotDataMatches:
              rawInterface.screenshot_data ===
              normalizedInterface.screenshotData,
            validBase64: rawInterface.screenshot_data
              ? rawInterface.screenshot_data.startsWith("data:image/")
              : false,
            dateValidation: {
              created_at_valid: rawInterface.created_at
                ? !isNaN(new Date(rawInterface.created_at).getTime())
                : false,
              updated_at_valid: rawInterface.updated_at
                ? !isNaN(new Date(rawInterface.updated_at).getTime())
                : false,
            },
          },
        };

        setDiagnosticResults(diagnostics);
        console.log("🔍 Diagnostic results:", diagnostics);
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось загрузить интерфейс",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading interface:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке интерфейса",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            TV Interface Diagnostics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Диагностика проблем с отображением TV интерфейсов
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск интерфейса</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="interface-id">ID интерфейса</Label>
              <Input
                id="interface-id"
                value={interfaceId}
                onChange={(e) => setInterfaceId(e.target.value)}
                placeholder="Введите ID интерфейса"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => loadInterface(interfaceId)}
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                Диагностировать
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {interface_ && diagnosticResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interface Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Превью интерфейса</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{interface_.name}</h3>
                  <p className="text-sm text-gray-600">
                    {interface_.description}
                  </p>
                  <p className="text-xs text-gray-500">ID: {interface_.id}</p>
                </div>

                <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative border rounded">
                  {tvInterfaceUtils.hasScreenshot(interface_) ? (
                    <img
                      src={tvInterfaceUtils.getScreenshotUrl(interface_)!}
                      alt={interface_.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.error("🖼️ Image load error:", e);
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling!.style.display =
                          "block";
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Нет скриншота</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Results */}
          <Card>
            <CardHeader>
              <CardTitle>Результаты диагностики</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Основные проверки</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={diagnosticResults.checks.hasRawScreenshotData}
                      />
                      <span className="text-sm">
                        Есть исходные данные скриншота
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={
                          diagnosticResults.checks.hasNormalizedScreenshotData
                        }
                      />
                      <span className="text-sm">
                        Есть нормализованные данные скриншота
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={diagnosticResults.checks.validBase64}
                      />
                      <span className="text-sm">Валидный Base64 формат</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={diagnosticResults.utils.hasScreenshot}
                      />
                      <span className="text-sm">Утилита hasScreenshot()</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={!!diagnosticResults.utils.screenshotUrl}
                      />
                      <span className="text-sm">
                        Утилита getScreenshotUrl()
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Размеры данных</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      Исходные данные:{" "}
                      {formatBytes(
                        diagnosticResults.raw.screenshot_data_length,
                      )}
                    </div>
                    <div>
                      Нормализованные:{" "}
                      {formatBytes(
                        diagnosticResults.normalized.screenshotData_length,
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Даты</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={
                          diagnosticResults.checks.dateValidation
                            .created_at_valid
                        }
                      />
                      <span>Создано: {diagnosticResults.raw.created_at}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon
                        status={
                          diagnosticResults.checks.dateValidation
                            .updated_at_valid
                        }
                      />
                      <span>Обновлено: {diagnosticResults.raw.updated_at}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Data */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Отладочная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">
                    Исходные данные (Backend)
                  </h4>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(diagnosticResults.raw, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    Нормализованные данные (Frontend)
                  </h4>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(diagnosticResults.normalized, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TVInterfaceDiagnostics;
