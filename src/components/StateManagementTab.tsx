// src/components/StateManagementTab.tsx
import { StateManagementPanel } from "./StateManagementPanel";

export function StateManagementTab() {
  return (
    <div className="h-full overflow-auto p-6 bg-gray-900">
      <h1 className="text-2xl font-bold text-white mb-6">State Management</h1>
      <p className="text-gray-400 mb-6">
        Save and restore cluster configurations, export progress, and manage
        simulation state.
      </p>
      <StateManagementPanel />
    </div>
  );
}
