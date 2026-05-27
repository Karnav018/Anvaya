import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MousePointerClick,
  LayoutTemplate,
  PlusCircle,
  ChevronDown,
  FileCode2,
  ShoppingCart,
  BookText,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { CANVAS_TEMPLATES, type TemplateKey } from '../../lib/canvasTemplates';

type StarterKey = TemplateKey | 'empty';

interface StarterOption {
  key: StarterKey;
  label: string;
  description: string;
  icon: typeof FileCode2;
}

const STARTERS: StarterOption[] = [
  { key: 'todo', label: 'Todo API', description: 'CRUD with auth + DB', icon: FileCode2 },
  { key: 'cart', label: 'E-commerce cart', description: 'Products, cart, checkout', icon: ShoppingCart },
  { key: 'blog', label: 'Blog API', description: 'List / create / read', icon: BookText },
  { key: 'empty', label: 'Empty canvas', description: 'Start from scratch', icon: FileText },
];

export function CanvasEmptyState() {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<StarterKey | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const loadBlueprint = useCanvasStore((s) => s.loadBlueprint);
  const setBlockPaletteOpen = useUIStore((s) => s.setBlockPaletteOpen);

  // Click-outside to close dropdown
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handlePickStarter = async (key: StarterKey) => {
    if (!orgSlug || !projectId) {
      toast.error('Missing project context.');
      return;
    }
    setBusyKey(key);
    try {
      const blueprint =
        key === 'empty'
          ? { version: '1.0.0', nodes: [], edges: [] }
          : CANVAS_TEMPLATES[key];

      // Persist to backend so a refresh keeps the template.
      await api.post(`/o/${orgSlug}/blueprints/${projectId}`, {
        canvas_json: blueprint,
      });

      // Mirror into local canvas store immediately.
      loadBlueprint(blueprint);
      toast.success(key === 'empty' ? 'Canvas cleared.' : 'Template loaded.');
      setMenuOpen(false);
    } catch {
      // toast handled by interceptor
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddFirstNode = () => {
    setBlockPaletteOpen(true);
    toast('Drag a block from the palette →', { icon: '👈' });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="max-w-md text-center p-8 bg-surface/50 backdrop-blur-sm border border-border rounded-2xl pointer-events-auto">
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

        {/* CTAs */}
        <div className="mt-6 pt-6 border-t border-border flex gap-2 relative" ref={menuRef}>
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              disabled={busyKey !== null}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors disabled:opacity-60"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Start from a template
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                {STARTERS.map((s) => {
                  const Icon = s.icon;
                  const isBusy = busyKey === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handlePickStarter(s.key)}
                      disabled={busyKey !== null}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-background/60 transition-colors disabled:opacity-60 border-b border-border/40 last:border-b-0"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white">{s.label}</div>
                        <div className="text-[10px] text-white/50 truncate">
                          {isBusy ? 'Loading...' : s.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddFirstNode}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-transparent border border-border hover:border-primary/60 hover:bg-white/5 text-white text-xs font-medium transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add your first node
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs text-white/50">
            Tip: Route blocks are starting points. Response blocks are endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
