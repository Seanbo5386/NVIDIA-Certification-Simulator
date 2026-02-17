# Testing Guide

Complete guide for running, writing, and maintaining tests for DC Lab Sim.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests once (no watch)
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Test Suite Overview

| Category           | Test Count | Location                                              |
| ------------------ | ---------- | ----------------------------------------------------- |
| Command Parser     | 45+        | `src/utils/__tests__/commandParser.test.ts`           |
| Base Simulator     | 25+        | `src/simulators/__tests__/BaseSimulator.test.ts`      |
| nvidia-smi         | 50+        | `src/simulators/__tests__/nvidiaSmiSimulator.test.ts` |
| DCGM               | 60+        | `src/simulators/__tests__/dcgmiSimulator.test.ts`     |
| Interactive Shells | 40+        | `src/simulators/__tests__/interactiveShells.test.ts`  |
| Edge Cases         | 80+        | `src/__tests__/edgeCases.test.ts`                     |
| Scenario Validator | -          | `src/tests/scenarioValidator.test.ts`                 |

**Total: 300+ test cases**

---

## Running Tests

### Basic Commands

```bash
npm test                    # Watch mode
npm run test:run            # Single run
npm run test:coverage       # With coverage report
npm run test:ui             # Interactive UI at localhost:51204
```

### Run Specific Tests

```bash
npm test commandParser      # Test the parser
npm test nvidiaSmi          # Test nvidia-smi
npm test dcgmi              # Test DCGM
npm test interactiveShells  # Test NVSM/CMSH shells
npm test edgeCases          # Test edge cases
npm test -- -t "pattern"    # Match test name pattern
```

### Coverage Report

```bash
npm run test:coverage
open coverage/index.html    # View HTML report
```

**Coverage Goals:** Lines >90%, Functions >95%, Branches >85%

---

## Manual Terminal Testing

Use these commands in the simulator's Terminal tab for manual verification:

### nvidia-smi Commands

```bash
nvidia-smi                          # Basic GPU listing
nvidia-smi -L                       # List GPUs with UUIDs
nvidia-smi -q                       # Detailed query
nvidia-smi -q -i 0                  # Query specific GPU
nvidia-smi -q -d MEMORY             # Memory details
nvidia-smi topo -m                  # Topology matrix
nvidia-smi nvlink --status          # NVLink status
nvidia-smi -i 0 -mig 1              # Enable MIG mode
nvidia-smi mig -lgip                # List MIG profiles
nvidia-smi mig -lgi                 # List GPU instances
nvidia-smi -i 0 -pl 350             # Set power limit
nvidia-smi --gpu-reset -i 0         # GPU reset
```

### DCGM Commands

```bash
dcgmi discovery -l                  # Discover GPUs
dcgmi diag -r 1                     # Quick diagnostic
dcgmi diag -r 2                     # Medium diagnostic
dcgmi diag -r 3                     # Extended diagnostic
dcgmi health --check                # Health check
dcgmi group -l                      # List GPU groups
```

### ipmitool Commands

```bash
ipmitool sensor list                # List sensors
ipmitool sel list                   # System Event Log
ipmitool sel elist                  # Extended SEL
ipmitool mc info                    # BMC info
ipmitool chassis status             # Chassis status
ipmitool fru print                  # FRU inventory
ipmitool lan print 1                # LAN config
```

### InfiniBand Commands

```bash
ibstat                              # HCA status
ibportstate                         # Port state
ibporterrors                        # Error counters
iblinkinfo                          # Link info
perfquery                           # Performance counters
ibdiagnet                           # Full diagnostic
```

---

## Writing Tests

### Test File Template

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { YourSimulator } from "../yourSimulator";
import { parse } from "@/utils/commandParser";
import type { CommandContext } from "@/types/commands";

describe("YourSimulator", () => {
  let simulator: YourSimulator;
  let context: CommandContext;

  beforeEach(() => {
    simulator = new YourSimulator();
    context = {
      currentNode: "dgx-00",
      currentPath: "/root",
      environment: {},
      history: [],
    };
  });

  describe("Feature Name", () => {
    it("should do something when condition", () => {
      const parsed = parse("command --flag");
      const result = simulator.execute(parsed, context);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain("expected text");
    });
  });
});
```

### Common Assertions

```typescript
// Exit codes
expect(result.exitCode).toBe(0); // Success
expect(result.exitCode).toBe(1); // Error

// Output content
expect(result.output).toContain("text");
expect(result.output).toMatch(/regex/);

// Interactive mode
expect(result.prompt).toBeDefined();
expect(result.prompt).toContain("nvsm->");

// Parser
expect(parsed.flags.has("flag")).toBe(true);
expect(parsed.subcommands).toContain("subcommand");
```

### Mocking Store State

```typescript
import { vi } from "vitest";
import { useSimulationStore } from "@/store/simulationStore";

vi.mock("@/store/simulationStore", () => ({
  useSimulationStore: {
    getState: vi.fn(() => ({
      cluster: {
        nodes: [
          /* mock data */
        ],
      },
    })),
  },
}));
```

---

## Test Categories

### 1. Parser Tests

- Basic command parsing
- Flag parsing (short/long/combined)
- Positional arguments
- Quoted arguments
- Special characters
- Edge cases (empty, unicode, very long)

### 2. Simulator Tests (per simulator)

- Help/version flags
- All documented commands
- All flag combinations
- Error messages
- Output format
- State integration

### 3. Interactive Shell Tests

- Enter/exit modes
- Command execution in mode
- Mode switching (CMSH)
- Error handling

### 4. Edge Cases

- Empty/whitespace inputs
- Very long commands (10000+ chars)
- Unicode and special characters
- Malformed flags
- Missing required arguments
- Security (injection attempts)

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Before Committing

```bash
npm test              # All tests pass
npm run test:coverage # Coverage meets thresholds
npm run build         # Build succeeds
```

---

## Debugging

```bash
npm test -- -t "test name"      # Run single test
npm test -- --reporter=verbose  # Detailed output
```

### VS Code Debug Config

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["--run"],
  "console": "integratedTerminal"
}
```

---

## Related Documentation

- [Test Plan](./test-plan.md) - Complete test case matrix
- [Scenario Testing Checklist](../SCENARIO_TESTING_CHECKLIST.md) - Lab scenario validation
