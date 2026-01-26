/**
 * Command Registry System
 *
 * Centralized command registration and routing system that decouples
 * Terminal.tsx from simulator implementations.
 *
 * Features:
 * - Command registration with metadata
 * - Alias resolution
 * - Category-based organization
 * - Dynamic help generation
 */

import type { BaseSimulator } from '@/simulators/BaseSimulator';

/**
 * Command category for organization
 */
export type CommandCategory =
  | 'nvidia'      // NVIDIA GPU tools (nvidia-smi, dcgmi, nvsm)
  | 'bmc'         // BMC/IPMI tools (ipmitool)
  | 'linux'       // Standard Linux commands (lscpu, lspci, etc.)
  | 'cluster'     // Cluster management (slurm, bcm)
  | 'container'   // Container tools (docker, ngc, enroot)
  | 'network'     // Network tools (InfiniBand, Mellanox)
  | 'diagnostic'  // Diagnostic tools
  | 'system'      // System commands (help, clear)
  | 'other';

/**
 * Command descriptor with metadata
 */
export interface CommandDescriptor {
  /** Primary command name */
  name: string;

  /** Alternative names (aliases) */
  aliases: string[];

  /** Command category */
  category: CommandCategory;

  /** Short description */
  description: string;

  /** Long description (for detailed help) */
  longDescription?: string;

  /** Simulator instance that handles this command */
  simulator: BaseSimulator;

  /** Usage examples */
  examples?: string[];

  /** Whether this command requires cluster state */
  requiresCluster?: boolean;

  /** Whether this command modifies cluster state */
  modifiesState?: boolean;
}

/**
 * Command registry singleton
 */
export class CommandRegistry {
  private static instance: CommandRegistry;

  /** Map of command names to descriptors */
  private commands: Map<string, CommandDescriptor> = new Map();

  /** Map of aliases to primary command names */
  private aliases: Map<string, string> = new Map();

  /** Map of categories to command names */
  private categories: Map<CommandCategory, Set<string>> = new Map();

  private constructor() {
    // Initialize categories
    const categories: CommandCategory[] = [
      'nvidia',
      'bmc',
      'linux',
      'cluster',
      'container',
      'network',
      'diagnostic',
      'system',
      'other',
    ];
    for (const category of categories) {
      this.categories.set(category, new Set());
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /**
   * Register a command with the registry
   * @param descriptor - Command descriptor
   * @throws Error if command name is already registered
   */
  register(descriptor: CommandDescriptor): void {
    // Check if primary name is already registered
    if (this.commands.has(descriptor.name)) {
      throw new Error(`Command '${descriptor.name}' is already registered`);
    }

    // Check if any alias conflicts with existing commands or aliases
    for (const alias of descriptor.aliases) {
      if (this.commands.has(alias)) {
        throw new Error(`Alias '${alias}' conflicts with existing command`);
      }
      if (this.aliases.has(alias)) {
        throw new Error(`Alias '${alias}' is already registered`);
      }
    }

    // Register command
    this.commands.set(descriptor.name, descriptor);

    // Register aliases
    for (const alias of descriptor.aliases) {
      this.aliases.set(alias, descriptor.name);
    }

    // Add to category
    const categorySet = this.categories.get(descriptor.category);
    if (categorySet) {
      categorySet.add(descriptor.name);
    }
  }

  /**
   * Register multiple commands at once
   * @param descriptors - Array of command descriptors
   */
  registerMany(descriptors: CommandDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.register(descriptor);
    }
  }

  /**
   * Resolve a command name (including aliases) to its descriptor
   * @param commandName - Command name or alias
   * @returns Command descriptor or undefined if not found
   */
  resolve(commandName: string): CommandDescriptor | undefined {
    // Try direct lookup first
    const direct = this.commands.get(commandName);
    if (direct) {
      return direct;
    }

    // Try alias lookup
    const primaryName = this.aliases.get(commandName);
    if (primaryName) {
      return this.commands.get(primaryName);
    }

    return undefined;
  }

  /**
   * Check if a command exists (including aliases)
   * @param commandName - Command name or alias
   * @returns true if command exists
   */
  has(commandName: string): boolean {
    return this.commands.has(commandName) || this.aliases.has(commandName);
  }

  /**
   * Get all registered commands
   * @returns Array of all command descriptors
   */
  getAllCommands(): CommandDescriptor[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   * @param category - Command category
   * @returns Array of command descriptors in that category
   */
  getCommandsByCategory(category: CommandCategory): CommandDescriptor[] {
    const commandNames = this.categories.get(category);
    if (!commandNames) {
      return [];
    }

    return Array.from(commandNames)
      .map(name => this.commands.get(name))
      .filter((cmd): cmd is CommandDescriptor => cmd !== undefined);
  }

  /**
   * Get all categories
   * @returns Array of all command categories
   */
  getAllCategories(): CommandCategory[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Unregister a command
   * @param commandName - Command name to unregister
   * @returns true if command was unregistered
   */
  unregister(commandName: string): boolean {
    const descriptor = this.commands.get(commandName);
    if (!descriptor) {
      return false;
    }

    // Remove from commands map
    this.commands.delete(commandName);

    // Remove aliases
    for (const alias of descriptor.aliases) {
      this.aliases.delete(alias);
    }

    // Remove from category
    const categorySet = this.categories.get(descriptor.category);
    if (categorySet) {
      categorySet.delete(commandName);
    }

    return true;
  }

  /**
   * Clear all registered commands
   */
  clear(): void {
    this.commands.clear();
    this.aliases.clear();
    for (const categorySet of this.categories.values()) {
      categorySet.clear();
    }
  }

  /**
   * Get registry statistics
   * @returns Statistics object
   */
  getStats(): {
    totalCommands: number;
    totalAliases: number;
    commandsByCategory: Record<CommandCategory, number>;
  } {
    const commandsByCategory: Record<CommandCategory, number> = {} as any;

    for (const [category, commands] of this.categories.entries()) {
      commandsByCategory[category] = commands.size;
    }

    return {
      totalCommands: this.commands.size,
      totalAliases: this.aliases.size,
      commandsByCategory,
    };
  }

  /**
   * Generate help text for all commands
   * @returns Formatted help text
   */
  generateHelp(): string {
    let output = '\x1b[33mAvailable commands:\x1b[0m\n\n';

    const categories: CommandCategory[] = [
      'nvidia',
      'bmc',
      'cluster',
      'container',
      'network',
      'linux',
      'system',
    ];

    for (const category of categories) {
      const commands = this.getCommandsByCategory(category);
      if (commands.length === 0) continue;

      // Category header
      const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      output += `\x1b[1m${categoryTitle} Tools:\x1b[0m\n`;

      // Find max command name length for alignment
      const maxLength = Math.max(...commands.map(cmd => cmd.name.length));

      // List commands
      for (const cmd of commands) {
        const padding = ' '.repeat(maxLength - cmd.name.length + 2);
        output += `  \x1b[36m${cmd.name}\x1b[0m${padding}${cmd.description}\n`;
      }

      output += '\n';
    }

    output += 'Type \x1b[36m<command> --help\x1b[0m for more information on a specific command.\n';

    return output;
  }

  /**
   * Search commands by keyword
   * @param keyword - Search keyword
   * @returns Array of matching command descriptors
   */
  search(keyword: string): CommandDescriptor[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.getAllCommands().filter(cmd =>
      cmd.name.toLowerCase().includes(lowerKeyword) ||
      cmd.description.toLowerCase().includes(lowerKeyword) ||
      cmd.aliases.some(alias => alias.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * Get command suggestions for a partial input (for autocomplete)
   * @param partial - Partial command name
   * @param limit - Maximum number of suggestions (default: 10)
   * @returns Array of suggested command names
   */
  getSuggestions(partial: string, limit = 10): string[] {
    const lowerPartial = partial.toLowerCase();

    // Get all command names and aliases
    const allNames = [
      ...Array.from(this.commands.keys()),
      ...Array.from(this.aliases.keys()),
    ];

    // Filter and sort by relevance
    const suggestions = allNames
      .filter(name => name.toLowerCase().startsWith(lowerPartial))
      .sort()
      .slice(0, limit);

    return suggestions;
  }
}

/**
 * Get the global command registry instance
 * Convenience function for accessing the singleton
 */
export function getCommandRegistry(): CommandRegistry {
  return CommandRegistry.getInstance();
}
