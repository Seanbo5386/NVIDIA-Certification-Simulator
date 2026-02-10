import type {
  CommandCategory,
  CommandDefinition,
  StateDomain,
} from "@/cli/types";
import type { NarrativeScenariosFile } from "@/types/scenarios";

type ValidationIssue = {
  path: string;
  message: string;
};

const commandCategories: CommandCategory[] = [
  "gpu_management",
  "diagnostics",
  "system_info",
  "cluster_management",
  "networking",
  "containers",
  "firmware",
  "storage",
  "mpi",
  "gpu_fabric",
  "cuda_tools",
  "nccl_tests",
  "monitoring",
  "general",
  "rdma_perf",
  "parallel_shell",
  "modules",
];

const stateDomains: StateDomain[] = [
  "gpu_state",
  "gpu_process_state",
  "job_state",
  "node_state",
  "partition_state",
  "network_ib_state",
  "network_eth_state",
  "storage_lustre_state",
  "storage_local_state",
  "system_state",
  "container_state",
  "firmware_state",
  "fabric_state",
];

const difficultyLevels = ["beginner", "intermediate", "advanced"] as const;

const narrativeValidationTypes = ["command", "output", "state"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const pushIssue = (issues: ValidationIssue[], path: string, message: string) => {
  issues.push({ path, message });
};

const requireString = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (typeof value !== "string") {
    pushIssue(issues, path, "Expected string");
  }
};

const requireStringArray = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!Array.isArray(value)) {
    pushIssue(issues, path, "Expected array of strings");
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      pushIssue(issues, `${path}[${index}]`, "Expected string");
    }
  });
};

const requireNumber = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isNumber(value)) {
    pushIssue(issues, path, "Expected number");
  }
};

const requireEnum = <T extends readonly string[]>(
  value: unknown,
  path: string,
  options: T,
  issues: ValidationIssue[],
) => {
  if (typeof value !== "string" || !options.includes(value as T[number])) {
    pushIssue(issues, path, `Expected one of: ${options.join(", ")}`);
  }
};

const validateFaultInjectionConfig = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }

  requireString(value.nodeId, `${path}.nodeId`, issues);
  requireString(value.type, `${path}.type`, issues);
  requireString(value.severity, `${path}.severity`, issues);

  if (value.gpuId !== undefined && !isNumber(value.gpuId)) {
    pushIssue(issues, `${path}.gpuId`, "Expected number");
  }

  if (value.parameters !== undefined && !isRecord(value.parameters)) {
    pushIssue(issues, `${path}.parameters`, "Expected object");
  }
};

const validateNarrativeQuiz = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }

  requireString(value.question, `${path}.question`, issues);
  requireStringArray(value.options, `${path}.options`, issues);
  requireNumber(value.correctIndex, `${path}.correctIndex`, issues);
  requireString(value.explanation, `${path}.explanation`, issues);
};

const validateNarrativeStep = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }

  requireString(value.id, `${path}.id`, issues);
  requireString(value.situation, `${path}.situation`, issues);
  requireString(value.task, `${path}.task`, issues);
  requireStringArray(value.expectedCommands, `${path}.expectedCommands`, issues);
  requireStringArray(value.hints, `${path}.hints`, issues);

  if (!isRecord(value.validation)) {
    pushIssue(issues, `${path}.validation`, "Expected object");
  } else {
    requireEnum(
      value.validation.type,
      `${path}.validation.type`,
      narrativeValidationTypes,
      issues,
    );
    if (value.validation.command !== undefined) {
      requireString(value.validation.command, `${path}.validation.command`, issues);
    }
    if (value.validation.pattern !== undefined) {
      requireString(value.validation.pattern, `${path}.validation.pattern`, issues);
    }
  }

  if (value.quiz !== undefined) {
    validateNarrativeQuiz(value.quiz, `${path}.quiz`, issues);
  }

  if (value.autoFaults !== undefined) {
    if (!Array.isArray(value.autoFaults)) {
      pushIssue(issues, `${path}.autoFaults`, "Expected array");
    } else {
      value.autoFaults.forEach((fault, index) =>
        validateFaultInjectionConfig(
          fault,
          `${path}.autoFaults[${index}]`,
          issues,
        ),
      );
    }
  }
};

const validateNarrativeScenario = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }

  requireString(value.id, `${path}.id`, issues);
  requireNumber(value.domain, `${path}.domain`, issues);
  if (isNumber(value.domain) && (value.domain < 1 || value.domain > 5)) {
    pushIssue(issues, `${path}.domain`, "Expected number between 1 and 5");
  }
  requireString(value.title, `${path}.title`, issues);
  requireEnum(
    value.difficulty,
    `${path}.difficulty`,
    difficultyLevels,
    issues,
  );

  if (!isRecord(value.narrative)) {
    pushIssue(issues, `${path}.narrative`, "Expected object");
  } else {
    requireString(value.narrative.hook, `${path}.narrative.hook`, issues);
    requireString(
      value.narrative.setting,
      `${path}.narrative.setting`,
      issues,
    );
    requireString(
      value.narrative.resolution,
      `${path}.narrative.resolution`,
      issues,
    );
  }

  requireStringArray(value.commandFamilies, `${path}.commandFamilies`, issues);
  requireNumber(value.estimatedMinutes, `${path}.estimatedMinutes`, issues);

  if (value.tier !== undefined && ![1, 2, 3].includes(value.tier as number)) {
    pushIssue(issues, `${path}.tier`, "Expected 1, 2, or 3");
  }

  if (value.faults !== undefined) {
    if (!Array.isArray(value.faults)) {
      pushIssue(issues, `${path}.faults`, "Expected array");
    } else {
      value.faults.forEach((fault, index) =>
        validateFaultInjectionConfig(
          fault,
          `${path}.faults[${index}]`,
          issues,
        ),
      );
    }
  }

  if (!Array.isArray(value.steps)) {
    pushIssue(issues, `${path}.steps`, "Expected array");
  } else {
    value.steps.forEach((step, index) =>
      validateNarrativeStep(step, `${path}.steps[${index}]`, issues),
    );
  }
};

const validateCommandOption = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  if (value.flag !== undefined) {
    requireString(value.flag, `${path}.flag`, issues);
  }
  if (value.short !== undefined) {
    requireString(value.short, `${path}.short`, issues);
  }
  if (value.long !== undefined) {
    requireString(value.long, `${path}.long`, issues);
  }
  requireString(value.description, `${path}.description`, issues);
  if (value.arguments !== undefined) {
    requireString(value.arguments, `${path}.arguments`, issues);
  }
  if (value.argument_type !== undefined) {
    requireString(value.argument_type, `${path}.argument_type`, issues);
  }
  if (value.default !== undefined) {
    requireString(value.default, `${path}.default`, issues);
  }
  if (value.required !== undefined && typeof value.required !== "boolean") {
    pushIssue(issues, `${path}.required`, "Expected boolean");
  }
  if (value.example !== undefined) {
    requireString(value.example, `${path}.example`, issues);
  }
};

const validateSubcommand = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireString(value.name, `${path}.name`, issues);
  requireString(value.description, `${path}.description`, issues);
  if (value.synopsis !== undefined) {
    requireString(value.synopsis, `${path}.synopsis`, issues);
  }
  if (value.options !== undefined) {
    if (!Array.isArray(value.options)) {
      pushIssue(issues, `${path}.options`, "Expected array");
    } else {
      value.options.forEach((option, index) =>
        validateCommandOption(option, `${path}.options[${index}]`, issues),
      );
    }
  }
};

const validateExitCode = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireNumber(value.code, `${path}.code`, issues);
  requireString(value.meaning, `${path}.meaning`, issues);
};

const validateUsagePattern = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireString(value.description, `${path}.description`, issues);
  requireString(value.command, `${path}.command`, issues);
  if (value.output_example !== undefined) {
    requireString(value.output_example, `${path}.output_example`, issues);
  }
  if (value.requires_root !== undefined && typeof value.requires_root !== "boolean") {
    pushIssue(issues, `${path}.requires_root`, "Expected boolean");
  }
};

const validateErrorMessage = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireString(value.message, `${path}.message`, issues);
  requireString(value.meaning, `${path}.meaning`, issues);
  if (value.resolution !== undefined) {
    requireString(value.resolution, `${path}.resolution`, issues);
  }
};

const validateEnvironmentVariable = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireString(value.name, `${path}.name`, issues);
  requireString(value.description, `${path}.description`, issues);
  if (value.example !== undefined) {
    requireString(value.example, `${path}.example`, issues);
  }
  if (value.affects_command !== undefined) {
    requireString(value.affects_command, `${path}.affects_command`, issues);
  }
};

const validateStateRead = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireEnum(value.state_domain, `${path}.state_domain`, stateDomains, issues);
  if (value.fields !== undefined) {
    requireStringArray(value.fields, `${path}.fields`, issues);
  }
  if (value.description !== undefined) {
    requireString(value.description, `${path}.description`, issues);
  }
};

const validateStateWrite = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  requireEnum(value.state_domain, `${path}.state_domain`, stateDomains, issues);
  if (value.fields !== undefined) {
    requireStringArray(value.fields, `${path}.fields`, issues);
  }
  if (value.description !== undefined) {
    requireString(value.description, `${path}.description`, issues);
  }
  if (value.requires_flags !== undefined) {
    requireStringArray(value.requires_flags, `${path}.requires_flags`, issues);
  }
  if (value.requires_privilege !== undefined) {
    requireString(value.requires_privilege, `${path}.requires_privilege`, issues);
  }
};

const validateStateInteraction = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  if (value.reads_from !== undefined) {
    if (!Array.isArray(value.reads_from)) {
      pushIssue(issues, `${path}.reads_from`, "Expected array");
    } else {
      value.reads_from.forEach((entry, index) =>
        validateStateRead(entry, `${path}.reads_from[${index}]`, issues),
      );
    }
  }
  if (value.writes_to !== undefined) {
    if (!Array.isArray(value.writes_to)) {
      pushIssue(issues, `${path}.writes_to`, "Expected array");
    } else {
      value.writes_to.forEach((entry, index) =>
        validateStateWrite(entry, `${path}.writes_to[${index}]`, issues),
      );
    }
  }
  if (value.triggered_by !== undefined) {
    if (!Array.isArray(value.triggered_by)) {
      pushIssue(issues, `${path}.triggered_by`, "Expected array");
    } else {
      value.triggered_by.forEach((entry, index) => {
        if (!isRecord(entry)) {
          pushIssue(issues, `${path}.triggered_by[${index}]`, "Expected object");
          return;
        }
        requireString(
          entry.state_change,
          `${path}.triggered_by[${index}].state_change`,
          issues,
        );
        requireString(
          entry.effect,
          `${path}.triggered_by[${index}].effect`,
          issues,
        );
      });
    }
  }
  if (value.consistent_with !== undefined) {
    if (!Array.isArray(value.consistent_with)) {
      pushIssue(issues, `${path}.consistent_with`, "Expected array");
    } else {
      value.consistent_with.forEach((entry, index) => {
        if (!isRecord(entry)) {
          pushIssue(
            issues,
            `${path}.consistent_with[${index}]`,
            "Expected object",
          );
          return;
        }
        requireString(
          entry.command,
          `${path}.consistent_with[${index}].command`,
          issues,
        );
        requireString(
          entry.shared_state,
          `${path}.consistent_with[${index}].shared_state`,
          issues,
        );
      });
    }
  }
};

const validateInteroperability = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  if (value.related_commands !== undefined) {
    requireStringArray(value.related_commands, `${path}.related_commands`, issues);
  }
  if (value.uses_library !== undefined) {
    requireStringArray(value.uses_library, `${path}.uses_library`, issues);
  }
  if (value.notes !== undefined) {
    requireString(value.notes, `${path}.notes`, issues);
  }
};

const validatePermissions = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  if (value.read_operations !== undefined) {
    requireString(value.read_operations, `${path}.read_operations`, issues);
  }
  if (value.write_operations !== undefined) {
    requireString(value.write_operations, `${path}.write_operations`, issues);
  }
  if (value.notes !== undefined) {
    requireString(value.notes, `${path}.notes`, issues);
  }
};

const validateInstallation = (
  value: unknown,
  path: string,
  issues: ValidationIssue[],
) => {
  if (!isRecord(value)) {
    pushIssue(issues, path, "Expected object");
    return;
  }
  if (value.package !== undefined) {
    requireString(value.package, `${path}.package`, issues);
  }
  if (value.notes !== undefined) {
    requireString(value.notes, `${path}.notes`, issues);
  }
};

const formatIssues = (issues: ValidationIssue[]) =>
  issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n");

export const parseNarrativeScenariosFile = (
  data: unknown,
): NarrativeScenario[] => {
  const issues: ValidationIssue[] = [];

  if (!isRecord(data)) {
    pushIssue(issues, "root", "Expected object");
  } else if (!Array.isArray(data.scenarios)) {
    pushIssue(issues, "scenarios", "Expected array");
  } else {
    data.scenarios.forEach((scenario, index) =>
      validateNarrativeScenario(scenario, `scenarios[${index}]`, issues),
    );
  }

  if (issues.length > 0) {
    const message = `Invalid narrative scenarios JSON:\n${formatIssues(issues)}`;
    console.error(message);
    throw new Error(message);
  }

  return (data as NarrativeScenariosFile).scenarios;
};

export const parseCommandDefinition = (
  data: unknown,
  context: string,
): CommandDefinition => {
  const issues: ValidationIssue[] = [];

  if (!isRecord(data)) {
    pushIssue(issues, "root", "Expected object");
  } else {
    requireString(data.command, "command", issues);
    requireEnum(data.category, "category", commandCategories, issues);
    requireString(data.description, "description", issues);
    requireString(data.synopsis, "synopsis", issues);

    if (data.version_documented !== undefined) {
      requireString(data.version_documented, "version_documented", issues);
    }
    if (data.source_urls !== undefined) {
      requireStringArray(data.source_urls, "source_urls", issues);
    }
    if (data.installation !== undefined) {
      validateInstallation(data.installation, "installation", issues);
    }
    if (data.global_options !== undefined) {
      if (!Array.isArray(data.global_options)) {
        pushIssue(issues, "global_options", "Expected array");
      } else {
        data.global_options.forEach((option, index) =>
          validateCommandOption(option, `global_options[${index}]`, issues),
        );
      }
    }
    if (data.subcommands !== undefined) {
      if (!Array.isArray(data.subcommands)) {
        pushIssue(issues, "subcommands", "Expected array");
      } else {
        data.subcommands.forEach((option, index) =>
          validateSubcommand(option, `subcommands[${index}]`, issues),
        );
      }
    }
    if (data.output_formats !== undefined && !isRecord(data.output_formats)) {
      pushIssue(issues, "output_formats", "Expected object");
    }
    if (data.environment_variables !== undefined) {
      if (!Array.isArray(data.environment_variables)) {
        pushIssue(issues, "environment_variables", "Expected array");
      } else {
        data.environment_variables.forEach((entry, index) =>
          validateEnvironmentVariable(
            entry,
            `environment_variables[${index}]`,
            issues,
          ),
        );
      }
    }
    if (data.exit_codes !== undefined) {
      if (!Array.isArray(data.exit_codes)) {
        pushIssue(issues, "exit_codes", "Expected array");
      } else {
        data.exit_codes.forEach((entry, index) =>
          validateExitCode(entry, `exit_codes[${index}]`, issues),
        );
      }
    }
    if (data.common_usage_patterns !== undefined) {
      if (!Array.isArray(data.common_usage_patterns)) {
        pushIssue(issues, "common_usage_patterns", "Expected array");
      } else {
        data.common_usage_patterns.forEach((entry, index) =>
          validateUsagePattern(
            entry,
            `common_usage_patterns[${index}]`,
            issues,
          ),
        );
      }
    }
    if (data.error_messages !== undefined) {
      if (!Array.isArray(data.error_messages)) {
        pushIssue(issues, "error_messages", "Expected array");
      } else {
        data.error_messages.forEach((entry, index) =>
          validateErrorMessage(entry, `error_messages[${index}]`, issues),
        );
      }
    }
    if (data.interoperability !== undefined) {
      validateInteroperability(data.interoperability, "interoperability", issues);
    }
    if (data.permissions !== undefined) {
      validatePermissions(data.permissions, "permissions", issues);
    }
    if (data.limitations !== undefined) {
      requireStringArray(data.limitations, "limitations", issues);
    }
    if (data.state_interactions !== undefined) {
      validateStateInteraction(data.state_interactions, "state_interactions", issues);
    }
  }

  if (issues.length > 0) {
    const message = `Invalid command definition (${context}):\n${formatIssues(
      issues,
    )}`;
    console.error(message);
    throw new Error(message);
  }

  return data as CommandDefinition;
};
