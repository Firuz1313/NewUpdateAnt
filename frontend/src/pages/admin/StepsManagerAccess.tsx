import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Layers, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const StepsManagerAccess = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Управление шагами диагностики
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Выберите ��ерсию компонента управления шагами
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Оригинальная версия */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Оригинальная версия
              </CardTitle>
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Проблемы
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-red-600 dark:text-red-400">Известные проблемы:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Пульты не сохраняются при создании</li>
                <li>• В режиме редактирования показываются значения по умолчанию</li>
                <li>• Не работает привязка к интерфейсам ТВ</li>
                <li>• Проблемы с трансформацией данных API</li>
              </ul>
            </div>
            <Link to="/admin/steps-old">
              <Button variant="outline" className="w-full">
                Открыть оригинальную версию
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Исправленная версия */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Исправленная версия
              </CardTitle>
              <Badge variant="default" className="bg-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Рекомендуется
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600 dark:text-green-400">Исправления:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✅ Корректное сохранение всех полей</li>
                <li>✅ Правильное отображение данных при редактировании</li>
                <li>✅ Исправлена трансформация данных camelCase ↔ snake_case</li>
                <li>✅ Улучшенная обработка ошибок и уведомления</li>
                <li>✅ Полная поддержка всех функций создания шагов</li>
              </ul>
            </div>
            <Link to="/admin/steps-fixed">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Открыть исправленную версию
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">i</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Информация о исправлениях
                </h3>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  <p>
                    <strong>Основная проблема:</strong> Несоответствие форматов данных между frontend (camelCase) 
                    и backend (snake_case). API middleware не всегда корректно трансформировал поля.
                  </p>
                  <p>
                    <strong>Решение:</strong> Добавлена явная трансформация данных в StepsApi с корректным 
                    маппингом всех полей. Теперь все поля сохраняются и отображаются правильно.
                  </p>
                  <p>
                    <strong>Дополнительно:</strong> Улучшена обработка ошибок, добавлены подробные логи 
                    и уведомления для пользователя.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StepsManagerAccess;
