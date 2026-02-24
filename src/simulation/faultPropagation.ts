import {
  FAULT_PROPAGATION_RULES,
  type PropagationRule,
} from "@/data/faultPropagationRules";

export interface FaultTrigger {
  faultType: string;
  nodeId: string;
  gpuId?: number;
}

export interface PendingConsequence {
  id: number;
  ruleAction: string;
  target: string;
  params: Record<string, unknown>;
  nodeId: string;
  gpuId?: number;
  dueAt: number;
  description: string;
}

export class FaultPropagationEngine {
  private pending: PendingConsequence[] = [];
  private nextId = 0;
  private rules: PropagationRule[];

  constructor(rules?: PropagationRule[]) {
    this.rules = rules ?? FAULT_PROPAGATION_RULES;
  }

  triggerFault(trigger: FaultTrigger): void {
    const rule = this.rules.find((r) => r.trigger === trigger.faultType);
    if (!rule) return;

    const now = Date.now();
    for (const consequence of rule.consequences) {
      this.pending.push({
        id: this.nextId++,
        ruleAction: consequence.action,
        target: consequence.target,
        params: { ...consequence.params },
        nodeId: trigger.nodeId,
        gpuId: trigger.gpuId,
        dueAt: now + consequence.delayMs,
        description: consequence.description,
      });
    }
  }

  getDueConsequences(): PendingConsequence[] {
    const now = Date.now();
    return this.pending.filter((c) => c.dueAt <= now);
  }

  consumeConsequences(ids: number[]): void {
    const idSet = new Set(ids);
    this.pending = this.pending.filter((c) => !idSet.has(c.id));
  }

  getPending(): PendingConsequence[] {
    return [...this.pending];
  }

  clear(): void {
    this.pending = [];
    this.nextId = 0;
  }
}
