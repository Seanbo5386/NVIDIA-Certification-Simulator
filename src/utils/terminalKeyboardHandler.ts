import type { Terminal as XTerm } from 'xterm';

/**
 * Configuration for keyboard input handler
 */
export interface KeyboardHandlerConfig {
  term: XTerm;
  commandHistory: string[];
  historyIndex: number;
  currentLine: string;
  currentNode: string;
  onExecute: (cmdLine: string) => void;
  onHistoryChange: (index: number) => void;
  onLineChange: (line: string) => void;
  onPrompt: () => void;
}

/**
 * Result from keyboard input handling
 * Contains updated state that should be applied by the caller
 */
export interface KeyboardHandlerResult {
  currentLine: string;
  historyIndex: number;
}

/**
 * Handle keyboard input for terminal
 *
 * This utility centralizes keyboard event handling including:
 * - Enter: Execute command
 * - Backspace: Delete character
 * - Ctrl+C: Cancel input
 * - Ctrl+L: Clear screen
 * - Up/Down arrows: Command history navigation
 * - Tab: Autocomplete (placeholder)
 * - Regular characters: Input
 *
 * @param data - Raw keyboard data from XTerm
 * @param config - Configuration including terminal state and callbacks
 * @returns Updated state (currentLine, historyIndex) or null if no state change
 */
export function handleKeyboardInput(
  data: string,
  config: KeyboardHandlerConfig
): KeyboardHandlerResult | null {
  const code = data.charCodeAt(0);
  const { term, commandHistory, historyIndex, currentLine, currentNode, onExecute, onPrompt } = config;

  // Handle Enter
  if (code === 13) {
    term.writeln('');
    onExecute(currentLine);
    return {
      currentLine: '',
      historyIndex: -1,
    };
  }

  // Handle Backspace
  if (code === 127) {
    if (currentLine.length > 0) {
      const newLine = currentLine.slice(0, -1);
      term.write('\b \b');
      return {
        currentLine: newLine,
        historyIndex,
      };
    }
    return null;
  }

  // Handle Ctrl+C
  if (code === 3) {
    term.writeln('^C');
    onPrompt();
    return {
      currentLine: '',
      historyIndex,
    };
  }

  // Handle Ctrl+L (clear)
  if (code === 12) {
    term.clear();
    onPrompt();
    return null;
  }

  // Handle arrow keys
  if (data === '\x1b[A') { // Up arrow
    if (commandHistory.length > 0) {
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      const historyCmd = commandHistory[newIndex];

      // Clear current line and redraw with history command
      term.write('\r\x1b[K');
      term.write(`\x1b[1;32mroot@${currentNode}\x1b[0m:\x1b[1;34m~\x1b[0m# ${historyCmd}`);

      return {
        currentLine: historyCmd,
        historyIndex: newIndex,
      };
    }
    return null;
  }

  if (data === '\x1b[B') { // Down arrow
    if (historyIndex !== -1) {
      const newIndex = historyIndex + 1;

      if (newIndex >= commandHistory.length) {
        // Reached end of history, clear line
        term.write('\r\x1b[K');
        term.write(`\x1b[1;32mroot@${currentNode}\x1b[0m:\x1b[1;34m~\x1b[0m# `);
        return {
          currentLine: '',
          historyIndex: -1,
        };
      } else {
        const historyCmd = commandHistory[newIndex];
        term.write('\r\x1b[K');
        term.write(`\x1b[1;32mroot@${currentNode}\x1b[0m:\x1b[1;34m~\x1b[0m# ${historyCmd}`);
        return {
          currentLine: historyCmd,
          historyIndex: newIndex,
        };
      }
    }
    return null;
  }

  // Handle Tab (autocomplete placeholder)
  if (code === 9) {
    return null;
  }

  // Regular character input
  if (code >= 32 && code < 127) {
    const newLine = currentLine + data;
    term.write(data);
    return {
      currentLine: newLine,
      historyIndex,
    };
  }

  return null;
}
