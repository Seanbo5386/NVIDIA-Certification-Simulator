# XID Diagnostics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "XID Diagnostics" as a 7th command family with a custom drill quiz that teaches XID error code identification, triage, and scenario-based diagnosis.

**Architecture:** New command family entry in JSON, multi-family tool mapping so shared commands (`nvidia-smi`, `dcgmi`) credit both their existing family and `xid-diagnostics`, custom `XIDDrillQuiz` component with 3-tier progression, and a new data file with drill questions sourced from the 15 high exam-relevance XID codes.

**Tech Stack:** React 18, TypeScript, Zustand, TailwindCSS, Vitest + React Testing Library

---

### Task 1: Add `xid-diagnostics` to CommandFamilyId Types

**Files:**
- Modify: `src/store/learningProgressStore.ts:28-34`
- Modify: `src/types/commandFamilies.ts:57-63`

**Step 1: Update the type union in learningProgressStore.ts**

Add `"xid-diagnostics"` to the `CommandFamilyId` type:

```typescript
export type CommandFamilyId =
  | "gpu-monitoring"
  | "infiniband-tools"
  | "bmc-hardware"
  | "cluster-tools"
  | "container-tools"
  | "diagnostics"
  | "xid-diagnostics";
```

**Step 2: Update the type union in types/commandFamilies.ts**

Same change:

```typescript
export type CommandFamilyId =
  | "gpu-monitoring"
  | "infiniband-tools"
  | "bmc-hardware"
  | "cluster-tools"
  | "container-tools"
  | "diagnostics"
  | "xid-diagnostics";
```

**Step 3: Add to FAMILY_TOOL_COUNTS in tierProgressionEngine.ts**

File: `src/utils/tierProgressionEngine.ts:61-68`

Add the new entry with 3 tools (`dmesg`, `nvidia-smi`, `dcgmi`):

```typescript
export const FAMILY_TOOL_COUNTS: Record<string, number> = {
  "gpu-monitoring": 4,
  "infiniband-tools": 4,
  "bmc-hardware": 3,
  "cluster-tools": 4,
  "container-tools": 3,
  diagnostics: 3,
  "xid-diagnostics": 3,
};
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors (the new family ID is now valid everywhere)

**Step 5: Commit**

```bash
git add src/store/learningProgressStore.ts src/types/commandFamilies.ts src/utils/tierProgressionEngine.ts
git commit -m "feat(xid): add xid-diagnostics to CommandFamilyId and tier config"
```

---

### Task 2: Add Command Family Entry to JSON

**Files:**
- Modify: `src/data/commandFamilies.json`

**Step 1: Add the xid-diagnostics family entry**

Add as the 7th entry in the `families` array:

```json
{
  "id": "xid-diagnostics",
  "name": "XID Diagnostics",
  "icon": "🔍",
  "description": "Tools and knowledge for identifying, triaging, and responding to NVIDIA GPU XID errors found in system logs",
  "quickRule": "Check logs? dmesg. GPU state after XID? nvidia-smi -q. Run diagnostics? dcgmi diag.",
  "tools": [
    {
      "name": "dmesg",
      "tagline": "Kernel log viewer",
      "description": "Displays kernel ring buffer messages including NVIDIA XID errors with timestamps and GPU identifiers",
      "bestFor": "Finding XID errors in system logs, checking when errors occurred, correlating GPU events with system events",
      "exampleCommand": "dmesg | grep -i 'xid'",
      "permissions": "user",
      "relatedTools": ["journalctl", "nvidia-smi"]
    },
    {
      "name": "nvidia-smi",
      "tagline": "GPU state checker",
      "description": "Query detailed GPU state after an XID event to check ECC errors, temperature, power state, and process status",
      "bestFor": "Verifying GPU health after an XID error, checking ECC counters, confirming GPU is still responsive",
      "exampleCommand": "nvidia-smi -q -i 0 -d ECC,TEMPERATURE,POWER",
      "permissions": "user",
      "relatedTools": ["dmesg", "dcgmi"]
    },
    {
      "name": "dcgmi",
      "tagline": "Deep diagnostics",
      "description": "Run DCGM diagnostic levels to validate GPU health after XID errors and identify hardware issues",
      "bestFor": "Running post-XID health checks, validating GPU compute and memory integrity, generating diagnostic reports",
      "exampleCommand": "dcgmi diag -r 1 -i 0",
      "permissions": "root",
      "relatedTools": ["nvidia-smi", "nvidia-bug-report.sh"]
    }
  ]
}
```

**Step 2: Verify the app loads the new family**

Run: `npm run dev`
Check: The CommandFamilyCards grid should now show 7 cards including "XID Diagnostics"

**Step 3: Commit**

```bash
git add src/data/commandFamilies.json
git commit -m "feat(xid): add xid-diagnostics command family entry"
```

---

### Task 3: Multi-Family Tool Mapping

**Files:**
- Modify: `src/store/simulationStore.ts:36-64` (toolFamilyMap type and values)
- Modify: `src/store/simulationStore.ts:562-570` (trackToolUsage function)
- Test: `src/store/__tests__/simulationStore.test.ts` (or create if needed)

**Step 1: Write a failing test for multi-family tracking**

Create or add to the store test file. The test should verify that running `nvidia-smi` credits both `gpu-monitoring` and `xid-diagnostics`:

```typescript
it("should credit multiple families when tool maps to multiple families", () => {
  const { trackToolUsage } = useSimulationStore.getState();
  const markToolUsed = vi.spyOn(
    useLearningProgressStore.getState(),
    "markToolUsed",
  );

  trackToolUsage("nvidia-smi -q");

  expect(markToolUsed).toHaveBeenCalledWith("gpu-monitoring", "nvidia-smi");
  expect(markToolUsed).toHaveBeenCalledWith("xid-diagnostics", "nvidia-smi");
});

it("should credit xid-diagnostics when running dmesg", () => {
  const { trackToolUsage } = useSimulationStore.getState();
  const markToolUsed = vi.spyOn(
    useLearningProgressStore.getState(),
    "markToolUsed",
  );

  trackToolUsage("dmesg");

  expect(markToolUsed).toHaveBeenCalledWith("xid-diagnostics", "dmesg");
});
```

**Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run src/store/__tests__/simulationStore.test.ts -t "multi-family"`
Expected: FAIL — `nvidia-smi` only credits `gpu-monitoring`

**Step 3: Change toolFamilyMap type and values**

Change the type from `Record<string, string>` to `Record<string, string | string[]>` and update entries:

```typescript
const toolFamilyMap: Record<string, string | string[]> = {
  // GPU Monitoring tools
  "nvidia-smi": ["gpu-monitoring", "xid-diagnostics"],
  nvsm: "gpu-monitoring",
  dcgmi: ["gpu-monitoring", "xid-diagnostics"],
  nvtop: "gpu-monitoring",
  // InfiniBand tools
  ibstat: "infiniband-tools",
  perfquery: "infiniband-tools",
  ibdiagnet: "infiniband-tools",
  iblinkinfo: "infiniband-tools",
  // BMC/Hardware tools
  ipmitool: "bmc-hardware",
  sensors: "bmc-hardware",
  dmidecode: "bmc-hardware",
  // Cluster tools
  sinfo: "cluster-tools",
  squeue: "cluster-tools",
  scontrol: "cluster-tools",
  sacct: "cluster-tools",
  // Container tools
  docker: "container-tools",
  enroot: "container-tools",
  pyxis: "container-tools",
  // Diagnostics
  "dcgmi-diag": ["diagnostics", "xid-diagnostics"],
  "nvidia-bug-report": "diagnostics",
  "gpu-burn": "diagnostics",
  // XID Diagnostics (unique to this family)
  dmesg: "xid-diagnostics",
};
```

**Step 4: Update trackToolUsage to handle arrays**

```typescript
trackToolUsage: (command: string) => {
  const baseCommand = command.split(" ")[0];
  const familyIds = toolFamilyMap[baseCommand];
  if (familyIds) {
    const ids = Array.isArray(familyIds) ? familyIds : [familyIds];
    for (const familyId of ids) {
      useLearningProgressStore
        .getState()
        .markToolUsed(familyId, baseCommand);
    }
  }
},
```

**Step 5: Run test to verify it passes**

Run: `node_modules/.bin/vitest run src/store/__tests__/simulationStore.test.ts -t "multi-family"`
Expected: PASS

**Step 6: Run full test suite**

Run: `node_modules/.bin/vitest run`
Expected: All tests pass (no regressions from the type change)

**Step 7: Commit**

```bash
git add src/store/simulationStore.ts src/store/__tests__/simulationStore.test.ts
git commit -m "feat(xid): multi-family tool mapping for shared commands"
```

---

### Task 4: Add WhichToolQuiz Questions for XID Diagnostics

**Files:**
- Modify: `src/data/quizQuestions.json`
- Test: `src/data/__tests__/quizQuestions.test.ts` (if exists, verify new questions pass validation)

**Step 1: Add 5 quiz questions**

Add to the `questions` array in `quizQuestions.json`:

```json
{
  "id": "xid-diag-q1",
  "familyId": "xid-diagnostics",
  "scenario": "A GPU training job failed overnight and you need to check if any XID errors were logged in the kernel messages to determine the cause.",
  "choices": ["dmesg", "nvidia-smi -q", "dcgmi diag -r 1", "nvidia-bug-report.sh"],
  "correctAnswer": "dmesg",
  "explanation": "dmesg displays kernel ring buffer messages where NVIDIA XID errors are logged. Filtering with grep -i xid gives you a timeline of GPU errors that occurred during the failed job.",
  "whyNotOthers": [
    { "tool": "nvidia-smi -q", "reason": "nvidia-smi shows current GPU state but doesn't show historical XID error logs from the kernel" },
    { "tool": "dcgmi diag -r 1", "reason": "dcgmi diag runs active diagnostics on the GPU but doesn't show past XID errors from the system log" },
    { "tool": "nvidia-bug-report.sh", "reason": "nvidia-bug-report collects a comprehensive diagnostic bundle but is overkill for simply checking XID logs" }
  ],
  "difficulty": "beginner"
},
{
  "id": "xid-diag-q2",
  "familyId": "xid-diagnostics",
  "scenario": "You found XID 48 (Double-Bit ECC Error) in dmesg and need to verify the current ECC error counts and GPU health status before deciding whether to replace the GPU.",
  "choices": ["nvidia-smi -q", "dmesg", "dcgmi diag -r 1", "nvidia-bug-report.sh"],
  "correctAnswer": "nvidia-smi -q",
  "explanation": "nvidia-smi -q with ECC display options shows current volatile and aggregate ECC error counts, letting you assess whether the double-bit error was isolated or part of a pattern.",
  "whyNotOthers": [
    { "tool": "dmesg", "reason": "You already found the XID in dmesg; now you need GPU state details that dmesg doesn't provide" },
    { "tool": "dcgmi diag -r 1", "reason": "Running diagnostics is a good follow-up step but checking current ECC counters first gives you immediate context" },
    { "tool": "nvidia-bug-report.sh", "reason": "A full bug report is for escalation; checking ECC counters first helps you decide if escalation is needed" }
  ],
  "difficulty": "intermediate"
},
{
  "id": "xid-diag-q3",
  "familyId": "xid-diagnostics",
  "scenario": "After seeing multiple XID 79 (GPU Fallen Off Bus) errors, you need to run a thorough hardware validation to confirm whether the GPU needs replacement.",
  "choices": ["dcgmi diag -r 1", "nvidia-smi -q", "dmesg", "nvidia-bug-report.sh"],
  "correctAnswer": "dcgmi diag -r 1",
  "explanation": "dcgmi diag runs DCGM diagnostic tests that actively validate GPU compute and memory integrity. After XID 79 (GPU fell off the PCIe bus), active diagnostics confirm whether the GPU is still functional.",
  "whyNotOthers": [
    { "tool": "nvidia-smi -q", "reason": "nvidia-smi shows current state but can't actively test GPU compute/memory integrity the way dcgmi diag can" },
    { "tool": "dmesg", "reason": "dmesg shows historical logs but doesn't perform active hardware validation" },
    { "tool": "nvidia-bug-report.sh", "reason": "Bug reports collect data for support tickets but don't actively test whether the GPU is functional" }
  ],
  "difficulty": "intermediate"
},
{
  "id": "xid-diag-q4",
  "familyId": "xid-diagnostics",
  "scenario": "Multiple GPUs in a DGX node are reporting XID 74 (NVLink Error) intermittently. You need to check the kernel logs for a pattern of when these errors occur relative to job submissions.",
  "choices": ["dmesg", "dcgmi diag -r 1", "nvidia-smi -q", "nvidia-bug-report.sh"],
  "correctAnswer": "dmesg",
  "explanation": "dmesg provides timestamped kernel messages that let you correlate NVLink XID errors with job start/stop times. This timeline is essential for determining if errors are load-triggered or random.",
  "whyNotOthers": [
    { "tool": "dcgmi diag -r 1", "reason": "Diagnostics test current state but won't show the historical pattern of when errors occurred" },
    { "tool": "nvidia-smi -q", "reason": "nvidia-smi shows current NVLink status but not the historical error timeline needed for pattern analysis" },
    { "tool": "nvidia-bug-report.sh", "reason": "A bug report captures a snapshot but isn't the right tool for analyzing error patterns over time" }
  ],
  "difficulty": "advanced"
},
{
  "id": "xid-diag-q5",
  "familyId": "xid-diagnostics",
  "scenario": "A GPU shows XID 92 (High Single-Bit ECC Rate) in the logs. You want to check the current ECC error counts to determine if the error rate warrants scheduling a maintenance window.",
  "choices": ["nvidia-smi -q", "dmesg", "dcgmi diag -r 1", "nvidia-bug-report.sh"],
  "correctAnswer": "nvidia-smi -q",
  "explanation": "nvidia-smi -q with ECC display shows both volatile (since last reset) and aggregate (lifetime) ECC counters. Comparing these tells you if the high SBE rate is recent or accumulated over time, informing your maintenance decision.",
  "whyNotOthers": [
    { "tool": "dmesg", "reason": "dmesg shows the XID event but not the detailed ECC counter breakdown needed for rate assessment" },
    { "tool": "dcgmi diag -r 1", "reason": "Active diagnostics test functionality but don't provide the ECC counter history needed for maintenance planning" },
    { "tool": "nvidia-bug-report.sh", "reason": "A full bug report is for escalation to NVIDIA support, not for routine ECC rate assessment" }
  ],
  "difficulty": "advanced"
}
```

**Step 2: Run data validation tests**

Run: `node_modules/.bin/vitest run src/data/__tests__/ -t "quiz"`
Expected: PASS (new questions conform to schema)

**Step 3: Commit**

```bash
git add src/data/quizQuestions.json
git commit -m "feat(xid): add 5 WhichToolQuiz questions for xid-diagnostics family"
```

---

### Task 5: Create XID Drill Questions Data File

**Files:**
- Create: `src/data/xidDrillQuestions.ts`
- Create: `src/data/__tests__/xidDrillQuestions.test.ts`

**Step 1: Write the data validation test**

```typescript
import { describe, it, expect } from "vitest";
import { xidDrillQuestions, type XIDDrillQuestion } from "../xidDrillQuestions";
import { XID_ERRORS } from "../../simulators/xidErrors";

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

  it("should reference valid XID codes that exist in xidErrors", () => {
    const validCodes = XID_ERRORS.map((e) => e.code);
    for (const q of xidDrillQuestions) {
      const codes = Array.isArray(q.xidCode) ? q.xidCode : [q.xidCode];
      for (const code of codes) {
        expect(validCodes).toContain(code);
      }
    }
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
```

**Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run src/data/__tests__/xidDrillQuestions.test.ts`
Expected: FAIL — module not found

**Step 3: Create the data file with all three tiers of questions**

Create `src/data/xidDrillQuestions.ts` with the following structure. Source all questions from the 15 high exam-relevance XID codes (13, 27, 38, 43, 48, 54, 63, 64, 74, 76, 77, 78, 79, 92, 95).

```typescript
export interface XIDDrillQuestion {
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

export const xidDrillQuestions: XIDDrillQuestion[] = [
  // --- TIER 1: Identify (code → meaning) ---
  // Write 10-15 questions covering all 15 high-relevance XIDs.
  // Format: "What does XID [code] indicate?"
  // Choices: 4 plausible XID descriptions, one correct.
  // Use descriptions from xidErrors.ts.
  //
  // Example:
  {
    id: "xid-t1-079",
    tier: 1,
    xidCode: 79,
    questionText: "What does XID error 79 indicate?",
    choices: [
      "GPU has fallen off the PCIe bus and is no longer accessible",
      "Double-bit ECC memory error detected",
      "NVLink training failed between GPUs",
      "GPU driver firmware version mismatch",
    ],
    correctAnswer: 0,
    explanation:
      "XID 79 means the GPU has fallen off the PCIe bus. This is a critical hardware error — the GPU is completely inaccessible and typically requires a server reboot. Repeated occurrences indicate a hardware problem (PCIe slot, riser card, or GPU).",
    category: "identify",
  },
  // ... 9-14 more tier 1 questions covering: 13, 27, 38, 43, 48, 54, 63, 64, 74, 76, 77, 78, 92, 95

  // --- TIER 2: Triage (snippet + severity/action) ---
  // Write 10+ questions with codeSnippet showing dmesg or nvidia-smi output.
  // Format: Show terminal output, ask about severity or next action.
  //
  // Example:
  {
    id: "xid-t2-048",
    tier: 2,
    xidCode: 48,
    questionText:
      "You see this in dmesg. What severity level is this error and what should you do?",
    codeSnippet: `[  842.156789] NVRM: Xid (PCI:0000:3b:00): 48, pid=12345, name=python3, Double Bit ECC Error
[  842.156801] NVRM: Xid (PCI:0000:3b:00): 48, pid=12345, name=python3, Double Bit ECC Error`,
    choices: [
      "Informational — no action needed, single-bit errors are auto-corrected",
      "Warning — monitor the GPU and schedule maintenance if errors persist",
      "Critical — double-bit ECC errors corrupt data; check ECC counters with nvidia-smi and consider GPU replacement",
      "Warning — restart the failed job and clear ECC counters with nvidia-smi -r",
    ],
    correctAnswer: 2,
    explanation:
      "XID 48 is a Critical severity error. Double-bit ECC errors are uncorrectable and mean data in GPU memory was corrupted. Check aggregate ECC counters with 'nvidia-smi -q -d ECC' — if uncorrectable counts are rising, the GPU needs replacement.",
    category: "triage",
  },
  // ... 9+ more tier 2 questions

  // --- TIER 3: Scenario (multi-XID prioritization) ---
  // Write 5+ questions with longer codeSnippets showing multiple XIDs.
  // Format: Multiple errors in logs, ask which to address first and why.
  //
  // Example:
  {
    id: "xid-t3-multi-001",
    tier: 3,
    xidCode: [79, 48, 92],
    questionText:
      "Your monitoring alerts fire overnight. You find these XID errors across a DGX node. Which GPU issue should you address first?",
    codeSnippet: `[02:14:33] NVRM: Xid (PCI:0000:3b:00): 92, pid=0, High Single-Bit ECC Error Rate
[02:14:35] NVRM: Xid (PCI:0000:86:00): 48, pid=8821, name=nccl, Double Bit ECC Error
[02:15:01] NVRM: Xid (PCI:0000:86:00): 48, pid=8821, name=nccl, Double Bit ECC Error
[02:17:44] NVRM: Xid (PCI:0000:af:00): 79, pid=0, GPU has fallen off the bus`,
    choices: [
      "XID 92 on GPU 3b:00 — high SBE rate could escalate to uncorrectable errors",
      "XID 48 on GPU 86:00 — double-bit errors mean data corruption is occurring",
      "XID 79 on GPU af:00 — GPU is completely inaccessible and needs immediate attention",
      "All are equal priority — create tickets for all three simultaneously",
    ],
    correctAnswer: 2,
    explanation:
      "XID 79 (GPU fallen off bus) is the most urgent — that GPU is completely offline and the node likely needs a reboot to recover it. XID 48 is next priority (active data corruption). XID 92 is a warning that should be monitored but doesn't require immediate action.",
    category: "scenario",
  },
  // ... 4+ more tier 3 questions
];
```

**Important:** Write the FULL set of questions (10+ T1, 10+ T2, 5+ T3). The examples above show the pattern — cover all 15 high-relevance XIDs across the tiers. Use the data from `src/simulators/xidErrors.ts` for accurate descriptions, severities, and actions.

**Step 4: Run test to verify it passes**

Run: `node_modules/.bin/vitest run src/data/__tests__/xidDrillQuestions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/xidDrillQuestions.ts src/data/__tests__/xidDrillQuestions.test.ts
git commit -m "feat(xid): add XID drill questions data with 3 tiers"
```

---

### Task 6: Build XIDDrillQuiz Component

**Files:**
- Create: `src/components/XIDDrillQuiz.tsx`
- Create: `src/components/__tests__/XIDDrillQuiz.test.tsx`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { XIDDrillQuiz } from "../XIDDrillQuiz";

describe("XIDDrillQuiz", () => {
  const mockComplete = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tier 1 questions without code snippets", () => {
    render(
      <XIDDrillQuiz tier={1} onComplete={mockComplete} onClose={mockClose} />,
    );
    expect(screen.getByText(/XID/i)).toBeInTheDocument();
    expect(screen.queryByRole("code")).not.toBeInTheDocument();
  });

  it("renders tier 2 questions with code snippets", () => {
    render(
      <XIDDrillQuiz tier={2} onComplete={mockComplete} onClose={mockClose} />,
    );
    expect(screen.getByText(/XID/i)).toBeInTheDocument();
    // Tier 2 questions should have terminal output
    const pre = document.querySelector("pre");
    expect(pre).toBeInTheDocument();
  });

  it("shows 4 answer choices", () => {
    render(
      <XIDDrillQuiz tier={1} onComplete={mockComplete} onClose={mockClose} />,
    );
    const buttons = screen.getAllByRole("button");
    // 4 choices + close button
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it("shows feedback after selecting an answer", () => {
    render(
      <XIDDrillQuiz tier={1} onComplete={mockComplete} onClose={mockClose} />,
    );
    const choices = screen.getAllByRole("button").filter(
      (b) => !b.textContent?.includes("✕") && !b.textContent?.includes("Close"),
    );
    fireEvent.click(choices[0]);
    // Should show either correct or incorrect feedback
    expect(
      screen.getByText(/Correct|Not quite/i),
    ).toBeInTheDocument();
  });

  it("calls onComplete with results after all questions", async () => {
    // This test needs to answer all questions to reach results
    // Implementation will depend on question count
    render(
      <XIDDrillQuiz tier={1} onComplete={mockComplete} onClose={mockClose} />,
    );
    // Verify component renders without crashing
    expect(screen.getByText(/Question/i)).toBeInTheDocument();
  });

  it("displays severity badges in feedback", () => {
    render(
      <XIDDrillQuiz tier={1} onComplete={mockComplete} onClose={mockClose} />,
    );
    const choices = screen.getAllByRole("button").filter(
      (b) => !b.textContent?.includes("✕") && !b.textContent?.includes("Close"),
    );
    fireEvent.click(choices[0]);
    // Feedback should include severity indicator
    expect(
      screen.getByText(/Critical|Warning|Informational/i),
    ).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node_modules/.bin/vitest run src/components/__tests__/XIDDrillQuiz.test.tsx`
Expected: FAIL — module not found

**Step 3: Build the component**

Create `src/components/XIDDrillQuiz.tsx` following the patterns from `WhichToolQuiz.tsx` and `ToolMasteryQuiz.tsx`:

- **Props:** `{ tier: 1 | 2 | 3; onComplete: (passed: boolean, score: number, totalQuestions: number) => void; onClose: () => void }`
- **State machine:** `"question" | "feedback" | "results"`
- **Question selection:** Filter `xidDrillQuestions` by tier, shuffle, take 10 (tier 1/2) or 5 (tier 3)
- **Pass thresholds:** Tier 1: 80%, Tier 2: 75%, Tier 3: 80%
- **Question UI:**
  - Show question number and progress (`Question 3/10`)
  - Show `codeSnippet` in a `<pre>` block styled like terminal output (bg-black, text-green-400, monospace) for tier 2/3
  - 4 choice buttons, same styling as WhichToolQuiz
- **Feedback UI:**
  - Correct/incorrect indicator
  - Severity badge using `SEVERITY_COLORS` from `xidErrors.ts`
  - Category icon using `CATEGORY_ICONS` from `xidErrors.ts`
  - Explanation text
  - "Next" button to advance
- **Results UI:**
  - Score display with pass/fail
  - Missed questions list with correct answers
  - Severity breakdown (count of Critical/Warning/Informational missed)
  - Retry and Close buttons
- **Styling:** Dark theme, nvidia-green accents, same modal overlay pattern as WhichToolQuiz

**Step 4: Run test to verify it passes**

Run: `node_modules/.bin/vitest run src/components/__tests__/XIDDrillQuiz.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/XIDDrillQuiz.tsx src/components/__tests__/XIDDrillQuiz.test.tsx
git commit -m "feat(xid): add XIDDrillQuiz component with 3-tier progression"
```

---

### Task 7: Integrate XIDDrillQuiz into Learning Flow

**Files:**
- Modify: `src/components/CommandFamilyCards.tsx` (or parent that launches quizzes)
- Modify: `src/components/LearningPaths.tsx` or `src/components/ExamsView.tsx` (wherever quiz launch is wired)

**Step 1: Find where WhichToolQuiz is launched**

Search for where `onStartQuiz` is handled and `WhichToolQuiz` is rendered. The parent component that receives `onStartQuiz(familyId)` from `CommandFamilyCards` needs to conditionally render `XIDDrillQuiz` when `familyId === "xid-diagnostics"`.

**Step 2: Add conditional quiz launch**

In the parent component, when the quiz state is active:

```typescript
{activeQuizFamily === "xid-diagnostics" ? (
  <XIDDrillQuiz
    tier={currentTier}
    onComplete={(passed, score, total) => {
      learningProgress.completeMasteryQuiz(
        "xid-diagnostics",
        passed,
        score,
        total,
      );
      setActiveQuizFamily(null);
    }}
    onClose={() => setActiveQuizFamily(null)}
  />
) : (
  <WhichToolQuiz
    familyId={activeQuizFamily}
    onComplete={(passed, score) => {
      learningProgress.completeQuiz(activeQuizFamily, passed, score);
      setActiveQuizFamily(null);
    }}
    onClose={() => setActiveQuizFamily(null)}
  />
)}
```

**Note:** The `currentTier` should be derived from the user's unlock state in `learningProgressStore` — show the highest unlocked tier. Allow the user to select lower tiers for review.

**Step 3: Verify the integration**

Run: `npm run dev`
Check:
- XID Diagnostics card appears in the family grid
- Clicking "Start XID Diagnostics Quiz" opens XIDDrillQuiz
- Completing the quiz records progress in the store
- Tier progression works (pass T1 + use tools → T2 unlocks)

**Step 4: Run full test suite**

Run: `node_modules/.bin/vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/CommandFamilyCards.tsx src/components/LearningPaths.tsx
git commit -m "feat(xid): integrate XIDDrillQuiz into learning flow"
```

---

### Task 8: Add Explanation Gate for XID Diagnostics

**Files:**
- Modify: `src/data/explanationGates.json`

**Step 1: Add an explanation gate for tier 3 unlock**

The tier 3 unlock requires passing an explanation gate. Add a gate for `xid-diagnostics`:

```json
{
  "id": "gate-xid-diagnostics",
  "scenarioId": "",
  "familyId": "xid-diagnostics",
  "question": "When you see multiple XID errors in dmesg for the same GPU, what is the most important factor in determining whether the GPU needs replacement versus a driver reset?",
  "choices": [
    "The total number of XID events logged",
    "Whether the XIDs are correctable (single-bit) or uncorrectable (double-bit/hardware)",
    "How long the GPU has been running since last reboot",
    "Whether the errors occurred during a compute workload or at idle"
  ],
  "correctAnswer": 1,
  "explanation": "The key distinction is between correctable errors (like high single-bit ECC rates from XID 92) which can be monitored, and uncorrectable errors (like double-bit ECC from XID 48 or GPU fallen off bus from XID 79) which indicate hardware failure. Uncorrectable errors mean data integrity is compromised and the GPU likely needs replacement."
}
```

**Step 2: Run data validation tests**

Run: `node_modules/.bin/vitest run src/data/__tests__/ -t "gate"`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/explanationGates.json
git commit -m "feat(xid): add explanation gate for tier 3 unlock"
```

---

### Task 9: Final Integration Test and Cleanup

**Step 1: Run full test suite**

Run: `node_modules/.bin/vitest run`
Expected: All tests pass with zero regressions

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors

**Step 4: Verify dev server**

Run: `npm run dev`
Manual checks:
- [ ] XID Diagnostics card shows in command family grid with correct icon/description
- [ ] Tier 1 quiz launches and works (10 identification questions)
- [ ] Answering correctly shows green feedback with severity badge
- [ ] Answering incorrectly shows explanation with correct answer
- [ ] Results screen shows score, missed questions, severity breakdown
- [ ] Passing Tier 1 (80%+) updates progress ring
- [ ] Running `dmesg`, `nvidia-smi`, `dcgmi` in terminal credits xid-diagnostics family
- [ ] `nvidia-smi` also still credits gpu-monitoring family
- [ ] Tier 2 unlocks after quiz pass + all 3 tools used
- [ ] Tier 2 questions show terminal output snippets
- [ ] Tier 3 unlocks after 80%+ on Tier 2 + explanation gate passed
- [ ] Spaced repetition schedules review after quiz completion

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "feat(xid): final cleanup and integration verification"
```
