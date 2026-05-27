import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from 'lucide-react';

interface FileTreeProps {
  files: Record<string, string>;
  activePath: string | null;
  onSelect: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string; // full path
  isFile: boolean;
  children: TreeNode[];
}

function buildTree(files: Record<string, string>): TreeNode {
  const root: TreeNode = { name: '', path: '', isFile: false, children: [] };

  const paths = Object.keys(files).sort();
  for (const fullPath of paths) {
    const parts = fullPath.split('/').filter(Boolean);
    let current = root;
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const childPath = parts.slice(0, idx + 1).join('/');
      let next = current.children.find((c) => c.name === part);
      if (!next) {
        next = {
          name: part,
          path: childPath,
          isFile: isLast,
          children: [],
        };
        current.children.push(next);
      }
      current = next;
    });
  }

  // Sort: folders first, then files; alphabetical within group
  const sortNode = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  onSelect: (path: string) => void;
  initialOpen: boolean;
}

function TreeItem({ node, depth, activePath, onSelect, initialOpen }: TreeItemProps) {
  const [open, setOpen] = useState(initialOpen);
  const isActive = activePath === node.path;

  if (node.isFile) {
    return (
      <button
        type="button"
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left text-[13px] transition-colors ${
          isActive
            ? 'bg-primary/20 text-primary'
            : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.path}
      >
        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-white/40'}`} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1 px-2 py-1 rounded-md text-left text-[13px] text-white/80 hover:bg-white/5 hover:text-white transition-colors"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {open ? (
          <ChevronDown className="w-3 h-3 shrink-0 text-white/40" />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0 text-white/40" />
        )}
        {open ? (
          <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#a3a6ff]" />
        ) : (
          <Folder className="w-3.5 h-3.5 shrink-0 text-[#a3a6ff]" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
              initialOpen={depth < 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, activePath, onSelect }: FileTreeProps) {
  const root = useMemo(() => buildTree(files), [files]);

  if (root.children.length === 0) {
    return <div className="p-4 text-xs text-white/40">No files</div>;
  }

  return (
    <div className="py-2">
      {root.children.map((child) => (
        <TreeItem
          key={child.path}
          node={child}
          depth={0}
          activePath={activePath}
          onSelect={onSelect}
          initialOpen
        />
      ))}
    </div>
  );
}
