# NVIDIA AI Infrastructure Simulator - TODO List

**Current Status**: ~70% complete | Exam Coverage: ~60%

---

## 🔴 HIGH PRIORITY - Core Exam Coverage

These features are essential for comprehensive NCP-AII exam preparation.

### 1. NVSM (NVIDIA System Management) Simulator
**Impact**: Critical for Domain 1 & 5 (40%+ of exam)

- [ ] Implement hierarchical navigation system (`cd /systems/localhost/gpus`)
- [ ] `nvsm show health` - system health summary
- [ ] `nvsm show health --detailed` - detailed FRU status
- [ ] `nvsm show firmware` - firmware version listing
- [ ] `nvsm show fru` - Field Replaceable Unit inventory
- [ ] `nvsm show topology` - NVLink/NVSwitch topology view
- [ ] `nvsm /systems/localhost/gpus show` - GPU health rollup
- [ ] `nvsm /systems/localhost/gpus/GPU3 show -level all health` - per-GPU health
- [ ] Support for Status_HealthRollup field (OK/Warning/Critical)
- [ ] GPU health incidents (e.g., "NvLink link 2 is currently down")

**Estimated Effort**: 8-12 hours
**Files to Create**: `src/simulators/nvsmSimulator.ts`

---

### 2. Mellanox/NVIDIA Networking Tools
**Impact**: Critical for Domain 1, 4, 5 (Cable validation, troubleshooting)

#### MST (Mellanox Software Tools)
- [ ] `mst start` - Start MST daemon
- [ ] `mst status` - List MST devices
- [ ] `mst status -v` - Verbose device listing

#### mlxconfig (BlueField/ConnectX Configuration)
- [ ] `mlxconfig -d /dev/mst/<device> q` - Query configuration
- [ ] `mlxconfig -d /dev/mst/<device> s INTERNAL_CPU_MODEL=1` - Set DPU mode
- [ ] `mlxconfig -d /dev/mst/<device> s INTERNAL_CPU_MODEL=0` - Set NIC mode
- [ ] Implement all 4 BlueField operational modes:
  - [ ] DPU mode (INTERNAL_CPU_MODEL=1)
  - [ ] Restricted DPU Host mode
  - [ ] NIC mode (INTERNAL_CPU_MODEL=0)
  - [ ] Separated Host mode
- [ ] Configuration persistence and reset requirements

#### mlxlink (Link Diagnostics)
- [ ] `mlxlink -d /dev/mst/<device>` - Show link status
- [ ] `mlxlink -d /dev/mst/<device> -c` - Show counters
- [ ] `mlxlink -d /dev/mst/<device> --show_eye` - Eye diagram
- [ ] Signal quality measurements
- [ ] Link speed degradation detection

#### mlxcables (Cable/Transceiver Info)
- [ ] `mlxcables -d <device>` - Cable information
- [ ] Cable type detection (DAC, AOC, SR4, DR4/LR4)
- [ ] Vendor information
- [ ] Cable length and specs
- [ ] Temperature readings

#### mlxup (Firmware Updates)
- [ ] `mlxup -d /dev/mst/<device> -q` - Query firmware version
- [ ] `mlxup --online -d <device>` - Check for updates
- [ ] `mlxup --online -d <device> --img <fw.mfa>` - Flash firmware
- [ ] Simulate firmware update progress
- [ ] Version comparison and compatibility checks

**Estimated Effort**: 12-16 hours
**Files to Create**: `src/simulators/mellanoxSimulator.ts`, update BlueField DPU models

---

### 3. Slurm Workload Manager
**Impact**: Essential for Domain 3 (19% of exam)

#### Basic Commands
- [ ] `sinfo` - Show partition and node information
- [ ] `sinfo -Nel` - Detailed node list
- [ ] `squeue` - Show job queue
- [ ] `squeue -u <user>` - User-specific jobs
- [ ] `scontrol show nodes` - Detailed node info
- [ ] `scontrol show node <nodename>` - Specific node details
- [ ] `scontrol update NodeName=<node> State=drain Reason="<reason>"` - Drain node
- [ ] `scontrol update NodeName=<node> State=resume` - Resume node

#### Job Management
- [ ] `sbatch <script.sh>` - Submit batch job
- [ ] `srun --gpus=<n> <command>` - Run interactive job
- [ ] `srun --gpus=<n> --container-image=<image> <cmd>` - Run with Pyxis
- [ ] `scancel <jobid>` - Cancel job
- [ ] `sacct -j <jobid>` - Job accounting info

#### GRES Configuration
- [ ] Implement GPU GRES tracking
- [ ] Show GPU allocation per node
- [ ] Support for MIG device GRES
- [ ] Node feature tags

**Estimated Effort**: 10-14 hours
**Files to Create**: `src/simulators/slurmSimulator.ts`, update cluster state with job queue

---

### 4. Container Tools
**Impact**: Important for Domain 3 (Container runtime setup)

#### Docker with NVIDIA Runtime
- [ ] `docker run --rm --gpus all nvidia/cuda:12.4.0-base nvidia-smi`
- [ ] `docker run --gpus "device=0,1" <image> <cmd>` - Specific GPUs
- [ ] `docker run --gpus "device=MIG-GPU-0/CI-0/UUID" <image>` - MIG devices
- [ ] `docker ps` - Show running containers
- [ ] `docker images` - List images
- [ ] Simulate GPU visibility issues for troubleshooting practice

#### NGC CLI
- [ ] `ngc config set` - Configure API key
- [ ] `ngc registry image list nvcr.io/nvidia/pytorch` - List images
- [ ] `ngc registry image pull <image>` - Pull container
- [ ] `ngc registry model list` - List models
- [ ] Authentication simulation

#### Enroot/Pyxis
- [ ] Integration with Slurm commands (already partially done)
- [ ] `enroot import docker://<image>` - Import container
- [ ] `enroot create <image>` - Create container
- [ ] `enroot start <container>` - Start container
- [ ] Container-mounts syntax in srun

**Estimated Effort**: 8-10 hours
**Files to Create**: `src/simulators/containerSimulator.ts`

---

### 5. BCM (Base Command Manager)
**Impact**: Important for Domain 3 (Control Plane Installation)

- [ ] `bcm` - Enter BCM shell
- [ ] `bcm-node list` - List cluster nodes
- [ ] `bcm ha status` - High Availability state
- [ ] `bcm job list` - List deployment jobs
- [ ] `bcm job logs <job_id>` - View job logs
- [ ] `bcm validate pod` - Validate SuperPOD configuration
- [ ] `crm status` - Pacemaker cluster status (HA component)
- [ ] Simulate HA failover scenarios
- [ ] Node provisioning workflow

**Estimated Effort**: 8-10 hours
**Files to Create**: `src/simulators/bcmSimulator.ts`

---

## 🟡 MEDIUM PRIORITY - Enhanced Learning Features

These features significantly improve the learning experience but aren't strictly required for basic exam prep.

### 6. Interactive Lab Scenarios
**Impact**: Major improvement to learning effectiveness

#### Domain 1: Systems and Server Bring-Up
- [ ] **Lab 1.1**: DGX SuperPOD Initial Deployment
  - [ ] Site survey checklist
  - [ ] BMC network configuration steps
  - [ ] BIOS boot order setup
  - [ ] BCM installation workflow
  - [ ] Hardware detection validation
  - [ ] Post-install verification checklist

- [ ] **Lab 1.2**: Firmware Upgrade Workflow
  - [ ] Pre-upgrade version checks
  - [ ] Firmware package validation
  - [ ] Update execution (GPU VBIOS, BMC, NIC)
  - [ ] Post-upgrade verification
  - [ ] Rollback procedures

- [ ] **Lab 1.3**: Cable Validation
  - [ ] Visual inspection simulation
  - [ ] mlxlink signal quality measurement
  - [ ] Error counter analysis
  - [ ] Cable type identification
  - [ ] Troubleshooting degraded links

- [ ] **Lab 1.4**: Power and Cooling Validation
  - [ ] BMC sensor monitoring
  - [ ] Thermal stress testing
  - [ ] PUE calculation
  - [ ] Identify thermal throttling

#### Domain 2: Physical Layer Management
- [ ] **Lab 2.1**: BlueField DPU Configuration
  - [ ] MST device identification
  - [ ] Switch between DPU/NIC modes
  - [ ] OVS bridge configuration
  - [ ] Host connectivity verification

- [ ] **Lab 2.2**: MIG Partitioning
  - [ ] Enable MIG on multiple GPUs
  - [ ] Create various profile configurations
  - [ ] Assign to Slurm GRES
  - [ ] Multi-tenant workload simulation

#### Domain 3: Control Plane Installation
- [ ] **Lab 3.1**: BCM High Availability Setup
  - [ ] Install BCM on two head nodes
  - [ ] Configure shared storage
  - [ ] Set up Pacemaker/Corosync
  - [ ] Test failover scenarios

- [ ] **Lab 3.2**: Slurm Configuration with GPU GRES
  - [ ] Configure slurm.conf
  - [ ] Set up gres.conf
  - [ ] Test GPU allocation
  - [ ] MIG device GRES

- [ ] **Lab 3.3**: Container Toolkit Setup
  - [ ] Install nvidia-docker2
  - [ ] Configure runtime
  - [ ] Test GPU access in containers
  - [ ] Troubleshoot visibility issues

#### Domain 4: Cluster Test and Verification
- [ ] **Lab 4.1**: Single-Node Stress Test
  - [ ] DCGM diagnostic execution
  - [ ] GPU burn test
  - [ ] Monitor during stress
  - [ ] Interpret results

- [ ] **Lab 4.2**: HPL Benchmark
  - [ ] Run HPL with NGC container
  - [ ] Analyze TFLOPS results
  - [ ] Compare to published benchmarks
  - [ ] Identify performance issues

- [ ] **Lab 4.3**: NCCL Tests
  - [ ] Single-node AllReduce
  - [ ] Multi-node AllReduce
  - [ ] Interpret bandwidth results
  - [ ] Detect fabric issues

#### Domain 5: Troubleshooting
- [ ] **Scenario 5.1**: Diagnose Low HPL Performance
  - [ ] Check GPU clocks and thermals
  - [ ] Verify PCIe link speed
  - [ ] Check NVLink status
  - [ ] Validate NUMA configuration
  - [ ] Disable CPU power saving

- [ ] **Scenario 5.2**: GPU Marked Faulty in NVSM
  - [ ] Collect detailed status
  - [ ] Check XID errors
  - [ ] Verify thermal/power
  - [ ] Attempt GPU reset
  - [ ] Drain node procedure

- [ ] **Scenario 5.3**: InfiniBand Link Errors
  - [ ] Check port status
  - [ ] Read error counters
  - [ ] Identify problematic cables
  - [ ] Test specific links
  - [ ] Cable replacement procedure

**Lab System Features**:
- [ ] Step-by-step guidance UI
- [ ] Automatic validation of each step
- [ ] Hints system (3 levels: gentle, specific, answer)
- [ ] Progress tracking per lab
- [ ] Time tracking for practice
- [ ] Success/failure criteria
- [ ] Post-lab quiz questions
- [ ] Lab state save/resume

**Estimated Effort**: 30-40 hours
**Files to Create**: `src/components/Labs/`, `src/data/labScenarios.ts`

---

### 7. Fault Injection System
**Impact**: Critical for troubleshooting practice

- [ ] **UI Controls for Fault Injection**
  - [ ] Fault injection panel in Dashboard
  - [ ] Select target (node, GPU, port)
  - [ ] Choose fault type
  - [ ] Set severity and duration
  - [ ] Clear all faults button

- [ ] **GPU Faults**
  - [ ] XID error injection (13, 31, 48, 63, 79, 119)
  - [ ] ECC error injection (single/double bit)
  - [ ] Thermal throttling (high temp)
  - [ ] NVLink degradation/failure
  - [ ] Power limit exceeded
  - [ ] Clock throttling
  - [ ] GPU fallen off bus (XID 79)

- [ ] **InfiniBand Faults**
  - [ ] Symbol errors
  - [ ] Link flapping
  - [ ] Port down
  - [ ] Degraded link speed
  - [ ] High PortXmitWait (congestion)
  - [ ] Bad cable simulation

- [ ] **BMC/System Faults**
  - [ ] Fan failure
  - [ ] Temperature warnings
  - [ ] PSU failure
  - [ ] Memory errors

- [ ] **Fault Propagation**
  - [ ] Update NVSM health status
  - [ ] Update nvidia-smi output
  - [ ] Update DCGM health checks
  - [ ] Update InfiniBand counters
  - [ ] Generate appropriate XID errors
  - [ ] Trigger Slurm node drain (if configured)

- [ ] **Troubleshooting Challenges**
  - [ ] Random fault scenarios
  - [ ] Multi-fault scenarios (root cause analysis)
  - [ ] Time-limited troubleshooting exercises
  - [ ] Scoring based on diagnostic efficiency

**Estimated Effort**: 12-16 hours
**Files to Create**: `src/components/FaultInjection/`, update all simulators

---

### 8. Practice Exam System
**Impact**: High value for exam preparation

- [ ] **Question Bank**
  - [ ] 100+ multiple choice questions
  - [ ] Domain-weighted distribution (31%, 5%, 19%, 33%, 12%)
  - [ ] Difficulty levels (easy, medium, hard)
  - [ ] Scenario-based questions
  - [ ] Command syntax questions
  - [ ] Troubleshooting questions

- [ ] **Exam Engine**
  - [ ] Timed exam mode (90 minutes standard)
  - [ ] Practice mode (untimed, immediate feedback)
  - [ ] Question randomization
  - [ ] Answer selection interface
  - [ ] Mark for review functionality
  - [ ] Progress indicator

- [ ] **Scoring and Feedback**
  - [ ] Automatic grading
  - [ ] Pass/fail threshold (typically 70%)
  - [ ] Score breakdown by domain
  - [ ] Detailed explanations for all answers
  - [ ] References to documentation
  - [ ] Identify weak areas

- [ ] **Exam History**
  - [ ] Save exam attempts
  - [ ] Track score progression
  - [ ] Review past exams
  - [ ] Performance analytics
  - [ ] Time spent per domain

**Sample Questions to Create**:
```
Q: What is the correct command to enable MIG mode on GPU 0?
A) nvidia-smi -i 0 --mig-enable
B) nvidia-smi -i 0 -mig 1
C) nvidia-smi --mig 1 -i 0
D) nvidia-smi enable-mig -i 0
Answer: B

Q: Which XID error indicates a GPU has fallen off the PCIe bus?
A) XID 48
B) XID 63
C) XID 79
D) XID 119
Answer: C

Q: What InfiniBand error counter indicates physical layer issues with a cable?
A) PortXmitWait
B) SymbolErrors
C) LinkDowned
D) PortXmitDiscards
Answer: B
```

**Estimated Effort**: 16-20 hours
**Files to Create**: `src/components/Exam/`, `src/data/examQuestions.ts`

---

### 9. Real-Time Metrics Simulation
**Impact**: Makes the simulator feel more alive

- [ ] **Background Metrics Engine**
  - [ ] Connect to existing MetricsSimulator
  - [ ] Start/stop with simulation controls
  - [ ] Configurable update interval (1-5 seconds)
  - [ ] Performance optimization (only update visible metrics)

- [ ] **Workload Patterns**
  - [ ] Idle (5% utilization)
  - [ ] Training (90-100% utilization, high memory)
  - [ ] Inference (60-70% utilization, moderate memory)
  - [ ] Stress Test (100% utilization, max power)
  - [ ] Mixed workloads per GPU

- [ ] **Realistic Correlations**
  - [x] Temperature follows utilization (already implemented)
  - [x] Power draw correlates with utilization (already implemented)
  - [ ] Clock speeds reduce under thermal throttling
  - [ ] Memory usage increases during training
  - [ ] NVLink bandwidth during multi-GPU jobs
  - [ ] InfiniBand counters during network activity

- [ ] **Workload Selector UI**
  - [ ] Per-node workload selection
  - [ ] Per-GPU workload assignment
  - [ ] Workload scheduling (start time, duration)
  - [ ] Random workload generation

**Estimated Effort**: 6-8 hours
**Files to Update**: `src/utils/metricsSimulator.ts`, connect to Dashboard

---

### 10. HPL and NCCL Benchmark Simulation
**Impact**: Important for Domain 4 (33% of exam)

- [ ] **HPL (High-Performance Linpack)**
  - [ ] Command: `hpl.sh --dat /data/HPL.dat --cpu-affinity 0-63`
  - [ ] Simulated execution with progress bar
  - [ ] Realistic timing (1-5 minutes based on cluster size)
  - [ ] Results output:
    - [ ] TFLOPS performance
    - [ ] Residual check (pass/fail)
    - [ ] Problem size (N)
    - [ ] Block size (NB)
    - [ ] Grid dimensions (P x Q)
  - [ ] Compare to published DGX benchmarks
  - [ ] Detect performance issues (low TFLOPS)
  - [ ] Integration with Slurm (sbatch/srun)

- [ ] **NCCL Tests**
  - [ ] all_reduce_perf single-node
  - [ ] all_reduce_perf multi-node
  - [ ] all_gather_perf
  - [ ] broadcast_perf
  - [ ] reduce_scatter_perf
  - [ ] Results:
    - [ ] Bus bandwidth (GB/s)
    - [ ] Algorithm bandwidth (GB/s)
    - [ ] Latency (us)
    - [ ] Message size sweep (8B to 2GB)
  - [ ] Expected results for DGX A100:
    - [ ] Single-node NVLink: ~340 GB/s
    - [ ] Multi-node IB: ~190 GB/s per port
  - [ ] Detect degraded performance

- [ ] **Benchmark Results Storage**
  - [ ] Save benchmark runs
  - [ ] Historical comparison
  - [ ] Performance trend graphs
  - [ ] Export results as CSV/JSON

**Estimated Effort**: 10-12 hours
**Files to Create**: `src/simulators/benchmarkSimulator.ts`

---

## 🟢 LOW PRIORITY - Nice-to-Have Features

These features improve usability but aren't essential for exam preparation.

### 11. Topology Visualization
**Impact**: Visual understanding of cluster architecture

- [ ] **D3.js Network Graph**
  - [ ] Node representation (DGX boxes)
  - [ ] GPU representation within nodes
  - [ ] NVLink connections (intra-node)
  - [ ] NVSwitch connections
  - [ ] InfiniBand connections (inter-node)
  - [ ] Switch hierarchy (leaf/spine)

- [ ] **Interactive Features**
  - [ ] Click node to select
  - [ ] Hover for details
  - [ ] Zoom and pan
  - [ ] Filter by connection type
  - [ ] Highlight error paths
  - [ ] Show link bandwidth

- [ ] **Health Overlay**
  - [ ] Color-code by health status
  - [ ] Show error counts on links
  - [ ] Animate traffic flow
  - [ ] Highlight bottlenecks

**Estimated Effort**: 12-16 hours
**Files to Create**: `src/components/Topology/`, D3.js integration

---

### 12. Historical Metrics Charts
**Impact**: Better understanding of trends

- [ ] **Recharts Integration**
  - [ ] GPU utilization over time
  - [ ] Temperature trends
  - [ ] Power consumption
  - [ ] Memory usage
  - [ ] ECC error accumulation

- [ ] **Time Windows**
  - [ ] Last 1 minute
  - [ ] Last 5 minutes
  - [ ] Last 15 minutes
  - [ ] Last hour

- [ ] **Chart Types**
  - [ ] Line charts for trends
  - [ ] Area charts for stacked metrics
  - [ ] Bar charts for comparisons
  - [ ] Heatmaps for multi-GPU view

**Estimated Effort**: 6-8 hours
**Files to Create**: `src/components/Charts/`

---

### 13. Terminal Enhancements
**Impact**: Better user experience

- [ ] **Tab Completion**
  - [ ] Command name completion
  - [ ] Argument completion
  - [ ] File path completion (for simulated paths)
  - [ ] Option flag completion

- [ ] **Command History Search**
  - [ ] Ctrl+R reverse search
  - [ ] Search UI with filtering
  - [ ] History persistence across sessions

- [ ] **Copy/Paste**
  - [ ] Ctrl+Shift+C to copy
  - [ ] Ctrl+Shift+V to paste
  - [ ] Right-click context menu

- [ ] **Terminal Themes**
  - [ ] Dark (current NVIDIA green)
  - [ ] Matrix (green on black)
  - [ ] Light theme
  - [ ] Custom theme creator

- [ ] **Multiple Terminals**
  - [ ] Tab support
  - [ ] Split panes
  - [ ] Different nodes per terminal

**Estimated Effort**: 8-10 hours
**Files to Update**: `src/components/Terminal.tsx`

---

### 14. Guided Tutorials
**Impact**: Onboarding and learning

- [ ] **Interactive Walkthrough**
  - [ ] First-time user guide
  - [ ] Highlight UI elements
  - [ ] Step-by-step instructions
  - [ ] Can be dismissed/replayed

- [ ] **Video Tutorials**
  - [ ] Embedded video player
  - [ ] Tutorial library
  - [ ] Topics:
    - [ ] Getting started
    - [ ] MIG configuration walkthrough
    - [ ] Troubleshooting workflows
    - [ ] Benchmark execution
    - [ ] Lab system usage

- [ ] **Command Hints**
  - [ ] Contextual hints in terminal
  - [ ] "Did you mean...?" suggestions
  - [ ] Related commands suggestions

**Estimated Effort**: 8-10 hours
**Files to Create**: `src/components/Tutorial/`

---

### 15. Export and Reporting
**Impact**: Study progress tracking

- [ ] **Progress Reports**
  - [ ] Labs completed
  - [ ] Time spent
  - [ ] Commands practiced
  - [ ] Exam scores
  - [ ] Weak areas identified

- [ ] **Export Formats**
  - [ ] PDF report
  - [ ] JSON data
  - [ ] CSV for analysis
  - [ ] Share progress link

- [ ] **Certificates**
  - [ ] Completion certificate for all labs
  - [ ] Practice exam pass certificate
  - [ ] Printable/shareable

**Estimated Effort**: 6-8 hours
**Files to Create**: `src/utils/reporting.ts`

---

## 🔵 POLISH & QUALITY

### 16. Testing
- [ ] **Unit Tests**
  - [ ] Simulator command parsing
  - [ ] State management logic
  - [ ] Hardware model generators
  - [ ] Fault injection logic
  - [ ] Target: 70%+ code coverage

- [ ] **Component Tests**
  - [ ] Terminal rendering
  - [ ] Dashboard updates
  - [ ] Node selection
  - [ ] Export/import

- [ ] **E2E Tests**
  - [ ] Full MIG workflow
  - [ ] Lab completion
  - [ ] Exam taking
  - [ ] Troubleshooting scenarios

- [ ] **Test Framework Setup**
  - [ ] Vitest for unit tests
  - [ ] React Testing Library
  - [ ] Playwright for E2E
  - [ ] CI/CD pipeline (GitHub Actions)

**Estimated Effort**: 16-20 hours

---

### 17. Performance Optimization
- [ ] **Code Splitting**
  - [ ] Lazy load lab content
  - [ ] Lazy load exam questions
  - [ ] Lazy load documentation
  - [ ] Reduce initial bundle size

- [ ] **Memoization**
  - [ ] Memoize expensive calculations
  - [ ] React.memo for components
  - [ ] useMemo for derived state
  - [ ] useCallback for handlers

- [ ] **Virtual Scrolling**
  - [ ] Terminal output virtualization
  - [ ] Large command history
  - [ ] Long sensor lists

- [ ] **Web Workers**
  - [ ] Metrics simulation in worker
  - [ ] Benchmark calculations in worker
  - [ ] Keep UI responsive

**Estimated Effort**: 8-10 hours

---

### 18. Accessibility
- [ ] **Keyboard Navigation**
  - [ ] Full keyboard control
  - [ ] Focus indicators
  - [ ] Keyboard shortcuts guide

- [ ] **Screen Reader Support**
  - [ ] ARIA labels
  - [ ] Semantic HTML
  - [ ] Status announcements

- [ ] **Color Contrast**
  - [ ] WCAG AA compliance
  - [ ] High contrast mode
  - [ ] Color-blind friendly

**Estimated Effort**: 6-8 hours

---

### 19. Documentation
- [ ] **API Documentation**
  - [ ] TypeDoc for code
  - [ ] Simulator interfaces
  - [ ] State management guide

- [ ] **Contributing Guide**
  - [ ] Development setup
  - [ ] Code style guide
  - [ ] PR process
  - [ ] Adding new simulators

- [ ] **Deployment Guide**
  - [ ] Build for production
  - [ ] Environment variables
  - [ ] Hosting options (Vercel, Netlify, GitHub Pages)
  - [ ] Docker containerization

**Estimated Effort**: 4-6 hours

---

### 20. Mobile Responsiveness
- [ ] **Responsive Layouts**
  - [ ] Mobile-first design
  - [ ] Tablet optimization
  - [ ] Touch-friendly controls

- [ ] **Mobile Terminal**
  - [ ] Virtual keyboard
  - [ ] Touch gestures
  - [ ] Landscape mode

**Note**: Full mobile support is challenging for a terminal-heavy app. Consider this optional.

**Estimated Effort**: 10-12 hours

---

## 📊 Summary Statistics

### By Priority
- **High Priority**: 5 major features | ~70-80 hours
- **Medium Priority**: 5 major features | ~90-110 hours
- **Low Priority**: 5 major features | ~50-60 hours
- **Polish & Quality**: 5 categories | ~50-60 hours

### Total Estimated Effort
**260-310 hours** (approximately 6-8 weeks full-time or 3-4 months part-time)

### Recommended Implementation Order

**Phase 1** (2-3 weeks): Complete High Priority
1. NVSM simulator
2. Mellanox tools
3. Slurm
4. Container tools
5. BCM

**Phase 2** (3-4 weeks): Medium Priority Core
1. Interactive lab scenarios (at least Domain 4 & 5)
2. Fault injection system
3. Practice exam (even with 50 questions)
4. Real-time metrics activation

**Phase 3** (2-3 weeks): Polish
1. Testing framework
2. Performance optimization
3. Documentation completion
4. Bug fixes from Phase 1 & 2

**Phase 4** (Optional): Low Priority Features
- Add based on user feedback and demand

### MVP+ Definition (100% Exam Ready)
Complete **High Priority** + **Lab Scenarios** + **Fault Injection** = ~120-140 hours

This gives users:
- ✅ All exam commands
- ✅ Hands-on practice labs
- ✅ Troubleshooting scenarios
- ✅ Realistic environment

---

## 🎯 Quick Wins (High Impact, Low Effort)

These can be done in 1-2 hours each for quick progress:

- [ ] Add command aliases (e.g., `ll` for `ls -la`)
- [ ] Add `man` command with help pages
- [ ] Add `history` command
- [ ] Implement `clear` improvements
- [ ] Add more XID error examples
- [ ] Create cheat sheet PDF
- [ ] Add keyboard shortcut overlay (press `?`)
- [ ] Implement dark/light theme toggle
- [ ] Add "Copy" buttons for command examples in docs
- [ ] Add search in documentation tab

---

## 📝 Notes

- **Current State**: Solid foundation with 70% completion
- **Core Strength**: Terminal and command simulators are production-ready
- **Main Gap**: Missing key tools (NVSM, Mellanox, Slurm) for full exam coverage
- **Biggest Impact**: Complete High Priority items for comprehensive exam prep
- **Best ROI**: Lab scenarios + fault injection for practical learning

---

**Want to contribute?** Pick any unchecked item and start coding! Each section includes estimated effort to help with planning.
