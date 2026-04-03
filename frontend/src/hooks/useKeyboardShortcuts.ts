import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: KeyHandler;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keyboard shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true' ||
        // Also check if any input has focus (additional safety)
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      )) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Utility hook for common shortcuts
export function useCommonShortcuts({
  onSave,
  onUndo,
  onRedo,
  onDelete,
  onEscape,
}: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
}) {
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      handler: () => onSave?.(),
      description: 'Save',
    },
    {
      key: 'z',
      ctrl: true,
      handler: () => onUndo?.(),
      description: 'Undo',
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => onRedo?.(),
      description: 'Redo',
    },
    {
      key: 'Delete',
      handler: () => onDelete?.(),
      description: 'Delete selected',
    },
    {
      key: 'Backspace',
      handler: () => onDelete?.(),
      description: 'Delete selected',
    },
    {
      key: 'Escape',
      handler: () => onEscape?.(),
      description: 'Cancel/Close',
    },
  ]);
}
