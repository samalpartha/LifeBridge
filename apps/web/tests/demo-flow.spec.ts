import { test, expect } from '@playwright/test';

test.describe('LifeBridge Demo Flow Regression (Current UX)', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('lb_user', JSON.stringify({ name: 'Strict User', email: 'strict@example.com' }));
        });
        await page.goto('/');
        await expect(
            page.getByRole('heading', { name: /One app for crisis response and immigration continuity/i })
        ).toBeVisible({ timeout: 15000 });
    });

    test('core journey across home, tracker, crisis, and logo-home navigation', async ({ page }) => {
        // Home -> Tracker
        await expect(page.getByRole('link', { name: /Open Case Workspace/i }).first()).toBeVisible();
        await page.goto('/tracker');
        await expect(page).toHaveURL(/\/tracker$/);
        await expect(page.getByRole('heading', { name: /Immigration Tracker/i })).toBeVisible();

        // Tracker -> Cases and modal open/close
        await page.goto('/tracker/cases');
        await expect(page.getByRole('heading', { name: /My Cases/i })).toBeVisible();
        await page.getByRole('button', { name: /New Case/i }).click();
        await expect(page.getByRole('heading', { name: /Create New Case/i })).toBeVisible();
        await page.getByRole('button', { name: /Cancel/i }).click();
        await expect(page.getByRole('heading', { name: /Create New Case/i })).not.toBeVisible();

        // Crisis home -> Crisis console
        await page.goto('/crisis-home');
        await expect(page.getByRole('heading', { name: /LifeBridge Crisis Corridor/i })).toBeVisible();
        await page.getByRole('link', { name: /Launch Crisis Mode/i }).first().click();
        await expect(page).toHaveURL(/\/crisis$/);

        // Verify main console tabs are present
        await expect(page.getByRole('button', { name: /Safe Havens/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Routes/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Reunite/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Help/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Copilot/i })).toBeVisible();

        // Crisis console logo -> Home
        await page.getByRole('link', { name: /Go to LifeBridge home/i }).first().click();
        await expect(page).toHaveURL(/\/$/);
        await expect(
            page.getByRole('heading', { name: /One app for crisis response and immigration continuity/i })
        ).toBeVisible();
    });

});


