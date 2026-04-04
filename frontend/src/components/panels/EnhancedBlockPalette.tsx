import { useState } from 'react';
import { 
  Network, Database, Lock, Combine, Send, Globe, HardDrive, Mail, 
  CloudUpload, BrainCircuit, CreditCard, Table, CheckCircle, 
  AlertTriangle, FileText, Search, ChevronDown, ChevronUp,
  Info, Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Block {
  type: string;
  label: string;
  icon: any;
  color: string;
  category: 'core' | 'data' | 'auth' | 'external' | 'advanced';
  description: string;
  tags: string[];
}

export function EnhancedBlockPalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    core: true,
    data: true,
    auth: true,
    external: false,
    advanced: false
  });

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    
    // Visual feedback during drag
    event.currentTarget.classList.add('opacity-50');
  };

  const onDragEnd = (event: React.DragEvent) => {
    event.currentTarget.classList.remove('opacity-50');
  };

  const blocks: Block[] = [
    // Core Blocks
    { 
      type: 'route', 
      label: 'Route', 
      icon: Network, 
      color: 'text-primary border-primary/30 hover:border-primary',
      category: 'core',
      description: 'HTTP endpoint (GET, POST, PUT, DELETE)',
      tags: ['endpoint', 'http', 'api', 'rest']
    },
    { 
      type: 'response', 
      label: 'Response', 
      icon: Send, 
      color: 'text-orange-500 border-orange-500/30 hover:border-orange-500',
      category: 'core',
      description: 'API response with status codes and data',
      tags: ['output', 'status', 'json', 'result']
    },
    { 
      type: 'middleware', 
      label: 'Middleware', 
      icon: Combine, 
      color: 'text-purple-500 border-purple-500/30 hover:border-purple-500',
      category: 'core',
      description: 'Request/response processing (CORS, logging)',
      tags: ['cors', 'logger', 'processing', 'pipeline']
    },

    // Data Blocks
    { 
      type: 'database', 
      label: 'Database', 
      icon: Database, 
      color: 'text-blue-500 border-blue-500/30 hover:border-blue-500',
      category: 'data',
      description: 'CRUD operations (PostgreSQL, MongoDB)',
      tags: ['crud', 'postgres', 'mongodb', 'sql']
    },
    { 
      type: 'schema', 
      label: 'Schema', 
      icon: Table, 
      color: 'text-blue-400 border-blue-400/30 hover:border-blue-400',
      category: 'data',
      description: 'Database table structure and relationships',
      tags: ['model', 'table', 'fields', 'relations']
    },
    { 
      type: 'cache', 
      label: 'Cache', 
      icon: HardDrive, 
      color: 'text-emerald-500 border-emerald-500/30 hover:border-emerald-500',
      category: 'data',
      description: 'Redis caching with TTL',
      tags: ['redis', 'performance', 'speed', 'memory']
    },

    // Auth Blocks
    { 
      type: 'auth', 
      label: 'Auth', 
      icon: Lock, 
      color: 'text-yellow-500 border-yellow-500/30 hover:border-yellow-500',
      category: 'auth',
      description: 'Authentication (JWT, API keys)',
      tags: ['jwt', 'security', 'token', 'login']
    },
    { 
      type: 'validation', 
      label: 'Validation', 
      icon: CheckCircle, 
      color: 'text-green-400 border-green-400/30 hover:border-green-400',
      category: 'auth',
      description: 'Input validation and sanitization',
      tags: ['validate', 'sanitize', 'rules', 'check']
    },

    // External Blocks
    { 
      type: 'fetch', 
      label: 'API Call', 
      icon: Globe, 
      color: 'text-cyan-500 border-cyan-500/30 hover:border-cyan-500',
      category: 'external',
      description: 'External HTTP requests',
      tags: ['http', 'axios', 'api', 'request']
    },
    { 
      type: 'email', 
      label: 'Email', 
      icon: Mail, 
      color: 'text-rose-500 border-rose-500/30 hover:border-rose-500',
      category: 'external',
      description: 'Send emails via SMTP',
      tags: ['smtp', 'notification', 'mail', 'send']
    },
    { 
      type: 'upload', 
      label: 'File Upload', 
      icon: CloudUpload, 
      color: 'text-sky-500 border-sky-500/30 hover:border-sky-500',
      category: 'external',
      description: 'File storage (AWS S3, local)',
      tags: ['file', 's3', 'storage', 'upload']
    },
    { 
      type: 'payment', 
      label: 'Payment', 
      icon: CreditCard, 
      color: 'text-indigo-500 border-indigo-500/30 hover:border-indigo-500',
      category: 'external',
      description: 'Stripe payments and checkout',
      tags: ['stripe', 'checkout', 'billing', 'money']
    },

    // Advanced Blocks
    { 
      type: 'ai', 
      label: 'AI Process', 
      icon: BrainCircuit, 
      color: 'text-fuchsia-500 border-fuchsia-500/30 hover:border-fuchsia-500',
      category: 'advanced',
      description: 'OpenAI GPT processing',
      tags: ['openai', 'gpt', 'ml', 'intelligence']
    },
    { 
      type: 'error_handler', 
      label: 'Error Handler', 
      icon: AlertTriangle, 
      color: 'text-red-400 border-red-400/30 hover:border-red-400',
      category: 'advanced',
      description: 'Global error handling and logging',
      tags: ['error', 'exception', 'logging', 'debug']
    },
    { 
      type: 'response_schema', 
      label: 'Response Schema', 
      icon: FileText, 
      color: 'text-purple-400 border-purple-400/30 hover:border-purple-400',
      category: 'advanced',
      description: 'Structured response formatting',
      tags: ['format', 'structure', 'json', 'schema']
    },
  ];

  const categories = [
    { id: 'all', label: 'All Blocks', count: blocks.length },
    { id: 'core', label: 'Core', count: blocks.filter(b => b.category === 'core').length },
    { id: 'data', label: 'Data', count: blocks.filter(b => b.category === 'data').length },
    { id: 'auth', label: 'Auth & Validation', count: blocks.filter(b => b.category === 'auth').length },
    { id: 'external', label: 'External Services', count: blocks.filter(b => b.category === 'external').length },
    { id: 'advanced', label: 'Advanced', count: blocks.filter(b => b.category === 'advanced').length },
  ];

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = searchTerm === '' || 
      block.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, Block[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const CategoryHeader = ({ category, label, count }: { category: string, label: string, count: number }) => (
    <div 
      className="flex items-center justify-between px-3 py-2 hover:bg-[#161a21] cursor-pointer rounded"
      onClick={() => toggleCategory(category)}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#ecedf6]">{label}</span>
        <span className="text-[10px] text-[#73757d] bg-[#161a21] px-1.5 py-0.5 rounded">{count}</span>
      </div>
      {expandedCategories[category] ? 
        <ChevronUp className="w-3 h-3 text-[#a9abb3]" /> : 
        <ChevronDown className="w-3 h-3 text-[#a9abb3]" />
      }
    </div>
  );

  return (
    <div className="w-[280px] h-full bg-[#10131a] flex flex-col shrink-0 z-10 border-r border-[#1c2028]">
      {/* Header */}
      <div className="p-4 border-b border-[#1c2028]">
        <h2 className="text-sm font-semibold text-[#ecedf6] mb-2">Block Palette</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#a9abb3]" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#161a21] border border-[#22262f] rounded text-xs text-[#ecedf6] placeholder:text-[#73757d] focus:border-[#a3a6ff] focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between",
                selectedCategory === cat.id 
                  ? "bg-[#a3a6ff]/20 text-[#a3a6ff]" 
                  : "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]"
              )}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto block-scrollbar">
        {selectedCategory === 'all' ? (
          // Grouped by category
          Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
            <div key={category} className="p-2">
              <CategoryHeader 
                category={category}
                label={categories.find(c => c.id === category)?.label || category}
                count={categoryBlocks.length}
              />
              {expandedCategories[category] && (
                <div className="space-y-1 mt-1">
                  {categoryBlocks.map((block) => (
                    <BlockItem key={block.type} block={block} onDragStart={onDragStart} onDragEnd={onDragEnd} />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          // Flat list for specific category
          <div className="p-2 space-y-1">
            {filteredBlocks.map((block) => (
              <BlockItem key={block.type} block={block} onDragStart={onDragStart} onDragEnd={onDragEnd} />
            ))}
          </div>
        )}

        {filteredBlocks.length === 0 && (
          <div className="p-4 text-center">
            <Search className="w-8 h-8 text-[#73757d] mx-auto mb-2" />
            <p className="text-xs text-[#73757d]">No blocks found</p>
            <p className="text-[10px] text-[#5a5c63] mt-1">Try different search terms</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-[#1c2028]">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#a3a6ff] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-[11px] font-semibold text-[#ecedf6] mb-1">Quick Start</h3>
            <ul className="text-[10px] text-[#a9abb3] space-y-1">
              <li>• Drag blocks to canvas</li>
              <li>• Connect with lines</li>
              <li>• Start with Route → end with Response</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockItem({ 
  block, 
  onDragStart, 
  onDragEnd 
}: { 
  block: Block, 
  onDragStart: (event: React.DragEvent, nodeType: string) => void,
  onDragEnd: (event: React.DragEvent) => void
}) {
  const Icon = block.icon;
  
  return (
    <div
      className="group flex items-start gap-3 px-3 py-2.5 bg-transparent hover:bg-[#161a21] rounded cursor-grab active:cursor-grabbing transition-all duration-200"
      onDragStart={(event) => onDragStart(event, block.type)}
      onDragEnd={onDragEnd}
      draggable
      title={block.description}
    >
      <div className={cn("mt-0.5 transition-colors", block.color.split(' ')[0])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-xs text-[#a9abb3] group-hover:text-[#ecedf6] transition-colors">
          {block.label}
        </div>
        <div className="text-[10px] text-[#73757d] leading-tight mt-0.5 line-clamp-2">
          {block.description}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {block.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] text-[#5a5c63] bg-[#161a21] px-1 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}