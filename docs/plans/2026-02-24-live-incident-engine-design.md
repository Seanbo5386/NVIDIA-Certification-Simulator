# v2.0 Design: Live Incident Engine + Simulation Realism

_Date: 2026-02-24_

## Problem

Certification candidates lack hands-on troubleshooting experience. The simulator teaches commands and concepts through guided scenarios, but real NCP-AII exam questions and real datacenter work require diagnosing unknown problems under pressure. Current training modes are either too guided (narrative scenarios), too abstract (multiple-choice quizzes), or too open-ended (free mode).

## Solution

Two interconnected systems that transform the simulator from "practice commands" to "practice being a datacenter engineer":

1. **Simulation Realism Layer** — makes the cluster feel alive with causal physics, cascading failures, and system logs
2. **Live Incident Engine** — composes realistic, unguided troubleshooting incidents with adaptive difficulty and workflow scoring

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE                       │
│  Incident Mode UI  ·  Workflow Scoring  ·  After-Action │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              LIVE INCIDENT ENGINE                         │
│  Incident Composer  ·  Consequence Engine  ·  Adaptive   │
│  Difficulty Scaler  ·  Workflow Tracker                   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│           SIMULATION REALISM LAYER                       │
│  ClusterPhysicsEngine  ·  FaultPropagation  ·           │
│  EventLog / System Logs  ·  Event Timeline               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              EXISTING FOUNDATION (v1.x)                   │
│  ScenarioContext  ·  MetricsSimulator  ·  FaultInjection │
│  28 XID codes  ·  6 fault types  ·  StateMutator         │
└─────────────────────────────────────────────────────────┘
```

Each layer extends existing systems. No rewrites.

## Sandbox Isolation

Every incident session creates its own `ScenarioContext` with a deep-cloned cluster. All fault propagation, consequences, log events, and state mutations happen inside that sandbox only. When the user exits, the sandbox is destroyed and the global cluster is untouched. Within a sandbox, everything cascades realistically. Between incidents, zero leakage.

---

## System 1: Simulation Realism Layer

### 1A: ClusterPhysicsEngine

**File:** `src/simulation/clusterPhysicsEngine.ts`

Replaces independent metric jitter with a causal dependency graph. Runs on the existing 1Hz MetricsSimulator tick.

| Input | Drives | Example |
|-------|--------|---------|
| GPU utilization | Temperature | 95% util -> temp climbs ~2C/tick toward thermal ceiling |
| Temperature | Clock throttling | >83C -> SM clocks reduce progressively |
| Clock throttling | Job performance | Throttled GPUs -> Slurm jobs slow, eventually timeout |
| Job timeout | Slurm state change | Timed-out job -> node enters `drain` with reason |
| Power draw | PSU stress | Total node power > PSU capacity -> PSU Warning sensor |
| ECC error accumulation | Row remapping | Single-bit errors hit threshold -> XID 92 |

Each metric is a function of other metrics, not random noise.

### 1B: FaultPropagation

**File:** `src/simulation/faultPropagation.ts`

Data-driven rule table defining what happens after a fault. Each rule: `trigger condition -> delay -> consequence action`.

Example chain:
```
XID 43 (GPU hang) on GPU 3
  -> after 5s:  NVLink peers of GPU 3 see XID 74 (link degradation)
  -> after 10s: Slurm job on GPU 3 times out, job FAILED
  -> after 15s: Slurm drains the node with reason "GPU not responding"

Thermal runaway on Node 2
  -> after 10s:  All 8 GPUs throttle clocks
  -> after 20s:  Jobs slow, utilization drops despite demand
  -> after 45s:  XID 43 on hottest GPU
  -> cascades into GPU hang chain above
```

The engine evaluates pending consequences every tick.

### 1C: EventLog & System Logs

**File:** `src/simulation/eventLog.ts`

Every state change emits a timestamped log entry in realistic Linux format:

```
[Thu Feb 24 14:23:01 2026] NVRM: Xid (PCI:0000:18:00): 48, pid=1234, ...
[Thu Feb 24 14:23:01 2026] NVRM: GPU at 0000:18:00.0 has fallen off the bus
[Thu Feb 24 14:23:05 2026] nvidia-peermem: GPU 3 NVLink timeout
```

Terminal commands `dmesg`, `journalctl`, and `cat /var/log/syslog` read from this log. Candidates practice the real diagnostic workflow: check logs first, then drill into specific tools.

Capped at 1,000 entries per sandbox. Oldest entries evicted.

### 1D: Event Timeline

Append-only array in ScenarioContext: `events: ClusterEvent[]`

Used by:
- Log generator (to produce `dmesg` output)
- Workflow tracker (to evaluate if user found root cause)
- After-action review (to show what happened vs. what user investigated)

---

## System 2: Live Incident Engine

### 2A: IncidentComposer

**File:** `src/simulation/incidentComposer.ts`
**Data:** `src/data/incidentTemplates.json`

Assembles incidents from building blocks at runtime.

Each template defines:
- **Root cause** — the underlying problem (e.g., "failing GPU memory module")
- **Primary fault** — what to inject (e.g., XID 48 on a specific GPU)
- **Symptom chain** — what cascading fault logic produces
- **Red herrings** — optional unrelated noise on other nodes
- **Diagnostic path** — expected investigative steps (for scoring)
- **Domain tags** — maps to NCP-AII exam domains

Composition logic:
1. Pick root cause template based on difficulty + domain
2. Pick random node/GPU to host the fault
3. Layer in 0-2 red herrings at higher difficulties
4. Optionally combine 2 root causes for advanced difficulty
5. Set timing: some faults pre-injected, others trigger mid-investigation

Difficulty levels:

| Difficulty | Composition |
|---|---|
| Beginner | Single fault, clear symptoms, one node |
| Intermediate | Fault with cascade effects visible on adjacent nodes. One red herring. |
| Advanced | Two independent faults. Multiple red herrings. Noisy logs. |

### 2B: ConsequenceEngine

**File:** `src/simulation/consequenceEngine.ts`

Maps user commands to consequences given current cluster state. Bad decisions cause real (sandboxed) damage.

| User Action | Cluster State | Consequence |
|---|---|---|
| `nvidia-smi -r` (GPU reset) | GPU has active MIG instances | MIG instances destroyed, jobs fail |
| `ipmitool power cycle` | Node running Slurm jobs | All jobs killed, node enters `down` |
| `scontrol update State=RESUME` | Node has unfixed hardware fault | Node re-drains with same error |
| `dcgmi diag -r 3` | Node under production load | Diagnostic evicts running jobs |
| Inaction for 60s+ | Cascading fault in progress | Fault spreads to additional nodes |

Commands are never blocked. Users learn through consequences, not guardrails.

### 2C: WorkflowTracker

**File:** `src/simulation/workflowTracker.ts`

Tracks every command and classifies it into diagnostic phases:

| Phase | Example Commands |
|---|---|
| 1. Symptom Survey | `sinfo`, `nvidia-smi`, `ibstat` |
| 2. Triage | `nvidia-smi -i 3`, `dmesg \| grep GPU`, `ibdiagnet` |
| 3. Root Cause Isolation | `nvidia-smi -q -i 3 -d ECC`, `dcgmi diag -r 1 -i 3` |
| 4. Remediation | `nvidia-smi -r -i 3`, `scontrol update State=DRAIN` |
| 5. Verification | Re-running initial survey commands, checking logs |

Scoring dimensions (each 0-20, total 0-100):
- **Methodology** — phases followed in order vs. jumping around
- **Efficiency** — commands to reach root cause (fewer = better)
- **Accuracy** — correct root cause identified
- **No Collateral** — actions didn't cause additional problems
- **Completeness** — fix was verified, not assumed

### 2D: DifficultyScaler

**File:** `src/simulation/difficultyScaler.ts`

ELO-like rating persisted in `learningProgressStore`:
- Solve efficiently -> rating up -> harder incidents
- Struggle -> plateau
- Fail repeatedly -> rating down -> simpler incidents

Controls: incident complexity, symptom clarity, time pressure (optional), hint availability.

---

## User Experience

### Entry Point

New "Live Incidents" section in Labs & Scenarios tab. Shows:
- Current difficulty rating
- "Start Incident" button
- Domain filter for targeted practice
- Incident history with scores

### Incident Workspace Panel

Replaces narrative step-by-step sidebar with:
- **Situation briefing** — symptom description only, no hints
- **Progress indicators** — auto-filled as workflow tracker detects phase transitions
- **Submit Diagnosis** — user declares root cause (multiple choice from plausible options)
- **Request Hint** — available but degrades score (-10 pts)
- **Abandon Incident** — exit without scoring

### After-Action Review

Displayed when incident ends. Shows:
- Diagnosis result (correct/incorrect)
- Workflow score breakdown (5 dimensions, bar chart)
- Timeline comparison: cluster events (left) vs. user commands (right) with timestamps
- Actionable tip highlighting the biggest methodology gap
- "Review Optimal Path" — replays incident as guided walkthrough (reuses narrative UI)
- "Try Similar" — launches new incident with same domain/difficulty

### Prerequisite Gate

Live Incidents unlock after completing 3+ narrative scenarios AND passing 2+ command family quizzes. Prevents users from entering unguided mode without baseline command knowledge.

---

## Training Mode Differentiation

Each mode serves a distinct, non-overlapping purpose:

| Mode | Purpose | Guidance | Teaches |
|---|---|---|---|
| Narrative Scenarios | Learn commands via story | High — step-by-step | "What does this command do?" |
| Which Tool Quiz | Test command selection | Multiple choice | "Which tool for this problem?" |
| Mastery Quiz | Test flag/output knowledge | Multiple choice | "What does this flag mean?" |
| Exam Practice | Simulate written exam | Timed multiple choice | "Can you pass the knowledge test?" |
| Exam Gauntlet | Rapid-fire recall | Speed multiple choice | "Can you recall under pressure?" |
| Free Mode | Open sandbox | None, no objectives | "Let me experiment" |
| **Live Incidents** | **Diagnose unknown problems** | **None — symptom only** | **"Can you actually troubleshoot?"** |

Learning path flow: Scenarios -> Quizzes -> Live Incidents -> After-Action Review -> Spaced Review

---

## New Files

### Simulation Layer (`src/simulation/`)
- `clusterPhysicsEngine.ts` — causal metric dependencies
- `faultPropagation.ts` — cascading fault rules
- `eventLog.ts` — system log generator + event timeline
- `incidentComposer.ts` — incident assembly from templates
- `consequenceEngine.ts` — command consequence rules
- `workflowTracker.ts` — diagnostic phase classification + scoring
- `difficultyScaler.ts` — adaptive ELO rating

### Data (`src/data/`)
- `incidentTemplates.json` — incident building blocks
- `faultPropagationRules.json` — cascade rule definitions
- `consequenceRules.json` — command-state consequence mappings

### Components (`src/components/`)
- `IncidentWorkspace.tsx` — incident mode sidebar panel
- `AfterActionReview.tsx` — post-incident debrief
- `IncidentLauncher.tsx` — incident selection + history in Labs tab

### Tests
- Unit tests for each simulation file
- Component tests for each UI component
- E2E Playwright test for full incident flow

---

## Modified Files

- `src/hooks/useMetricsSimulation.ts` — integrate ClusterPhysicsEngine
- `src/store/scenarioContext.ts` — add `events: ClusterEvent[]` timeline
- `src/store/learningProgressStore.ts` — add incident scores + ELO rating
- `src/components/LabsAndScenariosView.tsx` — add Live Incidents section
- `src/simulators/basicSystemSimulator.ts` — add `dmesg`, `journalctl` commands reading from EventLog
- `src/data/faultDescriptions.ts` — extend for consequence feedback messages

---

## Testing Strategy

| Layer | Approach |
|---|---|
| ClusterPhysicsEngine | Unit — given state X, after N ticks, assert values. Deterministic (seeded RNG). |
| FaultPropagation | Unit — inject fault, advance time, assert downstream effects. |
| EventLog | Unit — trigger state changes, assert log format and timestamps. |
| IncidentComposer | Unit — given difficulty + domain, assert valid composition. |
| ConsequenceEngine | Unit — given state + command, assert correct consequence. |
| WorkflowTracker | Unit — feed command sequence, assert phase classification + scoring. |
| DifficultyScaler | Unit — feed win/loss, assert rating direction. |
| UI components | Component tests — render with mocked state, assert content. |
| Integration | E2E Playwright — launch incident, diagnose, submit, verify review. |

## Error Handling

- **Physics tick fails:** Catch per-node, log warning, skip node. Never crash the loop.
- **Composition fails:** Fall back to default template, show toast.
- **Event log overflow:** Cap 1,000 entries, evict oldest.
- **Browser close mid-incident:** Sandbox is not persisted. Clean start next time.
