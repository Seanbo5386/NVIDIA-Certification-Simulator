/**
 * ConfirmModal
 *
 * A themed confirmation dialog that replaces native window.confirm().
 * Styled to match the application's dark theme and supports Escape to cancel.
 */

import { useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** The confirmation message to display */
  message: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels or presses Escape */
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onCancel}
      data-testid="confirm-modal-backdrop"
    >
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-yellow-900/30 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <p
            id="confirm-modal-title"
            className="text-gray-200 text-sm leading-relaxed pt-1"
          >
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            data-testid="confirm-modal-cancel"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
            data-testid="confirm-modal-confirm"
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
