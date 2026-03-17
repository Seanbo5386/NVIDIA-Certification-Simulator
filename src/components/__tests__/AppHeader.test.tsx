import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const mk = (n: string) => {
    const C = () => null;
    C.displayName = n;
    return C;
  };
  return {
    Monitor: mk("Monitor"),
    BookOpen: mk("BookOpen"),
    FlaskConical: mk("FlaskConical"),
    GraduationCap: mk("GraduationCap"),
    Play: mk("Play"),
    Pause: mk("Pause"),
    RotateCcw: mk("RotateCcw"),
    HelpCircle: mk("HelpCircle"),
    Info: mk("Info"),
    X: mk("X"),
    MessageSquare: mk("MessageSquare"),
  };
});

// Mock child components
vi.mock("../UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock("../FeedbackModal", () => ({
  FeedbackModal: () => null,
}));

import { AppHeader } from "../AppHeader";
import type { ClusterConfig } from "../../types/hardware";

const defaultProps = {
  currentView: "simulator" as const,
  onViewChange: vi.fn(),
  cluster: {
    name: "Test Cluster",
    nodes: [{ gpus: [{ id: "0" }, { id: "1" }] }],
  } as unknown as ClusterConfig,
  isRunning: false,
  onStartSimulation: vi.fn(),
  onStopSimulation: vi.fn(),
  onResetSimulation: vi.fn(),
  onStartTour: vi.fn(),
  dueReviewCount: 0,
  onReviewClick: vi.fn(),
  isLoggedIn: false,
  syncStatus: "idle" as const,
  userEmail: undefined,
  smallScreenDismissed: true,
  onDismissSmallScreen: vi.fn(),
  sidebarOpen: false,
};

describe("AppHeader", () => {
  it("renders the app title", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Data Center Lab Simulator")).toBeInTheDocument();
  });

  it("renders Tour button", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Tour")).toBeInTheDocument();
  });

  it("renders Feedback button in header", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Feedback")).toBeInTheDocument();
  });

  it("renders navigation tabs", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Simulator")).toBeInTheDocument();
    expect(screen.getByText("Exams")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("renders cluster info", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Test Cluster")).toBeInTheDocument();
  });
});
