# Feedback System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user feedback form (general, bug report, success story) accessible from the app header, stored via Amplify DynamoDB.

**Architecture:** New `FeedbackModal` component opened from a header button group (Tour | Feedback | Sign In). Authenticated users submit feedback via `client.models.Feedback.create()`. Unauthenticated users see disabled form with sign-in prompt that closes modal so they can use UserMenu's existing sign-in flow. Amplify schema extended with a `Feedback` model using owner-based auth.

**Tech Stack:** React 18, TypeScript, TailwindCSS, lucide-react, AWS Amplify Gen 2 (DynamoDB + Cognito), Vitest + RTL

---

## File Structure

| File                                              | Action | Responsibility                                          |
| ------------------------------------------------- | ------ | ------------------------------------------------------- |
| `amplify/data/resource.ts`                        | Modify | Add Feedback model to Amplify schema                    |
| `src/components/FeedbackModal.tsx`                | Create | Modal with category pills, textarea, submit, auth gate  |
| `src/components/AppHeader.tsx`                    | Modify | Add Feedback button to header, group with Tour/UserMenu |
| `src/components/__tests__/FeedbackModal.test.tsx` | Create | Unit tests for all modal states                         |
| `src/components/__tests__/AppHeader.test.tsx`     | Create | New test file for header with Feedback button           |
| `src/components/About.tsx`                        | Modify | Add v1.3.0 changelog entry                              |
| `src/components/__tests__/About.test.tsx`         | Modify | Update version assertion                                |
| `README.md`                                       | Modify | Mention feedback feature, bump version badge            |

### Auth Flow Design Decision

`UserMenu` manages its own auth state internally (`authView` state + modal). There is no externally callable "open sign-in" function. Rather than refactoring `UserMenu` to expose auth control, the `FeedbackModal`'s sign-in button simply closes the feedback modal with a message directing the user to the Sign In button in the header. This keeps the change minimal and avoids coupling FeedbackModal to UserMenu internals. The `onSignInClick` prop is removed — FeedbackModal only needs `onClose`.

---

## Chunk 1: Data Model + FeedbackModal Component

### Task 1: Add Feedback model to Amplify schema

**Files:**

- Modify: `amplify/data/resource.ts`

- [ ] **Step 1: Add the Feedback model**

In `amplify/data/resource.ts`, add the `Feedback` model after `UserProgress`. Use `a.string()` for category (client-side already constrains values; avoids Amplify Gen 2 enum reference complexity):

```typescript
const schema = a.schema({
  UserProgress: a
    .model({
      simulationData: a.json(),
      learningProgress: a.json(),
      learningData: a.json(),
      lastSyncedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  Feedback: a
    .model({
      category: a.string().required(),
      message: a.string().required(),
    })
    .authorization((allow) => [allow.owner()]),
});
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no type errors.

- [ ] **Step 3: Commit**

```bash
git add amplify/data/resource.ts
git commit -m "feat: add Feedback model to Amplify schema"
```

---

### Task 2: Write FeedbackModal tests

**Files:**

- Create: `src/components/__tests__/FeedbackModal.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const mk = (n: string) => {
    const C = () => null;
    C.displayName = n;
    return C;
  };
  return {
    X: mk("X"),
    MessageSquare: mk("MessageSquare"),
    Send: mk("Send"),
    Loader2: mk("Loader2"),
  };
});

// Mock Amplify client
const mockCreate = vi.fn();
vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({
    models: {
      Feedback: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
  }),
}));

// Mock useFocusTrap
vi.mock("../../hooks/useFocusTrap", () => ({
  useFocusTrap: vi.fn(),
}));

import { FeedbackModal } from "../FeedbackModal";

describe("FeedbackModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    isLoggedIn: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<FeedbackModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Send Feedback")).not.toBeInTheDocument();
  });

  it("renders modal when open", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByText("Send Feedback")).toBeInTheDocument();
  });

  it("shows three category pills", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByText("General Feedback")).toBeInTheDocument();
    expect(screen.getByText("Bug Report")).toBeInTheDocument();
    expect(screen.getByText("Success Story")).toBeInTheDocument();
  });

  it("changes placeholder when category changes", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("What could we do better?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Bug Report"));
    expect(
      screen.getByPlaceholderText(
        "Describe what happened and what you expected",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Success Story"));
    expect(
      screen.getByPlaceholderText(
        "Did this help you pass the NCP-AII? We'd love to hear about it!",
      ),
    ).toBeInTheDocument();
  });

  it("disables submit when textarea is empty", () => {
    render(<FeedbackModal {...defaultProps} />);
    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).toBeDisabled();
  });

  it("enables submit when textarea has content", () => {
    render(<FeedbackModal {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Great tool!" },
    });
    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).not.toBeDisabled();
  });

  it("calls Amplify create on submit and shows success", async () => {
    mockCreate.mockResolvedValueOnce({ data: { id: "123" } });
    render(<FeedbackModal {...defaultProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Love it!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        category: "general",
        message: "Love it!",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
  });

  it("handles submission failure gracefully", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Network error"));
    render(<FeedbackModal {...defaultProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
    });
    // Submit button should be re-enabled for retry
    expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
  });

  it("shows sign-in prompt when not logged in", () => {
    render(<FeedbackModal {...defaultProps} isLoggedIn={false} />);
    expect(
      screen.getByText(/please sign in to submit feedback/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("closes modal when sign-in button clicked (unauthenticated)", () => {
    render(<FeedbackModal {...defaultProps} isLoggedIn={false} />);
    const signInBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(signInBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    render(<FeedbackModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("feedback-backdrop"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("resets form state when reopened", () => {
    const { rerender } = render(<FeedbackModal {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "draft" },
    });
    fireEvent.click(screen.getByText("Bug Report"));

    // Close and reopen
    rerender(<FeedbackModal {...defaultProps} isOpen={false} />);
    rerender(<FeedbackModal {...defaultProps} isOpen={true} />);

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(
      screen.getByPlaceholderText("What could we do better?"),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/FeedbackModal.test.tsx`
Expected: FAIL — `FeedbackModal` module not found.

- [ ] **Step 3: Commit test file**

```bash
git add src/components/__tests__/FeedbackModal.test.tsx
git commit -m "test: add FeedbackModal unit tests (red)"
```

---

### Task 3: Implement FeedbackModal component

**Files:**

- Create: `src/components/FeedbackModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import { useFocusTrap } from "../hooks/useFocusTrap";

const client = generateClient<any>();

type Category = "general" | "bug" | "success";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "general", label: "General Feedback" },
  { value: "bug", label: "Bug Report" },
  { value: "success", label: "Success Story" },
];

const PLACEHOLDERS: Record<Category, string> = {
  general: "What could we do better?",
  bug: "Describe what happened and what you expected",
  success: "Did this help you pass the NCP-AII? We'd love to hear about it!",
};

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export function FeedbackModal({
  isOpen,
  onClose,
  isLoggedIn,
}: FeedbackModalProps) {
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, { isActive: isOpen, onEscape: onClose });

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory("general");
      setMessage("");
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      await client.models.Feedback.create({
        category,
        message: message.trim(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      // Silently fail — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      data-testid="feedback-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2 text-nvidia-green font-semibold">
            <MessageSquare className="w-5 h-5" />
            Send Feedback
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Close feedback"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Auth gate */}
          {!isLoggedIn && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-300">
              <p>
                Please sign in to submit feedback — accounts help us prevent
                spam and follow up if needed.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-3 py-1.5 bg-nvidia-green text-black rounded-lg text-sm font-medium hover:bg-nvidia-darkgreen transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                disabled={!isLoggedIn}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === value
                    ? "bg-nvidia-green text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                } ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[category]}
            disabled={!isLoggedIn}
            rows={4}
            maxLength={2000}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-nvidia-green resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Submit / Success */}
          {submitted ? (
            <div className="text-center text-nvidia-green text-sm font-medium py-2">
              Thank you for your feedback!
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting || !isLoggedIn}
              aria-label="Submit feedback"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-nvidia-green text-black rounded-lg font-medium text-sm hover:bg-nvidia-darkgreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/FeedbackModal.test.tsx`
Expected: All 12 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/FeedbackModal.tsx
git commit -m "feat: add FeedbackModal component"
```

---

## Chunk 2: AppHeader Integration + Docs

### Task 4: Create AppHeader tests with Feedback button

**Files:**

- Create: `src/components/__tests__/AppHeader.test.tsx`

Note: This file does not exist yet. We create it from scratch with all required mocks for AppHeader's 16 props.

- [ ] **Step 1: Create the test file**

```tsx
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

const defaultProps = {
  currentView: "simulator" as const,
  onViewChange: vi.fn(),
  cluster: {
    name: "Test Cluster",
    nodes: [{ gpus: [{ id: "0" }, { id: "1" }] }],
  } as any,
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
```

- [ ] **Step 2: Run tests to verify the Feedback button test fails**

Run: `npx vitest run src/components/__tests__/AppHeader.test.tsx`
Expected: FAIL — "Feedback" text not found (AppHeader doesn't have it yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/__tests__/AppHeader.test.tsx
git commit -m "test: create AppHeader tests with Feedback button (red)"
```

---

### Task 5: Integrate FeedbackModal into AppHeader

**Files:**

- Modify: `src/components/AppHeader.tsx`

- [ ] **Step 1: Add imports**

Add to the lucide-react import:

```typescript
MessageSquare,
```

Add component and React imports:

```typescript
import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";
```

- [ ] **Step 2: Add feedback state**

Inside `AppHeader` function body, before the return:

```typescript
const [feedbackOpen, setFeedbackOpen] = useState(false);
```

- [ ] **Step 3: Restructure the Tour / Feedback / UserMenu area**

Replace the Tour button + UserMenu block (the `{/* Tour button */}` comment through the `</div>` after UserMenu, approximately lines 138–155) with a grouped button area:

```tsx
{
  /* Button group: Tour / Feedback / Sign In */
}
<div className="flex items-center gap-1.5 bg-gray-800/50 rounded-lg p-1">
  <button
    onClick={onStartTour}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-400 hover:text-nvidia-green hover:bg-gray-700/50 text-sm transition-colors"
    title="Take a guided tour of this tab"
    data-testid="tour-help-btn"
  >
    <HelpCircle className="w-4 h-4" />
    <span>Tour</span>
  </button>
  <button
    onClick={() => setFeedbackOpen(true)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-400 hover:text-nvidia-green hover:bg-gray-700/50 text-sm transition-colors"
    title="Send feedback"
    data-testid="feedback-btn"
  >
    <MessageSquare className="w-4 h-4" />
    <span>Feedback</span>
  </button>
  <div data-tour="user-menu">
    <UserMenu
      isLoggedIn={isLoggedIn}
      syncStatus={syncStatus}
      userEmail={userEmail}
    />
  </div>
</div>;
```

- [ ] **Step 4: Add FeedbackModal render before closing fragment**

Just before `</>` at the end of the component's return:

```tsx
<FeedbackModal
  isOpen={feedbackOpen}
  onClose={() => setFeedbackOpen(false)}
  isLoggedIn={isLoggedIn}
/>
```

- [ ] **Step 5: Run AppHeader tests**

Run: `npx vitest run src/components/__tests__/AppHeader.test.tsx`
Expected: All tests PASS including the Feedback button test.

- [ ] **Step 6: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass.

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/AppHeader.tsx
git commit -m "feat: add Feedback button to header button group"
```

---

### Task 6: Update documentation

**Files:**

- Modify: `src/components/About.tsx`
- Modify: `src/components/__tests__/About.test.tsx`
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Add v1.3.0 changelog entry to About.tsx**

Add new entry at the top of the `CHANGELOG` array. Move `current: true` from v1.2.3 to the new entry:

```typescript
{
  version: "v1.3.0",
  title: "User Feedback",
  current: true,
  highlights: [
    "Feedback form in header — submit general feedback, bug reports, or success stories",
    "Authenticated submission via Cognito to prevent spam",
  ],
},
```

Remove `current: true` from the v1.2.3 entry.

- [ ] **Step 2: Update About.test.tsx**

Update the version test to expect `v1.3.0`:

```typescript
it("marks v1.3.0 as the current version", () => {
  render(<About />);
  const current = screen.getByTestId("current-version");
  expect(current).toHaveTextContent("v1.3.0");
  expect(screen.getByText("current")).toBeInTheDocument();
});
```

- [ ] **Step 3: Update README.md**

Add a bullet under the features section mentioning the feedback form. Update version badge from 1.2.3 to 1.3.0.

- [ ] **Step 4: Bump version**

```bash
npm version minor --no-git-tag-version && npm install --package-lock-only
```

This bumps `package.json` from 1.2.3 to 1.3.0 and syncs `package-lock.json`.

- [ ] **Step 5: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass.

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 7: Commit**

```bash
git add src/components/About.tsx src/components/__tests__/About.test.tsx README.md package.json package-lock.json
git commit -m "docs: add v1.3.0 changelog, update README and version for feedback feature"
```

---

## Execution Order

```
Task 1: Amplify schema (no deps)
Task 2: FeedbackModal tests (red)
Task 3: FeedbackModal implementation (green)
Task 4: AppHeader tests (red)
Task 5: AppHeader integration (green)
Task 6: Documentation + version bump
```

Tasks 1–3 are independent of Tasks 4–6. Within each group, order is sequential (TDD: test → implement).
