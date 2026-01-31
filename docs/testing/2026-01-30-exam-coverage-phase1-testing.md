# Phase 1 Exam Coverage Testing

**Date:** 2026-01-30
**Phase:** Domain 4 Coverage Gaps - ClusterKit, Burn-in Tests, Firmware/Cable Validation
**Target Coverage:** Domain 4: 50% → 85% (+35%)

## Manual Testing Checklist

### 1. ClusterKit Command

**Test:** Basic ClusterKit assessment
```bash
clusterkit
```

**Expected Output:**
- Overall health status displayed
- Check categories: GPU, Network, Storage, Firmware, Drivers
- Pass/Warning/Fail status for each category
- Green checkmarks (✓) for passing checks

**Test:** Verbose assessment
```bash
clusterkit --verbose
```

**Expected Output:**
- Detailed component information
- GPU model names and details
- HCA types and states
- Driver versions and compatibility info

**Test:** Node targeting
```bash
clusterkit --node dgx-01
clusterkit --node dgx-02
```

**Expected Output:**
- Assessment runs for specified node
- Node-specific health status
- Ability to compare health across nodes

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 2. NCCL Burn-in Testing

**Test:** Basic NCCL burn-in
```bash
nccl-test --burn-in
```

**Expected Output:**
- Multiple iterations executed (default: 1000)
- Consistent bandwidth across iterations (280-300 GB/s)
- Zero failures reported
- PASSED status at completion

**Test:** Custom iterations
```bash
nccl-test --burn-in --iterations 100
```

**Expected Output:**
- Exactly 100 iterations executed
- Performance metrics for min/avg/max
- Iteration-by-iteration results

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 3. HPL Burn-in Testing

**Test:** Basic HPL burn-in
```bash
hpl --burn-in
```

**Expected Output:**
- Multiple iterations executed (default: 100)
- Consistent performance (450-500 TFLOPS)
- Thermal stability maintained
- No performance degradation
- PASSED status

**Test:** Custom iterations
```bash
hpl --burn-in --iterations 50
```

**Expected Output:**
- Exactly 50 iterations executed
- Performance metrics tracked
- Temperature monitoring data

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 4. NeMo Burn-in Testing

**Test:** Basic NeMo burn-in
```bash
nemo burn-in
```

**Expected Output:**
- Multiple iterations executed (default: 50)
- Training throughput (28K-30K tokens/sec)
- GPU utilization >95%
- Loss convergence stability
- PASSED status

**Test:** Alternative syntax
```bash
nemo burnin --iterations 100
```

**Expected Output:**
- Both 'burn-in' and 'burnin' work
- Exactly 100 iterations executed
- Consistent throughput maintained

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 5. Firmware Version Checking

**Test:** Check all components
```bash
fw-check all
```

**Expected Output:**
- BMC firmware version and status
- GPU VBIOS versions (all 8 GPUs)
- Network switch firmware
- BlueField DPU firmware
- Optical transceiver firmware
- Build dates and current status

**Test:** Individual components
```bash
fw-check bmc
fw-check gpu
fw-check switch
fw-check bluefield
fw-check transceiver
```

**Expected Output:**
- Component-specific firmware details
- Version numbers
- Build dates
- Status indicators (Current/Outdated)

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 6. Cable Signal Quality Validation

**Test:** Detailed cable validation
```bash
ibdiagnet --detailed
```

**Expected Output:**
- Signal quality metrics displayed
- RX Power levels (dBm)
- TX Power levels (dBm)
- Bit Error Rate (BER)
- Signal-to-Noise Ratio (SNR)
- Eye Opening percentage
- Pass/Fail status per port

**Test:** Alternative flag
```bash
ibdiagnet --signal-quality
```

**Expected Output:**
- Same detailed signal quality metrics
- Threshold comparisons
- Cable health assessment

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 7. Lab Scenario Loading

**Test:** ClusterKit Assessment scenario loads
- Navigate to Domain 4 scenarios
- Select "Multifaceted Node Assessment with ClusterKit"
- Verify scenario metadata displays correctly

**Expected:**
- Title: "Multifaceted Node Assessment with ClusterKit"
- Difficulty: Intermediate
- 5 steps displayed
- Learning objectives visible
- Estimated duration: ~50 minutes total

**Test:** Burn-in Testing scenario loads
- Navigate to Domain 4 scenarios
- Select "Cluster Burn-in Testing (NCCL, HPL, NeMo)"
- Verify scenario metadata displays correctly

**Expected:**
- Title: "Cluster Burn-in Testing (NCCL, HPL, NeMo)"
- Difficulty: Advanced
- 5 steps displayed
- Learning objectives visible
- Estimated duration: ~50 minutes total

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 8. Scenario Validation

**Test:** ClusterKit scenario step validation
- Run through each step's expected commands
- Verify validation rules trigger correctly
- Check hints display appropriately
- Confirm documentation links present

**Expected:**
- Step 1: clusterkit command validates
- Step 2: verbose flag validates
- Step 3: node targeting validates
- Step 4: cross-tool validation works
- Step 5: multiple tool requirement validates

**Test:** Burn-in scenario step validation
- Run through each step's expected commands
- Verify burn-in commands execute properly
- Check requireAllCommands validation works
- Confirm comprehensive testing enforced

**Expected:**
- Step 1: NCCL burn-in validates
- Step 2: HPL burn-in validates
- Step 3: NeMo burn-in validates
- Step 4: All three commands required
- Step 5: Production readiness checklist validates

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## Integration Testing

### Cross-Tool Workflow

**Test:** Complete production readiness validation
```bash
# Run all burn-in tests
nccl-test --burn-in --iterations 100
hpl --burn-in --iterations 50
nemo burn-in --iterations 50

# Verify cluster health
clusterkit --verbose

# Check firmware versions
fw-check all

# Validate cable quality
ibdiagnet --detailed

# Check GPU topology
nvidia-smi topo -m
```

**Expected:**
- All commands execute without errors
- Consistent results across tools
- No contradictory information
- Complete health picture emerges

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## Coverage Verification

### Domain 4 Topics Now Covered

- ✅ 4.4: Cable signal quality validation (RX/TX power, BER, SNR, eye opening)
- ✅ 4.6-4.8: Firmware/software version checking (BMC, GPU, switches, BlueField, transceivers)
- ✅ 4.9: ClusterKit multifaceted node assessment
- ✅ 4.11: NCCL burn-in testing for network stability
- ✅ 4.12: HPL burn-in testing for compute/thermal validation
- ✅ 4.13: NeMo burn-in testing for AI workload validation

### Exam Coverage Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Domain 4 Coverage | 50% | 85% | +35% |
| Overall Exam Coverage | 65% | 77% | +12% |

---

## Known Issues

None identified during implementation.

---

## Next Steps

**Phase 2 Candidates:**
1. Domain 3: Control Plane gaps (BCM redundancy, network policies)
2. Domain 5: Troubleshooting scenarios (GPU failures, network degradation)
3. Advanced Domain 4: Performance tuning, optimization workflows

**Documentation:**
- Update main README with new commands
- Add burn-in best practices guide
- Create firmware management documentation

---

## Testing Sign-off

| Tester | Date | Status | Notes |
|--------|------|--------|-------|
|        |      | ⬜ Pending | Initial testing |

---

**End of Phase 1 Testing Document**
