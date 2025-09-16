import React from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

interface TVInterfaceDebugButtonProps {
  interfaceId: string;
  interfaceName: string;
}

const TVInterfaceDebugButton: React.FC<TVInterfaceDebugButtonProps> = ({
  interfaceId,
  interfaceName,
}) => {
  const handleDebug = () => {
    // Открываем диагностику в новой вкладке с автозаполнением ID
    const debugUrl = `/admin/tv-interface-diagnostics?id=${interfaceId}&name=${encodeURIComponent(interfaceName)}`;
    window.open(debugUrl, "_blank");
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDebug}
      title={`Диагностика интерфейса ${interfaceName}`}
    >
      <Bug className="h-3 w-3" />
    </Button>
  );
};

export default TVInterfaceDebugButton;
