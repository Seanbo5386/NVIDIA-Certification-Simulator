import { describe, it, expect } from "vitest";
import { WorkflowTracker } from "../workflowTracker";

describe("WorkflowTracker", () => {
  it("should classify broad commands as survey phase", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("sinfo");
    tracker.recordCommand("nvidia-smi");
    expect(tracker.getPhaseHistory()[0].phase).toBe("survey");
  });

  it("should classify targeted commands as triage phase", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi -i 3");
    expect(tracker.getPhaseHistory()[0].phase).toBe("triage");
  });

  it("should classify deep diagnostic commands as isolation phase", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi -q -i 3 -d ECC");
    expect(tracker.getPhaseHistory()[0].phase).toBe("isolation");
  });

  it("should classify corrective actions as remediation phase", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi -r -i 3");
    expect(tracker.getPhaseHistory()[0].phase).toBe("remediation");
  });

  it("should score methodology higher when phases are in order", () => {
    const ordered = new WorkflowTracker();
    ordered.recordCommand("sinfo");
    ordered.recordCommand("nvidia-smi -i 3");
    ordered.recordCommand("nvidia-smi -q -i 3 -d ECC");
    ordered.recordCommand("nvidia-smi -r -i 3");
    ordered.recordCommand("nvidia-smi");

    const unordered = new WorkflowTracker();
    unordered.recordCommand("nvidia-smi -r -i 3");
    unordered.recordCommand("sinfo");
    unordered.recordCommand("nvidia-smi -q -i 3 -d ECC");

    const orderedScore = ordered.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 0,
    });
    const unorderedScore = unordered.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 0,
    });
    expect(orderedScore.methodology).toBeGreaterThan(
      unorderedScore.methodology,
    );
  });

  it("should score efficiency based on command count", () => {
    const efficient = new WorkflowTracker();
    efficient.recordCommand("dmesg | grep -i xid");
    efficient.recordCommand("nvidia-smi -q -i 3 -d ECC");

    const verbose = new WorkflowTracker();
    for (let i = 0; i < 20; i++) {
      verbose.recordCommand(`nvidia-smi -i ${i % 8}`);
    }

    const efficientScore = efficient.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 0,
    });
    const verboseScore = verbose.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 0,
    });
    expect(efficientScore.efficiency).toBeGreaterThan(verboseScore.efficiency);
  });

  it("should give 0 accuracy when diagnosis is wrong", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi");
    const score = tracker.calculateScore({
      correctDiagnosis: false,
      collateralDamage: 0,
    });
    expect(score.accuracy).toBe(0);
  });

  it("should penalize collateral damage", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi");
    const clean = tracker.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 0,
    });
    const messy = tracker.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 3,
    });
    expect(clean.noCollateral).toBeGreaterThan(messy.noCollateral);
  });

  it("should return total score out of 100", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("sinfo");
    const score = tracker.calculateScore({
      correctDiagnosis: true,
      collateralDamage: 0,
    });
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});
