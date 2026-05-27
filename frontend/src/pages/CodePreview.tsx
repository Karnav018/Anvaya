import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clipboard, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FileTree } from '../components/codepreview/FileTree';

const CodeViewer = lazy(() => import('../components/codepreview/CodeViewer'));

interface GenerateJsonResponse {
  language: string;
  project_slug: string;
  files: Record<string, string>;
}

interface LocationState {
  files?: Record<string, string>;
  projectSlug?: string;
}

export default function CodePreview() {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = (location.state ?? null) as LocationState | null;

  const [files, setFiles] = useState<Record<string, string> | null>(
    initialState?.files ?? null
  );
  const [projectSlug, setProjectSlug] = useState<string>(initialState?.projectSlug ?? '');
  const [activePath, setActivePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fileKeys = useMemo(() => (files ? Object.keys(files).sort() : []), [files]);

  // Auto-select first file when files load
  useEffect(() => {
    if (!activePath && fileKeys.length > 0) {
      setActivePath(fileKeys[0]);
    }
  }, [fileKeys, activePath]);

  // Fall back to fetching if state is missing (deep link / refresh)
  useEffect(() => {
    if (files || !orgSlug || !projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.post<GenerateJsonResponse>(
          `/o/${orgSlug}/generate/${projectId}?format=json`,
          {}
        );
        if (cancelled) return;
        setFiles(data.files);
        setProjectSlug(data.project_slug);
      } catch {
        // toast handled
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, projectId]);

  const handleBack = () => {
    if (orgSlug && projectId) {
      navigate(`/o/${orgSlug}/editor/${projectId}`);
    } else {
      navigate(-1);
    }
  };

  const handleCopy = async () => {
    if (!activePath || !files) return;
    const content = files[activePath] ?? '';
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleDownload = async () => {
    if (!orgSlug || !projectId) return;
    setDownloading(true);
    try {
      const response = await api.post(
        `/o/${orgSlug}/generate/${projectId}?format=zip`,
        {},
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = projectSlug
        ? `${projectSlug}-server.zip`
        : `anvaya_backend_${projectId.substring(0, 8)}.zip`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      // toast handled
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!orgSlug || !projectId) return;
    setRegenerating(true);
    try {
      const { data } = await api.post<GenerateJsonResponse>(
        `/o/${orgSlug}/generate/${projectId}?format=json`,
        {}
      );
      setFiles(data.files);
      setProjectSlug(data.project_slug);
      setActivePath(null); // will auto-select first
      toast.success('Regenerated');
    } catch {
      // toast handled
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!files) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6">
        <p className="text-white/60 text-sm mb-4">No generated code to preview.</p>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm transition-colors"
        >
          Back to canvas
        </button>
      </div>
    );
  }

  const activeContent = activePath && files[activePath] ? files[activePath] : '';

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-white overflow-hidden">
      {/* Top toolbar */}
      <header className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-border bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to canvas
          </button>
          {projectSlug && (
            <span className="ml-2 text-xs text-white/40">/ {projectSlug}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!activePath}
            title="Copy current file"
            className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <Clipboard className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Building...' : 'Download .zip'}
          </button>
        </div>
      </header>

      {/* Split panels */}
      <div className="flex-1 flex min-h-0">
        <aside className="w-[260px] shrink-0 border-r border-border bg-surface/30 overflow-y-auto block-scrollbar">
          <FileTree files={files} activePath={activePath} onSelect={setActivePath} />
        </aside>

        <main className="flex-1 min-w-0 relative">
          {activePath ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-600 border-t-[#a3a6ff]" />
                </div>
              }
            >
              <CodeViewer path={activePath} content={activeContent} />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              Select a file from the tree
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
