import React, { useState } from 'react';
import { Server, Terminal, AlertTriangle, Book, Database, Network, Shield, Activity } from 'lucide-react';
import { StateManagementPanel } from './StateManagementPanel';

type DocTab = 'architecture' | 'commands' | 'troubleshooting' | 'exam' | 'state';

export const Documentation: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DocTab>('architecture');

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-nvidia-green mb-2">
                    Documentation & Reference
                </h2>
                <p className="text-gray-400">
                    Comprehensive guide to the DGX SuperPOD simulator, tools, and NCP-AII certification.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700 bg-gray-900/50">
                <TabButton
                    active={activeTab === 'architecture'}
                    onClick={() => setActiveTab('architecture')}
                    icon={<Server className="w-4 h-4" />}
                    label="System Architecture"
                />
                <TabButton
                    active={activeTab === 'commands'}
                    onClick={() => setActiveTab('commands')}
                    icon={<Terminal className="w-4 h-4" />}
                    label="Command Reference"
                />
                <TabButton
                    active={activeTab === 'troubleshooting'}
                    onClick={() => setActiveTab('troubleshooting')}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    label="Troubleshooting"
                />
                <TabButton
                    active={activeTab === 'exam'}
                    onClick={() => setActiveTab('exam')}
                    icon={<Book className="w-4 h-4" />}
                    label="Exam Alignment"
                />
                <TabButton
                    active={activeTab === 'state'}
                    onClick={() => setActiveTab('state')}
                    icon={<Database className="w-4 h-4" />}
                    label="State Management"
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-900">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Architecture Tab */}
                    {activeTab === 'architecture' && (
                        <div className="space-y-6">
                            <SectionTitle title="Cluster Topology: DGX SuperPOD" icon={<Network className="w-6 h-6 text-nvidia-green" />} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card title="Node Layout">
                                    <div className="space-y-4">
                                        <p className="text-gray-300">
                                            The simulated cluster consists of <strong>8x NVIDIA DGX A100</strong> nodes connected via a high-performance FatTree InfiniBand fabric.
                                        </p>
                                        <div className="bg-black rounded-lg p-4 font-mono text-sm space-y-2">
                                            <div className="grid grid-cols-3 gap-4 text-gray-500 border-b border-gray-800 pb-2 mb-2">
                                                <span>Hostname</span>
                                                <span>Mgmt IP</span>
                                                <span>BMC IP</span>
                                            </div>
                                            {[...Array(8)].map((_, i) => (
                                                <div key={i} className="grid grid-cols-3 gap-4">
                                                    <span className="text-nvidia-green">dgx-{i.toString().padStart(2, '0')}</span>
                                                    <span>10.0.0.{i + 10}</span>
                                                    <span>192.168.0.{i + 100}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card title="Hardware Specifications (Per Node)">
                                    <div className="space-y-4 text-sm">
                                        <SpecItem label="GPU" value="8x NVIDIA A100-SXM4-80GB" />
                                        <SpecItem label="CPU" value="2x AMD EPYC 7742 (64-Core)" />
                                        <SpecItem label="Memory" value="1024 GB DDR4" />
                                        <SpecItem label="Network (Compute)" value="8x ConnectX-6 HDR 200Gb/s IB" />
                                        <SpecItem label="Network (Storage/Mgmt)" value="2x BlueField-2 DPU 200Gb/s" />
                                        <SpecItem label="NVSwitch" value="6x NVSwitch 600GB/s Fabric" />
                                    </div>
                                </Card>
                            </div>

                            <Card title="Network Fabric">
                                <div className="space-y-4">
                                    <p className="text-gray-300">
                                        The simulator emulates a simplified 2-tier Fat Tree topology optimized for AI workloads.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
                                        <li><strong>Compute Fabric:</strong> Dedicated InfiniBand HDR (200Gb/s) rails for GPU-Direct RDMA.</li>
                                        <li><strong>Storage Fabric:</strong> Separate ethernet-based storage network handling storage traffic.</li>
                                        <li><strong>Management Network:</strong> 1GbE Out-of-Band (OOB) connectivity for BMC/IPMI access.</li>
                                    </ul>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Commands Tab */}
                    {activeTab === 'commands' && (
                        <div className="space-y-8">
                            <SectionTitle title="Essential CLI Tools" icon={<Terminal className="w-6 h-6 text-nvidia-green" />} />

                            <CommandGroup
                                title="NVIDIA System Management (NVSM)"
                                description="Primary tool for DGX health monitoring and diagnostics."
                                commands={[
                                    { cmd: 'nvsm show health', desc: 'Display overall system health summary.' },
                                    { cmd: 'nvsm show health --detailed', desc: 'List every individual health check status.' },
                                    { cmd: 'nvsm dump health', desc: 'Generate a system diagnostic tarball.' },
                                    { cmd: 'nvsm', desc: 'Enter the interactive NVSM shell.' },
                                ]}
                            />

                            <CommandGroup
                                title="IPMI Tool (ipmitool)"
                                description="Baseboard Management Controller (BMC) interaction for power and thermal management."
                                commands={[
                                    { cmd: 'ipmitool sensor list', desc: 'View readings for temperature, voltage, and fans.' },
                                    { cmd: 'ipmitool sel list', desc: 'View System Event Log (hardware faults).' },
                                    { cmd: 'ipmitool dcmi power reading', desc: 'Get instantaneous power consumption.' },
                                    { cmd: 'ipmitool raw 0x3c 0x??', desc: 'Send raw hexadecimal commands to BMC.' },
                                ]}
                            />

                            <CommandGroup
                                title="NVIDIA System Management Interface (nvidia-smi)"
                                description="GPU device management and monitoring."
                                commands={[
                                    { cmd: 'nvidia-smi', desc: 'Standard status table (utilization, memory, power).' },
                                    { cmd: 'nvidia-smi -q', desc: 'Query full detailed state of all GPUs.' },
                                    { cmd: 'nvidia-smi -L', desc: 'List GPUs and their UUIDs.' },
                                    { cmd: 'nvidia-smi mig -lgip', desc: 'List Granular Instance Profiles (MIG).' },
                                ]}
                            />

                            <CommandGroup
                                title="Mellanox Firmware Tools (MFT)"
                                description="InfiniBand and Ethernet adapter configuration."
                                commands={[
                                    { cmd: 'mst start', desc: 'Start the MST driver to create device files.' },
                                    { cmd: 'mst status -v', desc: 'List all Mellanox devices with pci mapping.' },
                                    { cmd: 'ibdev2netdev -v', desc: 'Map InfiniBand devices to Linux interfaces.' },
                                    { cmd: 'mlxconfig -d <device> query', desc: 'Query HCA/DPU configuration parameters.' },
                                ]}
                            />
                        </div>
                    )}

                    {/* Troubleshooting Tab */}
                    {activeTab === 'troubleshooting' && (
                        <div className="space-y-6">
                            <SectionTitle title="Diagnostic Playbooks" icon={<Activity className="w-6 h-6 text-nvidia-green" />} />

                            <div className="grid grid-cols-1 gap-6">
                                <Card title="Scenario A: XID Errors (GPU Faults)">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded border border-red-500/20">
                                            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-bold text-red-400 mb-1">Symptoms</h4>
                                                <p className="text-sm text-gray-400">Application crash, "GPU fallen off bus", slow training performance.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-nvidia-green">Diagnostic Steps:</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                                                <li>Run <code className="bg-black px-2 py-0.5 rounded">dmesg</code> or <code className="bg-black px-2 py-0.5 rounded">journalctl</code> to check for "NVRM: Xid" messages.</li>
                                                <li>Check <code className="bg-black px-2 py-0.5 rounded">nvidia-smi -q</code> section "GPU Errors" for ECC counts.</li>
                                                <li>Verify if the error corresponds to a known issue (see reference below).</li>
                                            </ol>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-nvidia-green">Common XID Codes:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                <div className="bg-black p-2 rounded border border-gray-800"><span className="text-red-400 font-bold">48</span> Double-bit ECC Error (HW Replace)</div>
                                                <div className="bg-black p-2 rounded border border-gray-800"><span className="text-yellow-400 font-bold">13</span> Graphics Engine Exception (SW/Driver)</div>
                                                <div className="bg-black p-2 rounded border border-gray-800"><span className="text-red-400 font-bold">79</span> GPU Fallen Off Bus (Thermal/Power)</div>
                                                <div className="bg-black p-2 rounded border border-gray-800"><span className="text-yellow-400 font-bold">31</span> Memory Page Fault (Application)</div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card title="Scenario B: Thermal Throttling">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded border border-yellow-500/20">
                                            <Activity className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-bold text-yellow-400 mb-1">Symptoms</h4>
                                                <p className="text-sm text-gray-400">Reduced clocks (SW Power Cap), high fan speeds, performance degradation.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-nvidia-green">Diagnostic Steps:</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                                                <li>Run <code className="bg-black px-2 py-0.5 rounded">ipmitool sensor list</code> and check "Inlet Temp".</li>
                                                <li>Check <code className="bg-black px-2 py-0.5 rounded">nvidia-smi -q -d TEMPERATURE</code> for GPU temps.</li>
                                                <li>Inspect `Performance State` in `nvidia-smi`.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Exam Tab */}
                    {activeTab === 'exam' && (
                        <div className="space-y-6">
                            <SectionTitle title="NCP-AII Exam Domain Alignment" icon={<Shield className="w-6 h-6 text-nvidia-green" />} />

                            <div className="space-y-4">
                                <p className="text-gray-300">
                                    This simulator is designed to cover specific practical skills tested in the <strong>NVIDIA Certified Professional (NCP-AII)</strong> exam.
                                </p>

                                <div className="grid grid-cols-1 gap-4">
                                    <ExamDomain
                                        title="Domain 1: System Installation & Configuration"
                                        percentage="31%"
                                        tools={['cmsh', 'ipmitool', 'firmware update']}
                                        desc="Verifying hardware, validating cables, and initial bring-up."
                                    />
                                    <ExamDomain
                                        title="Domain 2: Physical Layer Management"
                                        percentage="5%"
                                        tools={['mlxconfig', 'mst', 'ibdev2netdev']}
                                        desc="Configuring HCAs, DPUs, and managing InfiniBand/Ethernet links."
                                    />
                                    <ExamDomain
                                        title="Domain 3: Control Plane Installation"
                                        percentage="19%"
                                        tools={['cmsh', 'slurm', 'kubernetes']}
                                        desc="Setting up Base Command Manager, schedulers, and HA."
                                    />
                                    <ExamDomain
                                        title="Domain 4: Validation & Troubleshooting"
                                        percentage="33%"
                                        tools={['nvsm', 'nvidia-smi', 'journalctl']}
                                        desc="Diagnosing health issues, running stress tests (HPL, NCCL), and resolving alerts."
                                    />
                                    <ExamDomain
                                        title="Domain 5: Maintenance"
                                        percentage="12%"
                                        tools={['nvsm dump', 'upgrade paths']}
                                        desc="Log collection, software upgrades, and part replacement procedures."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* State Management Tab */}
                    {activeTab === 'state' && <StateContent />}

                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const StateContent: React.FC = () => (
    <div className="space-y-6">
        {/* Instructions Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-nvidia-green mb-4">State Management Instructions</h3>
            <div className="space-y-4 text-gray-300">
                <p>
                    The State Management system allows you to save and restore cluster states, enabling isolated scenario execution
                    and easy recovery from faults or misconfigurations.
                </p>

                <div>
                    <h4 className="font-semibold text-white mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                        <li><strong className="text-nvidia-green">Snapshots:</strong> Save the current state of your cluster at any point</li>
                        <li><strong className="text-nvidia-green">Scenario Isolation:</strong> Each scenario automatically creates a snapshot before starting</li>
                        <li><strong className="text-nvidia-green">Quick Restore:</strong> Return to any saved state instantly</li>
                        <li><strong className="text-nvidia-green">Baseline State:</strong> Maintains a clean baseline for resetting the entire cluster</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-white mb-2">How to Use:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                        <li><strong className="text-nvidia-green">Create Snapshot:</strong> Click "Create Snapshot" and enter a descriptive name</li>
                        <li><strong className="text-nvidia-green">Restore State:</strong> Click "Restore" next to any saved snapshot to return to that state</li>
                        <li><strong className="text-nvidia-green">Delete Snapshot:</strong> Remove unwanted snapshots to keep your list organized</li>
                        <li><strong className="text-nvidia-green">Scenario Snapshots:</strong> Automatically created when starting labs (prefixed with "scenario_")</li>
                        <li><strong className="text-nvidia-green">Export/Import:</strong> Use the export button to save snapshots externally</li>
                    </ol>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
                    <p className="text-sm text-yellow-300">
                        <strong>⚠️ Note:</strong> Restoring a snapshot will overwrite the current cluster state.
                        Consider creating a new snapshot first if you want to preserve the current state.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-white mb-2">Best Practices:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                        <li>Create snapshots before making significant changes</li>
                        <li>Use descriptive names that indicate the state's purpose</li>
                        <li>Clean up old snapshots to maintain performance</li>
                        <li>Export important snapshots for backup</li>
                        <li>Use the baseline snapshot to quickly reset for new scenarios</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* State Management Panel */}
        <StateManagementPanel />
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${active
            ? 'border-nvidia-green text-nvidia-green bg-gray-800'
            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const SectionTitle: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-3 border-b border-gray-700 pb-2">
        {icon}
        <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-bold mb-4 text-white">{title}</h4>
        {children}
    </div>
);

const SpecItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between border-b border-gray-700/50 py-2 last:border-0">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium text-gray-200">{value}</span>
    </div>
);

const CommandGroup: React.FC<{ title: string; description: string; commands: { cmd: string; desc: string }[] }> = ({ title, description, commands }) => (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="bg-gray-750 p-4 border-b border-gray-700 bg-gray-800/80">
            <h4 className="font-bold text-nvidia-green text-lg">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <div className="p-4 space-y-3">
            {commands.map((c, i) => (
                <div key={i} className="group">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 font-mono text-sm">
                        <div className="bg-black px-3 py-1.5 rounded text-gray-200 border border-gray-800 whitespace-nowrap min-w-[200px]">
                            {c.cmd}
                        </div>
                        <span className="text-gray-500 text-xs md:text-sm">{c.desc}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ExamDomain: React.FC<{ title: string; percentage: string; tools: string[]; desc: string }> = ({ title, percentage, tools, desc }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-white">{title}</h4>
                <span className="bg-gray-700 text-xs px-2 py-0.5 rounded text-nvidia-green">{percentage}</span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{desc}</p>
            <div className="flex gap-2">
                {tools.map(tool => (
                    <span key={tool} className="text-xs bg-black/50 px-2 py-1 rounded text-gray-500 border border-gray-800">{tool}</span>
                ))}
            </div>
        </div>
    </div>
);
