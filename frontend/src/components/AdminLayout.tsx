import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SyncIndicator from "./SyncIndicator";
import ErrorBoundary from "./ErrorBoundary";
import {
  Settings,
  Users,
  FileText,
  Layers,
  Smartphone,
  Monitor,
  BarChart3,
  Home,
  LogOut,
  Menu,
  X,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const adminMenuItems = [
  {
    title: "Обзор",
    path: "/admin",
    icon: BarChart3,
    description: "Общая статистика и аналитика",
  },
  {
    title: "Приставки",
    path: "/admin/devices",
    icon: Tv,
    description: "Управление моделями приставок",
  },
  {
    title: "Управление проблемами",
    path: "/admin/problems",
    icon: FileText,
    description: "CRUD операции с проблемами",
  },
  {
    title: "Управление шагами",
    path: "/admin/steps-fixed",
    icon: Layers,
    description: "Создание и редактирование шагов диагностики",
  },
  {
    title: "Конструктор пультов",
    path: "/admin/remotes",
    icon: Smartphone,
    description: "Загрузка и настройка пультов управления",
  },
  {
    title: "Конструктор интерфейса ТВ",
    path: "/admin/tv-interfaces",
    icon: Monitor,
    description: "Создание интерфейсов ТВ-пр��ставок",
  },
  {
    title: "Пользователи",
    path: "/admin/users",
    icon: Users,
    description: "Управление пользователями и ролями",
  },
  {
    title: "Настройки системы",
    path: "/admin/settings",
    icon: Settings,
    description: "Конфигурация и системные настройки",
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActivePath = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Tv className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                ANT Admin
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Панель управления
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {adminMenuItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group",
                  isActivePath(item.path)
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link to="/">
            <Button
              variant="outline"
              className="w-full justify-start mb-2"
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              На главную
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            size="sm"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "ml-0",
        )}
      >
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Админ-панель
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Управление системой диагностики ТВ-приставок
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <SyncIndicator className="text-gray-500 dark:text-gray-400" />
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Администратор
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  admin@antsupport.com
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  A
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
