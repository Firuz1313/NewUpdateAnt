import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertTriangle, Search } from "lucide-react";
import { useProblems } from "@/hooks/useProblems";
import { useDevices } from "@/hooks/useDevices";

// Default OpenBox problems from PDF
const defaultOpenBoxProblems = [
  {
    id: "no-signal-tuner",
    title: "Нет сигнала от тюнера",
    description: "Проблемы с приемом сигнала от тюнера",
  },
  {
    id: "no-signal-tv",
    title: "Нет сигнала от телевизора",
    description: "Отсутствует сигнал от телевизора",
  },
  {
    id: "coded-channel",
    title: "Если пишет кодированный канал",
    description: "Появляется сообщение о кодированном канале",
  },
  {
    id: "black-screen",
    title: "Телеканалы есть, но экран черный",
    description: "Каналы доступны, но изображение отсутствует",
  },
  {
    id: "remote-not-working",
    title: "Пульт дистанционного управления не работает",
    description: "Пульт не реагирует на нажатия",
  },
  {
    id: "no-image-with-sound",
    title: "В нескольких каналах нет изображения, но есть звук",
    description: "На некоторых каналах только звук без картинки",
  },
  {
    id: "image-no-sound",
    title: "Изображение есть, но нет звука",
    description: "Видео отображается, но звук отсутствует",
  },
  {
    id: "image-cropped",
    title: "Изображение обрезается с обеих сторон экрана",
    description: "Картинка не помещается на экране полностью",
  },
];

const ProblemsPage = () => {
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();

  const { data: devicesResponse } = useDevices();
  // Запрашиваем проблемы только для выбранной приставки
  const { data: problemsResponse } = useProblems(1, 50, {
    deviceId,
    status: "published",
  });

  // Извлекаем массивы данных из ответа API
  const devices = devicesResponse?.data || [];
  const apiProblems = problemsResponse?.data || [];

  const device = devices.find((d: any) => d.id === deviceId);

  const [query, setQuery] = useState("");

  // Явная фильтрация по deviceId на случай, если бэкенд вернул смешанные данные
  const filteredProblems = apiProblems.filter(
    (p: any) => p.deviceId === deviceId || p.device_id === deviceId,
  );

  // Используем отфильтрованные проблемы, иначе дефолтные только для OpenBox
  const displayProblems =
    filteredProblems.length > 0
      ? filteredProblems
      : deviceId === "openbox"
        ? defaultOpenBoxProblems
        : [];

  const visibleProblems = useMemo(() => {
    if (!query.trim()) return displayProblems;
    const q = query.toLowerCase();
    return displayProblems.filter((p: any) =>
      [p.title, p.description]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q)),
    );
  }, [displayProblems, query]);

  const handleProblemSelect = (problemId: string) => {
    navigate(`/diagnostic/${deviceId}/${problemId}`);
  };

  const handleBack = () => {
    navigate("/devices");
  };

  if (!device && deviceId !== "openbox") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Приставка не найдена
          </h2>
          <Button onClick={() => navigate("/devices")}>
            Выбрать приставку
          </Button>
        </div>
      </div>
    );
  }

  // Use device data or default for OpenBox
  const deviceName = device?.name || "OpenBox";
  const deviceModel =
    device?.model || "Стандартные приставки OpenBox для цифрового телевидения";

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
                Какая проблема с {deviceName}?
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Какая проблема с {deviceName}?
            </h1>
            <p className="text-xl text-gray-600">
              Выберите проблему, которая лучше всего описывает вашу ситуацию
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Поиск проблем (например, "Нет сигнала")'
                className="pl-10 h-12 rounded-2xl border-gray-200 bg-white shadow-sm focus-visible:ring-2"
              />
            </div>
            <div className="text-sm text-gray-500 mt-2 text-center">
              Найдено: {visibleProblems.length} из {displayProblems.length}
            </div>
          </div>

          {/* Device Info Card */}
          <div className="mb-12">
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="w-12 h-8 bg-black rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {deviceId === "openbox"
                          ? "OPENBOX"
                          : deviceName.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {deviceName}
                    </h3>
                    <p className="text-gray-600 text-sm">{deviceModel}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {displayProblems.length}
                    </div>
                    <div className="text-gray-600 text-sm">типов проблем</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Problems Grid */}
          {displayProblems.length === 0 ? (
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Нет доступных проблем
                </h3>
                <p className="text-gray-600 mb-6">
                  Для данной модели приставки пока нет настроенных решений
                  проблем
                </p>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Связаться с поддержкой
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleProblems.map((problem) => (
                <Card
                  key={problem.id}
                  className="group cursor-pointer bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex-1 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">
                        {problem.title}
                      </h3>
                      {problem.description && (
                        <p className="text-gray-600 text-sm">
                          {problem.description}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleProblemSelect(problem.id)}
                      className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 font-medium"
                      variant="outline"
                    >
                      Начать диагностику
                    </Button>
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

export default ProblemsPage;
