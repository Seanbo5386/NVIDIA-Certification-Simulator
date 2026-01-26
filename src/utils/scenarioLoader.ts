import type { Scenario, FaultInjectionConfig } from '@/types/scenarios';
import { useSimulationStore } from '@/store/simulationStore';

/**
 * Loads a scenario from JSON file
 */
export async function loadScenarioFromFile(scenarioId: string): Promise<Scenario | null> {
  try {
    // Map scenario IDs to their file paths
    const scenarioFiles: Record<string, string> = {
      'domain1-server-post': '/src/data/scenarios/domain1/server-post-verification.json',
      'domain1-bmc-config': '/src/data/scenarios/domain1/bmc-configuration.json',
      'domain1-driver-install': '/src/data/scenarios/domain1/driver-installation.json',
      'domain1-gpu-discovery': '/src/data/scenarios/domain1/gpu-feature-discovery.json',
      'domain1-driver-troubleshoot': '/src/data/scenarios/domain1/driver-troubleshooting.json',
      'domain2-mig-setup': '/src/data/scenarios/domain2/mig-configuration.json',
      'domain2-nvlink-topo': '/src/data/scenarios/domain2/nvlink-topology.json',
      'domain3-slurm-config': '/src/data/scenarios/domain3/slurm-configuration.json',
      'domain3-containers': '/src/data/scenarios/domain3/container-runtime.json',
      'domain4-dcgmi-diag': '/src/data/scenarios/domain4/dcgmi-diagnostics.json',
      'domain4-nccl-test': '/src/data/scenarios/domain4/nccl-testing.json',
      'domain4-cluster-health': '/src/data/scenarios/domain4/cluster-health.json',
      'domain5-xid-errors': '/src/data/scenarios/domain5/xid-error-analysis.json',
      'domain5-thermal': '/src/data/scenarios/domain5/thermal-troubleshooting.json',
    };

    const filePath = scenarioFiles[scenarioId];
    if (!filePath) {
      console.error(`Unknown scenario ID: ${scenarioId}`);
      return null;
    }

    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(`Failed to load scenario: ${response.statusText}`);
      return null;
    }

    const scenario: Scenario = await response.json();
    return scenario;
  } catch (error) {
    console.error('Error loading scenario:', error);
    return null;
  }
}

/**
 * Applies scenario faults to the cluster
 */
export function applyScenarioFaults(faults: FaultInjectionConfig[]): void {
  const store = useSimulationStore.getState();

  faults.forEach(fault => {
    const { nodeId, gpuId, type, parameters } = fault;

    switch (type) {
      case 'xid-error':
        if (gpuId !== undefined) {
          store.addXIDError(nodeId, gpuId, {
            code: parameters?.xid || 79,
            timestamp: new Date(),
            description: parameters?.description || 'GPU error detected',
            severity: 'Critical',
          });
        }
        break;

      case 'thermal':
        if (gpuId !== undefined) {
          store.updateGPU(nodeId, gpuId, {
            temperature: parameters?.targetTemp || 95,
          });
        }
        break;

      case 'ecc-error':
        if (gpuId !== undefined) {
          store.updateGPU(nodeId, gpuId, {
            eccErrors: {
              singleBit: parameters?.singleBit || 10,
              doubleBit: parameters?.doubleBit || 1,
              aggregated: {
                singleBit: parameters?.singleBit || 10,
                doubleBit: parameters?.doubleBit || 1,
              },
            },
          });
        }
        break;

      case 'nvlink-failure':
        if (gpuId !== undefined) {
          // NVLink failures are tracked in the nvlinks array, not a single status
          // This would require modifying the nvlinks array to set connection status to 'Down'
          // For now, we'll set healthStatus to Warning as an indicator
          store.updateGPU(nodeId, gpuId, {
            healthStatus: 'Warning',
          });
        }
        break;

      case 'gpu-hang':
        if (gpuId !== undefined) {
          store.updateGPU(nodeId, gpuId, {
            utilization: 0,
          });
        }
        break;

      case 'power':
        if (gpuId !== undefined) {
          store.updateGPU(nodeId, gpuId, {
            powerDraw: parameters?.powerDraw || 700,
          });
        }
        break;

      case 'memory-full':
        if (gpuId !== undefined) {
          store.updateGPU(nodeId, gpuId, {
            memoryUsed: parameters?.memoryUsed || 79000,
          });
        }
        break;

      default:
        console.warn(`Unknown fault type: ${type}`);
    }
  });
}

/**
 * Clears all faults and resets cluster to healthy state
 */
export function clearAllFaults(): void {
  const store = useSimulationStore.getState();
  const { cluster } = store;

  cluster.nodes.forEach(node => {
    node.gpus.forEach(gpu => {
      store.updateGPU(node.id, gpu.id, {
        temperature: 45,
        powerDraw: 300,
        utilization: 0,
        memoryUsed: 0,
        healthStatus: 'OK',
        eccErrors: {
          singleBit: 0,
          doubleBit: 0,
          aggregated: {
            singleBit: 0,
            doubleBit: 0,
          },
        },
        xidErrors: [],
      });
    });

    store.updateNodeHealth(node.id, 'OK');
  });
}

/**
 * Loads and initializes a scenario
 */
export async function initializeScenario(scenarioId: string): Promise<boolean> {
  try {
    // Import StateManager
    const { stateManager } = await import('@/store/stateManager');

    // Create snapshot before starting scenario
    stateManager.snapshotBeforeScenario(scenarioId);

    // Load scenario from file
    const scenario = await loadScenarioFromFile(scenarioId);
    if (!scenario) {
      return false;
    }

    // Clear any existing faults
    clearAllFaults();

    // Apply scenario-specific faults
    if (scenario.faults && scenario.faults.length > 0) {
      applyScenarioFaults(scenario.faults);
    }

    // Apply initial cluster state if specified
    if (scenario.initialClusterState) {
      // This would merge the initial state with current cluster
      // For now, we'll just apply faults
    }

    // Load scenario into store
    const store = useSimulationStore.getState();
    store.loadScenario(scenario);

    return true;
  } catch (error) {
    console.error('Error initializing scenario:', error);
    return false;
  }
}

/**
 * Gets all available scenarios grouped by domain
 */
export function getAllScenarios(): Record<string, string[]> {
  return {
    domain1: [
      'domain1-server-post',
      'domain1-bmc-config',
      'domain1-driver-install',
      'domain1-gpu-discovery',
      'domain1-driver-troubleshoot',
    ],
    domain2: [
      'domain2-mig-setup',
      'domain2-nvlink-topo',
    ],
    domain3: [
      'domain3-slurm-config',
      'domain3-containers',
    ],
    domain4: [
      'domain4-dcgmi-diag',
      'domain4-nccl-test',
      'domain4-cluster-health',
    ],
    domain5: [
      'domain5-xid-errors',
      'domain5-thermal',
    ],
  };
}

/**
 * Gets scenario metadata without loading full content
 */
export function getScenarioMetadata(scenarioId: string): { title: string; difficulty: string; estimatedTime: number } | null {
  const metadata: Record<string, { title: string; difficulty: string; estimatedTime: number }> = {
    'domain1-server-post': { title: 'Server POST and BIOS Verification', difficulty: 'beginner', estimatedTime: 25 },
    'domain1-bmc-config': { title: 'BMC Configuration and Monitoring', difficulty: 'intermediate', estimatedTime: 30 },
    'domain1-driver-install': { title: 'NVIDIA Driver Installation and Validation', difficulty: 'intermediate', estimatedTime: 37 },
    'domain1-gpu-discovery': { title: 'GPU Feature Discovery and Capabilities', difficulty: 'intermediate', estimatedTime: 38 },
    'domain1-driver-troubleshoot': { title: 'GPU Driver Troubleshooting', difficulty: 'intermediate', estimatedTime: 44 },
    'domain2-mig-setup': { title: 'Multi-Instance GPU (MIG) Configuration', difficulty: 'advanced', estimatedTime: 40 },
    'domain2-nvlink-topo': { title: 'NVLink Topology Verification', difficulty: 'intermediate', estimatedTime: 35 },
    'domain3-slurm-config': { title: 'Slurm Workload Manager Configuration', difficulty: 'intermediate', estimatedTime: 40 },
    'domain3-containers': { title: 'GPU-Enabled Container Runtime Setup', difficulty: 'intermediate', estimatedTime: 40 },
    'domain4-dcgmi-diag': { title: 'DCGM Diagnostics and Health Monitoring', difficulty: 'intermediate', estimatedTime: 45 },
    'domain4-nccl-test': { title: 'NCCL Communication Testing and Validation', difficulty: 'advanced', estimatedTime: 63 },
    'domain4-cluster-health': { title: 'Comprehensive Cluster Health Validation', difficulty: 'advanced', estimatedTime: 100 },
    'domain5-xid-errors': { title: 'XID Error Analysis and Resolution', difficulty: 'advanced', estimatedTime: 65 },
    'domain5-thermal': { title: 'GPU Thermal Issue Troubleshooting', difficulty: 'intermediate', estimatedTime: 65 },
  };

  return metadata[scenarioId] || null;
}
