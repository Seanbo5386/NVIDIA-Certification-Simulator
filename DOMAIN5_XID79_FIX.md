# Domain 5 XID 79 Error Scenario - Logic Fixes

## Summary

Fixed critical logic inconsistencies in the Domain 5 XID 79 (GPU fallen off the bus) scenario to make it realistic and pedagogically sound.

## Issues Fixed

### 1. Invalid GPU ID Validation (nvidia-smi)

**Problem**: Commands like `nvidia-smi --gpu-reset -i -0` (typo with negative sign) were being accepted and processed.

**Fix**: Added strict validation in `nvidiaSmiSimulator.ts` `handleGpuReset()`:
- Checks if `-i` flag value starts with `-` (invalid)
- Validates GPU ID is a valid non-negative integer
- Returns clear error message for invalid GPU IDs
- Example: `Error: Invalid GPU ID "-0". GPU ID must be a non-negative integer.`

**Files Modified**:
- `src/simulators/nvidiaSmiSimulator.ts` (lines 505-524)

### 2. Driver Version in --query-gpu Output

**Problem**: Running `nvidia-smi --query-gpu=driver_version --format=csv` showed `[Not Supported]` instead of the actual driver version (535.129.03).

**Fix**: Added `driver_version` case to `getGpuFieldValue()` method:
- Retrieves driver version from node configuration
- Returns actual driver version string (e.g., "535.129.03")
- Also added `pci.link.gen.current` and `pci.link.width.current` fields

**Files Modified**:
- `src/simulators/nvidiaSmiSimulator.ts` (lines 385-439)

### 3. DCGMI Diagnostics on XID 79 GPU

**Problem**: `dcgmi diag -r 3 -i 0` was passing successfully even though GPU 0 had XID 79 (fallen off the bus). This is impossible - a GPU that's fallen off the bus cannot be queried or tested.

**Fix**: Added XID 79 check in `dcgmiSimulator.ts` `handleDiag()`:
- Detects GPUs with XID 79 before running diagnostics
- Returns detailed error explaining the GPU is inaccessible
- Provides realistic troubleshooting guidance:
  - PCIe communication failure
  - Possible causes (PCIe slot, GPU hardware, power, motherboard)
  - Recommended actions (reboot, reseat, RMA)

**Files Modified**:
- `src/simulators/dcgmiSimulator.ts` (lines 282-305)

### 4. Command Validation Improvements

**Problem**: Step validation was accepting typo commands like `-i -0` as valid completions.

**Fix**: Enhanced `validateCommandExecuted()` in `commandValidator.ts`:
- Added regex check for invalid pattern: `-i -<digit>`
- Added regex check for invalid pattern: `--id -<digit>`
- Returns `false` for these malformed commands before checking expected commands

**Files Modified**:
- `src/utils/commandValidator.ts` (lines 13-22)

## Scenario Realism Improvements

### XID 79: GPU Fallen Off the Bus

This is now accurately simulated as a catastrophic failure:

1. **nvidia-smi behavior**:
   - GPU does not appear in default listing
   - Shows warning: "1 GPU(s) not shown due to critical errors (XID 79: GPU fallen off the bus)"
   - Queries targeting the GPU fail with appropriate error
   - GPU reset attempts fail with realistic error message

2. **dcgmi behavior**:
   - Diagnostics fail immediately with detailed error
   - Error explains PCIe communication failure
   - Provides troubleshooting guidance

3. **Validation behavior**:
   - Typo commands are rejected
   - Only correct command syntax is accepted
   - Special handling for XID 79 reset attempts (attempt is valid even though it fails)

## Testing Recommendations

Test the following scenarios in Domain 5 XID Error Analysis:

1. **Step 1-3**: Verify GPU 0 does not appear in `nvidia-smi` output
2. **Step 3**: Verify `nvidia-smi -q -i 0` fails with XID 79 error
3. **Step 4**: Verify `nvidia-smi --gpu-reset -i 0` fails appropriately
4. **Step 4**: Verify typo `nvidia-smi --gpu-reset -i -0` is rejected
5. **Step 5**: Verify `nvidia-smi --query-gpu=driver_version --format=csv` shows "535.129.03"
6. **Step 6**: Verify `dcgmi diag -r 3 -i 0` fails with XID 79 error

## Impact on User Experience

### Before Fixes:
- User could complete step 4 with invalid command `-i -0`
- User saw `[Not Supported]` for driver version
- DCGM diagnostics passed on inaccessible GPU
- Scenario was unrealistic and confusing

### After Fixes:
- Invalid commands are properly rejected
- Driver version query works correctly
- DCGM diagnostics fail realistically
- Scenario accurately teaches XID 79 troubleshooting
- Error messages guide user to correct troubleshooting approach

## Educational Value

These fixes ensure students learn:

1. **XID 79 is catastrophic**: GPU is completely inaccessible
2. **Command syntax matters**: Typos are rejected by real tools
3. **Diagnostic limitations**: Cannot test a GPU that's fallen off the bus
4. **Realistic troubleshooting**: System reboot or hardware intervention required
5. **Professional approach**: Understanding when software fixes won't work

## Related Files

- `src/simulators/nvidiaSmiSimulator.ts` - NVIDIA-SMI command simulator
- `src/simulators/dcgmiSimulator.ts` - DCGM command simulator
- `src/utils/commandValidator.ts` - Scenario step validation logic
- `src/data/scenarios/domain5/xid-error-analysis.json` - Scenario definition

## Build Status

✓ TypeScript compilation successful
✓ Vite build successful
✓ No new warnings or errors introduced
