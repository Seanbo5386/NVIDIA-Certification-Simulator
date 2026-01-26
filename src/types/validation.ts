/**
 * Validation Types for Scenario Step Completion
 *
 * This module defines the types used for validating user progress
 * through scenario steps, providing real-time feedback on command execution.
 */

import type { CommandContext } from './commands';

/**
 * Types of validation rules that can be applied to scenario steps
 */
export type ValidationRuleType = 'command' | 'output' | 'state' | 'sequence';

/**
 * A validation rule that checks if a step requirement is met
 */
export interface ValidationRule {
  /** Unique identifier for this rule */
  id: string;

  /** Type of validation to perform */
  type: ValidationRuleType;

  /** Regular expression pattern to match against (for command/output types) */
  pattern?: string | RegExp;

  /** Command pattern to match (e.g., "ipmitool.*sel.*list") */
  commandPattern?: string;

  /** Function to check system state (for state type) */
  stateCheck?: (context: CommandContext) => boolean;

  /** Commands that must be executed in order (for sequence type) */
  sequence?: string[];

  /** Error message to display if validation fails */
  errorMessage?: string;

  /** Optional weight for partial credit (0-1, defaults to 1) */
  weight?: number;

  /** If true, ALL expected commands must be executed before step completes */
  requireAllCommands?: boolean;

  /** List of expected commands (used when requireAllCommands is true) */
  expectedCommands?: string[];
}

/**
 * Validation criteria for a scenario step
 */
export interface StepValidation {
  /** ID of the step being validated */
  stepId: string;

  /** List of rules that must pass for step completion */
  rules: ValidationRule[];

  /** Allow partial credit if some rules pass */
  partialCredit?: boolean;

  /** Automatically advance to next step when all rules pass */
  autoAdvance?: boolean;

  /** Minimum percentage of rules that must pass (0-100, defaults to 100) */
  minimumScore?: number;
}

/**
 * Result of validating a command against step requirements
 */
export interface ValidationResult {
  /** Whether the validation passed (all required rules met) */
  passed: boolean;

  /** IDs of rules that were matched */
  matchedRules: string[];

  /** IDs of rules that failed */
  failedRules: string[];

  /** Human-readable feedback message */
  feedback: string;

  /** Progress percentage (0-100) */
  progress: number;

  /** Partial credit earned (0-1) */
  score: number;

  /** Specific rule results for detailed feedback */
  ruleResults: Array<{
    ruleId: string;
    passed: boolean;
    message?: string;
  }>;
}

/**
 * State of validation for a specific step in progress
 */
export interface StepValidationState {
  /** ID of the scenario this belongs to */
  scenarioId: string;

  /** ID of the step being validated */
  stepId: string;

  /** Current validation result */
  result: ValidationResult;

  /** Commands executed so far for this step */
  commandsExecuted: string[];

  /** Timestamp of first command execution */
  startTime: number;

  /** Timestamp of last command execution */
  lastCommandTime: number;

  /** Number of failed attempts */
  failedAttempts: number;
}

/**
 * Configuration for auto-validation behavior
 */
export interface ValidationConfig {
  /** Enable real-time validation */
  enabled: boolean;

  /** Show validation feedback immediately after each command */
  immediatefeedback: boolean;

  /** Auto-advance to next step when validation passes */
  autoAdvance: boolean;

  /** Delay before auto-advancing (milliseconds) */
  autoAdvanceDelay: number;

  /** Show progress bar in UI */
  showProgress: boolean;

  /** Play sound effects on success/failure */
  soundEffects: boolean;
}
