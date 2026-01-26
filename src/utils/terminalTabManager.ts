/**
 * Terminal Tab Manager
 * Manages multiple terminal instances with state persistence
 */

import { type ThemeId } from './terminalThemes';

/**
 * Represents a single terminal tab
 */
export interface TerminalTab {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  workingDirectory: string;
  commandHistory: string[];
  scrollPosition: number;
  shellMode: 'bash' | 'nvsm' | 'cmsh';
  theme?: ThemeId;
}

/**
 * Terminal tab manager state
 */
export interface TerminalTabState {
  tabs: TerminalTab[];
  activeTabId: string;
  maxTabs: number;
}

/**
 * Default maximum number of tabs
 */
export const DEFAULT_MAX_TABS = 8;

/**
 * Generate a unique tab ID
 */
export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new terminal tab
 */
export function createTab(name?: string, existingTabs: TerminalTab[] = []): TerminalTab {
  const tabNumber = existingTabs.length + 1;
  const now = Date.now();

  return {
    id: generateTabId(),
    name: name || `Terminal ${tabNumber}`,
    createdAt: now,
    lastActiveAt: now,
    workingDirectory: '~',
    commandHistory: [],
    scrollPosition: 0,
    shellMode: 'bash',
  };
}

/**
 * Create initial tab manager state
 */
export function createTabManagerState(): TerminalTabState {
  const initialTab = createTab('Terminal 1');
  return {
    tabs: [initialTab],
    activeTabId: initialTab.id,
    maxTabs: DEFAULT_MAX_TABS,
  };
}

/**
 * Add a new tab to the state
 */
export function addTab(
  state: TerminalTabState,
  name?: string
): TerminalTabState {
  if (state.tabs.length >= state.maxTabs) {
    return state; // Can't add more tabs
  }

  const newTab = createTab(name, state.tabs);
  return {
    ...state,
    tabs: [...state.tabs, newTab],
    activeTabId: newTab.id,
  };
}

/**
 * Remove a tab from the state
 */
export function removeTab(
  state: TerminalTabState,
  tabId: string
): TerminalTabState {
  if (state.tabs.length <= 1) {
    return state; // Can't remove the last tab
  }

  const tabIndex = state.tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) {
    return state;
  }

  const newTabs = state.tabs.filter(t => t.id !== tabId);

  // If we removed the active tab, select the previous or next tab
  let newActiveTabId = state.activeTabId;
  if (state.activeTabId === tabId) {
    const newIndex = Math.min(tabIndex, newTabs.length - 1);
    newActiveTabId = newTabs[newIndex].id;
  }

  return {
    ...state,
    tabs: newTabs,
    activeTabId: newActiveTabId,
  };
}

/**
 * Set the active tab
 */
export function setActiveTab(
  state: TerminalTabState,
  tabId: string
): TerminalTabState {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) {
    return state;
  }

  // Update last active time
  const updatedTabs = state.tabs.map(t =>
    t.id === tabId ? { ...t, lastActiveAt: Date.now() } : t
  );

  return {
    ...state,
    tabs: updatedTabs,
    activeTabId: tabId,
  };
}

/**
 * Rename a tab
 */
export function renameTab(
  state: TerminalTabState,
  tabId: string,
  newName: string
): TerminalTabState {
  const updatedTabs = state.tabs.map(t =>
    t.id === tabId ? { ...t, name: newName } : t
  );

  return {
    ...state,
    tabs: updatedTabs,
  };
}

/**
 * Update tab state (working directory, history, etc.)
 */
export function updateTabState(
  state: TerminalTabState,
  tabId: string,
  updates: Partial<TerminalTab>
): TerminalTabState {
  const updatedTabs = state.tabs.map(t =>
    t.id === tabId ? { ...t, ...updates, lastActiveAt: Date.now() } : t
  );

  return {
    ...state,
    tabs: updatedTabs,
  };
}

/**
 * Add a command to tab history
 */
export function addToTabHistory(
  state: TerminalTabState,
  tabId: string,
  command: string
): TerminalTabState {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) {
    return state;
  }

  const updatedHistory = [...tab.commandHistory, command];
  // Limit history size
  const MAX_HISTORY = 1000;
  if (updatedHistory.length > MAX_HISTORY) {
    updatedHistory.splice(0, updatedHistory.length - MAX_HISTORY);
  }

  return updateTabState(state, tabId, { commandHistory: updatedHistory });
}

/**
 * Move tab to a new position
 */
export function moveTab(
  state: TerminalTabState,
  tabId: string,
  newIndex: number
): TerminalTabState {
  const currentIndex = state.tabs.findIndex(t => t.id === tabId);
  if (currentIndex === -1 || newIndex < 0 || newIndex >= state.tabs.length) {
    return state;
  }

  const newTabs = [...state.tabs];
  const [movedTab] = newTabs.splice(currentIndex, 1);
  newTabs.splice(newIndex, 0, movedTab);

  return {
    ...state,
    tabs: newTabs,
  };
}

/**
 * Get the active tab
 */
export function getActiveTab(state: TerminalTabState): TerminalTab | undefined {
  return state.tabs.find(t => t.id === state.activeTabId);
}

/**
 * Get tab by ID
 */
export function getTabById(
  state: TerminalTabState,
  tabId: string
): TerminalTab | undefined {
  return state.tabs.find(t => t.id === tabId);
}

/**
 * Check if more tabs can be added
 */
export function canAddTab(state: TerminalTabState): boolean {
  return state.tabs.length < state.maxTabs;
}

/**
 * Check if a tab can be removed (must have at least one tab)
 */
export function canRemoveTab(state: TerminalTabState): boolean {
  return state.tabs.length > 1;
}

/**
 * Storage key for tab state persistence
 */
const TAB_STATE_STORAGE_KEY = 'terminal-tabs';

/**
 * Save tab state to localStorage
 */
export function saveTabState(state: TerminalTabState): void {
  try {
    // Don't save command history to reduce storage size
    const stateToSave = {
      ...state,
      tabs: state.tabs.map(tab => ({
        ...tab,
        commandHistory: tab.commandHistory.slice(-50), // Only save last 50 commands
      })),
    };
    localStorage.setItem(TAB_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch {
    // localStorage may be unavailable or full
  }
}

/**
 * Load tab state from localStorage
 */
export function loadTabState(): TerminalTabState | null {
  try {
    const saved = localStorage.getItem(TAB_STATE_STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const state = JSON.parse(saved) as TerminalTabState;

    // Validate the loaded state
    if (!state.tabs || !Array.isArray(state.tabs) || state.tabs.length === 0) {
      return null;
    }

    // Ensure activeTabId is valid
    if (!state.tabs.some(t => t.id === state.activeTabId)) {
      state.activeTabId = state.tabs[0].id;
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Clear saved tab state
 */
export function clearTabState(): void {
  try {
    localStorage.removeItem(TAB_STATE_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Duplicate an existing tab
 */
export function duplicateTab(
  state: TerminalTabState,
  tabId: string
): TerminalTabState {
  if (state.tabs.length >= state.maxTabs) {
    return state;
  }

  const sourceTab = state.tabs.find(t => t.id === tabId);
  if (!sourceTab) {
    return state;
  }

  const now = Date.now();
  const newTab: TerminalTab = {
    ...sourceTab,
    id: generateTabId(),
    name: `${sourceTab.name} (copy)`,
    createdAt: now,
    lastActiveAt: now,
  };

  return {
    ...state,
    tabs: [...state.tabs, newTab],
    activeTabId: newTab.id,
  };
}

/**
 * Get tab count
 */
export function getTabCount(state: TerminalTabState): number {
  return state.tabs.length;
}

/**
 * Navigate to next tab (circular)
 */
export function nextTab(state: TerminalTabState): TerminalTabState {
  const currentIndex = state.tabs.findIndex(t => t.id === state.activeTabId);
  const nextIndex = (currentIndex + 1) % state.tabs.length;
  return setActiveTab(state, state.tabs[nextIndex].id);
}

/**
 * Navigate to previous tab (circular)
 */
export function previousTab(state: TerminalTabState): TerminalTabState {
  const currentIndex = state.tabs.findIndex(t => t.id === state.activeTabId);
  const prevIndex = (currentIndex - 1 + state.tabs.length) % state.tabs.length;
  return setActiveTab(state, state.tabs[prevIndex].id);
}

/**
 * Navigate to tab by index (1-based for keyboard shortcuts)
 */
export function goToTab(
  state: TerminalTabState,
  tabNumber: number
): TerminalTabState {
  const index = tabNumber - 1;
  if (index < 0 || index >= state.tabs.length) {
    return state;
  }
  return setActiveTab(state, state.tabs[index].id);
}
