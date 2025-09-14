import { useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import './AlertDialog.css';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  onClose
}: AlertDialogProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <div className="alert-dialog-backdrop" onClick={handleBackdropClick}>
      <div className="alert-dialog">
        <div className="alert-dialog-header">
          <h3 className="alert-dialog-title">{title}</h3>
        </div>
        
        <div className="alert-dialog-content">
          <p className="alert-dialog-message">{message}</p>
        </div>
        
        <div className="alert-dialog-footer">
          <button
            className="btn-secondary"
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn-primary ${variant === 'destructive' ? 'btn-destructive' : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}