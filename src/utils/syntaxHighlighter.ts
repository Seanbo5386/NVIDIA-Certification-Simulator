/**
 * Syntax Highlighter for Terminal Output
 * Provides ANSI color-coded syntax highlighting for commands and output
 */

/**
 * ANSI escape codes for colors
 */
export const ANSI = {
  // Reset
  reset: '\x1b[0m',

  // Styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright foreground colors
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

/**
 * Syntax highlighting configuration
 */
export interface SyntaxHighlightConfig {
  commands: boolean;
  flags: boolean;
  paths: boolean;
  numbers: boolean;
  strings: boolean;
  ipAddresses: boolean;
  uuids: boolean;
  hexValues: boolean;
  keywords: boolean;
  errors: boolean;
  warnings: boolean;
  success: boolean;
}

/**
 * Default syntax highlighting configuration
 */
export const DEFAULT_HIGHLIGHT_CONFIG: SyntaxHighlightConfig = {
  commands: true,
  flags: true,
  paths: true,
  numbers: true,
  strings: true,
  ipAddresses: true,
  uuids: true,
  hexValues: true,
  keywords: true,
  errors: true,
  warnings: true,
  success: true,
};

/**
 * Known commands for highlighting
 */
const KNOWN_COMMANDS = new Set([
  'nvidia-smi',
  'dcgmi',
  'nvsm',
  'ipmitool',
  'ibstat',
  'ibportstate',
  'iblinkinfo',
  'perfquery',
  'ibdiagnet',
  'mlxconfig',
  'mlxlink',
  'mlxcables',
  'mlxup',
  'mst',
  'sinfo',
  'squeue',
  'scontrol',
  'sbatch',
  'srun',
  'scancel',
  'sacct',
  'docker',
  'ngc',
  'enroot',
  'bcm',
  'bcm-node',
  'systemctl',
  'journalctl',
  'lscpu',
  'free',
  'lspci',
  'dmidecode',
  'dmesg',
  'df',
  'mount',
  'ls',
  'cat',
  'grep',
  'cd',
  'pwd',
  'hpl',
  'nccl-test',
  'gpu-burn',
  'nvlink-audit',
  'mlxfwmanager',
  'hostnamectl',
  'timedatectl',
]);

/**
 * Keywords that indicate status or importance
 */
const STATUS_KEYWORDS = {
  success: ['ok', 'passed', 'success', 'successful', 'complete', 'completed', 'ready', 'active', 'running', 'up', 'enabled', 'healthy', 'good'],
  error: ['error', 'failed', 'failure', 'fatal', 'critical', 'down', 'disabled', 'unhealthy', 'bad', 'xid', 'fault'],
  warning: ['warning', 'warn', 'deprecated', 'degraded', 'pending', 'unknown', 'caution'],
};

/**
 * Regular expressions for syntax elements
 */
const PATTERNS = {
  // Command flags: -f, --flag, --flag=value
  flag: /(?:^|\s)(--?[a-zA-Z][\w-]*(?:=\S+)?)/g,

  // File paths: /path/to/file or ./relative/path
  path: /(?:^|\s)((?:\/|\.\/|~\/)[^\s]+)/g,

  // Numbers with optional units: 123, 45.67, 100GB, 50%
  number: /\b(\d+(?:\.\d+)?(?:[KMGT]i?[Bb]|%|ms|s|MHz|GHz|W|C)?)\b/g,

  // Quoted strings
  singleQuotedString: /'([^']+)'/g,
  doubleQuotedString: /"([^"]+)"/g,

  // IP addresses (IPv4)
  ipv4: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?)\b/g,

  // UUIDs
  uuid: /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi,

  // Hex values: 0x1234, 0xABCD
  hex: /\b(0x[0-9a-fA-F]+)\b/g,

  // GPU IDs: GPU 0, GPU-UUID
  gpuId: /\b(GPU[- ]?\d+|GPU-[a-fA-F0-9-]+)\b/g,

  // PCI addresses: 0000:af:00.0
  pciAddress: /\b([0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.\d)\b/gi,

  // Temperature values: 45C, 67°C
  temperature: /\b(\d+(?:\.\d+)?°?C)\b/g,

  // Power values: 250W, 300 W
  power: /\b(\d+(?:\.\d+)?\s?W)\b/g,

  // Memory sizes: 40GB, 512 MB
  memory: /\b(\d+(?:\.\d+)?\s?[KMGT]i?[Bb])\b/g,
};

/**
 * Highlight a command string (input line)
 */
export function highlightCommand(input: string, config: Partial<SyntaxHighlightConfig> = {}): string {
  const cfg = { ...DEFAULT_HIGHLIGHT_CONFIG, ...config };
  let result = input;

  // Split into parts to handle command specially
  const parts = input.trim().split(/\s+/);
  if (parts.length === 0) return input;

  const command = parts[0];
  const args = parts.slice(1).join(' ');

  // Highlight the command if known
  if (cfg.commands && KNOWN_COMMANDS.has(command)) {
    result = `${ANSI.brightCyan}${command}${ANSI.reset}`;
    if (args) {
      result += ' ' + highlightArguments(args, cfg);
    }
  } else {
    result = highlightArguments(input, cfg);
  }

  return result;
}

/**
 * Highlight command arguments
 */
function highlightArguments(args: string, config: SyntaxHighlightConfig): string {
  let result = args;

  // Highlight flags
  if (config.flags) {
    result = result.replace(PATTERNS.flag, (match, flag) => {
      const prefix = match.startsWith(' ') ? ' ' : '';
      return `${prefix}${ANSI.yellow}${flag}${ANSI.reset}`;
    });
  }

  // Highlight paths
  if (config.paths) {
    result = result.replace(PATTERNS.path, (match, path) => {
      const prefix = match.startsWith(' ') ? ' ' : '';
      return `${prefix}${ANSI.blue}${path}${ANSI.reset}`;
    });
  }

  // Highlight quoted strings
  if (config.strings) {
    result = result.replace(PATTERNS.singleQuotedString, `${ANSI.green}'$1'${ANSI.reset}`);
    result = result.replace(PATTERNS.doubleQuotedString, `${ANSI.green}"$1"${ANSI.reset}`);
  }

  return result;
}

/**
 * Highlight command output
 */
export function highlightOutput(output: string, config: Partial<SyntaxHighlightConfig> = {}): string {
  const cfg = { ...DEFAULT_HIGHLIGHT_CONFIG, ...config };
  let result = output;

  // Skip if output already contains ANSI codes
  if (output.includes('\x1b[')) {
    return output;
  }

  // Highlight status keywords first (line by line to preserve context)
  const lines = result.split('\n');
  result = lines.map(line => highlightLine(line, cfg)).join('\n');

  return result;
}

/**
 * Highlight a single line of output
 */
function highlightLine(line: string, config: SyntaxHighlightConfig): string {
  let result = line;
  const lowerLine = line.toLowerCase();

  // Check for error patterns
  if (config.errors) {
    const hasError = STATUS_KEYWORDS.error.some(keyword =>
      lowerLine.includes(keyword.toLowerCase())
    );
    if (hasError) {
      // Highlight error keywords
      STATUS_KEYWORDS.error.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        result = result.replace(regex, `${ANSI.red}${ANSI.bold}$1${ANSI.reset}`);
      });
    }
  }

  // Check for warning patterns
  if (config.warnings) {
    const hasWarning = STATUS_KEYWORDS.warning.some(keyword =>
      lowerLine.includes(keyword.toLowerCase())
    );
    if (hasWarning) {
      STATUS_KEYWORDS.warning.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        result = result.replace(regex, `${ANSI.yellow}${ANSI.bold}$1${ANSI.reset}`);
      });
    }
  }

  // Check for success patterns
  if (config.success) {
    const hasSuccess = STATUS_KEYWORDS.success.some(keyword =>
      lowerLine.includes(keyword.toLowerCase())
    );
    if (hasSuccess) {
      STATUS_KEYWORDS.success.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        result = result.replace(regex, `${ANSI.green}${ANSI.bold}$1${ANSI.reset}`);
      });
    }
  }

  // Highlight numeric values
  if (config.numbers) {
    // GPU IDs
    result = result.replace(PATTERNS.gpuId, `${ANSI.cyan}$1${ANSI.reset}`);

    // PCI addresses
    result = result.replace(PATTERNS.pciAddress, `${ANSI.magenta}$1${ANSI.reset}`);

    // Temperature
    result = result.replace(PATTERNS.temperature, `${ANSI.yellow}$1${ANSI.reset}`);

    // Power
    result = result.replace(PATTERNS.power, `${ANSI.brightYellow}$1${ANSI.reset}`);

    // Memory
    result = result.replace(PATTERNS.memory, `${ANSI.brightBlue}$1${ANSI.reset}`);
  }

  // Highlight IP addresses
  if (config.ipAddresses) {
    result = result.replace(PATTERNS.ipv4, `${ANSI.cyan}$1${ANSI.reset}`);
  }

  // Highlight UUIDs
  if (config.uuids) {
    result = result.replace(PATTERNS.uuid, `${ANSI.dim}$1${ANSI.reset}`);
  }

  // Highlight hex values
  if (config.hexValues) {
    result = result.replace(PATTERNS.hex, `${ANSI.magenta}$1${ANSI.reset}`);
  }

  return result;
}

/**
 * Highlight table-formatted output
 * Adds colors to table headers and separators
 */
export function highlightTable(table: string, headerColor: string = ANSI.bold): string {
  if (!table) return table;

  const lines = table.split('\n');
  if (lines.length === 0) return table;

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect header lines (usually first line or lines with dashes)
    if (i === 0 || line.match(/^[+\-=|]+$/)) {
      result.push(`${headerColor}${line}${ANSI.reset}`);
    } else if (line.includes('|') && i <= 2) {
      // Table headers (usually within first few lines with |)
      result.push(`${headerColor}${line}${ANSI.reset}`);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Highlight key-value pairs in output
 * Format: "Key: Value" or "Key = Value"
 */
export function highlightKeyValue(text: string): string {
  // Pattern: Key: Value
  let result = text.replace(
    /^(\s*)([A-Za-z][\w\s-]+?)(\s*:\s*)(.+)$/gm,
    `$1${ANSI.cyan}$2${ANSI.reset}$3$4`
  );

  // Pattern: Key = Value
  result = result.replace(
    /^(\s*)([A-Za-z][\w\s-]+?)(\s*=\s*)(.+)$/gm,
    `$1${ANSI.cyan}$2${ANSI.reset}$3$4`
  );

  return result;
}

/**
 * Highlight nvidia-smi output specifically
 */
export function highlightNvidiaSmi(output: string): string {
  let result = output;

  // Skip if already has ANSI codes
  if (output.includes('\x1b[')) {
    return output;
  }

  // Highlight GPU index
  result = result.replace(/\|\s*(\d+)\s+/g, `| ${ANSI.cyan}$1${ANSI.reset}  `);

  // Highlight temperature (with or without trailing space)
  result = result.replace(/(\d+)C(\s|$)/g, `${ANSI.yellow}$1C${ANSI.reset}$2`);

  // Highlight power usage
  result = result.replace(/(\d+)W\s*\/\s*(\d+)W/g,
    `${ANSI.brightYellow}$1W${ANSI.reset} / ${ANSI.dim}$2W${ANSI.reset}`);

  // Highlight memory usage
  result = result.replace(/(\d+)MiB\s*\/\s*(\d+)MiB/g,
    `${ANSI.brightBlue}$1MiB${ANSI.reset} / ${ANSI.dim}$2MiB${ANSI.reset}`);

  // Highlight utilization percentages
  result = result.replace(/(\d+)%/g, match => {
    const percent = parseInt(match);
    if (percent >= 80) {
      return `${ANSI.green}${match}${ANSI.reset}`;
    } else if (percent >= 50) {
      return `${ANSI.yellow}${match}${ANSI.reset}`;
    } else {
      return `${ANSI.dim}${match}${ANSI.reset}`;
    }
  });

  // Highlight "On" and "Off" states
  result = result.replace(/\bOn\b/g, `${ANSI.green}On${ANSI.reset}`);
  result = result.replace(/\bOff\b/g, `${ANSI.dim}Off${ANSI.reset}`);

  return result;
}

/**
 * Highlight dcgmi output specifically
 */
export function highlightDcgmi(output: string): string {
  let result = output;

  // Skip if already has ANSI codes
  if (output.includes('\x1b[')) {
    return output;
  }

  // Highlight status values
  result = result.replace(/\bHealthy\b/gi, `${ANSI.green}Healthy${ANSI.reset}`);
  result = result.replace(/\bWarning\b/gi, `${ANSI.yellow}Warning${ANSI.reset}`);
  result = result.replace(/\bFailure\b/gi, `${ANSI.red}Failure${ANSI.reset}`);

  // Highlight pass/fail
  result = result.replace(/\bPASS\b/g, `${ANSI.green}${ANSI.bold}PASS${ANSI.reset}`);
  result = result.replace(/\bFAIL\b/g, `${ANSI.red}${ANSI.bold}FAIL${ANSI.reset}`);
  result = result.replace(/\bSKIP\b/g, `${ANSI.yellow}SKIP${ANSI.reset}`);

  // Highlight GPU IDs
  result = result.replace(/GPU ID:\s*(\d+)/gi, `GPU ID: ${ANSI.cyan}$1${ANSI.reset}`);

  return result;
}

/**
 * Highlight InfiniBand output
 */
export function highlightInfiniBand(output: string): string {
  let result = output;

  // Skip if already has ANSI codes
  if (output.includes('\x1b[')) {
    return output;
  }

  // Highlight port states
  result = result.replace(/\bActive\b/g, `${ANSI.green}Active${ANSI.reset}`);
  result = result.replace(/\bDown\b/g, `${ANSI.red}Down${ANSI.reset}`);
  result = result.replace(/\bInit\b/g, `${ANSI.yellow}Init${ANSI.reset}`);
  result = result.replace(/\bPolling\b/g, `${ANSI.yellow}Polling${ANSI.reset}`);

  // Highlight link speeds
  result = result.replace(/(\d+)\s*(Gbps|GT\/s)/g, `${ANSI.cyan}$1 $2${ANSI.reset}`);

  // Highlight GUIDs
  result = result.replace(/(0x[0-9a-f]{16})/gi, `${ANSI.dim}$1${ANSI.reset}`);

  // Highlight LID values
  result = result.replace(/LID:\s*(\d+)/gi, `LID: ${ANSI.cyan}$1${ANSI.reset}`);

  return result;
}

/**
 * Create a syntax highlighting configuration
 */
export function createHighlightConfig(overrides: Partial<SyntaxHighlightConfig>): SyntaxHighlightConfig {
  return { ...DEFAULT_HIGHLIGHT_CONFIG, ...overrides };
}

/**
 * Disable all syntax highlighting
 */
export const NO_HIGHLIGHT_CONFIG: SyntaxHighlightConfig = {
  commands: false,
  flags: false,
  paths: false,
  numbers: false,
  strings: false,
  ipAddresses: false,
  uuids: false,
  hexValues: false,
  keywords: false,
  errors: false,
  warnings: false,
  success: false,
};

/**
 * Minimal syntax highlighting (errors, warnings, success only)
 */
export const MINIMAL_HIGHLIGHT_CONFIG: SyntaxHighlightConfig = {
  commands: false,
  flags: false,
  paths: false,
  numbers: false,
  strings: false,
  ipAddresses: false,
  uuids: false,
  hexValues: false,
  keywords: false,
  errors: true,
  warnings: true,
  success: true,
};

/**
 * Strip ANSI codes from text
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
