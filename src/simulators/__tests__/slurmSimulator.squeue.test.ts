import { describe, it, expect, beforeEach, vi } from "vitest";
import { SlurmSimulator } from "../slurmSimulator";
import { useSimulationStore } from "@/store/simulationStore";
import { parse } from "@/utils/commandParser";

vi.mock("@/store/simulationStore");

describe("SlurmSimulator squeue -w/--nodelist filtering", () => {
  let simulator: SlurmSimulator;
  const context = {
    currentNode: "dgx-00",
    currentPath: "/root",
    environment: {},
    history: [],
  };

  beforeEach(() => {
    simulator = new SlurmSimulator();
    vi.mocked(useSimulationStore.getState).mockReturnValue({
      cluster: {
        nodes: [
          {
            id: "dgx-00",
            hostname: "dgx-00.cluster.local",
            gpus: Array(8)
              .fill(null)
              .map((_, i) => ({
                id: i,
                name: "NVIDIA H100 80GB HBM3",
              })),
            cpuCount: 2,
            ramTotal: 2048,
            ramUsed: 512,
            slurmState: "idle",
            slurmReason: undefined,
          },
          {
            id: "dgx-07",
            hostname: "dgx-07.cluster.local",
            gpus: Array(8)
              .fill(null)
              .map((_, i) => ({
                id: i,
                name: "NVIDIA H100 80GB HBM3",
              })),
            cpuCount: 2,
            ramTotal: 2048,
            ramUsed: 256,
            slurmState: "alloc",
            slurmReason: undefined,
          },
        ],
      },
      setSlurmState: vi.fn(),
      allocateGPUsForJob: vi.fn(),
      deallocateGPUsForJob: vi.fn(),
    } as unknown as ReturnType<typeof useSimulationStore.getState>);

    // Set up jobs on different nodes via internal array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (simulator as any).jobs = [
      {
        jobId: 1001,
        name: "train_a",
        user: "user1",
        partition: "batch",
        state: "RUNNING",
        time: "0:05:00",
        timeLimit: "1:00:00",
        nodes: 1,
        nodelist: "dgx-07",
        cpus: 8,
        gpus: 8,
        memory: "64G",
        submitTime: new Date(Date.now() - 300000),
        startTime: new Date(Date.now() - 300000),
        priority: 100,
        account: "research",
        qos: "normal",
        workDir: "/home/user1",
        command: "train.sh",
      },
      {
        jobId: 1002,
        name: "train_b",
        user: "user2",
        partition: "batch",
        state: "RUNNING",
        time: "0:10:00",
        timeLimit: "2:00:00",
        nodes: 1,
        nodelist: "dgx-00",
        cpus: 8,
        gpus: 4,
        memory: "32G",
        submitTime: new Date(Date.now() - 600000),
        startTime: new Date(Date.now() - 600000),
        priority: 100,
        account: "research",
        qos: "normal",
        workDir: "/home/user2",
        command: "train.sh",
      },
      {
        jobId: 1003,
        name: "eval_c",
        user: "user1",
        partition: "batch",
        state: "PENDING",
        time: "0:00:00",
        timeLimit: "0:30:00",
        nodes: 1,
        nodelist: "(Resources)",
        cpus: 4,
        gpus: 0,
        memory: "16G",
        submitTime: new Date(Date.now() - 60000),
        priority: 50,
        account: "research",
        qos: "normal",
        workDir: "/home/user1",
        command: "eval.sh",
      },
    ];
  });

  it("squeue -w filters jobs by nodelist", () => {
    const result = simulator.executeSqueue(parse("squeue -w dgx-07"), context);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("dgx-07");
    expect(result.output).toContain("train_a");
    expect(result.output).not.toContain("dgx-00");
    expect(result.output).not.toContain("train_b");
    expect(result.output).not.toContain("eval_c");
  });

  it("squeue --nodelist filters jobs by nodelist", () => {
    const result = simulator.executeSqueue(
      parse("squeue --nodelist dgx-07"),
      context,
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("dgx-07");
    expect(result.output).toContain("train_a");
    expect(result.output).not.toContain("dgx-00");
  });

  it("squeue -w with comma-separated nodes filters multiple nodes", () => {
    const result = simulator.executeSqueue(
      parse("squeue -w dgx-07,dgx-00"),
      context,
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("dgx-07");
    expect(result.output).toContain("dgx-00");
    expect(result.output).toContain("train_a");
    expect(result.output).toContain("train_b");
  });

  it("squeue without -w returns all jobs", () => {
    const result = simulator.executeSqueue(parse("squeue"), context);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("train_a");
    expect(result.output).toContain("train_b");
    expect(result.output).toContain("eval_c");
  });
});
