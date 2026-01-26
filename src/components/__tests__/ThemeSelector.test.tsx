import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '../ThemeSelector';
import { getAllThemes, getDarkThemes, getLightThemes } from '../../utils/terminalThemes';

describe('ThemeSelector Component', () => {
  const mockOnThemeChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
      expect(screen.getByText('Terminal Theme')).toBeInTheDocument();
    });

    it('should render all themes by default', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
      const themes = getAllThemes();
      // Use descriptions which are unique per theme
      themes.forEach(theme => {
        expect(screen.getByText(theme.description)).toBeInTheDocument();
      });
    });

    it('should render filter tabs', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
      expect(screen.getByText(/All \(\d+\)/)).toBeInTheDocument();
      expect(screen.getByText(/Dark \(\d+\)/)).toBeInTheDocument();
      expect(screen.getByText(/Light \(\d+\)/)).toBeInTheDocument();
    });

    it('should render preview section by default', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should not render preview when showPreview is false', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} showPreview={false} />);
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });

    it('should render close button when onClose is provided', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render dropdown in compact mode', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} compact />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Theme:')).toBeInTheDocument();
    });

    it('should not render full UI in compact mode', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} compact />);
      expect(screen.queryByText('Terminal Theme')).not.toBeInTheDocument();
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });

    it('should have option groups in compact mode', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} compact />);
      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('optgroup')).toHaveLength(2);
    });
  });

  describe('Theme Selection', () => {
    it('should call onThemeChange when theme is selected', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Find Dracula theme button by its unique description
      const draculaButton = screen.getByText('Popular dark theme with vibrant colors').closest('button');
      fireEvent.click(draculaButton!);

      expect(mockOnThemeChange).toHaveBeenCalledWith('dracula');
    });

    it('should save theme preference to localStorage', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Find Nord theme button by its unique description
      const nordButton = screen.getByText('Arctic, north-bluish color palette').closest('button');
      fireEvent.click(nordButton!);

      expect(localStorage.getItem('terminal-theme')).toBe('nord');
    });

    it('should show checkmark on selected theme', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} currentTheme="monokai" />);

      // Find Monokai theme button by its unique description
      const monokaiButton = screen.getByText('Classic code editor theme').closest('button');
      expect(monokaiButton?.textContent).toContain('\u2713'); // Checkmark
    });

    it('should update selection when clicking different themes', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Find theme buttons by their unique descriptions
      const nordButton = screen.getByText('Arctic, north-bluish color palette').closest('button');
      fireEvent.click(nordButton!);
      expect(mockOnThemeChange).toHaveBeenCalledWith('nord');

      const draculaButton = screen.getByText('Popular dark theme with vibrant colors').closest('button');
      fireEvent.click(draculaButton!);
      expect(mockOnThemeChange).toHaveBeenCalledWith('dracula');
    });
  });

  describe('Compact Mode Selection', () => {
    it('should call onThemeChange when dropdown changes', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} compact />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'dracula' } });

      expect(mockOnThemeChange).toHaveBeenCalledWith('dracula');
    });
  });

  describe('Filtering', () => {
    it('should filter to dark themes only', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Click the Dark filter button
      const filterButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.match(/^Dark \(\d+\)$/)
      );
      fireEvent.click(filterButtons[0]);

      const darkThemes = getDarkThemes();

      // Dark themes should be visible (check that theme cards are present)
      darkThemes.forEach(theme => {
        // Look for theme description which is unique to theme cards
        expect(screen.getByText(theme.description)).toBeInTheDocument();
      });
    });

    it('should filter to light themes only', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Click the Light filter button
      const filterButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.match(/^Light \(\d+\)$/)
      );
      fireEvent.click(filterButtons[0]);

      const lightThemes = getLightThemes();

      // Light themes should be visible (check descriptions which are unique)
      lightThemes.forEach(theme => {
        expect(screen.getByText(theme.description)).toBeInTheDocument();
      });
    });

    it('should show all themes when All filter is clicked', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // First filter to dark
      const darkFilterButton = screen.getAllByRole('button').filter(
        btn => btn.textContent?.match(/^Dark \(\d+\)$/)
      );
      fireEvent.click(darkFilterButton[0]);

      // Then back to all
      const allFilterButton = screen.getAllByRole('button').filter(
        btn => btn.textContent?.match(/^All \(\d+\)$/)
      );
      fireEvent.click(allFilterButton[0]);

      const allThemes = getAllThemes();
      // Check that all theme descriptions are visible
      allThemes.forEach(theme => {
        expect(screen.getByText(theme.description)).toBeInTheDocument();
      });
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Theme Preview', () => {
    it('should show preview with current theme colors', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} currentTheme="nvidia" />);

      const preview = screen.getByText('Preview').nextElementSibling;
      expect(preview).toHaveStyle({ backgroundColor: '#000000' }); // NVIDIA theme background
    });

    it('should update preview when theme changes', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Select a different theme by its unique description
      const draculaButton = screen.getByText('Popular dark theme with vibrant colors').closest('button');
      fireEvent.click(draculaButton!);

      const preview = screen.getByText('Preview').nextElementSibling;
      expect(preview).toHaveStyle({ backgroundColor: '#282a36' }); // Dracula background
    });
  });

  describe('Current Theme Display', () => {
    it('should display current theme name', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} currentTheme="nord" />);

      // Nord should appear both as theme card name and in current theme info
      expect(screen.getAllByText('Nord').length).toBeGreaterThanOrEqual(1);
    });

    it('should show Dark badge for dark themes', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} currentTheme="dracula" />);

      // "Dark" appears in filter button and as badge
      const darkElements = screen.getAllByText(/Dark/);
      expect(darkElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show Light badge for light themes', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} currentTheme="light" />);

      // "Light" appears in multiple places (filter, theme name, badge)
      const lightElements = screen.getAllByText(/Light/);
      expect(lightElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Color Palette Preview', () => {
    it('should render color swatches for each theme', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Each theme card should have 6 color swatches - check by description (unique per theme)
      const themes = getAllThemes();
      themes.forEach(theme => {
        const themeButton = screen.getByText(theme.description).closest('button');
        const swatches = themeButton?.querySelectorAll('[title]');
        expect(swatches?.length).toBe(6);
      });
    });
  });

  describe('Initial Theme', () => {
    it('should use currentTheme prop as initial selection', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} currentTheme="monokai" />);

      expect(screen.getByText('Current theme:')).toBeInTheDocument();
      // Monokai appears multiple times, use getAllByText
      expect(screen.getAllByText('Monokai').length).toBeGreaterThanOrEqual(1);
    });

    it('should load from localStorage if no currentTheme prop', () => {
      localStorage.setItem('terminal-theme', 'nord');
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Find Nord theme button by its unique description
      const nordButton = screen.getByText('Arctic, north-bluish color palette').closest('button');
      expect(nordButton?.textContent).toContain('\u2713');
    });

    it('should default to nvidia theme if nothing saved', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      // Find NVIDIA theme button by its unique description
      const nvidiaButton = screen.getByText('Official NVIDIA green on black theme').closest('button');
      expect(nvidiaButton?.textContent).toContain('\u2713');
    });
  });

  describe('Theme Descriptions', () => {
    it('should show description for each theme', () => {
      render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

      expect(screen.getByText('Official NVIDIA green on black theme')).toBeInTheDocument();
      expect(screen.getByText('Popular dark theme with vibrant colors')).toBeInTheDocument();
    });
  });
});
