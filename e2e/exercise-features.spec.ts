import { test, expect, loginAsUser } from "./fixtures";

function setInputs(page: import("@playwright/test").Page) {
  // index 0 = Max HR input, index 1 = weight, index 2 = reps
  return {
    weight: page.locator('input[type="number"]').nth(1),
    reps: page.locator('input[type="number"]').nth(2),
  };
}

test.describe("Last weight/reps auto-population", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("pre-fills weight and reps from the previous completed workout", async ({ page }) => {
    // Workout 1: add exercise, enter weight/reps, finish
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("First Session");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search or create exercises...").fill("Barbell Bench");
    await page.getByText("Barbell Bench Press").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();

    const s1 = setInputs(page);
    await s1.weight.fill("185");
    await s1.weight.blur();
    await s1.reps.fill("8");
    await s1.reps.blur();

    // Do NOT mark the set as completed — the fix ensures this still works
    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.locator("text=Finish").last().click();
    await expect(page.getByText("First Session")).toBeVisible();

    // Workout 2: add the same exercise, check pre-filled values
    await page.goto("/");
    await expect(page.getByText("Start Workout")).toBeVisible();

    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Second Session");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search or create exercises...").fill("Barbell Bench");
    await page.getByText("Barbell Bench Press").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();

    const s2 = setInputs(page);
    await expect(s2.weight).toHaveValue("185");
    await expect(s2.reps).toHaveValue("8");

    // Clean up — discard the second workout
    await page.getByRole("button", { name: "Discard" }).first().click();
    await page.locator("text=Discard").last().click();
  });

  test("pre-fills even when previous sets were marked completed", async ({ page }) => {
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Completed Sets Session");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search or create exercises...").fill("Back Squat");
    await page.getByText("Barbell Back Squat").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();

    const s1 = setInputs(page);
    await s1.weight.fill("225");
    await s1.weight.blur();
    await s1.reps.fill("5");
    await s1.reps.blur();

    // Mark set as completed this time
    await page.locator('button.text-gray-600').first().click();

    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.locator("text=Finish").last().click();
    await expect(page.getByText("Completed Sets Session")).toBeVisible();

    // Start new workout and verify
    await page.goto("/");
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Next Squat Day");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search or create exercises...").fill("Back Squat");
    await page.getByText("Barbell Back Squat").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();

    const s2 = setInputs(page);
    await expect(s2.weight).toHaveValue("225");
    await expect(s2.reps).toHaveValue("5");

    await page.getByRole("button", { name: "Discard" }).first().click();
    await page.locator("text=Discard").last().click();
  });
});

test.describe("Add exercises to historical workout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("can add a new exercise to a completed workout via Edit mode", async ({ page }) => {
    // Create and finish a workout with one exercise
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("History Edit Test");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search or create exercises...").fill("Barbell Bench");
    await page.getByText("Barbell Bench Press").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();

    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.locator("text=Finish").last().click();

    // Now on session detail — verify one exercise
    await expect(page.getByText("History Edit Test")).toBeVisible();
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();

    // Enter edit mode
    await page.getByRole("button", { name: "Edit" }).click();

    // The "Add Exercise" button should now be visible
    await expect(page.getByRole("button", { name: /Add Exercise/ })).toBeVisible();

    // Add a second exercise
    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await expect(page.getByRole("heading", { name: "Add Exercises" })).toBeVisible();

    await page.getByPlaceholder("Search or create exercises...").fill("Pull-Up");
    await page.getByText("Pull-Up").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();

    // Both exercises should now be visible
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();
    await expect(page.getByText("Pull-Up").first()).toBeVisible();

    // Exit edit mode
    await page.getByRole("button", { name: "Done" }).click();

    // Verify both still visible in read-only mode
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();
    await expect(page.getByText("Pull-Up").first()).toBeVisible();
  });

  test("Add Exercise button is only visible in Edit mode", async ({ page }) => {
    // Create and finish a workout
    await page.getByText("Start Workout").click();
    await page.getByPlaceholder("e.g. Push Day").fill("Edit Mode Check");
    await page.getByRole("button", { name: "Start", exact: true }).click();

    await page.getByRole("button", { name: /Add Exercise/ }).click();
    await page.getByPlaceholder("Search or create exercises...").fill("Deadlift");
    await page.getByText("Conventional Deadlift").first().click();
    await page.getByRole("button", { name: /Add \(1\)/ }).click();

    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.locator("text=Finish").last().click();
    await expect(page.getByText("Edit Mode Check")).toBeVisible();

    // In read-only mode, no "Add Exercise" button
    await expect(page.getByRole("button", { name: /Add Exercise/ })).not.toBeVisible();

    // Enter edit mode — button appears
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: /Add Exercise/ })).toBeVisible();

    // Exit edit mode — button disappears
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("button", { name: /Add Exercise/ })).not.toBeVisible();
  });
});
