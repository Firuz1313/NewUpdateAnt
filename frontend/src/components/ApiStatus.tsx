import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkApiHealth, getApiInfo } from '../api';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Activity, Info, AlertCircle } from 'lucide-react';

interface ApiStatusProps {
  className?: string;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Health check query
  const {
    data: isHealthy,
    isLoading: healthLoading,
    refetch: refetchHealth,
    error: healthError
  } = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
  });

  // API info query (only fetch when expanded)
  const {
    data: apiInfo,
    isLoading: infoLoading,
    refetch: refetchInfo
  } = useQuery({
    queryKey: ['api-info'],
    queryFn: getApiInfo,
    enabled: isExpanded,
    retry: false,
  });

  const handleRefresh = () => {
    refetchHealth();
    if (isExpanded) {
      refetchInfo();
    }
  };

  const getStatusColor = () => {
    if (healthLoading) return 'bg-yellow-500';
    if (healthError || !isHealthy) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (healthLoading) return 'Проверка...';
    if (healthError) return 'Ошибка подключения';
    if (!isHealthy) return 'API недоступен';
    return 'API подключен';
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium">Статус API</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={healthLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Подключение:</span>
          <Badge variant={isHealthy ? 'default' : 'destructive'}>
            {getStatusText()}
          </Badge>
        </div>

        {healthError && (
          <div className="flex items-start gap-2 p-2 bg-red-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <div className="text-xs text-red-700">
              <div className="font-medium">Ошибка подключения к API</div>
              <div className="mt-1 opacity-75">
                Проверьте, что backend сервер запущен на порту 3000
              </div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="border-t pt-3 space-y-2">
            {infoLoading ? (
              <div className="text-xs text-muted-foreground">
                Загрузка информации об API...
              </div>
            ) : apiInfo ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Название:</span>
                  <span>{apiInfo.data?.name || 'ANT Support API'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Версия:</span>
                  <span>{apiInfo.data?.version || '1.0.0'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Время ответа:</span>
                  <span>
                    {apiInfo.timestamp 
                      ? `${Date.now() - new Date(apiInfo.timestamp).getTime()}ms`
                      : 'N/A'
                    }
                  </span>
                </div>
                {apiInfo.data?.endpoints && (
                  <div className="text-xs">
                    <div className="text-muted-foreground mb-1">Эндпоинты:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.keys(apiInfo.data.endpoints).map((key) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-red-500">
                Не удалось получить информацию об API
              </div>
            )}
          </div>
        )}

        {isHealthy && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
            <Activity className="h-4 w-4 text-green-500" />
            <div className="text-xs text-green-700">
              API готов к использованию
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiStatus;
