import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TERMINAL_THEMES,
  getTheme,
  getAllThemes,
  getDarkThemes,
  getLightThemes,
  saveThemePreference,
  loadThemePreference,
  getThemeAnsiColors,
  getThemeCssVariables,
  type ThemeId,
} from '../terminalThemes';

describe('terminalThemes', () => {
  describe('TERMINAL_THEMES', () => {
    it('should have all expected themes', () => {
      const expectedThemes: ThemeId[] = [
        'nvidia',
        'dark',
        'light',
        'solarized-dark',
        'solarized-light',
        'monokai',
        'dracula',
        'nord',
        'gruvbox-dark',
        'one-dark',
      ];

      expectedThemes.forEach(themeId => {
        expect(TERMINAL_THEMES[themeId]).toBeDefined();
      });
    });

    it('should have 10 themes total', () => {
      expect(Object.keys(TERMINAL_THEMES)).toHaveLength(10);
    });

    it('each theme should have required properties', () => {
      Object.values(TERMINAL_THEMES).forEach(config => {
        expect(config.id).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.theme).toBeDefined();
        expect(typeof config.isDark).toBe('boolean');
      });
    });

    it('each theme should have required color properties', () => {
      Object.values(TERMINAL_THEMES).forEach(config => {
        const theme = config.theme;
        expect(theme.background).toBeDefined();
        expect(theme.foreground).toBeDefined();
        expect(theme.cursor).toBeDefined();
        expect(theme.black).toBeDefined();
        expect(theme.red).toBeDefined();
        expect(theme.green).toBeDefined();
        expect(theme.yellow).toBeDefined();
        expect(theme.blue).toBeDefined();
        expect(theme.magenta).toBeDefined();
        expect(theme.cyan).toBeDefined();
        expect(theme.white).toBeDefined();
      });
    });
  });

  describe('getTheme', () => {
    it('should return nvidia theme for nvidia id', () => {
      const theme = getTheme('nvidia');
      expect(theme.id).toBe('nvidia');
      expect(theme.name).toBe('NVIDIA');
    });

    it('should return correct theme for each id', () => {
      const themeIds: ThemeId[] = ['dark', 'light', 'monokai', 'dracula', 'nord'];
      themeIds.forEach(id => {
        const theme = getTheme(id);
        expect(theme.id).toBe(id);
      });
    });

    it('should return nvidia theme for invalid id', () => {
      // @ts-expect-error Testing invalid input
      const theme = getTheme('invalid-theme');
      expect(theme.id).toBe('nvidia');
    });
  });

  describe('getAllThemes', () => {
    it('should return all themes', () => {
      const themes = getAllThemes();
      expect(themes).toHaveLength(10);
    });

    it('should return array of theme configs', () => {
      const themes = getAllThemes();
      themes.forEach(theme => {
        expect(theme.id).toBeDefined();
        expect(theme.theme).toBeDefined();
      });
    });
  });

  describe('getDarkThemes', () => {
    it('should return only dark themes', () => {
      const darkThemes = getDarkThemes();
      darkThemes.forEach(theme => {
        expect(theme.isDark).toBe(true);
      });
    });

    it('should have at least 7 dark themes', () => {
      const darkThemes = getDarkThemes();
      expect(darkThemes.length).toBeGreaterThanOrEqual(7);
    });

    it('should include nvidia theme', () => {
      const darkThemes = getDarkThemes();
      const nvidia = darkThemes.find(t => t.id === 'nvidia');
      expect(nvidia).toBeDefined();
    });
  });

  describe('getLightThemes', () => {
    it('should return only light themes', () => {
      const lightThemes = getLightThemes();
      lightThemes.forEach(theme => {
        expect(theme.isDark).toBe(false);
      });
    });

    it('should have at least 2 light themes', () => {
      const lightThemes = getLightThemes();
      expect(lightThemes.length).toBeGreaterThanOrEqual(2);
    });

    it('should include light and solarized-light themes', () => {
      const lightThemes = getLightThemes();
      const light = lightThemes.find(t => t.id === 'light');
      const solarizedLight = lightThemes.find(t => t.id === 'solarized-light');
      expect(light).toBeDefined();
      expect(solarizedLight).toBeDefined();
    });
  });

  describe('Theme persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    describe('saveThemePreference', () => {
      it('should save theme to localStorage', () => {
        saveThemePreference('dracula');
        expect(localStorage.getItem('terminal-theme')).toBe('dracula');
      });

      it('should overwrite existing preference', () => {
        saveThemePreference('nvidia');
        saveThemePreference('monokai');
        expect(localStorage.getItem('terminal-theme')).toBe('monokai');
      });
    });

    describe('loadThemePreference', () => {
      it('should load saved theme preference', () => {
        localStorage.setItem('terminal-theme', 'nord');
        const loaded = loadThemePreference();
        expect(loaded).toBe('nord');
      });

      it('should return nvidia for no saved preference', () => {
        const loaded = loadThemePreference();
        expect(loaded).toBe('nvidia');
      });

      it('should return nvidia for invalid saved preference', () => {
        localStorage.setItem('terminal-theme', 'invalid-theme');
        const loaded = loadThemePreference();
        expect(loaded).toBe('nvidia');
      });
    });

    describe('localStorage unavailable', () => {
      it('should handle localStorage errors gracefully when saving', () => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = vi.fn().mockImplementation(() => {
          throw new Error('localStorage unavailable');
        });

        expect(() => saveThemePreference('dracula')).not.toThrow();

        localStorage.setItem = originalSetItem;
      });

      it('should handle localStorage errors gracefully when loading', () => {
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = vi.fn().mockImplementation(() => {
          throw new Error('localStorage unavailable');
        });

        const result = loadThemePreference();
        expect(result).toBe('nvidia');

        localStorage.getItem = originalGetItem;
      });
    });
  });

  describe('getThemeAnsiColors', () => {
    it('should return semantic color mapping', () => {
      const colors = getThemeAnsiColors('nvidia');
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
      expect(colors.success).toBeDefined();
      expect(colors.error).toBeDefined();
      expect(colors.warning).toBeDefined();
      expect(colors.info).toBeDefined();
    });

    it('should map theme colors correctly', () => {
      const colors = getThemeAnsiColors('nvidia');
      expect(colors.success).toBe('#76B900'); // NVIDIA green
    });

    it('should return colors for all themes', () => {
      getAllThemes().forEach(config => {
        const colors = getThemeAnsiColors(config.id);
        expect(colors).toBeDefined();
        expect(Object.keys(colors)).toHaveLength(6);
      });
    });
  });

  describe('getThemeCssVariables', () => {
    it('should return CSS variable object', () => {
      const vars = getThemeCssVariables('nvidia');
      expect(vars['--terminal-bg']).toBe('#000000');
      expect(vars['--terminal-fg']).toBe('#00ff00');
    });

    it('should include all expected CSS variables', () => {
      const vars = getThemeCssVariables('dark');
      const expectedVars = [
        '--terminal-bg',
        '--terminal-fg',
        '--terminal-cursor',
        '--terminal-selection',
        '--terminal-red',
        '--terminal-green',
        '--terminal-yellow',
        '--terminal-blue',
        '--terminal-magenta',
        '--terminal-cyan',
      ];

      expectedVars.forEach(varName => {
        expect(vars[varName]).toBeDefined();
      });
    });

    it('should return CSS variables for all themes', () => {
      getAllThemes().forEach(config => {
        const vars = getThemeCssVariables(config.id);
        expect(vars).toBeDefined();
        expect(Object.keys(vars).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Theme color validity', () => {
    it('all colors should be valid hex colors', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

      Object.values(TERMINAL_THEMES).forEach(config => {
        const theme = config.theme;
        Object.entries(theme).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('#')) {
            expect(
              hexColorRegex.test(value),
              `Invalid color ${value} for ${key} in theme ${config.id}`
            ).toBe(true);
          }
        });
      });
    });
  });

  describe('Theme consistency', () => {
    it('dark themes should have dark backgrounds', () => {
      getDarkThemes().forEach(config => {
        const bg = config.theme.background || '#000000';
        // Dark backgrounds typically have low RGB values
        const r = parseInt(bg.slice(1, 3), 16);
        const g = parseInt(bg.slice(3, 5), 16);
        const b = parseInt(bg.slice(5, 7), 16);
        const brightness = (r + g + b) / 3;
        expect(
          brightness,
          `Theme ${config.id} marked as dark but has bright background`
        ).toBeLessThan(128);
      });
    });

    it('light themes should have light backgrounds', () => {
      getLightThemes().forEach(config => {
        const bg = config.theme.background || '#ffffff';
        const r = parseInt(bg.slice(1, 3), 16);
        const g = parseInt(bg.slice(3, 5), 16);
        const b = parseInt(bg.slice(5, 7), 16);
        const brightness = (r + g + b) / 3;
        expect(
          brightness,
          `Theme ${config.id} marked as light but has dark background`
        ).toBeGreaterThan(128);
      });
    });
  });
});
