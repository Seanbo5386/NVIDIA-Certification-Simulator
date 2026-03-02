import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TerminalDemo } from "../TerminalDemo";

describe("TerminalDemo", () => {
  it("renders the terminal container", () => {
    render(<TerminalDemo />);
    expect(screen.getByTestId("terminal-demo")).toBeInTheDocument();
  });

  it("renders terminal title bar", () => {
    render(<TerminalDemo />);
    expect(screen.getByText(/terminal/i)).toBeInTheDocument();
  });

  it("renders without crashing when unmounted quickly", () => {
    const { unmount } = render(<TerminalDemo />);
    unmount(); // Should clean up timeouts without errors
  });
});
