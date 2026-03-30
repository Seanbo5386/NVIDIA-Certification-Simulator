export interface XIDDrillQuestion {
  id: string;
  tier: 1 | 2 | 3;
  xidCode: number | number[];
  questionText: string;
  codeSnippet?: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  category: "identify" | "triage" | "scenario";
}

export const xidDrillQuestions: XIDDrillQuestion[] = [
  // ========================================================================
  // TIER 1: "What does XID X indicate?" — Identification questions
  // ========================================================================
  {
    id: "t1-xid13",
    tier: 1,
    xidCode: 13,
    questionText: "What does XID error 13 indicate?",
    choices: [
      "Graphics engine exception during shader or CUDA kernel execution",
      "Uncorrectable double-bit ECC error in GPU memory",
      "GPU has fallen off the PCIe bus",
      "NVLink training failure between GPUs",
    ],
    correctAnswer: 0,
    explanation:
      "XID 13 is a Graphics Engine Exception. It typically occurs during shader or CUDA kernel execution and is often caused by a misbehaving application, shader bug, or driver issue. It may also indicate a CUDA kernel timeout.",
    category: "identify",
  },
  {
    id: "t1-xid27",
    tier: 1,
    xidCode: 27,
    questionText: "What does XID error 27 indicate?",
    choices: [
      "NVLink communication timeout between GPUs",
      "GPU memory interface error — communication between GPU core and VRAM failed",
      "Driver firmware version mismatch",
      "GPU stopped responding to driver commands",
    ],
    correctAnswer: 1,
    explanation:
      "XID 27 is a GPU Memory Interface Error, meaning communication between the GPU core and VRAM has failed. This is typically caused by a hardware defect in the memory controller, memory bus issue, or severe overheating. GPU replacement is likely required if persistent.",
    category: "identify",
  },
  {
    id: "t1-xid38",
    tier: 1,
    xidCode: 38,
    questionText: "What does XID error 38 indicate?",
    choices: [
      "GPU thermal shutdown due to overheating",
      "NVLink ECC error on the data path",
      "Driver firmware mismatch — loaded firmware does not match expected version",
      "Row remapping threshold exceeded in GPU memory",
    ],
    correctAnswer: 2,
    explanation:
      "XID 38 is a Driver Firmware Mismatch. It occurs when the loaded driver firmware does not match the expected version, typically caused by an incomplete driver installation, corrupted firmware, or a driver/firmware version mismatch. Reinstalling NVIDIA drivers completely is the primary fix.",
    category: "identify",
  },
  {
    id: "t1-xid43",
    tier: 1,
    xidCode: 43,
    questionText: "What does XID error 43 indicate?",
    choices: [
      "Single-bit ECC error rate has exceeded threshold",
      "GPU firmware needs to be updated",
      "GPU has stopped responding and cannot be recovered",
      "NVLink flow control credits exhausted",
    ],
    correctAnswer: 2,
    explanation:
      "XID 43 means the GPU has stopped responding and cannot be recovered. Common causes include GPU hang, thermal throttling, power issues, or hardware failure. Checking GPU temperature and cooling, then attempting a GPU reset, are the recommended first steps.",
    category: "identify",
  },
  {
    id: "t1-xid48",
    tier: 1,
    xidCode: 48,
    questionText: "What does XID error 48 indicate?",
    choices: [
      "GPU memory page fault during application execution",
      "Uncorrectable double-bit ECC error in GPU memory",
      "High rate of correctable single-bit ECC errors",
      "GPU memory interface communication failure",
    ],
    correctAnswer: 1,
    explanation:
      "XID 48 is a Double-Bit ECC Error — an uncorrectable error in GPU memory. Unlike single-bit errors which can be corrected, double-bit errors indicate failing hardware. GPU replacement is required if errors persist.",
    category: "identify",
  },
  {
    id: "t1-xid54",
    tier: 1,
    xidCode: 54,
    questionText: "What does XID error 54 indicate?",
    choices: [
      "GPU preemptive resource cleanup after application exit",
      "Hardware watchdog timeout — GPU unresponsive to internal health checks",
      "Display engine error in rendering pipeline",
      "Invalid or corrupted GPU command buffer",
    ],
    correctAnswer: 1,
    explanation:
      "XID 54 is a Hardware Watchdog Timeout, meaning the GPU hardware watchdog detected that the GPU is unresponsive to internal health checks. This is more severe than XID 43 and often requires a node reboot. Recurring instances indicate GPU replacement is needed.",
    category: "identify",
  },
  {
    id: "t1-xid63",
    tier: 1,
    xidCode: 63,
    questionText: "What does XID error 63 indicate?",
    choices: [
      "NVLink failed to complete link training",
      "Row remapping failure — GPU memory error correction capacity exhausted",
      "GPU copy engine encountered a transfer error",
      "Contained ECC error handled successfully",
    ],
    correctAnswer: 1,
    explanation:
      "XID 63 is a Row Remapping Failure. It means the GPU failed to remap a memory row with errors, indicating that the GPU memory has exhausted its error correction capacity. Hardware failure is imminent and GPU replacement is required.",
    category: "identify",
  },
  {
    id: "t1-xid74",
    tier: 1,
    xidCode: 74,
    questionText: "What does XID error 74 indicate?",
    choices: [
      "GPU memory interface communication failure",
      "Driver firmware version mismatch",
      "NVLink error — fault detected on NVLink interconnect",
      "GPU thermal throttling activated",
    ],
    correctAnswer: 2,
    explanation:
      "XID 74 is an NVLink Error, indicating a fault detected on the NVLink interconnect. Causes include NVLink cable faults, GPU seating issues, or hardware failure on the NVLink bridge. Checking NVLink status with nvidia-smi nvlink -s and verifying physical connections are the first steps.",
    category: "identify",
  },
  {
    id: "t1-xid79",
    tier: 1,
    xidCode: 79,
    questionText: "What does XID error 79 indicate?",
    choices: [
      "GPU stopped responding but can be reset",
      "GPU has fallen off the PCIe bus and is completely unreachable",
      "NVLink timeout during GPU-to-GPU communication",
      "ECC error that could not be contained",
    ],
    correctAnswer: 1,
    explanation:
      "XID 79 means the GPU has fallen off the PCIe bus — it is completely unresponsive and disconnected. This is a severe hardware failure caused by power issues, thermal shutdown, or PCIe link failure. GPU reset will NOT work because the GPU is unreachable. A node reboot and hardware inspection are required.",
    category: "identify",
  },
  {
    id: "t1-xid92",
    tier: 1,
    xidCode: 92,
    questionText: "What does XID error 92 indicate?",
    choices: [
      "Uncorrectable double-bit ECC error",
      "Uncontained ECC error with possible data corruption",
      "Elevated rate of correctable single-bit ECC errors",
      "Row remapping threshold exceeded",
    ],
    correctAnswer: 2,
    explanation:
      "XID 92 indicates a High Single-Bit ECC Rate — an elevated rate of correctable single-bit ECC errors. While these errors are corrected, the increasing rate is an early indicator of memory degradation and potential future failure. Proactive monitoring and planning for GPU replacement is recommended.",
    category: "identify",
  },
  {
    id: "t1-xid95",
    tier: 1,
    xidCode: 95,
    questionText: "What does XID error 95 indicate?",
    choices: [
      "Contained ECC error — data integrity maintained",
      "High rate of correctable single-bit ECC errors",
      "Uncontained ECC error — data may be corrupted",
      "GPU memory page fault from application bug",
    ],
    correctAnswer: 2,
    explanation:
      "XID 95 is an Uncontained ECC Error, meaning an ECC error occurred that could not be contained and data may be corrupted. This is a critical error requiring immediate attention: check running workloads for data corruption, run diagnostics, and consider GPU replacement.",
    category: "identify",
  },
  {
    id: "t1-xid64",
    tier: 1,
    xidCode: 64,
    questionText: "What does XID error 64 indicate?",
    choices: [
      "NVLink ECC error on the data path",
      "Memory row remapping has reached its threshold — GPU memory health degraded",
      "GPU stopped responding to driver health checks",
      "Graphics engine exception during shader execution",
    ],
    correctAnswer: 1,
    explanation:
      "XID 64 is Row Remapping Threshold Exceeded. It means too many memory rows have been remapped due to errors, indicating degraded GPU memory health. Proactive GPU replacement should be scheduled.",
    category: "identify",
  },
  {
    id: "t1-xid76",
    tier: 1,
    xidCode: 76,
    questionText: "What does XID error 76 indicate?",
    choices: [
      "NVLink operation timed out during GPU communication",
      "NVLink failed to complete link training — link cannot establish connection",
      "NVLink flow control credits exhausted",
      "NVLink ECC error on the data path",
    ],
    correctAnswer: 1,
    explanation:
      "XID 76 is an NVLink Training Error, meaning NVLink failed to complete link training and cannot establish a connection. This indicates a physical NVLink connection problem, NVLink bridge damage, or GPU hardware failure. Reseating GPUs and NVLink bridges is the first step.",
    category: "identify",
  },
  {
    id: "t1-xid77",
    tier: 1,
    xidCode: 77,
    questionText: "What does XID error 77 indicate?",
    choices: [
      "NVLink operation timed out — communication between GPUs failed",
      "GPU hardware watchdog detected a timeout",
      "GPU fell off the PCIe bus",
      "NVLink link training failed",
    ],
    correctAnswer: 0,
    explanation:
      "XID 77 is an NVLink Timeout, indicating that an NVLink operation timed out and communication between GPUs has failed. This can be caused by NVLink link failure, severe congestion, or hardware faults. Checking NVLink error counters and fabric manager status are the first steps.",
    category: "identify",
  },
  {
    id: "t1-xid78",
    tier: 1,
    xidCode: 78,
    questionText: "What does XID error 78 indicate?",
    choices: [
      "High rate of correctable single-bit ECC errors in GPU memory",
      "Row remapping failure in GPU memory",
      "Uncorrectable ECC error on the NVLink data path",
      "Driver firmware version mismatch",
    ],
    correctAnswer: 2,
    explanation:
      "XID 78 is an NVLink ECC Error — an uncorrectable ECC error on the NVLink data path. This indicates hardware failure in the NVLink fabric, potentially affecting the NVSwitch or GPU NVLink interface. Hardware replacement is likely required.",
    category: "identify",
  },

  // ========================================================================
  // TIER 2: Triage with codeSnippet — severity and next-action questions
  // ========================================================================
  {
    id: "t2-xid48-ecc",
    tier: 2,
    xidCode: 48,
    questionText:
      "You see this in dmesg. What is the severity level and recommended first action?",
    codeSnippet: `[  842.156789] NVRM: Xid (PCI:0000:3b:00): 48, pid=12345, name=python3, Double Bit ECC Error`,
    choices: [
      "Warning — restart the application and monitor",
      "Critical — check ECC counters with nvidia-smi -q -d ECC and run dcgmi diag -r 3",
      "Informational — no action needed, errors are auto-corrected",
      "Warning — update NVIDIA drivers to latest version",
    ],
    correctAnswer: 1,
    explanation:
      "XID 48 (Double-Bit ECC Error) is Critical severity. Double-bit errors are uncorrectable and indicate failing hardware. The first actions are to check ECC counters and run memory diagnostics. GPU replacement is required if errors persist.",
    category: "triage",
  },
  {
    id: "t2-xid79-fallen",
    tier: 2,
    xidCode: 79,
    questionText:
      "You see this error in the system log. What should you do first?",
    codeSnippet: `[15234.891234] NVRM: Xid (PCI:0000:af:00): 79, pid=0, GPU has fallen off the bus.
[15234.891456] NVRM: GPU 0000:af:00.0: GPU has fallen off the bus.
[15234.891678] NVRM: A GPU crash dump has been created.`,
    choices: [
      "Run nvidia-smi --gpu-reset to recover the GPU",
      "Restart the CUDA application with higher memory limits",
      "Check system logs for thermal/power events, then plan a node reboot and hardware inspection",
      "Update the NVIDIA driver and reboot",
    ],
    correctAnswer: 2,
    explanation:
      "XID 79 (GPU Fallen Off Bus) means the GPU is completely unreachable on the PCIe bus. GPU reset will NOT work because the GPU is disconnected. You must check for thermal or power events that caused it, plan a node reboot, and perform hardware inspection of the PCIe slot and power delivery.",
    category: "triage",
  },
  {
    id: "t2-xid43-hang",
    tier: 2,
    xidCode: 43,
    questionText:
      "A user reports their training job is frozen. You find this in dmesg. What is the appropriate response?",
    codeSnippet: `[  567.234567] NVRM: Xid (PCI:0000:3b:00): 43, pid=8901, name=python3, Ch 00000010
[  567.234789] NVRM: Xid (PCI:0000:3b:00): 43, pid=8901, name=python3, Ch 00000010`,
    choices: [
      "Ignore it — XID 43 is informational and resolves automatically",
      "Check GPU temperature, verify cooling, and attempt nvidia-smi --gpu-reset",
      "Reinstall NVIDIA drivers immediately",
      "Check NVLink status with nvidia-smi nvlink -s",
    ],
    correctAnswer: 1,
    explanation:
      "XID 43 (GPU Stopped Responding) is a Critical error often caused by thermal issues, power problems, or hardware failure. The recommended first steps are to check GPU temperature, verify the cooling system, and attempt a GPU reset. If persistent, hardware replacement may be needed.",
    category: "triage",
  },
  {
    id: "t2-xid92-sbe",
    tier: 2,
    xidCode: 92,
    questionText:
      "You see this in monitoring logs. What action should you take?",
    codeSnippet: `[12045.678901] NVRM: Xid (PCI:0000:3b:00): 92, pid=0, High Single-bit ECC Error Rate
[12048.123456] NVRM: Xid (PCI:0000:3b:00): 92, pid=0, High Single-bit ECC Error Rate
[12051.987654] NVRM: Xid (PCI:0000:3b:00): 92, pid=0, High Single-bit ECC Error Rate`,
    choices: [
      "No action needed — single-bit errors are always harmless",
      "Immediately replace the GPU — this is an uncorrectable error",
      "Monitor ECC counters with nvidia-smi -q -d ECC, track error rate, and schedule preventive maintenance",
      "Reset ECC counters and ignore future occurrences",
    ],
    correctAnswer: 2,
    explanation:
      "XID 92 (High Single-Bit ECC Rate) is a Warning severity. While single-bit errors are corrected, an elevated rate is an early indicator of memory degradation. The correct approach is to monitor ECC counters, track the error rate over time, and schedule preventive maintenance. Proactive GPU replacement should be considered if the rate increases.",
    category: "triage",
  },
  {
    id: "t2-xid38-firmware",
    tier: 2,
    xidCode: 38,
    questionText:
      "After a driver update, you see this error. What is the most likely cause and fix?",
    codeSnippet: `[    4.567890] NVRM: Xid (PCI:0000:3b:00): 38, pid=0, Driver Firmware Mismatch
[    4.567901] NVRM: GPU 0000:3b:00.0: Failed to initialize firmware`,
    choices: [
      "The GPU hardware is defective and needs replacement",
      "Incomplete driver installation — reinstall NVIDIA drivers completely",
      "The PCIe link is degraded — reseat the GPU",
      "NVLink firmware needs separate update",
    ],
    correctAnswer: 1,
    explanation:
      "XID 38 (Driver Firmware Mismatch) occurs when loaded driver firmware does not match the expected version. After a driver update, this most likely indicates an incomplete installation. The fix is to completely reinstall NVIDIA drivers and verify firmware versions with nvidia-smi -q.",
    category: "triage",
  },
  {
    id: "t2-xid13-app",
    tier: 2,
    xidCode: 13,
    questionText:
      "A developer reports intermittent crashes in their CUDA application. You find this in dmesg. What should you advise?",
    codeSnippet: `[  234.567890] NVRM: Xid (PCI:0000:3b:00): 13, pid=4567, name=train.py, Graphics Exception on Channel 0x0010`,
    choices: [
      "Replace the GPU immediately — this indicates hardware failure",
      "Check application logs, verify CUDA toolkit version compatibility, and update NVIDIA drivers",
      "Reseat the NVLink bridge connections",
      "Check ECC counters for memory errors",
    ],
    correctAnswer: 1,
    explanation:
      "XID 13 (Graphics Engine Exception) is typically an application-level issue caused by a misbehaving application, shader bug, or driver incompatibility. The recommended first steps are to check application logs, verify CUDA toolkit version compatibility, and update drivers. Only if persistent should you run dcgmi diag -r 3 to rule out hardware issues.",
    category: "triage",
  },
  {
    id: "t2-xid54-watchdog",
    tier: 2,
    xidCode: 54,
    questionText:
      "You see this error and nvidia-smi hangs when you run it. What should you do?",
    codeSnippet: `[  789.012345] NVRM: Xid (PCI:0000:3b:00): 54, pid=0, Hardware Watchdog Timeout
[  789.012456] NVRM: Xid (PCI:0000:3b:00): 54, pid=0, Hardware Watchdog Timeout`,
    choices: [
      "Wait for the GPU to recover — watchdog timeouts are transient",
      "Run nvidia-smi --gpu-reset (it will always work for XID 54)",
      "Check GPU temperature, check system event log with ipmitool sel list, and plan a node reboot",
      "Reinstall NVIDIA drivers and reboot",
    ],
    correctAnswer: 2,
    explanation:
      "XID 54 (Hardware Watchdog Timeout) is more severe than XID 43. The GPU is unresponsive to internal health checks, and nvidia-smi --gpu-reset may not work. The recommended actions are to check GPU temperature, review the system event log with ipmitool sel list, and plan a node reboot. If recurring, GPU replacement is required.",
    category: "triage",
  },
  {
    id: "t2-xid74-nvlink",
    tier: 2,
    xidCode: 74,
    questionText:
      "Multi-GPU training suddenly fails. You find this in dmesg. What is your first diagnostic step?",
    codeSnippet: `[ 3456.789012] NVRM: Xid (PCI:0000:3b:00): 74, pid=5678, name=nccl, NVLink Error on GPU 0000:3b:00`,
    choices: [
      "Check ECC error counters on GPU memory",
      "Check NVLink status with nvidia-smi nvlink -s and error counters with nvidia-smi nvlink -e",
      "Reinstall the CUDA toolkit",
      "Run nvidia-smi --gpu-reset on all GPUs",
    ],
    correctAnswer: 1,
    explanation:
      "XID 74 (NVLink Error) indicates a fault on the NVLink interconnect. The first diagnostic step is to check NVLink status and error counters with nvidia-smi nvlink -s and nvidia-smi nvlink -e. You should also verify GPU seating and NVLink bridge connections physically.",
    category: "triage",
  },
  {
    id: "t2-xid63-rowremap",
    tier: 2,
    xidCode: 63,
    questionText:
      "You find this error in the system log during a routine health check. What does this mean for the GPU?",
    codeSnippet: `[ 9876.543210] NVRM: Xid (PCI:0000:86:00): 63, pid=0, Row Remapping Failure
[ 9876.543321] NVRM: GPU 0000:86:00.0: Row remapper: new failure detected`,
    choices: [
      "The GPU memory is healthy — row remapping successfully fixed the error",
      "The GPU memory has exhausted its error correction capacity — replacement required",
      "A minor software issue — restart the GPU driver",
      "NVLink fabric needs reconfiguration",
    ],
    correctAnswer: 1,
    explanation:
      "XID 63 (Row Remapping Failure) means the GPU failed to remap a memory row with errors, indicating that the GPU memory has exhausted its error correction capacity. Hardware failure is imminent and GPU replacement is required. Check status with nvidia-smi -q -d ROW_REMAPPER and document error counts for the RMA process.",
    category: "triage",
  },
  {
    id: "t2-xid95-uncontained",
    tier: 2,
    xidCode: 95,
    questionText:
      "A large-scale training run is in progress when you see this. What is the immediate priority?",
    codeSnippet: `[24680.135790] NVRM: Xid (PCI:0000:3b:00): 95, pid=9876, name=python3, Uncontained ECC Error`,
    choices: [
      "Continue the training run — the error was likely transient",
      "Immediately check running workloads for data corruption and review checkpoint integrity",
      "Reset ECC counters and continue monitoring",
      "Schedule a preventive maintenance window for next week",
    ],
    correctAnswer: 1,
    explanation:
      "XID 95 (Uncontained ECC Error) is a Critical error where data integrity cannot be guaranteed. The immediate priority during a training run is to check for data corruption in running workloads and verify checkpoint integrity. Run dcgmi diag -r 3 and consider GPU replacement.",
    category: "triage",
  },
  {
    id: "t2-xid76-training",
    tier: 2,
    xidCode: 76,
    questionText:
      "After installing new GPUs, nvidia-smi topo -m shows missing NVLink connections and you see this error. What is the most likely fix?",
    codeSnippet: `[   12.345678] NVRM: Xid (PCI:0000:3b:00): 76, pid=0, NVLink Training Error
[   12.345789] NVRM: GPU 0000:3b:00.0: NVLink link 2 failed training`,
    choices: [
      "Update the NVIDIA driver to a newer version",
      "Run dcgmi diag -r 3 to fix the NVLink configuration",
      "Check and reseat physical NVLink bridge/cable connections",
      "Increase the GPU power limit to support NVLink",
    ],
    correctAnswer: 2,
    explanation:
      "XID 76 (NVLink Training Error) after new GPU installation most likely indicates a physical connection problem. The NVLink bridge or cable may not be properly seated. Reseating GPUs and NVLink bridges is the most likely fix. If persistent after reseating, the NVLink bridge or GPU may need replacement.",
    category: "triage",
  },
  {
    id: "t2-xid64-threshold",
    tier: 2,
    xidCode: 64,
    questionText:
      "Your monitoring system flags this on a production GPU. What is the appropriate response?",
    codeSnippet: `[ 8765.432100] NVRM: Xid (PCI:0000:3b:00): 64, pid=0, Row Remapping Threshold Exceeded`,
    choices: [
      "No action needed — the GPU will continue to remap rows",
      "Schedule proactive GPU replacement and increase monitoring frequency",
      "Disable ECC to prevent further remapping",
      "Run nvidia-smi --gpu-reset to clear the remapping table",
    ],
    correctAnswer: 1,
    explanation:
      "XID 64 (Row Remapping Threshold Exceeded) means too many memory rows have been remapped. The GPU memory health is degraded. The appropriate response is to schedule a proactive GPU replacement and increase monitoring frequency with nvidia-smi -q -d ROW_REMAPPER.",
    category: "triage",
  },

  // ========================================================================
  // TIER 3: Multi-XID scenario — prioritization and complex diagnosis
  // ========================================================================
  {
    id: "t3-ecc-cascade",
    tier: 3,
    xidCode: [92, 48, 95],
    questionText:
      "You see the following sequence of errors over a 2-hour period. Which error should you prioritize and why?",
    codeSnippet: `[10000.000000] NVRM: Xid (PCI:0000:3b:00): 92, pid=0, High Single-bit ECC Error Rate
[10045.123456] NVRM: Xid (PCI:0000:3b:00): 92, pid=0, High Single-bit ECC Error Rate
[10890.567890] NVRM: Xid (PCI:0000:3b:00): 48, pid=5678, name=python3, Double Bit ECC Error
[11234.901234] NVRM: Xid (PCI:0000:3b:00): 95, pid=5678, name=python3, Uncontained ECC Error`,
    choices: [
      "Prioritize XID 92 — it appeared first and is the root cause",
      "Prioritize XID 48 — double-bit errors are always the most critical",
      "Prioritize XID 95 — uncontained ECC means data corruption is possible, then address the full memory failure chain",
      "All are equally important — address them in chronological order",
    ],
    correctAnswer: 2,
    explanation:
      "This shows a classic ECC degradation cascade: high single-bit rate (92) escalated to uncorrectable double-bit (48) and then to uncontained (95). XID 95 is the immediate priority because data corruption may have occurred — you must check workload integrity first. Then address the root cause: the GPU memory is failing and replacement is required. The XID 92 warnings were the early indicator.",
    category: "scenario",
  },
  {
    id: "t3-nvlink-multi",
    tier: 3,
    xidCode: [76, 74, 77],
    questionText:
      "A multi-GPU training job crashes. You find these errors in dmesg. What is the root cause and what should you check first?",
    codeSnippet: `[  500.111111] NVRM: Xid (PCI:0000:3b:00): 76, pid=0, NVLink Training Error
[  500.222222] NVRM: Xid (PCI:0000:3b:00): 74, pid=3456, name=nccl, NVLink Error
[  500.333333] NVRM: Xid (PCI:0000:86:00): 77, pid=3456, name=nccl, NVLink Timeout
[  500.444444] NVRM: Xid (PCI:0000:86:00): 74, pid=3456, name=nccl, NVLink Error`,
    choices: [
      "Prioritize XID 77 — timeouts are the most severe NVLink error",
      "Prioritize XID 76 — the training error is the root cause; check physical NVLink connections and run nvidia-smi topo -m",
      "Prioritize XID 74 — it appears most frequently, indicating widespread NVLink failure",
      "Ignore NVLink errors — they are transient and will resolve after restarting the job",
    ],
    correctAnswer: 1,
    explanation:
      "XID 76 (NVLink Training Error) is the root cause — the NVLink link failed to train (establish connection), which then caused NVLink errors (74) and timeouts (77) on communication attempts. Check physical NVLink connections first with nvidia-smi topo -m to see which links are missing, then reseat NVLink bridges. The other errors are downstream consequences.",
    category: "scenario",
  },
  {
    id: "t3-thermal-cascade",
    tier: 3,
    xidCode: [43, 54, 79],
    questionText:
      "Over a 10-minute period during a heatwave, you see the following errors on one GPU. What is the likely root cause and correct escalation path?",
    codeSnippet: `[20000.000000] NVRM: Xid (PCI:0000:af:00): 43, pid=7890, name=python3, Ch 00000010
[20015.123456] NVRM: Xid (PCI:0000:af:00): 43, pid=7890, name=python3, Ch 00000010
[20120.234567] NVRM: Xid (PCI:0000:af:00): 54, pid=0, Hardware Watchdog Timeout
[20300.345678] NVRM: Xid (PCI:0000:af:00): 79, pid=0, GPU has fallen off the bus.`,
    choices: [
      "This is a driver bug — reinstall NVIDIA drivers",
      "Thermal failure cascade: GPU overheated (43), watchdog tripped (54), then thermal shutdown caused PCIe disconnect (79). Check cooling system immediately.",
      "PCIe link failure: the GPU fell off the bus (79) causing all other errors. Reseat the GPU.",
      "Application bug caused the GPU hang (43) — fix the application code",
    ],
    correctAnswer: 1,
    explanation:
      "During a heatwave, this is a classic thermal failure cascade. XID 43 (GPU stopped responding) appeared first due to thermal throttling. When cooling was insufficient, the hardware watchdog triggered (XID 54). Finally, thermal shutdown caused the GPU to disconnect from the PCIe bus (XID 79). The root cause is thermal — check the cooling system, fan operation, and airflow immediately.",
    category: "scenario",
  },
  {
    id: "t3-memory-nvlink",
    tier: 3,
    xidCode: [48, 78, 63],
    questionText:
      "During a distributed training run across 8 GPUs, you see these errors on GPU 3. Which errors indicate the most urgent hardware issue?",
    codeSnippet: `[ 5000.111111] NVRM: Xid (PCI:0000:86:00): 48, pid=2345, name=python3, Double Bit ECC Error
[ 5000.222222] NVRM: Xid (PCI:0000:86:00): 78, pid=2345, name=nccl, NVLink ECC Error
[ 5001.333333] NVRM: Xid (PCI:0000:86:00): 63, pid=0, Row Remapping Failure
[ 5001.444444] NVRM: Xid (PCI:0000:86:00): 48, pid=2345, name=python3, Double Bit ECC Error`,
    choices: [
      "XID 78 — NVLink ECC errors affect all 8 GPUs in the distributed run",
      "XID 48 — double-bit ECC errors are always the highest priority",
      "XID 63 — row remapping failure means GPU memory error correction is exhausted; combined with XID 48 and 78, GPU 3 needs immediate replacement",
      "All are equally critical — replace all NVLink bridges first",
    ],
    correctAnswer: 2,
    explanation:
      "XID 63 (Row Remapping Failure) is the most urgent indicator because it means GPU 3's memory has exhausted its error correction capacity. The double-bit ECC errors (48) confirm active memory failure, and the NVLink ECC error (78) suggests the memory corruption is affecting data transfers between GPUs. GPU 3 needs immediate replacement. The other GPUs are likely fine.",
    category: "scenario",
  },
  {
    id: "t3-mixed-severity",
    tier: 3,
    xidCode: [13, 38, 43],
    questionText:
      "After a driver update, multiple users report GPU issues. You see these errors across different GPUs. What is the most likely common cause?",
    codeSnippet: `[  100.111111] NVRM: Xid (PCI:0000:3b:00): 38, pid=0, Driver Firmware Mismatch
[  100.222222] NVRM: Xid (PCI:0000:86:00): 38, pid=0, Driver Firmware Mismatch
[  200.333333] NVRM: Xid (PCI:0000:3b:00): 13, pid=1234, name=python3, Graphics Exception
[  200.444444] NVRM: Xid (PCI:0000:86:00): 43, pid=5678, name=train.py, GPU Stopped Responding`,
    choices: [
      "Multiple GPUs are failing simultaneously — hardware issue in the node",
      "XID 38 on multiple GPUs indicates the driver update was incomplete; reinstall NVIDIA drivers completely to resolve all errors",
      "XID 43 is the primary concern — focus on the GPU that stopped responding",
      "XID 13 is an application bug unrelated to the other errors",
    ],
    correctAnswer: 1,
    explanation:
      "XID 38 (Driver Firmware Mismatch) appearing on multiple GPUs after a driver update is the key clue — the driver installation was incomplete. The subsequent XID 13 (Graphics Exception) and XID 43 (GPU Stopped Responding) are downstream effects of the firmware mismatch. Completely reinstalling NVIDIA drivers should resolve all errors since the root cause is the incomplete driver update, not hardware failure.",
    category: "scenario",
  },
  {
    id: "t3-production-triage",
    tier: 3,
    xidCode: [27, 48, 64],
    questionText:
      "A production inference server shows degrading performance. Monitoring reveals these errors over the past 24 hours. How should you prioritize your response?",
    codeSnippet: `[  --- 6 hours ago ---]
[43200.111111] NVRM: Xid (PCI:0000:3b:00): 64, pid=0, Row Remapping Threshold Exceeded
[  --- 2 hours ago ---]
[57600.222222] NVRM: Xid (PCI:0000:3b:00): 48, pid=4321, name=inference, Double Bit ECC Error
[57601.333333] NVRM: Xid (PCI:0000:3b:00): 48, pid=4321, name=inference, Double Bit ECC Error
[  --- 30 minutes ago ---]
[63000.444444] NVRM: Xid (PCI:0000:3b:00): 27, pid=4321, name=inference, GPU Memory Interface Error`,
    choices: [
      "Focus on XID 27 — memory interface errors are the most recent and urgent",
      "Focus on XID 48 — double-bit ECC errors are always top priority",
      "This is a progressive memory failure: row remapping exhausted (64), then uncorrectable errors (48), now memory interface failure (27). Migrate workloads off this GPU and schedule immediate replacement.",
      "Reset ECC counters and monitor for another 24 hours before taking action",
    ],
    correctAnswer: 2,
    explanation:
      "This shows progressive GPU memory failure over 24 hours. XID 64 (row remapping threshold exceeded) was the first warning that memory health was degraded. XID 48 (double-bit ECC errors) confirmed uncorrectable failures began. XID 27 (memory interface error) indicates the memory subsystem is now critically failing. The correct response is to immediately migrate workloads and replace the GPU — waiting will risk data corruption and unplanned downtime.",
    category: "scenario",
  },
];
