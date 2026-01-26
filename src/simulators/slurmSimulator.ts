import type { CommandResult, CommandContext } from '@/types/commands';
import type { ParsedCommand } from '@/utils/commandParser';
import { BaseSimulator, type SimulatorMetadata } from '@/simulators/BaseSimulator';
import { useSimulationStore } from '@/store/simulationStore';

interface SlurmJob {
  jobId: number;
  partition: string;
  name: string;
  user: string;
  state: 'RUNNING' | 'PENDING' | 'COMPLETED' | 'FAILED';
  time: string;
  nodes: number;
  nodelist: string;
}

/**
 * Slurm Simulator
 * 
 * Handles multiple Slurm commands: sinfo, squeue, scontrol, sbatch, srun, scancel, sacct
 * Each command is a separate entry point from Terminal.tsx.
 */
export class SlurmSimulator extends BaseSimulator {
  private jobs: SlurmJob[] = [];
  private nextJobId = 1000;
  private currentCommand = 'slurm';

  constructor() {
    super();
  }

  getMetadata(): SimulatorMetadata {
    return {
      name: this.currentCommand,
      version: '23.02.6',
      description: 'Slurm Workload Manager',
      commands: [],
    };
  }

  execute(_parsed: ParsedCommand, _context: CommandContext): CommandResult {
    return this.createError('Use specific Slurm commands: sinfo, squeue, scontrol, sbatch, srun, scancel, sacct');
  }

  /**
   * Generate sinfo --help output
   */
  private generateSinfoHelp(): string {
    let output = `Usage: sinfo [OPTIONS]\n`;
    output += `  -a, --all                  show all partitions\n`;
    output += `  -d, --dead                 show only non-responding nodes\n`;
    output += `  -e, --exact                group nodes only on exact match of configuration\n`;
    output += `  -h, --noheader             no headers on output\n`;
    output += `      --hide                 do not show hidden or non-accessible partitions\n`;
    output += `  -i, --iterate=seconds      specify an iteration period\n`;
    output += `  -l, --long                 long output - displays more information\n`;
    output += `  -M, --clusters=names       comma separated list of clusters\n`;
    output += `  -n, --nodes=nodes          report on specific node(s)\n`;
    output += `  -N, --Node                 Node-centric format\n`;
    output += `  -o, --format=format        format specification\n`;
    output += `  -O, --Format=format        long format specification\n`;
    output += `  -p, --partition=partition  report on specific partition(s)\n`;
    output += `  -r, --responding           report only responding nodes\n`;
    output += `  -R, --list-reasons         list reasons nodes are down or drained\n`;
    output += `  -s, --summarize            report state summary only\n`;
    output += `  -S, --sort=fields          comma separated list of fields to sort on\n`;
    output += `  -t, --states=states        report nodes in specific state(s)\n`;
    output += `  -T, --reservation          show reservation status\n`;
    output += `  -v, --verbose              verbosity level\n`;
    output += `  -V, --version              output version information and exit\n`;
    output += `\nHelp options:\n`;
    output += `      --help                 show this help message\n`;
    output += `      --usage                display brief usage message\n`;
    return output;
  }

  /**
   * Generate squeue --help output  
   */
  private generateSqueueHelp(): string {
    let output = `Usage: squeue [OPTIONS]\n`;
    output += `  -A, --account=account(s)   comma separated list of accounts\n`;
    output += `  -a, --all                  display all jobs in all partitions\n`;
    output += `  -h, --noheader             no headers on output\n`;
    output += `  -i, --iterate=seconds      specify an iteration period\n`;
    output += `  -j, --jobs=job_id(s)       comma separated list of jobs IDs\n`;
    output += `  -l, --long                 long report\n`;
    output += `  -M, --clusters=names       comma separated list of clusters\n`;
    output += `  -n, --name=name(s)         comma separated list of job names\n`;
    output += `  -o, --format=format        format specification\n`;
    output += `  -O, --Format=format        long format specification\n`;
    output += `  -p, --partition=partition  comma separated list of partitions\n`;
    output += `  -q, --qos=qos(s)           comma separated list of QOS\n`;
    output += `  -r, --array                display array job information\n`;
    output += `  -s, --steps                show steps only\n`;
    output += `  -S, --sort=fields          comma separated list of fields to sort on\n`;
    output += `  -t, --states=states        comma separated list of states\n`;
    output += `  -u, --user=user(s)         comma separated list of users\n`;
    output += `  -v, --verbose              verbosity level\n`;
    output += `  -V, --version              output version information and exit\n`;
    output += `  -w, --nodelist=nodes       node name(s)\n`;
    output += `\nHelp options:\n`;
    output += `      --help                 show this help message\n`;
    output += `      --usage                display brief usage message\n`;
    return output;
  }

  /**
   * Generate scontrol --help output
   */
  private generateScontrolHelp(): string {
    let output = `Usage: scontrol [OPTIONS] COMMAND [COMMAND OPTIONS]\n\n`;
    output += `COMMAND may be:\n`;
    output += `  show                     show information about slurm objects\n`;
    output += `  update                   update slurm objects\n`;
    output += `  create                   create slurm objects\n`;
    output += `  delete                   delete slurm objects\n`;
    output += `  ping                     ping slurm controllers\n`;
    output += `  reconfigure              reconfigure slurmctld\n`;
    output += `  shutdown                 shutdown slurmctld\n`;
    output += `  takeover                 take over as primary slurmctld\n`;
    output += `  setdebug                 set slurmctld debug level\n\n`;
    output += `Examples:\n`;
    output += `  scontrol show nodes\n`;
    output += `  scontrol show partition\n`;
    output += `  scontrol update NodeName=node01 State=DRAIN Reason="Maintenance"\n`;
    output += `\nHelp options:\n`;
    output += `      --help                 show this help message\n`;
    output += `  -V, --version              output version information and exit\n`;
    return output;
  }

  private getNode(context: CommandContext) {
    const state = useSimulationStore.getState();
    return state.cluster.nodes.find(n => n.id === context.currentNode);
  }

  private getAllNodes(_context: CommandContext) {
    const state = useSimulationStore.getState();
    return state.cluster.nodes;
  }

  // sinfo - Show partition and node information
  executeSinfo(parsed: ParsedCommand, _context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      return this.createSuccess(this.generateSinfoHelp());
    }

    // Handle --version / -V
    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    const nodes = useSimulationStore.getState().cluster.nodes;
    const detailed = this.hasAnyFlag(parsed, ['Nel', 'N', 'l', 'long', 'Node']);

    // Handle -R flag for node state reasons
    if (this.hasAnyFlag(parsed, ['R', 'list-reasons'])) {
      // Show reasons why nodes are unavailable
      const unavailableNodes = nodes.filter(n => n.slurmState === 'drain' || n.slurmState === 'down');

      if (unavailableNodes.length === 0) {
        // No unavailable nodes - return empty output (normal behavior)
        return { output: '', exitCode: 0 };
      }

      let output = 'REASON               USER      TIMESTAMP           NODELIST\n';
      unavailableNodes.forEach(node => {
        const reason = node.slurmReason || 'Not specified';
        const timestamp = new Date().toISOString().split('T')[0];
        output += `${reason.padEnd(20)} root      ${timestamp}         ${node.id}\n`;
      });

      return { output, exitCode: 0 };
    }

    // Handle custom output format with -o or --output-format
    const outputFormat = this.getFlagString(parsed, ['o', 'output-format']);
    if (outputFormat) {
      // Parse format string like "%n %G"
      let output = '';

      // Handle common format strings
      if (outputFormat.includes('%n') && outputFormat.includes('%G')) {
        // Show nodes and their GRES
        output = 'NODE                 GRES\n';
        nodes.forEach(node => {
          const gpuCount = node.gpus.length;
          const gres = gpuCount > 0 ? `gpu:h100:${gpuCount}` : '(null)';
          output += `${node.id.padEnd(20)} ${gres}\n`;
        });
      } else if (outputFormat.includes('%20n') && outputFormat.includes('%10G')) {
        // Show nodes and their GRES with specific column widths
        output = 'NODE                 GRES      \n';
        nodes.forEach(node => {
          const gpuCount = node.gpus.length;
          const gres = gpuCount > 0 ? `gpu:h100:${gpuCount}` : '(null)';
          output += `${node.id.padEnd(20)} ${gres.padEnd(10)}\n`;
        });
      } else {
        // Default format if we don't recognize it
        output = 'PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST\n';
        output += 'gpu       up     infinite   8      idle  dgx-00,dgx-01,dgx-02,dgx-03,dgx-04,dgx-05,dgx-06,dgx-07\n';
      }

      return { output, exitCode: 0 };
    }

    if (detailed) {
      // SOURCE OF TRUTH: Column widths for detailed output
      const COL_NODELIST = 16;
      const COL_NODES = 6;
      const COL_PARTITION = 16;
      const COL_STATE = 10;
      const COL_CPUS = 8;
      const COL_SCT = 7;
      const COL_MEMORY = 7;
      const COL_TMPDISK = 9;
      const COL_WEIGHT = 7;
      const COL_AVAILFE = 9;

      let output = 'NODELIST'.padEnd(COL_NODELIST) +
        'NODES'.padEnd(COL_NODES) +
        'PARTITION'.padEnd(COL_PARTITION) +
        'STATE'.padEnd(COL_STATE) +
        'CPUS'.padEnd(COL_CPUS) +
        'S:C:T'.padEnd(COL_SCT) +
        'MEMORY'.padEnd(COL_MEMORY) +
        'TMP_DISK'.padEnd(COL_TMPDISK) +
        'WEIGHT'.padEnd(COL_WEIGHT) +
        'AVAIL_FE'.padEnd(COL_AVAILFE) +
        'REASON\n';

      nodes.forEach(node => {
        const state = node.slurmState === 'idle' ? 'idle' :
          node.slurmState === 'alloc' ? 'allocated' :
            node.slurmState === 'drain' ? 'drained' : 'down';
        const cpus = node.cpuCount * 64;
        const memory = node.ramTotal * 1024;
        const reason = node.slurmReason || 'none';

        output += node.id.padEnd(COL_NODELIST) +
          '1'.padEnd(COL_NODES) +
          'gpu'.padEnd(COL_PARTITION) +
          state.padEnd(COL_STATE) +
          cpus.toString().padEnd(COL_CPUS) +
          '2:64:1'.padEnd(COL_SCT) +
          memory.toString().padEnd(COL_MEMORY) +
          '0'.padEnd(COL_TMPDISK) +
          '1'.padEnd(COL_WEIGHT) +
          '(null)'.padEnd(COL_AVAILFE) +
          reason + '\n';
      });

      return { output, exitCode: 0 };
    }

    // SOURCE OF TRUTH: Column widths for default output
    const COL_PARTITION = 10;
    const COL_AVAIL = 7;
    const COL_TIMELIMIT = 11;
    const COL_NODES = 7;
    const COL_STATE = 6;

    let output = 'PARTITION'.padEnd(COL_PARTITION) +
      'AVAIL'.padEnd(COL_AVAIL) +
      'TIMELIMIT'.padEnd(COL_TIMELIMIT) +
      'NODES'.padEnd(COL_NODES) +
      'STATE'.padEnd(COL_STATE) +
      'NODELIST\n';

    const idleNodes = nodes.filter(n => n.slurmState === 'idle');
    const allocNodes = nodes.filter(n => n.slurmState === 'alloc');
    const drainNodes = nodes.filter(n => n.slurmState === 'drain');

    if (idleNodes.length > 0) {
      const nodelist = idleNodes.map(n => n.id).join(',');
      output += 'gpu'.padEnd(COL_PARTITION) +
        'up'.padEnd(COL_AVAIL) +
        'infinite'.padEnd(COL_TIMELIMIT) +
        idleNodes.length.toString().padEnd(COL_NODES) +
        'idle'.padEnd(COL_STATE) +
        nodelist + '\n';
    }

    if (allocNodes.length > 0) {
      const nodelist = allocNodes.map(n => n.id).join(',');
      output += 'gpu'.padEnd(COL_PARTITION) +
        'up'.padEnd(COL_AVAIL) +
        'infinite'.padEnd(COL_TIMELIMIT) +
        allocNodes.length.toString().padEnd(COL_NODES) +
        'alloc'.padEnd(COL_STATE) +
        nodelist + '\n';
    }

    if (drainNodes.length > 0) {
      const nodelist = drainNodes.map(n => n.id).join(',');
      output += 'gpu'.padEnd(COL_PARTITION) +
        'up'.padEnd(COL_AVAIL) +
        'infinite'.padEnd(COL_TIMELIMIT) +
        drainNodes.length.toString().padEnd(COL_NODES) +
        'drain'.padEnd(COL_STATE) +
        nodelist + '\n';
    }

    return { output, exitCode: 0 };
  }

  // squeue - Show job queue
  executeSqueue(parsed: ParsedCommand, _context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      return this.createSuccess(this.generateSqueueHelp());
    }

    // Handle --version / -V
    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    // SOURCE OF TRUTH: Column widths
    const COL_JOBID = 6;
    const COL_PARTITION = 13;
    const COL_NAME = 9;
    const COL_USER = 9;
    const COL_ST = 3;
    const COL_TIME = 11;
    const COL_NODES = 6;

    const user = this.getFlagString(parsed, ['u', 'user']);

    let filteredJobs = this.jobs;
    if (user) {
      filteredJobs = this.jobs.filter(j => j.user === user);
    }

    let output = 'JOBID'.padEnd(COL_JOBID) +
      'PARTITION'.padEnd(COL_PARTITION) +
      'NAME'.padEnd(COL_NAME) +
      'USER'.padEnd(COL_USER) +
      'ST'.padEnd(COL_ST) +
      'TIME'.padEnd(COL_TIME) +
      'NODES'.padEnd(COL_NODES) +
      'NODELIST(REASON)\n';

    if (filteredJobs.length === 0) {
      return { output, exitCode: 0 };
    }

    filteredJobs.forEach(job => {
      const state = job.state === 'RUNNING' ? 'R' :
        job.state === 'PENDING' ? 'PD' :
          job.state === 'COMPLETED' ? 'CD' : 'F';

      output += job.jobId.toString().padEnd(COL_JOBID) +
        job.partition.padEnd(COL_PARTITION) +
        job.name.padEnd(COL_NAME) +
        job.user.padEnd(COL_USER) +
        state.padEnd(COL_ST) +
        job.time.padEnd(COL_TIME) +
        job.nodes.toString().padEnd(COL_NODES) +
        job.nodelist + '\n';
    });

    return { output, exitCode: 0 };
  }

  // scontrol - Show/modify node and job information
  executeScontrol(parsed: ParsedCommand, context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      return this.createSuccess(this.generateScontrolHelp());
    }

    // Handle --version / -V
    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    const command = parsed.subcommands[0];

    if (command === 'show') {
      const what = parsed.subcommands[1];

      if (what === 'nodes' || what === 'node') {
        const nodes = this.getAllNodes(context);
        let output = '';

        nodes.forEach((node, idx) => {
          if (idx > 0) output += '\n';

          output += `NodeName=${node.id} Arch=x86_64 CoresPerSocket=64\n`;
          output += `   CPUAlloc=0 CPUTot=${node.cpuCount * 64} CPULoad=0.50\n`;
          output += `   AvailableFeatures=(null)\n`;
          output += `   ActiveFeatures=(null)\n`;
          output += `   Gres=gpu:${node.gpus.length}\n`;
          output += `   NodeAddr=${node.id} NodeHostName=${node.hostname}\n`;
          output += `   Version=23.02.6\n`;
          output += `   OS=Linux 5.15.0-91-generic #101-Ubuntu SMP\n`;
          output += `   RealMemory=${node.ramTotal * 1024} AllocMem=0 FreeMem=${(node.ramTotal - node.ramUsed) * 1024}\n`;
          output += `   Sockets=${node.cpuCount} Boards=1\n`;
          output += `   State=${node.slurmState.toUpperCase()} ThreadsPerCore=1 TmpDisk=0 Weight=1 Owner=N/A MCS_label=N/A\n`;
          output += `   Partitions=gpu\n`;
          output += `   BootTime=2024-01-10T08:00:00 SlurmdStartTime=2024-01-10T08:05:00\n`;
          output += `   CurrentWatts=0 AveWatts=0\n`;
          output += `   ExtSensorsJoules=n/s ExtSensorsWatts=0 ExtSensorsTemp=n/s\n`;

          if (node.slurmReason) {
            output += `   Reason=${node.slurmReason} [root@2024-01-11T10:00:00]\n`;
          }
        });

        return { output, exitCode: 0 };
      }

      if (what === 'partition' || what === 'partitions') {
        let output = 'PartitionName=gpu\n';
        output += '   AllowGroups=ALL AllowAccounts=ALL AllowQos=ALL\n';
        output += '   AllocNodes=ALL Default=YES QoS=N/A\n';
        output += '   DefaultTime=NONE DisableRootJobs=NO ExclusiveUser=NO GraceTime=0 Hidden=NO\n';
        output += '   MaxNodes=UNLIMITED MaxTime=UNLIMITED MinNodes=0 LLN=NO MaxCPUsPerNode=UNLIMITED\n';
        output += '   Nodes=dgx-[00-07]\n';
        output += '   PriorityJobFactor=1 PriorityTier=1 RootOnly=NO ReqResv=NO OverSubscribe=NO\n';
        output += '   OverTimeLimit=NONE PreemptMode=OFF\n';
        output += '   State=UP TotalCPUs=4096 TotalNodes=8 SelectTypeParameters=NONE\n';
        output += '   DefMemPerCPU=1024 MaxMemPerCPU=UNLIMITED\n';

        return { output, exitCode: 0 };
      }
    }

    if (command === 'update') {
      // Find NodeName= in positional args or subcommands
      const nodeArg = parsed.positionalArgs.find(a => a.startsWith('NodeName='));
      const stateArg = parsed.positionalArgs.find(a => a.startsWith('State='));
      const reasonArg = parsed.positionalArgs.find(a => a.startsWith('Reason='));

      if (!nodeArg) {
        return this.createError('Error: NodeName not specified');
      }

      const nodeName = nodeArg.split('=')[1];
      const state = stateArg ? stateArg.split('=')[1].toLowerCase() : null;
      const reason = reasonArg ? reasonArg.split('=')[1].replace(/"/g, '') : undefined;

      const validStates = ['idle', 'drain', 'resume', 'down'];
      if (state && !validStates.includes(state)) {
        return this.createError(`Error: Invalid state "${state}". Valid: ${validStates.join(', ')}`);
      }

      const simState = useSimulationStore.getState();
      const nodes = simState.cluster.nodes;
      const node = nodes.find(n => n.id === nodeName);

      if (!node) {
        return this.createError(`Error: Node ${nodeName} not found`);
      }

      if (state) {
        const newState = state === 'resume' ? 'idle' : state;
        simState.setSlurmState(nodeName, newState as any, reason);
      }

      return this.createSuccess(`Node ${nodeName} updated successfully`);
    }

    return this.createError('Usage: scontrol <show|update> <nodes|node|partition> [options]');
  }

  // sbatch - Submit batch job
  executeSbatch(parsed: ParsedCommand, _context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      let output = `Usage: sbatch [OPTIONS] script [args...]\n`;
      output += `  -N, --nodes=N              number of nodes to use\n`;
      output += `  -n, --ntasks=N             number of tasks to run\n`;
      output += `  -c, --cpus-per-task=N      number of CPUs per task\n`;
      output += `  -t, --time=TIME            time limit\n`;
      output += `  -p, --partition=PARTITION  partition to submit to\n`;
      output += `  -o, --output=FILE          output file\n`;
      output += `  -e, --error=FILE           error file\n`;
      output += `  -J, --job-name=NAME        job name\n`;
      output += `      --gres=GRES            generic resources\n`;
      output += `  -V, --version              output version and exit\n`;
      output += `      --help                 show this help\n`;
      return this.createSuccess(output);
    }

    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    if (parsed.positionalArgs.length === 0 && parsed.subcommands.length === 0) {
      return this.createError('Error: Batch script not specified');
    }

    const scriptPath = parsed.positionalArgs[0] || parsed.subcommands[0];
    const jobId = this.nextJobId++;

    const job: SlurmJob = {
      jobId,
      partition: 'gpu',
      name: scriptPath.split('/').pop()?.replace('.sh', '') || 'job',
      user: 'root',
      state: 'PENDING',
      time: '0:00',
      nodes: 1,
      nodelist: '(Resources)',
    };

    this.jobs.push(job);

    // Parse GPU count from gres or gpus flag
    const gresValue = this.getFlagString(parsed, ['gres']);
    let gpuCount = 1;
    if (gresValue && gresValue.includes('gpu:')) {
      const match = gresValue.match(/gpu:(\d+)/);
      if (match) gpuCount = parseInt(match[1]);
    }
    const gpusFlagValue = this.getFlagNumber(parsed, ['gpus'], 0);
    if (gpusFlagValue > 0) gpuCount = gpusFlagValue;

    setTimeout(() => {
      job.state = 'RUNNING';
      const state = useSimulationStore.getState();
      const nodes = state.cluster.nodes;
      const availableNode = nodes.find(n => n.slurmState === 'idle');
      if (availableNode) {
        job.nodelist = availableNode.id;

        // Allocate GPUs with utilization update (cross-tool sync)
        const gpuIds = availableNode.gpus.slice(0, gpuCount).map(g => g.id);
        state.allocateGPUsForJob(availableNode.id, gpuIds, job.jobId, 85);
        state.setSlurmState(availableNode.id, 'alloc');
      }
    }, 100);

    return this.createSuccess(`Submitted batch job ${jobId}`);
  }

  // srun - Run job interactively
  executeSrun(parsed: ParsedCommand, context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      let output = `Usage: srun [OPTIONS] command [args...]\n`;
      output += `  -N, --nodes=N              number of nodes\n`;
      output += `  -n, --ntasks=N             number of tasks\n`;
      output += `  -c, --cpus-per-task=N      CPUs per task\n`;
      output += `  -t, --time=TIME            time limit\n`;
      output += `  -p, --partition=PARTITION  partition\n`;
      output += `      --gpus=N               number of GPUs\n`;
      output += `      --container-image=IMG  container image\n`;
      output += `  -V, --version              output version and exit\n`;
      output += `      --help                 show this help\n`;
      return this.createSuccess(output);
    }

    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    const gpuCount = this.getFlagNumber(parsed, ['gpus'], 1);
    const containerImage = this.getFlagString(parsed, ['container-image']);

    let output = '';

    if (containerImage) {
      output += `srun: Pulling container image ${containerImage}...\n`;
      output += `srun: Container ready\n`;
    }

    output += `srun: job ${this.nextJobId} queued and waiting for resources\n`;
    output += `srun: job ${this.nextJobId} has been allocated resources\n`;

    // Find command to run in positional args
    if (parsed.positionalArgs.length > 0) {
      const command = parsed.positionalArgs.join(' ');

      if (command === 'nvidia-smi' || command.includes('nvidia-smi')) {
        const node = this.getNode(context);
        if (node) {
          output += '\n';
          output += `Allocated ${gpuCount} GPU(s) from ${node.id}\n`;
          output += `GPU 0: ${node.gpus[0].name}\n`;
        }
      } else {
        output += `\nExecuting: ${command}\n`;
        output += `Job completed successfully\n`;
      }
    }

    this.nextJobId++;

    return { output, exitCode: 0 };
  }

  // scancel - Cancel job
  executeScancel(parsed: ParsedCommand, _context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      let output = `Usage: scancel [OPTIONS] [job_id[_array_id][.step_id]]\n`;
      output += `  -u, --user=user            cancel jobs of a specific user\n`;
      output += `  -A, --account=account      cancel jobs of a specific account\n`;
      output += `  -n, --name=name            cancel jobs with this name\n`;
      output += `  -p, --partition=partition  cancel jobs in this partition\n`;
      output += `  -t, --state=state          cancel jobs in this state\n`;
      output += `  -V, --version              output version and exit\n`;
      output += `      --help                 show this help\n`;
      return this.createSuccess(output);
    }

    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    if (parsed.positionalArgs.length === 0 && parsed.subcommands.length === 0) {
      return this.createError('Error: Job ID not specified');
    }

    const jobId = parseInt(parsed.positionalArgs[0] || parsed.subcommands[0]);
    const jobIdx = this.jobs.findIndex(j => j.jobId === jobId);

    if (jobIdx === -1) {
      return this.createError(`scancel: error: Kill job error on job id ${jobId}: Invalid job id specified`);
    }

    const job = this.jobs[jobIdx];

    if (job.state === 'RUNNING' && job.nodelist !== '(Resources)') {
      const state = useSimulationStore.getState();
      // Deallocate GPUs (cross-tool sync - resets utilization)
      state.deallocateGPUsForJob(job.jobId);
      state.setSlurmState(job.nodelist, 'idle');
    }

    this.jobs.splice(jobIdx, 1);

    return this.createSuccess(`scancel: Terminating job ${jobId}`);
  }

  // sacct - Job accounting
  executeSacct(parsed: ParsedCommand, _context: CommandContext): CommandResult {
    // Handle --help
    if (this.hasAnyFlag(parsed, ['help'])) {
      let output = `Usage: sacct [OPTIONS]\n`;
      output += `  -a, --allusers             display all users\n`;
      output += `  -j, --jobs=job_id(s)       comma separated list of jobs\n`;
      output += `  -n, --noheader             no header\n`;
      output += `  -o, --format=format        comma separated list of fields\n`;
      output += `  -S, --starttime=time       start time\n`;
      output += `  -E, --endtime=time         end time\n`;
      output += `  -u, --user=user(s)         comma separated list of users\n`;
      output += `  -V, --version              output version and exit\n`;
      output += `      --help                 show this help\n`;
      return this.createSuccess(output);
    }

    if (this.hasAnyFlag(parsed, ['version', 'V'])) {
      return this.createSuccess('slurm 23.02.6');
    }

    // SOURCE OF TRUTH: Column widths
    const COL_JOBID = 13;
    const COL_JOBNAME = 11;
    const COL_PARTITION = 11;
    const COL_ACCOUNT = 11;
    const COL_ALLOCCPUS = 11;
    const COL_STATE = 11;
    const COL_EXITCODE = 9;

    const jobId = this.getFlagNumber(parsed, ['j', 'jobs'], 0);

    let output = 'JobID'.padEnd(COL_JOBID) +
      'JobName'.padEnd(COL_JOBNAME) +
      'Partition'.padEnd(COL_PARTITION) +
      'Account'.padEnd(COL_ACCOUNT) +
      'AllocCPUS'.padEnd(COL_ALLOCCPUS) +
      'State'.padEnd(COL_STATE) +
      'ExitCode\n';

    output += '-'.repeat(COL_JOBID - 1) + ' ' +
      '-'.repeat(COL_JOBNAME - 1) + ' ' +
      '-'.repeat(COL_PARTITION - 1) + ' ' +
      '-'.repeat(COL_ACCOUNT - 1) + ' ' +
      '-'.repeat(COL_ALLOCCPUS - 1) + ' ' +
      '-'.repeat(COL_STATE - 1) + ' ' +
      '-'.repeat(COL_EXITCODE - 1) + '\n';

    const jobsToShow = jobId !== 0
      ? this.jobs.filter(j => j.jobId === jobId)
      : this.jobs.slice(-10);

    jobsToShow.forEach(job => {
      const exitCode = job.state === 'COMPLETED' ? '0:0' : job.state === 'FAILED' ? '1:0' : '';
      output += job.jobId.toString().padEnd(COL_JOBID) +
        job.name.padEnd(COL_JOBNAME) +
        job.partition.padEnd(COL_PARTITION) +
        'root'.padEnd(COL_ACCOUNT) +
        (job.nodes * 128).toString().padEnd(COL_ALLOCCPUS) +
        job.state.padEnd(COL_STATE) +
        exitCode + '\n';
    });

    return { output, exitCode: 0 };
  }
}
