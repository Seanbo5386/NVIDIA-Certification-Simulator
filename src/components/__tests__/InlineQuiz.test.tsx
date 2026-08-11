import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { InlineQuiz } from "../InlineQuiz";

const mockQuiz = {
  question: "What does SEL stand for?",
  options: [
    "System Event Log",
    "Serial Error Log",
    "Sensor Entry List",
    "Server Event Ledger",
  ],
  correctIndex: 0,
  explanation: "SEL = System Event Log.",
};

describe("InlineQuiz", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the question", () => {
    render(<InlineQuiz quiz={mockQuiz} onComplete={vi.fn()} />);
    expect(screen.getByText(/what does sel stand for/i)).toBeInTheDocument();
  });

  it("should render all 4 options", () => {
    render(<InlineQuiz quiz={mockQuiz} onComplete={vi.fn()} />);
    expect(screen.getByText("System Event Log")).toBeInTheDocument();
    expect(screen.getByText("Serial Error Log")).toBeInTheDocument();
    expect(screen.getByText("Sensor Entry List")).toBeInTheDocument();
    expect(screen.getByText("Server Event Ledger")).toBeInTheDocument();
  });

  it("should show correct feedback on right answer", () => {
    render(<InlineQuiz quiz={mockQuiz} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("System Event Log"));
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText(/SEL = System Event Log/i)).toBeInTheDocument();
  });

  it("should show incorrect feedback on wrong answer", () => {
    render(<InlineQuiz quiz={mockQuiz} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("Serial Error Log"));
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
  });

  it("should keep the explanation on screen instead of advancing on a timer", () => {
    const onComplete = vi.fn();
    render(<InlineQuiz quiz={mockQuiz} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("System Event Log"));

    // No timer may advance the step out from under the reader.
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/SEL = System Event Log/i)).toBeInTheDocument();
  });

  it("should call onComplete with true when Continue is clicked after a right answer", () => {
    const onComplete = vi.fn();
    render(<InlineQuiz quiz={mockQuiz} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("System Event Log"));
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("quiz-continue"));
    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it("should call onComplete with false when Continue is clicked after a wrong answer", () => {
    const onComplete = vi.fn();
    render(<InlineQuiz quiz={mockQuiz} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("Serial Error Log"));
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("quiz-continue"));
    expect(onComplete).toHaveBeenCalledWith(false);
  });

  it("should not render Continue until an option is chosen", () => {
    render(<InlineQuiz quiz={mockQuiz} onComplete={vi.fn()} />);
    expect(screen.queryByTestId("quiz-continue")).not.toBeInTheDocument();
  });

  it("should disable option buttons after answering but leave Continue clickable", () => {
    render(<InlineQuiz quiz={mockQuiz} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("System Event Log"));

    mockQuiz.options.forEach((option) => {
      expect(screen.getByText(option).closest("button")).toBeDisabled();
    });
    expect(screen.getByTestId("quiz-continue")).toBeEnabled();
  });

  it("substitutes hardware placeholders in question, options, and explanation", () => {
    // Default systemType in simulationStore is DGX-A100 → NVLINK_LABEL="NV12",
    // NVLINK_LINKS_PER_GPU="12".
    const placeholderQuiz = {
      question: "What does '{{NVLINK_LABEL}}' indicate?",
      options: [
        "{{NVLINK_LINKS_PER_GPU}} NVLink connections",
        "Unrelated answer",
        "Another unrelated answer",
        "Final unrelated answer",
      ],
      correctIndex: 0,
      explanation:
        "{{NVLINK_LABEL}} indicates {{NVLINK_LINKS_PER_GPU}} NVLink connections.",
    };
    render(<InlineQuiz quiz={placeholderQuiz} onComplete={vi.fn()} />);
    expect(
      screen.getByText(/what does 'NV12' indicate\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText("12 NVLink connections")).toBeInTheDocument();
    // Trigger feedback to render the explanation
    fireEvent.click(screen.getByText("12 NVLink connections"));
    expect(
      screen.getByText(/NV12 indicates 12 NVLink connections/i),
    ).toBeInTheDocument();
  });
});
