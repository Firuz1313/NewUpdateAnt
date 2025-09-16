import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Removed useData import - no longer using DataContext
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Globe,
  Database,
  Mail,
  Shield,
  Bell,
  Palette,
  Download,
  Upload,
  Save,
  RefreshCw,
} from "lucide-react";

const SystemSettings = () => {
  // Mock site settings functionality
  const siteSettings = {
    siteName: "ANT Support",
    siteDescription: "Система диагностики ТВ-приставок",
    defaultLanguage: "ru",
    theme: "dark",
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    logoUrl: "",
  };
  const updateSiteSettings = async (settings: any) => {};

  const [settings, setSettings] = useState({
    // General Settings from context
    ...siteSettings,
    timezone: "Europe/Moscow",
    maintenanceMode: false,

    // Diagnostic Settings
    autoAdvanceSteps: true,
    showHints: true,
    maxDiagnosticTime: 30,
    enableFeedback: true,
    requireUserInfo: false,

    // Notification Settings
    emailNotifications: true,
    systemAlerts: true,
    userActivityLogs: true,
    diagnosticReports: true,

    // Security Settings
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireTwoFactor: false,
    apiRateLimit: 100,

    // Appearance Settings
    theme: "dark",
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    logoUrl: "",

    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,

    // Performance Settings
    cacheEnabled: true,
    compressionEnabled: true,
    imageOptimization: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock update - site settings functionality removed
    await updateSiteSettings({
      ...siteSettings,
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      defaultLanguage: settings.defaultLanguage,
      theme: settings.theme,
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
      logoUrl: settings.logoUrl,
    });

    setIsLoading(false);
    // Show success message
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      siteName: "ANT Support",
      siteDescription: "Система диагностики ТВ-приставок",
      defaultLanguage: "ru",
      timezone: "Europe/Moscow",
      maintenanceMode: false,
      autoAdvanceSteps: true,
      showHints: true,
      maxDiagnosticTime: 30,
      enableFeedback: true,
      requireUserInfo: false,
      emailNotifications: true,
      systemAlerts: true,
      userActivityLogs: true,
      diagnosticReports: true,
      sessionTimeout: 60,
      passwordMinLength: 8,
      requireTwoFactor: false,
      apiRateLimit: 100,
      theme: "dark",
      primaryColor: "#3b82f6",
      accentColor: "#10b981",
      logoUrl: "",
      autoBackup: true,
      backupFrequency: "daily",
      backupRetention: 30,
      cacheEnabled: true,
      compressionEnabled: true,
      imageOptimization: true,
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Настройки системы
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Конфигурация и управление системными параметрами
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Сбросить
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="diagnostic">Диагностика</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
          <TabsTrigger value="backup">Резервное копирование</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Общие настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Название сайта</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting("siteName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Язык по умолчанию</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(value) =>
                      updateSetting("defaultLanguage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tj">Тоҷикӣ</SelectItem>
                      <SelectItem value="uz">O'zbek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Описание сайта</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    updateSetting("siteDescription", e.target.value)
                  }
                  placeholder="Введите описание сайта"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Moscow">
                        Москва (UTC+3)
                      </SelectItem>
                      <SelectItem value="Asia/Dushanbe">
                        Душанбе (UTC+5)
                      </SelectItem>
                      <SelectItem value="Asia/Tashkent">
                        Ташкент (UTC+5)
                      </SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceMode">Режим обслуживания</Label>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        updateSetting("maintenanceMode", checked)
                      }
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Временно отключить сайт для обслуживания
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnostic Settings */}
        <TabsContent value="diagnostic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Настройки диагностики
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoAdvanceSteps">
                      Автопереход между шагами
                    </Label>
                    <Switch
                      id="autoAdvanceSteps"
                      checked={settings.autoAdvanceSteps}
                      onCheckedChange={(checked) =>
                        updateSetting("autoAdvanceSteps", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showHints">Показывать подсказки</Label>
                    <Switch
                      id="showHints"
                      checked={settings.showHints}
                      onCheckedChange={(checked) =>
                        updateSetting("showHints", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableFeedback">
                      Включить обратную связь
                    </Label>
                    <Switch
                      id="enableFeedback"
                      checked={settings.enableFeedback}
                      onCheckedChange={(checked) =>
                        updateSetting("enableFeedback", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireUserInfo">
                      Требовать информацию о пользователе
                    </Label>
                    <Switch
                      id="requireUserInfo"
                      checked={settings.requireUserInfo}
                      onCheckedChange={(checked) =>
                        updateSetting("requireUserInfo", checked)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDiagnosticTime">
                      Максимальное время диагностики (мин)
                    </Label>
                    <Input
                      id="maxDiagnosticTime"
                      type="number"
                      min="5"
                      max="120"
                      value={settings.maxDiagnosticTime}
                      onChange={(e) =>
                        updateSetting(
                          "maxDiagnosticTime",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Настройки уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">
                      Email уведомления
                    </Label>
                    <p className="text-sm text-gray-500">
                      Отправлять уведомления по email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts">Системные оповещения</Label>
                    <p className="text-sm text-gray-500">
                      Уведомления о системных событиях
                    </p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={settings.systemAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("systemAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="userActivityLogs">
                      Логи активности пользователей
                    </Label>
                    <p className="text-sm text-gray-500">
                      Записывать действия пользователей
                    </p>
                  </div>
                  <Switch
                    id="userActivityLogs"
                    checked={settings.userActivityLogs}
                    onCheckedChange={(checked) =>
                      updateSetting("userActivityLogs", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="diagnosticReports">
                      Отчеты диагностики
                    </Label>
                    <p className="text-sm text-gray-500">
                      Ежедневные отчеты о диагностике
                    </p>
                  </div>
                  <Switch
                    id="diagnosticReports"
                    checked={settings.diagnosticReports}
                    onCheckedChange={(checked) =>
                      updateSetting("diagnosticReports", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Настройки безопасности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Таймаут сессии (мин)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="15"
                      max="480"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        updateSetting(
                          "sessionTimeout",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">
                      Минимальная длина пароля
                    </Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={settings.passwordMinLength}
                      onChange={(e) =>
                        updateSetting(
                          "passwordMinLength",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">
                      Лимит API запросов в минуту
                    </Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      min="10"
                      max="1000"
                      value={settings.apiRateLimit}
                      onChange={(e) =>
                        updateSetting("apiRateLimit", parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireTwoFactor">
                        Двухфакторная аутентификация
                      </Label>
                      <p className="text-sm text-gray-500">
                        Обязательно для всех пользователей
                      </p>
                    </div>
                    <Switch
                      id="requireTwoFactor"
                      checked={settings.requireTwoFactor}
                      onCheckedChange={(checked) =>
                        updateSetting("requireTwoFactor", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Настройки внешнего вида
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Тема</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => updateSetting("theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Светлая</SelectItem>
                        <SelectItem value="dark">Темная</SelectItem>
                        <SelectItem value="auto">Автоматически</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Основной цвет</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Акцентный цвет</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) =>
                          updateSetting("accentColor", e.target.value)
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) =>
                          updateSetting("accentColor", e.target.value)
                        }
                        placeholder="#10b981"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL логотипа</Label>
                    <Input
                      id="logoUrl"
                      value={settings.logoUrl}
                      onChange={(e) => updateSetting("logoUrl", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Резервное копирование
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoBackup">
                        Автоматическое резервное копирование
                      </Label>
                      <p className="text-sm text-gray-500">
                        Создавать резервные копии автоматически
                      </p>
                    </div>
                    <Switch
                      id="autoBackup"
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) =>
                        updateSetting("autoBackup", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">
                      Частота резервного копирования
                    </Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) =>
                        updateSetting("backupFrequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Каждый час</SelectItem>
                        <SelectItem value="daily">Ежедневно</SelectItem>
                        <SelectItem value="weekly">Еженедельно</SelectItem>
                        <SelectItem value="monthly">Ежемесячно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="backupRetention">
                      Хранить резервные копии (дни)
                    </Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.backupRetention}
                      onChange={(e) =>
                        updateSetting(
                          "backupRetention",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Создать резервную копию
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Восстановить
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
