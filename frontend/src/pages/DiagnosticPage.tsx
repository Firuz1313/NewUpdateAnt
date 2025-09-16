import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TVInterfaceDisplay from "@/components/TVInterfaceDisplay";
import RemoteControl from "@/components/RemoteControl";
import { useDevices } from "@/hooks/useDevices";
import { useProblems } from "@/hooks/useProblems";
import { remotesApi, stepsApi } from "@/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Tv,
  X,
} from "lucide-react";

const DiagnosticPage = () => {
  const navigate = useNavigate();
  const { deviceId, problemId } = useParams<{
    deviceId: string;
    problemId: string;
  }>();

  // API hooks
  const { data: devicesResponse, isLoading: devicesLoading } = useDevices();
  const { data: problemsResponse, isLoading: problemsLoading } = useProblems(
    1,
    20,
    { deviceId },
  );

  // Extract data arrays from API responses
  const devices = devicesResponse?.data || [];
  const problems = problemsResponse?.data || [];

  // Local state
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [manualProgress, setManualProgress] = useState(false);
  const [steps, setSteps] = useState([]);
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tvMode, setTvMode] = useState(false);

  // Derived state
  const device = devices?.find((d) => d.id === deviceId);
  const problem = problems?.find((p) => p.id === problemId);
  const currentStepData = steps.find(
    (step) => step.stepNumber === currentStepNumber,
  );

  // Load steps when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!problemId || !deviceId) return;

      try {
        setLoading(true);
        const stepsResponse = await stepsApi.getStepsByProblem(problemId);
        setSteps(stepsResponse?.data || []);
      } catch (error) {
        console.error("Error loading diagnostic data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [problemId, deviceId]);

  // Load remote
  useEffect(() => {
    const loadRemote = async () => {
      if (!deviceId) return;

      try {
        // Try step-specific remote first
        if (currentStepData?.remoteId) {
          try {
            const stepRemote = await remotesApi.getById(
              currentStepData.remoteId,
            );
            setRemote(stepRemote);
            return;
          } catch (stepError) {
            console.warn(`Failed to load step-specific remote`, stepError);
          }
        }

        // Try device default remote
        try {
          const defaultRemote = await remotesApi.getDefaultForDevice(deviceId);
          setRemote(defaultRemote);
          return;
        } catch (defaultError: any) {
          // Try any remote for device
          try {
            const deviceRemotes = await remotesApi.getByDevice(deviceId);
            if (deviceRemotes && deviceRemotes.length > 0) {
              setRemote(deviceRemotes[0]);
              return;
            }
          } catch (deviceError) {
            console.error(`Failed to load device remotes`, deviceError);
          }
        }

        // Final fallback
        const fallbackRemote = {
          id: `fallback-${deviceId}`,
          name: `${deviceId.toUpperCase()} Remote`,
          manufacturer: deviceId.toUpperCase(),
          model: "Universal",
          device_id: deviceId,
          layout: "standard",
          is_default: false,
          buttons: [],
          dimensions: { width: 140, height: 420 },
        };
        setRemote(fallbackRemote);
      } catch (error) {
        console.error(`Error loading remote`, error);
      }
    };

    loadRemote();
  }, [deviceId, currentStepData?.remoteId]);

  // Keyboard navigation in TV mode
  useEffect(() => {
    if (!tvMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTvMode(false);
      if (e.key === "ArrowRight") handleNextStep();
      if (e.key === "ArrowLeft") handlePrevStep();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tvMode, currentStepNumber, steps.length]);

  const handlePrevStep = () => {
    if (currentStepNumber > 1) {
      setCurrentStepNumber(currentStepNumber - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepNumber < steps.length) {
      setCurrentStepNumber(currentStepNumber + 1);
    } else {
      navigate(`/success/${deviceId}/${problemId}`);
    }
  };

  const handleBack = () => {
    navigate(`/problems/${deviceId}`);
  };

  const handleManualProgress = () => {
    setManualProgress(true);
    setTimeout(() => setManualProgress(false), 2000);
  };

  if (devicesLoading || problemsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-900">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Загрузка диагностики...</p>
        </div>
      </div>
    );
  }

  if (!device || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-900">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" />
          <p>Устройство или проблема не найдены</p>
          <Button onClick={handleBack} className="mt-4" variant="outline">
            Вернуться назад
          </Button>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-900">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" />
          <p>Шаги диагностики не найдены</p>
          <Button onClick={handleBack} className="mt-4" variant="outline">
            Вернуться назад
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:bg-gray-100 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {device.name || "OpenBox"}
                </h1>
                <p className="text-gray-600 text-sm">
                  {problem.title || "Диагностика"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTvMode(true)}
                className="gap-2"
              >
                <Tv className="h-4 w-4" /> ТВ режим
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center mb-4">
            {Array.from({ length: steps.length }, (_, index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    index + 1 <= currentStepNumber
                      ? "bg-gray-900 border-gray-900"
                      : index + 1 === currentStepNumber
                        ? "bg-white border-gray-900"
                        : "bg-white border-gray-300"
                  }`}
                />
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 ${
                      index + 1 < currentStepNumber
                        ? "bg-gray-900"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-gray-600 text-sm">
            Шаг {currentStepNumber}
          </div>
        </div>

        {/* Main Content - Responsive Mockup Layout */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12">
          {/* TV Section - Top on Mobile, Left on Desktop */}
          <div className="flex flex-col items-center">
            {/* TV Display - Responsive Sizing */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardContent className="p-0 relative">
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 w-3/4 max-w-[700px] h-5 bg-black/35 blur-xl rounded-full opacity-80"></div>
                <div
                  className="relative bg-gray-900 rounded-2xl overflow-hidden w-full max-w-[900px] aspect-video lg:aspect-[900/520] shadow-2xl shadow-black/50 ring-1 ring-black/10 transform-gpu transition-transform duration-700 ease-out hover:-translate-y-1"
                  style={{
                    width: "90vw",
                    maxWidth: "900px",
                    height: "calc(90vw * 520/900)",
                    maxHeight: "520px",
                  }}
                >
                  {currentStepData?.tvInterfaceId ? (
                    <TVInterfaceDisplay
                      tvInterfaceId={currentStepData.tvInterfaceId}
                      stepId={currentStepData.id}
                      tvAreaPosition={currentStepData.tvAreaPosition}
                      tvAreaRect={currentStepData.tvAreaRect}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                      {/* Default TV Interface - Mockup Style */}
                      <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center text-white">
                            <div className="w-6 h-6 mr-3">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                              </svg>
                            </div>
                            <span className="text-lg font-medium">
                              Главное меню
                            </span>
                          </div>
                          <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                            Шаг 1
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="bg-gray-600 rounded-lg p-4 text-center text-white hover:bg-gray-500 transition-colors">
                            <div className="w-10 h-10 mx-auto mb-3 text-red-500">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                              </svg>
                            </div>
                            <div className="font-medium">Прямой эфир</div>
                          </div>

                          <div className="bg-gray-600 rounded-lg p-4 text-center text-white hover:bg-gray-500 transition-colors">
                            <div className="w-10 h-10 mx-auto mb-3 text-blue-500">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                              </svg>
                            </div>
                            <div className="font-medium">Настройки</div>
                          </div>

                          <div className="bg-gray-600 rounded-lg p-4 text-center text-white hover:bg-gray-500 transition-colors">
                            <div className="w-10 h-10 mx-auto mb-3 text-green-500">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
                              </svg>
                            </div>
                            <div className="font-medium">Приложения</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation + Hint row */}
            <div
              className="mt-6 w-full max-w-[900px]"
              style={{ width: "90vw", maxWidth: "900px" }}
            >
              {/* Top row: fixed buttons only */}
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <Button
                  onClick={handlePrevStep}
                  disabled={currentStepNumber <= 1}
                  variant="ghost"
                  size="icon"
                  className="w-20 h-20 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-30 [&_svg]:!size-12"
                >
                  <ChevronLeft className="h-12 w-12" />
                </Button>

                <div className="min-w-0 flex justify-center px-2">
                  <div className="inline-flex items-start gap-2 text-gray-600 text-base leading-snug text-center break-words whitespace-pre-line max-w-full">
                    <Lightbulb className="h-10 w-10 -ml-4 text-yellow-400 animate-pulse drop-shadow" />
                    <span className="block min-w-0 max-w-full">
                      {currentStepData?.hint ??
                        "Красная точка на пульте показывает точное место для нажатия"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleNextStep}
                  variant="ghost"
                  size="icon"
                  className="w-20 h-20 rounded-full text-gray-400 hover:text-gray-600 [&_svg]:!size-12"
                >
                  <ChevronRight className="h-12 w-12" />
                </Button>
              </div>
            </div>
          </div>

          {/* Remote Control - Bottom on Mobile, Right on Desktop - Positioned lower */}
          <div className="flex justify-center lg:justify-start lg:items-start lg:mt-0">
            <Card className="bg-transparent border-0 shadow-none rounded-none">
              <CardContent className="p-0">
                <div className="w-[220px] h-[480px] sm:w-[240px] sm:h-[520px] lg:w-[300px] lg:h-[620px]">
                  <RemoteControl
                    remote={remote}
                    highlightButton={
                      currentStepData?.highlightRemoteButton || "power"
                    }
                    showButtonPosition={currentStepData?.buttonPosition}
                    onButtonClick={handleManualProgress}
                    className="w-full h-full"
                    pointerVariant="diagnostic"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Manual Progress Indicator */}
        {manualProgress && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Действие выполнено!
          </div>
        )}
      </main>
      {/* Immersive TV Mode Overlay */}
      <AnimatePresence>
        {tvMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className="relative w-full h-full"
            >
              {/* Close button */}
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => setTvMode(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Content layout */}
              <div className="h-full w-full grid grid-cols-[1fr_auto] items-center gap-6 px-4">
                {/* Center-left nav button */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[1000] pointer-events-auto">
                  <Button
                    onClick={handlePrevStep}
                    disabled={currentStepNumber <= 1}
                    variant="ghost"
                    size="icon"
                    className="w-20 h-20 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 [&_svg]:!size-12"
                  >
                    <ChevronLeft className="h-12 w-12" />
                  </Button>
                </div>

                {/* TV Display */}
                <div className="flex items-center justify-center h-[88vh] z-0">
                  <div className="relative w-full max-w-[1600px] aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
                    {currentStepData?.tvInterfaceId ? (
                      <TVInterfaceDisplay
                        tvInterfaceId={currentStepData.tvInterfaceId}
                        stepId={currentStepData.id}
                        tvAreaPosition={currentStepData.tvAreaPosition}
                        tvAreaRect={currentStepData.tvAreaRect}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60">
                        Нет сигнала
                      </div>
                    )}
                  </div>
                </div>

                {/* Remote panel */}
                <div className="relative flex items-center justify-center z-[200] pointer-events-auto">
                  <div className="w-[300px] h-[640px] lg:w-[360px] lg:h-[780px]">
                    <RemoteControl
                      remote={remote}
                      highlightButton={
                        currentStepData?.highlightRemoteButton || "power"
                      }
                      showButtonPosition={currentStepData?.buttonPosition}
                      onButtonClick={handleManualProgress}
                      className="w-full h-full"
                      pointerVariant="diagnostic"
                      disableZoom
                      disableHoverEffects
                      minButtonSizePx={44}
                      hidePointer={false}
                    />
                  </div>
                </div>

                {/* Center-right nav button */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] pointer-events-auto">
                  <Button
                    onClick={handleNextStep}
                    variant="ghost"
                    size="icon"
                    className="w-20 h-20 rounded-full text-white/70 hover:text-white hover:bg-white/10 [&_svg]:!size-12"
                  >
                    <ChevronRight className="h-12 w-12" />
                  </Button>
                </div>
                {/* Hint overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-[80vw] text-center z-20 pointer-events-none">
                  <div className="inline-flex items-start gap-3 text-white/90 text-lg leading-snug bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl ring-1 ring-white/15">
                    <Lightbulb className="h-6 w-6 text-yellow-300 flex-shrink-0" />
                    <span>
                      {currentStepData?.hint ??
                        "Нажмите подсвеченную кнопку на пульте, чтобы продолжить"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticPage;
