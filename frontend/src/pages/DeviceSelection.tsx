import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, Tv, Search } from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { useProblemSearch } from "@/hooks/useProblems";

const DeviceSelection = () => {
  const navigate = useNavigate();
  const {
    data: devicesResponse,
    isLoading,
    error,
  } = useDevices(1, 50, { status: "active" });

  const [query, setQuery] = useState("");
  const { data: problemsSearch, isLoading: isSearchingProblems } =
    useProblemSearch(query, 12);

  // Извлекаем массивы данных из ответа API
  const devices = devicesResponse?.data || [];

  const filteredDevices = useMemo(() => {
    if (!query.trim()) return devices;
    const q = query.toLowerCase();
    return devices.filter((d: any) =>
      [d.name, d.brand, d.model, d.description]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q)),
    );
  }, [devices, query]);

  const handleDeviceSelect = (deviceId: string) => {
    navigate(`/problems/${deviceId}`);
  };

  const handleBack = () => {
    navigate("/");
  };

  const getDeviceIcon = (brand: string) => {
    // Простой способ создать визуальное представление для каждого бренда
    const brandLower = brand.toLowerCase();

    if (brandLower.includes("openbox") && brandLower.includes("gold")) {
      return "bg-gradient-to-r from-orange-400 to-orange-600";
    } else if (brandLower.includes("openbox")) {
      return "bg-black";
    } else if (brandLower.includes("uclan")) {
      return "bg-gray-800";
    } else if (brandLower.includes("hdbox")) {
      return "bg-black";
    } else {
      return "bg-gray-700";
    }
  };

  const getDeviceDisplayName = (name: string, brand: string) => {
    // Использовать name в первую очередь, но при необходимости добавить brand
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return name;
    }
    return `${brand} ${name}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-gray-600 hover:bg-gray-100 mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Выбор приставки
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Выбор приставки
            </h1>
            <p className="text-xl text-gray-600">
              Выберите модель вашей ТВ-приставки для получения
              персонализированной помощи
            </p>
            {devices.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {filteredDevices.length} из {devices.length} поддерживаемых
                устройств
              </p>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск приставки (например, Openbox, U2C, модель)"
                className="pl-10 h-12 rounded-2xl border-gray-200 bg-white shadow-sm focus-visible:ring-2"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[...Array(4)].map((_, index) => (
                <Card
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm"
                >
                  <CardContent className="p-8 text-center">
                    <Skeleton className="w-32 h-20 mx-auto mb-6 rounded-lg" />
                    <Skeleton className="h-8 w-32 mx-auto mb-3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Произошла ошибка при загрузке устройств. Пожалуйста, попробуйте
                позже.
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!isLoading && !error && devices.length === 0 && (
            <div className="text-center py-16">
              <Tv className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Устройства не найдены
              </h3>
              <p className="text-gray-600">
                В настоящее время нет доступных устройств для диагностики.
              </p>
            </div>
          )}

          {/* Quick Problem Results */}
          {query.trim().length >= 2 && (
            <div className="max-w-4xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Найденные проблемы
              </h3>
              {isSearchingProblems ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card
                      key={i}
                      className="bg-white border border-gray-200 rounded-2xl shadow-sm"
                    >
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : problemsSearch?.data?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {problemsSearch.data.map((p: any) => (
                    <Card
                      key={p.id}
                      className="group cursor-pointer bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
                      onClick={() =>
                        navigate(
                          `/diagnostic/${p.deviceId || p.device_id}/${p.id}`,
                        )
                      }
                    >
                      <CardContent className="p-4">
                        <div className="text-gray-900 font-medium">
                          {p.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {p.deviceName || p.device_name}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Ничего не найдено</div>
              )}
            </div>
          )}

          {/* Devices Grid */}
          {!isLoading && !error && devices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {filteredDevices.map((device) => (
                <Card
                  key={device.id}
                  className="group cursor-pointer bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => handleDeviceSelect(device.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-32 h-20 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                      {device.imageUrl ? (
                        <img
                          src={device.imageUrl}
                          alt={device.name}
                          className="w-24 h-16 object-contain rounded-sm"
                        />
                      ) : (
                        <div
                          className={`w-24 h-16 rounded-sm flex items-center justify-center shadow-sm ${getDeviceIcon(device.brand)}`}
                        >
                          <span className="text-white text-sm font-bold">
                            {device.brand.toUpperCase().substring(0, 8)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {getDeviceDisplayName(device.name, device.brand)}
                    </h3>
                    <p className="text-gray-600">
                      {device.description || `${device.brand} ${device.model}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DeviceSelection;
