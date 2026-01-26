import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalTabs } from '../TerminalTabs';
import {
  createTabManagerState,
  addTab,
  type TerminalTabState,
} from '../../utils/terminalTabManager';

describe('TerminalTabs Component', () => {
  const mockOnAddTab = vi.fn();
  const mockOnRemoveTab = vi.fn();
  const mockOnSelectTab = vi.fn();
  const mockOnRenameTab = vi.fn();
  const mockOnDuplicateTab = vi.fn();
  const mockOnMoveTab = vi.fn();

  const defaultProps = {
    onAddTab: mockOnAddTab,
    onRemoveTab: mockOnRemoveTab,
    onSelectTab: mockOnSelectTab,
    onRenameTab: mockOnRenameTab,
    onDuplicateTab: mockOnDuplicateTab,
    onMoveTab: mockOnMoveTab,
  };

  let state: TerminalTabState;

  beforeEach(() => {
    vi.clearAllMocks();
    state = createTabManagerState();
  });

  describe('Rendering', () => {
    it('should render the tab bar', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);
      expect(screen.getByRole('tab')).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      state = addTab(state, 'Tab 2');
      state = addTab(state, 'Tab 3');

      render(<TerminalTabs state={state} {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('should show tab names', () => {
      state = addTab(state, 'Custom Tab');

      render(<TerminalTabs state={state} {...defaultProps} />);

      expect(screen.getByText('Terminal 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Tab')).toBeInTheDocument();
    });

    it('should show add button by default', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);
      expect(screen.getByLabelText('Add new terminal tab')).toBeInTheDocument();
    });

    it('should hide add button when showAddButton is false', () => {
      render(<TerminalTabs state={state} {...defaultProps} showAddButton={false} />);
      expect(screen.queryByLabelText('Add new terminal tab')).not.toBeInTheDocument();
    });

    it('should show tab count indicator', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);
      expect(screen.getByText('1/8')).toBeInTheDocument();
    });

    it('should show close buttons when multiple tabs exist', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      const closeButtons = screen.getAllByLabelText(/Close/);
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should not show close button for single tab', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);
      expect(screen.queryByLabelText(/Close Terminal 1/)).not.toBeInTheDocument();
    });

    it('should hide close buttons when showCloseButtons is false', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} showCloseButtons={false} />);

      expect(screen.queryByLabelText(/Close/)).not.toBeInTheDocument();
    });
  });

  describe('Tab Selection', () => {
    it('should highlight active tab', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
      expect(activeTab).toBeDefined();
    });

    it('should call onSelectTab when clicking a tab', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      fireEvent.click(screen.getByText('Terminal 1'));
      expect(mockOnSelectTab).toHaveBeenCalledWith(state.tabs[0].id);
    });
  });

  describe('Tab Addition', () => {
    it('should call onAddTab when clicking add button', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Add new terminal tab'));
      expect(mockOnAddTab).toHaveBeenCalled();
    });

    it('should hide add button when at max tabs', () => {
      // Fill up to max tabs
      for (let i = 0; i < 7; i++) {
        state = addTab(state);
      }

      render(<TerminalTabs state={state} {...defaultProps} />);
      expect(screen.queryByLabelText('Add new terminal tab')).not.toBeInTheDocument();
    });
  });

  describe('Tab Removal', () => {
    it('should call onRemoveTab when clicking close button', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      const closeButtons = screen.getAllByLabelText(/Close/);
      fireEvent.click(closeButtons[0]);

      expect(mockOnRemoveTab).toHaveBeenCalled();
    });
  });

  describe('Tab Renaming', () => {
    it('should show input on double-click', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      fireEvent.doubleClick(tab);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should call onRenameTab on Enter', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      fireEvent.doubleClick(tab);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnRenameTab).toHaveBeenCalledWith(state.tabs[0].id, 'New Name');
    });

    it('should cancel rename on Escape', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      fireEvent.doubleClick(tab);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockOnRenameTab).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should rename on blur', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      fireEvent.doubleClick(tab);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Blurred Name' } });
      fireEvent.blur(input);

      expect(mockOnRenameTab).toHaveBeenCalledWith(state.tabs[0].id, 'Blurred Name');
    });
  });

  describe('Context Menu', () => {
    it('should show context menu on right-click', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      fireEvent.contextMenu(tab);

      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
    });

    it('should call onDuplicateTab from context menu', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      fireEvent.contextMenu(tab);

      fireEvent.click(screen.getByText('Duplicate'));
      expect(mockOnDuplicateTab).toHaveBeenCalledWith(state.tabs[0].id);
    });

    it('should show move options when onMoveTab is provided', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      fireEvent.contextMenu(tabs[0]);

      expect(screen.getByText('Move Left')).toBeInTheDocument();
      expect(screen.getByText('Move Right')).toBeInTheDocument();
    });

    it('should show close option in context menu', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByText('Tab 2').closest('[role="tab"]');
      fireEvent.contextMenu(tab!);

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should call onRemoveTab from context menu close', () => {
      state = addTab(state, 'Tab 2');
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByText('Tab 2').closest('[role="tab"]');
      fireEvent.contextMenu(tab!);

      fireEvent.click(screen.getByText('Close'));
      expect(mockOnRemoveTab).toHaveBeenCalled();
    });
  });

  describe('Shell Mode Indicator', () => {
    it('should show $ for bash mode', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);
      expect(screen.getByText('$')).toBeInTheDocument();
    });
  });

  describe('Tab Numbers', () => {
    it('should show tab numbers for first 9 tabs', () => {
      state = addTab(state, 'Tab 2');
      state = addTab(state, 'Tab 3');

      render(<TerminalTabs state={state} {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should apply compact styles when compact is true', () => {
      render(<TerminalTabs state={state} {...defaultProps} compact />);

      const tabs = screen.getByRole('tab');
      expect(tabs.className).toContain('h-8');
      expect(tabs.className).toContain('text-xs');
    });
  });

  describe('Tab Tooltip', () => {
    it('should show tooltip with tab name and shell mode', () => {
      render(<TerminalTabs state={state} {...defaultProps} />);

      const tab = screen.getByRole('tab');
      expect(tab.getAttribute('title')).toBe('Terminal 1 (bash)');
    });
  });
});
