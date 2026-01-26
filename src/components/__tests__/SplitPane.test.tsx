import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitPane, SplitDivider } from '../SplitPane';
import {
  createSplitState,
  splitPane,
  type TerminalSplitState,
} from '../../utils/terminalSplitManager';

describe('SplitPane Component', () => {
  const mockOnSplit = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSelectPane = vi.fn();
  const mockOnResize = vi.fn();
  const mockRenderPane = vi.fn((terminalId: string, isActive: boolean) => (
    <div data-testid={`pane-${terminalId}`}>
      Terminal: {terminalId} {isActive ? '(active)' : ''}
    </div>
  ));

  const defaultProps = {
    onSplit: mockOnSplit,
    onClose: mockOnClose,
    onSelectPane: mockOnSelectPane,
    onResize: mockOnResize,
    renderPane: mockRenderPane,
  };

  let state: TerminalSplitState;

  beforeEach(() => {
    vi.clearAllMocks();
    state = createSplitState('terminal-1');
  });

  describe('Rendering', () => {
    it('should render single pane', () => {
      render(<SplitPane state={state} {...defaultProps} />);
      expect(screen.getByTestId('pane-terminal-1')).toBeInTheDocument();
    });

    it('should render multiple panes', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      expect(screen.getByTestId('pane-terminal-1')).toBeInTheDocument();
      expect(screen.getByTestId('pane-terminal-2')).toBeInTheDocument();
    });

    it('should call renderPane for each pane', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      // Verify renderPane was called with both terminal IDs
      // (React strict mode may cause multiple renders)
      expect(mockRenderPane).toHaveBeenCalled();
      const terminalIds = mockRenderPane.mock.calls.map(call => call[0]);
      expect(terminalIds).toContain('terminal-1');
      expect(terminalIds).toContain('terminal-2');
    });

    it('should show pane count with multiple panes', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      expect(screen.getByText('2/4 panes')).toBeInTheDocument();
    });

    it('should not show pane count with single pane', () => {
      render(<SplitPane state={state} {...defaultProps} />);

      expect(screen.queryByText(/panes$/)).not.toBeInTheDocument();
    });
  });

  describe('Pane Controls', () => {
    it('should show split buttons on hover', () => {
      render(<SplitPane state={state} {...defaultProps} />);

      // Find the pane container and hover
      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      expect(screen.getByLabelText('Split pane horizontally')).toBeInTheDocument();
      expect(screen.getByLabelText('Split pane vertically')).toBeInTheDocument();
    });

    it('should not show close button for single pane', () => {
      render(<SplitPane state={state} {...defaultProps} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      expect(screen.queryByLabelText('Close pane')).not.toBeInTheDocument();
    });

    it('should show close button for multiple panes', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      // Multiple panes means multiple close buttons exist
      expect(screen.getAllByLabelText('Close pane').length).toBeGreaterThan(0);
    });

    it('should hide controls when showControls is false', () => {
      render(<SplitPane state={state} {...defaultProps} showControls={false} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      expect(screen.queryByLabelText('Split pane horizontally')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Split pane vertically')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSelectPane when pane is clicked', () => {
      render(<SplitPane state={state} {...defaultProps} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.click(paneContainer);
      }

      expect(mockOnSelectPane).toHaveBeenCalledWith(state.root.id);
    });

    it('should call onSplit horizontal when button clicked', () => {
      render(<SplitPane state={state} {...defaultProps} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      fireEvent.click(screen.getByLabelText('Split pane horizontally'));
      expect(mockOnSplit).toHaveBeenCalledWith(state.root.id, 'horizontal');
    });

    it('should call onSplit vertical when button clicked', () => {
      render(<SplitPane state={state} {...defaultProps} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      fireEvent.click(screen.getByLabelText('Split pane vertically'));
      expect(mockOnSplit).toHaveBeenCalledWith(state.root.id, 'vertical');
    });

    it('should call onClose when close button clicked', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      const paneContainer = screen.getByTestId('pane-terminal-1').parentElement?.parentElement;
      if (paneContainer) {
        fireEvent.mouseEnter(paneContainer);
      }

      // There may be multiple close buttons (one per pane), click the first visible one
      const closeButtons = screen.getAllByLabelText('Close pane');
      fireEvent.click(closeButtons[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Active Pane', () => {
    it('should highlight active pane', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      // The active pane should have the ring class
      const paneContainers = screen.getAllByTestId(/pane-terminal/);
      const hasActivePane = paneContainers.some(
        (pane) => pane.parentElement?.parentElement?.className.includes('ring-2')
      );
      expect(hasActivePane).toBe(true);
    });

    it('should pass isActive to renderPane', () => {
      state = splitPane(state, state.root.id, 'vertical', 'terminal-2');

      render(<SplitPane state={state} {...defaultProps} />);

      // One call should have isActive=true, one should have isActive=false
      const calls = mockRenderPane.mock.calls;
      const hasActive = calls.some((call) => call[1] === true);
      const hasInactive = calls.some((call) => call[1] === false);

      expect(hasActive).toBe(true);
      expect(hasInactive).toBe(true);
    });
  });

  describe('Max Panes', () => {
    it('should hide split buttons when at max panes', () => {
      // Add panes up to max
      for (let i = 0; i < 3; i++) {
        state = splitPane(state, state.activePaneId, 'vertical', `terminal-${i + 2}`);
      }

      render(<SplitPane state={state} {...defaultProps} />);

      // Hover on a pane
      const paneContainers = screen.getAllByTestId(/pane-terminal/);
      if (paneContainers[0].parentElement?.parentElement) {
        fireEvent.mouseEnter(paneContainers[0].parentElement.parentElement);
      }

      expect(screen.queryByLabelText('Split pane horizontally')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Split pane vertically')).not.toBeInTheDocument();
    });
  });
});

describe('SplitDivider Component', () => {
  const mockOnDrag = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render horizontal divider', () => {
      const { container } = render(
        <SplitDivider direction="horizontal" onDrag={mockOnDrag} />
      );

      const divider = container.firstChild as HTMLElement;
      expect(divider.className).toContain('h-1');
      expect(divider.className).toContain('cursor-row-resize');
    });

    it('should render vertical divider', () => {
      const { container } = render(
        <SplitDivider direction="vertical" onDrag={mockOnDrag} />
      );

      const divider = container.firstChild as HTMLElement;
      expect(divider.className).toContain('w-1');
      expect(divider.className).toContain('cursor-col-resize');
    });
  });

  describe('Drag Interaction', () => {
    it('should call onDrag when dragged', () => {
      const { container } = render(
        <SplitDivider direction="vertical" onDrag={mockOnDrag} />
      );

      const divider = container.firstChild as HTMLElement;

      // Start drag
      fireEvent.mouseDown(divider, { clientX: 100 });

      // Move
      fireEvent.mouseMove(document, { clientX: 150 });

      expect(mockOnDrag).toHaveBeenCalledWith(50);
    });

    it('should stop dragging on mouse up', () => {
      const { container } = render(
        <SplitDivider direction="vertical" onDrag={mockOnDrag} />
      );

      const divider = container.firstChild as HTMLElement;

      fireEvent.mouseDown(divider, { clientX: 100 });
      fireEvent.mouseUp(document);
      mockOnDrag.mockClear();

      // This move shouldn't trigger onDrag
      fireEvent.mouseMove(document, { clientX: 200 });

      expect(mockOnDrag).not.toHaveBeenCalled();
    });
  });
});
