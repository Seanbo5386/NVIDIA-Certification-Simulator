# NCP-AII Exam Coverage Status

This document tracks the NVIDIA Certified Professional - AI Infrastructure (NCP-AII) exam coverage provided by the certification simulator.

## Phase 1 Implementation (Completed 2026-01-30)

### Domain 4: Cluster Test & Verification (33%)

#### Implemented:
- ✅ 4.9: ClusterKit multifaceted node assessment
- ✅ 4.11: NCCL burn-in testing
- ✅ 4.12: HPL burn-in testing
- ✅ 4.13: NeMo burn-in testing
- ✅ 4.4: Cable signal quality validation
- ✅ 4.6-4.8: Firmware/software version checking

#### Coverage Improvement:
- Before: ~50%
- After: ~85%
- Impact: +12% overall exam coverage

### Overall Exam Coverage

| Domain | Weight | Before | After | Change |
|--------|--------|--------|-------|--------|
| 1: Server Bring-Up | 31% | 80% | 80% | - |
| 2: Physical Layer | 5% | 90% | 90% | - |
| 3: Control Plane | 19% | 60% | 60% | - |
| 4: Test & Verification | 33% | 50% | 85% | +35% |
| 5: Troubleshooting | 12% | 55% | 55% | - |
| **Overall** | **100%** | **65%** | **77%** | **+12%** |

### New Commands Available:
- `clusterkit` - Multifaceted node assessment
- `clusterkit --verbose` - Detailed assessment with component-specific details
- `clusterkit --node <hostname>` - Target specific node for assessment
- `nccl-test --burn-in --iterations N` - NCCL burn-in for network stability
- `hpl --burn-in --iterations N` - HPL burn-in for compute/thermal validation
- `nemo burn-in --iterations N` - NeMo training burn-in for AI workload testing
- `fw-check [component]` - Firmware version checking (bmc|gpu|switch|bluefield|transceiver|all)
- `ibdiagnet --detailed` - Enhanced cable validation with signal quality metrics
- `ibdiagnet --signal-quality` - Signal quality validation (RX/TX power, BER, SNR, eye opening)

### New Lab Scenarios:
1. **ClusterKit Assessment** (Domain 4, Intermediate, ~50 min)
   - Multifaceted node health assessment
   - Verbose diagnostics and node targeting
   - Failure interpretation and cross-tool validation

2. **Burn-in Testing** (Domain 4, Advanced, ~50 min)
   - NCCL burn-in for network stability validation
   - HPL burn-in for compute and thermal validation
   - NeMo burn-in for AI workload testing
   - Results analysis and production readiness checklist

---

## Domain-by-Domain Breakdown

### Domain 1: Server Bring-Up and Physical Configuration (31%)

**Coverage: 80%**

#### Implemented Topics:
- ✅ 1.1: GPU installation and topology verification
- ✅ 1.2: Power delivery and thermal management
- ✅ 1.3: PCIe configuration and NVLink setup
- ✅ 1.4: BIOS/UEFI settings for AI workloads
- ✅ 1.5: nvidia-smi and system monitoring

#### Gaps:
- ⬜ 1.6: Advanced NUMA tuning
- ⬜ 1.7: Custom power profiles

---

### Domain 2: Physical Layer Configuration (5%)

**Coverage: 90%**

#### Implemented Topics:
- ✅ 2.1: InfiniBand fabric setup
- ✅ 2.2: Optical transceiver installation
- ✅ 2.3: Cable management and validation
- ✅ 2.4: Physical topology design

#### Gaps:
- ⬜ 2.5: Advanced cable diagnostics

---

### Domain 3: Network Control Plane (19%)

**Coverage: 60%**

#### Implemented Topics:
- ✅ 3.1: Subnet Manager configuration
- ✅ 3.2: OpenSM deployment
- ✅ 3.3: Routing configuration
- ✅ 3.4: QoS and traffic management
- ✅ 3.5: VLAN configuration

#### Gaps:
- ⬜ 3.6: BCM high availability and failover
- ⬜ 3.7: Advanced routing policies
- ⬜ 3.8: Network segmentation strategies

---

### Domain 4: Cluster Test and Verification (33%)

**Coverage: 85%** ⬆️ *Improved in Phase 1*

#### Implemented Topics:
- ✅ 4.1: NCCL bandwidth testing
- ✅ 4.2: HPL performance benchmarking
- ✅ 4.3: GPU peer-to-peer testing
- ✅ 4.4: Cable signal quality validation *(Phase 1)*
- ✅ 4.5: Link state monitoring
- ✅ 4.6-4.8: Firmware/software version checking *(Phase 1)*
- ✅ 4.9: ClusterKit multifaceted assessment *(Phase 1)*
- ✅ 4.10: Basic stress testing
- ✅ 4.11: NCCL burn-in testing *(Phase 1)*
- ✅ 4.12: HPL burn-in testing *(Phase 1)*
- ✅ 4.13: NeMo burn-in testing *(Phase 1)*

#### Gaps:
- ⬜ 4.14: Performance tuning workflows
- ⬜ 4.15: Optimization best practices

---

### Domain 5: Troubleshooting and Diagnostics (12%)

**Coverage: 55%**

#### Implemented Topics:
- ✅ 5.1: GPU error identification (XID errors)
- ✅ 5.2: InfiniBand diagnostics (ibdiagnet)
- ✅ 5.3: Log analysis
- ✅ 5.4: Basic performance troubleshooting

#### Gaps:
- ⬜ 5.5: Complex failure scenarios
- ⬜ 5.6: Network degradation troubleshooting
- ⬜ 5.7: Root cause analysis workflows
- ⬜ 5.8: Recovery procedures

---

## Next Phase Priorities

### Phase 2: Domain 3 Control Plane (Target: +10% overall)

**High Priority:**
- BCM high availability and failover (3.6)
- Advanced routing policies (3.7)
- Network segmentation (3.8)

**Impact:** Domain 3: 60% → 85% (+25%), Overall: 77% → 82% (+5%)

### Phase 3: Domain 5 Troubleshooting (Target: +5% overall)

**High Priority:**
- Complex GPU failure scenarios (5.5)
- Network degradation troubleshooting (5.6)
- Root cause analysis workflows (5.7)

**Impact:** Domain 5: 55% → 90% (+35%), Overall: 82% → 86% (+4%)

### Phase 4: Domain 4 Optimization (Target: +3% overall)

**High Priority:**
- Performance tuning workflows (4.14)
- Optimization best practices (4.15)

**Impact:** Domain 4: 85% → 95% (+10%), Overall: 86% → 89% (+3%)

---

## Testing Documentation

- **Phase 1 Testing:** See [Phase 1 Testing Checklist](testing/2026-01-30-exam-coverage-phase1-testing.md)

---

## Methodology

Coverage percentages are estimated based on:
1. Number of exam topics implemented vs. total topics in domain
2. Depth of implementation (basic, intermediate, advanced)
3. Lab scenario coverage of topic
4. Command availability and functionality
5. Documentation and learning objectives

**Note:** Official exam content may vary. Coverage estimates are based on publicly available exam blueprint and certification guides.

---

**Last Updated:** 2026-01-30
**Current Overall Coverage:** 77%
**Target Coverage:** 85%+ (Production Ready)
