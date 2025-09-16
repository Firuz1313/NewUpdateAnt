import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevices } from "@/hooks/useDevices";
import { useProblems } from "@/hooks/useProblems";
import {
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart3,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { data: devicesResponse, isLoading: devicesLoading } = useDevices(
    1,
    50,
    { status: "active" },
  );
  const { data: problemsResponse, isLoading: problemsLoading } = useProblems(
    1,
    50,
    { status: "published" },
  );

  const deviceCount = devicesResponse?.data?.length || 0;
  const problemCount = problemsResponse?.data?.length || 0;
  const devices = devicesResponse?.data || [];

  const handleStartDiagnostic = () => {
    navigate("/devices");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Быстрая диагностика проблем
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Пошаговые инструкции для решения проблем с цифровыми ТВ-приставками.
            <br />
            Простой интерфейс, профессиональные решения.
          </p>

          <Button
            size="lg"
            onClick={handleStartDiagnostic}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-medium rounded-xl"
          >
            Начать диагностику
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="text-center bg-card border border-border rounded-2xl shadow-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-6 bg-primary rounded-sm"></div>
                </div>
                {devicesLoading ? (
                  <Skeleton className="h-12 w-12 mx-auto mb-2 rounded" />
                ) : (
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {deviceCount}
                  </div>
                )}
                <div className="text-muted-foreground font-medium">
                  Поддерживаемых моделей
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-card border border-border rounded-2xl shadow-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-primary">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                    </svg>
                  </div>
                </div>
                {problemsLoading ? (
                  <Skeleton className="h-12 w-12 mx-auto mb-2 rounded" />
                ) : (
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {problemCount}
                  </div>
                )}
                <div className="text-muted-foreground font-medium">
                  Готовых решений
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-card border border-border rounded-2xl shadow-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">
                  99%
                </div>
                <div className="text-muted-foreground font-medium">
                  Успешных решений
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-card border border-border rounded-2xl shadow-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">
                  24/7
                </div>
                <div className="text-muted-foreground font-medium">
                  Доступность
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported Devices Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Поддерживаемые устройства
          </h2>

          {devicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[...Array(4)].map((_, index) => (
                <Card
                  key={index}
                  className="text-center bg-white border border-gray-200 rounded-2xl shadow-sm"
                >
                  <CardContent className="p-8">
                    <Skeleton className="w-24 h-16 mx-auto mb-6 rounded-lg" />
                    <Skeleton className="h-6 w-24 mx-auto mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {devices.slice(0, 4).map((device) => {
                const getDeviceIcon = (brand) => {
                  const brandLower = brand.toLowerCase();
                  if (
                    brandLower.includes("openbox") &&
                    brandLower.includes("gold")
                  ) {
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

                return (
                  <Card
                    key={device.id}
                    className="text-center bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-8">
                      <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-6">
                        {device.imageUrl ? (
                          <img
                            src={device.imageUrl}
                            alt={device.name}
                            className="w-16 h-10 object-contain rounded-sm"
                          />
                        ) : (
                          <div
                            className={`w-16 h-10 rounded-sm flex items-center justify-center ${getDeviceIcon(device.brand)}`}
                          >
                            <span className="text-white text-xs font-bold">
                              {device.brand.toUpperCase().substring(0, 8)}
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {device.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {device.description ||
                          `${device.brand} ${device.model}`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Show placeholder cards if we have fewer than 4 devices */}
              {devices.length < 4 &&
                [...Array(4 - devices.length)].map((_, index) => (
                  <Card
                    key={`placeholder-${index}`}
                    className="text-center bg-muted border border-border border-dashed rounded-2xl shadow-sm"
                  >
                    <CardContent className="p-8">
                      <div className="w-24 h-16 bg-border rounded-lg flex items-center justify-center mx-auto mb-6">
                        <div className="text-muted-foreground text-xs">
                          Скоро
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-muted-foreground mb-2">
                        Новые устройства
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Добавим поддержку новых моделей приставок
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Почему выбирают нас
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Reliability */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Надежность
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Проверенные решения от профессиональных техников с многолетним
                опытом
              </p>
            </div>

            {/* Speed */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Быстрота
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Среднее время решения проблемы составляет всего 2 - 5 минут
              </p>
            </div>

            {/* Efficiency */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Эффективность
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                99% проблем решаются с первого раза без вызова техника
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-6 h-4 bg-primary-foreground rounded-sm"></div>
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">
                  ANT Support
                </div>
                <div className="text-muted-foreground text-sm">
                  Служба поддержки ТВ-приставок
                </div>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              © 2025 ANT Support. Все права защищены.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
