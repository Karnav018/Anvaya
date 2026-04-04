import { MiniMap } from 'reactflow';
import { cn } from '../../lib/utils';

interface CustomMiniMapProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  showNodes?: boolean;
}

export function CustomMiniMap({ 
  position = 'top-right', 
  className = '',
  showNodes = true 
}: CustomMiniMapProps) {
  
  // Custom node color function to match our theme
  const nodeColor = (node: any) => {
    switch (node.type) {
      case 'route':
        return '#a3a6ff'; // Primary blue
      case 'auth':
        return '#fbbf24'; // Yellow
      case 'database':
        return '#3b82f6'; // Blue
      case 'schema':
        return '#60a5fa'; // Light blue
      case 'validation':
        return '#10b981'; // Green
      case 'error_handler':
        return '#f87171'; // Red
      case 'response_schema':
        return '#a78bfa'; // Purple
      case 'email':
        return '#fb7185'; // Rose
      case 'upload':
        return '#0ea5e9'; // Sky
      case 'ai':
        return '#d946ef'; // Fuchsia
      case 'payment':
        return '#6366f1'; // Indigo
      case 'fetch':
        return '#06b6d4'; // Cyan
      case 'cache':
        return '#059669'; // Emerald
      case 'middleware':
        return '#8b5cf6'; // Purple
      case 'response':
        return '#f97316'; // Orange
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <div className={cn(
      "absolute z-10",
      position === 'top-left' && "top-2 left-2",
      position === 'top-right' && "top-2 right-2", 
      position === 'bottom-left' && "bottom-2 left-2",
      position === 'bottom-right' && "bottom-2 right-2",
      className
    )}>
      <div className="bg-[#10131a]/95 backdrop-blur-md border border-[#1c2028] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-1.5 py-0.5 border-b border-[#1c2028] bg-[#0d1016]/50">
          <h3 className="text-[8px] font-medium text-[#ecedf6]">
            Map
          </h3>
        </div>
        
        {/* MiniMap */}
        <div className="p-0.5">
          <MiniMap
            nodeColor={nodeColor}
            maskColor="rgba(13, 16, 22, 0.85)"
            maskStrokeColor="#1c2028"
            maskStrokeWidth={1}
            zoomable={true}
            pannable={true}
            inversePan={false}
            style={{
              backgroundColor: '#0f1218',
              border: '1px solid #1c2028',
              borderRadius: '4px',
              width: '80px',
              height: '50px',
            }}
            // Custom styles for the minimap viewport indicator
            ariaLabel="Canvas overview"
          />
        </div>

        {/* Footer with zoom info - remove for smaller size */}
      </div>
    </div>
  );
}