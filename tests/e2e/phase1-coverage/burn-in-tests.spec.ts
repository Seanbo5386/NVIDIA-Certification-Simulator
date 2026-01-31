import { test, expect } from '@playwright/test';
import { createHelper } from '../setup/test-helpers';

test.describe('Burn-in Test Commands', () => {
  test.beforeEach(async ({ page }) => {
    const helper = await createHelper(page);
    await helper.navigateToSimulator();
  });

  test.describe('NCCL burn-in', () => {
    test('should execute basic nccl-test --burn-in', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --burn-in');
      await helper.waitForCommandOutput(15000); // Longer timeout for burn-in

      await helper.verifyOutputContains('NCCL');
      await helper.verifyOutputContains('Burn-in');
      await helper.verifyOutputContains('Bandwidth');
      await helper.verifyOutputContains('GB/s');
    });

    test('should support custom iterations', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --burn-in --iterations 100');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('100');
      await helper.verifyOutputContains('iteration');
    });

    test('should show consistent bandwidth metrics', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --burn-in --iterations 10');
      await helper.waitForCommandOutput(15000);

      const output = await helper.getLastCommandOutput();

      // Verify bandwidth metrics appear
      expect(output).toMatch(/\d+\.?\d*\s*GB\/s/);
    });

    test('should show pass/fail status', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --burn-in --iterations 50');
      await helper.waitForCommandOutput(15000);

      const output = await helper.getTerminalOutput();
      // Should show either PASS or test completion indicator
      expect(output.toLowerCase()).toMatch(/pass|complete|success|ok/);
    });

    test('should handle very large iteration counts', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --burn-in --iterations 1000');
      await helper.waitForCommandOutput(20000);

      // Should not crash, should show progress
      await helper.verifyOutputContains('iteration');
    });
  });

  test.describe('HPL burn-in', () => {
    test('should execute basic hpl --burn-in', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('hpl --burn-in');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('HPL');
      await helper.verifyOutputContains('Burn-in');
      const output = await helper.getTerminalOutput();
      expect(output).toMatch(/TFLOPS|Gflops|performance/i);
    });

    test('should support custom iterations', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('hpl --burn-in --iterations 50');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('50');
    });

    test('should show performance metrics', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('hpl --burn-in --iterations 10');
      await helper.waitForCommandOutput(15000);

      const output = await helper.getLastCommandOutput();

      // Verify performance metrics in expected format
      expect(output).toMatch(/\d+\.?\d*\s*(TFLOPS|Gflops)/i);
    });

    test('should support problem size flag', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('hpl --burn-in --N 90000');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('90000');
    });

    test('should show thermal information', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('hpl --burn-in --iterations 20');
      await helper.waitForCommandOutput(15000);

      const output = await helper.getTerminalOutput();
      // Should mention thermal or temperature
      expect(output.toLowerCase()).toMatch(/thermal|temperature|temp|°c/);
    });
  });

  test.describe('NeMo burn-in', () => {
    test('should execute nemo burn-in', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nemo burn-in');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('NeMo');
      const output = await helper.getTerminalOutput();
      expect(output.toLowerCase()).toMatch(/training|burn-in|throughput/);
    });

    test('should support burnin variant syntax', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nemo burnin');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('NeMo');
    });

    test('should support custom iterations', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nemo burn-in --iterations 100');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('100');
    });

    test('should show training metrics', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nemo burn-in --iterations 10');
      await helper.waitForCommandOutput(15000);

      const output = await helper.getLastCommandOutput();

      // Verify throughput metrics
      expect(output).toMatch(/tokens\/sec|throughput|samples\/sec/i);
    });

    test('should show GPU utilization', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nemo burn-in');
      await helper.waitForCommandOutput(15000);

      const output = await helper.getLastCommandOutput();

      // GPU utilization should be shown
      expect(output.toLowerCase()).toMatch(/gpu.*utilization|utilization.*\d+%/);
    });

    test('should show loss metrics', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nemo burn-in --iterations 20');
      await helper.waitForCommandOutput(15000);

      await helper.verifyOutputContains('Loss');
    });
  });

  test.describe('Burn-in error handling', () => {
    test('should reject invalid iteration counts', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --burn-in --iterations -10');
      await helper.waitForCommandOutput();

      const output = await helper.getTerminalOutput();
      expect(output.toLowerCase()).toMatch(/error|invalid|positive/);
    });

    test('should reject invalid flags', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('hpl --burn-in --invalid-flag');
      await helper.waitForCommandOutput();

      const output = await helper.getTerminalOutput();
      expect(output.toLowerCase()).toMatch(/error|unknown|invalid/);
    });

    test('should show help for burn-in commands', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.typeCommand('nccl-test --help');
      await helper.waitForCommandOutput();

      await helper.verifyOutputContains('burn-in');
    });
  });

  test.describe('Cross burn-in workflows', () => {
    test('should run multiple burn-in tests sequentially', async ({ page }) => {
      const helper = await createHelper(page);

      // Run NCCL burn-in
      await helper.typeCommand('nccl-test --burn-in --iterations 5');
      await helper.waitForCommandOutput(15000);

      // Run HPL burn-in
      await helper.typeCommand('hpl --burn-in --iterations 5');
      await helper.waitForCommandOutput(15000);

      // Run NeMo burn-in
      await helper.typeCommand('nemo burn-in --iterations 5');
      await helper.waitForCommandOutput(15000);

      // All should complete without errors
      const output = await helper.getTerminalOutput();
      expect(output.toLowerCase()).not.toMatch(/fatal error|crash|exception/);
    });

    test('should maintain terminal responsiveness after burn-in', async ({ page }) => {
      const helper = await createHelper(page);

      // Run a burn-in test
      await helper.typeCommand('nccl-test --burn-in --iterations 10');
      await helper.waitForCommandOutput(15000);

      // Terminal should still respond to simple commands
      await helper.typeCommand('help');
      await helper.waitForCommandOutput();
      await helper.verifyOutputContains('Available');
    });
  });
});
