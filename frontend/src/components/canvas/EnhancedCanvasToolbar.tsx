import { useState } from 'react';
import { 
  Play, Square, Save, Download, Upload, Share2, Settings, 
  ZoomIn, ZoomOut, Maximize, RotateCcw, RotateCw, Layers,
  Grid, Eye, EyeOff, Code, FileCode, GitBranch, Clock,
  Users, Lock, Unlock, HelpCircle, Sparkles, Zap, AlertTriangle, Link
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCanvasStore } from '../../store/canvasStore';

interface CanvasStats {
  nodeCount: number;
  edgeCount: number;
  lastSaved?: string;
  isValid: boolean;
  estimatedLines: number;
}

export function EnhancedCanvasToolbar() {
  const { 
    nodes, 
    edges, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    saveBlueprint,
    generateCode,
    isGenerating
  } = useCanvasStore();

  const [showStats, setShowStats] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Calculate canvas statistics
  const stats: CanvasStats = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    isValid: nodes.some(n => n.type === 'route') && nodes.some(n => n.type === 'response'),
    estimatedLines: nodes.length * 25 + edges.length * 5, // Rough estimate
    lastSaved: '2 minutes ago' // This would come from store
  };

  const handleSave = async () => {
    try {
      await saveBlueprint();
      // Show success toast
    } catch (error) {
      // Show error toast
    }
  };

  const handleGenerate = async () => {
    if (!stats.isValid) {
      // Show validation error
      return;
    }
    
    try {
      await generateCode();
      // Show success and download
    } catch (error) {
      // Show error toast
    }
  };

  const handleExport = () => {
    const blueprint = {
      version: '1.0.0',
      nodes,
      edges,
      metadata: {
        created: new Date().toISOString(),
        nodeCount: stats.nodeCount,
        edgeCount: stats.edgeCount
      }
    };

    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anvaya-blueprint.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const ToolbarSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("flex items-center gap-1 px-2 py-1", className)}>
      {children}
    </div>
  );

  const ToolbarButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    disabled = false, 
    active = false,
    variant = 'default',
    size = 'sm',
    shortcut,
    className = ""
  }: {
    icon: any,
    label: string,
    onClick?: () => void,
    disabled?: boolean,
    active?: boolean,
    variant?: 'default' | 'primary' | 'success' | 'danger',
    size?: 'sm' | 'md',
    shortcut?: string,
    className?: string
  }) => {
    const variants = {
      default: "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]",
      primary: "text-[#a3a6ff] hover:text-white hover:bg-[#a3a6ff]/20",
      success: "text-green-400 hover:text-green-300 hover:bg-green-400/10",
      danger: "text-red-400 hover:text-red-300 hover:bg-red-400/10"
    };

    const sizes = {
      sm: "p-1.5",
      md: "px-3 py-2"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative rounded transition-all duration-200 group",
          sizes[size],
          active ? "bg-[#a3a6ff]/20 text-[#a3a6ff]" : variants[variant],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      >
        <Icon className={cn("transition-transform", size === 'sm' ? "w-4 h-4" : "w-5 h-5")} />
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#10131a] border border-[#1c2028] rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {label}
          {shortcut && <span className="text-[#73757d] ml-1">({shortcut})</span>}
        </div>
      </button>
    );
  };

  const Divider = () => (
    <div className="w-px h-6 bg-[#22262f]" />
  );

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="bg-[#10131a]/95 backdrop-blur-md border border-[#1c2028] rounded-xl shadow-xl">
        <div className="flex items-center divide-x divide-[#22262f]">
          
          {/* File Operations */}
          <ToolbarSection>
            <ToolbarButton
              icon={Save}
              label="Save Blueprint"
              onClick={handleSave}
              shortcut="Ctrl+S"
              variant="default"
            />
            <ToolbarButton
              icon={Upload}
              label="Import Blueprint"
              onClick={() => {/* Import logic */}}
            />
            <ToolbarButton
              icon={Download}
              label="Export Blueprint"
              onClick={handleExport}
            />
          </ToolbarSection>

          <Divider />

          {/* History */}
          <ToolbarSection>
            <ToolbarButton
              icon={RotateCcw}
              label="Undo"
              onClick={undo}
              disabled={!canUndo}
              shortcut="Ctrl+Z"
            />
            <ToolbarButton
              icon={RotateCw}
              label="Redo"
              onClick={redo}
              disabled={!canRedo}
              shortcut="Ctrl+Y"
            />
          </ToolbarSection>

          <Divider />

          {/* Generation */}
          <ToolbarSection>
            <ToolbarButton
              icon={isGenerating ? Square : Play}
              label={isGenerating ? "Generating..." : "Generate Code"}
              onClick={handleGenerate}
              disabled={!stats.isValid || isGenerating}
              variant={stats.isValid ? "success" : "default"}
              size="md"
              className={isGenerating ? "animate-pulse" : ""}
            />
            <ToolbarButton
              icon={Code}
              label="Preview Code"
              onClick={() => {/* Preview logic */}}
              disabled={!stats.isValid}
            />
          </ToolbarSection>

          <Divider />

          {/* View Controls */}
          <ToolbarSection>
            <ToolbarButton
              icon={Maximize}
              label="Fit to View"
              onClick={() => {/* Fit view logic */}}
              shortcut="Ctrl+0"
            />
            <ToolbarButton
              icon={Sparkles}
              label="Auto Layout"
              onClick={() => {/* Auto layout logic */}}
            />
            <ToolbarButton
              icon={Grid}
              label="Toggle Grid"
              onClick={() => {/* Toggle grid */}}
            />
          </ToolbarSection>

          <Divider />

          {/* Collaboration & Info */}
          <ToolbarSection>
            <ToolbarButton
              icon={Share2}
              label="Share"
              onClick={() => setShowShareModal(true)}
              variant="primary"
            />
            <ToolbarButton
              icon={showStats ? Eye : EyeOff}
              label="Canvas Stats"
              onClick={() => setShowStats(!showStats)}
              active={showStats}
            />
            <ToolbarButton
              icon={HelpCircle}
              label="Help & Shortcuts"
              onClick={() => {/* Help modal */}}
            />
          </ToolbarSection>

        </div>

        {/* Canvas Statistics Bar */}
        {showStats && (
          <div className="border-t border-[#22262f] px-4 py-2 bg-[#0d1016]/50">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#a3a6ff]" />
                  <span className="text-[#a9abb3]">{stats.nodeCount} nodes</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-[#a3a6ff]" />
                  <span className="text-[#a9abb3]">{stats.edgeCount} connections</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileCode className="w-3 h-3 text-[#a3a6ff]" />
                  <span className="text-[#a9abb3]">~{stats.estimatedLines} lines</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {stats.isValid ? (
                    <>
                      <Zap className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Ready to generate</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400">Needs route & response</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#73757d]" />
                  <span className="text-[#73757d]">{stats.lastSaved}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#10131a] border border-[#1c2028] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#ecedf6] mb-4">Share Blueprint</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#a9abb3] mb-2">Sharing Options</label>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 bg-[#161a21] hover:bg-[#1c2028] rounded text-left transition-colors">
                    <Link className="w-4 h-4 text-[#a3a6ff]" />
                    <div>
                      <div className="text-sm text-[#ecedf6]">Copy Share Link</div>
                      <div className="text-xs text-[#73757d]">Anyone with the link can view</div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 bg-[#161a21] hover:bg-[#1c2028] rounded text-left transition-colors">
                    <Users className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="text-sm text-[#ecedf6]">Invite Collaborators</div>
                      <div className="text-xs text-[#73757d]">Real-time editing access</div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 bg-[#161a21] hover:bg-[#1c2028] rounded text-left transition-colors">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-sm text-[#ecedf6]">Export as Template</div>
                      <div className="text-xs text-[#73757d]">Save to template gallery</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm text-[#a9abb3] hover:text-[#ecedf6] transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-[#a3a6ff] text-white text-sm rounded hover:bg-[#8b8dff] transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}