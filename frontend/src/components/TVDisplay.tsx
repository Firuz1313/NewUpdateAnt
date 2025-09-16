import React, { useState, useEffect } from 'react';
import { TVInterface } from '@/types/tvInterface';
import { tvInterfacesAPI } from '@/api/tvInterfaces';
import { cn } from '@/lib/utils';
import { Monitor, Wifi, WifiOff } from 'lucide-react';

interface TVDisplayProps {
  deviceId?: string;
  interfaceScreen?: string; // Fallback для старых интерфейсов
  tvInterfaceId?: string; // ID конкретного созданного интерфейса
  className?: string;
  isConnected?: boolean;
  isLoading?: boolean;
}

const TVDisplay: React.FC<TVDisplayProps> = ({
  deviceId,
  interfaceScreen = 'home',
  tvInterfaceId,
  className,
  isConnected = true,
  isLoading = false
}) => {
  const [tvInterface, setTvInterface] = useState<TVInterface | null>(null);
  const [loadingInterface, setLoadingInterface] = useState(false);

  // Загружаем TV интерфейс
  useEffect(() => {
    if (tvInterfaceId) {
      // Загружаем конкретный интерфейс по ID
      loadSpecificTVInterface(tvInterfaceId);
    } else if (deviceId) {
      // Загружаем интерфейсы для устройства
      loadTVInterfaceByDevice();
    }
  }, [deviceId, tvInterfaceId]);

  const loadSpecificTVInterface = async (interfaceId: string) => {
    setLoadingInterface(true);
    try {
      const response = await tvInterfacesAPI.getById(interfaceId);
      if (response.success && response.data) {
        setTvInterface(response.data);
      } else {
        setTvInterface(null);
      }
    } catch (error) {
      console.error('Error loading specific TV interface:', error);
      setTvInterface(null);
    } finally {
      setLoadingInterface(false);
    }
  };

  const loadTVInterfaceByDevice = async () => {
    if (!deviceId) return;

    setLoadingInterface(true);
    try {
      const response = await tvInterfacesAPI.getByDeviceId(deviceId);
      if (response.success && response.data && response.data.length > 0) {
        // Берем первый активный интерфейс для устройства
        const activeInterface = response.data.find(iface => iface.isActive) || response.data[0];
        setTvInterface(activeInterface);
      } else {
        setTvInterface(null);
      }
    } catch (error) {
      console.error('Error loading TV interface by device:', error);
      setTvInterface(null);
    } finally {
      setLoadingInterface(false);
    }
  };

  // Рендер содержимого экрана ТВ
  const renderTVContent = () => {
    // Если загружается интерфейс
    if (loadingInterface) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      );
    }

    // Если есть созданный TV интерфейс с скриншотом
    if (tvInterface?.screenshotData) {
      return (
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={tvInterface.screenshotData}
            alt={tvInterface.name}
            className="w-full h-full object-cover"
          />

          {/* Render highlight areas */}
          {tvInterface.highlightAreas && Array.isArray(tvInterface.highlightAreas) &&
            tvInterface.highlightAreas.length > 0 && (
            <>
              {tvInterface.highlightAreas.map((area: any, index: number) => (
                <div
                  key={`highlight-${index}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(area.x / 100) * 100}%`,
                    top: `${(area.y / 100) * 100}%`,
                    width: `${(area.width / 100) * 100}%`,
                    height: `${(area.height / 100) * 100}%`,
                    backgroundColor: area.color || '#fbbf24',
                    opacity: area.opacity || 0.3,
                    borderRadius: area.shape === 'circle' ? '50%' : '4px',
                  }}
                >
                  {area.label && (
                    <div className="absolute -top-6 left-0 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {area.label}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Render clickable areas */}
          {tvInterface.clickableAreas && Array.isArray(tvInterface.clickableAreas) &&
            tvInterface.clickableAreas.length > 0 && (
            <>
              {tvInterface.clickableAreas.map((area: any, index: number) => (
                <div
                  key={`clickable-${index}`}
                  className="absolute border-2 border-dashed pointer-events-none animate-pulse"
                  style={{
                    left: `${(area.x / 100) * 100}%`,
                    top: `${(area.y / 100) * 100}%`,
                    width: `${(area.width / 100) * 100}%`,
                    height: `${(area.height / 100) * 100}%`,
                    borderColor: area.color || '#3b82f6',
                    borderRadius: area.shape === 'circle' ? '50%' : '4px',
                  }}
                >
                  {area.label && (
                    <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {area.label}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Overlay с информацией об интерфейсе */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {tvInterface.name}
          </div>
        </div>
      );
    }

    // Fallback - стандартные экраны
    const getDefaultScreen = () => {
      switch (interfaceScreen) {
        case 'home':
          return (
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 bg-black/20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-white font-semibold">ANT TV</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-sm">12:34</span>
                  {isConnected ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-4 gap-4 h-full">
                  {/* App Icons */}
                  {['Netflix', 'YouTube', 'Prime Video', 'Настройки', 'Каналы', 'Фильмы', 'Музыка', 'Игры'].map((app, index) => (
                    <div
                      key={index}
                      className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded mb-2"></div>
                      <span className="text-white text-xs text-center">{app}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'settings':
          return (
            <div className="bg-gray-900 h-full p-6">
              <h2 className="text-white text-2xl font-bold mb-6">Настройки</h2>
              <div className="space-y-4">
                {['Сеть и интернет', 'Изображение и звук', 'Приложения', 'Система', 'Пульт и аксессуары'].map((setting, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-white">{setting}</span>
                    <span className="text-gray-400">›</span>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'channels':
          return (
            <div className="bg-black h-full p-4">
              <div className="grid grid-cols-6 gap-2 h-full">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded p-2 flex flex-col items-center justify-center"
                  >
                    <div className="text-white text-lg font-bold">{i + 1}</div>
                    <div className="text-gray-400 text-xs">Канал {i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'no-signal':
          return (
            <div className="bg-black h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-4xl font-bold mb-4">НЕТ СИГНАЛА</div>
                <div className="text-gray-400">Проверьте подключение кабеля</div>
              </div>
            </div>
          );

        default:
          return (
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 h-full flex items-center justify-center">
              <div className="text-center">
                <Monitor className="h-16 w-16 text-white mx-auto mb-4" />
                <div className="text-white text-xl font-semibold">ANT TV</div>
                <div className="text-blue-200 text-sm">Готов к работе</div>
              </div>
            </div>
          );
      }
    };

    return getDefaultScreen();
  };

  return (
    <div
      className={cn(
        "relative bg-black rounded-lg overflow-hidden shadow-xl border-4 border-gray-800",
        "aspect-video min-h-[240px]",
        isLoading && "animate-pulse",
        className
      )}
    >
      {/* TV Frame */}
      <div className="absolute inset-0 border-2 border-gray-700 rounded-lg">
        {/* Screen Content */}
        <div className="w-full h-full rounded-md overflow-hidden">
          {renderTVContent()}
        </div>

        {/* TV Brand Label */}
        <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-75">
          ANT
        </div>

        {/* Power Indicator */}
        <div className="absolute top-2 right-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-400" : "bg-red-400"
          )}></div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm">Загрузка...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TVDisplay;
