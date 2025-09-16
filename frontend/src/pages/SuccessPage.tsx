import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Home,
  ArrowRight,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

const SuccessPage = () => {
  const navigate = useNavigate();
  const {
    deviceId,
    sessionId,
    problemId: paramProblemId,
  } = useParams<{
    deviceId?: string;
    sessionId?: string;
    problemId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const problemId =
    paramProblemId || searchParams.get("problemId") || undefined;
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const getProblemTitle = (id: string) => {
    return "Проблема успешно решена!";
  };

  const getSolutionMessage = (id: string) => {
    return "Отличная работа! Диагностика завершена и проблема полностью устранена. Ваша ТВ-приставка готова к использованию.";
  };

  const handleTryAgain = () => {
    if (deviceId && problemId) {
      navigate(`/diagnostic/${deviceId}/${problemId}`);
    } else if (deviceId) {
      navigate(`/problems/${deviceId}`);
    }
  };

  const handleNewProblem = () => {
    if (deviceId) {
      navigate(`/problems/${deviceId}`);
    } else {
      navigate("/devices");
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" className="text-gray-900" />
            <motion.div
              className="flex items-center space-x-2 bg-ant-success/10 px-4 py-2 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <CheckCircle className="h-5 w-5 text-ant-success" />
              <span className="text-sm font-medium text-ant-success">
                Диагностика завершена
              </span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className="relative mx-auto mb-8 w-32 h-32"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-ant-blue to-ant-blue-dark rounded-full opacity-10 animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-ant-success to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                <Trophy className="h-16 w-16 text-white" />
              </div>
              {/* Decorative stars */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -left-2"
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-5 w-5 text-ant-blue fill-current" />
              </motion.div>
            </motion.div>

            {/* Success Title */}
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Превосходно!
            </motion.h1>

            {/* Success Subtitle */}
            <motion.h2
              className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-ant-blue to-ant-blue-dark bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {problemId && getProblemTitle(problemId)}
            </motion.h2>

            {/* Success Description */}
            <motion.p
              className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              {problemId && getSolutionMessage(problemId)}
            </motion.p>
          </motion.div>

          {/* Features Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-ant-blue to-ant-blue-dark rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Проблема решена
                </h3>
                <p className="text-sm text-gray-600">
                  Диагностика прошла успешно и все проблемы устранены
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-ant-success to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Готово к работе
                </h3>
                <p className="text-sm text-gray-600">
                  Ваша приставка настроена и готова к использованию
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Качественный сервис
                </h3>
                <p className="text-sm text-gray-600">
                  ANT Support всегда готов помочь с любыми вопросами
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleGoHome}
                size="lg"
                className="bg-gradient-to-r from-ant-blue to-ant-blue-dark text-white px-8 py-4 text-lg font-medium transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 group rounded-xl min-w-[200px]"
              >
                <Home className="mr-3 h-5 w-5" />
                На главную
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                onClick={handleNewProblem}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 border-2 border-ant-blue text-ant-blue hover:bg-ant-blue hover:text-white transition-all duration-300 rounded-xl min-w-[200px]"
              >
                <AlertTriangle className="mr-3 h-5 w-5" />
                Другая проблема
              </Button>
            </div>

            <Button
              onClick={handleTryAgain}
              variant="ghost"
              size="lg"
              className="text-lg px-8 py-3 text-gray-500 hover:text-ant-blue hover:bg-blue-50 transition-all duration-300 rounded-xl"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Повторить диагностику
            </Button>
          </motion.div>

          {/* Footer Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-16 pt-8 border-t border-gray-100"
          >
            <p className="text-gray-500 text-lg">
              Спас��бо, что выбрали{" "}
              <span className="font-semibold text-ant-blue">ANT Support</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Мы всегда готовы помочь вам с настройкой цифрового телевидения
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SuccessPage;
