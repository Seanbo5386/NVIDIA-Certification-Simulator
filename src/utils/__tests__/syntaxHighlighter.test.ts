import { describe, it, expect } from 'vitest';
import {
  ANSI,
  highlightCommand,
  highlightOutput,
  highlightTable,
  highlightKeyValue,
  highlightNvidiaSmi,
  highlightDcgmi,
  highlightInfiniBand,
  createHighlightConfig,
  DEFAULT_HIGHLIGHT_CONFIG,
  NO_HIGHLIGHT_CONFIG,
  MINIMAL_HIGHLIGHT_CONFIG,
  stripAnsi,
} from '../syntaxHighlighter';

describe('syntaxHighlighter', () => {
  describe('ANSI codes', () => {
    it('should have all required color codes', () => {
      expect(ANSI.reset).toBe('\x1b[0m');
      expect(ANSI.bold).toBe('\x1b[1m');
      expect(ANSI.red).toBe('\x1b[31m');
      expect(ANSI.green).toBe('\x1b[32m');
      expect(ANSI.yellow).toBe('\x1b[33m');
      expect(ANSI.blue).toBe('\x1b[34m');
      expect(ANSI.cyan).toBe('\x1b[36m');
    });
  });

  describe('highlightCommand', () => {
    it('should highlight known commands', () => {
      const result = highlightCommand('nvidia-smi');
      expect(result).toContain(ANSI.brightCyan);
      expect(result).toContain('nvidia-smi');
      expect(result).toContain(ANSI.reset);
    });

    it('should highlight multiple known commands', () => {
      const commands = ['dcgmi', 'ipmitool', 'ibstat', 'sinfo', 'docker'];
      commands.forEach(cmd => {
        const result = highlightCommand(cmd);
        expect(result).toContain(ANSI.brightCyan);
      });
    });

    it('should highlight flags in arguments', () => {
      const result = highlightCommand('nvidia-smi --query-gpu=memory.used');
      expect(result).toContain(ANSI.yellow);
      expect(result).toContain('--query-gpu=memory.used');
    });

    it('should highlight short flags', () => {
      const result = highlightCommand('ls -la');
      expect(result).toContain(ANSI.yellow);
      expect(result).toContain('-la');
    });

    it('should highlight paths', () => {
      const result = highlightCommand('cat /etc/nvidia/nvidia-smi.conf');
      expect(result).toContain(ANSI.blue);
      expect(result).toContain('/etc/nvidia/nvidia-smi.conf');
    });

    it('should highlight quoted strings', () => {
      const result = highlightCommand('echo "hello world"');
      expect(result).toContain(ANSI.green);
      expect(result).toContain('"hello world"');
    });

    it('should handle empty input', () => {
      const result = highlightCommand('');
      expect(result).toBe('');
    });

    it('should respect disabled highlighting', () => {
      const result = highlightCommand('nvidia-smi --query', { commands: false });
      expect(result).not.toContain(ANSI.brightCyan);
    });
  });

  describe('highlightOutput', () => {
    it('should highlight error keywords', () => {
      const result = highlightOutput('Error: GPU not found');
      expect(result).toContain(ANSI.red);
      expect(result).toContain(ANSI.bold);
    });

    it('should highlight warning keywords', () => {
      const result = highlightOutput('Warning: Temperature high');
      expect(result).toContain(ANSI.yellow);
    });

    it('should highlight success keywords', () => {
      const result = highlightOutput('Test passed successfully');
      expect(result).toContain(ANSI.green);
    });

    it('should skip already highlighted output', () => {
      const input = `${ANSI.red}Already colored${ANSI.reset}`;
      const result = highlightOutput(input);
      expect(result).toBe(input);
    });

    it('should handle multiple lines', () => {
      const input = 'Line 1 OK\nLine 2 Error\nLine 3 Warning';
      const result = highlightOutput(input);
      expect(result).toContain(ANSI.green); // OK
      expect(result).toContain(ANSI.red); // Error
      expect(result).toContain(ANSI.yellow); // Warning
    });

    it('should highlight IP addresses', () => {
      const result = highlightOutput('Server: 192.168.1.100');
      expect(result).toContain(ANSI.cyan);
      expect(result).toContain('192.168.1.100');
    });

    it('should highlight GPU IDs', () => {
      const result = highlightOutput('GPU 0: NVIDIA A100');
      expect(result).toContain(ANSI.cyan);
    });

    it('should highlight PCI addresses', () => {
      const result = highlightOutput('Device at 0000:af:00.0');
      expect(result).toContain(ANSI.magenta);
      expect(result).toContain('0000:af:00.0');
    });

    it('should highlight temperature values', () => {
      const result = highlightOutput('Temperature: 45C');
      expect(result).toContain(ANSI.yellow);
    });

    it('should highlight memory sizes', () => {
      const result = highlightOutput('Memory: 40GB');
      expect(result).toContain(ANSI.brightBlue);
    });

    it('should respect disabled highlighting', () => {
      const result = highlightOutput('Error occurred', { errors: false });
      expect(result).not.toContain(ANSI.red);
    });
  });

  describe('highlightTable', () => {
    it('should highlight table headers', () => {
      const table = 'Name | Value\n-----|------\nGPU  | 0';
      const result = highlightTable(table);
      expect(result).toContain(ANSI.bold);
    });

    it('should highlight separator lines', () => {
      const table = '+-----+-----+\n| A   | B   |\n+-----+-----+';
      const result = highlightTable(table);
      // First and last lines should be highlighted
      const lines = result.split('\n');
      expect(lines[0]).toContain(ANSI.bold);
      expect(lines[2]).toContain(ANSI.bold);
    });

    it('should handle empty tables', () => {
      const result = highlightTable('');
      expect(result).toBe('');
    });

    it('should accept custom header color', () => {
      const table = 'Header\n------\nData';
      const result = highlightTable(table, ANSI.cyan);
      expect(result).toContain(ANSI.cyan);
    });
  });

  describe('highlightKeyValue', () => {
    it('should highlight colon-separated key-value pairs', () => {
      const result = highlightKeyValue('Name: NVIDIA A100');
      expect(result).toContain(ANSI.cyan);
      expect(result).toContain('Name');
    });

    it('should highlight equals-separated key-value pairs', () => {
      const result = highlightKeyValue('Status = Active');
      expect(result).toContain(ANSI.cyan);
      expect(result).toContain('Status');
    });

    it('should handle multiple key-value pairs', () => {
      const input = 'Name: GPU\nStatus: Active\nTemp: 45C';
      const result = highlightKeyValue(input);
      expect(result.match(/\x1b\[36m/g)?.length).toBe(3); // 3 cyan highlights
    });

    it('should preserve indentation', () => {
      const result = highlightKeyValue('  Key: Value');
      expect(result).toContain('  ');
    });
  });

  describe('highlightNvidiaSmi', () => {
    it('should highlight GPU indices', () => {
      const result = highlightNvidiaSmi('| 0   | GPU Name');
      expect(result).toContain(ANSI.cyan);
    });

    it('should highlight temperature', () => {
      const result = highlightNvidiaSmi('Temperature: 45C');
      expect(result).toContain(ANSI.yellow);
    });

    it('should highlight power usage', () => {
      const result = highlightNvidiaSmi('Power: 250W / 300W');
      expect(result).toContain(ANSI.brightYellow);
      expect(result).toContain(ANSI.dim);
    });

    it('should highlight memory usage', () => {
      const result = highlightNvidiaSmi('Memory: 1000MiB / 40960MiB');
      expect(result).toContain(ANSI.brightBlue);
    });

    it('should color-code utilization percentages', () => {
      const high = highlightNvidiaSmi('Utilization: 90%');
      expect(high).toContain(ANSI.green); // High utilization = good

      const medium = highlightNvidiaSmi('Utilization: 60%');
      expect(medium).toContain(ANSI.yellow);

      const low = highlightNvidiaSmi('Utilization: 20%');
      expect(low).toContain(ANSI.dim);
    });

    it('should highlight On/Off states', () => {
      const result = highlightNvidiaSmi('ECC Mode: On  Performance: Off');
      expect(result).toContain(`${ANSI.green}On${ANSI.reset}`);
      expect(result).toContain(`${ANSI.dim}Off${ANSI.reset}`);
    });

    it('should skip already highlighted output', () => {
      const input = `${ANSI.cyan}already colored${ANSI.reset}`;
      const result = highlightNvidiaSmi(input);
      expect(result).toBe(input);
    });
  });

  describe('highlightDcgmi', () => {
    it('should highlight health status', () => {
      const healthy = highlightDcgmi('Status: Healthy');
      expect(healthy).toContain(ANSI.green);

      const warning = highlightDcgmi('Status: Warning');
      expect(warning).toContain(ANSI.yellow);

      const failure = highlightDcgmi('Status: Failure');
      expect(failure).toContain(ANSI.red);
    });

    it('should highlight PASS/FAIL/SKIP', () => {
      const pass = highlightDcgmi('Result: PASS');
      expect(pass).toContain(ANSI.green);
      expect(pass).toContain(ANSI.bold);

      const fail = highlightDcgmi('Result: FAIL');
      expect(fail).toContain(ANSI.red);

      const skip = highlightDcgmi('Result: SKIP');
      expect(skip).toContain(ANSI.yellow);
    });

    it('should highlight GPU IDs', () => {
      const result = highlightDcgmi('GPU ID: 0');
      expect(result).toContain(ANSI.cyan);
    });

    it('should skip already highlighted output', () => {
      const input = `${ANSI.red}already colored${ANSI.reset}`;
      const result = highlightDcgmi(input);
      expect(result).toBe(input);
    });
  });

  describe('highlightInfiniBand', () => {
    it('should highlight port states', () => {
      const active = highlightInfiniBand('State: Active');
      expect(active).toContain(ANSI.green);

      const down = highlightInfiniBand('State: Down');
      expect(down).toContain(ANSI.red);

      const init = highlightInfiniBand('State: Init');
      expect(init).toContain(ANSI.yellow);
    });

    it('should highlight link speeds', () => {
      const gbps = highlightInfiniBand('Speed: 200 Gbps');
      expect(gbps).toContain(ANSI.cyan);

      const gts = highlightInfiniBand('Speed: 25 GT/s');
      expect(gts).toContain(ANSI.cyan);
    });

    it('should highlight GUIDs', () => {
      const result = highlightInfiniBand('GUID: 0x0002c9030012a5f0');
      expect(result).toContain(ANSI.dim);
    });

    it('should highlight LID values', () => {
      const result = highlightInfiniBand('LID: 1234');
      expect(result).toContain(ANSI.cyan);
    });

    it('should skip already highlighted output', () => {
      const input = `${ANSI.green}already colored${ANSI.reset}`;
      const result = highlightInfiniBand(input);
      expect(result).toBe(input);
    });
  });

  describe('createHighlightConfig', () => {
    it('should merge with default config', () => {
      const config = createHighlightConfig({ errors: false });
      expect(config.errors).toBe(false);
      expect(config.commands).toBe(true); // Default value
    });

    it('should allow multiple overrides', () => {
      const config = createHighlightConfig({
        errors: false,
        warnings: false,
        numbers: false,
      });
      expect(config.errors).toBe(false);
      expect(config.warnings).toBe(false);
      expect(config.numbers).toBe(false);
      expect(config.success).toBe(true);
    });
  });

  describe('Preset configs', () => {
    it('DEFAULT_HIGHLIGHT_CONFIG should have all options enabled', () => {
      expect(DEFAULT_HIGHLIGHT_CONFIG.commands).toBe(true);
      expect(DEFAULT_HIGHLIGHT_CONFIG.flags).toBe(true);
      expect(DEFAULT_HIGHLIGHT_CONFIG.errors).toBe(true);
      expect(DEFAULT_HIGHLIGHT_CONFIG.success).toBe(true);
    });

    it('NO_HIGHLIGHT_CONFIG should have all options disabled', () => {
      Object.values(NO_HIGHLIGHT_CONFIG).forEach(value => {
        expect(value).toBe(false);
      });
    });

    it('MINIMAL_HIGHLIGHT_CONFIG should only have status highlighting', () => {
      expect(MINIMAL_HIGHLIGHT_CONFIG.commands).toBe(false);
      expect(MINIMAL_HIGHLIGHT_CONFIG.flags).toBe(false);
      expect(MINIMAL_HIGHLIGHT_CONFIG.errors).toBe(true);
      expect(MINIMAL_HIGHLIGHT_CONFIG.warnings).toBe(true);
      expect(MINIMAL_HIGHLIGHT_CONFIG.success).toBe(true);
    });
  });

  describe('stripAnsi', () => {
    it('should remove all ANSI codes', () => {
      const colored = `${ANSI.red}Error${ANSI.reset}: ${ANSI.bold}message${ANSI.reset}`;
      const result = stripAnsi(colored);
      expect(result).toBe('Error: message');
    });

    it('should handle text without ANSI codes', () => {
      const plain = 'Plain text';
      const result = stripAnsi(plain);
      expect(result).toBe('Plain text');
    });

    it('should handle empty string', () => {
      const result = stripAnsi('');
      expect(result).toBe('');
    });

    it('should handle complex ANSI sequences', () => {
      const complex = '\x1b[1;31;40mBold red on black\x1b[0m';
      const result = stripAnsi(complex);
      expect(result).toBe('Bold red on black');
    });

    it('should handle multiple ANSI codes', () => {
      const multi = `${ANSI.red}R${ANSI.green}G${ANSI.blue}B${ANSI.reset}`;
      const result = stripAnsi(multi);
      expect(result).toBe('RGB');
    });
  });

  describe('Edge cases', () => {
    it('should handle null-like inputs gracefully', () => {
      expect(() => highlightOutput('')).not.toThrow();
      expect(() => highlightCommand('')).not.toThrow();
    });

    it('should preserve line breaks', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const result = highlightOutput(input);
      expect(result.split('\n')).toHaveLength(3);
    });

    it('should handle special characters', () => {
      const input = 'Path: /tmp/test-file_v1.2.3.txt';
      const result = highlightOutput(input);
      expect(result).toContain('test-file_v1.2.3.txt');
    });

    it('should not double-highlight', () => {
      // Run highlighting twice
      const first = highlightOutput('Error: Failed');
      const second = highlightOutput(first);
      // Second pass should not add more ANSI codes
      expect(first).toBe(second);
    });
  });
});
