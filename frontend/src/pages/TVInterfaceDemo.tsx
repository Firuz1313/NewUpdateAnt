import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TVDisplay from "@/components/TVDisplay";
import { TVInterface } from "@/types/tvInterface";
import { tvInterfacesAPI } from "@/api/tvInterfaces";
import { useDevices } from "@/hooks/useDevices";
import { Monitor, RefreshCw } from "lucide-react";

const TVInterfaceDemo = () => {
  const { data: devicesResponse } = useDevices();
  const devices = devicesResponse?.data || [];
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [tvInterfaces, setTVInterfaces] = useState<TVInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загружаем TV интерфейсы
  useEffect(() => {
    loadTVInterfaces();
  }, []);

  const loadTVInterfaces = async () => {
    setIsLoading(true);
    try {
      const response = await tvInterfacesAPI.getAll();
      if (response.success && response.data) {
        setTVInterfaces(response.data);
      }
    } catch (error) {
      console.error("Error loading TV interfaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ф��льтруем интерфейсы для выбранного устройства
  const interfacesForDevice = selectedDeviceId
    ? tvInterfaces.filter((iface) => iface.deviceId === selectedDeviceId)
    : [];

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Демо TV Interface
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Тестирование отображения созданных интерфейсов ТВ-приставок
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Управление
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Выберите устройство
              </label>
              <Select
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите устройство" />
                </SelectTrigger>
                <SelectContent>
                  {(devices || []).map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={loadTVInterfaces}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Обновить интерфейсы
            </Button>

            {selectedDevice && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Информация об устройстве</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    <strong>Название:</strong> {selectedDevice.name}
                  </div>
                  <div>
                    <strong>Бренд:</strong> {selectedDevice.brand}
                  </div>
                  <div>
                    <strong>Модель:</strong> {selectedDevice.model}
                  </div>
                </div>
              </div>
            )}

            {interfacesForDevice.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">
                  Найдено интерфейсов: {interfacesForDevice.length}
                </h3>
                <div className="space-y-2">
                  {interfacesForDevice.map((iface) => (
                    <div
                      key={iface.id}
                      className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="font-medium">{iface.name}</div>
                      {iface.description && (
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          {iface.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {iface.isActive ? "✅ Активен" : "❌ Неактивен"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDeviceId && interfacesForDevice.length === 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  Для этого устройства нет созданных интерфейсов.
                  <br />
                  Создайте интерфейс в админ-панели.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TV Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Предварительный просмотр ТВ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video">
              <TVDisplay
                deviceId={selectedDeviceId}
                className="w-full h-full"
                isConnected={true}
                isLoading={isLoading}
              />
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {selectedDeviceId ? (
                interfacesForDevice.length > 0 ? (
                  <>
                    Отображается интерфейс для устройства:{" "}
                    <strong>{selectedDevice?.name}</strong>
                    <br />
                    {interfacesForDevice.some((i) => i.screenshotData)
                      ? "Найден кастомный скриншот интерфейса"
                      : "Используется стандартный интерфейс (нет загруженного скриншота)"}
                  </>
                ) : (
                  "Для выбранного устройства нет созданных интерфейсов. Отображается стандартный экран."
                )
              ) : (
                "Выберите ус��ройство для п��осмотра интерфейса"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Инструкция по использованию</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Создание интерфейса:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Перейдите в админ-панель → "Конструктор интерфейса ТВ"</li>
                <li>Нажмите "Создать интерфейс"</li>
                <li>Выберите устройство и загрузите скриншот интерфейса</li>
                <li>Сохраните интерфейс</li>
              </ul>
            </div>

            <div>
              <strong>2. Просмотр на странице диагностики:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>
                  Созданные интерфейсы автоматически отображаются на странице
                  диагност��ки
                </li>
                <li>
                  Если для устройства есть активный интерфейс со скриншотом, он
                  будет показан вместо стандартного экрана
                </li>
                <li>
                  Поддерживается fallback на ��тандартные экраны, если нет
                  кастомного интерфейса
                </li>
              </ul>
            </div>

            <div>
              <strong>3. Управление интерфейсами:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Редактирование существующих интерфейсов</li>
                <li>Активация/деактивация интерфейсов</li>
                <li>Удаление ненужных интерфейсов</li>
                <li>Фильтрация по устройствам</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TVInterfaceDemo;
