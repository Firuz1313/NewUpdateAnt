import { useState, useEffect } from "react";
import { CheckCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  className?: string;
}

const SyncIndicator = ({ className }: SyncIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [showSyncNotification, setShowSyncNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('ant-support-')) {
        setLastSyncTime(new Date());
        setShowSyncNotification(true);
        setTimeout(() => setShowSyncNotification(false), 2000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn("flex items-center space-x-2 text-xs", className)}>
      {/* Online/Offline Status */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-green-500">Онлайн</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-red-500">Оффлайн</span>
          </>
        )}
      </div>

      {/* Sync Status */}
      <div className="flex items-center space-x-1">
        <CheckCircle className={cn(
          "h-3 w-3 transition-colors duration-300",
          showSyncNotification ? "text-blue-500" : "text-gray-400"
        )} />
        <span className={cn(
          "transition-colors duration-300",
          showSyncNotification ? "text-blue-500 font-medium" : "text-gray-500"
        )}>
          {showSyncNotification ? "Синхронизировано" : `${formatTime(lastSyncTime)}`}
        </span>
      </div>

      {/* Sync Notification */}
      {showSyncNotification && (
        <div className="animate-pulse">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

export default SyncIndicator;
