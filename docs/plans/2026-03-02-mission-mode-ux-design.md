# Mission Mode UX Design

**Goal:** Replace the current "mission instructions crammed into terminal sidebar" experience with a dedicated Mission Mode that shifts the entire app into a focused two-column layout (instructions + terminal) with a cinematic briefing on entry.

**Problem:** When a user starts a mission, the dashboard still dominates 60%+ of the viewport. The mission instructions (MissionCard) are a small card squeezed above the terminal. Nothing visually signals "you're in mission mode now" — the user's eyes aren't drawn to the instructions or the CLI.

**Solution:** Three-phase experience — cinematic briefing, dedicated mission layout, dashboard available on demand via slide-over.

---

## Phase 1: Cinematic Mission Briefing

**Replaces:** `NarrativeIntro` component (small centered modal)

**New component:** `MissionBriefing.tsx` — full-screen cinematic interstitial

### Visual Sequence (~4 seconds)

1. **Screen goes dark** — full-screen black overlay fades in (300ms)
2. **Mission title fades in** — centered, large NVIDIA green text with subtle glow (400ms delay)
3. **Narrative hook types out** — italic white text, character by character (~50ms/char), reusing the TerminalDemo typing pattern. E.g. *"It's 2AM. The ML training pipeline on DGX Node 3 crashed 30 minutes ago..."*
4. **Setting paragraph fades in** — gray context text slides up (400ms)
5. **Objectives slide in** — bullet list, 300ms stagger per item
6. **"Accept Mission" button pulses** — NVIDIA green with glow effect

### Details

- Green accent bar at top (visual anchor)
- Tier badge next to title (Guided / Choice / Realistic)
- Estimated time shown (e.g. "~15 min")
- Skip button preserved for tutorial missions (`skippable` prop)
- Escape key dismisses (reuses `useFocusTrap`)
- Clicking anywhere skips animations and shows full content immediately
- Props: same as `NarrativeIntro` plus `objectives: string[]` and `estimatedTime: number`

---

## Phase 2: Mission Mode Layout

**Trigger:** `activeScenario` exists AND briefing dismissed

### Layout

```
+-------------------------------------------------------------+
| Mission Mode Bar                                             |
| [<- Abort]  The Midnight Deployment  Step 3/10 **..ooooooo  [Cluster] |
+----------------------+--------------------------------------+
|                      |                                      |
|  INSTRUCTION PANEL   |          TERMINAL                    |
|  (~35% width)        |          (~65% width)                |
|                      |          (xterm.js, full height)     |
|  Step 3 of 10        |                                      |
|  ----------          |                                      |
|                      |                                      |
|  SITUATION           |                                      |
|  "GPU 3 is showing   |                                      |
|   degraded perf..."  |                                      |
|                      |                                      |
|  YOUR TASK           |                                      |
|  "Run diagnostics    |                                      |
|   to identify..."    |                                      |
|                      |                                      |
|  COMMANDS            |                                      |
|  [dcgmi diag -r 1]   |                                      |
|  [nvidia-smi -q]     |                                      |
|                      |                                      |
|  OBJECTIVES  2/3     |                                      |
|  + Run dcgmi diag    |                                      |
|  + Check ECC errors  |                                      |
|  o Identify fault    |                                      |
|                      |                                      |
|  HINTS (1/3)         |                                      |
|                      |                                      |
|  [     Next ->     ] |                                      |
+----------------------+--------------------------------------+
```

### Mission Mode Bar

Single slim bar replacing the full app header + nav + footer:

- **Abort button** (left) — confirmation dialog, returns to normal layout
- **Mission title** (center)
- **Step progress** (center-right) — "Step 3/10" with dot indicators
- **Cluster button** (right) — opens dashboard slide-over
- Green accent styling

### Instruction Panel (left, ~35%)

Expanded MissionCard content with room to breathe:

- Step counter with dot indicators
- **Situation** — full narrative context (no more `line-clamp-2`)
- **Task** — full description (no more truncation)
- **Command chips** — click-to-paste with flash feedback, larger and more readable
- **Concept/Observe content** — full display for non-command steps
- **Objectives** — always-visible checklist with green checkmarks
- **Hints** — reveal button with dropdown
- **Inline Quiz** — renders when step has `narrativeQuiz`
- **Next/Continue button** — full-width, prominent, at panel bottom
- Independent scroll if content overflows

### Terminal (right, ~65%)

Full height, full focus. No MissionCard above it. Terminal "STARTING LAB" banner still prints on mission start.

### What's Hidden During Mission Mode

- Dashboard (GPU cards, topology, node details)
- Main app header with navigation tabs
- Footer with version/status
- Fault injection tab

All return when mission ends or is aborted.

---

## Phase 3: Dashboard Slide-Over

**Trigger:** User clicks "Cluster" button in Mission Mode Bar

### Behavior

- Slides in from the right, overlaying the terminal (not the instruction panel)
- Semi-transparent backdrop (click to dismiss)
- Width: ~60% of viewport
- Animation: 300ms ease-in-out
- Close via: X button, Escape key, or backdrop click

### Content

Existing `Dashboard` component renders inside — same GPU status cards, node selection, metrics tabs. No modifications to Dashboard itself.

### Rationale

During missions, users only peek at cluster state occasionally ("did my command change anything?"). A persistent split wastes space 95% of the time. The overlay provides quick access without disrupting the instructions + terminal flow.

---

## State & Architecture

### State Changes

No new Zustand stores. Two pieces of local state in App.tsx:

- `showMissionBriefing: boolean` — replaces `showNarrativeIntro`
- `showDashboardSlideOver: boolean` — controls cluster peek panel

### Flow

```
Begin Mission clicked
  -> activeScenario set (existing)
  -> showMissionBriefing = true
  -> MissionBriefing renders

Accept Mission clicked
  -> showMissionBriefing = false
  -> Layout switches to Mission Mode

Cluster button clicked
  -> showDashboardSlideOver = true
  -> Dashboard slides in

Mission completed
  -> NarrativeResolution modal (existing)

Exit clicked
  -> exitScenario() (existing)
  -> activeScenario = null
  -> Normal layout returns
```

### Conditional Layout Swap

```tsx
{activeScenario && !showMissionBriefing ? (
  // MISSION MODE
  <MissionModeBar />
  <MissionInstructionPanel />
  <Terminal />
  <DashboardSlideOver />
) : (
  // NORMAL LAYOUT
  ...existing header, nav, dashboard, footer...
)}
```

### Terminal Re-mount

Terminal (xterm.js) is expensive to re-mount. Use a React portal to render Terminal into a shared `terminalContainerRef` that exists in either layout, avoiding re-initialization.

---

## Components

| Component | Status | Description |
|-----------|--------|-------------|
| `MissionBriefing.tsx` | **New** | Cinematic full-screen briefing with typed narrative |
| `MissionModeBar.tsx` | **New** | Slim top bar (title, progress, abort, cluster toggle) |
| `MissionInstructionPanel.tsx` | **New** | Full-height left panel (expanded MissionCard content) |
| `DashboardSlideOver.tsx` | **New** | Slide-over wrapper for existing Dashboard |
| `App.tsx` | **Modified** | Conditional layout swap based on activeScenario |
| `SimulatorView.tsx` | **Modified** | Terminal portal support |
| `NarrativeIntro.tsx` | **Unchanged** | Preserved but no longer used for narrative missions |
| `MissionCard.tsx` | **Unchanged** | Kept for mobile layout fallback |

---

## Testing

### Unit Tests

| Component | Key Tests |
|-----------|-----------|
| `MissionBriefing` | Renders title, hook, setting. Accept calls onBegin. Escape dismisses. Skip works. ARIA attributes correct. |
| `MissionModeBar` | Renders title, step progress. Abort calls callback. Cluster button calls callback. |
| `MissionInstructionPanel` | Renders situation, task, commands. Click-to-paste works. Objectives show checkmarks. Hints reveal. Next button disabled until complete. Quiz renders. |
| `DashboardSlideOver` | Renders when open. Backdrop click closes. Escape closes. Dashboard content inside. |

### Integration Tests

- Starting mission shows MissionBriefing
- Accepting briefing switches to mission mode (no header/nav/footer)
- Aborting returns to normal layout
- Completing all steps shows NarrativeResolution
- Slide-over opens and closes

### Existing Test Updates

- `App.test.tsx` — expect MissionBriefing instead of NarrativeIntro
- `SimulatorView.test.tsx` — MissionCard rendering logic changes

### Manual Verification

- Cinematic briefing animation plays smoothly
- Layout switches cleanly (no flash/flicker)
- Instructions readable, commands clickable
- Dashboard slide-over shows real-time cluster state
- Abort returns cleanly to normal layout
- Test at 1366px and 1920px
