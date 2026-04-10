# Realism Audit — Design Specification

**Date:** 2026-04-10
**Scope:** Full realism overhaul of all hardware specs, CLI command outputs, version compatibility, data file accuracy, benchmark formulas, fault systems, and cross-system consistency.

---

## 1. Objective

Audit every hardcoded value, output format, command syntax, version string, and behavioral formula in the DC Lab Simulator codebase for accuracy against official documentation. Produce a prioritized findings report and implementation plan.

## 2. Audit Scope

### In Scope

- Every hardcoded numeric value (specs, thresholds, version numbers)
- All command syntax and flag usage in quiz/exam/scenario data
- Simulator output formats vs real CLI tool output (column order, field names, units, precision)
- Version compatibility (driver/CUDA/kernel/firmware)
- Behavioral logic (scaling formulas, fault cascades, sensor ranges)
- Technical accuracy of quiz answers, exam questions, and explanation text
- Cross-system consistency (shared state, fault propagation, command output references)
- NVLink topology matrices per system type
- XID error codes, severity, cause, and remediation accuracy

### Out of Scope

- UI/UX design choices
- Pedagogical effectiveness of scenarios
- Code quality or refactoring unrelated to realism
- Performance optimization

## 3. Methodology

### Per-Item Audit Process

1. Identify the value/format in the codebase
2. Find the authoritative source (official docs, man pages, release notes)
3. Compare — exact match, close approximation, or wrong
4. Classify severity: **Critical**, **High**, **Medium**, **Low**
5. Record: file, line, current value, correct value, source reference

### Severity Definitions

- **Critical** — Factually wrong. Would teach incorrect information to certification candidates. (e.g., wrong flag name, non-existent command, incorrect spec value)
- **High** — Misleading or incomplete. Could cause confusion during real-world troubleshooting. (e.g., wrong output format, missing important field, ambiguous explanation)
- **Medium** — Imprecise but not harmful. Value is in the right ballpark but doesn't match official docs exactly. (e.g., slightly off clock speed, approximate sensor range)
- **Low** — Cosmetic or minor. Doesn't affect learning outcomes. (e.g., column alignment, whitespace, version string format)

## 4. Cross-System Consistency Audit

This dimension runs through every layer, checking:

### Command Output Cross-References

- Does `dmesg` output reference the same XID codes that `dcgmi health` checks for?
- Does `nvidia-smi topo -m` show the same NVLink layout that `nvsm` and `fabric-manager` report?
- Do `ibstat` port states match what `iblinkinfo` and `ibdiagnet` show?
- Does `ipmitool sensor list` reflect the same thermal state as `nvidia-smi` GPU temps?

### State Consistency Across Simulators

- When a GPU has an ECC error: nvidia-smi, dcgmi, ipmitool SEL, dmesg, SLURM node state
- When an NVLink degrades: nvidia-smi nvlink, fabric-manager, nvsm, benchmark throughput
- When a node is drained: sinfo, scontrol, squeue (pending jobs), SLURM accounting

### Shared Value Sources

- Do all simulators pull GPU specs from `hardwareSpecs.ts`, or are there hardcoded divergent values?
- Do all InfiniBand simulators use the same HCA model/speed from the cluster config?
- Are driver/CUDA versions consistent across nvidia-smi, dmesg, and linuxUtils output?

### Command Pipeline Realism

- When scenarios chain commands, do outputs logically connect?
- Do diagnostic commands reference findings from earlier commands in a scenario?

## 5. Audit Layers

### Layer 1 — Hardware Specs & Version Compatibility

**Files:** `src/data/hardwareSpecs.ts`, `src/utils/clusterFactory.ts`, `src/data/dgxLayouts.ts`

**Checks:**

- GPU: model name, memory capacity (GB/MiB), memory type, bandwidth (TB/s), TDP (W), base/boost clock (MHz), compute capability, PCI device ID
- NVLink: version, links per GPU, per-link bandwidth (GB/s), total bandwidth (GB/s), NVSwitch count, NVSwitch generation
- Network: HCA model, port count, protocol, port rate (Gbps), inter-node bandwidth
- CPU: model, socket count, cores per socket, system memory (GB)
- Storage: drive types, capacities
- Driver ↔ CUDA version compatibility pairs
- Kernel version compatibility with driver versions
- Firmware version string formats (HCA, DPU, BMC)

**Verification Sources:**

- NVIDIA DGX datasheets & product briefs
- NVIDIA CUDA Toolkit release notes (driver compatibility table)
- NVIDIA Driver release notes
- Mellanox/NVIDIA HCA product briefs (ConnectX-6/7/8)
- NVIDIA NVSwitch architecture whitepapers
- NVIDIA Rubin/Vera announcements (GTC 2025/2026) for VR200

### Layer 2 — Data File Accuracy

**Files:** `src/data/examQuestions.json`, `src/data/quizQuestions.json`, `src/data/explanationGates.json`, `src/data/narrativeScenarios.json`, `src/data/commandFamilies.json`, `src/data/toolMasteryQuestions.json`, `src/data/xidDrillQuestions.json`, `src/data/xidErrors.ts`

**Checks:**

- Every command example for valid syntax (flags, subcommands, argument format)
- Every "correct answer" for technical accuracy
- Every explanation for factual correctness
- XID error codes: number, name, severity, cause, remediation
- Scenario step sequences for realistic troubleshooting workflow
- Quiz distractor options (wrong answers should be plausibly wrong, not nonsensical)

**Verification Sources:**

- `nvidia-smi --help` / NVIDIA SMI documentation
- DCGM User Guide
- `ipmitool` man page / IPMI specification
- NVIDIA XID Errors documentation
- Slurm official docs (schedmd.com)
- InfiniBand/OFED documentation
- Docker CLI reference
- Linux man pages

### Layer 3 — Simulator Output Formats

**Files:** All 23 simulators in `src/simulators/`

**Per-simulator checks:**

- Output column names, order, alignment vs real tool
- Units and precision (MiB vs MB, W, MHz, GB/s)
- Status strings and state enumerations
- Error message formats and exit codes
- Flag/subcommand parsing matches real tool behavior
- Help text accuracy

**Verification Sources:**

- Official man pages and `--help` output for each tool
- NVIDIA docs for proprietary tools (nvidia-smi, dcgmi, nvsm, fabric-manager)
- Slurm docs for sinfo/squeue/scontrol output formats
- Docker CLI reference
- Linux man pages (lspci, ethtool, ip, dmesg, lscpu, free, etc.)

### Layer 4 — Benchmark & Performance Scaling

**Files:** `src/simulators/benchmarkSimulator.ts`

**Checks:**

- NCCL all-reduce/all-gather bandwidth: formula correctness, expected throughput per system type
- gpu-burn: reported metrics, duration behavior, output format
- ib_write_bw/ib_read_bw: throughput expectations per link speed (HDR/NDR/XDR)
- Multi-node scaling factors (2-node, 4-node, 8-node)
- STREAM benchmark memory bandwidth numbers

**Verification Sources:**

- NCCL documentation & NVIDIA published benchmarks
- gpu-burn source code (GitHub)
- Perftest documentation (ib_write_bw)
- NVIDIA published DGX benchmark results
- STREAM benchmark reference values

### Layer 5 — Topology & Fault Systems

**Files:** `src/data/dgxLayouts.ts`, `src/data/xidErrors.ts`, `src/data/faultPropagationRules.ts`, `src/data/consequenceRules.ts`, `src/data/incidentTemplates.ts`, `src/data/faultDescriptions.ts`

**Checks:**

- NVLink topology matrices per system match architecture whitepapers
- GPU ↔ NVSwitch connectivity patterns per generation
- XID error code accuracy (number → name → severity → typical cause)
- Fault cascade logic realism (e.g., XID 43 → NVLink degradation → SLURM drain timing)
- Sensor threshold values for thermal/power alerts
- Incident template diagnostic paths match real troubleshooting workflows

**Verification Sources:**

- NVIDIA architecture whitepapers (Ampere, Hopper, Blackwell)
- NVIDIA XID error reference documentation
- DGX System Administration Guides
- NVIDIA GPU debugging documentation

### Layer 6 — Cluster Factory & Node Generation

**Files:** `src/utils/clusterFactory.ts`

**Checks:**

- PCI address format and GPU slot assignments per system type
- GPU UUID format (`GPU-XXXXXXXX` — correct length, character set)
- Default sensor value ranges (temps, voltages, fan RPMs, PSU wattage)
- Hostname/network naming conventions vs DGX defaults
- SLURM partition and QOS naming against conventions
- DPU model assignment per system generation

**Verification Sources:**

- PCI SIG specifications (address format)
- NVIDIA driver docs (UUID format)
- DGX system admin guides (default sensor baselines, naming)
- Slurm configuration best practices documentation

## 6. Execution Strategy

### Phase 1 — Foundation Verification (Layer 1)

Sequential deep-read of hardware specs files combined with web research against official NVIDIA datasheets. Establishes the verified baseline.

### Phase 2 — Parallel Data + Simulator Audit (Layers 2-3)

Data files and simulator outputs audited in parallel via multiple research agents. Each agent focuses on a command domain (GPU tools, InfiniBand, SLURM, Linux, containers, BMC).

### Phase 3 — Behavioral Audit (Layers 4-6)

Benchmarks, fault systems, and cluster factory — depends on verified specs from Phase 1. Can parallelize across domains.

### Phase 4 — Cross-Reference Pass

Final sweep checking consistency across layers:

- Driver versions: hardwareSpecs ↔ nvidia-smi ↔ dmesg ↔ linuxUtils
- NVLink bandwidth: hardwareSpecs ↔ dgxLayouts ↔ nvidia-smi nvlink ↔ benchmarks
- HCA specs: hardwareSpecs ↔ infinibandSimulator ↔ mellanoxSimulator
- GPU specs: hardwareSpecs ↔ all GPU-related simulators
- Fault state: faultPropagation ↔ all affected simulators

### Phase 5 — Report Compilation

Consolidate all findings into the structured report. Deduplicate, assign final severity ratings, compile implementation plan.

## 7. Deliverable Format

### Findings Report

Single document with:

```
1. Executive Summary
   - Total findings by severity
   - Top 10 highest-impact issues
   - Overall realism assessment

2-7. Per-Layer Findings (Layers 1-6)
   - Each finding follows the template below

8. Cross-System Consistency Findings

9. Appendix: Verification Sources
```

### Per-Finding Template

```
### [SEVERITY] Finding Title
- **File:** path/to/file.ts:line
- **Current Value:** what the code says
- **Correct Value:** what it should be
- **Source:** official doc reference
- **Impact:** how this affects training accuracy
```

### Implementation Plan

Separate document created after findings are reviewed:

- Prioritized fix list (critical → low)
- Grouped by file to minimize context switching
- Estimated complexity per fix
- Test verification steps
- Cross-system consistency checks per fix

## 8. Files to Audit (Complete List)

### Hardware & Config

- `src/data/hardwareSpecs.ts`
- `src/data/dgxLayouts.ts`
- `src/utils/clusterFactory.ts`

### Data Files

- `src/data/examQuestions.json`
- `src/data/quizQuestions.json`
- `src/data/explanationGates.json`
- `src/data/narrativeScenarios.json`
- `src/data/commandFamilies.json`
- `src/data/toolMasteryQuestions.json`
- `src/data/xidDrillQuestions.json`
- `src/data/xidErrors.ts`
- `src/data/faultDescriptions.ts`
- `src/data/faultPropagationRules.ts`
- `src/data/consequenceRules.ts`
- `src/data/incidentTemplates.ts`

### Simulators (23 files)

- `src/simulators/BaseSimulator.ts`
- `src/simulators/CommandInterceptor.ts`
- `src/simulators/nvidiaSmiSimulator.ts`
- `src/simulators/nvidiaSmiFormatters.ts`
- `src/simulators/dcgmiSimulator.ts`
- `src/simulators/ipmitoolSimulator.ts`
- `src/simulators/infinibandSimulator.ts`
- `src/simulators/mellanoxSimulator.ts`
- `src/simulators/slurmSimulator.ts`
- `src/simulators/nvsmSimulator.ts`
- `src/simulators/fabricManagerSimulator.ts`
- `src/simulators/benchmarkSimulator.ts`
- `src/simulators/containerSimulator.ts`
- `src/simulators/storageSimulator.ts`
- `src/simulators/linuxUtilsSimulator.ts`
- `src/simulators/basicSystemSimulator.ts`
- `src/simulators/pciToolsSimulator.ts`
- `src/simulators/bcmSimulator.ts`
- `src/simulators/cmshSimulator.ts`
- `src/simulators/clusterKitSimulator.ts`
- `src/simulators/nvlinkAuditSimulator.ts`
- `src/simulators/nvidiaBugReportSimulator.ts`
- `src/simulators/nemoSimulator.ts`

### Command Routing

- `src/components/Terminal.tsx`
- `src/cli/commandRouter.ts`
