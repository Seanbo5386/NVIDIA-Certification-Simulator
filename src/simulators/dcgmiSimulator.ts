import type { CommandResult, CommandContext, ParsedCommand } from '@/types/commands';
import type { GPU } from '@/types/hardware';
import { BaseSimulator, type SimulatorMetadata } from '@/simulators/BaseSimulator';
import { useSimulationStore } from '@/store/simulationStore';

export class DcgmiSimulator extends BaseSimulator {
  constructor() {
    super();
    this.registerCommands();
  }

  /**
   * Register all DCGM commands with metadata
   */
  private registerCommands(): void {
    this.registerCommand('discovery', this.handleDiscovery.bind(this), {
      name: 'discovery',
      description: 'Discover GPUs in the system',
      usage: 'dcgmi discovery [OPTIONS]',
      flags: [
        { short: 'l', long: 'list', description: 'List all discovered GPUs with details' },
        { short: 'c', long: 'compute', description: 'Show compute capability' },
      ],
      examples: [
        'dcgmi discovery -l',
        'dcgmi discovery --list',
      ],
    });

    this.registerCommand('diag', this.handleDiag.bind(this), {
      name: 'diag',
      description: 'Run GPU diagnostics',
      usage: 'dcgmi diag [OPTIONS]',
      flags: [
        { short: 'r', long: 'mode', description: 'Diagnostic level (1=short, 2=medium, 3=long)', takesValue: true, defaultValue: '1' },
        { short: 'i', long: 'gpu-id', description: 'Specify GPU ID to test', takesValue: true },
      ],
      examples: [
        'dcgmi diag -r 1',
        'dcgmi diag --mode 2',
        'dcgmi diag -r 3 -i 0',
      ],
    });

    this.registerCommand('health', this.handleHealth.bind(this), {
      name: 'health',
      description: 'Check GPU health status',
      usage: 'dcgmi health [OPTIONS]',
      flags: [
        { short: 'c', long: 'check', description: 'Check health status of all GPUs' },
      ],
      examples: [
        'dcgmi health -c',
        'dcgmi health --check',
      ],
    });

    this.registerCommand('group', this.handleGroup.bind(this), {
      name: 'group',
      description: 'Manage GPU groups',
      usage: 'dcgmi group [OPTIONS]',
      flags: [
        { short: 'l', long: 'list', description: 'List all GPU groups' },
        { short: 'c', long: 'create', description: 'Create a new group', takesValue: true },
        { short: 'd', long: 'delete', description: 'Delete a group', takesValue: true },
      ],
      examples: [
        'dcgmi group -l',
        'dcgmi group -c my-group',
        'dcgmi group --create my-group',
      ],
    });

    this.registerCommand('stats', this.handleStats.bind(this), {
      name: 'stats',
      description: 'Collect GPU statistics',
      usage: 'dcgmi stats [OPTIONS]',
      flags: [
        { short: 'g', long: 'group', description: 'Specify group ID', takesValue: true },
        { short: 'e', long: 'enable', description: 'Enable stats collection' },
      ],
      examples: [
        'dcgmi stats -g 0 -e',
        'dcgmi stats --enable',
      ],
    });

    this.registerCommand('policy', this.handlePolicy.bind(this), {
      name: 'policy',
      description: 'Set health monitoring policies',
      usage: 'dcgmi policy [OPTIONS]',
      flags: [
        { short: 'g', long: 'group', description: 'Specify group ID', takesValue: true },
        { short: 'e', long: 'enable', description: 'Enable policy mask', takesValue: true },
      ],
      examples: [
        'dcgmi policy -g 0 -e 0xFF',
      ],
    });
  }

  getMetadata(): SimulatorMetadata {
    return {
      name: 'dcgmi',
      version: '3.1.3',
      description: 'NVIDIA Data Center GPU Manager Interface',
      commands: Array.from(this.commandMetadata.values()),
    };
  }

  execute(parsed: ParsedCommand, context: CommandContext): CommandResult {
    // Handle root-level flags (--version, --help)
    if (this.hasAnyFlag(parsed, ['version', 'v'])) {
      return this.handleVersion();
    }

    if (this.hasAnyFlag(parsed, ['help', 'h'])) {
      // If a subcommand is specified, show help for that command
      const subcommand = parsed.subcommands[0];
      return this.handleHelp(subcommand);
    }

    // Get the subcommand
    const subcommand = parsed.subcommands[0];

    if (!subcommand) {
      return this.createError('No command specified. Run "dcgmi --help" for usage.');
    }

    // Route to command handler
    const handler = this.getCommand(subcommand);

    if (!handler) {
      const metadata = this.getMetadata();
      const availableCommands = metadata.commands.map(cmd => `  ${cmd.name.padEnd(12)} ${cmd.description}`).join('\n');
      return this.createError(`Unknown command: ${subcommand}\n\nAvailable commands:\n${availableCommands}\n\nRun "dcgmi --help" for more information.`);
    }

    // Execute handler (handlers in this simulator are synchronous)
    const result = handler(parsed, context);
    return result as CommandResult;
  }

  /**
   * Get the current node from simulation store
   */
  private getNode(context: CommandContext) {
    const state = useSimulationStore.getState();
    return state.cluster.nodes.find(n => n.id === context.currentNode);
  }

  /**
   * Simulate DCGM diagnostic output
   */
  private simulateDiagnostic(mode: number, gpus: GPU[]): string {
    // SOURCE OF TRUTH: Column widths
    const COL_1 = 27; // Diagnostic name
    const COL_2 = 48; // Result

    // Generate borders dynamically
    const BORDER = '+' + '-'.repeat(COL_1) + '+' + '-'.repeat(COL_2) + '+';
    const DOUBLE_BORDER = '+' + '='.repeat(COL_1) + '+' + '='.repeat(COL_2) + '+';

    // Helper to pad content to exact column width (handles ANSI color codes)
    const padCol = (content: string, width: number): string => {
      // Strip ANSI color codes to measure actual visual length
      const stripped = content.replace(/\x1b\[[0-9;]*m/g, '');
      const actualLength = stripped.length;

      if (actualLength > width) {
        return content.substring(0, width);
      }

      // Add spaces after the content (before closing |)
      const padding = ' '.repeat(width - actualLength);
      return content + padding;
    };

    let output = `\nSuccessfully ran diagnostic for group.\n`;
    output += BORDER + '\n';
    output += '| ' + padCol('Diagnostic', COL_1 - 1) + '| ' + padCol('Result', COL_2 - 1) + '|\n';
    output += DOUBLE_BORDER + '\n';

    const tests = [
      { name: 'Deployment', desc: 'Blacklist', pass: true },
      { name: 'Deployment', desc: 'NVML Library', pass: true },
      { name: 'Deployment', desc: 'CUDA Main Library', pass: true },
      { name: 'Deployment', desc: 'Permissions and OS Blocks', pass: true },
      { name: 'Deployment', desc: 'Persistence Mode', pass: true },
      { name: 'Deployment', desc: 'Environment Variables', pass: true },
      { name: 'Deployment', desc: 'Page Retirement/Row Remap', pass: true },
      { name: 'Deployment', desc: 'Graphics Processes', pass: true },
      { name: 'Hardware', desc: 'GPU Memory', pass: true },
      { name: 'Hardware', desc: 'Pulse Test', pass: true },
    ];

    if (mode >= 2) {
      tests.push(
        { name: 'Integration', desc: 'PCIe', pass: true },
        { name: 'Performance', desc: 'SM Stress', pass: true },
        { name: 'Performance', desc: 'Targeted Stress', pass: true }
      );
    }

    if (mode >= 3) {
      tests.push(
        { name: 'Performance', desc: 'Memory Bandwidth', pass: true },
        { name: 'Performance', desc: 'Diagnostic', pass: true },
        { name: 'Hardware', desc: 'ECC Check', pass: gpus.every(g => g.eccErrors.doubleBit === 0) }
      );
    }

    tests.forEach(test => {
      const status = test.pass ? '\x1b[32mPass\x1b[0m' : '\x1b[31mFail\x1b[0m';
      const col1Content = padCol(test.name, COL_1 - 1);
      const col2Content = padCol(test.desc + ' ' + status, COL_2 - 1);
      output += '| ' + col1Content + '| ' + col2Content + '|\n';
    });

    output += BORDER + '\n\n';

    const failedTests = tests.filter(t => !t.pass);
    if (failedTests.length > 0) {
      output += `\x1b[31mWarning: ${failedTests.length} test(s) failed. Check GPU health.\x1b[0m\n`;
    } else {
      output += `\x1b[32mAll tests passed successfully.\x1b[0m\n`;
    }

    return output;
  }

  /**
   * Handle discovery command
   */
  private handleDiscovery(parsed: ParsedCommand, context: CommandContext): CommandResult {
    const node = this.getNode(context);
    if (!node) {
      return this.createError('Unable to determine current node');
    }

    // Check for -l or --list flag
    if (this.hasAnyFlag(parsed, ['l', 'list'])) {
      let output = `${node.gpus.length} GPU(s) found.\n`;
      node.gpus.forEach((gpu, idx) => {
        output += `\nGPU ${idx}: ${gpu.uuid}\n`;
        output += `  Device Information:\n`;
        output += `    UUID:        ${gpu.uuid}\n`;
        output += `    PCI Bus ID:  ${gpu.pciAddress}\n`;
        output += `    Device Name: ${gpu.name}\n`;
      });
      return this.createSuccess(output);
    }

    // Default: just show count
    return this.createSuccess(`${node.gpus.length} GPU(s) found. Use -l for details.`);
  }

  /**
   * Handle diag command
   */
  private handleDiag(parsed: ParsedCommand, context: CommandContext): CommandResult {
    const node = this.getNode(context);
    if (!node) {
      return this.createError('Unable to determine current node');
    }

    // Get mode from -r or --mode flag
    const mode = this.getFlagNumber(parsed, ['r', 'mode'], 1);

    if (mode < 1 || mode > 3) {
      return this.createError('mode must be 1 (short), 2 (medium), or 3 (long)');
    }

    // Check if specific GPU was requested
    const gpuId = this.getFlagString(parsed, ['i', 'gpu-id']);
    const gpus = gpuId ? [node.gpus[parseInt(gpuId)]] : node.gpus;

    if (!gpus || gpus.length === 0 || !gpus[0]) {
      return this.createError(`GPU ${gpuId} not found`);
    }

    // Check if any GPU has critical XID errors (XID 79: fallen off bus)
    const criticalXidGpus = gpus.filter(gpu =>
      gpu.xidErrors.some(xid => xid.code === 79)
    );

    if (criticalXidGpus.length > 0) {
      const gpuIdList = criticalXidGpus.map(g => g.id).join(', ');
      return this.createError(
        `Error: Unable to run diagnostics on GPU(s): ${gpuIdList}\n` +
        `GPU has fallen off the bus (XID 79).\n` +
        `This indicates a severe PCIe communication failure.\n\n` +
        `The GPU is not accessible and cannot be tested.\n` +
        `Possible causes:\n` +
        `  - PCIe slot failure\n` +
        `  - GPU hardware failure\n` +
        `  - Power delivery issue\n` +
        `  - System board defect\n\n` +
        `Recommended actions:\n` +
        `  1. System reboot may restore GPU access\n` +
        `  2. If error persists, reseat GPU in PCIe slot\n` +
        `  3. If reseating fails, GPU or motherboard RMA may be required\n` +
        `  4. Check 'dmesg | grep -i xid' for additional details`
      );
    }

    const output = `Running level ${mode} diagnostic...\n` +
                  this.simulateDiagnostic(mode, gpus);
    return this.createSuccess(output);
  }

  /**
   * Handle health command
   */
  private handleHealth(parsed: ParsedCommand, context: CommandContext): CommandResult {
    const node = this.getNode(context);
    if (!node) {
      return this.createError('Unable to determine current node');
    }

    // Check for -c or --check flag
    if (!this.hasAnyFlag(parsed, ['c', 'check'])) {
      return this.createError('Missing required flag: -c/--check');
    }

    let output = `Health monitoring:\n`;
    node.gpus.forEach((gpu, idx) => {
      const health = gpu.healthStatus;
      const symbol = health === 'OK' ? '✓' : health === 'Warning' ? '⚠' : '✗';
      const color = health === 'OK' ? '\x1b[32m' : health === 'Warning' ? '\x1b[33m' : '\x1b[31m';
      output += `\n  GPU ${idx}: ${color}${symbol} ${health}\x1b[0m\n`;

      if (gpu.xidErrors.length > 0) {
        output += `    XID Errors: ${gpu.xidErrors.length}\n`;
      }
      if (gpu.eccErrors.doubleBit > 0) {
        output += `    ECC Errors: ${gpu.eccErrors.doubleBit} uncorrectable\n`;
      }
      if (gpu.temperature > 80) {
        output += `    Temperature: ${Math.round(gpu.temperature)}°C (HIGH)\n`;
      }
    });
    return this.createSuccess(output);
  }

  /**
   * Handle group command
   */
  private handleGroup(parsed: ParsedCommand, _context: CommandContext): CommandResult {
    // Check for -l or --list flag
    if (this.hasAnyFlag(parsed, ['l', 'list'])) {
      return this.createSuccess('No groups configured.\nUse "dcgmi group -c <name>" to create a group.');
    }

    // Check for -c or --create flag
    if (this.hasAnyFlag(parsed, ['c', 'create'])) {
      const name = this.getFlagString(parsed, ['c', 'create'], 'default-group');
      return this.createSuccess(`Successfully created group "${name}" with group ID 0.`);
    }

    return this.createError('Missing required flag: -l/--list or -c/--create\nRun "dcgmi group --help" for usage.');
  }

  /**
   * Handle stats command
   */
  private handleStats(_parsed: ParsedCommand, _context: CommandContext): CommandResult {
    return this.createSuccess('DCGM stats collection not yet configured.\nUse "dcgmi stats -g <group> -e" to enable.');
  }

  /**
   * Handle policy command
   */
  private handlePolicy(_parsed: ParsedCommand, _context: CommandContext): CommandResult {
    return this.createSuccess('DCGM policy management.\nUse "dcgmi policy -g <group> -e <mask>" to set health policies.');
  }
}
