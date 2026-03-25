import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, { isActive: isOpen, onEscape: onCancel });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      data-testid="confirm-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={modalRef}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h2 id="confirm-modal-title" className="text-white font-semibold">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-300">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-black bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
