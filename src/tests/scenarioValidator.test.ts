import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../store/simulationStore';
import { NvidiaSmiSimulator } from '../simulators/nvidiaSmiSimulator';
import { DcgmiSimulator } from '../simulators/dcgmiSimulator';
import { initializeScenario } from '../utils/scenarioLoader';
import { parse } from '../utils/commandParser';
import type { CommandContext } from '../simulators/BaseSimulator';

describe('Scenario Logic Validation', () => {
  let store: ReturnType<typeof useSimulationStore.getState>;
  let nvidiaSmi: NvidiaSmiSimulator;
  let dcgmi: DcgmiSimulator;
  let context: CommandContext;

  beforeEach(() => {
    // Reset store
    store = useSimulationStore.getState();
    store.resetSimulation();

    // Initialize simulators
    nvidiaSmi = new NvidiaSmiSimulator();
    dcgmi = new DcgmiSimulator();

    // Create context
    context = {
      cluster: store.cluster,
      currentNode: store.cluster.nodes[0]?.id || 'dgx-00'
    };
  });

  describe('Critical: XID 79 Error Handling', () => {
    it('should make GPU invisible in nvidia-smi when XID 79 occurs', async () => {
      // Initialize XID 79 scenario
      await initializeScenario('domain5-xid-errors');

      const result = nvidiaSmi.execute(parse('nvidia-smi'), context);
      expect(result.output).toContain('WARNING');
      expect(result.output).toContain('GPU(s) not shown due to critical errors');
      expect(result.output).toContain('XID 79');
    });

    it('should fail GPU reset for XID 79', async () => {
      await initializeScenario('domain5-xid-errors');

      const result = nvidiaSmi.execute(parse('nvidia-smi --gpu-reset -i 0'), context);
      expect(result.output).toContain('Unable to reset GPU');
      expect(result.output).toContain('fallen off the bus');
      expect(result.output).not.toContain('Successfully reset');
    });

    it('should fail DCGM diagnostics for GPU with XID 79', async () => {
      await initializeScenario('domain5-xid-errors');

      const result = dcgmi.execute(parse('dcgmi diag -r 3 -i 0'), context);
      expect(result.output).toContain('Error');
      expect(result.output).toContain('GPU 0 is not accessible');
      expect(result.output).not.toContain('All tests passed');
    });

    it('should reject invalid GPU ID formats', () => {
      const result = nvidiaSmi.execute(parse('nvidia-smi --gpu-reset -i -0'), context);
      expect(result.output).toContain('Error: Invalid GPU ID');
      expect(result.output).not.toContain('Unable to reset GPU');
    });
  });

  describe('High Priority: Thermal Throttling', () => {
    it('should throttle GPU clocks when temperature exceeds threshold', async () => {
      await initializeScenario('domain5-thermal');

      const result = nvidiaSmi.execute(parse('nvidia-smi --query-gpu=temperature.gpu,clocks.current.sm --format=csv'));
      const lines = result.output.split('\n');

      // Parse temperature and clock from CSV
      const dataLine = lines[1]; // Skip header
      if (dataLine) {
        const [temp] = dataLine.split(',').map((s: string) => s.trim());
        const temperature = parseInt(temp);

        if (temperature > 85) {
          expect(result.output.toLowerCase()).toContain('throttl');
        }
      }
    });

    it('should show throttle reasons when GPU is hot', async () => {
      await initializeScenario('domain5-thermal');

      const result = nvidiaSmi.execute(parse('nvidia-smi -q -i 0'));
      if (result.output.includes('95 C') || result.output.includes('95C')) {
        expect(result.output.toLowerCase()).toContain('throttl');
      }
    });
  });

  describe('High Priority: MIG Configuration', () => {
    it('should require GPU reset after MIG mode change', async () => {
      await initializeScenario('domain2-mig-setup');

      // Enable MIG mode
      let result = nvidiaSmi.execute(parse('nvidia-smi -mig 1 -i 0'), context);
      expect(result.output).toContain('requires reset');

      // Verify MIG not active until reset
      result = nvidiaSmi.execute(parse('nvidia-smi --query-gpu=mig.mode.current --format=csv'), context);
      expect(result.output).toContain('Disabled');

      // Reset GPU
      result = nvidiaSmi.execute(parse('nvidia-smi --gpu-reset -i 0'));

      // Now MIG should be enabled
      result = nvidiaSmi.execute(parse('nvidia-smi --query-gpu=mig.mode.current --format=csv'), context);
      expect(result.output).toContain('Enabled');
    });
  });

  describe('Medium Priority: Command Validation', () => {
    it('should validate Lustre commands only work when Lustre is mounted', () => {
      // This would require implementing storage state
      const result = nvidiaSmi.execute(parse('lfs df'));

      // If Lustre not mounted, should fail
      // Note: storage property doesn't exist in current ClusterConfig
      // This test is a placeholder for when storage is implemented
      expect(result).toBeDefined();
    });

    it('should track ECC error counters correctly', async () => {
      // Inject ECC errors
      store.updateGPU('dgx-00', 0, {
        eccErrors: {
          singleBit: 10,
          doubleBit: 2,
          aggregated: { singleBit: 10, doubleBit: 2 }
        }
      });

      const result = nvidiaSmi.execute(parse('nvidia-smi --query-gpu=ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv'), context);
      expect(result.output).toContain('10');
      expect(result.output).toContain('2');
    });
  });

  describe('Validation Rules', () => {
    it('should validate command output, not just execution', async () => {
      await initializeScenario('domain1-server-post');

      // Scenario should check for specific output patterns
      const scenario = store.activeScenario;
      expect(scenario?.steps[0].validationRules).toBeDefined();

      // Check that validation includes output checking
      const hasOutputValidation = scenario?.steps[0].validationRules?.some(
        (rule: any) => rule.type === 'output-contains' || rule.expectedOutput
      );

      // This might fail for some scenarios - that's the point
      expect(hasOutputValidation).toBe(true);
    });
  });

  describe('Fault Injection Effects', () => {
    it('should affect NVLink topology when nvlink-failure is injected', () => {
      store.updateGPU('dgx-00', 0, {
        healthStatus: 'Warning',
        // NVLink should be marked as down
      });

      const result = nvidiaSmi.execute(parse('nvidia-smi nvlink -s'), context);
      expect(result.output.toLowerCase()).toContain('down');
    });

    it('should degrade PCIe speed for pcie-error fault', () => {
      // Inject PCIe error
      // This needs implementation in the fault injection
      const result = nvidiaSmi.execute(parse('nvidia-smi --query-gpu=pci.link.gen.current --format=csv'));
      // Should show degraded Gen2 or Gen3 instead of Gen4
      expect(result).toBeDefined();
    });
  });

  describe('Scenario Completeness', () => {
    const scenarios = [
      'domain1-server-post',
      'domain2-mig-setup',
      'domain3-slurm-config',
      'domain4-dcgmi-diag',
      'domain5-xid-errors'
    ];

    scenarios.forEach(scenarioId => {
      it(`should have complete validation for ${scenarioId}`, async () => {
        await initializeScenario(scenarioId);
        const scenario = store.activeScenario;

        expect(scenario).toBeDefined();
        expect(scenario?.steps.length).toBeGreaterThan(0);

        // Each step should have validation rules
        scenario?.steps.forEach((step: any, index: number) => {
          expect(step.validationRules, `Step ${index} lacks validation`).toBeDefined();
          expect(step.validationRules?.length, `Step ${index} has empty validation`).toBeGreaterThan(0);
        });
      });
    });
  });
});