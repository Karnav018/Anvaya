import { X } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from './Spinner';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-border/50">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-white/40 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-white/70 text-sm leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-70 ${
                isDestructive 
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLoading && <Spinner className="h-4 w-4" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
