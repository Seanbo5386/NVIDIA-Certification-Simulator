# Test Plan

Complete test matrix for DC Lab Sim.

## Test Categories

| Category                       | Priority | Description                         |
| ------------------------------ | -------- | ----------------------------------- |
| CLI Commands                   | High     | All 15 simulator command sets       |
| **Cross-Command Dependencies** | **High** | **State shared between simulators** |
| Lab Scenarios                  | High     | 15 labs across 5 domains            |
| Lab Validation                 | High     | `requireAllCommands` behavior       |
| Fault Injection                | High     | XID, thermal, ECC errors            |
| UI/Dashboard                   | Medium   | Navigation, metrics, controls       |
| Edge Cases                     | Medium   | Invalid inputs, errors              |

---

## Cross-Command State Dependencies

Commands share state through the cluster store. Changes from one command affect the output of others.

### XID Error Propagation

When XID errors are injected, they should appear across multiple tools:

| XID Injection               | Affected Commands                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XID 79 (GPU fallen off bus) | `nvidia-smi` (GPU missing), `nvidia-smi --gpu-reset` (fails), `dcgmi diag` (GPU inaccessible), `dcgmi health` (critical)                                       |
| Any XID error               | `dmesg \| grep -i xid` (shows error), `ipmitool sel list` (SEL entry), `lspci -v` (error state), `journalctl` (kernel message), `nvsm show health` (unhealthy) |

**Test Sequence:**

1. Run `nvidia-smi` → 8 GPUs visible
2. Inject XID 79 on GPU 0
3. Run `nvidia-smi` → GPU 0 NOT visible
4. Run `dmesg | grep -i xid` → XID 79 message shown
5. Run `ipmitool sel list` → GPU error in SEL
6. Run `dcgmi health --check` → GPU 0 critical
7. Run `nvidia-smi --gpu-reset -i 0` → Reset FAILS

### MIG Mode State

MIG configuration affects multiple tools:

| MIG Command                               | Affected Commands                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `nvidia-smi -i 0 -mig 1` (enable)         | `nvidia-smi` (shows MIG Enabled), `nvidia-smi mig -lgi` (instances available), `dcgmi discovery -l` (GPU partitioned) |
| `nvidia-smi mig -i 0 -cgi 19 -C` (create) | `nvidia-smi` (shows MIG instance), `nvidia-smi mig -lgi` (instance listed), `nvidia-smi -q` (MIG details)             |
| `nvidia-smi mig -i 0 -dgi` (destroy)      | All above revert                                                                                                      |
| `nvidia-smi -i 0 -mig 0` (disable)        | All above revert                                                                                                      |

**Test Sequence:**

1. Run `nvidia-smi mig -lgi` → No instances
2. Run `nvidia-smi -i 0 -mig 1` → MIG enabled
3. Run `nvidia-smi` → Shows "MIG Mode: Enabled"
4. Run `nvidia-smi mig -lgip` → Profiles available
5. Run `nvidia-smi mig -i 0 -cgi 19 -C` → Instance created
6. Run `nvidia-smi mig -lgi` → Instance listed
7. Cleanup: destroy and disable MIG

### Power/Thermal State

Power and thermal commands affect metrics:

| Configuration Command                   | Affected Commands                                                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `nvidia-smi -i 0 -pl 350` (power limit) | `nvidia-smi` (power limit shown), `ipmitool dcmi power reading` (affected), `dcgmi dmon` (power metric)                                         |
| `nvidia-smi -i 0 -pm 1` (persistence)   | `nvidia-smi` (shows Persistence-M: On)                                                                                                          |
| High temperature injection              | `nvidia-smi` (throttling shown), `nvidia-smi -q` (clocks reduced), `dcgmi health` (thermal warning), `ipmitool sensor list` (temp sensors high) |

### GPU Reset State

Successful reset clears errors:

| Reset Action                                   | State Changes                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `nvidia-smi --gpu-reset -i 0` (success)        | XID errors cleared, `dmesg` log updated, `nvidia-smi` shows healthy GPU |
| `nvidia-smi --gpu-reset -i 0` (fails - XID 79) | GPU remains off bus, error message returned                             |

### Slurm Node State

Slurm tracks node availability:

| Slurm Command        | State Changes  | Affected Commands                                          |
| -------------------- | -------------- | ---------------------------------------------------------- |
| `sbatch script.sh`   | Node allocated | `sinfo` (node busy), `squeue` (job listed)                 |
| `scancel <jobid>`    | Node freed     | `sinfo` (node idle), `squeue` (job removed)                |
| Node fault injection | Node drained   | `sinfo` (node drain), `scontrol show nodes` (state: DRAIN) |

### ECC Error State

ECC errors propagate to health checks:

| ECC Error                  | Affected Commands                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Single-bit (correctable)   | `nvidia-smi -q` (ECC count), `dcgmi health` (warning), `nvsm show health`                                |
| Double-bit (uncorrectable) | `nvidia-smi -q` (ECC count), `dcgmi health` (critical), `dcgmi diag` (fails), `ipmitool sel` (SEL entry) |

### NVLink State

NVLink status affects topology:

| NVLink Change            | Affected Commands                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| NVLink failure injection | `nvidia-smi nvlink --status` (link Down), `nvidia-smi topo -m` (bandwidth affected), `dcgmi health` (NVLink warning) |

### Container/Slurm GPU Access

GPU visibility in containers depends on state:

| GPU State       | Container Impact                           |
| --------------- | ------------------------------------------ |
| GPU healthy     | `docker run --gpus all` → All GPUs visible |
| GPU with XID 79 | Container sees fewer GPUs                  |
| MIG enabled     | Container sees MIG instances               |

---

## CLI Command Tests

### nvidia-smi (15 tests)

| Command                        | Expected Result       |
| ------------------------------ | --------------------- |
| `nvidia-smi`                   | GPU table with 8 GPUs |
| `nvidia-smi -L`                | List GPUs with UUIDs  |
| `nvidia-smi -q`                | Detailed query output |
| `nvidia-smi -q -i 0`           | Query specific GPU    |
| `nvidia-smi -q -d MEMORY`      | Memory details        |
| `nvidia-smi -q -d TEMPERATURE` | Temperature details   |
| `nvidia-smi topo -m`           | Topology matrix       |
| `nvidia-smi nvlink --status`   | NVLink status         |
| `nvidia-smi -i 0 -pl 350`      | Set power limit       |
| `nvidia-smi -i 0 -pm 1`        | Persistence mode      |
| `nvidia-smi -i 0 -mig 1`       | Enable MIG            |
| `nvidia-smi mig -lgip`         | List MIG profiles     |
| `nvidia-smi mig -lgi`          | List GPU instances    |
| `nvidia-smi --gpu-reset -i 0`  | GPU reset             |
| `nvidia-smi --help`            | Help output           |

### DCGM (8 tests)

| Command                | Expected Result     |
| ---------------------- | ------------------- |
| `dcgmi discovery -l`   | List GPUs           |
| `dcgmi health --check` | Health results      |
| `dcgmi diag -r 1`      | Quick diagnostic    |
| `dcgmi diag -r 2`      | Medium diagnostic   |
| `dcgmi diag -r 3`      | Extended diagnostic |
| `dcgmi group -l`       | List groups         |
| `dcgmi dmon`           | Monitoring output   |
| `dcgmi stats -v`       | Stats verbose       |

### ipmitool (8 tests)

| Command                   | Expected Result  |
| ------------------------- | ---------------- |
| `ipmitool sensor list`    | All sensors      |
| `ipmitool sdr list`       | SDR records      |
| `ipmitool sel list`       | System Event Log |
| `ipmitool sel elist`      | Extended SEL     |
| `ipmitool mc info`        | BMC info         |
| `ipmitool chassis status` | Chassis status   |
| `ipmitool fru print`      | FRU inventory    |
| `ipmitool lan print 1`    | LAN config       |

### InfiniBand (6 tests)

| Command        | Expected Result      |
| -------------- | -------------------- |
| `ibstat`       | HCA status           |
| `ibstatus`     | Port summary         |
| `ibportstate`  | Port state           |
| `ibporterrors` | Error counters       |
| `iblinkinfo`   | Fabric links         |
| `perfquery`    | Performance counters |

### Slurm (8 tests)

| Command               | Expected Result       |
| --------------------- | --------------------- |
| `sinfo`               | Partition/node status |
| `sinfo -N`            | Node-centric view     |
| `squeue`              | Job queue listing     |
| `squeue -u root`      | User jobs             |
| `scontrol show nodes` | Node details          |
| `sbatch script.sh`    | Submit batch job      |
| `srun hostname`       | Run command           |
| `scancel <jobid>`     | Cancel job            |

### Container Tools (8 tests)

| Command                   | Expected Result    |
| ------------------------- | ------------------ |
| `docker ps`               | Running containers |
| `docker ps -a`            | All containers     |
| `docker images`           | Image listing      |
| `docker --version`        | Version info       |
| `ngc config current`      | NGC config         |
| `ngc registry image list` | Registry images    |
| `enroot list`             | Enroot containers  |
| `enroot --version`        | Version info       |

### Mellanox Tools (6 tests)

| Command                    | Expected Result   |
| -------------------------- | ----------------- |
| `mst status`               | MST devices       |
| `mst status -v`            | Verbose status    |
| `mlxconfig -d <dev> query` | Device config     |
| `mlxlink -d <dev>`         | Link status       |
| `mlxcables`                | Cable diagnostics |
| `mlxup -q`                 | Firmware query    |

### BCM/Cluster (4 tests)

| Command                | Expected Result   |
| ---------------------- | ----------------- |
| `bcm-node list`        | Node listing      |
| `bcm-node show dgx-01` | Node details      |
| `crm status`           | Cluster resources |
| `bcm --version`        | Version info      |

### Basic System (8 tests)

| Command                      | Expected Result |
| ---------------------------- | --------------- |
| `lscpu`                      | CPU info        |
| `free`                       | Memory usage    |
| `free -h`                    | Human readable  |
| `dmidecode -t bios`          | BIOS info       |
| `dmidecode -t memory`        | Memory slots    |
| `dmesg`                      | Kernel messages |
| `dmesg \| grep -i xid`       | XID errors      |
| `systemctl status nvsm-core` | Service status  |

### PCI/Journalctl (6 tests)

| Command             | Expected Result |
| ------------------- | --------------- |
| `lspci`             | PCI devices     |
| `lspci -v`          | Verbose         |
| `lspci -d 10de:`    | NVIDIA devices  |
| `journalctl`        | System logs     |
| `journalctl -b`     | Boot logs       |
| `journalctl -p err` | Error logs      |

### Storage (4 tests)

| Command           | Expected Result |
| ----------------- | --------------- |
| `df -h`           | Disk usage      |
| `mount`           | Mount points    |
| `lsblk`           | Block devices   |
| `lustre` commands | Lustre status   |

### Benchmarks (4 tests)

| Command          | Expected Result   |
| ---------------- | ----------------- |
| NCCL tests       | Bandwidth results |
| HPL benchmark    | FLOPS numbers     |
| GPU burn         | Stress test       |
| Memory bandwidth | Throughput        |

### Interactive Shells (8 tests)

| Test                  | Expected Result     |
| --------------------- | ------------------- |
| `nvsm` enter          | NVSM prompt appears |
| NVSM `show health`    | Health status       |
| NVSM `exit`           | Return to bash      |
| `cmsh` enter          | CMSH prompt appears |
| CMSH `device` mode    | Mode switches       |
| CMSH `list`           | Objects listed      |
| CMSH `use dgx-node01` | Object selected     |
| CMSH `exit`           | Return to bash      |

---

## Lab Scenarios (15 labs)

### Domain 1: Systems Bring-Up (5 labs)

| Lab                      | Key Commands                |
| ------------------------ | --------------------------- |
| BMC Configuration        | `ipmitool mc info`, sensors |
| Driver Installation      | `nvidia-smi`, driver verify |
| Driver Troubleshooting   | `lsmod`, `dmesg`, errors    |
| GPU Feature Discovery    | Device enumeration          |
| Server POST Verification | Boot sequence, health       |

### Domain 2: Physical Layer (2 labs)

| Lab               | Key Commands                  |
| ----------------- | ----------------------------- |
| MIG Configuration | MIG enable, partition, verify |
| NVLink Topology   | `nvidia-smi topo -m`, links   |

### Domain 3: Control Plane (3 labs)

| Lab                 | Key Commands                  |
| ------------------- | ----------------------------- |
| Container Runtime   | `docker`, `ngc`, GPU access   |
| Slurm Configuration | `sinfo`, `sbatch`, scheduling |
| Storage Validation  | `mount`, `lustre`, verify     |

### Domain 4: Testing & Verification (3 labs)

| Lab               | Key Commands            |
| ----------------- | ----------------------- |
| Cluster Health    | Full health assessment  |
| DCGMI Diagnostics | All diagnostic levels   |
| NCCL Testing      | Multi-GPU communication |

### Domain 5: Troubleshooting (2 labs)

| Lab                     | Key Commands           |
| ----------------------- | ---------------------- |
| XID Error Analysis      | `dmesg \| grep -i xid` |
| Thermal Troubleshooting | Temperature queries    |

---

## Lab Validation Behavior

| Test                         | Expected Result             |
| ---------------------------- | --------------------------- |
| Run 1 of 2 required commands | Step does NOT advance       |
| Validation progress color    | Amber/orange (not red)      |
| Feedback message             | "Keep going! 1/2 completed" |
| Command checklist            | ✓ completed, ○ pending      |
| Run all required commands    | Step auto-advances          |
| Similar command matching     | Flexible flag matching      |

---

## UI/Dashboard Tests

| Test                | Expected Result            |
| ------------------- | -------------------------- |
| App loads           | Welcome screen, no errors  |
| Dashboard tab       | Node selector, GPU cards   |
| Terminal tab        | Command prompt ready       |
| Labs tab            | Labs by domain             |
| Documentation tab   | Quick start, XID reference |
| Node selection      | Context updates            |
| GPU metrics         | Real-time updates          |
| Simulation controls | Play/Pause/Reset work      |
| Export/Import       | State saves/loads          |

---

## Fault Injection Tests

| Fault                | Verification                             |
| -------------------- | ---------------------------------------- |
| XID 79 (GPU off bus) | GPU missing from nvidia-smi, reset fails |
| ECC single-bit       | Correctable count increases              |
| ECC double-bit       | Uncorrectable count, critical alert      |
| Thermal >85°C        | Throttling shown                         |
| NVLink failure       | Link "Down" status                       |
| Clear all faults     | System returns healthy                   |

---

## Edge Cases

| Test                   | Expected Result            |
| ---------------------- | -------------------------- |
| Empty command          | No action, new prompt      |
| Invalid command        | "command not found"        |
| Invalid flags          | Error message              |
| GPU index out of range | Error for `-i 99`          |
| Very long command      | Handles gracefully         |
| Special characters     | Proper handling            |
| Command history (↑/↓)  | Previous commands          |
| Pipe operations        | `nvidia-smi \| grep` works |

---

## User Journey Tests (End-to-End Scenarios)

Complete workflows that test the full learning experience:

| Journey                      | Steps                                                                         | Success Criteria                |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| **New User Onboarding**      | Welcome → Dashboard → First command → First lab                               | No confusion points, clear path |
| **Complete a Lab**           | Select lab → Read instructions → Run all commands → Complete all steps → Exit | All steps validated correctly   |
| **Troubleshooting Scenario** | Inject fault → Diagnose with multiple tools → Identify root cause → Resolve   | Realistic debugging experience  |
| **Exam Preparation**         | Complete all Domain 5 labs → Take practice exam → Review answers              | Score reflects understanding    |
| **Full Certification Prep**  | Complete all 15 labs → Pass all exams → Export progress                       | Learning objectives met         |

---

## Hint System Tests

Progressive hint unlocking based on user behavior:

| Trigger                | Expected Hint Behavior            |
| ---------------------- | --------------------------------- |
| First minute of step   | No hints available yet            |
| After 2+ minutes stuck | Level 1 hint unlocks              |
| After failed attempt   | More specific hint unlocks        |
| Type `hint` command    | Shows next available hint         |
| All hints revealed     | "No more hints" message           |
| Commands already run   | Hints reference what's been tried |

---

## Exam Mode Tests

| Test                 | Expected Result                     |
| -------------------- | ----------------------------------- |
| Start exam           | Timer starts, questions loaded      |
| Timer countdown      | Updates every second                |
| Timer expires        | Auto-submit triggered               |
| Answer selection     | Answer saved immediately            |
| Flag for review      | Question marked, visible in nav     |
| Navigate questions   | Forward/back works, state preserved |
| Submit exam          | Score calculated, results shown     |
| Review mode          | Shows correct/incorrect answers     |
| Exit exam            | Returns to main interface           |
| Terminal during exam | Commands work, context available    |

---

## Terminal Behavior Tests

| Test                | Expected Result                      |
| ------------------- | ------------------------------------ |
| Command history (↑) | Previous command recalled            |
| Command history (↓) | Next command or empty                |
| Ctrl+C              | Cancels current input                |
| Ctrl+L              | Clears terminal                      |
| Tab completion      | Command suggestions (if implemented) |
| Copy/paste          | Works in terminal                    |
| Terminal scroll     | Long output scrollable               |
| Multi-line output   | Rendered correctly                   |
| ANSI colors         | Colors displayed properly            |
| Prompt context      | Shows correct node (root@dgx-00:~#)  |

---

## Pipe and Filter Commands

| Command                             | Expected Result          |
| ----------------------------------- | ------------------------ |
| `nvidia-smi \| grep Memory`         | Only memory lines shown  |
| `nvidia-smi \| head -5`             | First 5 lines only       |
| `nvidia-smi \| tail -10`            | Last 10 lines only       |
| `nvidia-smi \| wc -l`               | Line count               |
| `dmesg \| grep -i xid`              | XID errors filtered      |
| `dmesg \| grep -i error`            | Errors filtered          |
| `squeue \| grep RUNNING`            | Running jobs only        |
| `ipmitool sensor list \| grep Temp` | Temperature sensors only |

---

## Multi-Node Context Tests

| Test                              | Expected Result                 |
| --------------------------------- | ------------------------------- |
| Select node in Dashboard          | Terminal context switches       |
| Prompt shows current node         | `root@dgx-XX:~#` updates        |
| Commands reflect node state       | GPU data is node-specific       |
| Switch node mid-lab               | Lab continues, context correct  |
| Different nodes, different faults | Each node has independent state |

---

## Output Realism Tests

Verify simulated output matches real NVIDIA tools:

| Command                | Realism Checks                                   |
| ---------------------- | ------------------------------------------------ |
| `nvidia-smi`           | Header format, GPU table alignment, memory units |
| `nvidia-smi -q`        | All section headers present, proper indentation  |
| `dcgmi diag`           | Progress dots, timing, pass/fail format          |
| `ipmitool sensor list` | Pipe-delimited columns, threshold format         |
| `dmesg`                | Timestamp format, kernel message style           |
| `lspci`                | Bus:Device.Function format, vendor IDs           |

---

## Metrics Simulation Tests

| Test                     | Expected Result                         |
| ------------------------ | --------------------------------------- |
| GPU utilization changes  | Values fluctuate realistically (0-100%) |
| Temperature variation    | Reasonable range (30-85°C)              |
| Power draw variation     | Within power limit bounds               |
| Memory usage realistic   | Gradual changes, not random spikes      |
| Metrics update frequency | Dashboard refreshes smoothly            |
| Fault affects metrics    | Injected fault changes readings         |

---

## Documentation/Help Tests

| Test               | Expected Result                   |
| ------------------ | --------------------------------- |
| `help` command     | Lists available commands          |
| `<command> --help` | Shows command usage               |
| Documentation tab  | Quick start loads                 |
| XID reference      | XID codes documented              |
| Search in docs     | Finds relevant content            |
| Links work         | Internal links navigate correctly |

---

## Negative/Stress Tests

Intentionally trying to break things:

| Test                     | Expected Result                  |
| ------------------------ | -------------------------------- |
| 100+ rapid commands      | No crashes, no memory leak       |
| Very long session (1hr+) | Performance stable               |
| Corrupt state injection  | Graceful error handling          |
| Rapid node switching     | No race conditions               |
| Start lab while in lab   | Handles gracefully               |
| Submit empty exam        | Validation error                 |
| Invalid JSON import      | Error message, no crash          |
| Browser refresh mid-lab  | State preserved (if implemented) |

---

## Accessibility Tests

| Test                | Expected Result                    |
| ------------------- | ---------------------------------- |
| Keyboard navigation | All interactive elements reachable |
| Focus indicators    | Visible focus states               |
| Screen reader       | Content announced properly         |
| Color contrast      | Meets WCAG standards               |
| Font scaling        | UI handles larger fonts            |

---

## Coverage Goals

| Metric            | Target |
| ----------------- | ------ |
| Line coverage     | >90%   |
| Function coverage | >95%   |
| Branch coverage   | >85%   |
| Simulators tested | 15/15  |
| Labs tested       | 15/15  |

---

## Related Documentation

- [Testing Guide](./testing-guide.md) - How to run and write tests
- [Scenario Checklist](../SCENARIO_TESTING_CHECKLIST.md) - Lab validation criteria
