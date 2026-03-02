import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MissionInstructionPanel,
  type MissionInstructionPanelProps,
} from "../MissionInstructionPanel";

// Mock InlineQuiz
vi.mock("../InlineQuiz", () => ({
  InlineQuiz: ({ onComplete }: { onComplete: (c: boolean) => void }) => (
    <div data-testid="inline-quiz">
      <button onClick={() => onComplete(true)}>Answer Quiz</button>
    </div>
  ),
}));

// Mock commandValidator
vi.mock("@/utils/commandValidator", () => ({
  validateCommandExecuted: (executed: string, expected: string[]) =>
    expected.some((e) => executed.includes(e)),
}));

const defaultProps: MissionInstructionPanelProps = {
  missionTitle: "The Midnight Deployment",
  tier: 1,
  currentStepIndex: 1,
  totalSteps: 5,
  currentStep: {
    id: "step-2",
    situation:
      "GPU 3 is showing degraded performance with rising temperatures.",
    task: "Run DCGM diagnostics to identify the root cause.",
    expectedCommands: ["dcgmi diag -r 1", "nvidia-smi -q -d TEMPERATURE"],
    objectives: ["Run diagnostic level 1", "Check GPU temperatures"],
    hints: ["Try running dcgmi diag first", "Look at the ECC error counts"],
  },
  commandsExecuted: ["dcgmi diag -r 1"],
  objectivesPassed: [true, false],
  isStepCompleted: false,
  onPasteCommand: vi.fn(),
  onNextStep: vi.fn(),
  onContinue: vi.fn(),
  onRevealHint: vi.fn(),
  availableHintCount: 2,
  revealedHintCount: 0,
  revealedHints: [],
  onQuizComplete: vi.fn(),
};

describe("MissionInstructionPanel", () => {
  it("renders the situation text in full", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(
      screen.getByText(
        "GPU 3 is showing degraded performance with rising temperatures.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the task text in full", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(
      screen.getByText("Run DCGM diagnostics to identify the root cause."),
    ).toBeInTheDocument();
  });

  it("renders command chips", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(screen.getByText("dcgmi diag -r 1")).toBeInTheDocument();
    expect(
      screen.getByText("nvidia-smi -q -d TEMPERATURE"),
    ).toBeInTheDocument();
  });

  it("marks executed commands with line-through styling", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    const chip = screen.getByText("dcgmi diag -r 1").closest("button");
    expect(chip?.className).toContain("line-through");
  });

  it("calls onPasteCommand when unexecuted command chip is clicked", () => {
    const onPaste = vi.fn();
    render(
      <MissionInstructionPanel {...defaultProps} onPasteCommand={onPaste} />,
    );
    fireEvent.click(screen.getByText("nvidia-smi -q -d TEMPERATURE"));
    expect(onPaste).toHaveBeenCalledWith("nvidia-smi -q -d TEMPERATURE");
  });

  it("renders objectives with pass/fail indicators", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(screen.getByText("Run diagnostic level 1")).toBeInTheDocument();
    expect(screen.getByText("Check GPU temperatures")).toBeInTheDocument();
  });

  it("renders step counter", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
  });

  it("shows Next button when step is completed", () => {
    render(
      <MissionInstructionPanel {...defaultProps} isStepCompleted={true} />,
    );
    expect(screen.getByRole("button", { name: /Next/ })).toBeInTheDocument();
  });

  it("does not show Next button when step is not completed", () => {
    render(
      <MissionInstructionPanel {...defaultProps} isStepCompleted={false} />,
    );
    expect(
      screen.queryByRole("button", { name: /Next/ }),
    ).not.toBeInTheDocument();
  });

  it('shows "Finish" instead of "Next" on last step', () => {
    render(
      <MissionInstructionPanel
        {...defaultProps}
        isStepCompleted={true}
        currentStepIndex={4}
        totalSteps={5}
      />,
    );
    expect(screen.getByRole("button", { name: /Finish/ })).toBeInTheDocument();
  });

  it("renders hint button with count", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(screen.getByText(/Hint/)).toBeInTheDocument();
    expect(screen.getByText(/0\/2/)).toBeInTheDocument();
  });

  it("renders panel container with data-testid", () => {
    render(<MissionInstructionPanel {...defaultProps} />);
    expect(screen.getByTestId("mission-instruction-panel")).toBeInTheDocument();
  });
});
