// src/cli/index.ts
// Barrel export for CLI module

// Types
export type {
  CommandCategory,
  StateDomain,
  CommandOption,
  Subcommand,
  ExitCode,
  UsagePattern,
  ErrorMessage,
  StateInteraction,
  CommandDefinition,
} from "./types";

// Loader
export {
  CommandDefinitionLoader,
  getCommandDefinitionLoader,
} from "./CommandDefinitionLoader";

// Registry
export {
  CommandDefinitionRegistry,
  getCommandDefinitionRegistry,
} from "./CommandDefinitionRegistry";
export type { ValidationResult } from "./CommandDefinitionRegistry";

// Help Command
export { generateHelpOutput } from "./helpCommand";
export type { HelpOptions } from "./helpCommand";

// Exercise Generator
export { CommandExerciseGenerator } from "./CommandExerciseGenerator";
export type { CommandExercise } from "./CommandExerciseGenerator";

// Formatters
export {
  ANSI,
  formatCommandHelp,
  formatFlagHelp,
  formatErrorMessage,
  formatExitCode,
  formatValidationError,
} from "./formatters";

// State Engine
export { StateEngine } from "./StateEngine";
export type { ExecutionContext, CanExecuteResult } from "./StateEngine";

// Command Router
export { CommandRouter } from "./commandRouter";
export type { CommandHandler } from "./commandRouter";
