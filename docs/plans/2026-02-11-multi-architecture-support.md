# Multi-Architecture Hardware Support Design

## Goal

Replace scattered hardcoded A100 values across 19 simulators with a single typed hardware spec registry supporting four DGX systems: A100, H100, H200, and B200. Add architecture comparison mode for learning. GB200 NVL72 deferred to a future phase.

## Priorities (in order)

1. **Exam accuracy** — NCP-AII covers A100, H100, and B200. Simulator output must match real hardware.
2. **Architecture comparison** — Side-by-side spec tables help users understand generational improvements.
3. **Future-proofing** — Clean registry pattern makes adding new systems trivial.

## Architecture

### Core: Hardware Spec Registry

Single file `src/data/hardwareSpecs.ts` containing a `Record<SystemType, HardwareSpec>` with every detail any simulator needs.

```typescript
type SystemType = "DGX-A100" | "DGX-H100" | "DGX-H200" | "DGX-B200";

interface HardwareSpec {
  system: {
    type: SystemType;
    generation: string; // "Ampere" | "Hopper" | "Blackwell"
    cpu: { model: string; sockets: number; coresPerSocket: number };
    systemMemoryGB: number;
    totalGpuMemoryGB: number;
  };
  gpu: {
    model: string; // "A100 80GB SXM" | "H100 80GB SXM" | ...
    count: number; // Always 8 for these systems
    memoryGB: number;
    memoryType: string; // "HBM2e" | "HBM3" | "HBM3e"
    memoryBandwidthTBs: number;
    tdpWatts: number;
    fp16Tflops: number;
    tf32Tflops: number;
    fp64Tflops: number;
    pciDeviceId: string; // For nvidia-smi output
    baseClock: number; // MHz
    boostClock: number;
    smCount: number;
    architecture: string; // "ga100" | "gh100" | "gb100"
    computeCapability: string; // "8.0" | "9.0" | "10.0"
  };
  nvlink: {
    version: string; // "3.0" | "4.0" | "5.0"
    linksPerGpu: number; // 12 | 18 | 18
    linkBandwidthGBs: number; // Per-link bidirectional
    totalBandwidthGBs: number; // Per-GPU aggregate
    nvSwitchCount: number;
    nvSwitchGeneration: string; // "2nd Gen" | "4th Gen" | "5th Gen"
  };
  network: {
    hcaModel: string; // "ConnectX-6" | "ConnectX-7"
    hcaCount: number; // 8 (one per GPU rail)
    protocol: string; // "HDR" | "NDR"
    portRate: number; // 200 | 400 (Gb/s)
    hcasPerGpu: number; // 1
  };
  storage: {
    osDrives: string;
    dataDrives: string;
    totalCapacityTB: number;
  };
}
```

### Spec Data (from official NVIDIA Reference Architectures)

| Field       | A100               | H100                  | H200                  | B200                 |
| ----------- | ------------------ | --------------------- | --------------------- | -------------------- |
| GPU         | A100 80GB SXM      | H100 80GB SXM         | H200 141GB SXM        | B200 192GB SXM       |
| Memory      | 80GB HBM2e         | 80GB HBM3             | 141GB HBM3e           | 192GB HBM3e          |
| Mem BW      | 2.0 TB/s           | 3.35 TB/s             | 4.8 TB/s              | 8.0 TB/s             |
| TDP         | 400W               | 700W                  | 700W                  | 1000W                |
| SM Count    | 108                | 132                   | 132                   | 192                  |
| FP16        | 312 TFLOPS         | 989 TFLOPS            | 989 TFLOPS            | 1800 TFLOPS          |
| TF32        | 156 TFLOPS         | 495 TFLOPS            | 495 TFLOPS            | 900 TFLOPS           |
| FP64        | 19.5 TFLOPS        | 34 TFLOPS             | 34 TFLOPS             | 45 TFLOPS            |
| NVLink      | 3.0 (NV12)         | 4.0 (NV18)            | 4.0 (NV18)            | 5.0 (NV18)           |
| NVLink BW   | 600 GB/s           | 900 GB/s              | 900 GB/s              | 1800 GB/s            |
| NVSwitches  | 6x 2nd-gen         | 4x 4th-gen            | 4x 4th-gen            | 2x 5th-gen           |
| HCA         | ConnectX-6         | ConnectX-7            | ConnectX-7            | ConnectX-7           |
| IB          | HDR 200Gb          | NDR 400Gb             | NDR 400Gb             | NDR 400Gb            |
| CPU         | AMD EPYC 7742 (2x) | Intel Xeon 8480C (2x) | Intel Xeon 8480C (2x) | Intel Xeon 8570 (2x) |
| System RAM  | 1 TB               | 2 TB                  | 2 TB                  | 2 TB                 |
| Compute Cap | 8.0                | 9.0                   | 9.0                   | 10.0                 |

### Simulator Consumption

Each simulator adds one line at the top of `simulate()`:

```typescript
const specs = getHardwareSpecs(this.resolveCluster().systemType);
```

Then replaces hardcoded values with registry lookups. No architectural change — just swapping literals for `specs.gpu.boostClock`, `specs.network.hcaModel`, etc.

`getHardwareSpecs()` falls back to A100 for unrecognized types.

### Cluster Factory Changes

`clusterFactory.ts` currently only accepts `'DGX-A100' | 'DGX-H100'`. Changes:

- Import `SystemType` from `hardwareSpecs.ts`
- Use registry to populate initial cluster state (GPU memory, HCA model, port rates, etc.)
- Existing scenarios specify their system type; default remains DGX-A100

### DGX Layout Updates

`dgxLayouts.ts` needs two new entries:

- **DGX-H200**: Identical topology to H100 (same NVSwitch 4th-gen x4). Map to existing H100 layout.
- **DGX-B200**: New layout — 8 GPUs + 2 NVSwitch 5th-gen (2 switches centered between GPU rows).

### System Type Selector

A dropdown on the Dashboard or Settings allowing users to switch the active architecture. Changing the system type:

1. Updates the global store's `systemType`
2. Re-creates the cluster with correct specs
3. All simulator output reflects the new architecture

### Architecture Comparison Component

New `ArchitectureComparison.tsx` accessible from the Learn tab:

- Select 2-4 systems for side-by-side comparison
- Spec table with visual diff highlighting (green = improvement, red = regression)
- Covers GPU, NVLink, network, and system specs
- Helps users study generational improvements (key NCP-AII exam knowledge)

## Files to Create

- `src/data/hardwareSpecs.ts` — Registry + types + `getHardwareSpecs()`
- `src/data/__tests__/hardwareSpecs.test.ts` — Validation tests
- `src/components/ArchitectureComparison.tsx` — Comparison UI
- `src/components/__tests__/ArchitectureComparison.test.tsx` — Component tests

## Files to Modify

### High-impact (architecture-aware output):

- `src/simulators/nvidiaSmiSimulator.ts` — GPU model, memory, clocks, PCI IDs, driver info
- `src/simulators/infinibandSimulator.ts` — HCA model, port rate, protocol
- `src/simulators/fabricManagerSimulator.ts` — NVLink version, bandwidth, NVSwitch info
- `src/simulators/dcgmiSimulator.ts` — GPU model, memory, compute capability
- `src/simulators/nvsmSimulator.ts` — GPU model, memory bandwidth, TDP
- `src/simulators/nvswitchSimulator.ts` — NVSwitch generation, link count

### Medium-impact (cluster setup):

- `src/store/simulationStore.ts` — `SystemType` union, system type selector action
- `src/utils/clusterFactory.ts` — Registry-driven cluster creation
- `src/data/dgxLayouts.ts` — B200 layout, H200 mapping

### Low-impact (UI integration):

- `src/components/Dashboard.tsx` or Settings — System type dropdown
- `src/components/LearningPaths.tsx` — Link to comparison mode

## Implementation Order

| Step | Task                                                                     | Depends On |
| ---- | ------------------------------------------------------------------------ | ---------- |
| 1    | Create `hardwareSpecs.ts` with types, data, and `getHardwareSpecs()`     | —          |
| 2    | Add B200 layout to `dgxLayouts.ts`, H200 mapping                         | —          |
| 3    | Update `clusterFactory.ts` to use registry                               | 1          |
| 4    | Update `simulationStore.ts` with full SystemType union + selector action | 1, 3       |
| 5    | Update `nvidiaSmiSimulator.ts`                                           | 1          |
| 6    | Update `infinibandSimulator.ts`                                          | 1          |
| 7    | Update `fabricManagerSimulator.ts`                                       | 1          |
| 8    | Update `dcgmiSimulator.ts`                                               | 1          |
| 9    | Update `nvsmSimulator.ts`                                                | 1          |
| 10   | Update `nvswitchSimulator.ts`                                            | 1          |
| 11   | Update remaining simulators with minor hardcoded values                  | 1          |
| 12   | Add system type selector to Dashboard                                    | 4          |
| 13   | Build `ArchitectureComparison.tsx`                                       | 1          |
| 14   | Add tests for all changes                                                | 1-13       |
| 15   | Manual verification across all four architectures                        | 1-14       |

## Verification

1. `npm run test:run` — all tests pass
2. `npm run lint` — 0 errors/warnings
3. `npm run build` — clean production build
4. Manual: Switch to each architecture, run key commands, verify output matches spec table
5. Manual: Architecture comparison shows correct data with visual diffs
