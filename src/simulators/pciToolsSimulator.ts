import type { CommandResult, CommandContext, ParsedCommand, SimulatorMetadata } from '@/types/commands';
import { BaseSimulator } from './BaseSimulator';
import { useSimulationStore } from '@/store/simulationStore';

/**
 * PciToolsSimulator
 * Handles PCI device enumeration and system logs with fault state integration
 *
 * Special Features:
 * - Cross-tool fault propagation (reads GPU state from store)
 * - XID errors appear in lspci verbose output
 * - Thermal warnings in journalctl
 * - ECC errors in system logs
 *
 * Per spec Section 7: Cross-tool integration for diagnostics
 */
export class PciToolsSimulator extends BaseSimulator {
  getMetadata(): SimulatorMetadata {
    return {
      name: 'pci-tools',
      version: '1.0.0',
      description: 'PCI device enumeration and system logging tools',
      commands: [
        {
          name: 'lspci',
          description: 'List PCI devices with GPU/HCA detection and error state',
          usage: 'lspci [OPTIONS]',
          examples: ['lspci', 'lspci -v', 'lspci -vv', 'lspci -d 10de:'],
        },
        {
          name: 'journalctl',
          description: 'System logs with XID/thermal/ECC error tracking',
          usage: 'journalctl [OPTIONS]',
          examples: ['journalctl', 'journalctl -b', 'journalctl -k', 'journalctl -p err'],
        },
      ],
    };
  }

  execute(parsed: ParsedCommand, context: CommandContext): CommandResult {
    // Handle --version flag
    if (this.hasAnyFlag(parsed, ['version'])) {
      return this.handleVersion();
    }

    // Handle --help flag
    if (this.hasAnyFlag(parsed, ['help', 'h'])) {
      return this.handleHelp();
    }

    // Route to appropriate handler
    switch (parsed.baseCommand) {
      case 'lspci':
        return this.handleLspci(parsed, context);
      case 'journalctl':
        return this.handleJournalctl(parsed, context);
      default:
        return this.createError(`Unknown PCI tool: ${parsed.baseCommand}`);
    }
  }

  /**
   * Handle lspci command
   * Lists PCI devices with GPU fault state integration
   * Per spec Section 7.3: lspci output for GPU bus errors
   */
  private handleLspci(parsed: ParsedCommand, context: CommandContext): CommandResult {
    const cluster = useSimulationStore.getState().cluster;
    const node = cluster.nodes.find(n => n.id === context.currentNode) || cluster.nodes[0];

    if (!node) {
      return this.createSuccess('No PCI devices found');
    }

    // Check for verbose flag
    const verbose = this.hasAnyFlag(parsed, ['v', 'vv']);

    // Check for device filter (-d 10de: for NVIDIA devices)
    const nvidiaFilter = this.hasAnyFlag(parsed, ['d']) &&
                        (parsed.flags.get('d') === '10de' ||
                         parsed.flags.get('d') === '10de:' ||
                         parsed.positionalArgs.includes('10de') ||
                         parsed.positionalArgs.includes('10de:'));

    let output = '';

    // Generate GPU PCIe entries
    node.gpus.forEach((gpu, idx) => {
      const pciAddr = gpu.pciAddress || `0000:${(0x39 + idx).toString(16)}:00.0`;
      const deviceName = `NVIDIA Corporation ${gpu.name} [${gpu.type}]`;

      output += `${pciAddr} 3D controller: ${deviceName}\n`;

      if (verbose) {
        output += `\tSubsystem: NVIDIA Corporation Device 0x1234\n`;
        output += `\tControl: I/O- Mem+ BusMaster+ SpecCycle- MemWINV- VGASnoop- ParErr- Stepping- SERR+ FastB2B- DisINTx+\n`;
        output += `\tStatus: Cap+ 66MHz- UDF- FastB2B- ParErr+ DEVSEL=fast >TAbort- <TAbort- <MAbort- >SERR- <PERR- INTx-\n`;
        output += `\tLatency: 0, Cache Line Size: 64 bytes\n`;
        output += `\tInterrupt: pin A routed to IRQ ${16 + idx}\n`;
        output += `\tMemory at fc000000 (64-bit, prefetchable) [size=32M]\n`;

        // Add error annotations if XID errors exist - cross-tool fault propagation
        if (gpu.xidErrors && gpu.xidErrors.length > 0) {
          output += `\t\x1b[31m*** Device is in error state (XID ${gpu.xidErrors[gpu.xidErrors.length - 1].code}) ***\x1b[0m\n`;
        }

        // Add thermal warning
        if (gpu.temperature > 80) {
          output += `\t\x1b[33m*** Thermal throttling active (${gpu.temperature}C) ***\x1b[0m\n`;
        }

        output += '\n';
      }
    });

    // Add InfiniBand HCAs if not filtering for NVIDIA
    if (!nvidiaFilter) {
      node.hcas.forEach((hca, idx) => {
        const pciAddr = `0000:a${idx}:00.0`;
        output += `${pciAddr} InfiniBand: Mellanox Technologies ${hca.caType}\n`;
      });
    }

    return this.createSuccess(output);
  }

  /**
   * Handle journalctl command
   * System logs with GPU fault state integration
   * Per spec Section 7.1: journalctl kernel log simulation with fault state
   */
  private handleJournalctl(parsed: ParsedCommand, context: CommandContext): CommandResult {
    const cluster = useSimulationStore.getState().cluster;
    const node = cluster.nodes.find(n => n.id === context.currentNode) || cluster.nodes[0];

    if (!node) {
      return this.createError('No node found');
    }

    const now = new Date();
    let logs = `-- Logs begin at Mon 2024-01-15 08:00:00 UTC, end at ${now.toUTCString()} --\n`;
    logs += `Jan 15 08:00:01 ${node.hostname} systemd[1]: Starting Initialize hardware monitoring sensors...\n`;
    logs += `Jan 15 08:00:02 ${node.hostname} kernel: Linux version 5.15.0-91-generic\n`;
    logs += `Jan 15 08:00:03 ${node.hostname} kernel: NVIDIA driver loaded successfully\n`;
    logs += `Jan 15 08:00:05 ${node.hostname} systemd[1]: Started NVIDIA Persistence Daemon\n`;

    // Check for XID errors in GPU state - cross-tool fault propagation
    let hasErrors = false;

    node.gpus.forEach(gpu => {
      // Add XID error entries
      if (gpu.xidErrors && gpu.xidErrors.length > 0) {
        hasErrors = true;
        gpu.xidErrors.slice(-3).forEach(xid => {
          const timeStr = new Date(xid.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          logs += `${timeStr} ${node.hostname} kernel: NVRM: Xid (PCI:0000:${gpu.pciAddress}): ${xid.code}, ${xid.description}\n`;
        });
      }

      // Add thermal warnings
      if (gpu.temperature > 80) {
        hasErrors = true;
        const timeStr = now.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        logs += `${timeStr} ${node.hostname} kernel: NVRM: GPU at ${gpu.pciAddress}: temperature (${gpu.temperature}C) has reached slowdown threshold\n`;
      }

      // Add ECC errors
      if (gpu.eccErrors && (gpu.eccErrors.singleBit > 0 || gpu.eccErrors.doubleBit > 0)) {
        hasErrors = true;
        const timeStr = now.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        if (gpu.eccErrors.doubleBit > 0) {
          logs += `${timeStr} ${node.hostname} kernel: NVRM: GPU at ${gpu.pciAddress}: DOUBLE-BIT ECC error detected (count: ${gpu.eccErrors.doubleBit})\n`;
        }
        if (gpu.eccErrors.singleBit > 0) {
          logs += `${timeStr} ${node.hostname} kernel: NVRM: GPU at ${gpu.pciAddress}: single-bit ECC error corrected (count: ${gpu.eccErrors.singleBit})\n`;
        }
      }
    });

    if (!hasErrors) {
      logs += `Jan 15 08:00:06 ${node.hostname} systemd[1]: Reached target Multi-User System\n`;
      logs += `Jan 15 08:00:10 ${node.hostname} kernel: All GPUs initialized successfully\n`;
    }

    // Check for flags to filter output
    const showBoot = this.hasAnyFlag(parsed, ['b']);
    const showKernel = this.hasAnyFlag(parsed, ['k']);
    const showErrors = this.hasAnyFlag(parsed, ['p']) && parsed.positionalArgs.includes('err');
    const noArgs = parsed.subcommands.length === 0 && parsed.positionalArgs.length === 0 && parsed.flags.size === 0;

    if (showBoot || showKernel || noArgs) {
      return this.createSuccess(logs);
    }

    if (showErrors) {
      // Filter to errors only
      const errorLines = logs.split('\n').filter(line =>
        line.includes('NVRM:') || line.includes('error') || line.includes('Error') || line.includes('DOUBLE-BIT')
      );
      const output = errorLines.length > 0 ? errorLines.join('\n') : 'No errors found';
      return this.createSuccess(output);
    }

    return this.createError('Usage: journalctl [-b] [-k] [-p err]');
  }
}
