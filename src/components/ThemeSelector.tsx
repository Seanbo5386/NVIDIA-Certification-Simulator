/**
 * Theme Selector Component
 * Allows users to switch between terminal color themes
 */

import React, { useState, useEffect } from 'react';
import {
  TERMINAL_THEMES,
  getAllThemes,
  getDarkThemes,
  getLightThemes,
  getTheme,
  saveThemePreference,
  loadThemePreference,
  type ThemeId,
  type TerminalThemeConfig,
} from '../utils/terminalThemes';

interface ThemeSelectorProps {
  onThemeChange: (themeId: ThemeId) => void;
  currentTheme?: ThemeId;
  showPreview?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export function ThemeSelector({
  onThemeChange,
  currentTheme: initialTheme,
  showPreview = true,
  compact = false,
  onClose,
}: ThemeSelectorProps): React.ReactElement {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    initialTheme || loadThemePreference()
  );
  const [filter, setFilter] = useState<'all' | 'dark' | 'light'>('all');

  useEffect(() => {
    if (initialTheme) {
      setSelectedTheme(initialTheme);
    }
  }, [initialTheme]);

  const handleThemeSelect = (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    saveThemePreference(themeId);
    onThemeChange(themeId);
  };

  const getFilteredThemes = (): TerminalThemeConfig[] => {
    switch (filter) {
      case 'dark':
        return getDarkThemes();
      case 'light':
        return getLightThemes();
      default:
        return getAllThemes();
    }
  };

  const themes = getFilteredThemes();
  const currentConfig = getTheme(selectedTheme);

  if (compact) {
    return (
      <div className="theme-selector-compact">
        <label htmlFor="theme-select" className="text-sm text-gray-400 mr-2">
          Theme:
        </label>
        <select
          id="theme-select"
          value={selectedTheme}
          onChange={(e) => handleThemeSelect(e.target.value as ThemeId)}
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <optgroup label="Dark Themes">
            {getDarkThemes().map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Light Themes">
            {getLightThemes().map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  }

  return (
    <div className="theme-selector bg-gray-900 rounded-lg p-4 max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Terminal Theme</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All ({Object.keys(TERMINAL_THEMES).length})
        </button>
        <button
          onClick={() => setFilter('dark')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'dark'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Dark ({getDarkThemes().length})
        </button>
        <button
          onClick={() => setFilter('light')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'light'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Light ({getLightThemes().length})
        </button>
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 max-h-80 overflow-y-auto">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className={`text-left p-3 rounded border-2 transition-all ${
              selectedTheme === theme.id
                ? 'border-green-500 bg-gray-800'
                : 'border-gray-700 bg-gray-800 hover:border-gray-500'
            }`}
          >
            {/* Theme preview swatch */}
            <div
              className="h-8 rounded mb-2 flex items-center px-2 font-mono text-sm"
              style={{
                backgroundColor: theme.theme.background,
                color: theme.theme.foreground,
              }}
            >
              <span style={{ color: theme.theme.green }}>$</span>
              <span className="ml-1">nvidia-smi</span>
            </div>

            {/* Theme info */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium text-sm">{theme.name}</div>
                <div className="text-gray-400 text-xs">{theme.description}</div>
              </div>
              {selectedTheme === theme.id && (
                <span className="text-green-500 text-lg">&#10003;</span>
              )}
            </div>

            {/* Color palette preview */}
            <div className="flex gap-1 mt-2">
              {['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'].map((color) => (
                <div
                  key={color}
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: theme.theme[color as keyof typeof theme.theme] as string,
                  }}
                  title={color}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Live preview */}
      {showPreview && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Preview</h3>
          <div
            className="rounded p-4 font-mono text-sm overflow-x-auto"
            style={{
              backgroundColor: currentConfig.theme.background,
              color: currentConfig.theme.foreground,
            }}
          >
            <div>
              <span style={{ color: currentConfig.theme.brightGreen }}>root@dgx-01</span>
              <span style={{ color: currentConfig.theme.white }}>:</span>
              <span style={{ color: currentConfig.theme.brightBlue }}>~</span>
              <span style={{ color: currentConfig.theme.white }}># </span>
              <span style={{ color: currentConfig.theme.cyan }}>nvidia-smi</span>
              <span style={{ color: currentConfig.theme.yellow }}> --query-gpu</span>
              <span>=memory.used</span>
            </div>
            <div className="mt-2" style={{ color: currentConfig.theme.white }}>
              +-----------------------------------------------------------------------------+
            </div>
            <div style={{ color: currentConfig.theme.white }}>
              | GPU Name{' '}
              <span style={{ color: currentConfig.theme.green }}>NVIDIA A100-SXM4-80GB</span>
            </div>
            <div style={{ color: currentConfig.theme.white }}>
              | Temp: <span style={{ color: currentConfig.theme.yellow }}>45C</span> | Power:{' '}
              <span style={{ color: currentConfig.theme.brightYellow }}>250W</span>/300W | Memory:{' '}
              <span style={{ color: currentConfig.theme.brightBlue }}>1024MiB</span>/81920MiB
            </div>
            <div style={{ color: currentConfig.theme.white }}>
              | Status: <span style={{ color: currentConfig.theme.green }}>Healthy</span> |
              Utilization: <span style={{ color: currentConfig.theme.green }}>85%</span>
            </div>
            <div className="mt-2">
              <span style={{ color: currentConfig.theme.red }}>Error</span>: XID 79 - GPU
              exception detected
            </div>
            <div>
              <span style={{ color: currentConfig.theme.yellow }}>Warning</span>: Temperature
              threshold approaching
            </div>
          </div>
        </div>
      )}

      {/* Current selection info */}
      <div className="mt-4 text-sm text-gray-400">
        Current theme:{' '}
        <span className="text-white font-medium">{currentConfig.name}</span>
        {currentConfig.isDark ? (
          <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">Dark</span>
        ) : (
          <span className="ml-2 text-xs bg-yellow-700 px-2 py-0.5 rounded">Light</span>
        )}
      </div>
    </div>
  );
}

export default ThemeSelector;
