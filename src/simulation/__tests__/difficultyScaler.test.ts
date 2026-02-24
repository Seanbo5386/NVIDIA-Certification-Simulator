import { describe, it, expect } from "vitest";
import { DifficultyScaler } from "../difficultyScaler";

describe("DifficultyScaler", () => {
  it("should start at default rating of 1000", () => {
    const scaler = new DifficultyScaler();
    expect(scaler.getRating()).toBe(1000);
  });

  it("should increase rating after a good score", () => {
    const scaler = new DifficultyScaler();
    scaler.recordResult(80);
    expect(scaler.getRating()).toBeGreaterThan(1000);
  });

  it("should decrease rating after a poor score", () => {
    const scaler = new DifficultyScaler();
    scaler.recordResult(20);
    expect(scaler.getRating()).toBeLessThan(1000);
  });

  it("should recommend beginner difficulty at low rating", () => {
    const scaler = new DifficultyScaler(600);
    expect(scaler.getRecommendedDifficulty()).toBe("beginner");
  });

  it("should recommend intermediate difficulty at mid rating", () => {
    const scaler = new DifficultyScaler(1200);
    expect(scaler.getRecommendedDifficulty()).toBe("intermediate");
  });

  it("should recommend advanced difficulty at high rating", () => {
    const scaler = new DifficultyScaler(1600);
    expect(scaler.getRecommendedDifficulty()).toBe("advanced");
  });

  it("should clamp rating between 0 and 3000", () => {
    const low = new DifficultyScaler(50);
    low.recordResult(0);
    expect(low.getRating()).toBeGreaterThanOrEqual(0);

    const high = new DifficultyScaler(2950);
    high.recordResult(100);
    expect(high.getRating()).toBeLessThanOrEqual(3000);
  });

  it("should initialize from existing rating", () => {
    const scaler = new DifficultyScaler(1500);
    expect(scaler.getRating()).toBe(1500);
  });
});
