import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "lb_user",
        JSON.stringify({ name: "Smoke User", email: "smoke@example.com" }),
      );
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /One app for crisis response and immigration continuity/i,
      }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/LifeBridge/i);
  });

  test("can open crisis console and return home via logo", async ({ page }) => {
    await page
      .getByRole("link", { name: /Enter Crisis Console/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/crisis$/);
    await expect(page.getByRole("button", { name: /I'm Safe/i })).toBeVisible();

    await page
      .getByRole("link", { name: /Go to LifeBridge home/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", {
        name: /One app for crisis response and immigration continuity/i,
      }),
    ).toBeVisible();
  });
});
