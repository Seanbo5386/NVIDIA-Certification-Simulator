import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Camera,
  Trash2,
  GitBranch,
  Clock,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';
import { stateManager, type StateSnapshot } from '@/store/stateManager';
import { scenarioContextManager } from '@/store/scenarioContext';

export const StateManagementPanel: React.FC = () => {
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  const { activeScenario } = useSimulationStore();

  // Load snapshots on mount and when they change
  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadSnapshots = () => {
    const allSnapshots = stateManager.getSnapshots();
    setSnapshots(allSnapshots);
  };

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) return;

    const snapshotId = stateManager.createSnapshot(snapshotName, snapshotDescription);
    console.log(`Created snapshot: ${snapshotId}`);

    // Reset form
    setSnapshotName('');
    setSnapshotDescription('');
    setShowCreateDialog(false);

    // Reload snapshots
    loadSnapshots();
  };

  const handleRestoreSnapshot = (snapshotId: string) => {
    const success = stateManager.restoreSnapshot(snapshotId);
    if (success) {
      console.log(`Restored snapshot: ${snapshotId}`);
      // Force re-render by updating store
      useSimulationStore.getState().setCluster(useSimulationStore.getState().cluster);
    }
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    if (window.confirm('Are you sure you want to delete this snapshot?')) {
      stateManager.deleteSnapshot(snapshotId);
      loadSnapshots();
    }
  };

  const handleCreateBaseline = () => {
    stateManager.createBaselineSnapshot();
    alert('Baseline snapshot created successfully');
  };

  const handleRestoreBaseline = () => {
    const success = stateManager.restoreBaseline();
    if (success) {
      console.log('Restored to baseline state');
      useSimulationStore.getState().setCluster(useSimulationStore.getState().cluster);
    } else {
      alert('No baseline snapshot available. Create one first.');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getScenarioContext = () => {
    return scenarioContextManager.getActiveContext();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-nvidia-green flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          State Management
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-3 py-1 bg-nvidia-green text-black rounded-lg hover:bg-nvidia-darkgreen transition-colors flex items-center gap-1"
            title="Create Snapshot"
          >
            <Camera className="w-4 h-4" />
            Snapshot
          </button>
          <button
            onClick={handleCreateBaseline}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            title="Set as Baseline"
          >
            <Save className="w-4 h-4" />
            Baseline
          </button>
          <button
            onClick={handleRestoreBaseline}
            className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1"
            title="Restore to Baseline"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Active Scenario Info */}
      {activeScenario && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">
              Active Scenario: <span className="text-nvidia-green font-medium">{activeScenario.title}</span>
            </span>
          </div>
          {getScenarioContext() && (
            <div className="mt-2 text-xs text-gray-400">
              Mutations: {getScenarioContext()?.getMutationCount() || 0} |
              Runtime: {Math.round((getScenarioContext()?.getRuntimeMs() || 0) / 1000)}s
            </div>
          )}
        </div>
      )}

      {/* Create Snapshot Dialog */}
      {showCreateDialog && (
        <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-nvidia-green">
          <h4 className="text-sm font-bold text-nvidia-green mb-3">Create Snapshot</h4>
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="Snapshot name..."
            className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-nvidia-green focus:outline-none mb-2"
            autoFocus
          />
          <textarea
            value={snapshotDescription}
            onChange={(e) => setSnapshotDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-nvidia-green focus:outline-none mb-3 h-20 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCreateDialog(false);
                setSnapshotName('');
                setSnapshotDescription('');
              }}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSnapshot}
              disabled={!snapshotName.trim()}
              className="px-3 py-1 bg-nvidia-green text-black rounded hover:bg-nvidia-darkgreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Snapshots List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {snapshots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No snapshots yet</p>
            <p className="text-xs mt-1">Create a snapshot to save the current state</p>
          </div>
        ) : (
          snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className={`p-3 bg-gray-900 rounded-lg border ${
                selectedSnapshot === snapshot.id ? 'border-nvidia-green' : 'border-gray-700'
              } hover:border-gray-600 transition-colors cursor-pointer`}
              onClick={() => setSelectedSnapshot(snapshot.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-200">{snapshot.name}</h4>
                    {snapshot.scenarioId && (
                      <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded">
                        Scenario
                      </span>
                    )}
                  </div>
                  {snapshot.description && (
                    <p className="text-xs text-gray-400 mt-1">{snapshot.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(snapshot.timestamp)}
                    </span>
                    {snapshot.metadata && (
                      <>
                        <span>•</span>
                        <span>{snapshot.metadata.nodeCount} nodes</span>
                        <span>•</span>
                        <span>{snapshot.metadata.gpuCount} GPUs</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestoreSnapshot(snapshot.id);
                    }}
                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    title="Restore this snapshot"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSnapshot(snapshot.id);
                    }}
                    className="p-1.5 bg-gray-700 hover:bg-red-600 rounded transition-colors"
                    title="Delete this snapshot"
                  >
                    <Trash2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Messages */}
      <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-gray-400">
            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>
    </div>
  );
};