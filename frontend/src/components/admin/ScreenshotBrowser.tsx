import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Image as ImageIcon,
  Search,
  Upload,
  Check,
  X,
  FolderOpen,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ScreenshotBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectScreenshot: (screenshot: string) => void;
  currentDeviceId?: string;
}

interface Screenshot {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  url: string;
  timestamp: string;
  size: string;
}

const ScreenshotBrowser: React.FC<ScreenshotBrowserProps> = ({
  open,
  onOpenChange,
  onSelectScreenshot,
  currentDeviceId,
}) => {
  // Screenshots state - would be loaded from API in real implementation
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
    null,
  );

  // Filter screenshots
  const filteredScreenshots = screenshots.filter((screenshot) => {
    const matchesSearch = screenshot.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDevice =
      !currentDeviceId || screenshot.deviceId === currentDeviceId;
    const matchesType = filterType === "all" || screenshot.type === filterType;

    return matchesSearch && matchesDevice && matchesType;
  });

  const handleSelectScreenshot = () => {
    if (selectedScreenshot) {
      const screenshot = screenshots.find((s) => s.id === selectedScreenshot);
      if (screenshot) {
        onSelectScreenshot(screenshot.url);
        onOpenChange(false);
        setSelectedScreenshot(null);
      }
    }
  };

  const handleUpload = () => {
    // This would trigger a file upload dialog
    console.log("Upload screenshot functionality would go here");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Браузер скриншотов
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск скриншотов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Все типы</option>
                <option value="home">Главное меню</option>
                <option value="settings">Настройки</option>
                <option value="channels">Каналы</option>
                <option value="epg">EPG</option>
              </select>

              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleUpload} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Загрузить
              </Button>
            </div>
          </div>

          {/* Screenshots Display */}
          <div className="max-h-96 overflow-y-auto">
            {filteredScreenshots.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {screenshots.length === 0
                    ? "Скриншоты не найдены. Загрузите первый скриншот."
                    : "Скриншоты не найдены по вашему запросу."}
                </p>
                <Button onClick={handleUpload} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить скриншот
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    : "space-y-2",
                )}
              >
                {filteredScreenshots.map((screenshot) => (
                  <Card
                    key={screenshot.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      selectedScreenshot === screenshot.id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:ring-1 hover:ring-gray-300",
                      viewMode === "list" && "flex flex-row",
                    )}
                    onClick={() => setSelectedScreenshot(screenshot.id)}
                  >
                    {viewMode === "grid" ? (
                      <>
                        <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={screenshot.url}
                            alt={screenshot.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm truncate flex-1">
                              {screenshot.name}
                            </h4>
                            {selectedScreenshot === screenshot.id && (
                              <Check className="h-4 w-4 text-blue-500 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <Badge variant="secondary" className="text-xs">
                              {screenshot.type}
                            </Badge>
                            <span>{screenshot.size}</span>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex items-center p-3">
                        <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden mr-3">
                          <img
                            src={screenshot.url}
                            alt={screenshot.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {screenshot.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="secondary" className="text-xs">
                              {screenshot.type}
                            </Badge>
                            <span>{screenshot.size}</span>
                          </div>
                        </div>
                        {selectedScreenshot === screenshot.id && (
                          <Check className="h-4 w-4 text-blue-500 ml-2" />
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              {filteredScreenshots.length === 0
                ? "Скриншоты не найдены"
                : `Найдено скриншотов: ${filteredScreenshots.length}`}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Отмена
              </Button>
              <Button
                disabled={!selectedScreenshot}
                onClick={handleSelectScreenshot}
              >
                <Check className="h-4 w-4 mr-2" />
                Выбрать
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScreenshotBrowser;
