# XID Diagnostics — Design Document

## Overview

Add "XID Diagnostics" as a 7th command family to the learning system, providing a dedicated interactive quiz for memorizing XID error codes and learning the appropriate diagnostic response for each.

## Scope

- **XID codes:** High exam-relevance only (subset of the 40 codes in `xidErrors.ts`)
- **Learning goal:** Both code recognition (what does this XID mean?) and triage decision-making (what do you do about it?)

## Data Layer

### Command Family Entry

Add `xid-diagnostics` to `commandFamilies.json`:
- **Tools:** `dmesg`, `nvidia-smi -q`, `dcgmi diag`
- **Tagline:** "Identify, triage, and respond to GPU XID errors"
- **Best for:** "Diagnosing GPU failures from kernel logs and understanding error severity"

### Quiz Questions

- ~5 new questions in `quizQuestions.json` for WhichToolQuiz, filtered to `familyId: "xid-diagnostics"`

### XID Drill Questions

New data file `src/data/xidDrillQuestions.ts` with three tiers:

| Tier | Format | Example |
|------|--------|---------|
| 1 — Identify | Code → meaning multiple choice | "XID 79 indicates: (a) GPU fell off bus (b) Memory ECC error ..." |
| 2 — Triage | Snippet + severity/action question | dmesg output showing XID 48, "What severity? What's your next step?" |
| 3 — Scenario | Multi-XID output, prioritize and respond | "XIDs 63, 48, 13 in the log. Which first and why?" |

Question schema:
```typescript
interface XIDDrillQuestion {
  id: string;
  tier: 1 | 2 | 3;
  xidCode: number | number[];
  questionText: string;
  codeSnippet?: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  category: "identify" | "triage" | "scenario";
}
```

## Component: XIDDrillQuiz

`src/components/XIDDrillQuiz.tsx` — Modal quiz following WhichToolQuiz/ToolMasteryQuiz patterns.

### Props

```typescript
interface XIDDrillQuizProps {
  tier: 1 | 2 | 3;
  onComplete: (passed: boolean, score: number, totalQuestions: number) => void;
  onClose: () => void;
}
```

### Per-Tier Behavior

- **Tier 1:** Clean multiple choice, 10 questions, 80% to pass. Feedback shows severity badge and category icon from `xidErrors.ts`.
- **Tier 2:** Includes `<pre>` terminal output (dmesg/nvidia-smi snippets). 10 questions, 75% to pass. Feedback explains triage reasoning.
- **Tier 3:** Longer scenarios with multiple XIDs. 5 questions, 80% to pass. Feedback walks through full diagnostic workflow.

### Results Screen

Score, missed questions with corrections, severity breakdown (Critical/Warning/Informational errors missed), retry button.

### Integration

Launched from CommandFamilyCards grid. The `xid-diagnostics` card opens XIDDrillQuiz instead of WhichToolQuiz.

## Progress Tracking

No new store code. Existing `learningProgressStore` handles:
- `familyQuizScores["xid-diagnostics"]` — quiz pass/fail, score, attempts
- `masteryQuizScores["xid-diagnostics"]` — tier 2/3 drill results
- `toolsUsed["xid-diagnostics"]` — tool usage tracking
- `reviewSchedule["xid-diagnostics"]` — spaced repetition auto-schedules

### Tier Unlock Logic

Uses existing `tierProgressionEngine.ts`:
- **Tier 1:** Always unlocked
- **Tier 2:** Pass Tier 1 quiz (80%) + run all 3 tools in terminal
- **Tier 3:** Score 80%+ on Tier 2 + pass related explanation gate

### Exam Gauntlet

XID Diagnostics enters the weighted random pool under Domain 5 (Troubleshooting & Optimization, 12%).

## Terminal Integration: Multi-Family Tool Mapping

### Problem

`nvidia-smi` and `dcgmi` are already mapped to `gpu-monitoring` and `diagnostics` respectively.

### Solution

Change `toolFamilyMap` in `simulationStore.ts` from `Record<string, string>` to `Record<string, string[]>`. Running a command credits all mapped families.

New mappings:
- `"dmesg"` → `["xid-diagnostics"]`
- `"nvidia-smi"` → `["gpu-monitoring", "xid-diagnostics"]`
- `"dcgmi"` → `["diagnostics", "xid-diagnostics"]`

## Testing

- **Data validation** (`src/data/__tests__/xidDrillQuestions.test.ts`) — Valid XID codes, correct answer indices in bounds, all tiers represented, no duplicate IDs
- **Component** (`src/components/__tests__/XIDDrillQuiz.test.tsx`) — Renders each tier, answer selection advances state, pass/fail thresholds, onComplete args, severity badges
- **Store integration** — Multi-family mapping credits both families when running shared commands
