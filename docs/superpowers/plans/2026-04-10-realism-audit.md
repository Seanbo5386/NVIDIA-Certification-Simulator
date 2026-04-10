# Realism Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit every hardcoded value, output format, command syntax, version string, and behavioral formula in the DC Lab Simulator for accuracy against official documentation, producing a prioritized findings report.

**Architecture:** Layer-by-layer verification starting from the hardware spec foundation, then data files, simulator outputs, benchmarks, fault systems, and cluster factory. Cross-system consistency checks run throughout. Each task produces findings in a structured format that gets compiled into the final report.

**Tech Stack:** Web research against official NVIDIA/Slurm/Linux/Docker documentation. No code changes — research and documentation only.

**Findings Output File:** `docs/audits/2026-04-10-realism-audit-findings.md`

---

## Phase 1: Foundation — Hardware Specs & Version Compatibility

### Task 1: Audit DGX-A100 GPU & System Specs

**Files:**

- Audit: `src/data/hardwareSpecs.ts:77-128` (DGX-A100 block)

**Official Sources:**

- NVIDIA DGX A100 System Data Sheet
- NVIDIA A100 Tensor Core GPU Datasheet

- [ ] **Step 1: Read the DGX-A100 spec block**

Read `src/data/hardwareSpecs.ts` lines 77-128. Record every value:

- GPU: model name, count, memoryGB, memoryMiB, memoryType, bandwidthTBs, tdpWatts, baseClockMHz, boostClockMHz, computeCapability, pciDeviceId, eccSupported
- NVLink: version, linksPerGpu, perLinkBandwidthGBs, totalBandwidthGBs, nvSwitchCount, nvSwitchGeneration
- Network: hcaModel, hcaCount, protocol, portRateGbs, interNodeBandwidthGbps
- CPU: model, sockets, coresPerSocket, systemMemoryGB
- Storage: osDrives, dataDrives, totalCapacityTB

- [ ] **Step 2: Web search for official A100 specs**

Search for: "NVIDIA DGX A100 datasheet specifications" and "NVIDIA A100 SXM4 80GB specifications"

Verify each value against the official datasheet:

- A100-SXM4-80GB: 80GB HBM2e, 2039 GB/s bandwidth, 400W TDP, 1095 MHz base / 1410 MHz boost, compute capability 8.0, PCI ID 20B2
- NVLink 3.0: 12 links per GPU, 50 GB/s per link (bidirectional), 600 GB/s total, 6 NVSwitch (3rd gen)
- Network: 8x ConnectX-6, HDR 200Gb/s per port, 1600 Gb/s total
- CPU: 2x AMD EPYC 7742, 64 cores each (128 total), 2TB system memory
- Storage: 2x 1.92TB NVMe OS, 4x 3.84TB NVMe data, ~30TB total

- [ ] **Step 3: Record findings**

For each value that doesn't match, record in this format:

```
### [SEVERITY] DGX-A100: <description>
- **File:** src/data/hardwareSpecs.ts:<line>
- **Current Value:** <what code says>
- **Correct Value:** <what datasheet says>
- **Source:** <URL or doc name>
- **Impact:** <how this affects training accuracy>
```

- [ ] **Step 4: Commit progress**

Append findings to `docs/audits/2026-04-10-realism-audit-findings.md` and commit:

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: DGX-A100 hardware spec findings"
```

---

### Task 2: Audit DGX-H100 GPU & System Specs

**Files:**

- Audit: `src/data/hardwareSpecs.ts:130-181` (DGX-H100 block)

**Official Sources:**

- NVIDIA DGX H100 System Data Sheet
- NVIDIA H100 Tensor Core GPU Datasheet

- [ ] **Step 1: Read the DGX-H100 spec block**

Read `src/data/hardwareSpecs.ts` lines 130-181. Record every value for GPU, NVLink, Network, CPU, Storage sections.

- [ ] **Step 2: Web search for official H100 specs**

Search for: "NVIDIA DGX H100 datasheet specifications" and "NVIDIA H100 SXM5 80GB specifications"

Verify each value:

- H100-SXM5-80GB: 80GB HBM3, 3350 GB/s bandwidth, 700W TDP, 1095 MHz base / 1830 MHz boost (verify these), compute capability 9.0, PCI ID 2330
- NVLink 4.0: 18 links per GPU, 50 GB/s per link (bidirectional), 900 GB/s total, 4 NVSwitch (4th gen)
- Network: 8x ConnectX-7, NDR 400Gb/s per port, 3200 Gb/s total
- CPU: 2x Intel Xeon 8480C (Sapphire Rapids), 56 cores each (112 total), 2TB system memory
- Storage: verify against DGX H100 data sheet

- [ ] **Step 3: Record findings**

Same format as Task 1 Step 3. Append to findings file.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: DGX-H100 hardware spec findings"
```

---

### Task 3: Audit DGX-H200 GPU & System Specs

**Files:**

- Audit: `src/data/hardwareSpecs.ts:183-234` (DGX-H200 block)

**Official Sources:**

- NVIDIA DGX H200 announcement / data sheet
- NVIDIA H200 Tensor Core GPU Datasheet

- [ ] **Step 1: Read the DGX-H200 spec block**

Read `src/data/hardwareSpecs.ts` lines 183-234. Record every value.

- [ ] **Step 2: Web search for official H200 specs**

Search for: "NVIDIA H200 SXM specifications" and "NVIDIA DGX H200 datasheet"

Verify each value:

- H200-SXM: 141GB HBM3e (verify — some sources say 141GB), 4800 GB/s bandwidth (verify), 700W TDP, compute capability 9.0
- NVLink: Same as H100 (4.0, 18 links, 900 GB/s) — verify this is unchanged
- Network: Same as H100 (8x ConnectX-7, NDR 400Gb/s) — verify
- CPU: Same as H100 (2x Xeon 8480C) — verify
- Key difference from H100 is ONLY the GPU memory upgrade — verify nothing else changed

- [ ] **Step 3: Record findings**

Same format. Append to findings file.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: DGX-H200 hardware spec findings"
```

---

### Task 4: Audit DGX-B200 GPU & System Specs

**Files:**

- Audit: `src/data/hardwareSpecs.ts:236-287` (DGX-B200 block)

**Official Sources:**

- NVIDIA DGX B200 announcement / product brief
- NVIDIA B200 Tensor Core GPU specifications
- GTC 2024/2025 announcements

- [ ] **Step 1: Read the DGX-B200 spec block**

Read `src/data/hardwareSpecs.ts` lines 236-287. Record every value.

- [ ] **Step 2: Web search for official B200 specs**

Search for: "NVIDIA B200 GPU specifications" and "NVIDIA DGX B200 system specifications"

Verify each value:

- B200-SXM: 192GB HBM3e (verify), bandwidth (verify), TDP (verify — expected ~1000W), compute capability (verify — expected 10.0 or similar)
- NVLink 5.0: 18 links per GPU, 50 GB/s per link, 1800 GB/s total (verify per-link bandwidth — may be 100 GB/s per link)
- NVSwitch: 2x 5th-gen NVSwitch (verify count and generation)
- Network: ConnectX-7 (verify — may have upgraded to ConnectX-8)
- CPU: 2x Intel Xeon 8570 (verify model number and core count)

- [ ] **Step 3: Record findings**

Same format. Append to findings file.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: DGX-B200 hardware spec findings"
```

---

### Task 5: Audit DGX-GB200 GPU & System Specs

**Files:**

- Audit: `src/data/hardwareSpecs.ts:289-340` (DGX-GB200 block)

**Official Sources:**

- NVIDIA GB200 NVL72/NVL36 announcements
- NVIDIA Grace Blackwell Superchip specifications
- GTC 2024/2025 announcements

- [ ] **Step 1: Read the DGX-GB200 spec block**

Read `src/data/hardwareSpecs.ts` lines 289-340. Record every value.

- [ ] **Step 2: Web search for official GB200 specs**

Search for: "NVIDIA GB200 Grace Blackwell specifications" and "NVIDIA DGX GB200 system"

Verify each value:

- GB200 GPU memory, bandwidth, TDP
- NVLink 5.0 config (verify — same as B200 or different?)
- Grace CPU: NVIDIA Grace (ARM), 72 cores (verify core count per socket, socket count)
- ConnectX-8: XDR 800Gb/s per port (verify)
- Note: GB200 may primarily be an NVL72 rack-scale system, not a traditional DGX box — verify if "DGX-GB200" is an actual product name

- [ ] **Step 3: Record findings**

Same format. Append to findings file.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: DGX-GB200 hardware spec findings"
```

---

### Task 6: Audit DGX-VR200 (Rubin) GPU & System Specs

**Files:**

- Audit: `src/data/hardwareSpecs.ts:342-393` (DGX-VR200 block)

**Official Sources:**

- NVIDIA Rubin architecture announcements (GTC 2025/2026)
- NVIDIA Vera CPU announcements
- Press releases and keynote transcripts

- [ ] **Step 1: Read the DGX-VR200 spec block**

Read `src/data/hardwareSpecs.ts` lines 342-393. Record every value.

- [ ] **Step 2: Web search for official Rubin/Vera specs**

Search for: "NVIDIA Rubin R200 GPU specifications", "NVIDIA Vera CPU specifications", "NVIDIA DGX Rubin"

Verify what has been officially announced:

- R200 GPU: 288GB HBM4 (verify), bandwidth, TDP
- NVLink 6.0: 18 links, 200 GB/s per link, 3600 GB/s total (verify)
- Vera CPU: ARM-based, core count (88 cores claimed — verify)
- ConnectX-9: XDR2 1600Gb/s (verify — this is speculative)
- Flag any values that are NOT from official NVIDIA sources as "UNVERIFIED — speculative"

- [ ] **Step 3: Record findings**

Same format, but add a "Verification Status" field:

- VERIFIED: Matches official NVIDIA announcement
- PLAUSIBLE: Reasonable extrapolation but not officially confirmed
- UNVERIFIED: No official source found
- INCORRECT: Contradicts official announcement

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: DGX-VR200 (Rubin) hardware spec findings"
```

---

### Task 7: Audit Driver/CUDA/Kernel Version Compatibility

**Files:**

- Audit: `src/utils/clusterFactory.ts:314-320` (driver/CUDA version mapping)
- Audit: `src/utils/clusterFactory.ts:340-341` (OS and kernel version)

**Official Sources:**

- NVIDIA CUDA Toolkit Release Notes (driver compatibility table)
- NVIDIA Driver Release Notes
- Ubuntu kernel support matrix

- [ ] **Step 1: Read the version mapping**

Read `src/utils/clusterFactory.ts` lines 314-341. Record:

- Ampere: driver 535.129.03, CUDA 12.2
- Hopper: driver 550.54.15, CUDA 12.4
- Blackwell: driver 560.35.03, CUDA 12.6
- Blackwell Ultra: driver 565.47.01, CUDA 12.8
- Rubin: driver 570.10.01, CUDA 13.0
- OS: Ubuntu 22.04.3 LTS
- Kernel: 5.15.0-91-generic

- [ ] **Step 2: Web search for CUDA/driver compatibility**

Search for: "NVIDIA CUDA toolkit release notes driver compatibility" and "NVIDIA driver release notes"

Verify each pair:

- Does driver 535.129.03 support CUDA 12.2? (Check CUDA 12.2 release notes)
- Does driver 550.54.15 support CUDA 12.4? (Check CUDA 12.4 release notes)
- Does driver 560.35.03 support CUDA 12.6? (Check CUDA 12.6 release notes)
- Does driver 565.47.01 exist? Does it support CUDA 12.8?
- Does CUDA 13.0 exist yet? What driver would it require?
- Is 5.15.0-91-generic a valid Ubuntu 22.04 kernel?
- Does driver 535.x support kernel 5.15?

- [ ] **Step 3: Check version strings in other files**

Search codebase for these version strings to ensure consistency:

- Search for "535.129" across all files
- Search for "550.54" across all files
- Search for "12.2", "12.4", "12.6" in simulator outputs
- Search for "5.15.0" kernel references
- Note any mismatches between clusterFactory and simulator output

- [ ] **Step 4: Record findings**

Document each version pair with verification status. Flag:

- Pairs where the driver version doesn't exist in NVIDIA's release history
- Pairs where CUDA version requires a different minimum driver
- Kernel/driver incompatibilities
- Cross-file version string inconsistencies

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: driver/CUDA/kernel version compatibility findings"
```

---

### Task 8: Audit Firmware Version Strings

**Files:**

- Audit: `src/utils/clusterFactory.ts:134-198` (DPU and HCA creation)
- Audit: `src/utils/clusterFactory.ts:295-304` (BMC creation)

**Official Sources:**

- Mellanox/NVIDIA firmware release notes
- BlueField DPU firmware documentation
- NVIDIA BMC firmware documentation

- [ ] **Step 1: Read firmware version assignments**

Read `src/utils/clusterFactory.ts` and record:

- DPU firmware: "24.35.2000" (line 139)
- DPU device path: `/dev/mst/mt41692_pciconf${id}` (line 138)
- HCA device IDs: ConnectX-6=mt4123, ConnectX-7=mt4129, ConnectX-8=mt4131, ConnectX-9=mt4133 (lines 177-182)
- HCA firmware versions: CX-9="34.42.1000", CX-8="32.41.1000", CX-7="28.39.1002", CX-6="20.35.1012" (lines 188-195)
- BMC firmware: "3.47.00" (line 299)
- BMC MAC prefix: `00:0a:f7` (line 298)

- [ ] **Step 2: Web search for firmware version formats**

Search for: "Mellanox ConnectX-7 firmware version format" and "NVIDIA BlueField DPU firmware release"

Verify:

- Are the device IDs correct? (mt4123 for CX-6, mt4129 for CX-7, etc.)
- Do firmware version strings follow the correct format (major.minor.build)?
- Are the version numbers plausible for each generation?
- Is the BlueField device ID mt41692 correct?
- Does BMC firmware "3.47.00" follow NVIDIA BMC firmware versioning?
- Is 00:0a:f7 a valid NVIDIA OUI (organizationally unique identifier)?

- [ ] **Step 3: Record findings**

Document each firmware string with verification status.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: firmware version string findings"
```

---

## Phase 2: Data File Accuracy

### Task 9: Audit nvidia-smi Command Syntax in Data Files

**Files:**

- Audit: `src/data/examQuestions.json` — all nvidia-smi references
- Audit: `src/data/explanationGates.json` — all nvidia-smi references
- Audit: `src/data/toolMasteryQuestions.ts` — all nvidia-smi references
- Audit: `src/data/narrativeScenarios.json` — all nvidia-smi expectedCommands

**Official Sources:**

- `nvidia-smi --help` output documentation
- NVIDIA System Management Interface documentation

- [ ] **Step 1: Search all data files for nvidia-smi commands**

Search for every occurrence of `nvidia-smi` in data files. For each occurrence, record:

- File, line number
- Full command string
- Context (correct answer, wrong answer/distracter, explanation, expectedCommand)

- [ ] **Step 2: Verify each command against nvidia-smi documentation**

For each unique command found, verify:

- Flag exists: `-pm`, `-pl`, `-q`, `-i`, `-r`, `-L`, `-c`, `--query-gpu`, `--gpu-reset`, `--mig`, `-mig`, `--compute-mode`, `--power-limit`, `--persistence-mode`
- Flag syntax is correct (e.g., `-pm` takes 0 or 1, not watt values)
- Subcommand exists: `nvlink`, `topo`, `dmon`, `pmon`, `mig`
- Query field names are valid: `driver_version`, `vbios_version`, `memory.total`, `utilization.gpu`, etc.

**Known issues to verify:**

- `-pm 350` and `-pm 300` used as power limit distracters (lines ~151, 2641 in respective files) — these are INCORRECT since `-pm` only takes 0 or 1
- `--tdp` flag — does this exist? (appears as distracter)

- [ ] **Step 3: Record findings**

For each invalid command, record:

- The exact string
- Why it's wrong
- What the correct command would be
- Whether it's a "correct answer" (critical) or "distracter" (high — still teaches wrong syntax)

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: nvidia-smi command syntax findings in data files"
```

---

### Task 10: Audit dcgmi & ipmitool Command Syntax in Data Files

**Files:**

- Audit: All data files for `dcgmi` commands
- Audit: All data files for `ipmitool` commands

**Official Sources:**

- DCGM User Guide (docs.nvidia.com)
- `ipmitool` man page / IPMI specification

- [ ] **Step 1: Search all data files for dcgmi commands**

Search for every occurrence of `dcgmi` in data files. Record file, line, full command, context.

**Known issue to verify:**

- `dcgmi reset -g 0` in explanationGates.json line 356 — verify if `dcgmi reset` is a valid subcommand

- [ ] **Step 2: Verify dcgmi commands**

For each command, verify against DCGM documentation:

- Valid subcommands: `diag`, `discovery`, `health`, `group`, `stats`, `policy`, `config`, `dmon`, `fieldgroup`, `profile`, `topo`, `modules`
- Invalid subcommands: `reset`, `monitor` (verify each)
- Diagnostic levels: `-r 1` (quick), `-r 2` (medium), `-r 3` (long) — verify these exist and names match
- Group flags: `-c` (create), `-d` (delete), `-l` (list), `-a` (add), `-g` (group ID)

- [ ] **Step 3: Search all data files for ipmitool commands**

Search for every occurrence of `ipmitool` in data files. Record file, line, full command, context.

- [ ] **Step 4: Verify ipmitool commands**

For each command, verify against ipmitool man page:

- Valid subcommands: `sensor`, `sel`, `chassis`, `lan`, `sdr`, `fru`, `mc`, `power`, `raw`, `user`, `dcmi`
- Flag syntax for each subcommand
- `sel list` vs `sel elist` distinction (both valid)
- `fru print 0` vs `fru print` (verify FRU ID 0 meaning)

- [ ] **Step 5: Record findings**

Document all invalid commands with corrections.

- [ ] **Step 6: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: dcgmi and ipmitool command syntax findings"
```

---

### Task 11: Audit InfiniBand & Slurm Command Syntax in Data Files

**Files:**

- Audit: All data files for `ibstat`, `ibdiagnet`, `iblinkinfo`, `perfquery` commands
- Audit: All data files for `sinfo`, `squeue`, `scontrol`, `sacct`, `sbatch` commands

**Official Sources:**

- OFED documentation / InfiniBand man pages
- Slurm documentation (schedmd.com)

- [ ] **Step 1: Search all data files for InfiniBand commands**

Search for: `ibstat`, `ibdiagnet`, `iblinkinfo`, `perfquery`, `ibdev2netdev`, `ibnetdiscover`, `ibhosts`, `ibswitches`, `ibping`, `ibtracert`, `ib_write_bw`, `ib_read_bw`, `sminfo`, `smpquery`, `ofed_info`

For each occurrence, record file, line, full command, context.

- [ ] **Step 2: Verify InfiniBand commands**

For each command, verify against OFED documentation:

- Flag syntax (e.g., `ibdiagnet -r` for routing check — is `-r` a valid flag?)
- Command exists (some IB tools have been renamed over OFED versions)
- Output field names match real tool output

- [ ] **Step 3: Search all data files for Slurm commands**

Search for: `sinfo`, `squeue`, `scontrol`, `sacct`, `sacctmgr`, `sbatch`, `srun`, `scancel`

For each occurrence, record file, line, full command, context.

- [ ] **Step 4: Verify Slurm commands**

For each command, verify against Slurm documentation (schedmd.com):

- Flag syntax (e.g., `sinfo -N -l`, `squeue -u $USER`, `scontrol show node`)
- Format string fields (e.g., `sacct --format=JobID,JobName,State,ExitCode`)
- State names: PENDING, RUNNING, COMPLETED, FAILED, TIMEOUT, CANCELLED, NODE_FAIL
- Node states: idle, alloc, mix, drain, down, draining

- [ ] **Step 5: Record findings**

Document all invalid commands with corrections.

- [ ] **Step 6: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: InfiniBand and Slurm command syntax findings"
```

---

### Task 12: Audit XID Error Code Accuracy

**Files:**

- Audit: `src/data/xidErrors.ts:25-486` (all 28 XID codes)
- Audit: `src/data/xidDrillQuestions.ts` (34 quiz questions)

**Official Sources:**

- NVIDIA XID Errors documentation (docs.nvidia.com/deploy/xid-errors)
- NVIDIA GPU Debugging and Troubleshooting Guide

- [ ] **Step 1: Read all XID error definitions**

Read `src/data/xidErrors.ts` lines 25-486. For each of the 28 XID codes, record:

- Code number, name, severity, category
- Description, cause, action items
- Exam relevance flag

- [ ] **Step 2: Web search for official NVIDIA XID error reference**

Search for: "NVIDIA XID errors reference documentation" and navigate to the official XID errors page.

For each code, verify:

- The code number exists in NVIDIA's official list
- The name/description matches NVIDIA's documentation
- The severity classification is appropriate (Critical/Warning/Informational)
- The recommended actions are correct
- The category makes sense (Hardware/Driver/Application/Power/Memory/NVLink/Thermal)

Specific codes to double-check:

- XID 13: Is it Warning or can it be Critical?
- XID 43: Verify exact name and recommended actions
- XID 48: Verify this is specifically "double-bit ECC"
- XID 63: Verify row remapping failure description
- XID 79: Verify "fallen off bus" terminology
- XID 92: Verify this code exists (added in newer drivers)
- XID 94, 95: Verify these exist and descriptions match
- XID 119: Verify GSP error code exists and description

- [ ] **Step 3: Cross-check XID drill questions**

Read `src/data/xidDrillQuestions.ts`. For each question:

- Verify the XID code referenced is correct
- Verify the answer is technically accurate
- Verify the explanation matches the xidErrors.ts definition

- [ ] **Step 4: Record findings**

Document any XID codes that are:

- Missing from the official list
- Misnamed or miscategorized
- Have incorrect severity
- Have wrong or incomplete action items

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: XID error code accuracy findings"
```

---

### Task 13: Audit Remaining Data Files

**Files:**

- Audit: `src/data/quizQuestions.json` (65 questions)
- Audit: `src/data/commandFamilies.json` (6 families, 28 tools)
- Audit: `src/data/narrativeScenarios.json` — scenario workflow realism
- Audit: `src/data/toolMasteryQuestions.ts` — technical claims

**Official Sources:**

- Tool-specific man pages and documentation (as needed per finding)

- [ ] **Step 1: Audit quizQuestions.json**

Read the quiz questions file. For each question, verify:

- The scenario is realistic
- The correct answer is the best tool for the job
- The "why not" explanations are technically accurate
- No tools are described with capabilities they don't have

- [ ] **Step 2: Audit commandFamilies.json**

Read the command families file. For each of the 28 tools, verify:

- The tool description is accurate
- The "best-for" scenarios are correct
- The example commands use valid syntax
- No important real-world tools are missing from each family

- [ ] **Step 3: Audit narrativeScenarios.json workflows**

Spot-check at least 10 scenarios across all domains. For each:

- Are the expectedCommands realistic for the described situation?
- Do the hints give correct technical guidance?
- Do the validation patterns match real tool output?
- Is the troubleshooting flow realistic (would a real engineer follow these steps)?

**Known issue:** `head -f` in domain0-linux-output scenario — `head` does not support `-f` flag

- [ ] **Step 4: Audit toolMasteryQuestions.ts technical claims**

Spot-check at least 30 questions. Focus on:

- Output interpretation questions (are the outputs realistic?)
- Flag/option questions (are the flags real?)
- Conceptual questions (are the technical claims accurate?)
- Best-practice questions (do they align with real-world practice?)

- [ ] **Step 5: Record findings**

Document all issues found.

- [ ] **Step 6: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: quiz, command family, scenario, and mastery question findings"
```

---

## Phase 3: Simulator Output Formats

### Task 14: Audit nvidia-smi Simulator Output Format

**Files:**

- Audit: `src/simulators/nvidiaSmiSimulator.ts` (1838 lines)
- Audit: `src/simulators/nvidiaSmiFormatters.ts` (264 lines)

**Official Sources:**

- Real `nvidia-smi` output examples (from NVIDIA documentation or published benchmarks)
- `nvidia-smi --help` documentation

- [ ] **Step 1: Read nvidia-smi main output format**

Read `nvidiaSmiFormatters.ts` lines 1-264. Document:

- The table layout for the default `nvidia-smi` output (header, GPU rows, process table)
- Temperature threshold values: T.Limit=83, Shutdown=90, Slowdown=85, Max Op=83, Memory Max=95
- Power calculations: reserved memory=2%, BAR1=1MiB, voltage=856.250mV
- Clock multipliers: video=0.9x SM, max clocks=1.2x/1.1x/1.1x, customer boost=1.15x

- [ ] **Step 2: Web search for real nvidia-smi output**

Search for: "nvidia-smi output format example" and "nvidia-smi -q full output example"

Compare the simulator's output format against real nvidia-smi output:

- Header format (driver version, CUDA version placement)
- GPU row format (GPU #, Name, Persistence-M, Fan%, Temp, Perf, Pwr:Usage/Cap, Memory-Usage, GPU-Util, Compute M, MIG M)
- Process table format
- `-q` (query) output: section headers, field names, indentation
- `topo -m` output: matrix format, legend abbreviations (NV#, SYS, PHB, PIX, PXB, NODE)
- `nvlink -s` output: link status table format
- `dmon`/`pmon` output: column headers and spacing

- [ ] **Step 3: Verify temperature thresholds per GPU model**

Different GPU models have different thermal limits:

- A100 SXM4: Shutdown=92°C, Slowdown=90°C (verify)
- H100 SXM5: Shutdown=92°C, Slowdown=90°C (verify)
- The simulator uses fixed values for all models — check if this matches reality or if thresholds vary by model

- [ ] **Step 4: Verify the `-q -d` flag outputs**

Check that these `-q -d` display filters exist and produce the right sections:

- `MEMORY` — memory usage section
- `UTILIZATION` — utilization section
- `ECC` — ECC error counts
- `TEMPERATURE` — temperature readings
- `POWER` — power draw/limits
- `CLOCK` — clock frequencies
- `PERFORMANCE` — performance state
- `PAGE_RETIREMENT` — retired pages
- `ROW_REMAPPER` — row remapping status
- `SUPPORTED_CLOCKS` — supported clock frequencies

- [ ] **Step 5: Record findings**

Document any output format mismatches, wrong threshold values, or missing fields.

- [ ] **Step 6: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: nvidia-smi simulator output format findings"
```

---

### Task 15: Audit dcgmi Simulator Output Format

**Files:**

- Audit: `src/simulators/dcgmiSimulator.ts` (1100+ lines)

**Official Sources:**

- NVIDIA DCGM User Guide
- DCGM API documentation

- [ ] **Step 1: Read dcgmi simulator output generation**

Read `dcgmiSimulator.ts`. Document output formats for:

- `dcgmi discovery -l` — GPU listing format
- `dcgmi diag -r 1/2/3` — diagnostic output format (pass/fail/warn per test)
- `dcgmi health -c` — health check output
- `dcgmi group` — group management output
- `dcgmi stats` — statistics output
- `dcgmi dmon` — device monitoring output

Note version: "3.1.3" (line 249)
Note thermal thresholds: Warning >83°C, Critical >90°C (lines 735-736)

- [ ] **Step 2: Web search for real dcgmi output**

Search for: "dcgmi discovery output example" and "dcgmi diag output format"

Verify:

- Is DCGM version 3.1.3 a real version? What's current?
- Does `dcgmi diag -r 1` produce "quick" diagnostics? `-r 2` "medium"? `-r 3` "long"?
- What tests does each level run? (memory, diagnostic, PCIe, SM stress, etc.)
- Output format: test name, result (Pass/Fail/Warn/Skip), column alignment
- Does `dcgmi health` use `-c` flag? Or `-g` for group?

- [ ] **Step 3: Record findings**

Document any format mismatches, wrong version, or incorrect subcommand behavior.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: dcgmi simulator output format findings"
```

---

### Task 16: Audit ipmitool Simulator Output Format

**Files:**

- Audit: `src/simulators/ipmitoolSimulator.ts` (1200+ lines)

**Official Sources:**

- `ipmitool` man page
- IPMI specification v2.0
- Real ipmitool output examples

- [ ] **Step 1: Read ipmitool simulator output generation**

Read `ipmitoolSimulator.ts`. Document output formats for:

- `sensor list` — sensor name, value, units, status, thresholds
- `sel list` / `sel elist` — SEL entry format
- `chassis status` — power state, last event, chassis intrusion
- `fru print` — FRU data sections (Board, Product, Chassis)
- `sdr list` — SDR record format
- `mc info` — BMC info format
- `lan print 1` — network configuration format
- `dcmi power reading` — power consumption format

Note version: "1.8.18" (line 204)
Note sensor thresholds (lines 351-413)

- [ ] **Step 2: Web search for real ipmitool output**

Search for: "ipmitool sensor list output format" and "ipmitool sel list output example"

Verify:

- Is version 1.8.18 a real version? (Yes, it's a well-known version)
- Sensor list format: `Name | Value | Units | Status | LNR | LCR | LNC | UNC | UCR | UNR`
- SEL list format: event number, date, time, sensor, event description
- `sel elist` vs `sel list` format differences
- FRU print sections and field names
- Are the temperature threshold values (lines 351-413) realistic for DGX systems?
- Default power limit of 12000W (line 15) — is this realistic for a DGX system?

- [ ] **Step 3: Record findings**

Document any format mismatches or unrealistic default values.

- [ ] **Step 4: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: ipmitool simulator output format findings"
```

---

### Task 17: Audit InfiniBand Simulators Output Format

**Files:**

- Audit: `src/simulators/infinibandSimulator.ts` (700+ lines)
- Audit: `src/simulators/mellanoxSimulator.ts` (500+ lines)

**Official Sources:**

- OFED documentation
- `ibstat`, `ibdiagnet`, `perfquery` man pages
- Mellanox MST tools documentation

- [ ] **Step 1: Read InfiniBand simulator output formats**

Read `infinibandSimulator.ts`. Document output for:

- `ibstat` — HCA name, type, ports, port state/phys state/rate/LID/GUID
- `ibportstate` — port state details
- `iblinkinfo` — link info table
- `perfquery` — performance counter format
- `ibdiagnet` — diagnostic report format
- `ibdev2netdev` — device-to-netdev mapping

Note OFED version: "5.9-0" (line 42)
Note rate mappings: XDR2≥1600, XDR≥800, NDR≥400, HDR≥200, EDR≥100, FDR≥56 (lines 18-24)

- [ ] **Step 2: Read Mellanox simulator output formats**

Read `mellanoxSimulator.ts`. Document output for:

- `mst status` — device list format
- `mlxconfig query` — configuration parameter format
- `mlxlink` — link diagnostics format
- `mlxcables` — cable information format
- `mlxfwmanager` — firmware management format

Note MST version: "4.22.0" (line 24)
Note device types: MT4129 (line 83), BlueField-2 MT42822 (line 193)

- [ ] **Step 3: Web search for real InfiniBand tool output**

Search for: "ibstat output format example" and "ibdiagnet output example"

Verify:

- `ibstat` output fields and formatting
- Rate string mapping: is "NDR" correct for 400 Gb/s? (Yes — verify)
- OFED version 5.9-0 — is this a real version?
- MST version 4.22.0 — is this a real version?
- Device ID MT4129 — is this ConnectX-7? (Should be ConnectX-7)
- BlueField-2 MT42822 — verify this device ID (DPU was created as BlueField-3/4 in clusterFactory, but mellanox simulator says BlueField-2)
- Capability mask format: 0x04010000

- [ ] **Step 4: Record findings**

Document mismatches, especially the BlueField version discrepancy.

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: InfiniBand and Mellanox simulator output format findings"
```

---

### Task 18: Audit Slurm Simulator Output Format

**Files:**

- Audit: `src/simulators/slurmSimulator.ts` (2200+ lines)

**Official Sources:**

- Slurm documentation (schedmd.com)
- `sinfo`, `squeue`, `scontrol`, `sacct` man pages

- [ ] **Step 1: Read Slurm simulator output formats**

Read `slurmSimulator.ts`. Document output for:

- `sinfo` — partition/node listing format, state abbreviations
- `squeue` — job queue format, job state codes
- `scontrol show job` — detailed job info format
- `scontrol show node` — detailed node info format
- `sacct` — accounting output format
- `sbatch` — job submission response format

Note version: "23.02.6" (line 124)
Note default values: priority=1000+random, CPUs=128, memory=512G (lines 72-83)

- [ ] **Step 2: Web search for real Slurm output**

Search for: "sinfo output format example" and "Slurm 23.02 documentation"

Verify:

- Is Slurm 23.02.6 a real version? (23.02 series exists — verify .6 patch)
- `sinfo` default columns: PARTITION, AVAIL, TIMELIMIT, NODES, STATE, NODELIST
- `squeue` default columns: JOBID, PARTITION, NAME, USER, ST, TIME, NODES, NODELIST(REASON)
- Job state codes: PD (pending), R (running), CG (completing), CD (completed), F (failed), TO (timeout), CA (cancelled), NF (node_fail)
- Node state strings: idle, alloc, mix, drain, draining, drained, down
- `scontrol show node` field names and format
- `sacct --format` field names: JobID, JobName, Partition, Account, AllocCPUS, State, ExitCode, Start, End, Elapsed

- [ ] **Step 3: Verify GRES (GPU resource) handling**

Check that GPU resource tracking follows Slurm conventions:

- `--gres=gpu:N` syntax for requesting GPUs
- `GresUsed` field format in `scontrol show node`
- GPU allocation tracking in `squeue` output

- [ ] **Step 4: Record findings**

Document any format mismatches or incorrect state/field names.

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: Slurm simulator output format findings"
```

---

### Task 19: Audit Linux Utilities Simulator Output Format

**Files:**

- Audit: `src/simulators/linuxUtilsSimulator.ts` (1604 lines)
- Audit: `src/simulators/basicSystemSimulator.ts` (2154 lines)

**Official Sources:**

- Linux man pages (man7.org)
- Ubuntu 22.04 documentation

- [ ] **Step 1: Read linuxUtilsSimulator output formats**

Read `linuxUtilsSimulator.ts`. Document output for key commands:

- `uname -a` — kernel version string format
- `lscpu` — CPU info format (Architecture, CPU(s), Model name, etc.)
- `free -h` — memory usage table format
- `dmesg` — kernel log format (timestamp, facility, message)
- `lsmod` — module listing format
- `ethtool` — NIC info format
- `ip addr show` — interface listing format

- [ ] **Step 2: Read basicSystemSimulator output formats**

Read `basicSystemSimulator.ts`. Document output for:

- `systemctl status` — service status format
- `journalctl` — log entry format
- `ping` — ping response format
- `ps aux` — process listing format

- [ ] **Step 3: Web search for real output formats**

Search for: "uname -a output format" and "lscpu output example Ubuntu 22.04"

Verify key outputs:

- `uname -a` format: `Linux <hostname> <kernel> #<build> SMP <date> <arch> <arch> <arch> GNU/Linux`
- `lscpu` fields: Architecture, CPU(s), On-line CPU(s) list, Thread(s) per core, Core(s) per socket, Socket(s), NUMA node(s), Vendor ID, Model name, etc.
- `free -h` columns: total, used, free, shared, buff/cache, available
- `dmesg` timestamp format: `[seconds.microseconds]`
- Does `dmesg` output include NVIDIA XID messages in the correct format? (e.g., `NVRM: Xid (PCI:0000:XX:00): 43, pid=XXX, name=XXX`)

- [ ] **Step 4: Record findings**

Document any format mismatches.

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: Linux utilities simulator output format findings"
```

---

### Task 20: Audit Container, Storage, and Misc Simulator Output Formats

**Files:**

- Audit: `src/simulators/containerSimulator.ts` (660 lines)
- Audit: `src/simulators/storageSimulator.ts` (331 lines)
- Audit: `src/simulators/fabricManagerSimulator.ts` (500+ lines)
- Audit: `src/simulators/nvsmSimulator.ts` (600+ lines)
- Audit: `src/simulators/pciToolsSimulator.ts` (461 lines)
- Audit: `src/simulators/bcmSimulator.ts` (586 lines)
- Audit: `src/simulators/cmshSimulator.ts` (383 lines)
- Audit: `src/simulators/nvidiaBugReportSimulator.ts` (442 lines)
- Audit: `src/simulators/nemoSimulator.ts` (236 lines)

**Official Sources:**

- Docker CLI reference
- `lsblk`, `df`, `nvme` man pages
- NVIDIA Fabric Manager documentation
- NVIDIA NVSM documentation
- `lspci` man page
- Bright Cluster Manager documentation

- [ ] **Step 1: Audit container simulator**

Read `containerSimulator.ts`. Verify:

- `docker ps` output format: CONTAINER ID, IMAGE, COMMAND, CREATED, STATUS, PORTS, NAMES
- `docker images` output format
- NVIDIA container runtime references
- `nvidia-container-cli` command syntax

- [ ] **Step 2: Audit storage simulator**

Read `storageSimulator.ts`. Verify:

- `df -h` output columns: Filesystem, Size, Used, Avail, Use%, Mounted on
- `lsblk` output format
- NVMe device naming conventions (`/dev/nvme0n1`, etc.)

- [ ] **Step 3: Audit Fabric Manager simulator**

Read `fabricManagerSimulator.ts`. Verify:

- Version "535.104.05" — is this a real Fabric Manager version?
- Config file path: `/etc/nvidia-fabricmanager/fabricmanager.cfg` — correct?
- NVSwitch temperature range: 45 + random(0-15)°C — realistic?
- Status output format

- [ ] **Step 4: Audit NVSM simulator**

Read `nvsmSimulator.ts`. Verify:

- Version "24.03" — is this a real NVSM version?
- Interactive shell command syntax
- Target hierarchy structure
- Health check output format

- [ ] **Step 5: Audit remaining simulators**

Read `pciToolsSimulator.ts`, `bcmSimulator.ts`, `cmshSimulator.ts`, `nvidiaBugReportSimulator.ts`, `nemoSimulator.ts`. For each:

- Verify version strings
- Verify output format against documentation
- Note any hardcoded values that need checking

Specific checks:

- `lspci` format: bus:device.function notation, vendor/device IDs
- BCM version "10.3.0" — is Bright Cluster Manager 10.3 a real version?
- CMSH version "10.3.0" — matches BCM?
- `nvidia-bug-report.sh` — verify this is the correct script name
- Temperature threshold 80°C in nvidiaBugReportSimulator (line 418)

- [ ] **Step 6: Record findings**

Document all issues found across these simulators.

- [ ] **Step 7: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: container, storage, and misc simulator output format findings"
```

---

## Phase 4: Benchmark & Performance Scaling

### Task 21: Audit Benchmark Simulator Formulas and Scaling

**Files:**

- Audit: `src/simulators/benchmarkSimulator.ts` (1066 lines)

**Official Sources:**

- NCCL documentation (docs.nvidia.com)
- NVIDIA published DGX benchmark results
- gpu-burn source code (GitHub: wilicc/gpu-burn)
- Perftest (RDMA performance tests) documentation
- STREAM benchmark reference

- [ ] **Step 1: Read benchmark simulator implementation**

Read `benchmarkSimulator.ts`. Document:

- NCCL all-reduce bandwidth formula (how does it calculate expected throughput?)
- GPU-burn output format and metrics
- ib_write_bw / ib_read_bw throughput calculations
- HPL (High-Performance Linpack) output format
- Multi-node scaling factors
- Power consumption during benchmarks (95% of TDP — line 762)

- [ ] **Step 2: Web search for real benchmark numbers**

Search for: "NVIDIA DGX A100 NCCL all-reduce benchmark" and "DGX H100 NCCL performance"

Verify:

- Expected all-reduce bandwidth for 8x A100 (should be ~230-270 GB/s bus bandwidth)
- Expected all-reduce bandwidth for 8x H100 (should be ~380-450 GB/s bus bandwidth)
- How bandwidth scales with message size (small messages = latency-bound, large = bandwidth-bound)
- Multi-node scaling: 2-node should see ~90% efficiency, 8-node ~70-80% (verify)
- gpu-burn output format: "GPU N: OK - temp: XX, power: XXW" (verify against real gpu-burn)
- ib_write_bw expected throughput: HDR=~24 GB/s, NDR=~48 GB/s, XDR=~96 GB/s per port

- [ ] **Step 3: Web search for gpu-burn source**

Search for: "gpu-burn github output format"

Verify:

- Output format matches real gpu-burn
- Temperature reporting format
- Error detection output format
- Duration behavior (continuous burn vs fixed time)

- [ ] **Step 4: Record findings**

Document any scaling formula inaccuracies or output format mismatches.

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: benchmark simulator formula and scaling findings"
```

---

## Phase 5: Topology & Fault Systems

### Task 22: Audit NVLink Topology Matrices

**Files:**

- Audit: `src/data/dgxLayouts.ts` (404 lines)

**Official Sources:**

- NVIDIA Ampere Architecture Whitepaper (A100 topology)
- NVIDIA Hopper Architecture Whitepaper (H100 topology)
- NVIDIA Blackwell Architecture announcements

- [ ] **Step 1: Read all topology layouts**

Read `dgxLayouts.ts`. For each system, document:

- GPU count and positions
- NVSwitch count and generation
- GPU-to-NVSwitch group assignments
- NVLink connection pairs (which GPUs connect to which)
- Total unique connection pairs

Record:

- A100: 8 GPUs, 6 NVSwitch (3rd gen), all-to-all (28 pairs)
- H100: 8 GPUs, 4 NVSwitch (4th gen), all-to-all mesh
- B200: 8 GPUs, 2 NVSwitch (5th gen), 18 NVLinks/GPU @ 50 GB/s
- GB200: 8 GPUs, 2 NVSwitch (5th gen), ConnectX-8 XDR
- VR200: 8 GPUs, 2 NVSwitch (6th gen), NVLink 6.0 @ 200 GB/s

- [ ] **Step 2: Web search for official NVLink topology**

Search for: "NVIDIA DGX A100 NVLink topology" and "NVIDIA DGX H100 NVSwitch topology"

Verify:

- A100: Does it really have 6 NVSwitch chips? (Yes — 6x NVSwitch in DGX A100)
- H100: Does it really have 4 NVSwitch chips? (Verify — some sources say 4, DGX H100 SXM board)
- Are the GPU-to-NVSwitch group assignments correct?
- Is the "all-to-all" topology accurate for each system?
- B200/GB200: NVSwitch count for Blackwell (may be different from what's in the code)

- [ ] **Step 3: Verify NVSwitch generation naming**

Verify the NVSwitch generation numbering:

- 1st gen: NVSwitch (V100/DGX-2)
- 2nd gen: NVSwitch 2 (A100/DGX A100)
- 3rd gen: NVSwitch 3 (H100/DGX H100)
- 4th gen: NVSwitch 4 (Blackwell?)
- Note: The code says A100 has 3rd gen, H100 has 4th gen — verify this is correct

- [ ] **Step 4: Record findings**

Document any topology errors, incorrect NVSwitch counts, or wrong generation assignments.

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: NVLink topology matrix findings"
```

---

### Task 23: Audit Fault Propagation Rules and Timing

**Files:**

- Audit: `src/data/faultPropagationRules.ts` (182 lines)
- Audit: `src/data/consequenceRules.ts` (208 lines)
- Audit: `src/data/faultDescriptions.ts` (308 lines)
- Audit: `src/data/incidentTemplates.ts` (455 lines)

**Official Sources:**

- NVIDIA GPU Debugging documentation
- NVIDIA DGX System Administration Guide
- Slurm health check documentation
- Real-world incident reports (if available)

- [ ] **Step 1: Read fault propagation rules**

Read `faultPropagationRules.ts`. Document all 7 trigger rules with their timing:

- xid-43: 5s → 10s → 15s (NVLink degrade → job fail → node drain)
- xid-48: 2s → 8s → 12s
- xid-79: 1s → 3s → 5s
- thermal-runaway: 10s → 20s → 45s
- nvlink-failure: 5s → 15s
- power-anomaly: 5s → 15s → 30s
- ecc-accumulation: 30s → 60s

- [ ] **Step 2: Verify fault cascade logic**

For each trigger, verify:

- **xid-43 (GPU not responding):** Does a GPU hang really cause NVLink degradation on peer GPUs? (Verify — NVLink peers should detect timeout but links don't necessarily degrade)
- **xid-48 (Double-bit ECC):** Does this really cause node drain? (Yes — uncorrectable ECC typically triggers Slurm health check failure)
- **xid-79 (Fallen off bus):** Does all NVLink go down? (Yes — GPU is unreachable, all its links are effectively down)
- **thermal-runaway:** Does clock throttling happen before XID 43? (Yes — thermal throttle is a protective mechanism before GPU hang)
- **Timing realism:** Are the delay values realistic? In real systems:
  - NVLink degradation from GPU hang: near-instantaneous (not 5s)
  - Slurm job failure detection: configurable but typically 30-300s (not 10s)
  - Slurm node drain: requires health check interval (typically 60-600s, not 15s)

- [ ] **Step 3: Read and verify consequence rules**

Read `consequenceRules.ts`. Verify the 4 dangerous command rules:

- GPU reset with active MIG: Does `nvidia-smi -r` really destroy MIG instances? (Verify)
- Power cycle with running jobs: Does `ipmitool power cycle` kill jobs? (Yes, obviously)
- Resume drained node with faults: Does Slurm re-drain? (Depends on health check config)
- dcgmi diag -r 3+ evicts jobs: Does level 3 diagnostic really require exclusive GPU access? (Verify)

- [ ] **Step 4: Verify fault descriptions and thresholds**

Read `faultDescriptions.ts`. Verify:

- Thermal throttle threshold: 85°C — does this match real GPU throttle points?
- Thermal alert (system-wide): 90-100°C — realistic?
- Workload baseline values:
  - Idle: 0-5% util, 50-200MB memory, 15% TDP, 45-55°C
  - Training: 90-98% util, 85-95% TDP, 70-80°C
  - Stress: 100% util, at/near TDP, 75-85°C
    Are these ranges realistic for DGX systems?

- [ ] **Step 5: Verify incident template diagnostic paths**

Spot-check at least 5 incident templates. For each:

- Is the diagnostic command sequence realistic?
- Would a real engineer follow this troubleshooting path?
- Are the root cause options plausible?
- Is the correct root cause actually correct?

- [ ] **Step 6: Record findings**

Document all timing, threshold, and logic issues.

- [ ] **Step 7: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: fault propagation and incident template findings"
```

---

## Phase 6: Cluster Factory & Cross-System Consistency

### Task 24: Audit Cluster Factory Generated Values

**Files:**

- Audit: `src/utils/clusterFactory.ts` (390 lines)

**Official Sources:**

- NVIDIA DGX System Administration Guide
- PCI SIG specifications
- NVIDIA driver documentation (UUID format)
- Slurm configuration best practices

- [ ] **Step 1: Read cluster factory value generation**

Read `clusterFactory.ts`. Document all generated values:

- GPU UUID format: `GPU-` + 8 hex digits (line 82-86)
- PCI address format: `00000000:${(0x10 + id).toString(16).padStart(2, "0")}:00.0` (line 106)
- DPU PCI: `0000:${(0xa0 + id).toString(16)}:00.0` (line 137)
- DPU device path: `/dev/mst/mt41692_pciconf${id}` (line 138)
- BMC IP: `192.168.0.${100 + nodeId}` (line 297)
- BMC MAC prefix: `00:0a:f7` (line 298)
- InfiniBand LID: `100 + portNum` (line 161)
- Sensor defaults: CPU temps 45/47°C, inlet 22°C, exhaust 35°C, PSU 230/229V, fans ~5200 RPM

- [ ] **Step 2: Verify formats against official docs**

Search for: "NVIDIA GPU UUID format" and "NVIDIA DGX BMC default IP"

Verify:

- **GPU UUID:** Real NVIDIA GPUs use `GPU-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` (full UUID v4 format, 36 chars). The simulator uses only 8 hex digits — this is WRONG.
- **PCI address:** Format should be `DDDD:BB:DD.F` (domain:bus:device.function). The code generates `00000000:XX:00.0` — verify if 8-digit domain is correct (typically 4 digits: `0000:XX:00.0`)
- **BMC default IP:** Is 192.168.0.x a realistic BMC subnet? (Yes, common default)
- **BMC MAC OUI:** Is 00:0a:f7 assigned to NVIDIA/Mellanox? (Verify — NVIDIA uses several OUIs)
- **Sensor baselines:** Are CPU temps of 45-47°C, inlet 22°C, exhaust 35°C realistic for idle DGX? (Generally yes)
- **InfiniBand LID starting at 100:** Realistic? (LIDs are assigned by the subnet manager, 100+ is a reasonable default range)

- [ ] **Step 3: Verify OS and kernel strings**

Check:

- OS: "Ubuntu 22.04.3 LTS" — is this the correct DGX OS version? (DGX OS is based on Ubuntu, but has specific version numbers like "DGX OS 6.x")
- Kernel: "5.15.0-91-generic" — is this a valid Ubuntu 22.04 kernel? (5.15 is the Ubuntu 22.04 HWE kernel — verify patch level)

- [ ] **Step 4: Record findings**

Document all format/value issues, especially the UUID format discrepancy.

- [ ] **Step 5: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: cluster factory generated value findings"
```

---

### Task 25: Cross-System Consistency Check

**Files:**

- All simulator files
- All data files
- `src/data/hardwareSpecs.ts`
- `src/utils/clusterFactory.ts`
- `src/components/Terminal.tsx` (command routing)
- `src/cli/commandRouter.ts` (command dispatch)

- [ ] **Step 1: Check driver version consistency**

Search codebase for all driver version strings:

- `hardwareSpecs.ts` / `clusterFactory.ts`: What versions are defined?
- `nvidiaSmiSimulator.ts`: What version does nvidia-smi display?
- `linuxUtilsSimulator.ts`: What version does `dmesg` show for NVIDIA driver?
- `nvidiaBugReportSimulator.ts`: What driver version appears in bug reports?
- `fabricManagerSimulator.ts`: Version "535.104.05" — does this match the cluster factory's driver version for the same system type?

All simulators should display the SAME driver version for a given node. Document any mismatches.

- [ ] **Step 2: Check GPU spec consistency across simulators**

Verify that these values are sourced from `hardwareSpecs.ts` (not hardcoded) in:

- `nvidiaSmiSimulator.ts` — GPU memory, power limit, clock speeds
- `dcgmiSimulator.ts` — GPU discovery info
- `ipmitoolSimulator.ts` — sensor values
- `benchmarkSimulator.ts` — performance calculations
- `fabricManagerSimulator.ts` — NVLink bandwidth

Search for hardcoded GPU memory values (e.g., "81920", "80", "40960") that should come from specs.

- [ ] **Step 3: Check NVLink bandwidth consistency**

Verify NVLink bandwidth values match between:

- `hardwareSpecs.ts` — defined bandwidth per system
- `dgxLayouts.ts` — documented in comments
- `nvidiaSmiSimulator.ts` — `nvidia-smi nvlink -s` output
- `fabricManagerSimulator.ts` — fabric query output
- `benchmarkSimulator.ts` — bandwidth used in scaling formulas

- [ ] **Step 4: Check InfiniBand spec consistency**

Verify HCA model/speed match between:

- `hardwareSpecs.ts` — HCA model and port rate defined
- `clusterFactory.ts` — HCA device ID and firmware assigned
- `infinibandSimulator.ts` — ibstat output shows correct HCA model and rate
- `mellanoxSimulator.ts` — mst status shows correct device type

- [ ] **Step 5: Check fault state propagation across simulators**

Verify that when a fault is injected:

- An ECC error on a GPU shows up in: nvidia-smi (-q -d ECC), dcgmi health, dmesg (XID), ipmitool sel
- An NVLink failure shows up in: nvidia-smi nvlink -s, fabric-manager status, nvsm health
- A thermal event shows up in: nvidia-smi (-q -d TEMPERATURE), ipmitool sensor, dcgmi health

This requires reading the fault injection code paths, not just static values.

- [ ] **Step 6: Verify command routing completeness**

Read `src/components/Terminal.tsx` and `src/cli/commandRouter.ts`. Verify:

- Every real DGX command that a certification candidate might use is registered
- Commands are dispatched to the correct simulator (e.g., `ibstat` → infinibandSimulator, not mellanoxSimulator)
- No commands are registered but missing a simulator handler
- No simulators exist but have commands that aren't registered in the router
- Shell-like commands (pipe, grep, head, tail) work correctly with simulator output

- [ ] **Step 7: Record findings**

Document all cross-system inconsistencies.

- [ ] **Step 8: Commit progress**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: cross-system consistency findings"
```

---

## Phase 7: Report Compilation

### Task 26: Compile Final Findings Report

**Files:**

- Create: `docs/audits/2026-04-10-realism-audit-findings.md` (final compiled version)

- [ ] **Step 1: Create the findings document skeleton**

Create `docs/audits/2026-04-10-realism-audit-findings.md` with the full report structure:

```markdown
# DC Lab Simulator — Realism Audit Findings

**Date:** 2026-04-10
**Auditor:** Claude
**Scope:** Full realism audit of hardware specs, CLI outputs, version compatibility, data files, benchmarks, fault systems, and cross-system consistency.

## Executive Summary

### Findings by Severity

| Severity | Count | Description                                     |
| -------- | ----- | ----------------------------------------------- |
| Critical | X     | Factually wrong — teaches incorrect information |
| High     | X     | Misleading or incomplete                        |
| Medium   | X     | Imprecise but not harmful                       |
| Low      | X     | Cosmetic or minor                               |

### Top 10 Highest-Impact Issues

1. ...

### Overall Realism Assessment

...

## Layer 1: Hardware Specs & Version Compatibility

### DGX-A100 Findings

### DGX-H100 Findings

### DGX-H200 Findings

### DGX-B200 Findings

### DGX-GB200 Findings

### DGX-VR200 Findings

### Driver/CUDA Compatibility Findings

### Firmware Version Findings

## Layer 2: Data File Accuracy

### nvidia-smi Command Syntax Findings

### dcgmi & ipmitool Command Syntax Findings

### InfiniBand & Slurm Command Syntax Findings

### XID Error Code Findings

### Quiz & Scenario Content Findings

## Layer 3: Simulator Output Formats

### nvidia-smi Simulator Findings

### dcgmi Simulator Findings

### ipmitool Simulator Findings

### InfiniBand Simulator Findings

### Slurm Simulator Findings

### Linux Utilities Simulator Findings

### Container/Storage/Misc Simulator Findings

## Layer 4: Benchmark & Performance

### Benchmark Formula Findings

## Layer 5: Topology & Faults

### NVLink Topology Findings

### Fault Propagation Findings

### Incident Template Findings

## Layer 6: Cluster Factory

### Generated Value Findings

## Cross-System Consistency

### Version String Consistency

### GPU Spec Consistency

### NVLink Bandwidth Consistency

### InfiniBand Spec Consistency

### Fault State Consistency

## Appendix: Verification Sources
```

- [ ] **Step 2: Compile all task findings**

Gather findings from Tasks 1-25 and organize into the report sections. For each finding:

- Assign final severity rating
- Deduplicate overlapping findings
- Add cross-references between related findings

- [ ] **Step 3: Write Executive Summary**

Tally findings by severity. Identify the top 10 highest-impact issues. Write overall assessment.

- [ ] **Step 4: Final review**

Read the complete report. Check:

- Every finding has file, line, current value, correct value, and source
- No duplicate findings
- Severity ratings are consistent
- Cross-references are accurate

- [ ] **Step 5: Commit final report**

```bash
git add docs/audits/2026-04-10-realism-audit-findings.md
git commit -m "audit: compile final realism audit findings report"
```

---

### Task 27: Create Implementation Plan from Findings

**Files:**

- Create: `docs/audits/2026-04-10-realism-audit-fixes.md`

- [ ] **Step 1: Prioritize fixes**

Sort all findings by:

1. Severity (Critical first)
2. Impact on certification training
3. Fix complexity (easy fixes first within same severity)

- [ ] **Step 2: Group fixes by file**

Group related fixes that touch the same file to minimize context switching:

- All `hardwareSpecs.ts` fixes together
- All `examQuestions.json` fixes together
- All `nvidiaSmiSimulator.ts` fixes together
- etc.

- [ ] **Step 3: Write the fix plan**

For each group, document:

- What to change (specific values/lines)
- What to change it to (with source reference)
- How to verify the fix (test command or manual check)
- Dependencies (e.g., "fix hardwareSpecs first, then update simulators")

- [ ] **Step 4: Commit fix plan**

```bash
git add docs/audits/2026-04-10-realism-audit-fixes.md
git commit -m "audit: create implementation plan for realism fixes"
```
