import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockState = {
  examAttempts: [{ percentage: 80 }, { percentage: 60 }],
  gauntletAttempts: [
    { timestamp: 1000, score: 7, totalQuestions: 10, timeSpentSeconds: 600 },
  ],
  currentStreak: 3,
  totalStudyTimeSeconds: 7200,
  getReadinessScore: () => 72,
};

vi.mock("../../../store/learningStore", () => ({
  useLearningStore: vi.fn((selector?: (s: typeof mockState) => unknown) =>
    selector ? selector(mockState) : mockState,
  ),
}));

const mockProgressState = {
  familyQuizScores: {},
  masteryQuizScores: {},
};

vi.mock("../../../store/learningProgressStore", () => ({
  useLearningProgressStore: vi.fn(
    (selector?: (s: typeof mockProgressState) => unknown) =>
      selector ? selector(mockProgressState) : mockProgressState,
  ),
}));

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  const stub = (props: Record<string, unknown>) => <svg {...props} />;
  return {
    ...actual,
    GraduationCap: stub,
    BarChart3: stub,
    CheckCircle: stub,
    Flame: stub,
    Clock: stub,
  };
});

import { ExamReadinessHero } from "../ExamReadinessHero";

describe("ExamReadinessHero", () => {
  it("renders readiness score with correct color class (green for >=70)", () => {
    render(<ExamReadinessHero />);
    const scoreEl = screen.getByTestId("readiness-score");
    expect(scoreEl.textContent).toBe("72");
    expect(scoreEl.className).toContain("text-green-400");
  });

  it("shows all 5 stat chips", () => {
    render(<ExamReadinessHero />);
    expect(screen.getByText("Exams Taken")).toBeInTheDocument();
    expect(screen.getByText("Avg Score")).toBeInTheDocument();
    expect(screen.getByText("Pass Rate")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("Study Time")).toBeInTheDocument();
  });

  it("computes correct stat values", () => {
    render(<ExamReadinessHero />);
    // 2 exams + 1 gauntlet = 3 total
    expect(screen.getByText("3")).toBeInTheDocument();
    // avg of (80 + 60 + 70) / 3 = 70%
    expect(screen.getByText("70%")).toBeInTheDocument();
    // 2 of 3 >= 70% (80, 70 pass; 60 fails) = 67%
    expect(screen.getByText("67%")).toBeInTheDocument();
    // streak
    expect(screen.getByText("3d")).toBeInTheDocument();
    // 7200s = 2h 0m
    expect(screen.getByText("2h 0m")).toBeInTheDocument();
  });
});
