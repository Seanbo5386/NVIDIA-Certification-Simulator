# Unified `explain` Command Design

**Date:** 2026-02-08
**Status:** Approved
**Goal:** Merge `explain` and `explain-json` into a single comprehensive `explain` command

---

## Problem

The simulator currently has two separate explain commands:

1. **`explain <command>`** — Uses `commandMetadata.ts` (~35 hand-crafted entries) with learning-focused fields: `whenToUse`, `commonMistakes`, `difficulty`, `domains`
2. **`explain-json <command>`** — Uses JSON `CommandDefinitionRegistry` (150+ commands) with technical reference fields: `error_messages`, `exit_codes`, `subcommands`, flag drill-down, `source_urls`, `requires_root`

Users must know which command to use, and neither provides the complete picture.

## Solution

Merge both into a single `explain` command that uses the JSON registry as the primary data source, enriched with learning metadata when available.

---

## Output Structure

```
━━━ nvidia-smi ━━━

Description:
  NVIDIA System Management Interface for GPU monitoring and management

Usage:
  nvidia-smi [options] [-- gpu-id]

Examples:
  nvidia-smi --query-gpu=gpu_name,temperature.gpu --format=csv
    Query specific GPU metrics in CSV format
  nvidia-smi -L
    List all GPUs in the system

Common Options:
  -q, --query                Display GPU or unit info
  -L, --list-gpus            List each of the NVIDIA GPUs
  --query-gpu=...            Query specific GPU attributes
  ...

Subcommands:
  mig            Manage MIG (Multi-Instance GPU) mode
  drain          Manage GPU drain state for maintenance
  ...

Common Errors:
  NVML: Driver/library version mismatch
    Meaning: Kernel module and userspace library versions differ
    Fix: Reboot or reload the nvidia kernel module

Exit Codes:
  0     Success
  1     General error
  ...

━━━ Learning Aids ━━━

When to Use:
  • First tool to run when investigating GPU issues
  • Monitor GPU utilization, temperature, and memory in real-time
  • Check driver version and CUDA compatibility

Common Mistakes:
  ✗ Using nvidia-smi without -l for continuous monitoring
  ✗ Not checking persistence mode before benchmarking

Difficulty: Beginner
Exam Domains: Domain 1 (Systems/Server Bring-Up), Domain 5 (Troubleshooting)

Related Commands: dcgmi, nvsm, nvtop, nvidia-bug-report.sh

Documentation: https://developer.nvidia.com/nvidia-system-management-interface
```

---

## Implementation Plan

### Step 1: Modify `generateExplainOutput()` in `src/cli/explainCommand.ts`

Add an optional `learningMetadata` parameter:

```typescript
export async function generateExplainOutput(
  input: string,
  registry: CommandDefinitionRegistry,
  options: ExplainOptions = {},
  learningMetadata?: CommandMetadata | null,
): Promise<string>;
```

In `generateCommandExplanation()`, after the existing sections (description, usage, examples, options, subcommands, errors, exit codes, related commands), append a "Learning Aids" section if `learningMetadata` is provided:

- **When to Use** — from `learningMetadata.whenToUse`
- **Common Mistakes** — from `learningMetadata.commonMistakes`
- **Difficulty** — from `learningMetadata.difficulty`
- **Exam Domains** — from `learningMetadata.domains`

### Step 2: Merge Terminal.tsx Case Handlers

Replace both `case "explain"` and `case "explain-json"` with a single `case "explain"`:

```typescript
case "explain": {
  const args = cmdLine.trim().split(/\s+/).slice(1);
  if (args.length === 0) {
    result.output = "Usage: explain <command> [flag|subcommand]\n" +
      "Provides comprehensive command documentation with learning aids.\n\n" +
      "Examples:\n" +
      "  explain nvidia-smi\n" +
      "  explain nvidia-smi --query-gpu\n" +
      "  explain dcgmi diag\n";
    break;
  }

  try {
    const { getCommandDefinitionRegistry, generateExplainOutput } = await import("@/cli");
    const registry = await getCommandDefinitionRegistry();
    const learningMeta = getCommandMetadata(args[0]);
    const output = await generateExplainOutput(
      args.join(" "),
      registry,
      { includeErrors: true, includeExamples: true, includePermissions: true },
      learningMeta,
    );
    result.output = output;
  } catch {
    // Fallback: if JSON registry fails, use old metadata alone
    const metadata = getCommandMetadata(args[0]);
    if (metadata) {
      result.output = formatCommandHelp(metadata);
    } else {
      result.output = `Command '${args[0]}' not found. Type 'help' for available commands.`;
    }
  }
  break;
}
```

### Step 3: Remove `explain-json` Case

Delete the `case "explain-json"` handler from Terminal.tsx (lines ~373-403).

### Step 4: Handle Coverage Gaps

- **Commands in JSON registry but not in old metadata (~115 commands):** Show JSON content only, no Learning Aids section — graceful degradation.
- **Commands in old metadata but not in JSON registry (~0 expected, but handle anyway):** Fall back to `formatCommandHelp()` from old system.
- **Commands in neither:** "Command not found" with did-you-mean suggestions from JSON registry.

### Step 5: Update `generateExplainOutput` for "Not Found" with Fallback

When a command isn't in the JSON registry but has old metadata, `generateExplainOutput` currently returns an error. Modify the Terminal.tsx handler to check old metadata as fallback:

```typescript
const def = registry.getDefinition(commandName);
if (!def && learningMeta) {
  // Not in JSON registry, but has learning metadata
  return formatCommandHelp(learningMeta);
}
```

### Step 6: Update Help Text

Update the `help` command output in Terminal.tsx to:

- Remove `explain-json` from command list
- Update `explain` description: "Comprehensive command documentation with learning aids"

### Step 7: Update `commandMetadata.ts`

Remove the `explain-json` entry from `COMMAND_METADATA` if it exists. Update the `explain` entry's description to reflect the unified command.

### Step 8: Tests

- Test unified `explain` for a command in both systems (e.g., `nvidia-smi`) — verify both JSON content and learning aids appear
- Test for a command only in JSON registry — verify no Learning Aids section
- Test for an unknown command — verify "not found" with suggestions
- Test flag drill-down still works (e.g., `explain nvidia-smi --query-gpu`)
- Test subcommand drill-down still works (e.g., `explain dcgmi diag`)

---

## Files to Modify

| File                                         | Change                                                  |
| -------------------------------------------- | ------------------------------------------------------- |
| `src/cli/explainCommand.ts`                  | Add `learningMetadata` param, add Learning Aids section |
| `src/components/Terminal.tsx`                | Merge case handlers, remove `explain-json`              |
| `src/utils/commandMetadata.ts`               | Remove `explain-json` entry, update `explain` entry     |
| `src/cli/__tests__/explainCommand.test.ts`   | Add tests for learning aids integration                 |
| `src/components/__tests__/Terminal.test.tsx` | Update tests for unified command                        |

## Files NOT Changed

- `src/cli/CommandDefinitionRegistry.ts` — no changes needed
- `src/cli/types.ts` — no changes needed
- JSON definition files — no changes needed
- `src/utils/commandMetadata.ts` (bulk) — keep all 35 entries for learning metadata enrichment

---

## Key Decisions

1. **JSON registry is primary** — it has 150+ commands vs 35, and provides technical depth
2. **Old metadata enriches, doesn't duplicate** — only `whenToUse`, `commonMistakes`, `difficulty`, `domains` are appended
3. **Graceful degradation** — commands without learning metadata still get full JSON output
4. **Flag/subcommand drill-down preserved** — `explain nvidia-smi --query-gpu` and `explain dcgmi diag` continue to work via JSON system
5. **`formatCommandHelp()` kept as fallback** — for the unlikely case a command is only in old metadata
