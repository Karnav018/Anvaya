import { useCanvasStore } from '../../store/canvasStore';
import { Settings2, Trash2 } from 'lucide-react';

export function ConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode } = useCanvasStore();

  if (!selectedNode) {
    return (
      <div className="w-[240px] h-full bg-[#10131a] flex flex-col shrink-0 items-center justify-center border-l border-[#1c2028] z-10">
        <div className="w-12 h-12 mb-3 rounded-md bg-[#1c2028] flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-[#45484f] animate-[spin_10s_linear_infinite]" />
        </div>
        <p className="text-[11px] font-medium text-[#73757d] text-center px-4">Select a node to view properties</p>
      </div>
    );
  }

  const { type, data, id } = selectedNode;

  const handleChange = (field: string, value: any) => {
    updateNodeData(id, { [field]: value });
  };

  return (
    <div className="w-[240px] h-full bg-[#10131a] flex flex-col shrink-0 overflow-y-auto border-l border-[#1c2028] z-10 block-scrollbar">
      <div className="px-4 py-3 bg-[#161a21] border-b border-[#1c2028]">
        <h2 className="font-semibold text-[13px] text-[#ecedf6] flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[#a3a6ff]" />
          {type} Node
        </h2>
        <p className="text-[9px] text-[#a9abb3] font-mono mt-1.5 rounded uppercase tracking-wider">{id}</p>
      </div>

      <div className="p-4 space-y-4">
        {type === 'route' && (
          <>
            <Field label="Method">
              <select 
                title="Select HTTP Method"
                value={data.method} 
                onChange={(e) => handleChange('method', e.target.value)}
                className="input"
              >
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Path">
              <input value={data.path} onChange={(e) => handleChange('path', e.target.value)} className="input" />
            </Field>
            <Field label="Description">
              <input value={data.description} onChange={(e) => handleChange('description', e.target.value)} className="input" />
            </Field>
          </>
        )}

        {type === 'auth' && (
          <>
            <Field label="Strategy">
              <select title="Strategy" value={data.strategy} onChange={(e) => handleChange('strategy', e.target.value)} className="input">
                <option value="jwt">JWT (Bearer Token)</option>
                <option value="none">None</option>
              </select>
            </Field>
            {data.strategy === 'jwt' && (
              <Field label="Secret Env Var">
                <input value={data.secret_env_var} onChange={(e) => handleChange('secret_env_var', e.target.value)} className="input" placeholder="JWT_SECRET" />
              </Field>
            )}
          </>
        )}

        {type === 'database' && (
          <>
            <Field label="Model">
              <input value={data.model} onChange={(e) => handleChange('model', e.target.value)} className="input" placeholder="User" />
            </Field>
            <Field label="Action">
              <select title="Select DB Action" value={data.action} onChange={(e) => handleChange('action', e.target.value)} className="input">
                <option value="findAll">findAll()</option>
                <option value="findOne">findOne()</option>
                <option value="create">create()</option>
                <option value="update">update()</option>
                <option value="destroy">destroy()</option>
              </select>
            </Field>
          </>
        )}

        {type === 'middleware' && (
          <Field label="Name">
            <input value={data.name} onChange={(e) => handleChange('name', e.target.value)} className="input" />
          </Field>
        )}

        {type === 'fetch' && (
          <>
            <Field label="Method">
              <select value={data.method} onChange={(e) => handleChange('method', e.target.value)} className="input">
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="URL Endpoint">
              <input value={data.url} onChange={(e) => handleChange('url', e.target.value)} className="input" placeholder="https://api..." />
            </Field>
          </>
        )}

        {type === 'cache' && (
          <>
            <Field label="TTL (Seconds)">
              <input type="number" value={data.ttl} onChange={(e) => handleChange('ttl', parseInt(e.target.value))} className="input" placeholder="3600" />
            </Field>
            <Field label="Cache Key Expression">
              <input value={data.cache_key} onChange={(e) => handleChange('cache_key', e.target.value)} className="input" placeholder="req.url" />
            </Field>
          </>
        )}

        {type === 'email' && (
          <>
            <Field label="To (Address or Object)">
              <input value={data.to} onChange={(e) => handleChange('to', e.target.value)} className="input" placeholder="req.body.email" />
            </Field>
            <Field label="Subject Line">
              <input value={data.subject} onChange={(e) => handleChange('subject', e.target.value)} className="input" placeholder="Welcome!" />
            </Field>
          </>
        )}

        {type === 'upload' && (
          <>
            <Field label="S3 Bucket Name">
              <input value={data.bucket} onChange={(e) => handleChange('bucket', e.target.value)} className="input" placeholder="my-assets-bucket" />
            </Field>
          </>
        )}

        {type === 'ai' && (
          <>
            <Field label="System Prompt / Instruction">
              <input value={data.prompt} onChange={(e) => handleChange('prompt', e.target.value)} className="input" placeholder="Summarize ${req.body.text}" />
            </Field>
          </>
        )}

        {type === 'payment' && (
          <>
            <Field label="Stripe Mode">
              <select value={data.mode} onChange={(e) => handleChange('mode', e.target.value)} className="input">
                <option value="payment">One-time Payment</option>
                <option value="subscription">Subscription</option>
              </select>
            </Field>
            <Field label="Product ID (prod_xxx)">
              <input value={data.product_id} onChange={(e) => handleChange('product_id', e.target.value)} className="input" placeholder="prod_12345" />
            </Field>
          </>
        )}

        {type === 'response' && (
          <>
            <Field label="Status Code">
              <input type="number" value={data.status_code} onChange={(e) => handleChange('status_code', parseInt(e.target.value))} className="input" />
            </Field>
            <Field label="Body Object">
              <input value={data.body} onChange={(e) => handleChange('body', e.target.value)} className="input" placeholder="data" />
            </Field>
          </>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-[#1c2028] bg-[#0c0e14]">
        <button 
          onClick={() => deleteNode(id)}
          className="w-full py-2.5 px-4 rounded-md border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>
      </div>
    </div>
  );
}

// Helper to style form fields consistently
function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-wider text-[#73757d] uppercase">{label}</label>
      <div className="[&>input]:w-full [&>input]:bg-[#161a21] [&>input]:border-b [&>input]:border-[#1c2028] [&>input]:px-2.5 [&>input]:py-1.5 [&>input]:text-[11px] [&>input]:font-mono [&>input]:text-[#ecedf6] [&>input]:outline-none [&>input]:transition-colors [&>input]:focus:border-[#a3a6ff] hover:[&>input]:bg-[#1c2028]
                      [&>select]:w-full [&>select]:bg-[#161a21] [&>select]:border-b [&>select]:border-[#1c2028] [&>select]:px-2.5 [&>select]:py-1.5 [&>select]:text-[11px] [&>select]:font-mono [&>select]:text-[#ecedf6] [&>select]:outline-none [&>select]:transition-colors [&>select]:focus:border-[#a3a6ff] hover:[&>select]:bg-[#1c2028]">
        {children}
      </div>
    </div>
  );
}
