/**
 * Hardware Text Substitution
 *
 * Replaces {{PLACEHOLDER}} tokens in scenario text with actual values
 * from the hardware specs registry, based on the currently selected system type.
 *
 * This allows narrative scenario JSON to use generic placeholders like
 * "{{SYSTEM_NAME}}" instead of hardcoding "DGX A100" or "DGX H100",
 * so the scenario text always matches the simulator's selected architecture.
 */

import { useMemo } from "react";
import {
  getHardwareSpecs,
  getSystemDisplayName,
  type SystemType,
} from "@/data/hardwareSpecs";
import { useSimulationStore } from "@/store/simulationStore";

/**
 * Build a lookup table of placeholder → value for a given system type.
 */
function buildPlaceholderMap(systemType: SystemType): Record<string, string> {
  const specs = getHardwareSpecs(systemType);
  const displayName = getSystemDisplayName(systemType);

  // Short GPU model name: "A100", "H100", "B200", etc.
  const gpuModelShort = specs.gpu.model.replace("NVIDIA ", "").split("-")[0];

  return {
    SYSTEM_NAME: displayName, // "DGX A100"
    SYSTEM_TYPE: systemType, // "DGX-A100"
    GPU_MODEL: gpuModelShort, // "A100"
    GPU_MODEL_FULL: specs.gpu.model.replace("NVIDIA ", ""), // "A100-SXM4-80GB"
    GPU_COUNT: String(specs.gpu.count), // "8"
    GPU_MEMORY_GB: String(specs.gpu.memoryGB), // "80"
    GPU_MEMORY_MIB: String(specs.gpu.memoryMiB), // "81920"
    GPU_MEMORY_TYPE: specs.gpu.memoryType, // "HBM2e"
    GPU_TDP_W: String(specs.gpu.tdpWatts), // "400"
    GPU_ARCHITECTURE: specs.gpu.architecture, // "ga100"
    GPU_SXM_VERSION: specs.gpu.sxmVersion, // "SXM4"
    NVLINK_VERSION: specs.nvlink.version, // "3.0"
    NVLINK_LABEL: specs.nvlink.nvLinkLabel, // "NV12"
    NVLINK_LINKS_PER_GPU: String(specs.nvlink.linksPerGpu), // "12"
    NVLINK_BW_GBS: String(specs.nvlink.totalBandwidthGBs), // "600"
    NVSWITCH_COUNT: String(specs.nvlink.nvSwitchCount), // "6"
    NET_PROTOCOL: specs.network.protocol, // "HDR"
    NET_RATE_GBS: String(specs.network.portRateGbs), // "200"
    NET_HCA_MODEL: specs.network.hcaModel, // "ConnectX-6"
    NET_HCA_COUNT: String(specs.network.hcaCount), // "8"
    SYSTEM_MEMORY_GB: String(specs.system.systemMemoryGB), // "1024"
    TOTAL_GPU_MEMORY_GB: String(specs.system.totalGpuMemoryGB), // "640"
  };
}

// Cache: avoid rebuilding the map on every call for the same systemType
let cachedType: SystemType | null = null;
let cachedMap: Record<string, string> = {};

const PLACEHOLDER_RE = /\{\{([A-Z_]+)\}\}/g;

/**
 * Replace all `{{PLACEHOLDER}}` tokens in `text` with hardware-specific values.
 *
 * Returns the original string unchanged if it contains no placeholders.
 */
export function substituteHardwareText(
  text: string,
  systemType: SystemType,
): string {
  if (!text || !text.includes("{{")) return text;

  if (cachedType !== systemType) {
    cachedType = systemType;
    cachedMap = buildPlaceholderMap(systemType);
  }

  return text.replace(PLACEHOLDER_RE, (match, key: string) => {
    return cachedMap[key] ?? match;
  });
}

/**
 * React hook that returns a memoized substitution function bound to the
 * current systemType from the simulation store.
 *
 * Usage: `const sub = useHardwareText();`  then  `sub(someText)`
 */
export function useHardwareText(): (text: string) => string {
  const systemType = useSimulationStore((s) => s.systemType);
  return useMemo(
    () => (text: string) => substituteHardwareText(text, systemType),
    [systemType],
  );
}
