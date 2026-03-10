# Codex Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the critical and high-severity bugs identified by the Codex deep audit, plus the highest-impact medium-severity items.

**Architecture:** Each task is a self-contained fix targeting one bug. Tasks are ordered by dependency — exam scoring fixes come first (Tasks 1-3), then analytics (Task 4), then gauntlet (Task 5), then sandbox isolation (Tasks 6-7), then terminal context (Task 8). Each task produces a working, testable change that can be committed independently.

**Tech Stack:** React 18, TypeScript, Zustand (with Immer middleware), Vitest + React Testing Library

---

## Known Hazards (Read Before Implementing)

These are cross-cutting issues discovered during analysis that affect multiple tasks. Implementers must read these before starting any task.

### H1: `endExam` signature change cascades to mocks

Changing `endExam: () => ExamBreakdown | null` to accept a parameter will break:

- `src/components/__tests__/ExamWorkspace.test.tsx:51` — `mockEndExam = vi.fn()` needs no code change (vi.fn() accepts any args), BUT tests that assert `mockEndExam` was called should verify it was called WITH the breakdown.
- Interface at `src/store/simulationStore.ts:162` must be updated.

### H2: PerformanceBenchmark tests have a compensating bug

Tests mock `getReadinessScore` returning 0-1 scale values (0.65, 0.80, 0.60, 0.35). The component multiplies by 100, so `0.65 * 100 = 65` accidentally produces correct behavior. The real store returns 0-100 (e.g., 65). **When removing `* 100`, you MUST also update all test mocks to use 0-100 scale values**, or the tests will pass for wrong reasons OR fail unexpectedly.

### H3: PerformanceBenchmark has a second memoization bug

`overallPercentile` useMemo at line 129 depends on `[getReadinessScore]` (function reference from store). Since `useLearningStore` returns a new reference each render when called without a selector, this memo recomputes every render. Must fix dependency to use the numeric score.

### H4: The scenario start action is `loadScenario`, not `startScenario`

`src/store/simulationStore.ts:368` — the action is called `loadScenario(scenario)`, NOT `startScenario`. Any snapshot logic must be placed in `loadScenario`.

### H5: `partialize` protects against accidental persistence

`src/store/simulationStore.ts:728-756` — the persist middleware uses `partialize` to explicitly whitelist: `cluster`, `systemType`, `simulationSpeed`, `scenarioProgress`, `completedScenarios`. Any new state field (like `_clusterSnapshot`) is automatically excluded from persistence. No `partialize` changes needed.

### H6: ExamGauntlet tests rely on Mark Complete for test setup

`src/components/__tests__/ExamGauntlet.test.tsx` uses `Mark Complete` buttons inside `startAndFinishExam()` helper (line 354-359) to set up completed scenarios for results screen assertions. Removing the button requires rewriting the test helper and 7+ test cases that depend on it. Since gauntlet completion will now require actual scenario validation (a future feature), tests should verify the gauntlet works without any completions.

### H7: `clearAllFaults` is only called from `exitScenario`

Confirmed single call site at `simulationStore.ts:484`. Safe to remove from exit path. The function itself in `scenarioLoader.ts` can remain exported for other potential uses.

---

## Chunk 1: Exam Scoring Pipeline (Tasks 1-3)

These three tasks fix the broken exam scoring pipeline end-to-end: the store accepts real scores, the workspace passes them, and the learning store records them.

---

### Task 1: Fix `endExam()` to accept a real breakdown

The `endExam()` action ignores the caller's computed breakdown and writes a hardcoded placeholder with wrong totals (totalPoints 35, but domain totals sum to 33). Fix it to accept an `ExamBreakdown` parameter.

**Files:**

- Modify: `src/store/simulationStore.ts:162` (interface)
- Modify: `src/store/simulationStore.ts:620-682` (implementation)
- Modify: `src/components/__tests__/ExamWorkspace.test.tsx:51` (update mock assertion)
- Test: `src/store/__tests__/simulationStore.test.ts`

**Hazards:** See H1.

- [ ] **Step 1: Write the failing test**

In `src/store/__tests__/simulationStore.test.ts`, add a new describe block:

```typescript
import type { ExamBreakdown } from "@/types/scenarios";

describe("endExam", () => {
  it("persists the provided breakdown instead of a placeholder", () => {
    const store = useSimulationStore.getState();
    store.startExam("test-exam");

    const realBreakdown: ExamBreakdown = {
      totalPoints: 35,
      earnedPoints: 28,
      percentage: 80,
      byDomain: {
        domain1: {
          domainName: "Platform Bring-Up",
          questionsTotal: 10,
          questionsCorrect: 8,
          percentage: 80,
          weight: 31,
        },
        domain2: {
          domainName: "Accelerator Configuration",
          questionsTotal: 2,
          questionsCorrect: 2,
          percentage: 100,
          weight: 5,
        },
        domain3: {
          domainName: "Base Infrastructure",
          questionsTotal: 6,
          questionsCorrect: 5,
          percentage: 83,
          weight: 19,
        },
        domain4: {
          domainName: "Validation & Testing",
          questionsTotal: 11,
          questionsCorrect: 9,
          percentage: 82,
          weight: 33,
        },
        domain5: {
          domainName: "Troubleshooting",
          questionsTotal: 4,
          questionsCorrect: 4,
          percentage: 100,
          weight: 12,
        },
      },
      questionResults: [],
      timeSpent: 3600,
    };

    store.endExam(realBreakdown);

    const { activeExam } = useSimulationStore.getState();
    expect(activeExam?.submitted).toBe(true);
    expect(activeExam?.breakdown?.earnedPoints).toBe(28);
    expect(activeExam?.breakdown?.percentage).toBe(80);
  });

  it("returns null if no active exam", () => {
    const store = useSimulationStore.getState();
    const result = store.endExam({} as ExamBreakdown);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/simulationStore.test.ts --reporter=verbose`
Expected: FAIL — `endExam()` does not accept a parameter (TypeScript error), breakdown has `earnedPoints: 0`.

- [ ] **Step 3: Update the interface type**

In `src/store/simulationStore.ts`, line 162, change:

```typescript
// OLD (line 162)
endExam: () => ExamBreakdown | null;
```

to:

```typescript
// NEW
endExam: (breakdown: ExamBreakdown) => ExamBreakdown | null;
```

- [ ] **Step 4: Replace `endExam` implementation**

In `src/store/simulationStore.ts`, replace lines 620-682 (the entire `endExam` action):

```typescript
endExam: (breakdown: ExamBreakdown) => {
  const currentState = get();
  if (!currentState.activeExam) return null;

  set((state) => {
    if (state.activeExam) {
      state.activeExam.submitted = true;
      state.activeExam.endTime = Date.now();
      state.activeExam.breakdown = breakdown;
    }
  });

  return breakdown;
},
```

This removes the entire 60-line placeholder block.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/simulationStore.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Update ExamWorkspace test mock assertion**

In `src/components/__tests__/ExamWorkspace.test.tsx`, the mock at line 51 (`mockEndExam = vi.fn()`) needs no signature change — `vi.fn()` accepts any args. But verify no test asserts `mockEndExam` was called with zero args. If any test calls `expect(mockEndExam).toHaveBeenCalledWith()` (no args), update it to:

```typescript
expect(mockEndExam).toHaveBeenCalledWith(
  expect.objectContaining({
    totalPoints: expect.any(Number),
    earnedPoints: expect.any(Number),
  }),
);
```

- [ ] **Step 7: Run full test suite to catch cascading failures**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass. If any test fails because `endExam` is called without args elsewhere, that caller also needs fixing (but exploration confirmed only ExamWorkspace calls it).

- [ ] **Step 8: Commit**

```bash
git add src/store/simulationStore.ts src/store/__tests__/simulationStore.test.ts src/components/__tests__/ExamWorkspace.test.tsx
git commit -m "fix: endExam() accepts real breakdown instead of placeholder"
```

---

### Task 2: Pass real breakdown from ExamWorkspace to `endExam()`

`ExamWorkspace.handleSubmitExam()` computes a real `breakdown` via `calculateExamScore()` but then calls `endExam()` without passing it. One-line fix.

**Files:**

- Modify: `src/components/ExamWorkspace.tsx:166`

**Depends on:** Task 1 (endExam signature).

- [ ] **Step 1: Fix the call site**

In `src/components/ExamWorkspace.tsx`, line 166, change:

```typescript
// OLD
endExam();
```

to:

```typescript
// NEW
endExam(breakdown);
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExamWorkspace.tsx
git commit -m "fix: pass real exam breakdown to endExam()"
```

---

### Task 3: Record exam attempts in learning store

The submit and timeout paths never call `addExamAttempt()`, so `examAttempts` stays empty and analytics/trend screens never reflect actual exam performance. The `addExamAttempt` action already exists in learningStore — we just need to call it.

**Files:**

- Modify: `src/components/ExamWorkspace.tsx:1-2,81-82,154-168`
- Test: `src/store/__tests__/learningStore.test.ts` (verify action works)

**Depends on:** Task 2 (breakdown is correctly computed and available).

- [ ] **Step 1: Write a test confirming `addExamAttempt` works as expected**

In `src/store/__tests__/learningStore.test.ts`, add:

```typescript
import type { ExamBreakdown } from "@/types/scenarios";

describe("addExamAttempt", () => {
  const makeBreakdown = (pct: number): ExamBreakdown => ({
    totalPoints: 35,
    earnedPoints: Math.round((35 * pct) / 100),
    percentage: pct,
    byDomain: {
      domain1: {
        domainName: "Platform Bring-Up",
        questionsTotal: 10,
        questionsCorrect: 0,
        percentage: 0,
        weight: 31,
      },
      domain2: {
        domainName: "Accelerator Configuration",
        questionsTotal: 2,
        questionsCorrect: 0,
        percentage: 0,
        weight: 5,
      },
      domain3: {
        domainName: "Base Infrastructure",
        questionsTotal: 6,
        questionsCorrect: 0,
        percentage: 0,
        weight: 19,
      },
      domain4: {
        domainName: "Validation & Testing",
        questionsTotal: 11,
        questionsCorrect: 0,
        percentage: 0,
        weight: 33,
      },
      domain5: {
        domainName: "Troubleshooting",
        questionsTotal: 4,
        questionsCorrect: 0,
        percentage: 0,
        weight: 12,
      },
    },
    questionResults: [],
    timeSpent: 1800,
  });

  it("appends breakdown to examAttempts", () => {
    const store = useLearningStore.getState();
    store.addExamAttempt(makeBreakdown(80));
    expect(useLearningStore.getState().examAttempts).toHaveLength(1);
    expect(useLearningStore.getState().examAttempts[0].percentage).toBe(80);
  });

  it("caps at 20 attempts (keeps most recent)", () => {
    const store = useLearningStore.getState();
    for (let i = 0; i < 25; i++) {
      store.addExamAttempt(makeBreakdown(i));
    }
    const attempts = useLearningStore.getState().examAttempts;
    expect(attempts).toHaveLength(20);
    // Most recent 20: indices 5-24
    expect(attempts[0].percentage).toBe(5);
    expect(attempts[19].percentage).toBe(24);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/learningStore.test.ts --reporter=verbose`
Expected: PASS — the `addExamAttempt` action already exists.

- [ ] **Step 3: Wire up `addExamAttempt` in ExamWorkspace**

In `src/components/ExamWorkspace.tsx`:

**Add import** (near top, after existing imports):

```typescript
import { useLearningStore } from "@/store/learningStore";
```

**Add store hook** (inside the component, after line 82):

```typescript
const addExamAttempt = useLearningStore((state) => state.addExamAttempt);
```

**Update `handleSubmitExam`** — add `addExamAttempt(breakdown)` after `endExam(breakdown)`:

```typescript
const handleSubmitExam = () => {
  if (!activeExam) return;
  examTimer?.stop();
  const breakdown = calculateExamScore(questions, activeExam.answers);
  breakdown.timeSpent = examTimer?.getTimeElapsed() || 0;
  endExam(breakdown);
  addExamAttempt(breakdown);
  setShowResults(true);
};
```

- [ ] **Step 4: Update ExamWorkspace test mock to include learningStore**

In `src/components/__tests__/ExamWorkspace.test.tsx`, add the learningStore mock (after the simulationStore mock):

```typescript
const mockAddExamAttempt = vi.fn();

vi.mock("@/store/learningStore", () => ({
  useLearningStore: vi.fn((selector?) => {
    const state = { addExamAttempt: mockAddExamAttempt };
    return selector ? selector(state) : state;
  }),
}));
```

Also add to `beforeEach`: `mockAddExamAttempt.mockClear();`

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ExamWorkspace.tsx src/store/__tests__/learningStore.test.ts src/components/__tests__/ExamWorkspace.test.tsx
git commit -m "fix: record exam attempts in learning store for analytics"
```

---

## Chunk 2: Readiness Benchmark Fix (Task 4)

---

### Task 4: Fix readiness score `*100` bug and memoization in PerformanceBenchmark

Three bugs in one component:

1. `getReadinessScore()` returns 0-100 but component multiplies by 100 again (lines 121, 165)
2. `overallPercentile` useMemo depends on `[getReadinessScore]` (function ref), not the score value
3. Existing tests mock `getReadinessScore` returning 0-1 scale — a compensating error that masks the bug

**Files:**

- Modify: `src/components/PerformanceBenchmark.tsx:119-129,165,205`
- Modify: `src/components/__tests__/PerformanceBenchmark.test.tsx:31,157,167,177,189`

**Hazards:** See H2, H3.

- [ ] **Step 1: Fix test mocks FIRST (change from 0-1 to 0-100 scale)**

In `src/components/__tests__/PerformanceBenchmark.test.tsx`:

**Line 31** — default mock:

```typescript
// OLD
getReadinessScore: () => 0.65,
// NEW
getReadinessScore: () => 65,
```

**Line 157** — high readiness:

```typescript
// OLD
getReadinessScore: () => 0.80,
// NEW
getReadinessScore: () => 80,
```

**Line 167** — medium readiness:

```typescript
// OLD
getReadinessScore: () => 0.60,
// NEW
getReadinessScore: () => 60,
```

**Line 177** — low readiness:

```typescript
// OLD
getReadinessScore: () => 0.35,
// NEW
getReadinessScore: () => 35,
```

**Line 189** — percentile test:

```typescript
// OLD
getReadinessScore: () => 0.75,
// NEW
getReadinessScore: () => 75,
```

- [ ] **Step 2: Run tests to verify they FAIL with current component code**

Run: `npx vitest run src/components/__tests__/PerformanceBenchmark.test.tsx --reporter=verbose`
Expected: FAIL — `80 * 100 = 8000` which is `>= 75` → still "High likelihood" (may pass accidentally for some tests). The key failure should be in percentile: `65 * 100 = 6500` makes percentile always 90th instead of correct value.

- [ ] **Step 3: Fix the `overallPercentile` useMemo**

In `src/components/PerformanceBenchmark.tsx`, replace lines 118-129:

```typescript
// OLD
const overallPercentile = useMemo(() => {
  const readinessScore = getReadinessScore();
  const score = readinessScore * 100;

  for (const bp of BENCHMARK_DATA.percentileBreakpoints) {
    if (score >= bp.score) {
      return bp.percentile;
    }
  }
  return 5;
}, [getReadinessScore]);
```

with:

```typescript
// NEW — use score directly (already 0-100), memoize on domainProgress
const overallPercentile = useMemo(() => {
  const score = getReadinessScore();

  for (const bp of BENCHMARK_DATA.percentileBreakpoints) {
    if (score >= bp.score) {
      return bp.percentile;
    }
  }
  return 5;
}, [domainProgress, examAttempts]);
```

**Why `[domainProgress, examAttempts]`:** These are the data sources that `getReadinessScore()` reads from. Using these as deps ensures the memo updates when the underlying data changes, not on every render (which `[getReadinessScore]` effectively does since the function ref changes each render).

- [ ] **Step 4: Fix the module-level readinessScore**

In `src/components/PerformanceBenchmark.tsx`, line 165, change:

```typescript
// OLD
const readinessScore = getReadinessScore() * 100;
```

to:

```typescript
// NEW
const readinessScore = getReadinessScore();
```

- [ ] **Step 5: Verify the JSX thresholds are correct for 0-100 scale**

Check that lines 205, 360, 365, 376 all compare `readinessScore` against thresholds like 70, 75, 50. These thresholds are correct for a 0-100 value. No changes needed here — just verify.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/PerformanceBenchmark.test.tsx --reporter=verbose`
Expected: All PASS. With mocks returning 0-100 and component no longer multiplying:

- `80` → `>= 75` → "High likelihood" ✓
- `60` → `>= 50` → "Moderate likelihood" ✓
- `35` → `< 50` → "More study needed" ✓
- `65` → percentile: `65 < 67` so not 50th, `65 >= 58` so 25th ✓

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/PerformanceBenchmark.tsx src/components/__tests__/PerformanceBenchmark.test.tsx
git commit -m "fix: remove erroneous *100 on readiness score, fix memoization dependency"
```

---

## Chunk 3: Gauntlet Mark Complete Removal (Task 5)

---

### Task 5: Remove gauntlet `Mark Complete` button

The gauntlet lets users click `Mark Complete` without doing any scenario work, making the score meaningless. Remove the manual completion path. Until real scenario validation proves completion (a future feature), the gauntlet score will track which scenarios the user has launched and worked through in the full lab workspace.

**Files:**

- Modify: `src/components/ExamGauntlet.tsx:259-277,540-546,600-610`
- Modify: `src/components/__tests__/ExamGauntlet.test.tsx` (rewrite 7+ tests)

**Hazards:** See H6. The test helper `startAndFinishExam(completeScenarios)` uses `Mark Complete` to set up completed scenarios. With the button removed, tests that check scores like "40%" or "60%" need to be rewritten to not depend on manual completion.

- [ ] **Step 1: Remove `handleMarkComplete` callback**

In `src/components/ExamGauntlet.tsx`, delete lines 259-277 (the `handleMarkComplete` useCallback).

- [ ] **Step 2: Remove the Mark Complete button from the detail view**

In `src/components/ExamGauntlet.tsx`, find the detail view button (around lines 540-546). Remove the Mark Complete button but keep the "Back to List" button. The `<div className="flex gap-3">` wrapper can be simplified since there's only one button now.

Replace the `<div className="flex gap-3">` block:

```tsx
{
  /* OLD: two buttons */
}
<div className="flex gap-3">
  <button
    onClick={() => handleMarkComplete(currentScenarioIndex)}
    className="flex-1 ..."
  >
    Mark Complete
  </button>
  <button onClick={handleCloseScenario} className="px-6 ...">
    Back to List
  </button>
</div>;
```

with:

```tsx
{
  /* NEW: only back button */
}
<div className="flex gap-3">
  <button
    onClick={handleCloseScenario}
    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
  >
    Back to List
  </button>
</div>;
```

- [ ] **Step 3: Remove the Mark Complete button from the list view**

Find the list view button (around lines 600-610). Remove the entire conditional block:

```tsx
{
  /* DELETE this entire block */
}
{
  !scenario.completed && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleMarkComplete(index);
      }}
      className="text-sm px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
    >
      Mark Complete
    </button>
  );
}
```

- [ ] **Step 4: Update tests — remove Mark Complete assertions, rewrite helper**

In `src/components/__tests__/ExamGauntlet.test.tsx`:

**Rewrite `startAndFinishExam` helper** (lines 344-363) — remove the Mark Complete loop:

```typescript
async function startAndFinishExam() {
  render(<ExamGauntlet onExit={mockOnExit} />);
  fireEvent.click(screen.getByText("Start Exam"));

  await waitFor(() => {
    expect(screen.getByText("Finish Exam")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Finish Exam"));
}
```

**Delete test** "should show launch and mark complete buttons for scenarios" (lines 254-262). Replace with:

```typescript
it("should show launch buttons for scenarios but no mark complete", async () => {
  await startExam();
  const launchButtons = screen.getAllByText("Launch");
  expect(launchButtons.length).toBeGreaterThan(0);
  expect(screen.queryByText("Mark Complete")).not.toBeInTheDocument();
});
```

**Delete test** "should mark scenario as complete when mark complete is clicked" (lines 264-272).

**Update test** "should display score percentage" (line 370-373) — without Mark Complete, all scores will be 0%:

```typescript
it("should display score percentage", async () => {
  await startAndFinishExam();
  expect(screen.getByText("0%")).toBeInTheDocument();
});
```

**Update test** "should show passing message when score >= 70%" (lines 375-378) — this can no longer be tested without real scenario completion. Change to test the failing case:

```typescript
it("should show not passing message when no scenarios completed", async () => {
  await startAndFinishExam();
  expect(screen.queryByText("Exam Passed!")).not.toBeInTheDocument();
});
```

**Update test** "should show scenario results" (lines 385-391):

```typescript
it("should show scenario results", async () => {
  await startAndFinishExam();
  expect(screen.getByText("Scenario Results")).toBeInTheDocument();
  expect(screen.getAllByText("Incomplete").length).toBeGreaterThan(0);
});
```

**Update test** "should record gauntlet attempt when finishing exam" (lines 430-440):

```typescript
it("should record gauntlet attempt when finishing exam", async () => {
  await startAndFinishExam();
  expect(mockRecordGauntletAttempt).toHaveBeenCalledWith(
    expect.objectContaining({
      score: 0,
      totalQuestions: 5,
    }),
  );
});
```

**Delete test** "should mark complete from detail view" (lines 523-549).

**Rewrite test** "should calculate correct score with scenario completion" (lines 553-575) — without Mark Complete, score is always 0:

```typescript
it("should calculate score as 0% with no completions", async () => {
  await startAndFinishExam();
  expect(screen.getByText("0%")).toBeInTheDocument();
});
```

**Rewrite test** "should record gauntlet attempt with correct domain breakdown" (lines 577-602):

```typescript
it("should record gauntlet attempt with domain breakdown", async () => {
  await startAndFinishExam();
  expect(mockRecordGauntletAttempt).toHaveBeenCalledWith(
    expect.objectContaining({
      domainBreakdown: expect.any(Object),
      score: 0,
      totalQuestions: 5,
      timeSpentSeconds: expect.any(Number),
    }),
  );
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/components/__tests__/ExamGauntlet.test.tsx --reporter=verbose`
Expected: All PASS.

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/ExamGauntlet.tsx src/components/__tests__/ExamGauntlet.test.tsx
git commit -m "fix: remove gauntlet Mark Complete — require actual scenario completion"
```

---

## Chunk 4: Sandbox Isolation (Tasks 6-7)

---

### Task 6: Snapshot/restore global cluster on scenario entry/exit

`exitScenario()` calls `clearAllFaults()` which hard-resets all GPUs to arbitrary defaults (`temperature: 45`, `powerDraw: 300`, `utilization: 0`), destroying any pre-scenario simulator state. Instead, snapshot the cluster before entering a scenario and restore it on exit.

**Files:**

- Modify: `src/store/simulationStore.ts:66-90` (add `_clusterSnapshot` to state)
- Modify: `src/store/simulationStore.ts:368-407` (`loadScenario` — add snapshot)
- Modify: `src/store/simulationStore.ts:476-486` (`exitScenario` — restore snapshot)
- Test: `src/store/__tests__/simulationStore.test.ts`

**Hazards:** See H4 (action is `loadScenario`), H5 (`partialize` auto-excludes new fields), H7 (`clearAllFaults` only called here).

- [ ] **Step 1: Write the failing test**

In `src/store/__tests__/simulationStore.test.ts`, add:

```typescript
describe("scenario snapshot/restore", () => {
  it("restores pre-scenario cluster state on exit instead of resetting to defaults", () => {
    const store = useSimulationStore.getState();
    const nodeId = store.cluster.nodes[0].id;

    // Set a non-default GPU temperature before starting scenario
    store.updateGPU(nodeId, 0, { temperature: 72 });
    expect(
      useSimulationStore.getState().cluster.nodes[0].gpus[0].temperature,
    ).toBe(72);

    // Load a scenario (should snapshot)
    store.loadScenario({
      id: "test-snapshot",
      title: "Test",
      domain: 1,
      steps: [
        {
          id: "step-1",
          title: "Test step",
          situation: "Test",
          task: "Test",
          expectedCommands: [],
          hints: [],
          validation: {
            type: "command-executed" as const,
            description: "test",
          },
          validationRules: [],
        },
      ],
    } as any);

    // Modify GPU during scenario
    store.updateGPU(nodeId, 0, { temperature: 95 });
    expect(
      useSimulationStore.getState().cluster.nodes[0].gpus[0].temperature,
    ).toBe(95);

    // Exit scenario (should restore snapshot, not reset to 45)
    store.exitScenario();

    // Wait for async cleanup to complete
    const postTemp =
      useSimulationStore.getState().cluster.nodes[0].gpus[0].temperature;
    expect(postTemp).toBe(72); // Restored to pre-scenario value, NOT 45 (clearAllFaults default)
  });

  it("does not break if exiting with no snapshot", () => {
    const store = useSimulationStore.getState();
    // Exit without loading a scenario — should not throw
    expect(() => store.exitScenario()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/simulationStore.test.ts --reporter=verbose`
Expected: FAIL — temperature is 45 (clearAllFaults default) instead of 72.

- [ ] **Step 3: Add `_clusterSnapshot` to initial state**

In `src/store/simulationStore.ts`, in the initial state block (around line 185-195), add:

```typescript
_clusterSnapshot: null as ClusterConfig | null,
```

This does NOT need to be added to the `SimulationState` interface — it's internal-only state that the component layer should never read. Immer allows additional properties on the state object.

**Alternative (if TypeScript complains):** Add to the interface as:

```typescript
/** @internal snapshot of cluster before scenario entry */
_clusterSnapshot: ClusterConfig | null;
```

- [ ] **Step 4: Snapshot cluster in `loadScenario`**

In `src/store/simulationStore.ts`, at the beginning of `loadScenario` (line 368-370), add the snapshot before the `set()` call:

```typescript
loadScenario: (scenario) => {
  // Snapshot current cluster for restore on scenario exit
  const snapshot = JSON.parse(JSON.stringify(get().cluster)) as ClusterConfig;

  set((state) => {
    state._clusterSnapshot = snapshot;
    state.activeScenario = scenario;
    // ... rest of existing code unchanged
```

**Why `JSON.parse(JSON.stringify())`:** Deep clone that's safe for this data (it's all serializable — no functions, dates, or circular refs in ClusterConfig).

- [ ] **Step 5: Restore snapshot in `exitScenario`**

Replace `exitScenario` (lines 476-486):

```typescript
exitScenario: () => {
  const snapshot = get()._clusterSnapshot;

  set((state) => {
    state.activeScenario = null;
    state.quizResults = {};
    if (snapshot) {
      state.cluster = JSON.parse(JSON.stringify(snapshot)) as ClusterConfig;
    }
    state._clusterSnapshot = null;
  });

  // Clean up sandbox contexts (dynamic import to avoid circular deps)
  import("@/store/scenarioContext").then(({ scenarioContextManager }) => {
    scenarioContextManager.clearAll();
  });
},
```

**Key changes:**

- Restores `cluster` from snapshot instead of calling `clearAllFaults()`
- If no snapshot (defensive), cluster is left as-is
- `clearAllFaults()` is no longer imported or called
- `scenarioContextManager.clearAll()` still runs to clean up sandbox contexts
- Changed from `Promise.all` (which imported both modules) to single `import` (only need scenarioContext now)

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/simulationStore.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass. If any scenarioLoader test imports `clearAllFaults` and tests it via `exitScenario`, it may need updating — but exploration confirmed tests only test `clearAllFaults` directly, not through `exitScenario`.

- [ ] **Step 8: Commit**

```bash
git add src/store/simulationStore.ts src/store/__tests__/simulationStore.test.ts
git commit -m "fix: snapshot/restore cluster on scenario entry/exit instead of clearAllFaults reset"
```

---

### Task 7: Bind terminal scenario context on `activeScenario.id`

The Terminal effect that installs scenario context depends only on `[cluster]`, but scenario startup can activate a sandbox without triggering a `cluster` change. This means commands can miss scenario faults or mutate the wrong state.

**Files:**

- Modify: `src/components/Terminal.tsx:197,238`

- [ ] **Step 1: Add `activeScenarioId` to the component's store subscriptions**

In `src/components/Terminal.tsx`, near the top of the component (around line 197 where other store subscriptions are), add:

```typescript
const activeScenarioId = useSimulationStore(
  (state) => state.activeScenario?.id ?? null,
);
```

**Use a selector** (not bare `useSimulationStore()`) to avoid re-rendering on every store change. The `?? null` ensures a stable value when no scenario is active.

- [ ] **Step 2: Add `activeScenarioId` to the effect dependency array**

In `src/components/Terminal.tsx`, line 238, change:

```typescript
// OLD
}, [cluster]);
```

to:

```typescript
// NEW
}, [cluster, activeScenarioId]);
```

This ensures the effect re-runs both when:

- The cluster changes (existing behavior)
- A scenario is started/stopped (new — fixes the race condition)

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass. Terminal tests may not directly exercise this effect, but we need to ensure no regressions.

- [ ] **Step 4: Verify visually (manual check)**

Run `npm run dev`, start a scenario from the mission panel, and verify the terminal shows scenario-specific faults in command output (e.g., `nvidia-smi` shows injected faults).

- [ ] **Step 5: Commit**

```bash
git add src/components/Terminal.tsx
git commit -m "fix: rebind terminal scenario context on activeScenario change"
```

---

## Chunk 5: Dead Controls Fix (Task 8)

---

### Task 8: Wire up question flagging in ExamWorkspace

`handleToggleFlag()` builds a new flagged list but never persists it — has a TODO comment "we'd need to add this action". Add a `toggleQuestionFlag` store action and connect the handler.

**Files:**

- Modify: `src/store/simulationStore.ts:155-163` (interface — add action)
- Modify: `src/store/simulationStore.ts:618` (implementation — add action after `submitExamAnswer`)
- Modify: `src/components/ExamWorkspace.tsx:81,137-152`
- Modify: `src/components/__tests__/ExamWorkspace.test.tsx:52,62` (add mock)
- Test: `src/store/__tests__/simulationStore.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/store/__tests__/simulationStore.test.ts`, add:

```typescript
describe("toggleQuestionFlag", () => {
  it("adds question to flaggedQuestions", () => {
    const store = useSimulationStore.getState();
    store.startExam("test-exam");
    store.toggleQuestionFlag("q1");

    const { activeExam } = useSimulationStore.getState();
    expect(activeExam?.flaggedQuestions).toContain("q1");
  });

  it("removes question from flaggedQuestions if already flagged", () => {
    const store = useSimulationStore.getState();
    store.startExam("test-exam");
    store.toggleQuestionFlag("q1");
    store.toggleQuestionFlag("q1");

    const { activeExam } = useSimulationStore.getState();
    expect(activeExam?.flaggedQuestions).not.toContain("q1");
  });

  it("does nothing if no active exam", () => {
    const store = useSimulationStore.getState();
    // No exam started — should not throw
    expect(() => store.toggleQuestionFlag("q1")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/simulationStore.test.ts --reporter=verbose`
Expected: FAIL — `toggleQuestionFlag` is not a function.

- [ ] **Step 3: Add `toggleQuestionFlag` to the store interface**

In `src/store/simulationStore.ts`, after line 161 (`submitExamAnswer`), add:

```typescript
toggleQuestionFlag: (questionId: string) => void;
```

The exam actions section should now read:

```typescript
// Exam actions
startExam: (examId: string) => void;
submitExamAnswer: (
  questionId: string,
  answer: number | number[] | string,
) => void;
toggleQuestionFlag: (questionId: string) => void;
endExam: (breakdown: ExamBreakdown) => ExamBreakdown | null;
exitExam: () => void;
```

- [ ] **Step 4: Add `toggleQuestionFlag` implementation**

In `src/store/simulationStore.ts`, after the `submitExamAnswer` action (after line 618), add:

```typescript
toggleQuestionFlag: (questionId) =>
  set((state) => {
    if (!state.activeExam) return;
    const idx = state.activeExam.flaggedQuestions.indexOf(questionId);
    if (idx >= 0) {
      state.activeExam.flaggedQuestions.splice(idx, 1);
    } else {
      state.activeExam.flaggedQuestions.push(questionId);
    }
  }),
```

- [ ] **Step 5: Run store test to verify it passes**

Run: `npx vitest run src/store/__tests__/simulationStore.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Update ExamWorkspace to use the store action**

In `src/components/ExamWorkspace.tsx`:

**Line 81** — add `toggleQuestionFlag` to the destructure:

```typescript
const {
  activeExam,
  startExam,
  submitExamAnswer,
  endExam,
  exitExam,
  toggleQuestionFlag,
} = useSimulationStore();
```

**Lines 137-152** — replace `handleToggleFlag`:

```typescript
const handleToggleFlag = () => {
  if (!activeExam) return;
  const currentQuestion = questions[currentQuestionIdx];
  toggleQuestionFlag(currentQuestion.id);
};
```

- [ ] **Step 7: Update ExamWorkspace test mock**

In `src/components/__tests__/ExamWorkspace.test.tsx`:

**After line 52**, add:

```typescript
const mockToggleQuestionFlag = vi.fn();
```

**In the store mock (line 62)**, add:

```typescript
toggleQuestionFlag: mockToggleQuestionFlag,
```

Also add to `beforeEach`: `mockToggleQuestionFlag.mockClear();`

- [ ] **Step 8: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/store/simulationStore.ts src/components/ExamWorkspace.tsx src/store/__tests__/simulationStore.test.ts src/components/__tests__/ExamWorkspace.test.tsx
git commit -m "fix: wire up question flagging to store action"
```

---

## Final Verification

After all 8 tasks:

- [ ] **Run full build:** `npm run build`
      Expected: Clean build, no TypeScript errors.

- [ ] **Run full test suite:** `npm run test:run`
      Expected: All tests pass.

- [ ] **Run linter:** `npm run lint`
      Expected: 0 errors, 0 warnings.

- [ ] **Quick smoke test:** `npm run dev`
  - Start a practice exam → submit → verify results show real scores (not all zeros)
  - Open Performance Benchmark → verify percentile is not stuck at 90th
  - Start a scenario → exit → verify terminal returns to normal state (not all 45°C/0% util)
  - Start gauntlet → verify no "Mark Complete" buttons appear

- [ ] **Create PR**

---

## Execution Order Summary

```
Chunk 1 — Exam Scoring Pipeline (sequential, each depends on prior):
  Task 1: endExam() accepts real breakdown         [Critical]  → store + interface
  Task 2: ExamWorkspace passes breakdown            [Critical]  → 1-line fix
  Task 3: addExamAttempt() called on submit         [High]      → wire-up + test mock

Chunk 2 — Analytics:
  Task 4: Fix readiness *100 bug + memo deps        [High]      → component + test mocks

Chunk 3 — Gauntlet:
  Task 5: Remove gauntlet Mark Complete             [Critical]  → component + rewrite 7 tests

Chunk 4 — Sandbox Isolation (sequential):
  Task 6: Snapshot/restore cluster on exit          [High]      → store actions
  Task 7: Terminal scenario context binding         [High]      → effect deps

Chunk 5 — Dead Controls:
  Task 8: Wire up question flagging                 [Medium]    → new store action + component
```

**Parallelization:** Chunks 2, 3, 4, and 5 are independent of each other and can be worked on in parallel. Only Chunk 1 must complete before Chunk 2 (since PerformanceBenchmark reads `examAttempts` which Task 3 fixes). Actually, Chunk 2 only fixes the \*100 display bug — it doesn't depend on examAttempts being populated. So **all chunks can run in parallel** as long as Tasks 1→2→3 are sequential within Chunk 1.
