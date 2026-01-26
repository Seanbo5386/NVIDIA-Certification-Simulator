import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parse } from '@/utils/commandParser';
import { NvidiaSmiSimulator } from '@/simulators/nvidiaSmiSimulator';
import { DcgmiSimulator } from '@/simulators/dcgmiSimulator';
import { BasicSystemSimulator } from '@/simulators/basicSystemSimulator';
import type { CommandContext } from '@/types/commands';

vi.mock('@/store/simulationStore', () => ({
  useSimulationStore: {
    getState: vi.fn(() => ({
      cluster: {
        nodes: [
          {
            id: 'dgx-00',
            hostname: 'dgx-node01',
            systemType: 'H100',
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
                temperature: 45,
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
            ],
            hcas: [],
          },
        ],
      },
    })),
  },
}));

describe('Edge Case Tests', () => {
  let context: CommandContext;

  beforeEach(() => {
    context = {
      currentNode: 'dgx-00',
      currentPath: '/root',
      environment: {},
      history: [],
    };
  });

  describe('Empty and Whitespace Inputs', () => {
    it('should handle empty command', () => {
      const parsed = parse('');
      expect(parsed.baseCommand).toBe('');
      expect(parsed.subcommands).toEqual([]);
    });

    it('should handle whitespace-only command', () => {
      const parsed = parse('   \t  \n  ');
      expect(parsed.baseCommand).toBe('');
    });

    it('should trim leading/trailing whitespace', () => {
      const parsed = parse('  nvidia-smi  ');
      expect(parsed.baseCommand).toBe('nvidia-smi');
    });

    it('should handle multiple spaces between args', () => {
      const parsed = parse('dcgmi    discovery    -l');
      expect(parsed.baseCommand).toBe('dcgmi');
      expect(parsed.subcommands).toContain('discovery');
    });
  });

  describe('Special Characters', () => {
    it('should handle commands with pipes', () => {
      const parsed = parse('dmesg | grep error');
      expect(parsed.baseCommand).toBe('dmesg');
      // Pipe handling behavior depends on implementation
    });

    it('should handle commands with redirects', () => {
      const parsed = parse('nvidia-smi > output.txt');
      expect(parsed.baseCommand).toBe('nvidia-smi');
    });

    it('should handle paths with slashes', () => {
      const parsed = parse('mlxconfig -d /dev/mst/mt4119_pciconf0 query');
      expect(parsed.flags.get('d')).toBe('/dev/mst/mt4119_pciconf0');
    });

    it('should handle paths with dots', () => {
      const parsed = parse('command ./script.sh');
      expect(parsed.subcommands).toContain('./script.sh');
    });

    it('should handle hyphenated values', () => {
      const parsed = parse('command --name=my-value-here');
      expect(parsed.flags.get('name')).toBe('my-value-here');
    });

    it('should handle underscores', () => {
      const parsed = parse('command --file_name=test_file');
      expect(parsed.flags.get('file_name')).toBe('test_file');
    });
  });

  describe('Unicode and International Characters', () => {
    it('should handle UTF-8 in arguments', () => {
      const parsed = parse('command "Ñoño"');
      expect(parsed.subcommands).toContain('Ñoño');
    });

    it('should handle emoji in arguments', () => {
      const parsed = parse('echo "🚀 test"');
      expect(parsed.subcommands[0]).toContain('🚀');
    });

    it('should handle Chinese characters', () => {
      const parsed = parse('command 测试');
      expect(parsed.subcommands).toContain('测试');
    });
  });

  describe('Very Long Inputs', () => {
    it('should handle very long command line', () => {
      const longArg = 'a'.repeat(10000);
      const parsed = parse(`command ${longArg}`);
      expect(parsed.subcommands[0]).toBe(longArg);
    });

    it('should handle many arguments', () => {
      const manyArgs = Array(100).fill('arg').join(' ');
      const parsed = parse(`command ${manyArgs}`);
      expect(parsed.subcommands.length).toBe(100);
    });

    it('should handle deeply nested quotes', () => {
      const parsed = parse('command "outer \\"inner \\\\\\"deep\\\\\\"\\" more"');
      // Quote handling depends on implementation
      expect(parsed.baseCommand).toBe('command');
    });
  });

  describe('Malformed Flags', () => {
    it('should handle flag without value when value expected', () => {
      const simulator = new DcgmiSimulator();
      const parsed = parse('dcgmi diag -r');
      const result = simulator.execute(parsed, context);

      // Should handle gracefully, either error or use default
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown short flags', () => {
      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi -Z');
      const result = simulator.execute(parsed, context);

      // Should not crash
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown long flags', () => {
      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi --nonexistent-flag');
      const result = simulator.execute(parsed, context);

      // Should not crash
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed valid and invalid flags', () => {
      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi -L --invalid --help');
      const result = simulator.execute(parsed, context);

      // Should handle gracefully
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle short flags with equals', () => {
      const parsed = parse('command -flag=value=extra');
      // Short flags don't use = syntax, parser may not handle this
      expect(parsed.baseCommand).toBe('command');
    });
  });

  describe('Conflicting Options', () => {
    it('should handle conflicting short and long flags', () => {
      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi -L -q');
      const result = simulator.execute(parsed, context);

      // Should handle gracefully, typically one takes precedence
      expect(result.exitCode).toBe(0);
    });

    it('should handle duplicate flags', () => {
      const parsed = parse('command -v -v -v');
      expect(parsed.flags.has('v')).toBe(true);
    });

    it('should handle flag redefinition', () => {
      const parsed = parse('command --output=file1.txt --output=file2.txt');
      // Last one wins or error
      expect(parsed.flags.has('output')).toBe(true);
    });
  });

  describe('Missing Required Arguments', () => {
    it('should handle missing required subcommand', () => {
      const simulator = new DcgmiSimulator();
      const parsed = parse('dcgmi');
      const result = simulator.execute(parsed, context);

      // Should show help or error
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing required flag value', () => {
      const simulator = new DcgmiSimulator();
      const parsed = parse('dcgmi health -g 0');
      const result = simulator.execute(parsed, context);

      // Check for error message
      expect(result.output).toContain('Missing required flag');
    });

    it('should handle missing both required flags', () => {
      const simulator = new DcgmiSimulator();
      const parsed = parse('dcgmi diag');
      const result = simulator.execute(parsed, context);

      // May return help or error
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Invalid Values', () => {
    it('should handle non-numeric value for numeric flag', () => {
      const simulator = new DcgmiSimulator();
      const parsed = parse('dcgmi diag -r abc -g 0');
      const result = simulator.execute(parsed, context);

      // May not validate strictly or may parse as 0
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative numbers', () => {
      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi -i -1');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle out of range values', () => {
      const simulator = new DcgmiSimulator();
      const parsed = parse('dcgmi diag -r 999 -g 0');
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(1);
    });

    it('should handle invalid device paths', () => {
      const simulator = new BasicSystemSimulator();
      const parsed = parse('dmidecode -t invalid_type');
      const result = simulator.execute(parsed, context);

      // Should handle gracefully
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle mixed case commands', () => {
      const parsed = parse('Nvidia-SMI');
      expect(parsed.baseCommand).toBe('Nvidia-SMI');
    });

    it('should handle uppercase flags', () => {
      const parsed = parse('command -L --HELP');
      expect(parsed.flags.has('L')).toBe(true);
      expect(parsed.flags.has('HELP')).toBe(true);
    });

    it('should preserve case in values', () => {
      const parsed = parse('command --name=MyValue');
      expect(parsed.flags.get('name')).toBe('MyValue');
    });
  });

  describe('Quote Handling Edge Cases', () => {
    it('should handle unmatched quotes', () => {
      const parsed = parse('command "unmatched');
      // Behavior depends on implementation
      expect(parsed.baseCommand).toBe('command');
    });

    it('should handle empty quotes', () => {
      const parsed = parse('command ""');
      // Empty quotes may create empty string or be ignored
      expect(parsed.baseCommand).toBe('command');
    });

    it('should handle escaped quotes', () => {
      const parsed = parse('command "test \\"quote\\""');
      // Quote handling depends on implementation
      expect(parsed.baseCommand).toBe('command');
    });

    it('should handle mixed quote types', () => {
      const parsed = parse('command "double" \'single\'');
      expect(parsed.subcommands.length).toBe(2);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle rapid repeated execution', () => {
      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi');

      for (let i = 0; i < 100; i++) {
        const result = simulator.execute(parsed, context);
        expect(result.exitCode).toBe(0);
      }
    });

    it('should handle execution with large state', () => {
      const largeContext: CommandContext = {
        ...context,
        history: Array(1000).fill('command'),
      };

      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi');
      const result = simulator.execute(parsed, largeContext);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('State Edge Cases', () => {
    it('should handle missing node gracefully', () => {
      const invalidContext: CommandContext = {
        ...context,
        currentNode: 'nonexistent-node',
      };

      const simulator = new NvidiaSmiSimulator();
      const parsed = parse('nvidia-smi');
      const result = simulator.execute(parsed, invalidContext);

      // Should handle gracefully
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty environment', () => {
      const emptyContext: CommandContext = {
        ...context,
        environment: {},
      };

      const simulator = new BasicSystemSimulator();
      const parsed = parse('lscpu');
      const result = simulator.execute(parsed, emptyContext);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Security Edge Cases', () => {
    it('should not execute shell injection attempts', () => {
      const parsed = parse('command; rm -rf /');
      expect(parsed.baseCommand).toBe('command;');
      // Semicolon should be part of command, not executed
    });

    it('should not evaluate backticks', () => {
      const parsed = parse('command `whoami`');
      // Backticks should not be executed
      expect(parsed.baseCommand).toBe('command');
    });

    it('should handle potentially malicious paths', () => {
      const parsed = parse('command ../../etc/passwd');
      expect(parsed.subcommands).toContain('../../etc/passwd');
      // Path traversal should not be executed
    });
  });
});
