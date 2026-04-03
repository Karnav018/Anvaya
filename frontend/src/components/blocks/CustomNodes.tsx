import { Handle, Position } from 'reactflow';
import { Network, Database, Lock, Combine, Send, Globe, HardDrive, Mail, CloudUpload, BrainCircuit, CreditCard, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const NodeWrapper = ({ 
  children, 
  selected, 
}: { 
  children: React.ReactNode, 
  selected?: boolean,
}) => (
  <div className={cn(
    "relative min-w-[200px] bg-[#1c2028] text-white rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all overflow-hidden",
    selected ? `border-l-2 border-l-[#a3a6ff]` : "border-l-2 border-transparent"
  )}>
    {children}
  </div>
);

// 1. ROUTE BLOCK
export function RouteBlock({ data, selected }: any) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/10 text-green-500',
    POST: 'bg-blue-500/10 text-blue-500',
    PUT: 'bg-yellow-500/10 text-yellow-500',
    DELETE: 'bg-red-500/10 text-red-500',
  };

  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Network className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Route</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn("px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold tracking-wide", methodColors[data.method] || 'bg-white/10 text-white')}>
            {data.method || 'GET'}
          </span>
          <span className="text-xs font-mono text-[#a9abb3]">{data.path || '/'}</span>
        </div>
        <div className="text-[11px] font-medium text-[#73757d] leading-snug">{data.description || 'No description provided'}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 2. AUTH BLOCK
export function AuthBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Authentication</span>
      </div>
      <div className="p-3">
        <div className="text-xs font-medium text-[#a9abb3] mb-1">
          {data.strategy === 'jwt' ? 'JWT Token (Header)' : 'No Auth'}
        </div>
        <div className="text-[11px] text-[#73757d] font-mono">
          ENV: {data.secret_env_var || 'JWT_SECRET'}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 3. DATABASE BLOCK
export function DatabaseBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Database</span>
      </div>
      <div className="p-3">
        <div className="text-[13px] font-mono text-[#ecedf6]">
          {data.model || 'Model'}<span className="text-[#a3a6ff]">.{data.action || 'action'}</span>()
        </div>
        <div className="mt-1.5 text-[10px] font-semibold text-[#73757d] uppercase tracking-wider">Driver: {data.provider || 'postgres'}</div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 4. MIDDLEWARE BLOCK
export function MiddlewareBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Combine className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Middleware</span>
      </div>
      <div className="p-3">
        <div className="text-xs font-medium text-[#a9abb3]">
          {data.name || 'Logger / CORS'}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 5. RESPONSE BLOCK
export function ResponseBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Send className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Endpoint Response</span>
      </div>
      <div className="p-3 flex items-center gap-2">
        <span className={cn(
          "px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold tracking-wide", 
          data.status_code >= 400 ? 'bg-[#490013] text-[#ffb2b9]' : 'bg-[#eab308]/20 text-[#eab308]'
        )}>
          {data.status_code || 200}
        </span>
        <span className="text-[11px] font-medium text-[#73757d]">Return: <span className="text-[#a9abb3]">{data.body || 'data'}</span></span>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
    </NodeWrapper>
  );
}

// 6. FETCH BLOCK
export function FetchBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">External Fetch</span>
      </div>
      <div className="p-3">
        <div className="text-[13px] font-mono text-[#ecedf6] truncate max-w-[180px]">
          {data.method || 'GET'} <span className="text-[#a3a6ff]">{data.url || 'https://api.example.com'}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 7. CACHE BLOCK
export function CacheBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <HardDrive className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Redis Cache</span>
      </div>
      <div className="p-3 flex justify-between items-center gap-2">
        <div className="text-[11px] font-mono text-[#a9abb3] bg-[#1c2028] px-1.5 py-0.5 rounded border border-[#45484f]">
          {data.cache_key || 'cacheKey'}
        </div>
        <div className="text-[10px] font-semibold text-[#73757d] uppercase">
          TTL: {data.ttl || 3600}s
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 8. EMAIL BLOCK
export function EmailBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Mail className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Transactional Email</span>
      </div>
      <div className="p-3">
        <div className="text-[11px] font-medium text-[#73757d] mb-1">To: <span className="text-[#a9abb3]">{data.to || 'user@example.com'}</span></div>
        <div className="text-[11px] font-medium text-[#73757d]">Sub: <span className="text-[#a9abb3] truncate">{data.subject || 'Welcome!'}</span></div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 9. UPLOAD BLOCK
export function UploadBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <CloudUpload className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">S3 Storage</span>
      </div>
      <div className="p-3">
        <div className="text-[11px] font-mono text-[#a9abb3] bg-[#1c2028] px-1.5 py-0.5 rounded border border-[#45484f] inline-block mb-1">
          {data.bucket || 'my-app-assets'}
        </div>
        <div className="text-[10px] font-semibold text-[#73757d] uppercase tracking-wider block">Max: 10MB</div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 10. AI BLOCK
export function AIBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <BrainCircuit className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">OpenAI Processor</span>
      </div>
      <div className="p-3">
        <div className="text-[11px] font-semibold text-[#a9abb3] uppercase tracking-wider mb-1">GPT-4o</div>
        <div className="text-[10px] text-[#73757d] italic leading-tight truncate">"{data.prompt || 'Process this data...'}"</div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 11. PAYMENT BLOCK
export function PaymentBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <CreditCard className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Stripe API</span>
      </div>
      <div className="p-3">
        <div className="text-[11px] font-mono text-[#a9abb3]">Mode: {data.mode || 'payment'}</div>
        <div className="mt-1 text-[10px] font-semibold text-[#73757d] uppercase tracking-wider">prod_{data.product_id?.slice(0,6) || 'xxx...'}</div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-ml-1" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}

// 12. CRON BLOCK
export function CronBlock({ data, selected }: any) {
  return (
    <NodeWrapper selected={selected}>
      <div className="p-3 bg-[#161a21]/50 border-b border-[#22262f] flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-[#a3a6ff]" />
        <span className="font-semibold text-xs tracking-tight text-[#ecedf6]">Cron Scheduler</span>
      </div>
      <div className="p-3">
        <div className="text-[13px] font-mono text-[#ecedf6] mb-1.5">
          {data.schedule || '0 0 * * *'}
        </div>
        <div className="text-[10px] uppercase font-bold text-[#73757d] tracking-widest">{data.description || 'RECURRING JOB'}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#a28efc] !border-none !-mr-1" />
    </NodeWrapper>
  );
}
