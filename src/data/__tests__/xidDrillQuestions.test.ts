import { describe, it, expect } from "vitest";
import { xidDrillQuestions } from "../xidDrillQuestions";

describe("xidDrillQuestions", () => {
  it("should have no duplicate IDs", () => {
    const ids = xidDrillQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have questions for all three tiers", () => {
    const tiers = new Set(xidDrillQuestions.map((q) => q.tier));
    expect(tiers).toContain(1);
    expect(tiers).toContain(2);
    expect(tiers).toContain(3);
  });

  it("should have correctAnswer index within choices bounds", () => {
    for (const q of xidDrillQuestions) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswer).toBeLessThan(q.choices.length);
    }
  });

  it("should have 4 choices per question", () => {
    for (const q of xidDrillQuestions) {
      expect(q.choices).toHaveLength(4);
    }
  });

  it("tier 2 and 3 questions should have codeSnippets", () => {
    const tier2and3 = xidDrillQuestions.filter((q) => q.tier >= 2);
    for (const q of tier2and3) {
      expect(q.codeSnippet).toBeDefined();
      expect(q.codeSnippet!.length).toBeGreaterThan(0);
    }
  });

  it("should have at least 10 tier 1 questions, 10 tier 2, and 5 tier 3", () => {
    const t1 = xidDrillQuestions.filter((q) => q.tier === 1);
    const t2 = xidDrillQuestions.filter((q) => q.tier === 2);
    const t3 = xidDrillQuestions.filter((q) => q.tier === 3);
    expect(t1.length).toBeGreaterThanOrEqual(10);
    expect(t2.length).toBeGreaterThanOrEqual(10);
    expect(t3.length).toBeGreaterThanOrEqual(5);
  });
});
