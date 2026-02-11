import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SpotlightTour } from "../SpotlightTour";
import type { TourStep } from "../../data/tourSteps";

// Mock useReducedMotion
vi.mock("../../hooks/useReducedMotion", () => ({
  useReducedMotion: vi.fn(() => true), // true = skip transitions in tests
  default: vi.fn(() => true),
}));

// Mock useFocusTrap
vi.mock("../../hooks/useFocusTrap", () => ({
  useFocusTrap: vi.fn(),
  default: vi.fn(),
}));

// Mock ResizeObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal(
  "ResizeObserver",
  vi.fn(() => ({
    observe: mockObserve,
    unobserve: vi.fn(),
    disconnect: mockDisconnect,
  })),
);

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockSteps: TourStep[] = [
  {
    selector: '[data-tour="step-one"]',
    title: "First Step",
    description: "Description for step one.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="step-two"]',
    title: "Second Step",
    description: "Description for step two.",
    placement: "right",
  },
  {
    selector: '[data-tour="step-three"]',
    title: "Third Step",
    description: "Description for step three.",
    placement: "left",
  },
];

describe("SpotlightTour", () => {
  let onComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onComplete = vi.fn();

    // Create target elements in the DOM
    for (const step of mockSteps) {
      const el = document.createElement("div");
      const attr = step.selector.match(/data-tour="([^"]+)"/)?.[1];
      if (attr) el.setAttribute("data-tour", attr);
      // Mock getBoundingClientRect
      el.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        left: 100,
        width: 200,
        height: 50,
        right: 300,
        bottom: 150,
        x: 100,
        y: 100,
        toJSON: () => {},
      }));
      document.body.appendChild(el);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up DOM elements
    document.body.innerHTML = "";
  });

  it("renders the tour dialog", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("spotlight-tour")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("displays the first step on mount", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("Description for step one.")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("shows Next button for non-last steps", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("tour-next-btn")).toHaveTextContent("Next");
  });

  it("advances to next step when Next is clicked", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByTestId("tour-next-btn"));
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Second Step")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("shows Finish on the last step and calls onComplete", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Navigate to last step
    fireEvent.click(screen.getByTestId("tour-next-btn"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByTestId("tour-next-btn"));
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("tour-next-btn")).toHaveTextContent("Finish");

    fireEvent.click(screen.getByTestId("tour-next-btn"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("Skip button calls onComplete", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByTestId("tour-skip-btn"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls scrollIntoView for each step", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("renders cutout overlay when target is found", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("spotlight-cutout")).toBeInTheDocument();
  });

  it("skips step when target element is missing", () => {
    // Remove the second step's target
    const el = document.querySelector('[data-tour="step-two"]');
    el?.remove();

    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Click Next from step 1 → goes to step 2 (missing target)
    fireEvent.click(screen.getByTestId("tour-next-btn"));
    // Advance past step-change delay (0ms for reduced motion) + skip timeout (100ms) + next step settle
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // Advance again to let the skipped step's successor settle
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should skip step 2 and show step 3
    expect(screen.getByText("Third Step")).toBeInTheDocument();
  });

  it("has aria-modal and aria-label for accessibility", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Guided tour");
  });

  it("uses no transitions when reduced motion is preferred", () => {
    render(<SpotlightTour steps={mockSteps} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const cutout = screen.getByTestId("spotlight-cutout");
    expect(cutout.style.transition).toBe("none");
  });
});
