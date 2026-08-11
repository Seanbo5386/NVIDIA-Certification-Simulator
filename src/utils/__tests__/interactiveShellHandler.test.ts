import { describe, it, expect, vi } from "vitest";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { CommandContext } from "@/types/commands";
import {
  handleInteractiveShellInput,
  type ShellState,
  type InteractiveShellSimulator,
} from "../interactiveShellHandler";

function makeTerm() {
  const writes: string[] = [];
  return {
    term: { write: (s: string) => writes.push(s) } as unknown as XTerm,
    writes,
  };
}

const context = {
  currentNode: "dgx-00",
  currentPath: "/root",
  environment: {},
  history: [],
} as unknown as CommandContext;

/** A simulator that stays in the shell, echoing a prompt back. */
const stayingSimulator: InteractiveShellSimulator = {
  executeInteractive: () => ({
    output: "ok",
    exitCode: 0,
    prompt: "nvsm-> ",
  }),
};

/** A simulator that exits the shell (no prompt in the result). */
const exitingSimulator: InteractiveShellSimulator = {
  executeInteractive: () => ({ output: "", exitCode: 0 }),
};

describe("handleInteractiveShellInput", () => {
  it("returns bash state when the shell exits", () => {
    const { term } = makeTerm();
    const state: ShellState = { mode: "nvsm", prompt: "nvsm-> " };

    const next = handleInteractiveShellInput(
      exitingSimulator,
      "exit",
      context,
      term,
      state,
      () => {},
    );

    expect(next).toEqual({ mode: "bash", prompt: "" });
  });

  it("keeps the shell mode and adopts the new prompt when staying", () => {
    const { term } = makeTerm();
    const state: ShellState = { mode: "nvsm", prompt: "nvsm-> " };

    const next = handleInteractiveShellInput(
      stayingSimulator,
      "show health",
      context,
      term,
      state,
      () => {},
    );

    expect(next).toEqual({ mode: "nvsm", prompt: "nvsm-> " });
  });

  // -------------------------------------------------------------------------
  // The prompt is rendered from shell state the CALLER owns, so the handler
  // must publish the new state before asking for a prompt. Otherwise `exit`
  // from nvsm draws "nvsm> " even though the next keystroke is routed to bash,
  // and a prompt-changing cmsh command draws the previous prompt.
  // -------------------------------------------------------------------------
  it("publishes the new state before the prompt is drawn, on exit", () => {
    const { term } = makeTerm();
    const state: ShellState = { mode: "nvsm", prompt: "nvsm-> " };

    let modeSeenByPrompt: string | undefined;
    let published: ShellState | undefined;

    handleInteractiveShellInput(
      exitingSimulator,
      "exit",
      context,
      term,
      state,
      () => {
        modeSeenByPrompt = published?.mode;
      },
      (s) => {
        published = s;
      },
    );

    expect(modeSeenByPrompt).toBe("bash");
  });

  it("publishes the updated prompt before it is drawn, when staying in the shell", () => {
    const { term } = makeTerm();
    const state: ShellState = { mode: "nvsm", prompt: "old> " };

    let promptSeenByPrompt: string | undefined;
    let published: ShellState | undefined;

    handleInteractiveShellInput(
      stayingSimulator,
      "cd subsystem",
      context,
      term,
      state,
      () => {
        promptSeenByPrompt = published?.prompt;
      },
      (s) => {
        published = s;
      },
    );

    expect(promptSeenByPrompt).toBe("nvsm-> ");
  });

  it("still works when no state-publishing callback is supplied", () => {
    const { term } = makeTerm();
    const state: ShellState = { mode: "nvsm", prompt: "nvsm-> " };
    const promptFn = vi.fn();

    const next = handleInteractiveShellInput(
      exitingSimulator,
      "exit",
      context,
      term,
      state,
      promptFn,
    );

    expect(next).toEqual({ mode: "bash", prompt: "" });
    expect(promptFn).toHaveBeenCalledOnce();
  });
});
