import { test, expect } from "@playwright/test";

test.describe("Step Form Focus and Scroll Behavior", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the steps manager page
    await page.goto("/admin/steps-fixed");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");
  });

  test("should maintain input focus during continuous typing", async ({
    page,
  }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");

    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]');

    // Focus on title input
    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();

    // Verify initial focus
    await expect(titleInput).toBeFocused();

    // Type continuously and verify focus is maintained
    const testText = "This is a continuous typing test with multiple words";
    await titleInput.type(testText, { delay: 100 }); // Realistic typing speed

    // Verify focus is still maintained
    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveValue(testText);

    // Continue typing to ensure no interruption
    await titleInput.type(" and even more words", { delay: 50 });
    await expect(titleInput).toBeFocused();
  });

  test("should preserve focus in textarea fields", async ({ page }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    // Test description textarea
    const descriptionTextarea = page.locator('textarea[id="description"]');
    await descriptionTextarea.click();
    await expect(descriptionTextarea).toBeFocused();

    const descriptionText =
      "This is a long description that spans multiple lines and contains various words";
    await descriptionTextarea.type(descriptionText, { delay: 50 });
    await expect(descriptionTextarea).toBeFocused();
    await expect(descriptionTextarea).toHaveValue(descriptionText);

    // Test instruction textarea
    const instructionTextarea = page.locator('textarea[id="instruction"]');
    await instructionTextarea.click();
    await expect(instructionTextarea).toBeFocused();

    const instructionText =
      "These are detailed instructions with multiple sentences. Each sentence contains several words.";
    await instructionTextarea.type(instructionText, { delay: 30 });
    await expect(instructionTextarea).toBeFocused();
    await expect(instructionTextarea).toHaveValue(instructionText);
  });

  test("should maintain scroll position during typing", async ({ page }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    // Find the scrollable container
    const scrollContainer = page
      .locator('[role="dialog"] .overflow-y-auto')
      .first();

    // Scroll down to create a scroll position
    await scrollContainer.evaluate((el) => (el.scrollTop = 100));

    // Get initial scroll position
    const initialScrollTop = await scrollContainer.evaluate(
      (el) => el.scrollTop,
    );
    expect(initialScrollTop).toBeGreaterThan(50);

    // Type in an input field that might trigger re-renders
    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();
    await titleInput.type("Testing scroll preservation during typing");

    // Verify scroll position is maintained (allow small variance)
    const currentScrollTop = await scrollContainer.evaluate(
      (el) => el.scrollTop,
    );
    expect(Math.abs(currentScrollTop - initialScrollTop)).toBeLessThan(20);
  });

  test("should handle rapid typing without issues", async ({ page }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();

    // Rapid typing test (no delay)
    const rapidText = "RapidTypingTestWithoutDelayBetweenKeystrokes";
    await titleInput.type(rapidText, { delay: 0 });

    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveValue(rapidText);
  });

  test("should handle device selection without affecting input focus", async ({
    page,
  }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    // First, type in title
    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();
    await titleInput.type("Initial title text");

    // Select a device (this might trigger re-renders)
    const deviceSelect = page.locator('[role="combobox"]').first();
    await deviceSelect.click();

    // Wait for dropdown and select first option if available
    await page.waitForTimeout(200);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
    } else {
      // Close dropdown if no options
      await page.keyboard.press("Escape");
    }

    // Return to title input and continue typing
    await titleInput.click();
    await expect(titleInput).toHaveValue("Initial title text");
    await titleInput.type(" continued after device change");

    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveValue(
      "Initial title text continued after device change",
    );
  });

  test("should handle special characters without focus loss", async ({
    page,
  }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();

    // Test with various special characters
    const specialText = "Test with special chars: àáâãäå ñç üö @#$%^&*()";
    await titleInput.type(specialText, { delay: 30 });

    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveValue(specialText);
  });

  test("should preserve caret position during input", async ({ page }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();

    // Type initial text
    await titleInput.type("Hello world");

    // Move cursor to position 5 (after "Hello")
    await titleInput.evaluate((el: HTMLInputElement) => {
      el.setSelectionRange(5, 5);
    });

    // Type additional text at cursor position
    await page.keyboard.type(" beautiful");

    // Verify the result
    await expect(titleInput).toHaveValue("Hello beautiful world");
    await expect(titleInput).toBeFocused();
  });

  test("should handle copy and paste operations", async ({ page }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();

    // Type some text
    await titleInput.type("Original text");

    // Select all text
    await page.keyboard.press("ControlOrCmd+a");

    // Copy text
    await page.keyboard.press("ControlOrCmd+c");

    // Paste text (duplicating it)
    await page.keyboard.press("ControlOrCmd+v");

    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveValue("Original text");
  });

  test("should handle tab navigation correctly", async ({ page }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    // Start from first input
    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();
    await titleInput.type("Test title");

    // Tab to next field
    await page.keyboard.press("Tab");

    // Should be in description textarea
    const descriptionTextarea = page.locator('textarea[id="description"]');
    await expect(descriptionTextarea).toBeFocused();

    await descriptionTextarea.type("Test description");

    // Tab to instruction field
    await page.keyboard.press("Tab");

    const instructionTextarea = page.locator('textarea[id="instruction"]');
    await expect(instructionTextarea).toBeFocused();

    await instructionTextarea.type("Test instruction");

    // Verify all values are preserved
    await expect(titleInput).toHaveValue("Test title");
    await expect(descriptionTextarea).toHaveValue("Test description");
    await expect(instructionTextarea).toHaveValue("Test instruction");
  });

  test("should handle form validation without breaking focus", async ({
    page,
  }) => {
    // Open create dialog
    await page.click("text=Создать новый шаг");
    await page.waitForSelector('[role="dialog"]');

    const titleInput = page.locator('input[id="title"]');
    await titleInput.click();
    await titleInput.type("Test title");

    // Try to submit without required fields
    await page.click("text=Создать");

    // Should show validation error but not break focus capability
    await titleInput.click();
    await titleInput.type(" continued typing");

    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveValue("Test title continued typing");
  });
});
