import { useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Maximize, Lock, Unlock, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CustomControlsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  showInteractionButton?: boolean;
  showZoom?: boolean;
  showFitView?: boolean;
  onInteractionChange?: (interactionEnabled: boolean) => void;
}

export function CustomCanvasControls({
  position = 'bottom-right',
  className = '',
  showInteractionButton = true,
  showZoom = true,
  showFitView = true,
  onInteractionChange
}: CustomControlsProps) {
  const { 
    zoomIn, 
    zoomOut, 
    fitView, 
    getViewport,
    setViewport 
  } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    fitView({ 
      padding: 0.1,
      duration: 300,
      includeHiddenNodes: false 
    });
  };

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  };

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  const ControlButton = ({ 
    onClick, 
    children, 
    title, 
    disabled = false,
    variant = 'default'
  }: { 
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
    variant?: 'default' | 'primary' | 'danger';
  }) => {
    const variants = {
      default: "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#1c2028]",
      primary: "text-[#a3a6ff] hover:text-white hover:bg-[#a3a6ff]/20",
      danger: "text-red-400 hover:text-red-300 hover:bg-red-400/10"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn(
          "p-0.5 rounded transition-all duration-200 group relative w-5 h-5",
          "border border-transparent hover:border-[#22262f]",
          "focus:outline-none focus:ring-1 focus:ring-[#a3a6ff]/50",
          variants[variant],
          disabled && "opacity-50 cursor-not-allowed",
          "active:scale-95 flex items-center justify-center"
        )}
      >
        {children}
      </button>
    );
  };

  return (
    <div className={cn(
      "absolute z-10 flex flex-col",
      positionClasses[position],
      className
    )}>
      {/* Main controls container */}
      <div className="bg-[#10131a]/95 backdrop-blur-md border border-[#1c2028] rounded shadow-xl">
        <div className="p-0.5">
          <div className="flex flex-col gap-0">
            
            {/* Zoom Controls */}
            {showZoom && (
              <>
                <ControlButton
                  onClick={handleZoomIn}
                  title="+"
                >
                  <ZoomIn className="w-2 h-2" />
                </ControlButton>
                
                <ControlButton
                  onClick={handleZoomOut}
                  title="-"
                >
                  <ZoomOut className="w-2 h-2" />
                </ControlButton>
              </>
            )}

            {/* View Controls */}
            {showFitView && (
              <ControlButton
                onClick={handleFitView}
                title="Fit View"
                variant="primary"
              >
                <Maximize className="w-2.5 h-2.5" />
              </ControlButton>
            )}

            <ControlButton
              onClick={handleResetView}
              title="Reset"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </ControlButton>
          </div>
        </div>

        {/* Zoom level indicator */}
        <div className="border-t border-[#22262f] px-1 py-0.5 bg-[#0d1016]/50">
          <div className="text-[7px] text-[#73757d] text-center font-mono">
            {Math.round(getViewport().zoom * 100)}%
          </div>
        </div>
      </div>

      {/* Secondary controls - remove for smaller size */}
    </div>
  );
}