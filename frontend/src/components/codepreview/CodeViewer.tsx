import Editor from '@monaco-editor/react';

interface CodeViewerProps {
  path: string;
  content: string;
}

function detectLanguage(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.ts')) return 'typescript';
  if (lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'shell';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.dockerfile') || lower.endsWith('dockerfile')) return 'dockerfile';
  // .env, .env.example, .gitignore — treat as plaintext
  if (lower.endsWith('.env') || lower.includes('.env.') || lower.endsWith('.gitignore')) {
    return 'plaintext';
  }
  return 'plaintext';
}

export default function CodeViewer({ path, content }: CodeViewerProps) {
  const language = detectLanguage(path);

  return (
    <Editor
      height="100%"
      width="100%"
      theme="vs-dark"
      path={path}
      language={language}
      value={content}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderLineHighlight: 'line',
        smoothScrolling: true,
        automaticLayout: true,
      }}
      loading={
        <div className="flex items-center justify-center h-full text-white/40 text-sm">
          Loading editor...
        </div>
      }
    />
  );
}
