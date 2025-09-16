import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApiStatus } from '@/components/ApiStatus';
import { DevicesApiTest } from '@/components/DevicesApiTest';
import { ArrowLeft, Database, Zap, Shield } from 'lucide-react';

const ApiTest = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Тест API интеграции</h1>
              <p className="text-muted-foreground">
                Демонстрация работы с backend API
              </p>
            </div>
          </div>
          <ApiStatus />
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              О данной странице
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Эта страница демонстрирует интеграцию frontend приложения с backend API.
              Здесь вы можете:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-4">
              <li>Проверить статус подключения к API серверу</li>
              <li>Просмотреть список устройств из базы данных</li>
              <li>Создать новое устройство через API</li>
              <li>Увидеть статистику в реальном времени</li>
              <li>Протестировать обработку ошибок</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Технологии</h4>
                  <p className="text-sm text-blue-800">
                    React Query для кеширования и синхронизации данных, TypeScript для типизации,
                    Custom API клиент с обработкой ошибок и автоматическими повторами.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Готовность к продакшену</h4>
                  <p className="text-sm text-green-800">
                    Реализована полная обработка ошибок, валидация данных, оптимистичные обновления
                    и кеширование для быстрой работы интерфейса.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Tests */}
        <div className="space-y-8">
          <DevicesApiTest />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            ANT Support API Integration Test Page • 
            Разработано для демонстрации backend-frontend интеграции
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
