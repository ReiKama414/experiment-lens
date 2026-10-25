import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px - Extra Small Mobile', width: 320, height: 568 },
  { name: '375px - Small Mobile', width: 375, height: 667 },
  { name: '390px - Standard Mobile', width: 390, height: 844 },
  { name: '430px - Large Mobile', width: 430, height: 932 },
  { name: '768px - Tablet Portrait', width: 768, height: 1024 },
  { name: '1024px - Tablet Landscape', width: 1024, height: 768 },
  { name: '1280px - Laptop', width: 1280, height: 800 },
  { name: '1440px - Desktop', width: 1440, height: 900 },
  { name: '1920px - Large Desktop', width: 1920, height: 1080 },
];

test.describe('Responsive Layout Verification (All 9 Viewports)', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): No horizontal overflow in Light and Dark mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal overflow in default theme
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width);

      // Verify main workbench is visible
      await expect(page.locator('main')).toBeVisible();

      // Check header bounds
      const headerBox = await page.locator('header').boundingBox();
      expect(headerBox).not.toBeNull();
      if (headerBox) {
        expect(headerBox.width).toBeLessThanOrEqual(vp.width);
      }

      // Toggle Theme to Dark/Light via evaluate
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Verify no horizontal overflow in dark theme
      const darkScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(darkScrollWidth).toBeLessThanOrEqual(vp.width);

      // Toggle back to Light
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      const lightScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(lightScrollWidth).toBeLessThanOrEqual(vp.width);
    });
  }
});

test.describe('Theme System & Persistence Verification', () => {
  test('toggles theme between System, Light, and Dark modes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const themeToggleBtn = page.getByTitle(/切換主題/);
    await expect(themeToggleBtn).toBeVisible();

    // Check initial state (system mode)
    const initialMode = await page.evaluate(() => localStorage.getItem('experiment_lens_theme'));
    expect(initialMode === null || initialMode === 'system').toBeTruthy();

    // Open theme dropdown and choose Light mode
    await themeToggleBtn.click();
    await page.getByRole('button', { name: '淺色模式' }).click();
    const modeAfterFirstClick = await page.evaluate(() => localStorage.getItem('experiment_lens_theme'));
    expect(modeAfterFirstClick).toBe('light');
    const isDarkLight = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkLight).toBe(false);

    // Open theme dropdown and choose Dark mode
    await themeToggleBtn.click();
    await page.getByRole('button', { name: '深色模式' }).click();
    const modeAfterSecondClick = await page.evaluate(() => localStorage.getItem('experiment_lens_theme'));
    expect(modeAfterSecondClick).toBe('dark');
    const isDarkTrue = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkTrue).toBe(true);

    // Open theme dropdown and choose System mode
    await themeToggleBtn.click();
    await page.getByRole('button', { name: '系統預設' }).click();
    const modeAfterThirdClick = await page.evaluate(() => localStorage.getItem('experiment_lens_theme'));
    expect(modeAfterThirdClick).toBe('system');
  });

  test('respects prefers-color-scheme when theme is set to system', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Emulate light color scheme
    await page.emulateMedia({ colorScheme: 'light' });
    // Trigger system listener update
    await page.evaluate(() => {
      window.dispatchEvent(new Event('change'));
    });
  });
});

test.describe('Mobile Viewport (320px) End-to-End Interaction Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
  });

  test('mobile header drawer opens, navigates, and closes cleanly without layout break', async ({
    page,
  }) => {
    // Check mobile hamburger button
    const hamburgerBtn = page.getByLabel('開啟選單');
    await expect(hamburgerBtn).toBeVisible();

    // Open drawer
    await hamburgerBtn.click();
    await expect(page.getByText('工作台快速選單')).toBeVisible();

    // Verify modal options are inside drawer
    await expect(page.getByRole('button', { name: /實驗檔案庫/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /匯出 \/ 可重現分享/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /統計計算測試/ })).toBeVisible();

    // Verify drawer fits within 320px
    const drawerBox = await page.locator('text=工作台快速選單').boundingBox();
    expect(drawerBox).not.toBeNull();
    if (drawerBox) {
      expect(drawerBox.x).toBeGreaterThanOrEqual(0);
      expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(320);
    }

    // Close drawer
    await page.getByLabel('關閉選單').first().click();
    await expect(page.getByText('工作台快速選單')).not.toBeVisible();
  });

  test('opens calculation verification modal on 320px viewport without overflow', async ({ page }) => {
    // Open drawer and click verification
    await page.getByLabel('開啟選單').click();
    await page.getByRole('button', { name: /統計計算測試/ }).click();

    // Verify modal is visible and fits
    await expect(page.locator('text=統計數學運算基準測試 (Calculation Verification)')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);

    // Close modal
    await page.getByRole('button', { name: '關閉' }).first().click();
  });

  test('opens share export modal on 320px viewport without overflow', async ({ page }) => {
    // Open drawer and click share
    await page.getByLabel('開啟選單').click();
    await page.getByRole('button', { name: /匯出 \/ 可重現分享/ }).click();

    // Verify modal tabs
    await expect(page.getByRole('button', { name: '可重現分享網址' })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);

    // Close modal
    await page.getByRole('button', { name: '完成' }).click();
  });

  test('opens experiment database manager on 320px viewport without overflow', async ({ page }) => {
    // Open drawer and click database
    await page.getByLabel('開啟選單').click();
    await page.getByRole('button', { name: /實驗檔案庫/ }).click();

    // Verify modal
    await expect(page.locator('text=本機實驗庫 (IndexedDB 儲存庫)')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);

    // Close modal
    await page.getByRole('button', { name: '關閉' }).click();
  });

  test('navigates tabs and interacts with calculator inputs on 320px', async ({ page }) => {
    // Switch to Power Planner
    await page.getByRole('button', { name: '樣本量與檢定力' }).click();
    await expect(page.locator('text=樣本量規劃與統計檢定力估算')).toBeVisible();

    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);

    // Switch to Business Value
    await page.getByRole('button', { name: '商業價值與假設檢驗' }).click();
    await expect(page.locator('text=商業投資回報率 (ROI 試算)')).toBeVisible();

    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});
