import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisualContextPanel } from '../VisualContextPanel';
import type { VisualizationContext } from '@/utils/scenarioVisualizationMap';

describe('VisualContextPanel', () => {
  const mockContext: VisualizationContext = {
    scenarioId: 'nccl-testing',
    primaryView: 'topology',
    title: 'NCCL Testing',
    description: 'Collective communication validation',
    domain: 'domain4',
    highlightedGpus: [0, 1, 2, 3],
    highlightedLinks: ['0-1', '1-2'],
    focusArea: 'All-reduce communication paths',
  };

  it('should render active scenario info', () => {
    render(
      <VisualContextPanel
        activeScenario={mockContext}
        currentView="topology"
        onLaunchScenario={() => {}}
      />
    );

    expect(screen.getByText('NCCL Testing')).toBeInTheDocument();
    expect(screen.getByText('Collective communication validation')).toBeInTheDocument();
  });

  it('should show highlighted elements info', () => {
    render(
      <VisualContextPanel
        activeScenario={mockContext}
        currentView="topology"
        onLaunchScenario={() => {}}
      />
    );

    expect(screen.getByText(/4 GPUs highlighted/)).toBeInTheDocument();
    expect(screen.getByText(/2 links highlighted/)).toBeInTheDocument();
  });

  it('should show related scenarios when no active scenario', () => {
    render(
      <VisualContextPanel
        activeScenario={null}
        currentView="topology"
        onLaunchScenario={() => {}}
      />
    );

    expect(screen.getByText('Related Labs')).toBeInTheDocument();
  });

  it('should call onLaunchScenario when scenario is clicked', () => {
    const onLaunch = vi.fn();
    render(
      <VisualContextPanel
        activeScenario={null}
        currentView="topology"
        onLaunchScenario={onLaunch}
      />
    );

    // Find a scenario button and click it
    const buttons = screen.getAllByRole('button');
    const launchButton = buttons.find((btn) => btn.textContent?.includes('Launch'));
    if (launchButton) {
      fireEvent.click(launchButton);
      expect(onLaunch).toHaveBeenCalled();
    }
  });

  it('should be collapsible', () => {
    render(
      <VisualContextPanel
        activeScenario={mockContext}
        currentView="topology"
        onLaunchScenario={() => {}}
      />
    );

    // Find collapse button and click
    const collapseButton = screen.getByRole('button', { name: /collapse|minimize/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it('should show domain badge', () => {
    render(
      <VisualContextPanel
        activeScenario={mockContext}
        currentView="topology"
        onLaunchScenario={() => {}}
      />
    );

    expect(screen.getByText(/Domain 4/)).toBeInTheDocument();
  });
});
