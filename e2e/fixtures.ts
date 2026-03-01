import { test as base, expect, type Page } from "@playwright/test";

export const TEST_ADMIN = { email: "admin@test.com", password: "Test1234" };
export const TEST_USER = { email: "user@test.com", password: "Test1234" };
export const TEST_INVITE_CODE = "TESTCODE";
export const REGISTER_INVITE_CODE = "TESTCOD2";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
  await expect(page.getByText("Start Workout")).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
}

export async function loginAsUser(page: Page) {
  await login(page, TEST_USER.email, TEST_USER.password);
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

export { base as test, expect };
