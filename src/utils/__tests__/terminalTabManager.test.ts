import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTab,
  createTabManagerState,
  addTab,
  removeTab,
  setActiveTab,
  renameTab,
  updateTabState,
  addToTabHistory,
  moveTab,
  getActiveTab,
  getTabById,
  canAddTab,
  canRemoveTab,
  saveTabState,
  loadTabState,
  clearTabState,
  duplicateTab,
  getTabCount,
  nextTab,
  previousTab,
  goToTab,
  DEFAULT_MAX_TABS,
  type TerminalTabState,
} from '../terminalTabManager';

describe('terminalTabManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createTab', () => {
    it('should create a tab with default name', () => {
      const tab = createTab();
      expect(tab.name).toBe('Terminal 1');
      expect(tab.id).toBeDefined();
      expect(tab.shellMode).toBe('bash');
    });

    it('should create a tab with custom name', () => {
      const tab = createTab('My Terminal');
      expect(tab.name).toBe('My Terminal');
    });

    it('should increment tab number based on existing tabs', () => {
      const existingTabs = [createTab('Tab 1'), createTab('Tab 2')];
      const newTab = createTab(undefined, existingTabs);
      expect(newTab.name).toBe('Terminal 3');
    });

    it('should initialize with correct default values', () => {
      const tab = createTab();
      expect(tab.workingDirectory).toBe('~');
      expect(tab.commandHistory).toEqual([]);
      expect(tab.scrollPosition).toBe(0);
      expect(tab.createdAt).toBeGreaterThan(0);
      expect(tab.lastActiveAt).toBeGreaterThan(0);
    });
  });

  describe('createTabManagerState', () => {
    it('should create initial state with one tab', () => {
      const state = createTabManagerState();
      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe(state.tabs[0].id);
      expect(state.maxTabs).toBe(DEFAULT_MAX_TABS);
    });

    it('should name first tab "Terminal 1"', () => {
      const state = createTabManagerState();
      expect(state.tabs[0].name).toBe('Terminal 1');
    });
  });

  describe('addTab', () => {
    it('should add a new tab', () => {
      const state = createTabManagerState();
      const newState = addTab(state);

      expect(newState.tabs).toHaveLength(2);
      expect(newState.activeTabId).toBe(newState.tabs[1].id);
    });

    it('should add a tab with custom name', () => {
      const state = createTabManagerState();
      const newState = addTab(state, 'Custom Tab');

      expect(newState.tabs[1].name).toBe('Custom Tab');
    });

    it('should not exceed max tabs', () => {
      let state = createTabManagerState();
      for (let i = 0; i < DEFAULT_MAX_TABS + 5; i++) {
        state = addTab(state);
      }

      expect(state.tabs.length).toBe(DEFAULT_MAX_TABS);
    });

    it('should set new tab as active', () => {
      const state = createTabManagerState();
      const newState = addTab(state);

      expect(newState.activeTabId).not.toBe(state.activeTabId);
      expect(newState.activeTabId).toBe(newState.tabs[1].id);
    });
  });

  describe('removeTab', () => {
    it('should remove a tab', () => {
      let state = createTabManagerState();
      state = addTab(state);
      const tabToRemove = state.tabs[0].id;

      const newState = removeTab(state, tabToRemove);
      expect(newState.tabs).toHaveLength(1);
      expect(newState.tabs[0].id).not.toBe(tabToRemove);
    });

    it('should not remove the last tab', () => {
      const state = createTabManagerState();
      const newState = removeTab(state, state.tabs[0].id);

      expect(newState.tabs).toHaveLength(1);
    });

    it('should select adjacent tab when removing active tab', () => {
      let state = createTabManagerState();
      state = addTab(state);
      state = addTab(state);
      // Active tab is now the third one

      const newState = removeTab(state, state.activeTabId);
      expect(newState.activeTabId).toBe(newState.tabs[1].id);
    });

    it('should keep same active tab when removing non-active tab', () => {
      let state = createTabManagerState();
      state = addTab(state);
      const originalActive = state.activeTabId;
      const tabToRemove = state.tabs[0].id;

      const newState = removeTab(state, tabToRemove);
      expect(newState.activeTabId).toBe(originalActive);
    });

    it('should handle removing non-existent tab', () => {
      const state = createTabManagerState();
      const newState = removeTab(state, 'non-existent');

      expect(newState).toEqual(state);
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      let state = createTabManagerState();
      state = addTab(state);
      const firstTabId = state.tabs[0].id;

      const newState = setActiveTab(state, firstTabId);
      expect(newState.activeTabId).toBe(firstTabId);
    });

    it('should update lastActiveAt', () => {
      let state = createTabManagerState();
      state = addTab(state);
      const firstTabId = state.tabs[0].id;
      const originalTime = state.tabs[0].lastActiveAt;

      // Wait a bit to ensure time difference
      const newState = setActiveTab(state, firstTabId);
      expect(newState.tabs[0].lastActiveAt).toBeGreaterThanOrEqual(originalTime);
    });

    it('should handle non-existent tab', () => {
      const state = createTabManagerState();
      const newState = setActiveTab(state, 'non-existent');

      expect(newState).toEqual(state);
    });
  });

  describe('renameTab', () => {
    it('should rename a tab', () => {
      const state = createTabManagerState();
      const newState = renameTab(state, state.tabs[0].id, 'New Name');

      expect(newState.tabs[0].name).toBe('New Name');
    });

    it('should not affect other tabs', () => {
      let state = createTabManagerState();
      state = addTab(state, 'Second Tab');

      const newState = renameTab(state, state.tabs[0].id, 'Renamed');
      expect(newState.tabs[1].name).toBe('Second Tab');
    });
  });

  describe('updateTabState', () => {
    it('should update tab properties', () => {
      const state = createTabManagerState();
      const newState = updateTabState(state, state.tabs[0].id, {
        workingDirectory: '/home/user',
        shellMode: 'nvsm',
      });

      expect(newState.tabs[0].workingDirectory).toBe('/home/user');
      expect(newState.tabs[0].shellMode).toBe('nvsm');
    });

    it('should update lastActiveAt', () => {
      const state = createTabManagerState();
      const newState = updateTabState(state, state.tabs[0].id, {
        workingDirectory: '/tmp',
      });

      expect(newState.tabs[0].lastActiveAt).toBeGreaterThanOrEqual(state.tabs[0].lastActiveAt);
    });
  });

  describe('addToTabHistory', () => {
    it('should add command to history', () => {
      const state = createTabManagerState();
      const newState = addToTabHistory(state, state.tabs[0].id, 'nvidia-smi');

      expect(newState.tabs[0].commandHistory).toContain('nvidia-smi');
    });

    it('should append to existing history', () => {
      let state = createTabManagerState();
      state = addToTabHistory(state, state.tabs[0].id, 'ls');
      state = addToTabHistory(state, state.tabs[0].id, 'pwd');

      expect(state.tabs[0].commandHistory).toEqual(['ls', 'pwd']);
    });

    it('should limit history size', () => {
      let state = createTabManagerState();
      for (let i = 0; i < 1100; i++) {
        state = addToTabHistory(state, state.tabs[0].id, `command-${i}`);
      }

      expect(state.tabs[0].commandHistory.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('moveTab', () => {
    it('should move tab to new position', () => {
      let state = createTabManagerState();
      state = addTab(state, 'Tab 2');
      state = addTab(state, 'Tab 3');
      const firstTabId = state.tabs[0].id;

      const newState = moveTab(state, firstTabId, 2);
      expect(newState.tabs[2].id).toBe(firstTabId);
    });

    it('should handle invalid index', () => {
      const state = createTabManagerState();
      const newState = moveTab(state, state.tabs[0].id, 10);

      expect(newState).toEqual(state);
    });

    it('should handle non-existent tab', () => {
      const state = createTabManagerState();
      const newState = moveTab(state, 'non-existent', 0);

      expect(newState).toEqual(state);
    });
  });

  describe('getActiveTab', () => {
    it('should return active tab', () => {
      const state = createTabManagerState();
      const activeTab = getActiveTab(state);

      expect(activeTab).toBeDefined();
      expect(activeTab?.id).toBe(state.activeTabId);
    });
  });

  describe('getTabById', () => {
    it('should return tab by id', () => {
      let state = createTabManagerState();
      state = addTab(state, 'Second');
      const tab = getTabById(state, state.tabs[1].id);

      expect(tab).toBeDefined();
      expect(tab?.name).toBe('Second');
    });

    it('should return undefined for non-existent id', () => {
      const state = createTabManagerState();
      const tab = getTabById(state, 'non-existent');

      expect(tab).toBeUndefined();
    });
  });

  describe('canAddTab', () => {
    it('should return true when under max', () => {
      const state = createTabManagerState();
      expect(canAddTab(state)).toBe(true);
    });

    it('should return false when at max', () => {
      let state = createTabManagerState();
      for (let i = 0; i < DEFAULT_MAX_TABS - 1; i++) {
        state = addTab(state);
      }

      expect(canAddTab(state)).toBe(false);
    });
  });

  describe('canRemoveTab', () => {
    it('should return false with one tab', () => {
      const state = createTabManagerState();
      expect(canRemoveTab(state)).toBe(false);
    });

    it('should return true with multiple tabs', () => {
      let state = createTabManagerState();
      state = addTab(state);

      expect(canRemoveTab(state)).toBe(true);
    });
  });

  describe('Tab persistence', () => {
    it('should save and load tab state', () => {
      let state = createTabManagerState();
      state = addTab(state, 'Saved Tab');
      state = addToTabHistory(state, state.tabs[0].id, 'test-command');

      saveTabState(state);
      const loaded = loadTabState();

      expect(loaded).not.toBeNull();
      expect(loaded?.tabs).toHaveLength(2);
      expect(loaded?.tabs[1].name).toBe('Saved Tab');
    });

    it('should return null when no saved state', () => {
      const loaded = loadTabState();
      expect(loaded).toBeNull();
    });

    it('should handle invalid saved state', () => {
      localStorage.setItem('terminal-tabs', 'invalid json');
      const loaded = loadTabState();
      expect(loaded).toBeNull();
    });

    it('should clear saved state', () => {
      const state = createTabManagerState();
      saveTabState(state);
      clearTabState();

      const loaded = loadTabState();
      expect(loaded).toBeNull();
    });

    it('should limit history when saving', () => {
      let state = createTabManagerState();
      for (let i = 0; i < 100; i++) {
        state = addToTabHistory(state, state.tabs[0].id, `cmd-${i}`);
      }

      saveTabState(state);
      const loaded = loadTabState();

      expect(loaded?.tabs[0].commandHistory.length).toBeLessThanOrEqual(50);
    });

    it('should fix invalid activeTabId on load', () => {
      const state = createTabManagerState();
      const invalidState = {
        ...state,
        activeTabId: 'invalid-id',
      };
      localStorage.setItem('terminal-tabs', JSON.stringify(invalidState));

      const loaded = loadTabState();
      expect(loaded?.activeTabId).toBe(loaded?.tabs[0].id);
    });
  });

  describe('duplicateTab', () => {
    it('should duplicate a tab', () => {
      let state = createTabManagerState();
      state = updateTabState(state, state.tabs[0].id, {
        workingDirectory: '/home/user',
        shellMode: 'nvsm',
      });

      const newState = duplicateTab(state, state.tabs[0].id);

      expect(newState.tabs).toHaveLength(2);
      expect(newState.tabs[1].workingDirectory).toBe('/home/user');
      expect(newState.tabs[1].shellMode).toBe('nvsm');
      expect(newState.tabs[1].name).toContain('(copy)');
    });

    it('should not duplicate when at max tabs', () => {
      let state = createTabManagerState();
      for (let i = 0; i < DEFAULT_MAX_TABS - 1; i++) {
        state = addTab(state);
      }

      const newState = duplicateTab(state, state.tabs[0].id);
      expect(newState.tabs.length).toBe(DEFAULT_MAX_TABS);
    });

    it('should set duplicated tab as active', () => {
      const state = createTabManagerState();
      const newState = duplicateTab(state, state.tabs[0].id);

      expect(newState.activeTabId).toBe(newState.tabs[1].id);
    });
  });

  describe('getTabCount', () => {
    it('should return correct count', () => {
      let state = createTabManagerState();
      expect(getTabCount(state)).toBe(1);

      state = addTab(state);
      state = addTab(state);
      expect(getTabCount(state)).toBe(3);
    });
  });

  describe('Tab navigation', () => {
    let state: TerminalTabState;

    beforeEach(() => {
      state = createTabManagerState();
      state = addTab(state, 'Tab 2');
      state = addTab(state, 'Tab 3');
      // Start with first tab active
      state = setActiveTab(state, state.tabs[0].id);
    });

    describe('nextTab', () => {
      it('should move to next tab', () => {
        const newState = nextTab(state);
        expect(newState.activeTabId).toBe(state.tabs[1].id);
      });

      it('should wrap around to first tab', () => {
        let newState = setActiveTab(state, state.tabs[2].id);
        newState = nextTab(newState);
        expect(newState.activeTabId).toBe(state.tabs[0].id);
      });
    });

    describe('previousTab', () => {
      it('should move to previous tab', () => {
        let newState = setActiveTab(state, state.tabs[1].id);
        newState = previousTab(newState);
        expect(newState.activeTabId).toBe(state.tabs[0].id);
      });

      it('should wrap around to last tab', () => {
        const newState = previousTab(state);
        expect(newState.activeTabId).toBe(state.tabs[2].id);
      });
    });

    describe('goToTab', () => {
      it('should go to tab by number', () => {
        const newState = goToTab(state, 2);
        expect(newState.activeTabId).toBe(state.tabs[1].id);
      });

      it('should handle out of range tab number', () => {
        const newState = goToTab(state, 10);
        expect(newState.activeTabId).toBe(state.activeTabId);
      });

      it('should handle zero tab number', () => {
        const newState = goToTab(state, 0);
        expect(newState.activeTabId).toBe(state.activeTabId);
      });
    });
  });
});
