/**
 * Diagnostic workflow phases in recommended order.
 * A methodical technician progresses through these sequentially.
 */
export type DiagnosticPhase =
  | "survey"
  | "triage"
  | "isolation"
  | "remediation"
  | "verification";

export interface PhaseEntry {
  command: string;
  phase: DiagnosticPhase;
  timestamp: number;
}

export interface ScoreInput {
  correctDiagnosis: boolean;
  collateralDamage: number;
}

export interface WorkflowScore {
  /** 0-20: Higher when phases progress in recommended order */
  methodology: number;
  /** 0-20: Fewer commands = higher score (baseline ~10 commands) */
  efficiency: number;
  /** 0-20: 20 if correct diagnosis, 0 if wrong */
  accuracy: number;
  /** 0-20: 20 minus 5 per collateral event (floor at 0) */
  noCollateral: number;
  /** 0-20: Higher if verification phase present after remediation */
  completeness: number;
  /** Sum of all sub-scores, 0-100 */
  total: number;
}

/**
 * Canonical phase ordering for methodology scoring.
 * Lower index = earlier in the ideal diagnostic workflow.
 */
const PHASE_ORDER: DiagnosticPhase[] = [
  "survey",
  "triage",
  "isolation",
  "remediation",
  "verification",
];

const EFFICIENCY_BASELINE = 10;
const MAX_SUBSCORE = 20;
const COLLATERAL_PENALTY = 5;

/**
 * Pattern-based rules for classifying commands into diagnostic phases.
 * Order matters: more specific patterns must come before broader ones.
 */
interface ClassificationRule {
  phase: DiagnosticPhase;
  test: (command: string) => boolean;
}

const REMEDIATION_PATTERNS: RegExp[] = [
  /nvidia-smi\s+.*-r/,
  /nvidia-smi\s+.*--gpu-reset/,
  /scontrol\s+update\s+.*State=/i,
  /ipmitool\s+.*power/i,
  /systemctl\s+(restart|stop|start)/,
  /modprobe\s/,
  /rmmod\s/,
];

const ISOLATION_PATTERNS: RegExp[] = [
  /nvidia-smi\s+.*-q\s+.*-d\s/,
  /nvidia-smi\s+.*-d\s+.*-q/,
  /dcgmi\s+diag/,
  /perfquery/,
  /nvidia-smi\s+.*-q\s+.*-i\s/,
  /nvidia-smi\s+.*-i\s+.*-q\s/,
];

const TRIAGE_PATTERNS: RegExp[] = [
  /nvidia-smi\s+.*-i\s+\d/,
  /dmesg\s*\|/,
  /ibdiagnet/,
  /journalctl\s/,
  /grep\s+.*\/var\/log/,
  /scontrol\s+show\s/,
];

const SURVEY_COMMANDS: RegExp[] = [
  /^sinfo(\s|$)/,
  /^nvidia-smi\s*$/,
  /^ibstat\s*$/,
  /^squeue(\s|$)/,
  /^nvtop\s*$/,
  /^sensors\s*$/,
  /^iblinkinfo\s*$/,
  /^nvsm\s+show\s/,
];

const classificationRules: ClassificationRule[] = [
  {
    phase: "remediation",
    test: (cmd) => REMEDIATION_PATTERNS.some((p) => p.test(cmd)),
  },
  {
    phase: "isolation",
    test: (cmd) => ISOLATION_PATTERNS.some((p) => p.test(cmd)),
  },
  {
    phase: "triage",
    test: (cmd) => TRIAGE_PATTERNS.some((p) => p.test(cmd)),
  },
  {
    phase: "survey",
    test: (cmd) => SURVEY_COMMANDS.some((p) => p.test(cmd)),
  },
];

/**
 * Classifies user commands into diagnostic phases and scores methodology.
 *
 * Used by the Incident Workspace Panel to show live progress, and by the
 * Incident Session Orchestrator to score the user's diagnostic approach.
 */
export class WorkflowTracker {
  private history: PhaseEntry[] = [];
  private hasReachedRemediation = false;

  /**
   * Record a command and classify it into a diagnostic phase.
   */
  recordCommand(command: string): PhaseEntry {
    const rawPhase = this.classifyCommand(command);

    // If we've already passed through remediation and the raw classification
    // is "survey", re-classify as "verification" (re-checking after fix).
    const phase =
      this.hasReachedRemediation && rawPhase === "survey"
        ? "verification"
        : rawPhase;

    if (phase === "remediation") {
      this.hasReachedRemediation = true;
    }

    const entry: PhaseEntry = {
      command,
      phase,
      timestamp: Date.now(),
    };

    this.history.push(entry);
    return entry;
  }

  /**
   * Returns the full phase history.
   */
  getPhaseHistory(): PhaseEntry[] {
    return [...this.history];
  }

  /**
   * Calculate a composite score (0-100) based on the recorded workflow.
   */
  calculateScore(input: ScoreInput): WorkflowScore {
    const methodology = this.scoreMethodology();
    const efficiency = this.scoreEfficiency();
    const accuracy = input.correctDiagnosis ? MAX_SUBSCORE : 0;
    const noCollateral = Math.max(
      0,
      MAX_SUBSCORE - input.collateralDamage * COLLATERAL_PENALTY,
    );
    const completeness = this.scoreCompleteness();

    const total =
      methodology + efficiency + accuracy + noCollateral + completeness;

    return {
      methodology,
      efficiency,
      accuracy,
      noCollateral,
      completeness,
      total,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private classifyCommand(command: string): DiagnosticPhase {
    const trimmed = command.trim();
    for (const rule of classificationRules) {
      if (rule.test(trimmed)) {
        return rule.phase;
      }
    }
    // Default to triage for unrecognized commands -- the user is
    // investigating *something*, even if we can't categorise it precisely.
    return "triage";
  }

  /**
   * Methodology (0-20): rewards phases that progress in the canonical order.
   *
   * For each consecutive pair of entries, if the second phase is the same or
   * later in the canonical order we award a point. The ratio of "in-order"
   * transitions to total transitions is scaled to [0, 20].
   */
  private scoreMethodology(): number {
    if (this.history.length <= 1) return MAX_SUBSCORE / 2; // neutral baseline

    let inOrder = 0;
    const transitions = this.history.length - 1;

    for (let i = 1; i < this.history.length; i++) {
      const prevIdx = PHASE_ORDER.indexOf(this.history[i - 1].phase);
      const currIdx = PHASE_ORDER.indexOf(this.history[i].phase);
      if (currIdx >= prevIdx) {
        inOrder++;
      }
    }

    return Math.round((inOrder / transitions) * MAX_SUBSCORE);
  }

  /**
   * Efficiency (0-20): fewer commands relative to the baseline = higher score.
   * At the baseline (10 commands), score is 10. Fewer gives up to 20.
   * More commands asymptotically approach 0.
   */
  private scoreEfficiency(): number {
    const count = this.history.length;
    if (count === 0) return MAX_SUBSCORE;
    // Score = baseline / count * (MAX_SUBSCORE / 2), capped at MAX_SUBSCORE
    const raw = (EFFICIENCY_BASELINE / count) * (MAX_SUBSCORE / 2);
    return Math.min(MAX_SUBSCORE, Math.round(raw));
  }

  /**
   * Completeness (0-20): rewards having a verification step after remediation.
   *
   * Full marks if both remediation and verification phases are present.
   * Half marks if only remediation is present. Minimal marks otherwise.
   */
  private scoreCompleteness(): number {
    const phases = new Set(this.history.map((e) => e.phase));
    const hasRemediation = phases.has("remediation");
    const hasVerification = phases.has("verification");

    if (hasRemediation && hasVerification) return MAX_SUBSCORE;
    if (hasRemediation) return MAX_SUBSCORE / 2;
    // No remediation yet -- give a small baseline for having commands at all
    return this.history.length > 0 ? 5 : 0;
  }
}
