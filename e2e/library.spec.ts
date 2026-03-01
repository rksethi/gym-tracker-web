import { test, expect, loginAsUser, navigateTo } from "./fixtures";

test.describe("Exercise Library", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateTo(page, "/library");
  });

  test("displays exercise library with categories", async ({ page }) => {
    await expect(page.getByText("Exercises")).toBeVisible();
    await expect(page.getByPlaceholder("Search exercises...")).toBeVisible();
  });

  test("filters exercises by search", async ({ page }) => {
    await page.getByPlaceholder("Search exercises...").fill("Barbell Bench Press");
    await expect(page.getByText("Barbell Bench Press", { exact: true })).toBeVisible();
    await expect(page.getByText("Treadmill Running")).not.toBeVisible();
  });

  test("filters exercises by category", async ({ page }) => {
    await page.getByRole("button", { name: /Cardio/ }).click();
    await expect(page.getByText("Treadmill Running")).toBeVisible();
    await expect(page.getByText("Barbell Bench Press")).not.toBeVisible();
  });

  test("adds a custom exercise", async ({ page }) => {
    await page.getByRole("button", { name: /Add/ }).click();
    await expect(page.getByText("Add Custom Exercise")).toBeVisible();

    await page.getByPlaceholder("Exercise name").fill("Custom Test Exercise");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Custom Test Exercise")).toBeVisible();
  });
});

test.describe("Templates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateTo(page, "/library/templates");
  });

  test("shows templates page", async ({ page }) => {
    await expect(page.getByText("Workout Templates")).toBeVisible();
  });

  test("creates a new template", async ({ page }) => {
    await page.getByRole("button", { name: /New Template/ }).click();
    await expect(page.getByRole("heading", { name: "New Template" })).toBeVisible();

    await page.getByPlaceholder("e.g. Push Day").fill("My Test Template");
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByText("Barbell Bench Press").first().click();
    await page.getByText("Incline Dumbbell Press").first().click();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("My Test Template")).toBeVisible();
    await expect(page.getByText("2 exercises")).toBeVisible();
  });
});
