# Spotlight Tour — First-Visit Onboarding Guide

## Overview

A step-by-step spotlight tour that highlights key UI sections on the user's first visit to each tab (Simulator, Labs & Scenarios, Documentation). A dimmed overlay with a cutout draws attention to one element at a time while a tooltip card explains what it is.

## Design Decisions

- **Style**: Spotlight tour with dark card tooltips and NVIDIA green accent
- **Trigger**: First visit to each tab (independent per tab)
- **Skip/Re-access**: Skip button on every step; small `?` icon in header re-triggers the current tab's tour
- **Implementation**: Custom-built component (no library dependency)

## Architecture

### New Files

| File                                              | Purpose                                                       |
| ------------------------------------------------- | ------------------------------------------------------------- |
| `src/components/SpotlightTour.tsx`                | Generic tour renderer (portal, overlay, tooltip, transitions) |
| `src/hooks/useTourState.ts`                       | localStorage read/write for tour-seen flags                   |
| `src/data/tourSteps.ts`                           | Step config arrays for all three tabs                         |
| `src/components/__tests__/SpotlightTour.test.tsx` | Component tests                                               |
| `src/hooks/__tests__/useTourState.test.ts`        | Hook tests                                                    |
| `src/data/__tests__/tourSteps.test.ts`            | Step config validation tests                                  |

### Modified Files

| File                                        | Change                                                             |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `src/components/SimulatorView.tsx`          | Add `data-tour` attributes, conditionally render `<SpotlightTour>` |
| `src/components/LabsAndScenariosView.tsx`   | Add `data-tour` attributes, conditionally render `<SpotlightTour>` |
| `src/components/Documentation.tsx`          | Add `data-tour` attributes, conditionally render `<SpotlightTour>` |
| `src/components/Header.tsx` (or equivalent) | Add `?` icon button for tour re-access                             |

## Component Design

### SpotlightTour Props

```typescript
interface TourStep {
  selector: string; // data-tour attribute selector
  title: string; // bold heading
  description: string; // 1-2 sentence explanation
  placement: "top" | "bottom" | "left" | "right";
}

interface SpotlightTourProps {
  steps: TourStep[];
  onComplete: () => void;
}
```

### Rendering

- Renders via `createPortal` into `document.body`
- Overlay: `position: fixed; inset: 0` with semi-transparent black
- Cutout: positioned element matching target's `getBoundingClientRect()` + 8px padding, using `box-shadow: 0 0 0 9999px rgba(0,0,0,0.75)` to create the dim effect
- Tooltip: absolutely positioned adjacent to the cutout

### Tooltip Card

- Background: `nvidia-dark` with nvidia-green left border
- Content: title (bold white), description (gray-300), step counter in nvidia-green ("Step 2 of 6")
- Buttons: "Skip" (ghost/text style), "Next" (nvidia-green solid). Last step shows "Finish"

### Transitions

- 300ms ease CSS transitions on cutout position/size and tooltip opacity
- Between steps: tooltip fades out, cutout slides to new target, tooltip fades in

### Scroll & Resize

- `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` before each step if target is off-screen
- `ResizeObserver` on target element to recalculate cutout position on layout shift

## Tour Steps

### Simulator Tab (6 stops)

Triggers after WelcomeScreen dismissal with a 500ms delay.

| #   | Selector                        | Title                | Description                                                                                                                                                             |
| --- | ------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `[data-tour="dashboard-panel"]` | Cluster Dashboard    | This is your real-time view of the datacenter. It shows GPU health, memory usage, temperatures, and node status across the cluster.                                     |
| 2   | `[data-tour="terminal-panel"]`  | Interactive Terminal | Type datacenter commands here just like a real Linux terminal. Try `nvidia-smi` or `ibstat` to see simulated output from actual NVIDIA tools.                           |
| 3   | `[data-tour="sim-controls"]`    | Simulation Controls  | Use these to pause, resume, or reset the cluster state. Pausing freezes all metrics so you can inspect values without them changing.                                    |
| 4   | `[data-tour="split-handle"]`    | Adjustable Layout    | Drag this handle to resize the dashboard and terminal panels. Your layout preference is saved automatically.                                                            |
| 5   | `[data-tour="tab-labs"]`        | Ready to Learn?      | When you're ready for guided missions, head to Labs & Scenarios. There are 28 story-driven scenarios covering all five exam domains.                                    |
| 6   | `[data-tour="tab-docs"]`        | Reference Library    | Need to look up a command, troubleshoot an error, or review the exam blueprint? The Documentation tab has architecture guides, command references, and XID error codes. |

### Labs & Scenarios Tab (5 stops)

Triggers on first visit to the Labs tab.

| #   | Selector                            | Title                 | Description                                                                                                                                                         |
| --- | ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `[data-tour="missions-grid"]`       | Mission Board         | Scenarios are organized by exam domain. Each domain maps to a section of the NCP-AII certification with its exam weight shown.                                      |
| 2   | `[data-tour="scenario-card-first"]` | Story-Driven Missions | Each mission drops you into a realistic datacenter situation. You'll get a briefing, work through steps in the terminal, and answer knowledge checks along the way. |
| 3   | `[data-tour="difficulty-badges"]`   | Difficulty Levels     | Scenarios are sorted by difficulty. Start with beginner missions to learn the tools, then progress to advanced scenarios where you diagnose issues with no hints.   |
| 4   | `[data-tour="practice-exam-card"]`  | Practice Exam         | Test your knowledge with a full 35-question practice exam that mirrors the real NCP-AII format, complete with a 90-minute timer.                                    |
| 5   | `[data-tour="free-mode-card"]`      | Free Mode             | Complete 3 missions to unlock Free Mode — an open sandbox where you can inject faults manually and experiment with the cluster however you want.                    |

### Documentation Tab (4 stops)

Triggers on first visit to the Documentation tab.

| #   | Selector                         | Title                  | Description                                                                                                                                       |
| --- | -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `[data-tour="doc-sub-tabs"]`     | Documentation Sections | Five reference sections cover everything from cluster architecture to exam strategy. Click any tab to jump to that topic.                         |
| 2   | `[data-tour="doc-architecture"]` | Cluster Architecture   | Start here to understand the DGX SuperPOD layout — node specs, GPU configurations, and the InfiniBand network fabric connecting it all.           |
| 3   | `[data-tour="doc-commands"]`     | Command Reference      | A searchable reference for every simulated command, organized by tool family. Each entry shows usage examples and what to look for in the output. |
| 4   | `[data-tour="doc-exam"]`         | Exam Blueprint         | Review the NCP-AII certification structure — domain weights, question format, and study strategies to focus your preparation.                     |

## State Management

### useTourState Hook

```typescript
const TOUR_KEYS = {
  simulator: "tour-simulator-seen",
  labs: "tour-labs-seen",
  docs: "tour-docs-seen",
} as const;

type TourTab = keyof typeof TOUR_KEYS;

function shouldShowTour(tab: TourTab): boolean; // true if key absent
function markTourSeen(tab: TourTab): void; // writes key
function resetTour(tab: TourTab): void; // removes key
```

No Zustand store — simple localStorage booleans.

### Trigger Coordination

- Simulator tour checks both `shouldShowTour('simulator')` AND `ncp-aii-welcome-dismissed` exists in localStorage
- 500ms delay after WelcomeScreen closes before first spotlight appears
- Other tabs: check `shouldShowTour()` on component mount

## Header Re-access

A small `?` circle icon button in the header. Clicking it re-triggers the tour for whichever tab is currently active. No dropdown, no menu — single click, starts the tour. Uses `resetTour(currentTab)` then renders the tour component.

## Implementation Order

1. `useTourState` hook + tests
2. `tourSteps.ts` data + validation tests
3. `SpotlightTour` component + tests
4. Add `data-tour` attributes to Simulator, Labs, Documentation components
5. Wire up conditional rendering in each tab component
6. Add header `?` button
7. Visual polish and transition tuning
