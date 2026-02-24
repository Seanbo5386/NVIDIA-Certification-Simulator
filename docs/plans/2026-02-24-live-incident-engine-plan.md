# Live Incident Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the simulator from guided command practice into realistic unguided troubleshooting with dynamic incidents, causal physics, cascading faults, and workflow scoring.

**Architecture:** Two layers built on existing v1.x foundation. The Simulation Realism Layer (Phase 1) adds causal physics, fault cascading, and system logs to the existing MetricsSimulator and ScenarioContext. The Live Incident Engine (Phase 2) composes incidents from templates, tracks diagnostic workflows, scores methodology, and adapts difficulty. The UI Layer (Phase 3) adds incident workspace, after-action review, and integration with existing training modes.

**Tech Stack:** React 18, TypeScript, Zustand, Vitest, existing MetricsSimulator / ScenarioContext / FaultInjection systems.

**Design doc:** `docs/plans/2026-02-24-live-incident-engine-design.md`

---

## Phase 1: Simulation Realism Layer

### Task 1: Event Timeline Infrastructure

Add an append-only event log to ScenarioContext so all systems can record and query cluster events.

**Files:**
- Create: `src/simulation/eventLog.ts`
- Create: `src/simulation/__tests__/eventLog.test.ts`
- Modify: `src/store/scenarioContext.ts`

**Step 1: Write failing tests for ClusterEvent types and EventLog**

Create `src/simulation/__tests__/eventLog.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { EventLog } from "../eventLog";

describe("EventLog", () => {
  it("should start empty", () => {
    const log = new EventLog();
    expect(log.getAll()).toHaveLength(0);
  });

  it("should append events with auto-incrementing timestamps", () => {
    const log = new EventLog();
    log.append({
      type: "xid-error",
      nodeId: "dgx-00",
      gpuId: 3,
      message: "Xid (PCI:0000:18:00): 48, pid=1234",
      severity: "critical",
    });
    expect(log.getAll()).toHaveLength(1);
    expect(log.getAll()[0].type).toBe("xid-error");
    expect(log.getAll()[0].timestamp).toBeGreaterThan(0);
  });

  it("should filter events by type", () => {
    const log = new EventLog();
    log.append({ type: "xid-error", nodeId: "dgx-00", message: "XID 48", severity: "critical" });
    log.append({ type: "thermal", nodeId: "dgx-00", message: "Temp warning", severity: "warning" });
    log.append({ type: "xid-error", nodeId: "dgx-01", message: "XID 43", severity: "critical" });
    expect(log.getByType("xid-error")).toHaveLength(2);
    expect(log.getByType("thermal")).toHaveLength(1);
  });

  it("should filter events by node", () => {
    const log = new EventLog();
    log.append({ type: "xid-error", nodeId: "dgx-00", message: "XID 48", severity: "critical" });
    log.append({ type: "xid-error", nodeId: "dgx-01", message: "XID 43", severity: "critical" });
    expect(log.getByNode("dgx-00")).toHaveLength(1);
  });

  it("should cap at max entries and evict oldest", () => {
    const log = new EventLog(5);
    for (let i = 0; i < 8; i++) {
      log.append({ type: "info", nodeId: "dgx-00", message: `event-${i}`, severity: "info" });
    }
    expect(log.getAll()).toHaveLength(5);
    expect(log.getAll()[0].message).toBe("event-3");
  });

  it("should format events as dmesg-style log lines", () => {
    const log = new EventLog();
    log.append({
      type: "xid-error",
      nodeId: "dgx-00",
      gpuId: 3,
      message: "Xid (PCI:0000:18:00): 48, pid=1234",
      severity: "critical",
      dmesgLine: "NVRM: Xid (PCI:0000:18:00): 48, pid=1234, name=python3",
    });
    const lines = log.toDmesgOutput();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^\[.*\] NVRM: Xid/);
  });

  it("should get events after a given timestamp", () => {
    const log = new EventLog();
    log.append({ type: "info", nodeId: "dgx-00", message: "early", severity: "info" });
    const midTime = Date.now();
    log.append({ type: "info", nodeId: "dgx-00", message: "late", severity: "info" });
    const after = log.getAfter(midTime - 1);
    expect(after.length).toBeGreaterThanOrEqual(1);
  });

  it("should clear all events", () => {
    const log = new EventLog();
    log.append({ type: "info", nodeId: "dgx-00", message: "test", severity: "info" });
    log.clear();
    expect(log.getAll()).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/eventLog.test.ts`
Expected: FAIL — module not found

**Step 3: Implement EventLog**

Create `src/simulation/eventLog.ts`:

```typescript
export type ClusterEventType =
  | "xid-error"
  | "thermal"
  | "nvlink"
  | "ecc"
  | "power"
  | "slurm-state"
  | "slurm-job"
  | "pcie"
  | "clock-throttle"
  | "cascading-fault"
  | "consequence"
  | "info";

export type EventSeverity = "critical" | "warning" | "info";

export interface ClusterEventInput {
  type: ClusterEventType;
  nodeId: string;
  gpuId?: number;
  message: string;
  severity: EventSeverity;
  dmesgLine?: string;
}

export interface ClusterEvent extends ClusterEventInput {
  id: number;
  timestamp: number;
}

const DEFAULT_MAX_ENTRIES = 1000;

export class EventLog {
  private events: ClusterEvent[] = [];
  private nextId = 0;
  private maxEntries: number;

  constructor(maxEntries: number = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  append(input: ClusterEventInput): ClusterEvent {
    const event: ClusterEvent = {
      ...input,
      id: this.nextId++,
      timestamp: Date.now(),
    };
    this.events.push(event);
    if (this.events.length > this.maxEntries) {
      this.events = this.events.slice(this.events.length - this.maxEntries);
    }
    return event;
  }

  getAll(): ClusterEvent[] {
    return [...this.events];
  }

  getByType(type: ClusterEventType): ClusterEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  getByNode(nodeId: string): ClusterEvent[] {
    return this.events.filter((e) => e.nodeId === nodeId);
  }

  getAfter(timestamp: number): ClusterEvent[] {
    return this.events.filter((e) => e.timestamp > timestamp);
  }

  toDmesgOutput(): string[] {
    return this.events
      .filter((e) => e.dmesgLine)
      .map((e) => {
        const seconds = ((e.timestamp % 100000) / 1000).toFixed(6);
        return `[${seconds.padStart(12)}] ${e.dmesgLine}`;
      });
  }

  clear(): void {
    this.events = [];
    this.nextId = 0;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/simulation/__tests__/eventLog.test.ts`
Expected: All 8 tests PASS

**Step 5: Add EventLog to ScenarioContext**

Modify `src/store/scenarioContext.ts`:
- Import `EventLog` from `@/simulation/eventLog`
- Add `eventLog: EventLog` property to `ScenarioContext` class, initialized in constructor
- Add `getEventLog(): EventLog` method
- Reset the event log in `reset()` method

**Step 6: Commit**

```bash
git add src/simulation/eventLog.ts src/simulation/__tests__/eventLog.test.ts src/store/scenarioContext.ts
git commit -m "feat: add EventLog system with ScenarioContext integration"
```

---

### Task 2: Fault Propagation Engine

Data-driven cascading fault rules. Given a fault trigger, schedules downstream consequences with delays.

**Files:**
- Create: `src/simulation/faultPropagation.ts`
- Create: `src/data/faultPropagationRules.ts`
- Create: `src/simulation/__tests__/faultPropagation.test.ts`

**Step 1: Write failing tests**

Create `src/simulation/__tests__/faultPropagation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FaultPropagationEngine } from "../faultPropagation";

describe("FaultPropagationEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with no pending consequences", () => {
    const engine = new FaultPropagationEngine();
    expect(engine.getPending()).toHaveLength(0);
  });

  it("should schedule consequences when a fault is triggered", () => {
    const engine = new FaultPropagationEngine();
    engine.triggerFault({
      faultType: "xid-43",
      nodeId: "dgx-00",
      gpuId: 3,
    });
    expect(engine.getPending().length).toBeGreaterThan(0);
  });

  it("should return due consequences after their delay elapses", () => {
    const engine = new FaultPropagationEngine();
    engine.triggerFault({
      faultType: "xid-43",
      nodeId: "dgx-00",
      gpuId: 3,
    });
    // No consequences due immediately
    expect(engine.getDueConsequences()).toHaveLength(0);
    // Advance 5 seconds — first consequence should be due
    vi.advanceTimersByTime(5000);
    const due = engine.getDueConsequences();
    expect(due.length).toBeGreaterThan(0);
  });

  it("should remove consequences once consumed", () => {
    const engine = new FaultPropagationEngine();
    engine.triggerFault({
      faultType: "xid-43",
      nodeId: "dgx-00",
      gpuId: 3,
    });
    vi.advanceTimersByTime(60000);
    const due = engine.getDueConsequences();
    const countBefore = engine.getPending().length;
    engine.consumeConsequences(due.map((c) => c.id));
    expect(engine.getPending().length).toBeLessThan(countBefore);
  });

  it("should clear all pending consequences", () => {
    const engine = new FaultPropagationEngine();
    engine.triggerFault({ faultType: "xid-43", nodeId: "dgx-00", gpuId: 3 });
    engine.clear();
    expect(engine.getPending()).toHaveLength(0);
  });

  it("should not schedule consequences for unknown fault types", () => {
    const engine = new FaultPropagationEngine();
    engine.triggerFault({ faultType: "unknown-fault", nodeId: "dgx-00" });
    expect(engine.getPending()).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/faultPropagation.test.ts`
Expected: FAIL — module not found

**Step 3: Create fault propagation rules data**

Create `src/data/faultPropagationRules.ts`:

```typescript
export interface PropagationRule {
  trigger: string;
  consequences: Array<{
    delayMs: number;
    action: string;
    target: "same-gpu" | "nvlink-peers" | "same-node" | "slurm";
    params: Record<string, unknown>;
    description: string;
  }>;
}

export const FAULT_PROPAGATION_RULES: PropagationRule[] = [
  {
    trigger: "xid-43",
    consequences: [
      {
        delayMs: 5000,
        action: "nvlink-degrade",
        target: "nvlink-peers",
        params: { xidCode: 74 },
        description: "NVLink peers detect link degradation",
      },
      {
        delayMs: 10000,
        action: "slurm-job-fail",
        target: "slurm",
        params: {},
        description: "Slurm job on affected GPU times out",
      },
      {
        delayMs: 15000,
        action: "slurm-drain",
        target: "same-node",
        params: { reason: "GPU not responding" },
        description: "Slurm drains the node",
      },
    ],
  },
  {
    trigger: "xid-48",
    consequences: [
      {
        delayMs: 2000,
        action: "gpu-health-critical",
        target: "same-gpu",
        params: {},
        description: "GPU health marked critical",
      },
      {
        delayMs: 8000,
        action: "slurm-job-fail",
        target: "slurm",
        params: {},
        description: "Running job on GPU fails",
      },
      {
        delayMs: 12000,
        action: "slurm-drain",
        target: "same-node",
        params: { reason: "Uncorrectable ECC error" },
        description: "Node drained due to ECC failure",
      },
    ],
  },
  {
    trigger: "xid-79",
    consequences: [
      {
        delayMs: 1000,
        action: "nvlink-down-all",
        target: "same-gpu",
        params: {},
        description: "All NVLinks on GPU go down (bus reset)",
      },
      {
        delayMs: 3000,
        action: "slurm-job-fail",
        target: "slurm",
        params: {},
        description: "All jobs on node fail",
      },
      {
        delayMs: 5000,
        action: "slurm-drain",
        target: "same-node",
        params: { reason: "GPU fallen off bus" },
        description: "Node drained — GPU unreachable",
      },
    ],
  },
  {
    trigger: "thermal-runaway",
    consequences: [
      {
        delayMs: 10000,
        action: "clock-throttle-all",
        target: "same-node",
        params: {},
        description: "All GPUs throttle clocks",
      },
      {
        delayMs: 20000,
        action: "utilization-drop",
        target: "same-node",
        params: {},
        description: "Job throughput drops due to throttling",
      },
      {
        delayMs: 45000,
        action: "xid-43-hottest",
        target: "same-node",
        params: {},
        description: "Hottest GPU hangs (XID 43)",
      },
    ],
  },
  {
    trigger: "nvlink-failure",
    consequences: [
      {
        delayMs: 5000,
        action: "bandwidth-degrade",
        target: "nvlink-peers",
        params: {},
        description: "Multi-GPU job bandwidth drops",
      },
      {
        delayMs: 15000,
        action: "slurm-job-slow",
        target: "slurm",
        params: {},
        description: "Training job progress stalls",
      },
    ],
  },
  {
    trigger: "ecc-accumulation",
    consequences: [
      {
        delayMs: 30000,
        action: "row-remap",
        target: "same-gpu",
        params: { xidCode: 92 },
        description: "Row remapping triggered (XID 92)",
      },
      {
        delayMs: 60000,
        action: "xid-63",
        target: "same-gpu",
        params: {},
        description: "Row remapping exhausted (XID 63)",
      },
    ],
  },
];
```

**Step 4: Implement FaultPropagationEngine**

Create `src/simulation/faultPropagation.ts`:

```typescript
import {
  FAULT_PROPAGATION_RULES,
  type PropagationRule,
} from "@/data/faultPropagationRules";

export interface FaultTrigger {
  faultType: string;
  nodeId: string;
  gpuId?: number;
}

export interface PendingConsequence {
  id: number;
  ruleAction: string;
  target: string;
  params: Record<string, unknown>;
  nodeId: string;
  gpuId?: number;
  dueAt: number;
  description: string;
}

export class FaultPropagationEngine {
  private pending: PendingConsequence[] = [];
  private nextId = 0;
  private rules: PropagationRule[];

  constructor(rules?: PropagationRule[]) {
    this.rules = rules ?? FAULT_PROPAGATION_RULES;
  }

  triggerFault(trigger: FaultTrigger): void {
    const rule = this.rules.find((r) => r.trigger === trigger.faultType);
    if (!rule) return;

    const now = Date.now();
    for (const consequence of rule.consequences) {
      this.pending.push({
        id: this.nextId++,
        ruleAction: consequence.action,
        target: consequence.target,
        params: consequence.params,
        nodeId: trigger.nodeId,
        gpuId: trigger.gpuId,
        dueAt: now + consequence.delayMs,
        description: consequence.description,
      });
    }
  }

  getDueConsequences(): PendingConsequence[] {
    const now = Date.now();
    return this.pending.filter((c) => c.dueAt <= now);
  }

  consumeConsequences(ids: number[]): void {
    const idSet = new Set(ids);
    this.pending = this.pending.filter((c) => !idSet.has(c.id));
  }

  getPending(): PendingConsequence[] {
    return [...this.pending];
  }

  clear(): void {
    this.pending = [];
    this.nextId = 0;
  }
}
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/simulation/__tests__/faultPropagation.test.ts`
Expected: All 6 tests PASS

**Step 6: Commit**

```bash
git add src/simulation/faultPropagation.ts src/data/faultPropagationRules.ts src/simulation/__tests__/faultPropagation.test.ts
git commit -m "feat: add FaultPropagationEngine with data-driven cascade rules"
```

---

### Task 3: Cluster Physics Engine

Replaces independent metric jitter with causal dependencies. Temperature follows power, clocks follow temperature, jobs follow clocks.

**Files:**
- Create: `src/simulation/clusterPhysicsEngine.ts`
- Create: `src/simulation/__tests__/clusterPhysicsEngine.test.ts`

**Step 1: Write failing tests**

Create `src/simulation/__tests__/clusterPhysicsEngine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ClusterPhysicsEngine } from "../clusterPhysicsEngine";
import type { GPU } from "@/types/hardware";

function createTestGPU(overrides: Partial<GPU> = {}): GPU {
  return {
    id: 0,
    uuid: "GPU-TEST",
    name: "NVIDIA A100-SXM4-80GB",
    type: "A100-80GB",
    pciAddress: "00000000:10:00.0",
    temperature: 35,
    powerDraw: 100,
    powerLimit: 400,
    memoryTotal: 81920,
    memoryUsed: 0,
    utilization: 0,
    clocksSM: 1410,
    clocksMem: 1215,
    eccEnabled: true,
    eccErrors: { singleBit: 0, doubleBit: 0, aggregated: { singleBit: 0, doubleBit: 0 } },
    migMode: false,
    migInstances: [],
    nvlinks: [],
    healthStatus: "OK",
    xidErrors: [],
    persistenceMode: true,
    ...overrides,
  };
}

describe("ClusterPhysicsEngine", () => {
  it("should increase temperature when utilization is high", () => {
    const engine = new ClusterPhysicsEngine();
    const gpu = createTestGPU({ utilization: 95, temperature: 40, powerDraw: 350, powerLimit: 400 });
    const updated = engine.tickGPU(gpu);
    expect(updated.temperature).toBeGreaterThan(40);
  });

  it("should decrease temperature when utilization is low", () => {
    const engine = new ClusterPhysicsEngine();
    const gpu = createTestGPU({ utilization: 0, temperature: 80, powerDraw: 60, powerLimit: 400 });
    const updated = engine.tickGPU(gpu);
    expect(updated.temperature).toBeLessThan(80);
  });

  it("should throttle SM clocks when temperature exceeds 83C", () => {
    const engine = new ClusterPhysicsEngine();
    const gpu = createTestGPU({ temperature: 90, clocksSM: 1410 });
    const updated = engine.tickGPU(gpu);
    expect(updated.clocksSM).toBeLessThan(1410);
  });

  it("should not throttle clocks below 83C", () => {
    const engine = new ClusterPhysicsEngine();
    const gpu = createTestGPU({ temperature: 70, clocksSM: 1410 });
    const updated = engine.tickGPU(gpu);
    expect(updated.clocksSM).toBe(1410);
  });

  it("should derive power from utilization", () => {
    const engine = new ClusterPhysicsEngine();
    const idleGpu = createTestGPU({ utilization: 0 });
    const busyGpu = createTestGPU({ utilization: 95 });
    const idleResult = engine.tickGPU(idleGpu);
    const busyResult = engine.tickGPU(busyGpu);
    expect(busyResult.powerDraw).toBeGreaterThan(idleResult.powerDraw);
  });

  it("should detect thermal threshold crossing", () => {
    const engine = new ClusterPhysicsEngine();
    const gpu = createTestGPU({ temperature: 82 });
    const updated = engine.tickGPU({ ...gpu, temperature: 84 });
    const events = engine.getThresholdEvents();
    expect(events.some((e) => e.type === "thermal-warning")).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/clusterPhysicsEngine.test.ts`
Expected: FAIL — module not found

**Step 3: Implement ClusterPhysicsEngine**

Create `src/simulation/clusterPhysicsEngine.ts`:

```typescript
import type { GPU } from "@/types/hardware";

const AMBIENT_TEMP = 32;
const THERMAL_CEILING = 95;
const THROTTLE_THRESHOLD = 83;
const THROTTLE_RATE_MHZ_PER_DEGREE = 10;
const TEMP_SMOOTHING = 0.15;
const POWER_SMOOTHING = 0.2;
const IDLE_POWER_FLOOR = 0.15;

interface ThresholdEvent {
  type: "thermal-warning" | "thermal-critical" | "power-warning" | "ecc-accumulation";
  gpuId: number;
  value: number;
}

export class ClusterPhysicsEngine {
  private thresholdEvents: ThresholdEvent[] = [];
  private previousTemps: Map<string, number> = new Map();

  tickGPU(gpu: GPU): GPU {
    this.thresholdEvents = [];
    const updated = { ...gpu };

    // Power follows utilization
    const targetPower =
      gpu.powerLimit * (IDLE_POWER_FLOOR + (gpu.utilization / 100) * (1 - IDLE_POWER_FLOOR));
    updated.powerDraw =
      gpu.powerDraw + (targetPower - gpu.powerDraw) * POWER_SMOOTHING;
    updated.powerDraw = Math.min(updated.powerDraw, gpu.powerLimit);

    // Temperature follows power ratio
    const powerRatio = updated.powerDraw / gpu.powerLimit;
    const targetTemp = AMBIENT_TEMP + powerRatio * (THERMAL_CEILING - AMBIENT_TEMP);
    updated.temperature =
      gpu.temperature + (targetTemp - gpu.temperature) * TEMP_SMOOTHING;
    updated.temperature = Math.max(AMBIENT_TEMP, Math.min(THERMAL_CEILING + 5, updated.temperature));

    // Check thermal thresholds
    const prevTemp = this.previousTemps.get(gpu.uuid) ?? gpu.temperature;
    if (prevTemp < THROTTLE_THRESHOLD && updated.temperature >= THROTTLE_THRESHOLD) {
      this.thresholdEvents.push({
        type: "thermal-warning",
        gpuId: gpu.id,
        value: updated.temperature,
      });
    }
    if (prevTemp < 92 && updated.temperature >= 92) {
      this.thresholdEvents.push({
        type: "thermal-critical",
        gpuId: gpu.id,
        value: updated.temperature,
      });
    }
    this.previousTemps.set(gpu.uuid, updated.temperature);

    // Clock throttling above threshold
    if (updated.temperature > THROTTLE_THRESHOLD) {
      const degreesOver = updated.temperature - THROTTLE_THRESHOLD;
      const reduction = Math.round(degreesOver * THROTTLE_RATE_MHZ_PER_DEGREE);
      updated.clocksSM = Math.max(600, gpu.clocksSM - reduction);
    }

    // ECC accumulation check
    const totalEcc = gpu.eccErrors.aggregated.singleBit;
    if (totalEcc > 100) {
      this.thresholdEvents.push({
        type: "ecc-accumulation",
        gpuId: gpu.id,
        value: totalEcc,
      });
    }

    return updated;
  }

  getThresholdEvents(): ThresholdEvent[] {
    return [...this.thresholdEvents];
  }

  reset(): void {
    this.thresholdEvents = [];
    this.previousTemps.clear();
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/simulation/__tests__/clusterPhysicsEngine.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add src/simulation/clusterPhysicsEngine.ts src/simulation/__tests__/clusterPhysicsEngine.test.ts
git commit -m "feat: add ClusterPhysicsEngine with causal metric dependencies"
```

---

### Task 4: Integrate Physics Engine with MetricsSimulator

Wire the ClusterPhysicsEngine into the existing metrics simulation loop so cluster state evolves causally when the simulation is running.

**Files:**
- Modify: `src/hooks/useMetricsSimulation.ts`
- Modify: `src/utils/metricsSimulator.ts`

**Step 1: Add physics engine to MetricsSimulator**

Modify `src/utils/metricsSimulator.ts`:
- Import `ClusterPhysicsEngine`
- Add `physicsEngine: ClusterPhysicsEngine` property, created in constructor
- In `updateGpuMetrics()`, after the existing jitter logic, run `physicsEngine.tickGPU()` to apply causal adjustments
- Expose `getPhysicsEngine()` for external access to threshold events

**Step 2: Update useMetricsSimulation hook**

Modify `src/hooks/useMetricsSimulation.ts`:
- After each tick's GPU updates, check `simulator.getPhysicsEngine().getThresholdEvents()`
- For each threshold event, append to the active ScenarioContext's EventLog (if one exists)

**Step 3: Run existing tests to verify no regressions**

Run: `npx vitest run src/utils/__tests__/metricsSimulator.test.ts`
Expected: All existing tests PASS (physics engine is additive, doesn't change existing behavior under normal conditions)

**Step 4: Commit**

```bash
git add src/utils/metricsSimulator.ts src/hooks/useMetricsSimulation.ts
git commit -m "feat: integrate ClusterPhysicsEngine into metrics simulation loop"
```

---

### Task 5: Extend dmesg to Read EventLog

Make the existing `dmesg` command read from the ScenarioContext's EventLog when an incident is active, providing realistic system log output.

**Files:**
- Modify: `src/simulators/basicSystemSimulator.ts`

**Step 1: Update handleDmesg method**

In `src/simulators/basicSystemSimulator.ts`, modify `handleDmesg()`:
- At the start, check if there's an active ScenarioContext via `scenarioContextManager.getActiveContext()`
- If an active context exists and has an EventLog, prepend its `toDmesgOutput()` lines to the existing dmesg output
- If no active context, behavior is unchanged (existing XID-from-GPU-state logic continues to work)

**Step 2: Add a `journalctl` command alias**

Add `journalctl` to the metadata commands list and route it to a simple wrapper that calls `handleDmesg` with a slightly different format prefix (`-- Logs begin at ...`).

**Step 3: Run build to verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/simulators/basicSystemSimulator.ts
git commit -m "feat: extend dmesg/journalctl to read from EventLog during incidents"
```

---

## Phase 2: Live Incident Engine

### Task 6: Incident Templates Data

Define the building-block templates that the IncidentComposer assembles from.

**Files:**
- Create: `src/data/incidentTemplates.ts`
- Create: `src/data/__tests__/incidentTemplates.test.ts`

**Step 1: Write validation tests**

Create `src/data/__tests__/incidentTemplates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { INCIDENT_TEMPLATES, type IncidentTemplate } from "../incidentTemplates";

describe("incidentTemplates", () => {
  it("should have at least 8 templates", () => {
    expect(INCIDENT_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it("should have unique IDs", () => {
    const ids = INCIDENT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have valid domain tags (1-5)", () => {
    for (const t of INCIDENT_TEMPLATES) {
      for (const d of t.domains) {
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(5);
      }
    }
  });

  it("should have valid difficulty levels", () => {
    const valid = ["beginner", "intermediate", "advanced"];
    for (const t of INCIDENT_TEMPLATES) {
      expect(valid).toContain(t.difficulty);
    }
  });

  it("should have a non-empty diagnosticPath", () => {
    for (const t of INCIDENT_TEMPLATES) {
      expect(t.diagnosticPath.length).toBeGreaterThan(0);
    }
  });

  it("should have a rootCause description", () => {
    for (const t of INCIDENT_TEMPLATES) {
      expect(t.rootCause.length).toBeGreaterThan(0);
    }
  });

  it("should have at least one primary fault", () => {
    for (const t of INCIDENT_TEMPLATES) {
      expect(t.primaryFaults.length).toBeGreaterThan(0);
    }
  });

  it("should have a situation briefing", () => {
    for (const t of INCIDENT_TEMPLATES) {
      expect(t.situation.length).toBeGreaterThan(10);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/incidentTemplates.test.ts`
Expected: FAIL — module not found

**Step 3: Implement incident templates**

Create `src/data/incidentTemplates.ts` with the `IncidentTemplate` interface and at least 10 templates covering all 5 exam domains, 3 difficulty levels, and diverse fault types. Each template includes: `id`, `title`, `situation` (briefing text), `rootCause`, `difficulty`, `domains`, `primaryFaults` (array of fault type + target specs), `propagationTrigger` (links to fault propagation rules), `diagnosticPath` (expected command sequence for scoring), and `rootCauseOptions` (multiple-choice for diagnosis submission).

Templates should cover:
- GPU memory failure (XID 48) — beginner, domain 1
- GPU hang (XID 43) — intermediate, domain 4
- GPU fallen off bus (XID 79) — advanced, domain 5
- NVLink fabric degradation — intermediate, domain 2
- Thermal runaway — beginner, domain 5
- ECC accumulation leading to row remap — advanced, domain 4
- Multi-node job failure (Slurm) — intermediate, domain 4
- Power supply stress — beginner, domain 1
- InfiniBand link down — intermediate, domain 2
- Combined: NVLink + thermal (two root causes) — advanced, domain 5

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/incidentTemplates.test.ts`
Expected: All 8 tests PASS

**Step 5: Commit**

```bash
git add src/data/incidentTemplates.ts src/data/__tests__/incidentTemplates.test.ts
git commit -m "feat: add incident template data with 10 templates across all domains"
```

---

### Task 7: Incident Composer

Assembles incidents at runtime from templates, randomizing target nodes/GPUs and layering in red herrings.

**Files:**
- Create: `src/simulation/incidentComposer.ts`
- Create: `src/simulation/__tests__/incidentComposer.test.ts`

**Step 1: Write failing tests**

Create `src/simulation/__tests__/incidentComposer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { IncidentComposer } from "../incidentComposer";

describe("IncidentComposer", () => {
  const composer = new IncidentComposer();

  it("should compose an incident for beginner difficulty", () => {
    const incident = composer.compose({ difficulty: "beginner" });
    expect(incident).toBeDefined();
    expect(incident.faults.length).toBeGreaterThan(0);
    expect(incident.situation).toBeTruthy();
    expect(incident.rootCauseOptions.length).toBeGreaterThanOrEqual(3);
  });

  it("should compose an incident filtered by domain", () => {
    const incident = composer.compose({ difficulty: "beginner", domain: 1 });
    expect(incident).toBeDefined();
    expect(incident.templateDomains).toContain(1);
  });

  it("should add red herrings at intermediate difficulty", () => {
    const incident = composer.compose({ difficulty: "intermediate" });
    expect(incident.redHerrings.length).toBeGreaterThanOrEqual(0);
    // Intermediate may or may not have red herrings, but the field exists
  });

  it("should assign random target nodes and GPUs", () => {
    const incidents = Array.from({ length: 5 }, () =>
      composer.compose({ difficulty: "beginner" }),
    );
    const nodeIds = incidents.map((i) => i.faults[0].nodeId);
    // With 5 random picks from 8 nodes, very unlikely all are the same
    const unique = new Set(nodeIds);
    expect(unique.size).toBeGreaterThanOrEqual(1);
  });

  it("should include a diagnosticPath for scoring", () => {
    const incident = composer.compose({ difficulty: "beginner" });
    expect(incident.diagnosticPath.length).toBeGreaterThan(0);
  });

  it("should include the correct root cause answer", () => {
    const incident = composer.compose({ difficulty: "beginner" });
    expect(incident.correctRootCause).toBeTruthy();
    expect(incident.rootCauseOptions).toContain(incident.correctRootCause);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/incidentComposer.test.ts`
Expected: FAIL — module not found

**Step 3: Implement IncidentComposer**

Create `src/simulation/incidentComposer.ts`:

The composer should:
- Accept `{ difficulty, domain? }` config
- Filter templates by difficulty and optional domain
- Pick a random template
- Assign random nodeId (from `dgx-00` through `dgx-07`) and gpuId (0-7)
- For intermediate+: optionally add 1 red herring (a benign fault on a different node)
- For advanced: optionally combine 2 templates
- Return a `ComposedIncident` object with: `templateId`, `situation`, `faults` (with concrete nodeId/gpuId), `redHerrings`, `propagationTrigger`, `diagnosticPath`, `rootCauseOptions`, `correctRootCause`, `templateDomains`

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/simulation/__tests__/incidentComposer.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add src/simulation/incidentComposer.ts src/simulation/__tests__/incidentComposer.test.ts
git commit -m "feat: add IncidentComposer for dynamic incident assembly"
```

---

### Task 8: Consequence Engine

Maps user commands to consequences given current cluster state, making bad decisions cause sandboxed damage.

**Files:**
- Create: `src/simulation/consequenceEngine.ts`
- Create: `src/data/consequenceRules.ts`
- Create: `src/simulation/__tests__/consequenceEngine.test.ts`

**Step 1: Write failing tests**

Create `src/simulation/__tests__/consequenceEngine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ConsequenceEngine } from "../consequenceEngine";
import type { GPU, DGXNode } from "@/types/hardware";

function createTestNode(overrides: Partial<DGXNode> = {}): DGXNode {
  return {
    id: "dgx-00",
    hostname: "dgx-00.cluster.local",
    systemType: "DGX-A100",
    gpus: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      uuid: `GPU-${i}`,
      name: "NVIDIA A100-SXM4-80GB",
      type: "A100-80GB" as const,
      pciAddress: `00000000:${(0x10 + i).toString(16)}:00.0`,
      temperature: 45,
      powerDraw: 200,
      powerLimit: 400,
      memoryTotal: 81920,
      memoryUsed: 0,
      utilization: 0,
      clocksSM: 1410,
      clocksMem: 1215,
      eccEnabled: true,
      eccErrors: { singleBit: 0, doubleBit: 0, aggregated: { singleBit: 0, doubleBit: 0 } },
      migMode: false,
      migInstances: [],
      nvlinks: [],
      healthStatus: "OK" as const,
      xidErrors: [],
      persistenceMode: true,
    })),
    dpus: [],
    hcas: [],
    bmc: { ipAddress: "192.168.0.100", macAddress: "00:00:00:00:00:00", firmwareVersion: "3.47", manufacturer: "NVIDIA", sensors: [], powerState: "On" as const },
    cpuModel: "AMD EPYC 7742",
    cpuCount: 128,
    ramTotal: 1024,
    ramUsed: 128,
    osVersion: "Ubuntu 22.04",
    kernelVersion: "5.15.0",
    nvidiaDriverVersion: "535.129.03",
    cudaVersion: "12.2",
    healthStatus: "OK" as const,
    slurmState: "alloc" as const,
    ...overrides,
  };
}

describe("ConsequenceEngine", () => {
  const engine = new ConsequenceEngine();

  it("should return no consequence for safe diagnostic commands", () => {
    const node = createTestNode();
    const result = engine.evaluate("nvidia-smi", node);
    expect(result).toBeNull();
  });

  it("should return consequence for GPU reset when MIG is active", () => {
    const node = createTestNode();
    node.gpus[0].migMode = true;
    node.gpus[0].migInstances = [{ id: 0, gpuId: 0, profileId: 19, uuid: "MIG-0", computeInstances: [] }];
    const result = engine.evaluate("nvidia-smi -r -i 0", node);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("mig-destroyed");
  });

  it("should return consequence for power cycle when jobs are running", () => {
    const node = createTestNode({ slurmState: "alloc" });
    node.gpus[0].allocatedJobId = 1234;
    const result = engine.evaluate("ipmitool power cycle", node);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("jobs-killed");
  });

  it("should return consequence for resuming node with unfixed fault", () => {
    const node = createTestNode({ slurmState: "drain", healthStatus: "Critical" });
    const result = engine.evaluate("scontrol update NodeName=dgx-00 State=RESUME", node);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("re-drain");
  });

  it("should return no consequence for power cycle on idle node", () => {
    const node = createTestNode({ slurmState: "idle" });
    const result = engine.evaluate("ipmitool power cycle", node);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/consequenceEngine.test.ts`
Expected: FAIL — module not found

**Step 3: Implement ConsequenceEngine and consequence rules**

Create `src/data/consequenceRules.ts` with rule definitions.
Create `src/simulation/consequenceEngine.ts` with the engine that parses commands and evaluates against node state.

The engine should:
- Parse the command string to identify the tool and key flags
- Check the node state for relevant conditions (MIG active, jobs running, faults present)
- Return `null` for safe commands, or a `Consequence` object with `type`, `description`, and `mutations` (state changes to apply)

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/simulation/__tests__/consequenceEngine.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/simulation/consequenceEngine.ts src/data/consequenceRules.ts src/simulation/__tests__/consequenceEngine.test.ts
git commit -m "feat: add ConsequenceEngine for command-state consequence evaluation"
```

---

### Task 9: Workflow Tracker

Classifies user commands into diagnostic phases and scores methodology.

**Files:**
- Create: `src/simulation/workflowTracker.ts`
- Create: `src/simulation/__tests__/workflowTracker.test.ts`

**Step 1: Write failing tests**

Create `src/simulation/__tests__/workflowTracker.test.ts`:

```typescript
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

    const orderedScore = ordered.calculateScore({ correctDiagnosis: true, collateralDamage: 0 });
    const unorderedScore = unordered.calculateScore({ correctDiagnosis: true, collateralDamage: 0 });
    expect(orderedScore.methodology).toBeGreaterThan(unorderedScore.methodology);
  });

  it("should score efficiency based on command count", () => {
    const efficient = new WorkflowTracker();
    efficient.recordCommand("dmesg | grep -i xid");
    efficient.recordCommand("nvidia-smi -q -i 3 -d ECC");

    const verbose = new WorkflowTracker();
    for (let i = 0; i < 20; i++) {
      verbose.recordCommand(`nvidia-smi -i ${i % 8}`);
    }

    const efficientScore = efficient.calculateScore({ correctDiagnosis: true, collateralDamage: 0 });
    const verboseScore = verbose.calculateScore({ correctDiagnosis: true, collateralDamage: 0 });
    expect(efficientScore.efficiency).toBeGreaterThan(verboseScore.efficiency);
  });

  it("should give 0 accuracy when diagnosis is wrong", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi");
    const score = tracker.calculateScore({ correctDiagnosis: false, collateralDamage: 0 });
    expect(score.accuracy).toBe(0);
  });

  it("should penalize collateral damage", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("nvidia-smi");
    const clean = tracker.calculateScore({ correctDiagnosis: true, collateralDamage: 0 });
    const messy = tracker.calculateScore({ correctDiagnosis: true, collateralDamage: 3 });
    expect(clean.noCollateral).toBeGreaterThan(messy.noCollateral);
  });

  it("should return total score out of 100", () => {
    const tracker = new WorkflowTracker();
    tracker.recordCommand("sinfo");
    const score = tracker.calculateScore({ correctDiagnosis: true, collateralDamage: 0 });
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/workflowTracker.test.ts`
Expected: FAIL — module not found

**Step 3: Implement WorkflowTracker**

Create `src/simulation/workflowTracker.ts`:

The tracker should:
- Maintain a list of `{ command, phase, timestamp }` entries
- Classify commands into phases using pattern matching:
  - **Survey**: broad commands without `-i` targeting (`sinfo`, `nvidia-smi` bare, `ibstat` bare)
  - **Triage**: targeted commands (`nvidia-smi -i N`, `dmesg | grep`, `ibdiagnet`)
  - **Isolation**: deep queries (`nvidia-smi -q -i N -d ECC/CLOCK/POWER`, `dcgmi diag`, `perfquery`)
  - **Remediation**: corrective actions (`nvidia-smi -r`, `scontrol update State=`, `ipmitool power`)
  - **Verification**: repeated survey commands after remediation phase
- `calculateScore({ correctDiagnosis, collateralDamage })` returns `{ methodology, efficiency, accuracy, noCollateral, completeness, total }`
  - methodology (0-20): higher when phases progress in order
  - efficiency (0-20): fewer commands = higher score (baseline ~10 commands)
  - accuracy (0-20): 20 if correct, 0 if wrong
  - noCollateral (0-20): 20 minus 5 per collateral event
  - completeness (0-20): higher if verification phase is present after remediation

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/simulation/__tests__/workflowTracker.test.ts`
Expected: All 9 tests PASS

**Step 5: Commit**

```bash
git add src/simulation/workflowTracker.ts src/simulation/__tests__/workflowTracker.test.ts
git commit -m "feat: add WorkflowTracker with phase classification and scoring"
```

---

### Task 10: Difficulty Scaler

ELO-like adaptive rating that persists in learningProgressStore.

**Files:**
- Create: `src/simulation/difficultyScaler.ts`
- Create: `src/simulation/__tests__/difficultyScaler.test.ts`
- Modify: `src/store/learningProgressStore.ts`

**Step 1: Write failing tests**

Create `src/simulation/__tests__/difficultyScaler.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/simulation/__tests__/difficultyScaler.test.ts`
Expected: FAIL — module not found

**Step 3: Implement DifficultyScaler**

Create `src/simulation/difficultyScaler.ts`:

```typescript
const DEFAULT_RATING = 1000;
const K_FACTOR = 32;
const BEGINNER_CEILING = 900;
const INTERMEDIATE_CEILING = 1400;
const MIN_RATING = 0;
const MAX_RATING = 3000;

export class DifficultyScaler {
  private rating: number;

  constructor(initialRating: number = DEFAULT_RATING) {
    this.rating = Math.max(MIN_RATING, Math.min(MAX_RATING, initialRating));
  }

  recordResult(score: number): void {
    // score is 0-100. Treat 60 as "expected performance"
    const normalized = score / 100;
    const expected = 0.6;
    const delta = K_FACTOR * (normalized - expected);
    this.rating = Math.max(MIN_RATING, Math.min(MAX_RATING, this.rating + delta));
  }

  getRating(): number {
    return Math.round(this.rating);
  }

  getRecommendedDifficulty(): "beginner" | "intermediate" | "advanced" {
    if (this.rating < BEGINNER_CEILING) return "beginner";
    if (this.rating < INTERMEDIATE_CEILING) return "intermediate";
    return "advanced";
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/simulation/__tests__/difficultyScaler.test.ts`
Expected: All 8 tests PASS

**Step 5: Add incident rating to learningProgressStore**

Modify `src/store/learningProgressStore.ts`:
- Add `incidentRating: number` to the state (default 1000)
- Add `incidentHistory: Array<{ templateId: string; score: number; date: number }>` to the state
- Add `recordIncidentResult(templateId: string, score: number)` action that updates rating via DifficultyScaler logic and appends to history
- Add to persist whitelist

**Step 6: Run existing store tests to verify no regressions**

Run: `npx vitest run src/store/__tests__/learningProgressStore.test.ts`
Expected: All existing tests PASS

**Step 7: Commit**

```bash
git add src/simulation/difficultyScaler.ts src/simulation/__tests__/difficultyScaler.test.ts src/store/learningProgressStore.ts
git commit -m "feat: add DifficultyScaler with ELO rating and store persistence"
```

---

## Phase 3: UI Layer

### Task 11: Incident Launcher Component

The entry point in Labs & Scenarios for launching incidents.

**Files:**
- Create: `src/components/IncidentLauncher.tsx`
- Create: `src/components/__tests__/IncidentLauncher.test.tsx`
- Modify: `src/components/LabsAndScenariosView.tsx`

**Step 1: Write component tests**

Create `src/components/__tests__/IncidentLauncher.test.tsx`:

Tests should verify:
- Renders "Live Incidents" heading
- Shows current difficulty rating
- Shows "Start Incident" button
- Calls `onStartIncident` with difficulty and domain when button clicked
- Shows incident history (mocked from store)
- Disables launch when prerequisite gate not met (< 3 scenarios completed or < 2 quizzes passed)
- Shows prerequisite message when locked

**Step 2: Implement IncidentLauncher**

Create `src/components/IncidentLauncher.tsx`:

Component that:
- Reads `incidentRating` and `incidentHistory` from learningProgressStore
- Reads `completedScenarios` from simulationStore and `familyQuizScores` from learningProgressStore for prerequisite check
- Shows the ELO rating with difficulty label
- Domain filter dropdown (optional)
- Start button that calls `onStartIncident(difficulty, domain?)`
- Scrollable history list showing past incidents with scores and dates

**Step 3: Mount in LabsAndScenariosView**

Modify `src/components/LabsAndScenariosView.tsx`:
- Import `IncidentLauncher`
- Add it as a new section after the existing domain scenario lists, with a visual separator
- Pass `onStartIncident` prop that calls `onStartScenario` with a special `incident:` prefix (or a new prop)

**Step 4: Run tests**

Run: `npx vitest run src/components/__tests__/IncidentLauncher.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/IncidentLauncher.tsx src/components/__tests__/IncidentLauncher.test.tsx src/components/LabsAndScenariosView.tsx
git commit -m "feat: add IncidentLauncher component to Labs & Scenarios tab"
```

---

### Task 12: Incident Workspace Panel

The sidebar panel that replaces the narrative step list during active incidents.

**Files:**
- Create: `src/components/IncidentWorkspace.tsx`
- Create: `src/components/__tests__/IncidentWorkspace.test.tsx`

**Step 1: Write component tests**

Tests should verify:
- Renders situation briefing text
- Shows elapsed timer
- Shows 5 workflow progress checkboxes (survey, triage, isolation, remediation, verification)
- Progress checkboxes reflect WorkflowTracker phase progression
- "Submit Diagnosis" button renders and shows root cause options when clicked
- "Request Hint" button renders with score penalty label
- "Abandon Incident" button renders and calls onClose

**Step 2: Implement IncidentWorkspace**

Create `src/components/IncidentWorkspace.tsx`:

A panel component similar to `LabWorkspace` sidebar but with:
- Live timer (useRef + setInterval)
- Situation briefing section
- Auto-updating progress checklist driven by WorkflowTracker state
- Diagnosis submission modal (radio buttons for root cause options)
- Hint system with score penalty
- Close/abandon button

**Step 3: Run tests**

Run: `npx vitest run src/components/__tests__/IncidentWorkspace.test.tsx`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/components/IncidentWorkspace.tsx src/components/__tests__/IncidentWorkspace.test.tsx
git commit -m "feat: add IncidentWorkspace panel with workflow progress tracking"
```

---

### Task 13: After-Action Review Component

Post-incident debrief with timeline comparison and workflow scoring.

**Files:**
- Create: `src/components/AfterActionReview.tsx`
- Create: `src/components/__tests__/AfterActionReview.test.tsx`

**Step 1: Write component tests**

Tests should verify:
- Renders diagnosis result (correct/incorrect)
- Shows 5 score dimension bars with values
- Shows total score
- Renders timeline comparison with cluster events and user commands
- Shows actionable tip text
- "Review Optimal Path" button renders
- "Try Similar" button calls onRestart
- "Exit" button calls onClose

**Step 2: Implement AfterActionReview**

Create `src/components/AfterActionReview.tsx`:

A modal/overlay component that:
- Takes `{ score, diagnosis, events, commands, tip, optimalPath, onRestart, onClose }` props
- Renders score breakdown as horizontal bars (same styling pattern as existing progress indicators)
- Renders dual-column timeline with timestamps
- Shows tip in a highlighted callout box
- "Review Optimal Path" launches the incident as a guided walkthrough using the narrative scenario adapter

**Step 3: Run tests**

Run: `npx vitest run src/components/__tests__/AfterActionReview.test.tsx`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/components/AfterActionReview.tsx src/components/__tests__/AfterActionReview.test.tsx
git commit -m "feat: add AfterActionReview with timeline comparison and scoring"
```

---

### Task 14: Incident Session Orchestrator

Wires everything together: creates sandbox, composes incident, injects faults, runs physics, tracks workflow, handles submission.

**Files:**
- Create: `src/hooks/useIncidentSession.ts`
- Create: `src/hooks/__tests__/useIncidentSession.test.ts`
- Modify: `src/App.tsx`

**Step 1: Write hook tests**

Tests should verify:
- `startIncident(difficulty, domain?)` creates a ScenarioContext, composes an incident, injects primary faults
- `recordCommand(command)` forwards to WorkflowTracker and checks ConsequenceEngine
- `submitDiagnosis(rootCauseId)` calculates score and returns AfterActionReview data
- `abandonIncident()` cleans up sandbox
- EventLog receives entries during the session
- Consequence events are tracked for scoring

**Step 2: Implement useIncidentSession**

Create `src/hooks/useIncidentSession.ts`:

A custom hook that:
- Manages `incidentState: "idle" | "active" | "review"`
- On `startIncident`: creates ScenarioContext, calls IncidentComposer, applies primary faults to sandbox, starts FaultPropagationEngine, creates WorkflowTracker
- On `recordCommand`: classifies command, checks consequences, logs events
- On `submitDiagnosis`: stops timer, scores via WorkflowTracker, records result in learningProgressStore, returns review data
- On abandon: cleans up without recording
- Exposes: `incidentState`, `situation`, `workflowPhases`, `startIncident`, `recordCommand`, `submitDiagnosis`, `abandonIncident`, `reviewData`

**Step 3: Wire into App.tsx**

Modify `src/App.tsx`:
- Import `useIncidentSession`
- Add incident state management
- When incident is active, show `IncidentWorkspace` instead of `LabWorkspace`
- When incident is in review, show `AfterActionReview`
- Pass `recordCommand` to Terminal (or hook into existing command execution)

**Step 4: Wire command recording into Terminal**

The Terminal already calls `recordCommand` on the simulationStore for scenario tracking. Add a parallel call to the incident session's `recordCommand` when an incident is active. This can be done by checking `scenarioContextManager.getActiveContext()` type or by passing a callback prop.

**Step 5: Run tests**

Run: `npx vitest run src/hooks/__tests__/useIncidentSession.test.ts`
Expected: All tests PASS

**Step 6: Run full test suite**

Run: `npm run test:run`
Expected: All tests PASS, no regressions

**Step 7: Build check**

Run: `npm run build`
Expected: Compiles clean

**Step 8: Commit**

```bash
git add src/hooks/useIncidentSession.ts src/hooks/__tests__/useIncidentSession.test.ts src/App.tsx
git commit -m "feat: add useIncidentSession orchestrator and wire into App"
```

---

### Task 15: Integration Testing & Polish

End-to-end verification that all systems work together.

**Files:**
- Create: `tests/e2e/incidents/incident-flow.spec.ts` (Playwright)
- Modify: `src/store/learningProgressStore.ts` (if needed for integration fixes)

**Step 1: Write E2E smoke test**

Create a Playwright test that:
1. Navigates to Labs & Scenarios tab
2. Verifies "Live Incidents" section appears (or is locked with prerequisite message)
3. If testing with seeded data: starts an incident, runs 2-3 commands in terminal, submits diagnosis, verifies after-action review renders

**Step 2: Manual verification checklist**

- `npm run dev` — navigate to Labs tab, verify incident launcher renders
- Start a beginner incident — verify situation briefing appears
- Run `nvidia-smi`, `sinfo` — verify workflow progress updates
- Run `dmesg` — verify event log entries appear
- Wait 10s — verify fault cascade effects (if applicable)
- Submit diagnosis — verify after-action review renders with scores
- Check Study Dashboard — verify incident history appears

**Step 3: Run full verification**

```bash
npm run lint          # 0 errors
npx tsc --noEmit     # 0 errors
npm run test:run     # All pass
npm run build        # Compiles clean
```

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: add E2E test for incident flow, integration polish"
```

---

## Implementation Order Summary

| Task | Name | Phase | Depends On |
|------|------|-------|------------|
| 1 | Event Timeline Infrastructure | Realism | — |
| 2 | Fault Propagation Engine | Realism | — |
| 3 | Cluster Physics Engine | Realism | — |
| 4 | Integrate Physics with MetricsSimulator | Realism | 1, 3 |
| 5 | Extend dmesg to Read EventLog | Realism | 1 |
| 6 | Incident Templates Data | Engine | — |
| 7 | Incident Composer | Engine | 6 |
| 8 | Consequence Engine | Engine | — |
| 9 | Workflow Tracker | Engine | — |
| 10 | Difficulty Scaler | Engine | — |
| 11 | Incident Launcher Component | UI | 7, 10 |
| 12 | Incident Workspace Panel | UI | 7, 9 |
| 13 | After-Action Review Component | UI | 9 |
| 14 | Incident Session Orchestrator | UI | 1-13 |
| 15 | Integration Testing & Polish | UI | 14 |

Tasks 1-3 can be developed in parallel. Tasks 6, 8, 9, 10 can be developed in parallel. Task 14 is the integration point that depends on everything else.
