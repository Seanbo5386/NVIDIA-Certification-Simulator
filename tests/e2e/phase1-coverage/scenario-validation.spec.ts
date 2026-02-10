import { test, expect } from '@playwright/test';
import { createHelper } from '../setup/test-helpers';

test.describe('Scenario validation and sandbox reset', () => {
  test.beforeEach(async ({ page }) => {
    const helper = await createHelper(page);
    await helper.navigateToSimulator();
  });

  test('runs a scenario command and shows validation progress', async ({ page }) => {
    const helper = await createHelper(page);

    await helper.navigateToLabs();
    await page.getByRole('button', { name: /The Midnight Deployment/i }).click();

    await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: /Begin Mission/i }).click();

    await expect(page.locator('text=SUGGESTED COMMANDS (0/2)')).toBeVisible();

    await helper.typeCommand('ipmitool sel list');
    await helper.waitForCommandOutput();

    await expect(page.locator('text=VALIDATION STATUS')).toBeVisible();
    await expect(page.locator('text=SUGGESTED COMMANDS (1/2)')).toBeVisible();
    await expect(
      page.locator('text=/Keep going! 1\\/2 commands completed/'),
    ).toBeVisible();

    await helper.typeCommand('ipmitool sel elist');
    await helper.waitForCommandOutput();

    await expect(page.locator('text=Step 2 of')).toBeVisible({ timeout: 10000 });
  });

  test('exits scenario and restores sandbox-isolated state', async ({ page }) => {
    const helper = await createHelper(page);

    await helper.navigateToLabs();
    await page.getByRole('button', { name: /The Memory Mystery/i }).click();

    await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: /Begin Mission/i }).click();

    await helper.typeCommand('nvidia-smi');
    await helper.waitForCommandOutput();

    await expect(page.locator('text=Step 2 of')).toBeVisible({ timeout: 10000 });

    await helper.typeCommand('nvidia-smi');
    await helper.waitForCommandOutput();

    await helper.verifyOutputContains('79000MiB');

    await page
      .locator('[data-testid="lab-workspace"] button[title="Exit Lab"]')
      .click();
    await expect(page.locator('[data-testid="lab-workspace"]')).not.toBeVisible({
      timeout: 5000,
    });

    await helper.clearTerminal();
    await helper.typeCommand('nvidia-smi');
    await helper.waitForCommandOutput();

    await helper.verifyOutputNotContains('79000MiB');
  });
});
