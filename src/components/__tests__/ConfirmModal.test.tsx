import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const mk = (n: string) => {
    const C = () => null;
    C.displayName = n;
    return C;
  };
  return {
    AlertTriangle: mk("AlertTriangle"),
  };
});

// Mock useFocusTrap
vi.mock("../../hooks/useFocusTrap", () => ({
  useFocusTrap: vi.fn(),
}));

import { ConfirmModal } from "../ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    isOpen: true,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
  });

  it("renders title and message when open", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
  });

  it("renders default button labels", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders custom button labels", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Abort"
        cancelLabel="Continue Mission"
      />,
    );
    expect(screen.getByText("Abort")).toBeInTheDocument();
    expect(screen.getByText("Continue Mission")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when backdrop is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("confirm-modal-backdrop"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when modal content is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it("has correct ARIA attributes", () => {
    render(<ConfirmModal {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-modal-title");
  });
});
