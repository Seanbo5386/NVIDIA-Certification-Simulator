/**
 * Tour step definitions for the spotlight onboarding tour.
 *
 * Each tab (Simulator, Labs, Docs) has its own set of steps that highlight
 * key UI elements on the user's first visit.
 */

export interface TourStep {
  /** CSS selector for the target element */
  selector: string;
  /** Bold heading displayed in the tooltip */
  title: string;
  /** 1-2 sentence explanation */
  description: string;
  /** Preferred tooltip placement relative to the target */
  placement: "top" | "bottom" | "left" | "right";
}

export type TourId = "simulator" | "labs" | "docs";

export const SIMULATOR_TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="dashboard-panel"]',
    title: "Cluster Dashboard",
    description:
      "This is your real-time view of the datacenter. It shows GPU health, memory usage, temperatures, and node status across the cluster.",
    placement: "right",
  },
  {
    selector: '[data-tour="terminal-panel"]',
    title: "Interactive Terminal",
    description:
      "Type datacenter commands here just like a real Linux terminal. Try `nvidia-smi` or `ibstat` to see simulated output from actual NVIDIA tools.",
    placement: "left",
  },
  {
    selector: '[data-tour="sim-controls"]',
    title: "Simulation Controls",
    description:
      "Use these to pause, resume, or reset the cluster state. Pausing freezes all metrics so you can inspect values without them changing.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="split-handle"]',
    title: "Adjustable Layout",
    description:
      "Drag this handle to resize the dashboard and terminal panels. Your layout preference is saved automatically.",
    placement: "left",
  },
  {
    selector: "#tab-labs",
    title: "Ready to Learn?",
    description:
      "When you're ready for guided missions, head to Labs & Scenarios. There are 28 story-driven scenarios covering all five exam domains.",
    placement: "bottom",
  },
  {
    selector: "#tab-reference",
    title: "Reference Library",
    description:
      "Need to look up a command, troubleshoot an error, or review the exam blueprint? The Documentation tab has architecture guides, command references, and XID error codes.",
    placement: "bottom",
  },
];

export const LABS_TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="missions-grid"]',
    title: "Mission Board",
    description:
      "Scenarios are organized by exam domain. Each domain maps to a section of the NCP-AII certification with its exam weight shown.",
    placement: "top",
  },
  {
    selector: '[data-tour="scenario-card-first"]',
    title: "Story-Driven Missions",
    description:
      "Each mission drops you into a realistic datacenter situation. You'll get a briefing, work through steps in the terminal, and answer knowledge checks along the way.",
    placement: "right",
  },
  {
    selector: '[data-tour="difficulty-badges"]',
    title: "Difficulty Levels",
    description:
      "Scenarios are sorted by difficulty. Start with beginner missions to learn the tools, then progress to advanced scenarios where you diagnose issues with no hints.",
    placement: "right",
  },
  {
    selector: '[data-testid="practice-exam-card"]',
    title: "Practice Exam",
    description:
      "Test your knowledge with a full 35-question practice exam that mirrors the real NCP-AII format, complete with a 90-minute timer.",
    placement: "left",
  },
];

export const DOCS_TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="doc-sub-tabs"]',
    title: "Documentation Sections",
    description:
      "Five reference sections cover everything from cluster architecture to exam strategy. Click any tab to jump to that topic.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="doc-architecture"]',
    title: "Cluster Architecture",
    description:
      "Start here to understand the DGX SuperPOD layout \u2014 node specs, GPU configurations, and the InfiniBand network fabric connecting it all.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="doc-commands"]',
    title: "Command Reference",
    description:
      "A searchable reference for every simulated command, organized by tool family. Each entry shows usage examples and what to look for in the output.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="doc-exam"]',
    title: "Exam Blueprint",
    description:
      "Review the NCP-AII certification structure \u2014 domain weights, question format, and study strategies to focus your preparation.",
    placement: "bottom",
  },
];

export const TOUR_STEPS: Record<TourId, TourStep[]> = {
  simulator: SIMULATOR_TOUR_STEPS,
  labs: LABS_TOUR_STEPS,
  docs: DOCS_TOUR_STEPS,
};
