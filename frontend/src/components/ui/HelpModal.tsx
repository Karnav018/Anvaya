import { X, MousePointerClick, Cable, Edit3 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold">How to Use Anvaya</h2>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">1. Drag Blocks to Canvas</h3>
              <p className="text-sm text-white/70 mb-2">
                From the left sidebar, drag any block onto the canvas to start building your API.
              </p>
              <div className="bg-background/50 p-3 rounded-lg text-xs text-white/60">
                <strong>Tip:</strong> Start with a <span className="text-green-400">Route</span> block (this is your API endpoint).
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Cable className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Connect Blocks</h3>
              <p className="text-sm text-white/70 mb-3">
                Hover over any block to see the <span className="inline-flex w-2.5 h-2.5 bg-purple-400 rounded-full mx-1" /> connection dots.
              </p>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>Click and drag</strong> from the right dot of one block</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>Drop onto</strong> the left dot of another block</span>
                </div>
              </div>
              <div className="bg-background/50 p-3 rounded-lg text-xs text-white/60 mt-3">
                <strong>Rule:</strong> Route blocks can only connect <strong>from</strong> (not to). Response blocks can only receive connections <strong>to</strong> (not from).
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Configure Blocks</h3>
              <p className="text-sm text-white/70 mb-2">
                Click on any block to open the configuration panel on the right side.
              </p>
              <p className="text-sm text-white/70">
                Here you can set properties like API paths, database queries, auth strategies, etc.
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-3">⌨️ Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between bg-background/50 p-2 rounded">
                <span className="text-white/70">Save</span>
                <kbd className="px-2 py-1 bg-border/30 rounded text-xs">⌘ S</kbd>
              </div>
              <div className="flex items-center justify-between bg-background/50 p-2 rounded">
                <span className="text-white/70">Undo</span>
                <kbd className="px-2 py-1 bg-border/30 rounded text-xs">⌘ Z</kbd>
              </div>
              <div className="flex items-center justify-between bg-background/50 p-2 rounded">
                <span className="text-white/70">Redo</span>
                <kbd className="px-2 py-1 bg-border/30 rounded text-xs">⌘ ⇧ Z</kbd>
              </div>
              <div className="flex items-center justify-between bg-background/50 p-2 rounded">
                <span className="text-white/70">Delete Node</span>
                <kbd className="px-2 py-1 bg-border/30 rounded text-xs">⌫</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-background/30 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
