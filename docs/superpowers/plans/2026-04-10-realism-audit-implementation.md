# Realism Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 25 Critical and 32 High findings from the 2026-04-10 realism audit, plus selected Medium/Low fixes.

**Architecture:** Changes are grouped by file to minimize context-switching. Start with `hardwareSpecs.ts` (the spec source of truth) because simulator and factory fixes downstream depend on correct values there. Then fix `clusterFactory.ts` (UUID, firmware, versions), then data files (XIDs, command syntax), then simulators (output formats, thresholds).

**Tech Stack:** TypeScript, React 18, Zustand, Vite, Vitest

**Reference:** Full findings at `docs/audits/2026-04-10-realism-audit-findings.md`

---

## Phase 1 — Hardware Specs (hardwareSpecs.ts)

These are the highest-stakes changes. Every GPU simulator and benchmark depends on the values here. Fix them first so downstream work uses correct baselines.

---

### Task 1: Fix DGX-H100 specs

**Files:**

- Modify: `src/data/hardwareSpecs.ts`

- [ ] **Step 1: Read the H100 spec block**

Read `src/data/hardwareSpecs.ts` lines 130–181 to confirm current values before editing.

- [ ] **Step 2: Apply H100 corrections**

Apply these changes to the `"DGX-H100"` entry:

```typescript
// baseClockMHz: 1095 → 1590  (SXM5 base, not PCIe value)
baseClockMHz: 1590,
// boostClockMHz: 1830 → 1980  (H100 SXM5 boost consensus)
boostClockMHz: 1980,
// memoryClockMHz: 2619 → 1593  (nvidia-smi reported base, not effective rate)
memoryClockMHz: 1593,
// fp16Tflops: 989 → 1979  (dense, non-sparse)
fp16Tflops: 1979,
// tf32Tflops: 495 → 989  (dense)
tf32Tflops: 989,
// nvSwitchGeneration: "4th Gen" → "3rd Gen"  (NVLink 4.0 but NVSwitch 3rd gen chip)
nvSwitchGeneration: "3rd Gen",
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run -- src/data/__tests__
```

Expected: pass. If HardwareSpec tests fail, update mock values to match new correct values.

- [ ] **Step 4: Commit**

```bash
git add src/data/hardwareSpecs.ts
git commit -m "fix: correct DGX-H100 clock speeds, TFLOPS, NVSwitch generation"
```

---

### Task 2: Fix DGX-H200 specs

**Files:**

- Modify: `src/data/hardwareSpecs.ts`

- [ ] **Step 1: Apply H200 corrections**

Apply to `"DGX-H200"` entry:

```typescript
// fp16Tflops: 989 → 1979
fp16Tflops: 1979,
// tf32Tflops: 495 → 989
tf32Tflops: 989,
// baseClockMHz: 1095 → 1590
baseClockMHz: 1590,
// boostClockMHz: 1830 → 1980
boostClockMHz: 1980,
// memoryClockMHz: 2619 → 1313  (HBM3e effective, nvidia-smi reports this)
memoryClockMHz: 1313,
// hcaCount: 8 → 10  (8 compute OSFP + 2 QSFP112 management/storage)
hcaCount: 10,
// hcasPerGpu: 1 → 1.25  (10 HCAs / 8 GPUs)
hcasPerGpu: 1.25,
// interNodeBandwidthGBs: 50 → 62.5  (10 x NDR 400Gb/s = 500 Gb/s / 8 = 62.5 GB/s per GPU)
interNodeBandwidthGBs: 62.5,
// NVSwitch gen: same as H100 — "3rd Gen" (H200 uses same Hopper baseboard)
nvSwitchGeneration: "3rd Gen",
```

- [ ] **Step 2: Run tests and commit**

```bash
npm run test:run -- src/data/__tests__
git add src/data/hardwareSpecs.ts
git commit -m "fix: correct DGX-H200 TFLOPS, clocks, HCA count, NVSwitch generation"
```

---

### Task 3: Fix DGX-B200 specs

**Files:**

- Modify: `src/data/hardwareSpecs.ts`

- [ ] **Step 1: Apply B200 corrections**

Apply to `"DGX-B200"` entry:

```typescript
system: {
  // totalGpuMemoryGB: 1536 → 1440  (8 × 180 GB)
  totalGpuMemoryGB: 1440,
},
gpu: {
  // model: "NVIDIA B200-SXM-192GB" → "NVIDIA B200-SXM-180GB"
  model: "NVIDIA B200-SXM-180GB",
  // memoryGB: 192 → 180
  memoryGB: 180,
  // memoryMiB: 196608 → 184320  (180 × 1024)
  memoryMiB: 184320,
  // memoryBandwidthTBs: 8.0 → 7.7  (180GB SKU spec)
  memoryBandwidthTBs: 7.7,
  // fp16Tflops: 1800 → 2250  (dense Tensor Core)
  fp16Tflops: 2250,
  // tf32Tflops: 900 → 1200  (dense)
  tf32Tflops: 1200,
  // fp64Tflops: 45 → 40
  fp64Tflops: 40,
  // smCount: 192 → 148  (74 enabled SMs per die × 2 dies)
  smCount: 148,
  // architecture: "gb100" → "blackwell"  (nvidia-smi reports arch name, not die name)
  architecture: "blackwell",
  // sxmVersion: "SXM5" → "SXM6"
  sxmVersion: "SXM6",
},
```

- [ ] **Step 2: Run tests and commit**

```bash
npm run test:run
git add src/data/hardwareSpecs.ts
git commit -m "fix: correct DGX-B200 memory (180GB), TFLOPS, SM count, architecture, SXM6"
```

---

### Task 4: Restructure DGX-GB200 entry

**Files:**

- Modify: `src/data/hardwareSpecs.ts`

The "DGX-GB200" entry is architecturally wrong (modeled as 8-GPU box; actual product is NVL72 rack). The safest fix without requiring a UI restructure is to retarget this entry as a second B200 variant representing the NVL72 per-tray profile — or rename to a more honest placeholder. Discuss with the user which approach is preferred.

**Recommended approach:** Rename the entry to represent what the simulator actually implements (an 8-GPU Blackwell system) and correct the specs to match the B200, but label it distinctly. See findings Section 2.5 for details.

- [ ] **Step 1: Confirm approach with team before implementing**

The decision between (a) modeling a single NVL72 tray, (b) restructuring as DGX B200 NVL8, or (c) leaving as a speculative GB200 with corrected values has product implications. Flag for team review before changing SystemType keys.

- [ ] **Step 2: Apply spec corrections regardless of naming**

At minimum, correct these values in the `"DGX-GB200"` entry (same B200 corrections as Task 3, plus):

```typescript
// generation: "Blackwell Ultra" → "Blackwell"  (Blackwell Ultra = B300/GB300)
generation: "Blackwell",
// smCount: 192 → 148
smCount: 148,
// architecture: "gb202" → "blackwell"
architecture: "blackwell",
// sxmVersion: "SXM5" → "SXM6"
sxmVersion: "SXM6",
// fp64Tflops: 56 → 40
fp64Tflops: 40,
// nvSwitchCount: 2 → 4  (B200-based NVL systems have 4 NVSwitches)
nvSwitchCount: 4,
// nvSwitchGeneration: "5th Gen" → "5th Gen"  (correct — keep)
// tdpWatts: 1200 → 1000  (DGX B200 8-GPU box TDP)
tdpWatts: 1000,
```

- [ ] **Step 3: Run tests and commit**

```bash
npm run test:run
git add src/data/hardwareSpecs.ts
git commit -m "fix: correct DGX-GB200 specs (Blackwell generation, SM count, SXM6, NVSwitch)"
```

---

### Task 5: Fix DGX-VR200 specs

**Files:**

- Modify: `src/data/hardwareSpecs.ts`

The "DGX-VR200" product name doesn't exist. The real products are "DGX Vera Rubin NVL72" and "DGX Rubin NVL8". Correct the spec values regardless of naming.

- [ ] **Step 1: Apply VR200 corrections**

```typescript
// cpu: change Vera to Intel for NVL8 representation
// OR keep Vera if modeling NVL72 — team decision needed
// For NVL8: model: "Intel Xeon 6776P", sockets: 2, coresPerSocket: 64

// smCount: 256 → 224
smCount: 224,
// nvSwitchCount: 2 → 4  (DGX Rubin NVL8)
nvSwitchCount: 4,
// protocol: "XDR2" → "XDR"  (ConnectX-9 is XDR, not "XDR2")
protocol: "XDR",
// portRateGbs: 1600 → 800  (ConnectX-9 SuperNIC: 800Gb/s per port)
portRateGbs: 800,
// interNodeBandwidthGBs: 200 → 100  (800Gb/s = 100 GB/s)
interNodeBandwidthGBs: 100,
// fp16Tflops: 1800 → 8000  (estimated from FP8 ~16000; placeholder until official release)
fp16Tflops: 8000,
// tf32Tflops: 900 → 4000
tf32Tflops: 4000,
// tdpWatts: 1500 → 1800  (industry estimates)
tdpWatts: 1800,
```

- [ ] **Step 2: Run tests and commit**

```bash
npm run test:run
git add src/data/hardwareSpecs.ts
git commit -m "fix: correct DGX-VR200 specs (SM count, NVSwitch, ConnectX-9 XDR, FP16)"
```

---

### Task 6: Add A100 memory bandwidth precision

**Files:**

- Modify: `src/data/hardwareSpecs.ts`

- [ ] **Step 1: Apply**

```typescript
// DGX-A100: memoryBandwidthTBs: 2.0 → 2.039
memoryBandwidthTBs: 2.039,
```

- [ ] **Step 2: Commit**

```bash
git add src/data/hardwareSpecs.ts
git commit -m "fix: A100 memory bandwidth 2.0 → 2.039 TB/s"
```

---

## Phase 2 — Cluster Factory (clusterFactory.ts)

---

### Task 7: Fix GPU UUID generation

**Files:**

- Modify: `src/utils/clusterFactory.ts`
- Test: `src/utils/__tests__/clusterFactory.test.ts` (if exists) or `src/simulators/__tests__/`

- [ ] **Step 1: Read the current UUID generator**

Read `src/utils/clusterFactory.ts` lines 80–88.

- [ ] **Step 2: Replace with UUID v4 format**

Replace the `generateUUID()` function:

```typescript
function generateUUID(): string {
  const hex = () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
  const hex2 = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, "0");
  return `GPU-${hex()}-${hex2()}-${hex2()}-${hex2()}-${hex()}${hex2()}`;
}
```

This generates `GPU-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (lowercase, full UUID v4 format).

- [ ] **Step 3: Run tests and verify no UUID-dependent tests break**

```bash
npm run test:run
```

If tests assert specific UUID patterns, update the assertions to match the new full-UUID format.

- [ ] **Step 4: Commit**

```bash
git add src/utils/clusterFactory.ts
git commit -m "fix: GPU UUIDs now use full UUID v4 format (GPU-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
```

---

### Task 8: Fix BlueField DPU device IDs per system generation

**Files:**

- Modify: `src/utils/clusterFactory.ts`

- [ ] **Step 1: Read the createBlueFieldDPU function**

Read `src/utils/clusterFactory.ts` lines 134–150.

- [ ] **Step 2: Make DPU device path depend on system generation**

The `createDGXNode` function already knows `systemType`. Pass it to `createBlueFieldDPU`:

```typescript
function createBlueFieldDPU(id: number, systemType: SystemType): BlueFieldDPU {
  // BF-2 (mt41686) for Ampere; BF-3 (mt41692) for Hopper+
  const isBF3 = systemType !== "DGX-A100";
  const deviceId = isBF3 ? "mt41692" : "mt41686";
  const firmwareVersion = isBF3 ? "24.35.2000" : "24.26.1610";
  return {
    id,
    pciAddress: `0000:${(0xa0 + id).toString(16)}:00.0`,
    devicePath: `/dev/mst/${deviceId}_pciconf${id}`,
    firmwareVersion,
    // ... rest unchanged
  };
}
```

Update the call in `createDGXNode`:

```typescript
dpus: Array.from({ length: 2 }, (_, i) => createBlueFieldDPU(i, systemType)),
```

- [ ] **Step 3: Run tests and commit**

```bash
npm run test:run
git add src/utils/clusterFactory.ts
git commit -m "fix: BlueField DPU device ID — BF-2 (mt41686) for A100, BF-3 (mt41692) for Hopper+"
```

---

### Task 9: Fix ConnectX-8 firmware major version and Rubin/Blackwell Ultra driver versions

**Files:**

- Modify: `src/utils/clusterFactory.ts`

- [ ] **Step 1: Fix HCA firmware for ConnectX-8**

In `createInfiniBandHCA`, change:

```typescript
// ConnectX-8: "32.41.1000" → "40.48.1000"  (CX-8 uses major version 40)
specs.network.hcaModel === "ConnectX-8"
  ? "40.48.1000"
```

- [ ] **Step 2: Fix driver/CUDA versions for Blackwell Ultra and Rubin**

In `driverVersions`:

```typescript
// Blackwell Ultra: "565.47.01" → "565.57.01" (real driver; CUDA 12.8 requires R570 actually)
// Use the real driver version for CUDA 12.6 for now, or update to R570+CUDA12.8
"Blackwell Ultra": { driver: "565.57.01", cuda: "12.7" },
// Rubin: "570.10.01" / "13.0" → real R580 driver for CUDA 13.0 (TBD until released)
// Safest: use R570 with CUDA 12.8 which is the newest verifiable pairing
"Rubin": { driver: "570.86.15", cuda: "12.8" },
```

- [ ] **Step 3: Fix BMC MAC OUI**

In `createBMC`:

```typescript
// macAddress: `00:0a:f7:...` (Broadcom OUI) → NVIDIA/Mellanox OUI
macAddress: `b8:ce:f6:${nodeId.toString(16).padStart(2, "0")}:00:01`,
```

- [ ] **Step 4: Run tests and commit**

```bash
npm run test:run
git add src/utils/clusterFactory.ts
git commit -m "fix: CX-8 firmware major version (40.x), BMC MAC OUI, driver version strings"
```

---

## Phase 3 — XID Error Codes (xidErrors.ts)

---

### Task 10: Fix XID 54, 62, 63 (Critical — wrong descriptions)

**Files:**

- Modify: `src/data/xidErrors.ts`
- Read: `docs/audits/2026-04-10-realism-audit-findings.md` Section 3.4 for correct values

- [ ] **Step 1: Read the XID error entries**

Read `src/data/xidErrors.ts` and find entries for XIDs 43, 54, 62, 63.

- [ ] **Step 2: Fix XID 54**

Current: "Hardware Watchdog Timeout"
Correct:

```typescript
{
  code: 54,
  name: "Auxiliary Power Connector Not Connected",
  severity: "Critical",
  category: "Hardware",
  description: "GPU auxiliary power connector is not fully connected or not connected at all.",
  cause: "Missing or loose PCIe power cable connection to the GPU.",
  remediation: "Power off the system, reseat the auxiliary power connector on the GPU, and ensure it clicks into place. If problem persists, inspect the cable and PSU.",
}
```

- [ ] **Step 3: Fix XID 62**

Current: "Spurious Host Interrupt" (informational)
Correct:

```typescript
{
  code: 62,
  name: "PMU Halt Error",
  severity: "Critical",
  category: "Hardware",
  description: "Power Management Unit (PMU) has halted. GPU is in an unrecoverable error state.",
  cause: "Firmware crash in the GPU PMU. Can result from hardware fault, overclocking, or firmware bug.",
  remediation: "Full system power cycle required (cold boot). If persistent, RMA the GPU. Collect nvidia-bug-report.sh before rebooting.",
}
```

- [ ] **Step 4: Fix XID 63**

Current: "Row Remapping Failure"
Correct (note: XID 63 = SUCCESS, XID 64 = FAILURE):

```typescript
{
  code: 63,
  name: "Row Remapping Success",
  severity: "Informational",
  category: "Memory",
  description: "A memory row has been successfully remapped to a spare row. GPU memory health is maintained.",
  cause: "Single-bit ECC errors accumulated on a memory row triggered the row retirement process.",
  remediation: "No immediate action required. Monitor via nvidia-smi --query-gpu=retired_pages.count. Schedule maintenance if retired page count grows rapidly.",
}
```

- [ ] **Step 5: Fix XID 43 severity**

Current: severity='Critical', category='Hardware'
Correct: severity='Warning', category='Application' (GPU application fault, GPU remains healthy)

```typescript
{
  code: 43,
  severity: "Warning",
  category: "Application",
  // description/cause/remediation should indicate this is an application-level fault
}
```

- [ ] **Step 6: Run tests and commit**

```bash
npm run test:run -- src/data/__tests__
git add src/data/xidErrors.ts
git commit -m "fix: XID 54 (power connector), XID 62 (PMU Halt), XID 63 (row remap success), XID 43 (application severity)"
```

---

### Task 11: Fix XID 64, 72, 76 descriptions (High/Medium)

**Files:**

- Modify: `src/data/xidErrors.ts`

- [ ] **Step 1: Read entries for XIDs 64, 72, 76**

- [ ] **Step 2: Fix XID 64**

Current: "threshold exceeded"
Correct:

```typescript
{
  code: 64,
  name: "Row Remapping Failure",
  severity: "Critical",
  category: "Memory",
  description: "Failed to record a row-remapping entry in the INFOROM. The remapping table may be full or INFOROM is corrupted.",
  cause: "Too many retired pages or INFOROM write failure.",
  remediation: "Reboot the system immediately. Run nvidia-smi --query-remapped-rows to assess extent. If INFOROM is corrupted, RMA the GPU.",
}
```

- [ ] **Step 3: Fix XID 72 name**

Current: "NVLink Flow Control Error"
Correct: `name: "ROBUST_CHANNEL_CE5_ERROR"` — Copy Engine 5 error, not NVLink.

- [ ] **Step 4: Fix XID 76 name**

Current: "NVLink Training Error"
Correct: `name: "ROBUST_CHANNEL_CE7_ERROR"` — Copy Engine 7 error, not NVLink.

- [ ] **Step 5: Commit**

```bash
git add src/data/xidErrors.ts
git commit -m "fix: XID 64 (row remap failure), XID 72/76 (Copy Engine errors, not NVLink)"
```

---

## Phase 4 — Data File Command Syntax

---

### Task 12: Fix command syntax errors in data files

**Files:**

- Modify: `src/data/explanationGates.json`
- Modify: `src/data/examQuestions.json`
- Modify: `src/data/narrativeScenarios.json`

- [ ] **Step 1: Fix `pci.link` → `pcie.link` in explanationGates.json**

Find: `pci.link.gen.current` and `pci.link.width.current`
Replace with: `pcie.link.gen.current` and `pcie.link.width.current`

Search: `grep -n "pci\.link" src/data/explanationGates.json`

- [ ] **Step 2: Fix `dcgmi health -c` description in narrativeScenarios.json**

Find hint text that says "dcgmi health -c configures watches"
Replace with: "dcgmi health -c checks the current health status"
Add: "To configure what DCGM watches, use: dcgmi health -s <subsystems>"

Search: `grep -n "configures watches" src/data/narrativeScenarios.json`

- [ ] **Step 3: Fix `dcgmi diag -r 4` in examQuestions.json**

Find the question referencing `-r 4` as a valid level.
Change the answer explanation to note that only levels 1, 2, 3 exist.

Search: `grep -n "\-r 4" src/data/examQuestions.json`

- [ ] **Step 4: Fix `ipmitool power status` → `ipmitool chassis power status`**

Search: `grep -n "ipmitool power status" src/data/narrativeScenarios.json src/data/examQuestions.json`
Replace all occurrences with `ipmitool chassis power status`

- [ ] **Step 5: Fix `ibportstate -R` → `ibportstate <lid> <port> reset`**

Search: `grep -n "ibportstate -R" src/data/examQuestions.json`
Update the correct answer and its explanation.

- [ ] **Step 6: Fix `--mode 2` → `--run 2` for dcgmi diag**

Search: `grep -n "\-\-mode 2" src/data/examQuestions.json`

- [ ] **Step 7: Fix `mlxlink -d mlx5_0` → use MST device path**

Search: `grep -rn "mlxlink -d mlx5_0" src/data/`
Update to: `mlxlink -d /dev/mst/mt4123_pciconf0 -p 1 -c` (or system-appropriate path)

- [ ] **Step 8: Run tests and commit**

```bash
npm run test:run
git add src/data/explanationGates.json src/data/examQuestions.json src/data/narrativeScenarios.json
git commit -m "fix: command syntax errors — pcie.link, dcgmi health, ibportstate, ipmitool chassis, mlxlink MST path"
```

---

## Phase 5 — Simulator Output Formats

---

### Task 13: Fix nvidia-smi temperature thresholds (per GPU model)

**Files:**

- Modify: `src/simulators/nvidiaSmiFormatters.ts`

- [ ] **Step 1: Read the temperature threshold section**

Read `src/simulators/nvidiaSmiFormatters.ts` lines 55–75.

- [ ] **Step 2: Replace hardcoded thresholds with per-GPU values**

Add a threshold lookup by GPU architecture:

```typescript
function getThermalThresholds(gpuType: string): {
  shutdown: number;
  slowdown: number;
  maxOp: number;
} {
  if (gpuType.includes("H100") || gpuType.includes("H200")) {
    return { shutdown: 95, slowdown: 90, maxOp: 83 };
  }
  if (gpuType.includes("B200") || gpuType.includes("GB200")) {
    return { shutdown: 95, slowdown: 90, maxOp: 83 };
  }
  // A100 default
  return { shutdown: 92, slowdown: 89, maxOp: 85 };
}
```

Replace the three hardcoded values (90, 85, 83) in the formatter with calls to this function.

- [ ] **Step 3: Fix ECC "N/A" → "0" for datacenter GPUs**

Find the ECC column output. When a GPU has ECC enabled and zero errors, output `"0"` not `"N/A"`. `"N/A"` is only correct when ECC is unsupported (consumer GPUs).

- [ ] **Step 4: Run tests and commit**

```bash
npm run test:run -- src/simulators/__tests__/nvidiaSmi
git add src/simulators/nvidiaSmiFormatters.ts src/simulators/nvidiaSmiSimulator.ts
git commit -m "fix: nvidia-smi temperature thresholds per GPU model; ECC 0 not N/A for datacenter GPUs"
```

---

### Task 14: Fix dcgmi discovery -l bordered table format

**Files:**

- Modify: `src/simulators/dcgmiSimulator.ts`

- [ ] **Step 1: Read the discovery -l handler**

Read `src/simulators/dcgmiSimulator.ts` around lines 415–429.

- [ ] **Step 2: Replace flat text with bordered table format**

The output should follow the DCGM bordered table pattern already used by other subcommands:

```
8 GPU(s) found.
+--------+-------------------------------------------------------------------+
| GPU ID | Device Information                                                |
+--------+-------------------------------------------------------------------+
| 0      | Name: NVIDIA H100 80GB HBM3                                       |
|        | PCI Bus ID: 00000000:07:00.0                                      |
|        | Device UUID: GPU-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx             |
+--------+-------------------------------------------------------------------+
| 1      | Name: NVIDIA H100 80GB HBM3                                       |
| ...
```

- [ ] **Step 3: Fix health check thermal threshold inconsistency**

At line 533, change `gpu.temperature > 80` to use the same threshold as the policy display (`> 83` for H100, or `> specs.thermalThrottle`).

- [ ] **Step 4: Run tests and commit**

```bash
npm run test:run -- src/simulators/__tests__/dcgmi
git add src/simulators/dcgmiSimulator.ts
git commit -m "fix: dcgmi discovery -l uses bordered table format; health thermal threshold consistency"
```

---

### Task 15: Fix slurmSimulator GRES to use actual GPU model

**Files:**

- Modify: `src/simulators/slurmSimulator.ts`

- [ ] **Step 1: Read the GRES output lines**

Search: `grep -n "gpu:h100" src/simulators/slurmSimulator.ts`

- [ ] **Step 2: Replace hardcoded `gpu:h100` with dynamic model**

The file already imports `getHardwareSpecs`. Add a helper to derive the GRES GPU type:

```typescript
function getGresGpuType(node: DGXNode): string {
  const gpuModelMap: Record<string, string> = {
    "DGX-A100": "a100",
    "DGX-H100": "h100",
    "DGX-H200": "h200",
    "DGX-B200": "b200",
    "DGX-GB200": "gb200",
    "DGX-VR200": "r200",
  };
  return gpuModelMap[node.systemType] || "gpu";
}
```

Replace all `gpu:h100:8` and `gpu:h100:${...}` references with `gpu:${getGresGpuType(node)}:8`.

- [ ] **Step 3: Fix timestamps to use current date**

Replace `2024-01-10T08:00:00` and related hardcoded dates with:

```typescript
const now = new Date();
const bootTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // ~30 days ago
const bootStr = bootTime.toISOString().replace("T", "T").slice(0, 19);
```

- [ ] **Step 4: Run tests and commit**

```bash
npm run test:run -- src/simulators/__tests__/slurm
git add src/simulators/slurmSimulator.ts
git commit -m "fix: slurmSimulator GRES GPU type derived from node.systemType; timestamps use current date"
```

---

## Phase 6 — Version String Cross-Consistency

---

### Task 16: Fix Fabric Manager and nvidia-bug-report driver version fallbacks

**Files:**

- Modify: `src/simulators/fabricManagerSimulator.ts`
- Modify: `src/simulators/nvidiaBugReportSimulator.ts`
- Modify: `src/data/output/containers/nvidia-container-cli.json`

- [ ] **Step 1: Fix fabricManagerSimulator fallback version**

Find the hardcoded `"535.104.05"` fallback (lines 53, 135).
Replace with `node?.nvidiaDriverVersion ?? "535.129.03"` to fall back to the clusterFactory canonical Ampere version.

- [ ] **Step 2: Fix nvidiaBugReportSimulator fallback version**

Same fix — find `"535.104.05"` fallbacks, replace with dynamic node version or `"535.129.03"`.

- [ ] **Step 3: Fix nvidia-container-cli.json**

Read the file, find all `"535.104.12"` references, replace with `"535.129.03"`.

- [ ] **Step 4: Run tests and commit**

```bash
npm run test:run
git add src/simulators/fabricManagerSimulator.ts src/simulators/nvidiaBugReportSimulator.ts
git add src/data/output/containers/nvidia-container-cli.json
git commit -m "fix: align fabricManager, nvidiaBugReport, container-cli driver versions to 535.129.03"
```

---

### Task 17: Fix linuxUtilsSimulator CUDA paths to use node.cudaVersion

**Files:**

- Modify: `src/simulators/linuxUtilsSimulator.ts`

- [ ] **Step 1: Find CUDA 12.2 hardcoded paths**

```bash
grep -n "12\.2" src/simulators/linuxUtilsSimulator.ts | head -30
```

- [ ] **Step 2: Replace with dynamic version**

The simulator should have access to `node.cudaVersion`. Replace `"12.2"` in CUDA paths:

```typescript
const cudaVersion = node?.cudaVersion ?? "12.2";
const cudaLib = cudaVersion.replace(".", ".");
// e.g., CUDA_HOME=/usr/local/cuda-${cudaVersion}
// e.g., libcudart.so.${cudaVersion}.140
```

- [ ] **Step 3: Sync DCGM package version with dcgmiSimulator**

Find `"3.1.8"` in linuxUtilsSimulator (dpkg output) and `"3.1.3"` in dcgmiSimulator. Canonicalize both to `"3.3.5"` (current DCGM version as of 2026).

- [ ] **Step 4: Sync Slurm version (syslog 23.02.7 vs scontrol 23.02.6)**

Change `linuxUtilsSimulator` syslog line from `23.02.7` to match `slurmSimulator`'s `23.02.6` (or update both to `23.11.7`).

- [ ] **Step 5: Run tests and commit**

```bash
npm run test:run
git add src/simulators/linuxUtilsSimulator.ts src/simulators/dcgmiSimulator.ts
git commit -m "fix: linuxUtils CUDA paths use node.cudaVersion; DCGM and Slurm version consistency"
```

---

## Phase 7 — Benchmark Scaling

---

### Task 18: Fix benchmark NCCL and HPL hardcoded values

**Files:**

- Modify: `src/simulators/benchmarkSimulator.ts`

- [ ] **Step 1: Read the NCCL and HPL benchmark sections**

Read around lines 399, 673, 1015 of `src/simulators/benchmarkSimulator.ts`.

- [ ] **Step 2: Add system-type-aware bandwidth table**

Replace the 280–300 GB/s NCCL hardcode with:

```typescript
const ncclBaselineBandwidthGBs: Record<SystemType, number> = {
  "DGX-A100": 240,
  "DGX-H100": 380,
  "DGX-H200": 380,
  "DGX-B200": 760,
  "DGX-GB200": 760,
  "DGX-VR200": 1520,
};
```

- [ ] **Step 3: Fix HPL TFLOPS**

Replace 450–500 TFLOPS hardcode with:

```typescript
const hplBaselineTflops: Record<SystemType, number> = {
  "DGX-A100": 135,
  "DGX-H100": 240,
  "DGX-H200": 240,
  "DGX-B200": 312,
  "DGX-GB200": 312,
  "DGX-VR200": 500,
};
```

- [ ] **Step 4: Fix gpu-burn output format**

Current: progress bar + per-GPU pass/fail
Correct format per real gpu-burn:

```
GPU 0: 93% proc'd: 4096 (8192) - 26251.1 Gflop/s - temp: 74C [OK]
GPU 1: 93% proc'd: 4096 (8192) - 26189.3 Gflop/s - temp: 76C [OK]
```

- [ ] **Step 5: Run tests and commit**

```bash
npm run test:run -- src/simulators/__tests__/benchmark
git add src/simulators/benchmarkSimulator.ts
git commit -m "fix: benchmark NCCL/HPL values per system type; gpu-burn output format matches real tool"
```

---

## Phase 8 — Medium Priority Remaining

---

### Task 19: Fix nvidia-smi topo -m missing legend

**Files:**

- Modify: `src/simulators/nvidiaSmiSimulator.ts`

- [ ] **Step 1: Find topo -m output block**

Search: `grep -n "topo -m\|topo.*matrix" src/simulators/nvidiaSmiSimulator.ts | head -10`

- [ ] **Step 2: Append legend after matrix**

Add after the matrix output:

```
Legend:

  X    = Self
  SYS  = Connection traversing PCIe as well as the SMP interconnect between NUMA nodes (e.g., QPI/UPI)
  NODE = Connection traversing PCIe as well as the interconnect between PCIe Host Bridges within a NUMA node
  PHB  = Connection traversing PCIe as well as a PCIe Host Bridge (typically the CPU)
  PXB  = Connection traversing multiple PCIe bridges (without traversing the PCIe Host Bridge)
  PIX  = Connection traversing at most a single PCIe bridge
  NV#  = Connection traversing a bonded set of # NVLinks
```

- [ ] **Step 3: Fix reserved memory inconsistency (-q vs -d MEMORY)**

Canonicalize reserved memory calculation to a single formula (use the `2% of total` formula from nvidiaSmiFormatters.ts).

- [ ] **Step 4: Commit**

```bash
git add src/simulators/nvidiaSmiSimulator.ts
git commit -m "fix: nvidia-smi topo -m legend; reserved memory consistency"
```

---

### Task 20: Fix H100 NVSwitch topology in dgxLayouts.ts

**Files:**

- Modify: `src/data/dgxLayouts.ts`

- [ ] **Step 1: Read the H100 NVSwitch connectivity block**

Read `src/data/dgxLayouts.ts` lines 119–124.

- [ ] **Step 2: Verify all 4 NVSwitches connect to all 8 GPUs**

The H100 uses 4 NVSwitches but each NVSwitch connects to ALL 8 GPUs (true full-mesh, not a ring). Update if the layout shows partitioned connectivity:

```typescript
// Each NVSwitch connects to all 8 GPUs
nvSwitches: [
  { id: 0, connectedGpus: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 1, connectedGpus: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 2, connectedGpus: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 3, connectedGpus: [0, 1, 2, 3, 4, 5, 6, 7] },
],
```

- [ ] **Step 3: Commit**

```bash
git add src/data/dgxLayouts.ts
git commit -m "fix: H100 NVSwitch topology — all 4 NVSwitches connect to all 8 GPUs (full mesh)"
```

---

## Testing Checkpoint

After all tasks, run the full suite to catch regressions:

```bash
npm run test:run
npm run lint
npm run build
```

Expected: All tests pass, 0 lint errors, clean build.

---

## Deferred / Team Decision Required

The following items require input before implementation:

1. **DGX-GB200 naming strategy** — Rename to model the actual DGX B200 NVL8? Or restructure as NVL72 rack system? Affects SystemType enum and all downstream consumers.

2. **DGX-VR200 CPU assignment** — NVL8 uses Intel Xeon 6776P; NVL72 uses Vera. Decision determines which product line this entry represents.

3. **DGX-GB200 GPU count** — If keeping as 8-GPU representation, the `gpu.count = 8` is acceptable. If restructuring as NVL72, this becomes 72 which breaks the simulator architecture fundamentally.

4. **Slurm version bump** — Update to 23.11.x/24.05.x across the board, or keep 23.02.x since it's in the test data and more widely deployed in legacy clusters?

---

## Fix Complexity Summary

| Task  | Severity Addressed                       | Complexity                | Risk                         |
| ----- | ---------------------------------------- | ------------------------- | ---------------------------- |
| 1-6   | 25 Critical (hardware specs)             | Low — data only           | Low                          |
| 7     | Medium (UUID format)                     | Low                       | Medium — tests need updating |
| 8     | High (BF DPU device IDs)                 | Low                       | Low                          |
| 9     | High (firmware, driver versions)         | Low                       | Low                          |
| 10-11 | 7 Critical/High (XIDs)                   | Low — data only           | Low                          |
| 12    | High (command syntax)                    | Low — data search/replace | Low                          |
| 13    | High (thermal thresholds, ECC)           | Medium                    | Medium                       |
| 14    | High (dcgmi discovery format)            | Medium                    | Low                          |
| 15    | High (GRES, timestamps)                  | Medium                    | Low                          |
| 16    | Medium (driver version consistency)      | Low                       | Low                          |
| 17    | Medium (CUDA paths, DCGM/Slurm versions) | Medium                    | Low                          |
| 18    | High (benchmark values, gpu-burn format) | Medium                    | Low                          |
| 19-20 | Medium (legend, topology)                | Low                       | Low                          |
