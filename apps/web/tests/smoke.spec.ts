import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Wait for potential redirect
        try { await expect(page).toHaveURL(/.*login/, { timeout: 3000 }); } catch (e) { }

        await page.evaluate(() => {
            localStorage.setItem('lb_user', JSON.stringify({ name: 'Smoke User', email: 'smoke@example.com' }));
        });
        await page.goto('/');
        await expect(page.locator('text=Welcome to your Action Center')).toBeVisible({ timeout: 10000 });
    });

    test('has title', async ({ page }) => {
        await expect(page).toHaveTitle(/LifeBridge/i);
    });

    test('onboarding link works', async ({ page }) => {
        // "👉 Start a New Immigration Case"
        await page.locator('a[href="#create"]').click();
        await expect(page).toHaveURL(/.*#create/);
        await expect(page.locator('text=Create New Case')).toBeVisible();
    });
});
