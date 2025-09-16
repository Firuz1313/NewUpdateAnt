import React from "react";
import { cn } from "@/lib/utils";
import {
  Power,
  Home,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Settings,
  Menu,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Minus,
  Plus,
} from "lucide-react";

interface RemoteControlProps {
  highlightButton?: string;
  onButtonClick?: (buttonId: string) => void;
  glowButton?: string;
  remoteId?: string;
  remote?: any;
  className?: string;
  showButtonPosition?: { x: number; y: number };
  pointerVariant?: "diagnostic" | "default";
  disableZoom?: boolean;
  disableHoverEffects?: boolean;
  minButtonSizePx?: number;
  hidePointer?: boolean;
}

const RemoteControl = ({
  highlightButton,
  onButtonClick,
  glowButton,
  remoteId,
  remote: providedRemote,
  className,
  showButtonPosition,
  pointerVariant = "default",
  disableZoom = false,
  disableHoverEffects = false,
  minButtonSizePx = 0,
  hidePointer = false,
}: RemoteControlProps) => {
  // Mock functions for removed static functionality
  const getRemoteById = (id: string) => null;
  const getDefaultRemote = () => null;

  // Resolve remote from props or fallbacks
  const remote =
    providedRemote ?? (remoteId ? getRemoteById(remoteId) : getDefaultRemote());
  const imageData =
    remote?.imageData ||
    remote?.image_data ||
    remote?.imageUrl ||
    remote?.image_url;
  const buttons = remote?.buttons || [];
  const dimensions = remote?.dimensions || { width: 260, height: 700 };
  const useCustomRemote = !!imageData;

  // Top-level refs/effects for custom remote mapping (avoid conditional hooks)
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = React.useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!imageData) {
      setNaturalSize(null);
      return;
    }
    const img = new Image();
    img.onload = () =>
      setNaturalSize({
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
      });
    img.src = imageData as string;
  }, [imageData]);

  // Zoom overlay state and helpers
  const [zoom, setZoom] = React.useState<{
    open: boolean;
    rect: DOMRect | null;
    scale: number;
    dx: number;
    dy: number;
    apply: boolean;
  }>({ open: false, rect: null, scale: 1, dx: 0, dy: 0, apply: false });

  React.useEffect(() => {
    if (!zoom.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
    };
    const onResize = () => {
      if (overlayRef.current) {
        const r = overlayRef.current.getBoundingClientRect();
        setOverlaySize({ width: r.width, height: r.height });
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    // first measure on next frame
    requestAnimationFrame(onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [zoom.open]);

  const openZoom = (e: React.MouseEvent) => {
    if (disableZoom) return;
    if (!useCustomRemote || !containerRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min((vw * 0.98) / rect.width, (vh * 0.98) / rect.height);
    const dx = vw / 2 - (rect.left + rect.width / 2);
    const dy = vh / 2 - (rect.top + rect.height / 2);
    setZoom({ open: true, rect, scale, dx, dy, apply: false });
    requestAnimationFrame(() => setZoom((z) => ({ ...z, apply: true })));
  };

  const closeZoom = () => {
    setZoom((z) => ({ ...z, apply: false }));
    setTimeout(
      () =>
        setZoom({
          open: false,
          rect: null,
          scale: 1,
          dx: 0,
          dy: 0,
          apply: false,
        }),
      650,
    );
  };

  const getImageBox = (containerW: number, containerH: number) => {
    const containerAR = containerW / containerH;
    const imgAR =
      naturalSize && naturalSize.width > 0 && naturalSize.height > 0
        ? naturalSize.width / naturalSize.height
        : containerAR;
    if (containerAR > imgAR) {
      const imgH = containerH;
      const imgW = imgAR * imgH;
      const left = (containerW - imgW) / 2;
      const top = 0;
      return { left, top, width: imgW, height: imgH };
    } else {
      const imgW = containerW;
      const imgH = imgW / imgAR;
      const left = 0;
      const top = (containerH - imgH) / 2;
      return { left, top, width: imgW, height: imgH };
    }
  };

  const mapToPercent = (pos?: { x: number; y: number }) => {
    if (!pos || !containerRef.current) return undefined;
    const rect = containerRef.current.getBoundingClientRect();
    const box = getImageBox(rect.width, rect.height);
    const left = (box.left + pos.x * box.width) / rect.width;
    const top = (box.top + pos.y * box.height) / rect.height;
    return { left: left * 100, top: top * 100 };
  };

  // Функция для нормализации координат (конвертация старых пиксельных координат в нормализованные 0-1)
  const normalizeButtonPosition = (
    position: { x: number; y: number } | undefined,
  ) => {
    if (!position) return undefined;

    // Если коорди��аты уже нормализованы (0-1), используем их как есть
    if (position.x <= 1 && position.y <= 1) {
      return position;
    }

    // Иначе кон��ертируем старые пиксельные координаты
    // Используем стандартные размеры canvas для пультов: 400x600
    const canvasWidth = 400;
    const canvasHeight = 600;

    const normalizedX = Math.min(position.x / canvasWidth, 1);
    const normalizedY = Math.min(position.y / canvasHeight, 1);

    console.log("🔄 Converting old pixel coordinates:", {
      original: position,
      normalized: { x: normalizedX, y: normalizedY },
      canvasSize: { width: canvasWidth, height: canvasHeight },
    });

    return { x: normalizedX, y: normalizedY };
  };

  const handleButtonClick = (buttonId: string) => {
    if (onButtonClick) {
      onButtonClick(buttonId);
    }
  };

  const getButtonClass = (buttonId: string, baseClass = "") => {
    return cn(
      "transition-all duration-300 flex items-center justify-center font-semibold relative",
      baseClass,
      {
        "ring-4 ring-blue-400 ring-opacity-75 shadow-lg shadow-blue-500/50 bg-blue-500/20 scale-110 z-10":
          highlightButton === buttonId,
        "animate-pulse ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/50 bg-yellow-500/20":
          glowButton === buttonId,
      },
    );
  };

  // Render custom remote if available
  if (useCustomRemote && remote) {
    return (
      <div className={cn("relative h-full group", className)}>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle base shadow ellipse */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-3 bg-black/25 blur-lg rounded-full opacity-80 transition-all duration-700 ease-out group-hover:w-3/4 group-hover:opacity-90"></div>
          <div className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-black/20 blur-md rounded-full opacity-70"></div>
          {/* Remote background image */}
          <div
            ref={containerRef}
            onClick={openZoom}
            className={cn(
              "relative z-10 w-full h-full bg-contain bg-center bg-no-repeat transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] filter drop-shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
              disableHoverEffects
                ? ""
                : "group-hover:-translate-y-1 group-hover:scale-[1.02]",
              disableZoom ? "cursor-default" : "cursor-zoom-in",
            )}
            style={{
              backgroundImage: `url(${imageData})`,
            }}
          >
            {/* Custom buttons */}
            {buttons.map((button: any) => {
              const px = button?.position?.x ?? button?.x;
              const py = button?.position?.y ?? button?.y;
              const sw = button?.size?.width ?? button?.width;
              const sh = button?.size?.height ?? button?.height;
              const leftPct =
                typeof px === "number" && dimensions.width
                  ? (px / dimensions.width) * 100
                  : 50;
              const topPct =
                typeof py === "number" && dimensions.height
                  ? (py / dimensions.height) * 100
                  : 50;
              const widthPct =
                typeof sw === "number" && dimensions.width
                  ? (sw / dimensions.width) * 100
                  : undefined;
              const heightPct =
                typeof sh === "number" && dimensions.height
                  ? (sh / dimensions.height) * 100
                  : undefined;
              return (
                <button
                  key={button.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleButtonClick(button.action);
                  }}
                  className={cn(
                    "absolute transition-all duration-300 focus:outline-none active:scale-[0.98] z-30",
                    {
                      "ring-4 ring-blue-400 ring-opacity-75 shadow-lg shadow-blue-500/50 scale-110":
                        highlightButton === button.action,
                      "animate-pulse ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/50":
                        glowButton === button.action,
                    },
                  )}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    ...(widthPct ? { width: `${widthPct}%` } : {}),
                    ...(heightPct ? { height: `${heightPct}%` } : {}),
                    minWidth:
                      minButtonSizePx > 0 ? `${minButtonSizePx}px` : undefined,
                    minHeight:
                      minButtonSizePx > 0 ? `${minButtonSizePx}px` : undefined,
                    backgroundColor: button.color || "rgba(255,255,255,0.12)",
                    color: button.textColor || "#ffffff",
                    fontSize: `${button.fontSize ?? 13}px`,
                    border: button.borderColor
                      ? `1px solid ${button.borderColor}`
                      : "1px solid rgba(255,255,255,0.25)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                    borderRadius:
                      button.shape === "circle"
                        ? "50%"
                        : button.shape === "rounded"
                          ? "10px"
                          : "6px",
                    transform: "translate(-50%, -50%)",
                    touchAction: "manipulation",
                    pointerEvents: "auto",
                  }}
                  title={button.label}
                  aria-label={button.label}
                >
                  <span className="text-xs font-semibold select-none pointer-events-none">
                    {button.label}
                  </span>
                </button>
              );
            })}

            {/* Show button position indicator if provided */}
            {(() => {
              const normalizedPosition =
                normalizeButtonPosition(showButtonPosition);
              const mapped = mapToPercent(normalizedPosition);
              return (
                normalizedPosition &&
                mapped && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{ left: `${mapped.left}%`, top: `${mapped.top}%` }}
                  >
                    <div
                      className="relative -translate-x-1/2 -translate-y-1/2 -translate-x-[12px] -translate-y-[20px] rotate-[-28deg]"
                      data-rc-marker
                    >
                      {!hidePointer && pointerVariant === "diagnostic" && (
                        <>
                          <span className="absolute w-3.5 h-3.5 rounded-full border-2 border-cyan-300 left-[0px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple"></span>
                          <span className="absolute w-3.5 h-3.5 rounded-full border-2 border-cyan-300 left-[0px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple-delayed"></span>
                        </>
                      )}
                      {!hidePointer && (
                        <div
                          className={cn(
                            "text-[30px] leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] select-none",
                            pointerVariant === "diagnostic"
                              ? "animate-tap-bounce"
                              : "",
                          )}
                        >
                          👆
                        </div>
                      )}
                    </div>
                  </div>
                )
              );
            })()}
          </div>
        </div>

        {/* Zoom Overlay */}
        {useCustomRemote && !disableZoom && zoom.open && zoom.rect && (
          <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500",
                zoom.apply ? "opacity-100" : "opacity-0",
              )}
              onClick={closeZoom}
            />

            {/* Zoomed image (FLIP) */}
            <div
              className={cn(
                "fixed will-change-transform transition-opacity duration-500",
                zoom.apply ? "opacity-100" : "opacity-0",
              )}
              style={{
                left: zoom.rect.left,
                top: zoom.rect.top,
                width: zoom.rect.width,
                height: zoom.rect.height,
                transform: `translate(${zoom.apply ? zoom.dx : 0}px, ${zoom.apply ? zoom.dy : 0}px) scale(${zoom.apply ? zoom.scale : 1})`,
                transition: "transform 750ms cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div
                ref={overlayRef}
                className="relative w-full h-full bg-black/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10"
              >
                <img
                  src={imageData}
                  alt={remote?.name || "Remote"}
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                  decoding="async"
                  loading="eager"
                />
                {(() => {
                  const normalizedPosition =
                    normalizeButtonPosition(showButtonPosition);
                  if (
                    !normalizedPosition ||
                    overlaySize.width === 0 ||
                    overlaySize.height === 0
                  )
                    return null;
                  const box = getImageBox(
                    overlaySize.width,
                    overlaySize.height,
                  );
                  const leftPercent =
                    ((box.left + normalizedPosition.x * box.width) /
                      overlaySize.width) *
                    100;
                  const topPercent =
                    ((box.top + normalizedPosition.y * box.height) /
                      overlaySize.height) *
                    100;
                  return (
                    <div
                      className="absolute pointer-events-none z-20"
                      style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    >
                      <div
                        className="relative -translate-x-1/2 -translate-y-1/2 -translate-x-[14px] -translate-y-[24px] rotate-[-28deg]"
                        data-rc-marker-overlay
                      >
                        {pointerVariant === "diagnostic" && (
                          <>
                            <span className="absolute w-4 h-4 rounded-full border-2 border-cyan-300 left-[2px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple"></span>
                            <span className="absolute w-4 h-4 rounded-full border-2 border-cyan-300 left-[2px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple-delayed"></span>
                          </>
                        )}
                        <div
                          className={cn(
                            "text-[36px] leading-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] select-none",
                            pointerVariant === "diagnostic"
                              ? "animate-tap-bounce"
                              : "",
                          )}
                        >
                          👆
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {/* Close button */}
              <button
                onClick={closeZoom}
                className="absolute -top-12 right-0 text-white/90 hover:text-white transition-colors text-2xl leading-none"
                aria-label="Закрыть увеличенный пульт"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render default remote if no custom remote is available
  return (
    <div className={cn("relative h-full group", className)}>
      {/* Subtle base shadow ellipse */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-3 bg-black/25 blur-lg rounded-full opacity-80 transition-all duration-700 ease-out group-hover:w-3/4 group-hover:opacity-90"></div>
      <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-black/20 blur-md rounded-full opacity-70"></div>
      {/* Remote Frame */}
      <div
        className={cn(
          "relative z-10 bg-transparent p-0 rounded-2xl shadow-xl shadow-black/40 border-0 w-full h-full flex flex-col justify-between transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] filter drop-shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
          disableHoverEffects
            ? ""
            : "group-hover:-translate-y-1 group-hover:scale-[1.02]",
        )}
        style={{ maxWidth: "160px", minHeight: "330px" }}
      >
        {/* Top Section */}
        <div className="space-y-2 flex-shrink-0">
          {/* Power Button */}
          <div className="relative flex justify-center">
            <button
              onClick={() => handleButtonClick("power")}
              className={getButtonClass(
                "power",
                "w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full relative",
              )}
            >
              <Power className="h-3 w-3" />
              {/* Red dot indicator */}
              {highlightButton === "power" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse z-10"></div>
              )}
            </button>
          </div>

          {/* Number Buttons */}
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handleButtonClick(`number-${i + 1}`)}
                className={getButtonClass(
                  `number-${i + 1}`,
                  "w-full h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm aspect-square active:scale-[0.98]",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* 0 and special buttons */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleButtonClick("prev")}
              className={getButtonClass(
                "prev",
                "w-full h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm aspect-square active:scale-[0.98]",
              )}
            >
              <RotateCcw className="h-2 w-2" />
            </button>
            <button
              onClick={() => handleButtonClick("number-0")}
              className={getButtonClass(
                "number-0",
                "w-full h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm aspect-square active:scale-[0.98]",
              )}
            >
              0
            </button>
            <button
              onClick={() => handleButtonClick("menu")}
              className={getButtonClass(
                "menu",
                "w-full h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm aspect-square active:scale-[0.98]",
              )}
            >
              <Menu className="h-2 w-2" />
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 flex flex-col justify-center py-2">
          {/* D-Pad */}
          <div className="relative w-16 h-16 mx-auto mb-2">
            {/* Up */}
            <button
              onClick={() => handleButtonClick("up")}
              className={getButtonClass(
                "up",
                "absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <ArrowUp className="h-3 w-3" />
            </button>

            {/* Left */}
            <button
              onClick={() => handleButtonClick("left")}
              className={getButtonClass(
                "left",
                "absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <ArrowLeft className="h-3 w-3" />
            </button>

            {/* Center OK */}
            <button
              onClick={() => handleButtonClick("ok")}
              className={getButtonClass(
                "ok",
                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold active:scale-[0.98]",
              )}
            >
              OK
            </button>

            {/* Right */}
            <button
              onClick={() => handleButtonClick("right")}
              className={getButtonClass(
                "right",
                "absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <ArrowRight className="h-3 w-3" />
            </button>

            {/* Down */}
            <button
              onClick={() => handleButtonClick("down")}
              className={getButtonClass(
                "down",
                "absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>

          {/* Home and Back */}
          <div className="flex justify-center gap-1">
            <button
              onClick={() => handleButtonClick("back")}
              className={getButtonClass(
                "back",
                "w-11 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm active:scale-[0.98]",
              )}
            >
              ←
            </button>
            <button
              onClick={() => handleButtonClick("home")}
              className={getButtonClass(
                "home",
                "w-11 h-7 bg-green-600 hover:bg-green-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <Home className="h-2 w-2" />
            </button>
            <button
              onClick={() => handleButtonClick("settings")}
              className={getButtonClass(
                "settings",
                "w-11 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <Settings className="h-2 w-2" />
            </button>
          </div>
        </div>

        {/* Volume Controls */}
        <div className="flex-shrink-0 py-1">
          <div className="flex justify-center gap-1">
            <button
              onClick={() => handleButtonClick("vol-down")}
              className={getButtonClass(
                "vol-down",
                "w-11 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md flex items-center justify-center active:scale-[0.98]",
              )}
            >
              <Minus className="h-2 w-2" />
            </button>
            <button
              onClick={() => handleButtonClick("mute")}
              className={getButtonClass(
                "mute",
                "w-11 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <VolumeX className="h-2 w-2" />
            </button>
            <button
              onClick={() => handleButtonClick("vol-up")}
              className={getButtonClass(
                "vol-up",
                "w-11 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md flex items-center justify-center active:scale-[0.98]",
              )}
            >
              <Plus className="h-2 w-2" />
            </button>
          </div>
        </div>

        {/* Media Controls */}
        <div className="flex-shrink-0 pb-2">
          <div className="flex justify-center gap-1">
            <button
              onClick={() => handleButtonClick("rewind")}
              className={getButtonClass(
                "rewind",
                "w-10 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <SkipBack className="h-2 w-2" />
            </button>
            <button
              onClick={() => handleButtonClick("play-pause")}
              className={getButtonClass(
                "play-pause",
                "w-10 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <Play className="h-2 w-2" />
            </button>
            <button
              onClick={() => handleButtonClick("forward")}
              className={getButtonClass(
                "forward",
                "w-10 h-7 bg-gray-600 hover:bg-gray-500 text-white rounded-md active:scale-[0.98]",
              )}
            >
              <SkipForward className="h-2 w-2" />
            </button>
          </div>
        </div>

        {/* Remote Brand */}
        <div className="text-center flex-shrink-0">
          <span className="text-gray-500 text-xs font-semibold">
            {remote?.name || remote?.model || remote?.manufacturer || "OPENBOX"}
          </span>
        </div>
      </div>

      {/* Show button position indicator if provided */}
      {(() => {
        const normalizedPosition = normalizeButtonPosition(showButtonPosition);
        return (
          normalizedPosition && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: `${normalizedPosition.x * 100}%`,
                top: `${normalizedPosition.y * 100}%`,
              }}
            >
              <div
                className="relative -translate-x-1/2 -translate-y-1/2 -translate-x-[10px] -translate-y-[18px] rotate-[-28deg]"
                data-rc-marker-default
              >
                {!hidePointer && pointerVariant === "diagnostic" && (
                  <>
                    <span className="absolute w-3 h-3 rounded-full border-2 border-cyan-300 left-[-1px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple"></span>
                    <span className="absolute w-3 h-3 rounded-full border-2 border-cyan-300 left-[-1px] top-[0px] -translate-x-1/2 -translate-y-1/2 animate-tap-ripple-delayed"></span>
                  </>
                )}
                {!hidePointer && (
                  <div
                    className={cn(
                      "text-[28px] leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] select-none",
                      pointerVariant === "diagnostic"
                        ? "animate-tap-bounce"
                        : "",
                    )}
                  >
                    👆
                  </div>
                )}
              </div>
            </div>
          )
        );
      })()}

      {/* Highlight Effect */}
    </div>
  );
};

export default RemoteControl;
