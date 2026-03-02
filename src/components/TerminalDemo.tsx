import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LineType =
  | "briefing"
  | "narrative"
  | "prompt"
  | "command"
  | "output"
  | "blank";

interface SequenceLine {
  type: LineType;
  text: string;
  /** Delay in ms *before* this line appears */
  delay: number;
}

// ---------------------------------------------------------------------------
// Sequence data
// ---------------------------------------------------------------------------

const NVIDIA_SMI_OUTPUT = [
  "+-------------------------------------------------------------------------+",
  "| GPU  Name         Persistence-M | Bus-Id        Disp. | Volatile ECC  |",
  "| Fan  Temp   Perf  Pwr:Usage/Cap |         Memory-Usage | GPU-Util      |",
  "|=========================================================================|",
  "|  0   A100-SXM4-80GB    On       | 00000000:07:00.0 Off |            0  |",
  "| N/A   34C    P0    72W / 400W   |    521MiB / 81920MiB |     0%        |",
  "|  3   A100-SXM4-80GB    On       | 00000000:BD:00.0 Off |            8  |",
  "| N/A   91C    P0   389W / 400W   |  79872MiB / 81920MiB |    97%        |",
  "+-------------------------------------------------------------------------+",
];

const DCGMI_OUTPUT = [
  "+---------------------------+",
  "| Diagnostic Results        |",
  "+===========================+",
  "| GPU 0: PASS               |",
  "| GPU 3: FAIL               |",
  "|   XID Error 63 detected   |",
  "|   Memory row remap needed |",
  "+---------------------------+",
];

const CHAR_DELAY = 50; // ms per character for typing animation

const SEQUENCE: SequenceLine[] = [
  { type: "briefing", text: "[MISSION BRIEFING]", delay: 400 },
  { type: "narrative", text: "The Midnight Deployment", delay: 300 },
  {
    type: "narrative",
    text: "It's 2AM. The ML training pipeline on DGX Node 3 crashed",
    delay: 600,
  },
  {
    type: "narrative",
    text: "30 minutes ago. You need to diagnose the issue...",
    delay: 400,
  },
  { type: "blank", text: "", delay: 800 },
  { type: "prompt", text: "root@dgx-00:~# ", delay: 300 },
  { type: "command", text: "nvidia-smi", delay: 0 },
  {
    type: "output",
    text: NVIDIA_SMI_OUTPUT.join("\n"),
    delay: 400,
  },
  { type: "blank", text: "", delay: 600 },
  { type: "prompt", text: "root@dgx-00:~# ", delay: 300 },
  { type: "command", text: "dcgmi diag -r 1", delay: 0 },
  {
    type: "output",
    text: DCGMI_OUTPUT.join("\n"),
    delay: 400,
  },
  { type: "blank", text: "", delay: 600 },
  { type: "prompt", text: "root@dgx-00:~# ", delay: 300 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

// ---------------------------------------------------------------------------
// Visible line model (what has been rendered so far)
// ---------------------------------------------------------------------------

interface VisibleLine {
  type: LineType;
  text: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TerminalDemo: React.FC = () => {
  const [lines, setLines] = useState<VisibleLine[]>([]);
  const [typingText, setTypingText] = useState<string | null>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const runSequence = useCallback(async (signal: AbortSignal) => {
    for (let i = 0; i < SEQUENCE.length; i++) {
      const line = SEQUENCE[i];

      // Wait the delay before showing this line
      if (line.delay > 0) {
        await sleep(line.delay, signal);
      }

      if (line.type === "command") {
        // Typing animation: character by character
        for (let c = 0; c <= line.text.length; c++) {
          setTypingText(line.text.slice(0, c));
          if (c < line.text.length) {
            await sleep(CHAR_DELAY, signal);
          }
        }
        // After typing is done, commit the command line by appending the
        // typed text to the previous prompt line and clear typing state
        setLines((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].type === "prompt") {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: updated[lastIdx].text + line.text,
            };
          }
          return updated;
        });
        setTypingText(null);
      } else {
        // Show the full line at once
        setLines((prev) => [...prev, { type: line.type, text: line.text }]);
      }
    }

    // Animation complete — show blinking cursor on final prompt
    setShowCursor(true);
    setAnimationDone(true);
  }, []);

  // Auto-scroll terminal body to bottom as new lines appear
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, typingText]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    runSequence(controller.signal).catch((err) => {
      if (err?.name !== "AbortError") {
        // Unexpected error — log but don't crash
        console.error("TerminalDemo animation error:", err);
      }
    });

    return () => {
      controller.abort();
    };
  }, [runSequence]);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderLine = (line: VisibleLine, index: number) => {
    if (line.type === "blank") {
      return <div key={index} className="h-4" />;
    }

    if (line.type === "briefing") {
      return (
        <div key={index} className="font-bold" style={{ color: "#76B900" }}>
          {line.text}
        </div>
      );
    }

    if (line.type === "narrative") {
      // First narrative line (title) is white+bold, rest are gray
      const isTitle = line.text === "The Midnight Deployment";
      return (
        <div
          key={index}
          className={isTitle ? "font-bold text-white" : "text-gray-400"}
        >
          {line.text}
        </div>
      );
    }

    if (line.type === "prompt") {
      // If this is the last line, the animation may still be typing onto it
      const isLastLine = index === lines.length - 1;
      const isTyping = isLastLine && typingText !== null;
      const showFinalCursor = isLastLine && animationDone && showCursor;

      return (
        <div key={index} className="flex">
          <span style={{ color: "#76B900" }}>{line.text}</span>
          {isTyping && <span className="text-white">{typingText}</span>}
          {isTyping && (
            <span
              className="inline-block w-2 h-4 ml-px animate-blink"
              style={{ backgroundColor: "#76B900" }}
            />
          )}
          {showFinalCursor && (
            <span
              className="inline-block w-2 h-4 ml-px animate-blink"
              style={{ backgroundColor: "#76B900" }}
            />
          )}
        </div>
      );
    }

    if (line.type === "output") {
      return (
        <div key={index} className="text-gray-400 whitespace-pre">
          {line.text}
        </div>
      );
    }

    // Fallback (command text already merged into prompt)
    return (
      <div key={index} className="text-white">
        {line.text}
      </div>
    );
  };

  return (
    <div
      data-testid="terminal-demo"
      className="rounded-lg border border-gray-700 bg-gray-950 overflow-hidden font-mono text-xs leading-relaxed"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-gray-400">
          Terminal &mdash; dgx-00
        </span>
      </div>

      {/* Terminal body */}
      <div
        ref={bodyRef}
        className="p-4 max-h-[420px] overflow-y-auto scrollbar-thin"
      >
        {lines.map((line, i) => renderLine(line, i))}
      </div>

      {/* Blink keyframes injected via style tag */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
};
