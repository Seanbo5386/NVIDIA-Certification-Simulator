import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => {
  const mk = (n: string) => {
    const C = () => null;
    C.displayName = n;
    return C;
  };
  return { AlertTriangle: mk("AlertTriangle") };
});

import { ConfirmModal } from "../ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    open: true,
    message: "Are you sure?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders nothing when open is false", () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} open={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the message when open", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("uses default button labels", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByTestId("confirm-modal-confirm")).toHaveTextContent(
      "Confirm",
    );
    expect(screen.getByTestId("confirm-modal-cancel")).toHaveTextContent(
      "Cancel",
    );
  });

  it("uses custom button labels", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Abort Mission"
        cancelLabel="Keep Going"
      />,
    );
    expect(screen.getByTestId("confirm-modal-confirm")).toHaveTextContent(
      "Abort Mission",
    );
    expect(screen.getByTestId("confirm-modal-cancel")).toHaveTextContent(
      "Keep Going",
    );
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId("confirm-modal-confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId("confirm-modal-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId("confirm-modal-backdrop"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not propagate clicks on the dialog body to the backdrop", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("has correct aria attributes", () => {
    render(<ConfirmModal {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-modal-title");
  });
});
