/**
 * Metrics History Utility
 *
 * Collects and manages time-series metrics data for GPU performance visualization.
 * Maintains a rolling window of historical snapshots for charting and analysis.
 */

import type { DGXNode } from '@/types/hardware';

/**
 * Single metric snapshot capturing GPU state at a point in time
 */
export interface MetricSnapshot {
  timestamp: number;
  nodeId: string;
  gpuId: number;
  utilization: number;
  temperature: number;
  powerDraw: number;
  memoryUsed: number;
  memoryTotal: number;
}

/**
 * MetricsHistory class manages time-series data collection
 *
 * Features:
 * - Rolling window of last 300 samples (5 minutes at 1Hz)
 * - Per-GPU metric tracking
 * - Automatic old data cleanup
 * - Query by node/GPU ID
 */
export class MetricsHistory {
  private static history: MetricSnapshot[] = [];
  private static maxSamples = 300; // 5 minutes at 1Hz sampling
  private static isCollecting = false;
  private static collectionInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Add a snapshot from a node's current GPU states
   */
  static addSnapshot(node: DGXNode): void {
    const timestamp = Date.now();

    node.gpus.forEach((gpu) => {
      this.history.push({
        timestamp,
        nodeId: node.id,
        gpuId: gpu.id,
        utilization: gpu.utilization,
        temperature: gpu.temperature,
        powerDraw: gpu.powerDraw,
        memoryUsed: gpu.memoryUsed,
        memoryTotal: gpu.memoryTotal,
      });
    });

    // Trim old data to maintain rolling window
    const maxEntries = this.maxSamples * node.gpus.length;
    if (this.history.length > maxEntries) {
      this.history = this.history.slice(-maxEntries);
    }
  }

  /**
   * Get historical metrics for a specific GPU
   */
  static getHistory(nodeId: string, gpuId: number | string): MetricSnapshot[] {
    const gpuIdNum = typeof gpuId === 'string' ? parseInt(gpuId.replace(/\D/g, '')) : gpuId;
    return this.history.filter(
      (s) => s.nodeId === nodeId && s.gpuId === gpuIdNum
    );
  }

  /**
   * Get history for all GPUs on a node
   */
  static getNodeHistory(nodeId: string): MetricSnapshot[] {
    return this.history.filter((s) => s.nodeId === nodeId);
  }

  /**
   * Get the last N samples for a specific GPU
   */
  static getRecentHistory(
    nodeId: string,
    gpuId: number | string,
    count: number
  ): MetricSnapshot[] {
    const filtered = this.getHistory(nodeId, gpuId);
    return filtered.slice(-count);
  }

  /**
   * Get history within a time range
   */
  static getHistoryInRange(
    nodeId: string,
    gpuId: number | string,
    startTime: number,
    endTime: number
  ): MetricSnapshot[] {
    const gpuIdNum = typeof gpuId === 'string' ? parseInt(gpuId.replace(/\D/g, '')) : gpuId;
    return this.history.filter(
      (s) =>
        s.nodeId === nodeId &&
        s.gpuId === gpuIdNum &&
        s.timestamp >= startTime &&
        s.timestamp <= endTime
    );
  }

  /**
   * Get aggregated stats for a GPU over the history window
   */
  static getStats(nodeId: string, gpuId: number | string) {
    const history = this.getHistory(nodeId, gpuId);

    if (history.length === 0) {
      return null;
    }

    const utils = history.map((s) => s.utilization);
    const temps = history.map((s) => s.temperature);
    const powers = history.map((s) => s.powerDraw);

    return {
      utilization: {
        avg: utils.reduce((a, b) => a + b, 0) / utils.length,
        min: Math.min(...utils),
        max: Math.max(...utils),
      },
      temperature: {
        avg: temps.reduce((a, b) => a + b, 0) / temps.length,
        min: Math.min(...temps),
        max: Math.max(...temps),
      },
      powerDraw: {
        avg: powers.reduce((a, b) => a + b, 0) / powers.length,
        min: Math.min(...powers),
        max: Math.max(...powers),
      },
      sampleCount: history.length,
      timeSpan: history.length > 0
        ? history[history.length - 1].timestamp - history[0].timestamp
        : 0,
    };
  }

  /**
   * Clear all historical data
   */
  static clear(): void {
    this.history = [];
  }

  /**
   * Clear history for a specific node
   */
  static clearNode(nodeId: string): void {
    this.history = this.history.filter((s) => s.nodeId !== nodeId);
  }

  /**
   * Clear history for a specific GPU
   */
  static clearGPU(nodeId: string, gpuId: number | string): void {
    const gpuIdNum = typeof gpuId === 'string' ? parseInt(gpuId.replace(/\D/g, '')) : gpuId;
    this.history = this.history.filter(
      (s) => !(s.nodeId === nodeId && s.gpuId === gpuIdNum)
    );
  }

  /**
   * Get current history size
   */
  static getSize(): number {
    return this.history.length;
  }

  /**
   * Get max samples setting
   */
  static getMaxSamples(): number {
    return this.maxSamples;
  }

  /**
   * Set max samples for rolling window
   */
  static setMaxSamples(maxSamples: number): void {
    this.maxSamples = maxSamples;
  }

  /**
   * Start automatic collection at specified interval
   *
   * @param getNode - Function to get current node for sampling
   * @param intervalMs - Collection interval in milliseconds (default: 1000ms)
   */
  static startCollection(getNode: () => DGXNode | null, intervalMs = 1000): void {
    if (this.isCollecting) {
      return; // Already collecting
    }

    this.isCollecting = true;
    this.collectionInterval = setInterval(() => {
      const node = getNode();
      if (node) {
        this.addSnapshot(node);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic collection
   */
  static stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isCollecting = false;
  }

  /**
   * Check if automatic collection is running
   */
  static isCollectionRunning(): boolean {
    return this.isCollecting;
  }
}
