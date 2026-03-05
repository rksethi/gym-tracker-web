import { test, expect, TEST_ADMIN, REGISTER_INVITE_CODE } from "./fixtures";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "GymTracker" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("wrong@test.com");
    await page.getByPlaceholder("Enter your password").fill("WrongPass1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("logs in with valid credentials and shows home", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(TEST_ADMIN.email);
    await page.getByPlaceholder("Enter your password").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Start Workout")).toBeVisible();
  });

  test("registers a new account with invite code", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Enter your invite code").fill(REGISTER_INVITE_CODE);
    await page.getByPlaceholder("you@example.com").fill("newuser@test.com");
    await page.getByPlaceholder("Create a password").fill("NewUser1234");
    await page.getByPlaceholder("Confirm your password").fill("NewUser1234");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Start Workout")).toBeVisible();
  });

  test("rejects registration with invalid invite code", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Enter your invite code").fill("BADCODE");
    await page.getByPlaceholder("you@example.com").fill("bad@test.com");
    await page.getByPlaceholder("Create a password").fill("BadUser1234");
    await page.getByPlaceholder("Confirm your password").fill("BadUser1234");
    await page.getByRole("checkbox", { name: /privacy policy/i }).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/invalid or expired invite code/i)).toBeVisible();
  });

  test("logs out successfully", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(TEST_ADMIN.email);
    await page.getByPlaceholder("Enter your password").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Start Workout")).toBeVisible();

    await page.getByText("Sign out").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
