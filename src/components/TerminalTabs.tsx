/**
 * Terminal Tabs Component
 * Provides a tab bar for managing multiple terminal instances
 */

import React, { useState, useCallback } from 'react';
import {
  type TerminalTab,
  type TerminalTabState,
  canAddTab,
  canRemoveTab,
} from '../utils/terminalTabManager';

interface TerminalTabsProps {
  state: TerminalTabState;
  onAddTab: () => void;
  onRemoveTab: (tabId: string) => void;
  onSelectTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newName: string) => void;
  onDuplicateTab: (tabId: string) => void;
  onMoveTab?: (tabId: string, newIndex: number) => void;
  showAddButton?: boolean;
  showCloseButtons?: boolean;
  compact?: boolean;
}

export function TerminalTabs({
  state,
  onAddTab,
  onRemoveTab,
  onSelectTab,
  onRenameTab,
  onDuplicateTab,
  onMoveTab,
  showAddButton = true,
  showCloseButtons = true,
  compact = false,
}: TerminalTabsProps): React.ReactElement {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenuTab, setContextMenuTab] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleDoubleClick = useCallback((tab: TerminalTab) => {
    setEditingTabId(tab.id);
    setEditName(tab.name);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingTabId && editName.trim()) {
      onRenameTab(editingTabId, editName.trim());
    }
    setEditingTabId(null);
    setEditName('');
  }, [editingTabId, editName, onRenameTab]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRenameSubmit();
      } else if (e.key === 'Escape') {
        setEditingTabId(null);
        setEditName('');
      }
    },
    [handleRenameSubmit]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.preventDefault();
      setContextMenuTab(tabId);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenuTab(null);
  }, []);

  const handleTabClick = useCallback(
    (tabId: string) => {
      onSelectTab(tabId);
      closeContextMenu();
    },
    [onSelectTab, closeContextMenu]
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      onRemoveTab(tabId);
    },
    [onRemoveTab]
  );

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenuTab) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuTab, closeContextMenu]);

  const getShellModeIcon = (mode: TerminalTab['shellMode']) => {
    switch (mode) {
      case 'nvsm':
        return '>';
      case 'cmsh':
        return '%';
      default:
        return '$';
    }
  };

  return (
    <div className="terminal-tabs-container">
      {/* Tab Bar */}
      <div
        className={`terminal-tabs flex items-center bg-gray-900 border-b border-gray-700 ${
          compact ? 'h-8' : 'h-10'
        }`}
      >
        <div className="flex-1 flex items-center overflow-x-auto">
          {state.tabs.map((tab, index) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onDoubleClick={() => handleDoubleClick(tab)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={`
                terminal-tab flex items-center gap-1 px-3 cursor-pointer
                border-r border-gray-700 select-none
                ${compact ? 'h-8 text-xs' : 'h-10 text-sm'}
                ${
                  state.activeTabId === tab.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }
              `}
              role="tab"
              aria-selected={state.activeTabId === tab.id}
              title={`${tab.name} (${tab.shellMode})`}
            >
              {/* Shell mode indicator */}
              <span className="text-green-500 font-mono text-xs">
                {getShellModeIcon(tab.shellMode)}
              </span>

              {/* Tab name (editable) */}
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  className="bg-gray-700 text-white px-1 py-0.5 rounded text-xs w-24 outline-none focus:ring-1 focus:ring-green-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate max-w-24">{tab.name}</span>
              )}

              {/* Tab number for keyboard shortcut */}
              {index < 9 && (
                <span className="text-gray-600 text-xs ml-1">
                  {index + 1}
                </span>
              )}

              {/* Close button */}
              {showCloseButtons && canRemoveTab(state) && (
                <button
                  onClick={(e) => handleCloseClick(e, tab.id)}
                  className="ml-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded p-0.5"
                  title="Close tab"
                  aria-label={`Close ${tab.name}`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add tab button */}
        {showAddButton && canAddTab(state) && (
          <button
            onClick={onAddTab}
            className={`
              flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700
              border-l border-gray-700
              ${compact ? 'w-8 h-8' : 'w-10 h-10'}
            `}
            title={`New tab (${state.tabs.length}/${state.maxTabs})`}
            aria-label="Add new terminal tab"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}

        {/* Tab count indicator */}
        <div className="px-2 text-gray-500 text-xs">
          {state.tabs.length}/{state.maxTabs}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuTab && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => {
              const tab = state.tabs.find(t => t.id === contextMenuTab);
              if (tab) handleDoubleClick(tab);
              closeContextMenu();
            }}
            className="w-full px-4 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
          >
            Rename
          </button>
          <button
            onClick={() => {
              onDuplicateTab(contextMenuTab);
              closeContextMenu();
            }}
            className="w-full px-4 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
            disabled={!canAddTab(state)}
          >
            Duplicate
          </button>
          {onMoveTab && state.tabs.length > 1 && (
            <>
              <hr className="border-gray-600 my-1" />
              <button
                onClick={() => {
                  const index = state.tabs.findIndex(t => t.id === contextMenuTab);
                  if (index > 0) onMoveTab(contextMenuTab, index - 1);
                  closeContextMenu();
                }}
                className="w-full px-4 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
                disabled={state.tabs.findIndex(t => t.id === contextMenuTab) === 0}
              >
                Move Left
              </button>
              <button
                onClick={() => {
                  const index = state.tabs.findIndex(t => t.id === contextMenuTab);
                  if (index < state.tabs.length - 1) onMoveTab(contextMenuTab, index + 1);
                  closeContextMenu();
                }}
                className="w-full px-4 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
                disabled={
                  state.tabs.findIndex(t => t.id === contextMenuTab) ===
                  state.tabs.length - 1
                }
              >
                Move Right
              </button>
            </>
          )}
          {canRemoveTab(state) && (
            <>
              <hr className="border-gray-600 my-1" />
              <button
                onClick={() => {
                  onRemoveTab(contextMenuTab);
                  closeContextMenu();
                }}
                className="w-full px-4 py-1 text-left text-sm text-red-400 hover:bg-gray-700"
              >
                Close
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TerminalTabs;
