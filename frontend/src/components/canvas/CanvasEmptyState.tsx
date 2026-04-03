import { MousePointerClick } from 'lucide-react';

export function CanvasEmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="max-w-md text-center p-8 bg-surface/50 backdrop-blur-sm border border-border rounded-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MousePointerClick className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-3">Start Building Your API</h3>
        
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">Drag a Route block</p>
              <p className="text-xs text-white/60">From the left palette to the canvas</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">Connect blocks</p>
              <p className="text-xs text-white/60 flex items-center gap-1">
                Drag from the 
                <span className="inline-flex w-2 h-2 bg-purple-400 rounded-full mx-0.5" />
                dot to another block
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">Click to configure</p>
              <p className="text-xs text-white/60">Click any block to edit its properties</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-white/50">
            💡 Tip: Route blocks are starting points. Response blocks are endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
