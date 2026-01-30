import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClusterKitSimulator } from '../clusterKitSimulator';
import { parse } from '@/utils/commandParser';
import type { CommandContext } from '@/types/commands';
import { useSimulationStore } from '@/store/simulationStore';

// Mock the store
vi.mock('@/store/simulationStore');

describe('ClusterKitSimulator', () => {
  let simulator: ClusterKitSimulator;
  let context: CommandContext;

  beforeEach(() => {
    simulator = new ClusterKitSimulator();
    context = {
      currentNode: 'dgx-00',
      currentPath: '/root',
      environment: {},
      history: [],
    };

    // Setup default healthy node mock
    vi.mocked(useSimulationStore.getState).mockReturnValue({
      cluster: {
        nodes: [
          {
            id: 'dgx-00',
            hostname: 'dgx-node01',
            systemType: 'DGX-H100',
            healthStatus: 'OK',
            nvidiaDriverVersion: '535.129.03',
            cudaVersion: '12.2',
            gpus: [
              {
                id: 0,
                name: 'NVIDIA H100 80GB HBM3',
                type: 'H100-SXM',
                uuid: 'GPU-12345678-1234-1234-1234-123456789012',
                pciAddress: '0000:17:00.0',
                temperature: 65,
                powerDraw: 250,
                powerLimit: 700,
                memoryTotal: 81920,
                memoryUsed: 1024,
                utilization: 0,
                clocksSM: 1980,
                clocksMem: 2619,
                eccEnabled: true,
                eccErrors: {
                  singleBit: 0,
                  doubleBit: 0,
                  aggregated: { singleBit: 0, doubleBit: 0 },
                },
                migMode: false,
                migInstances: [],
                nvlinks: [],
                healthStatus: 'OK',
                xidErrors: [],
                persistenceMode: true,
              },
              {
                id: 1,
                name: 'NVIDIA H100 80GB HBM3',
                type: 'H100-SXM',
                uuid: 'GPU-12345678-1234-1234-1234-123456789013',
                pciAddress: '0000:18:00.0',
                temperature: 70,
                powerDraw: 300,
                powerLimit: 700,
                memoryTotal: 81920,
                memoryUsed: 2048,
                utilization: 50,
                clocksSM: 1980,
                clocksMem: 2619,
                eccEnabled: true,
                eccErrors: {
                  singleBit: 0,
                  doubleBit: 0,
                  aggregated: { singleBit: 0, doubleBit: 0 },
                },
                migMode: false,
                migInstances: [],
                nvlinks: [],
                healthStatus: 'OK',
                xidErrors: [],
                persistenceMode: true,
              },
            ],
            hcas: [
              {
                id: 0,
                devicePath: 'mlx5_0',
                pciAddress: '0000:51:00.0',
                caType: 'ConnectX-7',
                firmwareVersion: '28.39.1002',
                ports: [
                  {
                    portNumber: 1,
                    state: 'Active',
                    physicalState: 'LinkUp',
                    rate: 400,
                    lid: 1,
                    guid: '0x506b4b03009cebe0',
                    linkLayer: 'InfiniBand',
                    errors: {
                      symbolErrors: 0,
                      linkDowned: 0,
                      portRcvErrors: 0,
                      portXmitDiscards: 0,
                      portXmitWait: 0,
                    },
                  },
                ],
              },
              {
                id: 1,
                devicePath: 'mlx5_1',
                pciAddress: '0000:52:00.0',
                caType: 'ConnectX-7',
                firmwareVersion: '28.39.1002',
                ports: [
                  {
                    portNumber: 1,
                    state: 'Active',
                    physicalState: 'LinkUp',
                    rate: 400,
                    lid: 2,
                    guid: '0x506b4b03009cebe1',
                    linkLayer: 'InfiniBand',
                    errors: {
                      symbolErrors: 0,
                      linkDowned: 0,
                      portRcvErrors: 0,
                      portXmitDiscards: 0,
                      portXmitWait: 0,
                    },
                  },
                ],
              },
            ],
            bmc: {
              ipAddress: '10.0.0.100',
              macAddress: '00:11:22:33:44:55',
              firmwareVersion: '4.2.1',
              manufacturer: 'NVIDIA',
              sensors: [],
              powerState: 'On',
            },
          },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  describe('Help and Version', () => {
    it('should show help with --help', () => {
      const parsed = parse('clusterkit --help');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Comprehensive Node Assessment Tool');
      expect(result.output).toContain('assess');
      expect(result.output).toContain('check');
    });

    it('should show version with --version', () => {
      const parsed = parse('clusterkit --version');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('clusterkit');
      expect(result.output).toContain('1.0.0');
    });
  });

  describe('Assess Command', () => {
    it('should run full assessment on healthy node', () => {
      const parsed = parse('clusterkit assess');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('ClusterKit Assessment Report');
      expect(result.output).toContain('Node: dgx-00');
      expect(result.output).toContain('Overall Health: PASS');
      expect(result.output).toContain('GPU');
      expect(result.output).toContain('NETWORK');
      expect(result.output).toContain('STORAGE');
      expect(result.output).toContain('FIRMWARE');
      expect(result.output).toContain('DRIVERS');
    });

    it('should show pass status for all checks on healthy node', () => {
      const parsed = parse('clusterkit assess');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('All 2 GPUs operational');
      expect(result.output).toContain('All 2 InfiniBand HCAs active');
      expect(result.output).toContain('Storage mounts accessible');
      expect(result.output).toContain('Firmware versions current');
      expect(result.output).toContain('Drivers loaded and compatible');
    });

    it('should show verbose details with --verbose flag', () => {
      const parsed = parse('clusterkit assess --verbose');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('GPU 0:');
      expect(result.output).toContain('GPU 1:');
      expect(result.output).toContain('mlx5_0');
      expect(result.output).toContain('mlx5_1');
      expect(result.output).toContain('NVIDIA Driver: 535.129.03');
      expect(result.output).toContain('CUDA: 12.2');
    });

    it('should detect GPU issues - XID errors', () => {
      // Mock node with GPU XID error
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  name: 'NVIDIA H100 80GB HBM3',
                  healthStatus: 'OK',
                  temperature: 70,
                  xidErrors: [
                    {
                      code: 79,
                      timestamp: new Date(),
                      description: 'GPU has fallen off the bus',
                      severity: 'Critical',
                    },
                  ],
                },
              ],
              hcas: [],
              bmc: { firmwareVersion: '4.2.1' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess --verbose');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Overall Health: FAIL');
      expect(result.output).toContain('GPUs have issues');
      expect(result.output).toContain('XID 79');
    });

    it('should detect GPU issues - high temperature', () => {
      // Mock node with overheating GPU
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  name: 'NVIDIA H100 80GB HBM3',
                  healthStatus: 'OK',
                  temperature: 90,
                  xidErrors: [],
                },
              ],
              hcas: [],
              bmc: { firmwareVersion: '4.2.1' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess --verbose');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Overall Health: FAIL');
      expect(result.output).toContain('High temperature');
      expect(result.output).toContain('90°C');
    });

    it('should detect GPU issues - unhealthy status', () => {
      // Mock node with GPU in Warning state
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  name: 'NVIDIA H100 80GB HBM3',
                  healthStatus: 'Warning',
                  temperature: 70,
                  xidErrors: [],
                },
              ],
              hcas: [],
              bmc: { firmwareVersion: '4.2.1' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess --verbose');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Overall Health: FAIL');
      expect(result.output).toContain('Health status Warning');
    });

    it('should detect network issues - inactive HCA', () => {
      // Mock node with inactive HCA port
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  healthStatus: 'OK',
                  temperature: 70,
                  xidErrors: [],
                },
              ],
              hcas: [
                {
                  id: 0,
                  devicePath: 'mlx5_0',
                  caType: 'ConnectX-7',
                  ports: [
                    {
                      state: 'Active',
                    },
                  ],
                },
                {
                  id: 1,
                  devicePath: 'mlx5_1',
                  caType: 'ConnectX-7',
                  ports: [
                    {
                      state: 'Down',
                    },
                  ],
                },
              ],
              bmc: { firmwareVersion: '4.2.1' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Overall Health: WARNING');
      expect(result.output).toContain('1/2 HCAs active');
    });

    it('should detect firmware version mismatch', () => {
      // Mock node with different BMC firmware version
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  healthStatus: 'OK',
                  temperature: 70,
                  xidErrors: [],
                },
              ],
              hcas: [],
              bmc: { firmwareVersion: '4.1.9' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess --verbose');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Overall Health: WARNING');
      expect(result.output).toContain('Firmware version mismatch');
      expect(result.output).toContain('4.1.9');
      expect(result.output).toContain('expected 4.2.1');
    });
  });

  describe('Check Command', () => {
    it('should require category argument', () => {
      const parsed = parse('clusterkit check');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('Missing required argument: category');
      expect(result.output).toContain('Valid categories');
    });

    it('should reject invalid category', () => {
      const parsed = parse('clusterkit check invalid');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('Invalid category');
      expect(result.output).toContain('Valid categories');
    });

    it('should accept valid categories', () => {
      const categories = ['gpu', 'network', 'storage', 'firmware', 'drivers'];

      categories.forEach((category) => {
        const parsed = parse(`clusterkit check ${category}`);
        const result = simulator.execute(parsed, context);

        // Currently returns coming soon message
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('coming soon');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing node', () => {
      const parsed = parse('clusterkit assess --node nonexistent');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('Node nonexistent not found');
    });

    it('should default to first node when none specified', () => {
      const parsed = parse('clusterkit assess');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('dgx-00');
    });

    it('should handle invalid subcommand', () => {
      const parsed = parse('clusterkit invalid');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('is not a clusterkit command');
    });
  });

  describe('Overall Health Calculation', () => {
    it('should return fail if any check fails', () => {
      // Mock node with GPU XID error and firmware mismatch
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  healthStatus: 'Critical',
                  temperature: 70,
                  xidErrors: [],
                },
              ],
              hcas: [],
              bmc: { firmwareVersion: '4.1.9' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      // Fail takes precedence over warning
      expect(result.output).toContain('Overall Health: FAIL');
    });

    it('should return warning if no failures but has warnings', () => {
      // Mock node with firmware mismatch only
      vi.mocked(useSimulationStore.getState).mockReturnValue({
        cluster: {
          nodes: [
            {
              id: 'dgx-00',
              hostname: 'dgx-node01',
              gpus: [
                {
                  id: 0,
                  healthStatus: 'OK',
                  temperature: 70,
                  xidErrors: [],
                },
              ],
              hcas: [],
              bmc: { firmwareVersion: '4.1.9' },
              nvidiaDriverVersion: '535.129.03',
              cudaVersion: '12.2',
            },
          ],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const parsed = parse('clusterkit assess');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Overall Health: WARNING');
    });
  });
});
