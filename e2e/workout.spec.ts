import { test, expect, loginAsUser } from "./fixtures";

test.describe("Workout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("starts an empty workout from home page", async ({ page }) => {
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Test Workout");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await expect(page.locator('input[value="Test Workout"]')).toBeVisible();
    await expect(page.getByText("Add exercises to start logging sets")).toBeVisible();
  });

  test("adds exercise, logs a set, then finishes workout", async ({ page }) => {
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Bench Day");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    // Add an exercise
    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await expect(page.getByRole("heading", { name: "Add Exercises" })).toBeVisible();

    await page.getByPlaceholder("Search or create exercises...").fill("Barbell Bench");
    await page.getByText("Barbell Bench Press").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();

    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();

    // Fill in weight and reps for set 1
    const weightInput = page.locator('input[type="number"]').first();
    const repsInput = page.locator('input[type="number"]').nth(1);
    await weightInput.fill("135");
    await repsInput.fill("10");

    // Mark set as completed (click the circle toggle button)
    await page.locator('button.text-gray-600').first().click();

    // Add another set
    await page.getByRole("button", { name: /Add Set/ }).click();

    // Finish workout
    await page.getByRole("button", { name: "Finish" }).first().click();
    await expect(page.getByText("Finish Workout?")).toBeVisible();
    await page.locator("text=Finish").last().click();

    // Should redirect to session detail
    await expect(page.getByText("Bench Day")).toBeVisible();
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();
  });

  test("discards a workout", async ({ page }) => {
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Discard Me");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: "Discard" }).first().click();
    await expect(page.getByText("Discard Workout?")).toBeVisible();
    await page.locator("text=Discard").last().click();

    await expect(page.getByText("Start Workout")).toBeVisible();
  });
});
