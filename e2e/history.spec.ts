import { test, expect, loginAsAdmin, navigateTo } from "./fixtures";

test.describe("History", () => {
  test("shows empty state when no workouts exist", async ({ page }) => {
    await loginAsAdmin(page);
    await navigateTo(page, "/history");
    await expect(page.getByText("Completed workouts will appear here")).toBeVisible();
  });

  test("shows completed workout in history after finishing one", async ({ page }) => {
    await loginAsAdmin(page);

    // Create and finish a workout
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("History Test");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    // Add an exercise
    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search exercises...").fill("Pull-Up");
    await page.getByText("Pull-Up").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();

    // Finish
    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.locator("text=Finish").last().click();

    // Should be on session detail
    await expect(page.getByText("History Test")).toBeVisible();

    // Navigate to history page
    await navigateTo(page, "/history");
    await expect(page.getByText("History Test")).toBeVisible();
    await expect(page.getByText("Total Workouts")).toBeVisible();
  });

  test("can delete a workout from session detail", async ({ page }) => {
    await loginAsAdmin(page);

    // Create and finish a quick workout
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Delete Me");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.locator("text=Finish").last().click();

    // Should be on session detail
    await expect(page.getByText("Delete Me")).toBeVisible();

    // Delete
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Delete Workout?")).toBeVisible();
    await page.locator("text=Delete").last().click();

    // Should redirect to history
    await expect(page).toHaveURL(/\/history/);
  });
});
