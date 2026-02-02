import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DcgmiSimulator } from '../dcgmiSimulator';
import { useSimulationStore } from '@/store/simulationStore';
import { parse } from '@/utils/commandParser';

vi.mock('@/store/simulationStore');

describe('DcgmiSimulator Policy', () => {
  let simulator: DcgmiSimulator;
  const context = {
    currentNode: 'dgx-00',
    currentPath: '/root',
    environment: {},
    history: [],
  };

  beforeEach(() => {
    simulator = new DcgmiSimulator();
    vi.mocked(useSimulationStore.getState).mockReturnValue({
      cluster: {
        nodes: [
          {
            id: 'dgx-00',
            hostname: 'dgx-00.cluster.local',
            gpus: Array(8).fill(null).map((_, i) => ({
              id: i,
              name: 'NVIDIA H100 80GB HBM3',
              temperature: 45,
              healthStatus: 'OK',
              eccErrors: {
                singleBit: 0,
                doubleBit: 0,
                aggregated: { singleBit: 0, doubleBit: 0 },
              },
              xidErrors: [],
              nvlinks: Array(18).fill(null).map((_, j) => ({
                id: j,
                status: 'Active',
                txErrors: 0,
                rxErrors: 0,
              })),
            })),
            cpuCount: 2,
            ramTotal: 2048,
            ramUsed: 512,
            slurmState: 'idle',
          },
        ],
      },
    } as unknown as ReturnType<typeof useSimulationStore.getState>);
  });

  describe('dcgmi policy --get', () => {
    it('should return policy information', () => {
      const result = simulator.execute(parse('dcgmi policy --get'), context);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Policy');
    });

    it('should show enabled policies', () => {
      const result = simulator.execute(parse('dcgmi policy --get'), context);
      expect(result.output).toContain('Enabled');
    });

    it('should show ECC policy', () => {
      const result = simulator.execute(parse('dcgmi policy --get'), context);
      expect(result.output).toMatch(/ECC/i);
    });

    it('should show Thermal policy', () => {
      const result = simulator.execute(parse('dcgmi policy --get'), context);
      expect(result.output).toMatch(/Thermal/i);
    });

    it('should support group parameter', () => {
      const result = simulator.execute(parse('dcgmi policy --get -g 1'), context);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Group 1');
    });
  });

  describe('dcgmi policy --set', () => {
    it('should require condition flag', () => {
      const result = simulator.execute(parse('dcgmi policy --set'), context);
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('condition');
    });

    it('should accept valid condition', () => {
      const result = simulator.execute(parse('dcgmi policy --set --condition ecc --threshold 10 --action log'), context);
      expect(result.exitCode).toBe(0);
    });

    it('should reject invalid condition', () => {
      const result = simulator.execute(parse('dcgmi policy --set --condition invalid'), context);
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('Invalid condition');
    });

    it('should support thermal condition', () => {
      const result = simulator.execute(parse('dcgmi policy --set --condition thermal --threshold 85 --action log'), context);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('dcgmi policy --reg', () => {
    it('should register for notifications', () => {
      const result = simulator.execute(parse('dcgmi policy --reg'), context);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('registered');
    });

    it('should support condition parameter', () => {
      const result = simulator.execute(parse('dcgmi policy --reg --condition pcie'), context);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('pcie');
    });
  });

  describe('dcgmi policy --clear', () => {
    it('should clear policies', () => {
      const result = simulator.execute(parse('dcgmi policy --clear'), context);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('cleared');
    });

    it('should support group parameter', () => {
      const result = simulator.execute(parse('dcgmi policy --clear -g 1'), context);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('group 1');
    });
  });
});
