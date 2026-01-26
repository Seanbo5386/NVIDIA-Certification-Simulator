import { useEffect, useRef } from 'react';
import type { Terminal as XTerm } from 'xterm';
import { useSimulationStore } from '@/store/simulationStore';

/**
 * Custom hook for lab start and completion feedback
 *
 * Displays terminal messages when:
 * - A new lab scenario starts
 * - A lab scenario is completed
 *
 * @param term - XTerm terminal instance
 * @param isReady - Whether the terminal is ready for output
 * @param selectedNode - Currently selected node name
 */
export function useLabFeedback(
  term: XTerm | null,
  isReady: boolean,
  selectedNode: string
) {
  const activeScenario = useSimulationStore(state => state.activeScenario);
  const scenarioProgress = useSimulationStore(state => state.scenarioProgress);
  const previousScenarioId = useRef<string | null>(null);
  const completedScenariosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!term || !isReady) return;

    // Detect Lab Start
    if (activeScenario && activeScenario.id !== previousScenarioId.current) {
      // New scenario started
      previousScenarioId.current = activeScenario.id;

      // Print welcome header
      term.writeln('');
      term.writeln('\x1b[1;32m╔════════════════════════════════════════════════════════════╗\x1b[0m');
      // Box has 60 chars between borders. "  STARTING LAB: " = 17 chars, so 60 - 17 = 43 chars for title
      term.writeln(`\x1b[1;32m║  STARTING LAB: ${activeScenario.title.padEnd(43).slice(0, 43)}║\x1b[0m`);
      term.writeln('\x1b[1;32m╚════════════════════════════════════════════════════════════╝\x1b[0m');
      term.writeln(`\x1b[36m${activeScenario.description || ''}\x1b[0m`);
      term.writeln('');
      term.writeln('Type "help" for commands. Follow the instructions in the side panel.');

      const node = selectedNode || 'dgx-00';
      term.write(`\n\x1b[1;32mroot@${node}\x1b[0m:\x1b[1;34m~\x1b[0m# `);
      return;
    }

    // Detect Lab Completion
    if (activeScenario) {
      const progress = scenarioProgress[activeScenario.id];
      if (progress?.completed && !completedScenariosRef.current.has(activeScenario.id)) {
        completedScenariosRef.current.add(activeScenario.id);

        term.writeln('');
        term.writeln('');
        term.writeln('\x1b[1;32m╔════════════════════════════════════════════════════════════╗\x1b[0m');
        term.writeln('\x1b[1;32m║  LAB COMPLETED SUCCESSFULLY!                               ║\x1b[0m');
        term.writeln('\x1b[1;32m╚════════════════════════════════════════════════════════════╝\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[1;33mAccomplishments:\x1b[0m');
        activeScenario.learningObjectives.forEach(obj => {
          term.writeln(`  \x1b[32m✓\x1b[0m ${obj}`);
        });
        term.writeln('');
        term.writeln('\x1b[36mYou may now exit successfully or continue exploring.\x1b[0m');

        const node = selectedNode || 'dgx-00';
        term.write(`\n\x1b[1;32mroot@${node}\x1b[0m:\x1b[1;34m~\x1b[0m# `);
      }
    } else {
      previousScenarioId.current = null;
    }
  }, [activeScenario, scenarioProgress, isReady, selectedNode, term]);
}
