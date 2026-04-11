/**
 * Comprehensive XID Error Reference for NVIDIA GPUs
 *
 * XID errors are logged by the NVIDIA driver when various GPU events occur.
 * They appear in system logs (dmesg, journalctl) and are critical for troubleshooting.
 *
 * Reference: NVIDIA Driver XID Messages documentation
 */

export type XIDSeverity = "Critical" | "Warning" | "Informational";
export type XIDCategory =
  | "Hardware"
  | "Driver"
  | "Application"
  | "Power"
  | "Memory"
  | "NVLink"
  | "Thermal";

export interface XIDError {
  code: number;
  name: string;
  severity: XIDSeverity;
  category: XIDCategory;
  description: string;
  cause: string;
  action: string[];
  examRelevance?: "High" | "Medium" | "Low";
  relatedCommands?: string[];
}

export const XID_ERRORS: XIDError[] = [
  // Critical Hardware Errors
  {
    code: 13,
    name: "Graphics Engine Exception",
    severity: "Warning",
    category: "Application",
    description: "Graphics engine exception occurred during shader execution.",
    cause:
      "Typically caused by a misbehaving application, shader bug, or driver issue. May also indicate CUDA kernel timeout.",
    action: [
      "Check application logs for errors",
      "Verify CUDA toolkit version compatibility",
      "Update NVIDIA drivers to latest version",
      "If persistent, run dcgmi diag -r 3 to rule out hardware issues",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi -q",
      "dcgmi diag -r 1",
      "dmesg | grep -i xid",
    ],
  },
  {
    code: 23,
    name: "GPU Shared Memory Exception",
    severity: "Warning",
    category: "Application",
    description: "GPU detected a shared memory access violation or exception.",
    cause:
      "Application accessed shared memory incorrectly, often due to out-of-bounds access in CUDA kernel or race conditions.",
    action: [
      "Debug CUDA kernel shared memory access patterns",
      "Use compute-sanitizer to identify race conditions",
      "Check for shared memory bank conflicts",
      "Verify kernel launch parameters and block dimensions",
      "Review __shared__ variable declarations",
    ],
    examRelevance: "Medium",
    relatedCommands: ["compute-sanitizer", "cuda-memcheck", "nvidia-smi"],
  },
  {
    code: 24,
    name: "GPU Exception During Kernel Launch",
    severity: "Warning",
    category: "Application",
    description: "An exception occurred while launching a GPU kernel.",
    cause:
      "Invalid kernel launch parameters, resource exhaustion, or driver issue. May indicate too many threads per block or insufficient resources.",
    action: [
      "Check kernel launch configuration (grid/block dimensions)",
      "Verify sufficient GPU resources available",
      "Review CUDA occupancy calculator for optimal config",
      "Check for CUDA API errors before launch",
      "Run with CUDA_LAUNCH_BLOCKING=1 for debugging",
    ],
    examRelevance: "Medium",
    relatedCommands: ["nvidia-smi -q", "compute-sanitizer"],
  },
  {
    code: 27,
    name: "GPU Memory Interface Error",
    severity: "Critical",
    category: "Memory",
    description:
      "Error at the GPU memory interface level - communication between GPU core and VRAM failed.",
    cause:
      "Hardware defect in memory controller, memory bus issue, or severe overheating affecting memory interface.",
    action: [
      "Check GPU temperature immediately: nvidia-smi -q -d TEMPERATURE",
      "Run memory diagnostics: dcgmi diag -r 3",
      "Check ECC error counters: nvidia-smi -q -d ECC",
      "If persistent, GPU REPLACEMENT likely required",
      "Document error for RMA process",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi -q -d ECC",
      "dcgmi diag -r 3",
      "nvidia-smi -q -d TEMPERATURE",
    ],
  },
  {
    code: 31,
    name: "GPU Memory Page Fault",
    severity: "Warning",
    category: "Application",
    description: "GPU memory page fault during application execution.",
    cause:
      "Application attempted to access invalid GPU memory. Usually caused by application bugs, buffer overruns, or incorrect memory management.",
    action: [
      "Debug application memory management",
      "Check for CUDA malloc failures",
      "Verify application is using valid memory addresses",
      "Enable compute-sanitizer for detailed debugging",
    ],
    examRelevance: "Medium",
    relatedCommands: ["nvidia-smi -q -d MEMORY", "compute-sanitizer"],
  },
  {
    code: 32,
    name: "Invalid or Corrupted Push Buffer",
    severity: "Warning",
    category: "Driver",
    description: "The GPU detected an invalid or corrupted command buffer.",
    cause:
      "Driver bug, memory corruption, or application incorrectly interfacing with the driver.",
    action: [
      "Update NVIDIA drivers",
      "Check system memory health (memtest86+)",
      "Verify PCIe link stability",
      "Reset GPU with nvidia-smi --gpu-reset",
    ],
    examRelevance: "Medium",
    relatedCommands: ["nvidia-smi --gpu-reset", "lspci -vv"],
  },
  {
    code: 38,
    name: "Driver Firmware Mismatch",
    severity: "Critical",
    category: "Driver",
    description:
      "The loaded driver firmware does not match the expected version.",
    cause:
      "Incomplete driver installation, corrupted firmware, or driver/firmware version mismatch.",
    action: [
      "Reinstall NVIDIA drivers completely",
      "Verify firmware versions with nvidia-smi -q",
      "Check for partial driver updates",
      "Consider driver rollback if recent update caused issue",
    ],
    examRelevance: "High",
    relatedCommands: ["nvidia-smi -q", "modinfo nvidia"],
  },
  {
    code: 43,
    name: "GPU Stopped Responding",
    severity: "Warning",
    category: "Application",
    description:
      "An application running on the GPU caused a hang. The GPU itself is still functional; the application context was lost.",
    cause:
      "Application bug, CUDA kernel timeout, or driver-level application fault. The GPU hardware remains healthy.",
    action: [
      "Kill the offending application or job",
      "Check SLURM job logs for the hung process",
      "Run nvidia-smi to verify GPU health after the hang clears",
      "Re-queue the job — no hardware intervention required",
      "If recurring for the same workload, investigate the application code",
    ],
    examRelevance: "High",
    relatedCommands: ["nvidia-smi", "squeue", "scancel"],
  },
  {
    code: 45,
    name: "Preemptive GPU Cleanup",
    severity: "Informational",
    category: "Driver",
    description:
      "GPU resources were cleaned up due to application termination.",
    cause:
      "Normal cleanup when application using GPU terminates (normal or abnormal exit).",
    action: [
      "No action needed if application terminated intentionally",
      "Check application logs if unexpected termination",
      "Monitor for pattern of crashes",
    ],
    examRelevance: "Low",
    relatedCommands: ["nvidia-smi"],
  },
  {
    code: 48,
    name: "Double-Bit ECC Error",
    severity: "Critical",
    category: "Memory",
    description: "Uncorrectable double-bit ECC error in GPU memory.",
    cause:
      "Hardware defect in GPU memory. Double-bit errors cannot be corrected and indicate failing hardware.",
    action: [
      "Check ECC counters: nvidia-smi -q -d ECC",
      "Monitor for increasing error rates",
      "Run memory diagnostics: dcgmi diag -r 3",
      "GPU REPLACEMENT REQUIRED if errors persist",
      "Contact NVIDIA support with diagnostic data",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi -q -d ECC",
      "dcgmi diag -r 3",
      "nvsm show health",
    ],
  },
  {
    code: 54,
    name: "Auxiliary Power Connector Not Connected",
    severity: "Critical",
    category: "Hardware",
    description:
      "GPU auxiliary power connector is not fully connected or not connected at all.",
    cause: "Missing or loose PCIe power cable connection to the GPU.",
    action: [
      "Power off the system immediately",
      "Reseat the auxiliary power connector on the GPU and ensure it clicks into place",
      "Inspect the cable for damage",
      "Verify PSU output capacity for the GPU TDP",
      "If problem persists after reseating, inspect cable and PSU",
    ],
    examRelevance: "High",
    relatedCommands: ["ipmitool sel list", "ipmitool chassis power status"],
  },
  {
    code: 56,
    name: "Display Engine Error",
    severity: "Warning",
    category: "Hardware",
    description: "Error in display engine operation.",
    cause: "Display driver issue or incompatible display configuration.",
    action: [
      "Update display drivers",
      "Check display cable connections",
      "Verify display resolution compatibility",
      "Typically not relevant for compute-only workloads",
    ],
    examRelevance: "Low",
    relatedCommands: ["nvidia-smi -q"],
  },
  {
    code: 57,
    name: "Error in Copy Engine",
    severity: "Warning",
    category: "Driver",
    description: "Error during GPU memory copy operation.",
    cause: "Memory transfer error, often due to PCIe issues or driver bugs.",
    action: [
      "Check PCIe link status: lspci -vv",
      "Verify GPU seating in slot",
      "Update NVIDIA drivers",
      "Run bandwidth test to verify PCIe health",
    ],
    examRelevance: "Medium",
    relatedCommands: ["lspci -vv", "nvidia-smi -q"],
  },
  {
    code: 62,
    name: "PMU Halt Error",
    severity: "Critical",
    category: "Hardware",
    description:
      "Power Management Unit (PMU) has halted. GPU is in an unrecoverable error state.",
    cause:
      "Firmware crash in the GPU PMU. Can result from hardware fault, overclocking, or firmware bug.",
    action: [
      "Collect diagnostic data before rebooting: nvidia-bug-report.sh",
      "Full system power cycle required (cold boot — not just reboot)",
      "After restart, verify GPU health: nvidia-smi -q",
      "Check dmesg for additional error context",
      "If persistent, RMA the GPU",
    ],
    examRelevance: "Medium",
    relatedCommands: [
      "nvidia-bug-report.sh",
      "nvidia-smi -q",
      "dmesg | grep -i xid",
    ],
  },
  {
    code: 63,
    name: "Row Remapping Success",
    severity: "Informational",
    category: "Memory",
    description:
      "A memory row has been successfully remapped to a spare row. GPU memory health is maintained.",
    cause:
      "Single-bit ECC errors accumulated on a memory row triggered the row retirement process.",
    action: [
      "No immediate action required",
      "Monitor retired page count: nvidia-smi --query-gpu=retired_pages.count --format=csv",
      "Schedule maintenance if retired page count grows rapidly",
      "Row remapping is a normal self-healing mechanism — single event is not alarming",
    ],
    examRelevance: "Medium",
    relatedCommands: [
      "nvidia-smi --query-gpu=retired_pages.count --format=csv",
      "nvidia-smi -q -d ROW_REMAPPER",
    ],
  },
  {
    code: 64,
    name: "Row Remapping Failure",
    severity: "Critical",
    category: "Memory",
    description:
      "Failed to record a row-remapping entry in the INFOROM. The remapping table may be full or INFOROM is corrupted.",
    cause: "Too many retired pages or INFOROM write failure.",
    action: [
      "Reboot the system immediately",
      "After restart, run: nvidia-smi --query-remapped-rows --format=csv to assess extent",
      "Run full diagnostics: dcgmi diag -r 3",
      "If INFOROM is corrupted, RMA the GPU",
      "Document error counts before initiating RMA",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi --query-remapped-rows --format=csv",
      "dcgmi diag -r 3",
      "nvsm show health",
    ],
  },
  {
    code: 68,
    name: "Video Processor Exception",
    severity: "Warning",
    category: "Hardware",
    description: "Error in video encoding/decoding engine.",
    cause: "Video codec error, unsupported format, or driver issue.",
    action: [
      "Check video codec compatibility",
      "Update NVIDIA drivers",
      "Verify input video format",
      "Not typically relevant for AI/HPC workloads",
    ],
    examRelevance: "Low",
    relatedCommands: ["nvidia-smi -q"],
  },
  {
    code: 69,
    name: "Graphics Engine Class Error",
    severity: "Warning",
    category: "Driver",
    description: "Error in graphics engine class operations.",
    cause: "Driver or application issue with graphics context.",
    action: [
      "Update NVIDIA drivers",
      "Check application compatibility",
      "Verify graphics mode settings",
    ],
    examRelevance: "Low",
    relatedCommands: ["nvidia-smi"],
  },
  {
    code: 72,
    name: "ROBUST_CHANNEL_CE5_ERROR",
    severity: "Warning",
    category: "NVLink",
    description:
      "NVLink flow control credits exhausted or flow control protocol error.",
    cause:
      "NVLink congestion, fabric manager issue, or link degradation. May indicate network-level problems in multi-GPU communication.",
    action: [
      "Check NVLink status: nvidia-smi nvlink -s",
      "Monitor NVLink error counters: nvidia-smi nvlink -e",
      "Verify fabric manager is running: systemctl status nv-fabricmanager",
      "Check for bandwidth bottlenecks in multi-GPU workloads",
      "May indicate early link degradation - monitor closely",
    ],
    examRelevance: "Medium",
    relatedCommands: [
      "nvidia-smi nvlink -s",
      "nvidia-smi nvlink -e",
      "systemctl status nv-fabricmanager",
    ],
  },
  {
    code: 74,
    name: "NVLink Error",
    severity: "Critical",
    category: "NVLink",
    description: "Error detected on NVLink interconnect.",
    cause:
      "NVLink cable fault, GPU seating issue, or hardware failure on NVLink bridge.",
    action: [
      "Check NVLink status: nvidia-smi nvlink -s",
      "Check NVLink errors: nvidia-smi nvlink -e",
      "Verify GPU seating and NVLink bridge connections",
      "Run NVLink diagnostics: dcgmi nvlink -e",
      "May require GPU reseat or replacement",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi nvlink -s",
      "nvidia-smi nvlink -e",
      "nvidia-smi topo -m",
    ],
  },
  {
    code: 76,
    name: "ROBUST_CHANNEL_CE7_ERROR",
    severity: "Critical",
    category: "NVLink",
    description:
      "NVLink failed to complete link training - link cannot establish connection.",
    cause:
      "Physical NVLink connection problem, NVLink bridge damage, or GPU hardware failure affecting NVLink interface.",
    action: [
      "Check physical NVLink bridge/cable connections",
      "Reseat GPUs and NVLink bridges",
      "Check nvidia-smi topo -m for missing links",
      "Run dcgmi diag -r 2 for NVLink diagnostics",
      "If persistent, NVLink bridge or GPU replacement required",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi topo -m",
      "nvidia-smi nvlink -s",
      "dcgmi diag -r 2",
    ],
  },
  {
    code: 77,
    name: "NVLink Timeout",
    severity: "Critical",
    category: "NVLink",
    description:
      "NVLink operation timed out - communication between GPUs failed.",
    cause:
      "NVLink link failure, severe congestion, or hardware fault preventing GPU-to-GPU communication.",
    action: [
      "Check NVLink error counters: nvidia-smi nvlink -e",
      "Verify fabric manager status",
      "Check for thermal issues on NVSwitch/GPUs",
      "Restart fabric manager: systemctl restart nv-fabricmanager",
      "May require node reboot",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi nvlink -e",
      "systemctl restart nv-fabricmanager",
    ],
  },
  {
    code: 78,
    name: "NVLink ECC Error",
    severity: "Critical",
    category: "NVLink",
    description: "Uncorrectable ECC error on NVLink data path.",
    cause:
      "Hardware failure in NVLink fabric, potentially NVSwitch or GPU NVLink interface failure.",
    action: [
      "Check NVLink error counters: nvidia-smi nvlink -e",
      "Identify affected link and GPUs",
      "Run comprehensive diagnostics: dcgmi diag -r 3",
      "Check NVSwitch health if applicable",
      "Hardware replacement likely required",
    ],
    examRelevance: "High",
    relatedCommands: [
      "nvidia-smi nvlink -e",
      "dcgmi diag -r 3",
      "nvsm show health",
    ],
  },
  {
    code: 79,
    name: "GPU Fallen Off Bus",
    severity: "Critical",
    category: "Hardware",
    description: "GPU has become unresponsive and disconnected from PCIe bus.",
    cause:
      "Severe hardware failure, power issue, thermal shutdown, or PCIe link failure. GPU is no longer communicating.",
    action: [
      "Check system logs for thermal or power events",
      "Verify power supply capacity",
      "Check PCIe slot and riser card",
      "Attempt warm reboot",
      "GPU reset will NOT work (GPU unreachable)",
      "May require node reboot and hardware inspection",
    ],
    examRelevance: "High",
    relatedCommands: [
      "dmesg | grep -i nvidia",
      "ipmitool sel list",
      "ipmitool sensor list",
    ],
  },
  {
    code: 92,
    name: "High Single-Bit ECC Rate",
    severity: "Warning",
    category: "Memory",
    description: "Elevated rate of correctable single-bit ECC errors.",
    cause:
      "Early indicator of memory degradation. Single-bit errors are corrected but increasing rate signals potential failure.",
    action: [
      "Monitor ECC counters: nvidia-smi -q -d ECC",
      "Track error rate over time",
      "Schedule preventive maintenance",
      "Consider proactive GPU replacement if rate increases",
    ],
    examRelevance: "High",
    relatedCommands: ["nvidia-smi -q -d ECC", "dcgmi health -c"],
  },
  {
    code: 94,
    name: "Contained ECC Error",
    severity: "Warning",
    category: "Memory",
    description:
      "ECC error that was successfully contained and did not affect data.",
    cause:
      "Memory error occurred but was handled by ECC. Data integrity maintained.",
    action: [
      "Monitor for increasing frequency",
      "Check ECC error counts",
      "No immediate action if isolated incident",
      "Investigate if pattern emerges",
    ],
    examRelevance: "Medium",
    relatedCommands: ["nvidia-smi -q -d ECC"],
  },
  {
    code: 95,
    name: "Uncontained ECC Error",
    severity: "Critical",
    category: "Memory",
    description:
      "ECC error that could not be contained - data may be corrupted.",
    cause: "Severe memory error. Data integrity cannot be guaranteed.",
    action: [
      "Immediately check running workloads for data corruption",
      "Run comprehensive diagnostics: dcgmi diag -r 3",
      "Consider GPU replacement",
      "Review checkpoint/restart procedures",
    ],
    examRelevance: "High",
    relatedCommands: ["dcgmi diag -r 3", "nvidia-smi -q -d ECC"],
  },
  {
    code: 119,
    name: "GSP Error",
    severity: "Critical",
    category: "Hardware",
    description: "GPU System Processor (GSP) error detected.",
    cause: "Firmware issue or hardware fault in GPU system processor.",
    action: [
      "Attempt GPU reset: nvidia-smi --gpu-reset",
      "Reboot node if reset fails",
      "Update firmware/drivers",
      "May indicate hardware failure",
    ],
    examRelevance: "Medium",
    relatedCommands: ["nvidia-smi --gpu-reset"],
  },
];

// Helper functions for filtering and searching
export const getXIDByCode = (code: number): XIDError | undefined => {
  return XID_ERRORS.find((xid) => xid.code === code);
};

export const getXIDsBySeverity = (severity: XIDSeverity): XIDError[] => {
  return XID_ERRORS.filter((xid) => xid.severity === severity);
};

export const getXIDsByCategory = (category: XIDCategory): XIDError[] => {
  return XID_ERRORS.filter((xid) => xid.category === category);
};

export const getCriticalXIDs = (): XIDError[] => {
  return XID_ERRORS.filter((xid) => xid.severity === "Critical");
};

export const getHighExamRelevanceXIDs = (): XIDError[] => {
  return XID_ERRORS.filter((xid) => xid.examRelevance === "High");
};

export const searchXIDs = (query: string): XIDError[] => {
  const lowerQuery = query.toLowerCase();
  return XID_ERRORS.filter(
    (xid) =>
      xid.name.toLowerCase().includes(lowerQuery) ||
      xid.description.toLowerCase().includes(lowerQuery) ||
      xid.cause.toLowerCase().includes(lowerQuery) ||
      String(xid.code).includes(query),
  );
};

// Severity color mapping for UI
export const SEVERITY_COLORS: Record<
  XIDSeverity,
  { text: string; bg: string; border: string }
> = {
  Critical: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  Warning: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  Informational: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
};

// Category icons for UI (using lucide icon names)
export const CATEGORY_ICONS: Record<XIDCategory, string> = {
  Hardware: "Cpu",
  Driver: "Settings",
  Application: "Code",
  Power: "Zap",
  Memory: "HardDrive",
  NVLink: "Link",
  Thermal: "Thermometer",
};
