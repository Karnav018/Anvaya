import { useCanvasStore } from '../../store/canvasStore';
import { Settings2, Trash2, HelpCircle, Plus } from 'lucide-react';
import { useState } from 'react';

export function ConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode } = useCanvasStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!selectedNode) {
    return (
      <div className="w-[280px] h-full bg-[#10131a] flex flex-col shrink-0 items-center justify-center border-l border-[#1c2028] z-10">
        <div className="w-16 h-16 mb-4 rounded-xl bg-[#1c2028] flex items-center justify-center">
          <Settings2 className="w-7 h-7 text-[#45484f]" />
        </div>
        <p className="text-sm font-medium text-white/50 text-center px-6">
          Select a block to configure
        </p>
        <p className="text-xs text-white/30 text-center px-6 mt-2">
          Click any block on the canvas
        </p>
      </div>
    );
  }

  const { type, data, id } = selectedNode;

  const handleChange = (field: string, value: any) => {
    // For simple text inputs, don't over-sanitize as it can break normal editing
    // Only sanitize when absolutely necessary (e.g., HTML content)
    const processedValue = typeof value === 'string' ? value.trim() : value;
    updateNodeData(id, { [field]: processedValue });
  };

  const handleDelete = () => {
    deleteNode(id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="w-[280px] h-full bg-[#10131a] flex flex-col shrink-0 border-l border-[#1c2028] z-10">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-b from-[#161a21] to-[#10131a] border-b border-[#1c2028] sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-4 h-4 text-[#a3a6ff]" />
          <h2 className="font-semibold text-sm text-[#ecedf6] capitalize">
            {type} Block
          </h2>
        </div>
        <p className="text-[10px] text-[#73757d] font-mono truncate">
          ID: {id.substring(0, 16)}...
        </p>
      </div>

      {/* Configuration Fields */}
      <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
        {type === 'route' && (
          <>
            <Field 
              label="HTTP Method" 
              help="The HTTP verb for this endpoint"
            >
              <select 
                value={data.method} 
                onChange={(e) => handleChange('method', e.target.value)}
                className="input"
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field 
              label="Path" 
              help="API endpoint path (e.g., /api/users)"
              required
            >
              <input 
                value={data.path || ''} 
                onChange={(e) => handleChange('path', e.target.value)}
                className="input"
                placeholder="/api/resource"
              />
            </Field>
            <Field label="Description">
              <textarea 
                value={data.description || ''} 
                onChange={(e) => handleChange('description', e.target.value)}
                className="input resize-none"
                rows={3}
                placeholder="Brief description of this endpoint"
              />
            </Field>
          </>
        )}

        {type === 'auth' && (
          <>
            <Field 
              label="Strategy" 
              help="Authentication method to use"
            >
              <select 
                value={data.strategy} 
                onChange={(e) => handleChange('strategy', e.target.value)} 
                className="input"
              >
                <option value="jwt">JWT (Bearer Token)</option>
                <option value="api_key">API Key</option>
                <option value="none">None (Public)</option>
              </select>
            </Field>
            {data.strategy === 'jwt' && (
              <Field 
                label="Secret Env Variable" 
                help="Environment variable name for JWT secret"
              >
                <input 
                  value={data.secret_env_var || ''} 
                  onChange={(e) => handleChange('secret_env_var', e.target.value)} 
                  className="input font-mono" 
                  placeholder="JWT_SECRET" 
                />
              </Field>
            )}
          </>
        )}

        {type === 'database' && (
          <>
            <Field 
              label="Provider" 
              help="Database type to use"
            >
              <select 
                value={data.provider || 'postgres'} 
                onChange={(e) => handleChange('provider', e.target.value)} 
                className="input"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="sqlite">SQLite</option>
              </select>
            </Field>
            <Field 
              label="Model Name" 
              help="Database model or table name"
              required
            >
              <input 
                value={data.model || ''} 
                onChange={(e) => handleChange('model', e.target.value)} 
                className="input" 
                placeholder="User" 
              />
            </Field>
            <Field 
              label="Action" 
              help="Database operation to perform"
            >
              <select 
                value={data.action} 
                onChange={(e) => handleChange('action', e.target.value)} 
                className="input"
              >
                <option value="findAll">Find All</option>
                <option value="findOne">Find One</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </Field>
          </>
        )}

        {type === 'middleware' && (
          <Field 
            label="Type" 
            help="Middleware type"
          >
            <select 
              value={data.type || 'cors'} 
              onChange={(e) => handleChange('type', e.target.value)} 
              className="input"
            >
              <option value="cors">CORS</option>
              <option value="logger">Logger</option>
              <option value="rate_limit">Rate Limit</option>
              <option value="body_parser">Body Parser</option>
            </select>
          </Field>
        )}

        {type === 'fetch' && (
          <>
            <Field label="HTTP Method">
              <select 
                value={data.method} 
                onChange={(e) => handleChange('method', e.target.value)} 
                className="input"
              >
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field 
              label="URL" 
              help="External API endpoint to call"
              required
            >
              <input 
                value={data.url || ''} 
                onChange={(e) => handleChange('url', e.target.value)} 
                className="input font-mono text-xs" 
                placeholder="https://api.example.com/data" 
              />
            </Field>
          </>
        )}

        {type === 'cache' && (
          <>
            <Field 
              label="TTL (seconds)" 
              help="Time to live for cached data"
            >
              <input 
                type="number" 
                value={data.ttl || 3600} 
                onChange={(e) => handleChange('ttl', parseInt(e.target.value) || 3600)} 
                className="input" 
                placeholder="3600" 
              />
            </Field>
            <Field 
              label="Cache Key" 
              help="Expression to generate cache key"
            >
              <input 
                value={data.cache_key || ''} 
                onChange={(e) => handleChange('cache_key', e.target.value)} 
                className="input font-mono text-xs" 
                placeholder="req.url" 
              />
            </Field>
          </>
        )}

        {type === 'email' && (
          <>
            <Field 
              label="To" 
              help="Recipient email address or expression"
              required
            >
              <input 
                value={data.to || ''} 
                onChange={(e) => handleChange('to', e.target.value)} 
                className="input font-mono text-xs" 
                placeholder="req.body.email" 
              />
            </Field>
            <Field 
              label="Subject" 
              required
            >
              <input 
                value={data.subject || ''} 
                onChange={(e) => handleChange('subject', e.target.value)} 
                className="input" 
                placeholder="Welcome to our service!" 
              />
            </Field>
          </>
        )}

        {type === 'upload' && (
          <Field 
            label="S3 Bucket" 
            help="AWS S3 bucket name for file storage"
            required
          >
            <input 
              value={data.bucket || ''} 
              onChange={(e) => handleChange('bucket', e.target.value)} 
              className="input" 
              placeholder="my-assets-bucket" 
            />
          </Field>
        )}

        {type === 'ai' && (
          <Field 
            label="Prompt Template" 
            help="AI instruction with template variables"
            required
          >
            <textarea 
              value={data.prompt || ''} 
              onChange={(e) => handleChange('prompt', e.target.value)} 
              className="input resize-none font-mono text-xs" 
              rows={4}
              placeholder="Summarize this text: ${req.body.text}" 
            />
          </Field>
        )}

        {type === 'payment' && (
          <>
            <Field 
              label="Mode" 
              help="Payment type"
            >
              <select 
                value={data.mode} 
                onChange={(e) => handleChange('mode', e.target.value)} 
                className="input"
              >
                <option value="payment">One-time Payment</option>
                <option value="subscription">Subscription</option>
              </select>
            </Field>
            <Field 
              label="Product ID" 
              help="Stripe product identifier"
              required
            >
              <input 
                value={data.product_id || ''} 
                onChange={(e) => handleChange('product_id', e.target.value)} 
                className="input font-mono" 
                placeholder="prod_12345" 
              />
            </Field>
          </>
        )}

        {type === 'response' && (
          <>
            <Field 
              label="Status Code" 
              help="HTTP response status code"
            >
              <select 
                value={data.status_code || 200} 
                onChange={(e) => handleChange('status_code', parseInt(e.target.value))} 
                className="input"
              >
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="204">204 No Content</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Server Error</option>
              </select>
            </Field>
            <Field 
              label="Body Type" 
              help="Response data format"
            >
              <select 
                value={data.body || 'data'} 
                onChange={(e) => handleChange('body', e.target.value)} 
                className="input"
              >
                <option value="data">Data (from previous block)</option>
                <option value="message">Message (success)</option>
                <option value="error">Error</option>
                <option value="custom">Custom JSON</option>
              </select>
            </Field>
            {data.body === 'custom' && (
              <Field label="Custom JSON">
                <textarea 
                  value={data.custom_body || ''} 
                  onChange={(e) => handleChange('custom_body', e.target.value)} 
                  className="input resize-none font-mono text-xs" 
                  rows={4}
                  placeholder='{"success": true}' 
                />
              </Field>
            )}
          </>
        )}

        {type === 'schema' && (
          <>
            <Field 
              label="Model Name" 
              help="Database model name"
              required
            >
              <input 
                value={data.model || ''} 
                onChange={(e) => handleChange('model', e.target.value)} 
                className="input" 
                placeholder="User" 
              />
            </Field>
            
            <Field 
              label="Provider" 
              help="Database provider"
            >
              <select 
                value={data.provider || 'postgres'} 
                onChange={(e) => handleChange('provider', e.target.value)} 
                className="input"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="sqlite">SQLite</option>
              </select>
            </Field>

            <Field 
              label="Timestamps" 
              help="Auto-add createdAt/updatedAt fields"
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.timestamps !== false}
                  onChange={(e) => handleChange('timestamps', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-white/80">Include timestamps</span>
              </label>
            </Field>

            <div className="section-divider">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/90">Fields</span>
                <button
                  onClick={() => {
                    const fields = data.fields || [];
                    handleChange('fields', [...fields, { 
                      name: '', 
                      type: 'string', 
                      required: true, 
                      unique: false,
                      constraints: {} 
                    }]);
                  }}
                  className="btn btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>
              <div className="space-y-3">
                {(data.fields || []).map((field: any, index: number) => (
                  <div key={index} className="field-card">
                    <div className="field-row">
                      <input
                        value={field.name || ''}
                        onChange={(e) => {
                          const fields = [...(data.fields || [])];
                          fields[index] = { ...field, name: e.target.value };
                          handleChange('fields', fields);
                        }}
                        placeholder="Field name"
                        className="input text-xs"
                      />
                      <select
                        value={field.type || 'string'}
                        onChange={(e) => {
                          const fields = [...(data.fields || [])];
                          fields[index] = { ...field, type: e.target.value };
                          handleChange('fields', fields);
                        }}
                        className="input text-xs"
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="boolean">Boolean</option>
                        <option value="datetime">DateTime</option>
                        <option value="text">Text</option>
                        <option value="json">JSON</option>
                      </select>
                      <button
                        onClick={() => {
                          const fields = [...(data.fields || [])];
                          fields.splice(index, 1);
                          handleChange('fields', fields);
                        }}
                        className="field-delete-btn"
                        title="Remove field"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="checkbox-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={field.required !== false}
                          onChange={(e) => {
                            const fields = [...(data.fields || [])];
                            fields[index] = { ...field, required: e.target.checked };
                            handleChange('fields', fields);
                          }}
                          className="checkbox"
                        />
                        Required
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={field.unique === true}
                          onChange={(e) => {
                            const fields = [...(data.fields || [])];
                            fields[index] = { ...field, unique: e.target.checked };
                            handleChange('fields', fields);
                          }}
                          className="checkbox"
                        />
                        Unique
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {type === 'validation' && (
          <>
            <Field 
              label="Location" 
              help="Where to apply validation"
            >
              <select 
                value={data.location || 'body'} 
                onChange={(e) => handleChange('location', e.target.value)} 
                className="input"
              >
                <option value="body">Request Body</option>
                <option value="params">URL Parameters</option>
                <option value="query">Query String</option>
                <option value="headers">Headers</option>
              </select>
            </Field>

            <Field 
              label="Schema Reference" 
              help="Link to a schema node (optional)"
            >
              <input 
                value={data.schema_reference || ''} 
                onChange={(e) => handleChange('schema_reference', e.target.value)} 
                className="input font-mono text-xs" 
                placeholder="schema-node-id" 
              />
            </Field>

            <div className="section-divider">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/90">Fields</span>
                <button
                  onClick={() => {
                    const fields = data.fields || [];
                    handleChange('fields', [...fields, { 
                      name: '', 
                      type: 'string', 
                      optional: false,
                      rules: [{ type: 'required' }]
                    }]);
                  }}
                  className="btn btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>
              {(data.fields || []).map((field: any, index: number) => (
                <div key={index} className="field-card">
                  <div className="field-row">
                    <input
                      value={field.name || ''}
                      onChange={(e) => {
                        const fields = [...(data.fields || [])];
                        fields[index] = { ...field, name: e.target.value };
                        handleChange('fields', fields);
                      }}
                      placeholder="Field name"
                      className="input text-xs"
                    />
                    <select
                      value={field.type || 'string'}
                      onChange={(e) => {
                        const fields = [...(data.fields || [])];
                        fields[index] = { ...field, type: e.target.value };
                        handleChange('fields', fields);
                      }}
                      className="input text-xs"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="uuid">UUID</option>
                    </select>
                    <button
                      onClick={() => {
                        const fields = [...(data.fields || [])];
                        fields.splice(index, 1);
                        handleChange('fields', fields);
                      }}
                      className="field-delete-btn"
                      title="Remove field"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={field.optional === true}
                      onChange={(e) => {
                        const fields = [...(data.fields || [])];
                        fields[index] = { ...field, optional: e.target.checked };
                        handleChange('fields', fields);
                      }}
                      className="checkbox"
                    />
                    Optional
                  </label>

                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Rules</span>
                      <button
                        onClick={() => {
                          const fields = [...(data.fields || [])];
                          const rules = field.rules || [];
                          fields[index] = { 
                            ...field, 
                            rules: [...rules, { type: 'min', value: '1' }]
                          };
                          handleChange('fields', fields);
                        }}
                        className="btn btn-success text-xs px-1.5 py-0.5"
                      >
                        +
                      </button>
                    </div>
                    {(field.rules || []).map((rule: any, ruleIndex: number) => (
                      <div key={ruleIndex} className="field-row">
                        <select
                          value={rule.type || 'required'}
                          onChange={(e) => {
                            const fields = [...(data.fields || [])];
                            const rules = [...(field.rules || [])];
                            rules[ruleIndex] = { ...rule, type: e.target.value };
                            fields[index] = { ...field, rules };
                            handleChange('fields', fields);
                          }}
                          className="input text-xs"
                        >
                          <option value="required">Required</option>
                          <option value="min">Min Length</option>
                          <option value="max">Max Length</option>
                          <option value="pattern">Regex Pattern</option>
                        </select>
                        {rule.type !== 'required' && (
                          <input
                            value={rule.value || ''}
                            onChange={(e) => {
                              const fields = [...(data.fields || [])];
                              const rules = [...(field.rules || [])];
                              rules[ruleIndex] = { ...rule, value: e.target.value };
                              fields[index] = { ...field, rules };
                              handleChange('fields', fields);
                            }}
                            placeholder="Value"
                            className="input text-xs"
                          />
                        )}
                        <button
                          onClick={() => {
                            const fields = [...(data.fields || [])];
                            const rules = [...(field.rules || [])];
                            rules.splice(ruleIndex, 1);
                            fields[index] = { ...field, rules };
                            handleChange('fields', fields);
                          }}
                          className="field-delete-btn"
                          title="Remove rule"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {type === 'error_handler' && (
          <>
            <Field 
              label="Strategy" 
              help="Error handling strategy"
            >
              <select 
                value={data.strategy || 'global'} 
                onChange={(e) => handleChange('strategy', e.target.value)} 
                className="input"
              >
                <option value="global">Global Handler</option>
                <option value="route_specific">Route Specific</option>
                <option value="middleware">Middleware Based</option>
              </select>
            </Field>

            <Field 
              label="Response Format" 
              help="Error response structure"
            >
              <select 
                value={data.error_response_format || 'standard'} 
                onChange={(e) => handleChange('error_response_format', e.target.value)} 
                className="input"
              >
                <option value="standard">Standard</option>
                <option value="json_api">JSON:API</option>
                <option value="custom">Custom</option>
              </select>
            </Field>

            <Field 
              label="Fallback Message" 
              help="Default error message"
            >
              <input 
                value={data.fallback_message || ''} 
                onChange={(e) => handleChange('fallback_message', e.target.value)} 
                className="input" 
                placeholder="An error occurred" 
              />
            </Field>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.log_errors !== false}
                  onChange={(e) => handleChange('log_errors', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-white/80">Log errors</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.include_stack_trace === true}
                  onChange={(e) => handleChange('include_stack_trace', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-white/80">Include stack trace (dev only)</span>
              </label>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/80">Custom Errors</span>
                <button
                  onClick={() => {
                    const errors = data.custom_errors || [];
                    handleChange('custom_errors', [...errors, { 
                      name: '', 
                      status_code: 400, 
                      message_template: '',
                      log_level: 'error'
                    }]);
                  }}
                  className="btn btn-danger text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Error Type
                </button>
              </div>
              {(data.custom_errors || []).map((error: any, index: number) => (
                <div key={index} className="field-card">
                  <div className="field-row">
                    <input
                      value={error.name || ''}
                      onChange={(e) => {
                        const errors = [...(data.custom_errors || [])];
                        errors[index] = { ...error, name: e.target.value };
                        handleChange('custom_errors', errors);
                      }}
                      placeholder="Error name"
                      className="input text-xs"
                    />
                    <input
                      type="number"
                      value={error.status_code || 400}
                      onChange={(e) => {
                        const errors = [...(data.custom_errors || [])];
                        errors[index] = { ...error, status_code: parseInt(e.target.value) };
                        handleChange('custom_errors', errors);
                      }}
                      placeholder="Status"
                      className="input text-xs w-16"
                      min="100"
                      max="599"
                    />
                    <button
                      onClick={() => {
                        const errors = [...(data.custom_errors || [])];
                        errors.splice(index, 1);
                        handleChange('custom_errors', errors);
                      }}
                      className="field-delete-btn"
                      title="Remove error type"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <input
                    value={error.message_template || ''}
                    onChange={(e) => {
                      const errors = [...(data.custom_errors || [])];
                      errors[index] = { ...error, message_template: e.target.value };
                      handleChange('custom_errors', errors);
                    }}
                    placeholder="Message template"
                    className="input text-xs"
                  />

                  <select
                    value={error.log_level || 'error'}
                    onChange={(e) => {
                      const errors = [...(data.custom_errors || [])];
                      errors[index] = { ...error, log_level: e.target.value };
                      handleChange('custom_errors', errors);
                    }}
                    className="input text-xs"
                  >
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {type === 'response_schema' && (
          <>
            <Field 
              label="Schema Name" 
              help="Name for this response schema"
              required
            >
              <input 
                value={data.name || ''} 
                onChange={(e) => handleChange('name', e.target.value)} 
                className="input" 
                placeholder="SuccessResponse" 
              />
            </Field>

            <Field 
              label="Format" 
              help="Response structure format"
            >
              <select 
                value={data.format || 'standard'} 
                onChange={(e) => handleChange('format', e.target.value)} 
                className="input"
              >
                <option value="standard">Standard</option>
                <option value="envelope">Envelope (with meta)</option>
                <option value="raw">Raw Data</option>
                <option value="paginated">Paginated</option>
              </select>
            </Field>

            <Field 
              label="Content Type" 
              help="Response content type"
            >
              <select 
                value={data.content_type || 'application/json'} 
                onChange={(e) => handleChange('content_type', e.target.value)} 
                className="input"
              >
                <option value="application/json">JSON</option>
                <option value="text/plain">Plain Text</option>
                <option value="text/html">HTML</option>
              </select>
            </Field>

            <Field 
              label="Status Codes" 
              help="Supported HTTP status codes"
            >
              <div className="space-y-1">
                {(data.status_codes || [200]).map((code: number, index: number) => (
                  <div key={index} className="flex gap-1">
                    <select
                      value={code}
                      onChange={(e) => {
                        const codes = [...(data.status_codes || [200])];
                        codes[index] = parseInt(e.target.value);
                        handleChange('status_codes', codes);
                      }}
                      className="input text-xs flex-1"
                    >
                      <option value="200">200 OK</option>
                      <option value="201">201 Created</option>
                      <option value="204">204 No Content</option>
                      <option value="400">400 Bad Request</option>
                      <option value="401">401 Unauthorized</option>
                      <option value="404">404 Not Found</option>
                      <option value="500">500 Server Error</option>
                    </select>
                    <button
                      onClick={() => {
                        const codes = [...(data.status_codes || [200])];
                        codes.splice(index, 1);
                        if (codes.length === 0) codes.push(200); // Keep at least one
                        handleChange('status_codes', codes);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs px-1"
                      disabled={(data.status_codes || [200]).length <= 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const codes = [...(data.status_codes || [200])];
                    codes.push(200);
                    handleChange('status_codes', codes);
                  }}
                  className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 w-full"
                >
                  Add Status Code
                </button>
              </div>
            </Field>

            <Field 
              label="Cache Control" 
              help="HTTP cache control header"
            >
              <select 
                value={data.cache_control || ''} 
                onChange={(e) => handleChange('cache_control', e.target.value)} 
                className="input"
              >
                <option value="">No Caching</option>
                <option value="no-cache">No Cache</option>
                <option value="max-age=300">5 minutes</option>
                <option value="max-age=3600">1 hour</option>
                <option value="max-age=86400">1 day</option>
              </select>
            </Field>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.include_metadata !== false}
                  onChange={(e) => handleChange('include_metadata', e.target.checked)}
                  className="checkbox"
                />
                <span className="text-white/80">Include metadata (timestamp, etc.)</span>
              </label>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/80">Response Fields</span>
                <button
                  onClick={() => {
                    const fields = data.fields || [];
                    handleChange('fields', [...fields, { 
                      name: '', 
                      type: 'string', 
                      description: '',
                      example: '',
                      required: true
                    }]);
                  }}
                  className="btn btn-primary text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>
              {(data.fields || []).map((field: any, index: number) => (
                <div key={index} className="field-card">
                  <div className="field-row">
                    <input
                      value={field.name || ''}
                      onChange={(e) => {
                        const fields = [...(data.fields || [])];
                        fields[index] = { ...field, name: e.target.value };
                        handleChange('fields', fields);
                      }}
                      placeholder="Field name"
                      className="input text-xs"
                    />
                    <select
                      value={field.type || 'string'}
                      onChange={(e) => {
                        const fields = [...(data.fields || [])];
                        fields[index] = { ...field, type: e.target.value };
                        handleChange('fields', fields);
                      }}
                      className="input text-xs"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                      <option value="null">Null</option>
                    </select>
                    <button
                      onClick={() => {
                        const fields = [...(data.fields || [])];
                        fields.splice(index, 1);
                        handleChange('fields', fields);
                      }}
                      className="field-delete-btn"
                      title="Remove field"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <input
                    value={field.description || ''}
                    onChange={(e) => {
                      const fields = [...(data.fields || [])];
                      fields[index] = { ...field, description: e.target.value };
                      handleChange('fields', fields);
                    }}
                    placeholder="Description"
                    className="input text-xs"
                  />
                  
                  <input
                    value={field.example || ''}
                    onChange={(e) => {
                      const fields = [...(data.fields || [])];
                      fields[index] = { ...field, example: e.target.value };
                      handleChange('fields', fields);
                    }}
                    placeholder="Example value"
                    className="input text-xs"
                  />
                  
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={field.required !== false}
                      onChange={(e) => {
                        const fields = [...(data.fields || [])];
                        fields[index] = { ...field, required: e.target.checked };
                        handleChange('fields', fields);
                      }}
                      className="checkbox"
                    />
                    Required
                  </label>
                </div>

               ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Button */}
      <div className="p-5 border-t border-[#1c2028] bg-[#0c0e14]">
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 px-4 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Block
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-white/70 text-center mb-3">
              Delete this block?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-3 rounded-lg border border-white/10 text-white/70 text-xs font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Field component with help text and required indicator
function Field({ 
  label, 
  help, 
  required, 
  children 
}: { 
  label: string; 
  help?: string; 
  required?: boolean; 
  children: React.ReactNode;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="field-container">
      <div className="flex items-center justify-between">
        <label className={`field-label ${required ? 'field-required' : ''}`}>
          {label}
        </label>
        {help && (
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-white/30 hover:text-white/60 transition-colors p-1 rounded hover:bg-white/5"
            title="Show help"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {showHelp && help && (
        <div className="field-help bg-blue-500/10 border border-blue-500/20 p-2 rounded text-blue-300">
          {help}
        </div>
      )}
      
      <div className="[&>input]:input [&>select]:input [&>textarea]:input [&>select]:cursor-pointer">
        {children}
      </div>
    </div>
  );
}
