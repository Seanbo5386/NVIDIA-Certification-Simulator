// src/cli/__tests__/StateEngine.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { StateEngine } from "../StateEngine";
import { getCommandDefinitionRegistry } from "../CommandDefinitionRegistry";
import type { CommandDefinitionRegistry } from "../CommandDefinitionRegistry";

describe("StateEngine", () => {
  let registry: CommandDefinitionRegistry;
  let stateEngine: StateEngine;

  beforeAll(async () => {
    registry = await getCommandDefinitionRegistry();
    stateEngine = new StateEngine(registry);
  });

  describe("requiresRoot", () => {
    it("should return true for power limit flag", () => {
      expect(stateEngine.requiresRoot("nvidia-smi", ["pl"])).toBe(true);
    });

    it("should return false for query flag", () => {
      expect(stateEngine.requiresRoot("nvidia-smi", ["q"])).toBe(false);
    });

    it("should return false for read-only commands", () => {
      expect(stateEngine.requiresRoot("sinfo", [])).toBe(false);
    });
  });

  describe("getStateInteractions", () => {
    it("should return state interactions for a command", () => {
      const interactions = stateEngine.getStateInteractions("sinfo");

      expect(interactions).toBeDefined();
      expect(interactions?.reads_from).toBeDefined();
    });

    it("should return undefined for unknown command", () => {
      const interactions = stateEngine.getStateInteractions("unknown-cmd");

      expect(interactions).toBeUndefined();
    });
  });
});
