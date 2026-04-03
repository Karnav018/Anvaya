import { Network, Database, Lock, Combine, Send, Globe, HardDrive, Mail, CloudUpload, BrainCircuit, CreditCard, Table, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export function BlockPalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const blocks = [
    { type: 'route', label: 'Route', icon: Network, color: 'text-primary border-primary/30 hover:border-primary' },
    { type: 'auth', label: 'Auth', icon: Lock, color: 'text-yellow-500 border-yellow-500/30 hover:border-yellow-500' },
    { type: 'database', label: 'Database', icon: Database, color: 'text-blue-500 border-blue-500/30 hover:border-blue-500' },
    { type: 'schema', label: 'Schema', icon: Table, color: 'text-blue-400 border-blue-400/30 hover:border-blue-400' },
    { type: 'validation', label: 'Validation', icon: CheckCircle, color: 'text-green-400 border-green-400/30 hover:border-green-400' },
    { type: 'error_handler', label: 'Error Handler', icon: AlertTriangle, color: 'text-red-400 border-red-400/30 hover:border-red-400' },
    { type: 'response_schema', label: 'Response Schema', icon: FileText, color: 'text-purple-400 border-purple-400/30 hover:border-purple-400' },
    { type: 'email', label: 'Email', icon: Mail, color: 'text-rose-500 border-rose-500/30 hover:border-rose-500' },
    { type: 'upload', label: 'Storage', icon: CloudUpload, color: 'text-sky-500 border-sky-500/30 hover:border-sky-500' },
    { type: 'ai', label: 'AI Process', icon: BrainCircuit, color: 'text-fuchsia-500 border-fuchsia-500/30 hover:border-fuchsia-500' },
    { type: 'payment', label: 'Payment', icon: CreditCard, color: 'text-indigo-500 border-indigo-500/30 hover:border-indigo-500' },
    { type: 'fetch', label: 'Fetch', icon: Globe, color: 'text-cyan-500 border-cyan-500/30 hover:border-cyan-500' },
    { type: 'cache', label: 'Cache', icon: HardDrive, color: 'text-emerald-500 border-emerald-500/30 hover:border-emerald-500' },
    { type: 'middleware', label: 'Middleware', icon: Combine, color: 'text-purple-500 border-purple-500/30 hover:border-purple-500' },
    { type: 'response', label: 'Response', icon: Send, color: 'text-orange-500 border-orange-500/30 hover:border-orange-500' },
  ];

  return (
    <div className="w-[200px] h-full bg-[#10131a] flex flex-col shrink-0 z-10 border-r border-[#1c2028]">
      <div className="p-4 border-b border-[#1c2028]">
        <h2 className="text-[12px] font-semibold text-[#ecedf6] mb-1">Block Palette</h2>
        <p className="text-[10px] text-[#a9abb3] leading-snug">Drag & Drop nodes to logic canvas.</p>
      </div>

      <div className="p-2 space-y-1 overflow-y-auto block-scrollbar">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.type}
              className={`group flex items-center gap-3 px-3 py-2 bg-transparent hover:bg-[#161a21] rounded cursor-grab active:cursor-grabbing transition-colors`}
              onDragStart={(event) => onDragStart(event, block.type)}
              draggable
            >
              <div className="text-[#a3a6ff]">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-medium text-[12px] text-[#a9abb3] group-hover:text-[#ecedf6] transition-colors">{block.label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto p-4 border-t border-[#1c2028]">
        <h3 className="text-[11px] font-semibold text-[#ecedf6] mb-2">Quick Start</h3>
        <ul className="text-[10px] text-[#a9abb3] space-y-1.5 list-disc pl-3">
          <li>Start with a <b>Route</b> block.</li>
          <li>End with a <b>Response</b> block.</li>
          <li>Connect handles by dragging edges.</li>
        </ul>
      </div>
    </div>
  );
}
