import { test, expect } from '@playwright/test';
import { createHelper } from '../setup/test-helpers';

test.describe('Domain 4 Lab Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    const helper = await createHelper(page);
    await helper.navigateToSimulator();
  });

  test.describe('Scenario Loading and Navigation', () => {
    test('should navigate to labs section', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Labs list should be visible
      await expect(page.locator('[data-testid="labs-list"]')).toBeVisible();
    });

    test('should display Domain 4 lab cards', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Should show Domain 4 section
      await expect(page.locator('text=Domain 4')).toBeVisible();
      await expect(page.locator('text=Cluster Test')).toBeVisible();
    });

    test('should start Domain 4 lab when button clicked', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Find and click the Domain 4 "Start Labs" button
      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      // Wait for lab workspace to appear
      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Lab Workspace UI', () => {
    test('should show scenario title and difficulty', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Start Domain 4 lab
      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Should show scenario information
      const labWorkspace = page.locator('[data-testid="lab-workspace"]');
      await expect(labWorkspace.locator('h2')).toBeVisible();
    });

    test('should show step progress bar', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Progress bar should be visible
      await expect(page.locator('text=Step 1 of')).toBeVisible();
    });

    test('should show objectives for current step', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Objectives section should be visible
      await expect(page.locator('text=OBJECTIVES')).toBeVisible();
    });

    test('should show exit button', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Exit button should be present
      await expect(page.locator('[data-testid="lab-workspace"] button[title="Exit Lab"]')).toBeVisible();
    });
  });

  test.describe('Command Execution in Lab Context', () => {
    test('should allow terminal commands during lab', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Terminal should still be accessible
      await helper.typeCommand('nvidia-smi');
      await helper.waitForCommandOutput();

      await helper.verifyOutputContains('GPU');
    });

    test('should track command execution for step validation', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Execute a diagnostic command
      await helper.typeCommand('dcgmi diag -r 1');
      await helper.waitForCommandOutput();

      // The lab should register the command execution
      await helper.verifyOutputContains('DCGM');
    });

    test('should show suggested commands in lab panel', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Should show suggested commands section
      const labWorkspace = page.locator('[data-testid="lab-workspace"]');
      await expect(labWorkspace.locator('text=SUGGESTED COMMANDS').or(labWorkspace.locator('text=Expected'))).toBeVisible();
    });
  });

  test.describe('Hints System', () => {
    test('should show hints section in lab panel', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Hints section should exist
      const labWorkspace = page.locator('[data-testid="lab-workspace"]');
      await expect(labWorkspace.locator('text=HINTS').or(labWorkspace.locator('text=Hint'))).toBeVisible();
    });

    test('should allow getting hints via terminal command', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Type hint command in terminal
      await helper.typeCommand('hint');
      await helper.waitForCommandOutput();

      // Should show hint or hint-related message
      const output = await helper.getTerminalOutput();
      expect(output.toLowerCase()).toMatch(/hint|tip|suggestion|try/);
    });
  });

  test.describe('Lab Exit and Progress', () => {
    test('should exit lab when exit button clicked', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Click exit button
      await page.locator('[data-testid="lab-workspace"] button[title="Exit Lab"]').click();

      // Lab workspace should close
      await expect(page.locator('[data-testid="lab-workspace"]')).not.toBeVisible({ timeout: 5000 });
    });

    test('should show all steps overview in lab panel', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Should show "ALL STEPS" section
      await expect(page.locator('text=ALL STEPS')).toBeVisible();
    });

    test('should show learning objectives', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Should show what you'll learn section
      await expect(page.locator('text=WHAT YOU')).toBeVisible();
    });
  });

  test.describe('Responsive Lab Panel', () => {
    test('should show lab panel on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const helper = await createHelper(page);
      await helper.navigateToSimulator();

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });

      // Lab panel should be visible on desktop
      const labWorkspace = page.locator('[data-testid="lab-workspace"]');
      const boundingBox = await labWorkspace.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeGreaterThan(400);
    });

    test('should adapt to laptop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });

      const helper = await createHelper(page);
      await helper.navigateToSimulator();

      await helper.navigateToLabs();

      const domain4Card = page.locator('text=Domain 4').locator('..').locator('..');
      await domain4Card.locator('button:has-text("Start Labs")').click();

      // Lab workspace should still be functional
      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Multiple Domain Labs', () => {
    test('should be able to start Domain 1 lab', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Find Domain 1 card
      const domain1Card = page.locator('text=Domain 1').locator('..').locator('..');
      await domain1Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });
    });

    test('should be able to start Domain 5 lab', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Find Domain 5 card
      const domain5Card = page.locator('text=Domain 5').locator('..').locator('..');
      await domain5Card.locator('button:has-text("Start Labs")').click();

      await expect(page.locator('[data-testid="lab-workspace"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Practice Exam Access', () => {
    test('should show practice exam card', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Practice exam card should be visible
      await expect(page.locator('text=Practice Exam').or(page.locator('text=NCP-AII Practice'))).toBeVisible();
    });

    test('should be able to start practice exam', async ({ page }) => {
      const helper = await createHelper(page);

      await helper.navigateToLabs();

      // Click begin practice exam
      await page.locator('button:has-text("Begin Practice Exam")').click();

      // Exam workspace should appear (different from lab workspace)
      await expect(page.locator('[data-testid="lab-workspace"]').or(page.locator('text=Exam').first())).toBeVisible({ timeout: 10000 });
    });
  });
});
