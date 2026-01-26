import type {
  ClusterConfig,
  DGXNode,
  GPU,
  BlueFieldDPU,
  InfiniBandHCA,
  BMC,
  NVLinkConnection,
  InfiniBandPort,
  BMCSensor,
} from '@/types/hardware';

// MIG profiles for A100/H100
export const MIG_PROFILES = [
  { id: 19, name: '1g.5gb', memory: 4.75, computeSlices: 14, gpuInstances: 1, maxInstances: 7 },
  { id: 20, name: '1g.10gb', memory: 9.62, computeSlices: 14, gpuInstances: 1, maxInstances: 4 },
  { id: 14, name: '2g.10gb', memory: 9.62, computeSlices: 28, gpuInstances: 2, maxInstances: 3 },
  { id: 9, name: '3g.20gb', memory: 19.50, computeSlices: 42, gpuInstances: 3, maxInstances: 2 },
  { id: 5, name: '4g.20gb', memory: 19.50, computeSlices: 56, gpuInstances: 4, maxInstances: 1 },
  { id: 0, name: '7g.40gb', memory: 39.25, computeSlices: 98, gpuInstances: 7, maxInstances: 1 },
];

function generateUUID(): string {
  return 'GPU-' + Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('').toUpperCase();
}

function createNVLinkConnections(count: number): NVLinkConnection[] {
  return Array.from({ length: count }, (_, i) => ({
    linkId: i,
    status: 'Active' as const,
    speed: 600, // GB/s for A100
    txErrors: 0,
    rxErrors: 0,
    replayErrors: 0,
  }));
}

function createGPU(id: number): GPU {
  return {
    id,
    uuid: generateUUID(),
    name: 'NVIDIA A100-SXM4-80GB',
    type: 'A100-80GB',
    pciAddress: `00000000:${(0x10 + id).toString(16).padStart(2, '0')}:00.0`,
    temperature: 30 + Math.random() * 10,
    powerDraw: 250 + Math.random() * 100,
    powerLimit: 400,
    memoryTotal: 81920,
    memoryUsed: 0,
    utilization: 0,
    clocksSM: 1410,
    clocksMem: 1215,
    eccEnabled: true,
    eccErrors: {
      singleBit: 0,
      doubleBit: 0,
      aggregated: {
        singleBit: 0,
        doubleBit: 0,
      },
    },
    migMode: false,
    migInstances: [],
    nvlinks: createNVLinkConnections(12),
    healthStatus: 'OK',
    xidErrors: [],
    persistenceMode: true,
  };
}

function createBlueFieldDPU(id: number): BlueFieldDPU {
  return {
    id,
    pciAddress: `0000:${(0xa0 + id).toString(16)}:00.0`,
    devicePath: `/dev/mst/mt41692_pciconf${id}`,
    firmwareVersion: '24.35.2000',
    mode: {
      mode: 'DPU',
      internalCpuModel: 1,
      description: 'DPU mode - Arm cores own NIC resources',
    },
    ipAddress: `192.168.100.${10 + id}`,
    armOS: 'Ubuntu 22.04.3 LTS',
    ovsConfigured: true,
    rshimAvailable: true,
  };
}

function createInfiniBandPort(portNum: number): InfiniBandPort {
  return {
    portNumber: portNum,
    state: 'Active',
    physicalState: 'LinkUp',
    rate: 200,
    lid: 100 + portNum,
    guid: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0')}`,
    linkLayer: 'InfiniBand',
    errors: {
      symbolErrors: 0,
      linkDowned: 0,
      portRcvErrors: 0,
      portXmitDiscards: 0,
      portXmitWait: 0,
    },
  };
}

function createInfiniBandHCA(id: number): InfiniBandHCA {
  return {
    id,
    devicePath: `/dev/mst/mt4123_pciconf${id}`,
    caType: 'ConnectX-6 HCA',
    firmwareVersion: '20.35.1012',
    ports: [createInfiniBandPort(1)],
  };
}

function createBMCSensors(): BMCSensor[] {
  return [
    { name: 'CPU1 Temp', reading: 45, unit: '°C', status: 'OK', upperCritical: 95, upperWarning: 85 },
    { name: 'CPU2 Temp', reading: 47, unit: '°C', status: 'OK', upperCritical: 95, upperWarning: 85 },
    { name: 'Inlet Temp', reading: 22, unit: '°C', status: 'OK', upperCritical: 45, upperWarning: 40 },
    { name: 'Exhaust Temp', reading: 35, unit: '°C', status: 'OK', upperCritical: 70, upperWarning: 65 },
    { name: 'PSU1 Input', reading: 230, unit: 'V', status: 'OK', lowerCritical: 180, upperCritical: 264 },
    { name: 'PSU2 Input', reading: 229, unit: 'V', status: 'OK', lowerCritical: 180, upperCritical: 264 },
    { name: 'PSU1 Power', reading: 850, unit: 'W', status: 'OK', upperCritical: 3000 },
    { name: 'PSU2 Power', reading: 840, unit: 'W', status: 'OK', upperCritical: 3000 },
    { name: 'Fan1', reading: 5200, unit: 'RPM', status: 'OK', lowerCritical: 1000 },
    { name: 'Fan2', reading: 5150, unit: 'RPM', status: 'OK', lowerCritical: 1000 },
    { name: 'Fan3', reading: 5300, unit: 'RPM', status: 'OK', lowerCritical: 1000 },
    { name: 'Fan4', reading: 5180, unit: 'RPM', status: 'OK', lowerCritical: 1000 },
  ];
}

function createBMC(nodeId: number): BMC {
  return {
    ipAddress: `192.168.0.${100 + nodeId}`,
    macAddress: `00:0a:f7:${nodeId.toString(16).padStart(2, '0')}:00:01`,
    firmwareVersion: '3.47.00',
    manufacturer: 'NVIDIA',
    sensors: createBMCSensors(),
    powerState: 'On',
  };
}

function createDGXNode(id: number): DGXNode {
  return {
    id: `dgx-${id.toString().padStart(2, '0')}`,
    hostname: `dgx-${id.toString().padStart(2, '0')}.cluster.local`,
    systemType: 'DGX-A100',
    gpus: Array.from({ length: 8 }, (_, i) => createGPU(i)),
    dpus: Array.from({ length: 2 }, (_, i) => createBlueFieldDPU(i)),
    hcas: Array.from({ length: 8 }, (_, i) => createInfiniBandHCA(i)),
    bmc: createBMC(id),
    cpuModel: 'AMD EPYC 7742 64-Core Processor',
    cpuCount: 2,
    ramTotal: 1024,
    ramUsed: 128,
    osVersion: 'Ubuntu 22.04.3 LTS',
    kernelVersion: '5.15.0-91-generic',
    nvidiaDriverVersion: '535.129.03',
    cudaVersion: '12.2',
    healthStatus: 'OK',
    slurmState: 'idle',
  };
}

export function createDefaultCluster(): ClusterConfig {
  return {
    name: 'DGX SuperPOD',
    nodes: Array.from({ length: 8 }, (_, i) => createDGXNode(i)),
    fabricTopology: 'FatTree',
    bcmHA: {
      enabled: true,
      primary: 'mgmt-node0',
      secondary: 'mgmt-node1',
      state: 'Active',
    },
    slurmConfig: {
      controlMachine: 'mgmt-node0',
      partitions: ['batch', 'interactive', 'gpu'],
    },
  };
}

export function createCustomCluster(nodeCount: number, systemType: 'DGX-A100' | 'DGX-H100'): ClusterConfig {
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const node = createDGXNode(i);
    node.systemType = systemType;

    if (systemType === 'DGX-H100') {
      node.gpus = node.gpus.map((gpu) => ({
        ...gpu,
        name: 'NVIDIA H100-SXM5-80GB',
        type: 'H100-SXM',
        powerLimit: 700,
        clocksSM: 1830,
        clocksMem: 2619,
        nvlinks: createNVLinkConnections(18), // H100 has 18 NVLinks
      }));
    }

    return node;
  });

  return {
    name: `${systemType} Cluster`,
    nodes,
    fabricTopology: 'FatTree',
    bcmHA: {
      enabled: true,
      primary: 'mgmt-node0',
      secondary: 'mgmt-node1',
      state: 'Active',
    },
    slurmConfig: {
      controlMachine: 'mgmt-node0',
      partitions: ['batch', 'interactive', 'gpu'],
    },
  };
}
