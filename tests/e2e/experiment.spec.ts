import { test, expect } from '@playwright/test';

test.describe('Experiment Lens Studio E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads workbench and displays initial components properly', async ({ page }) => {
    await expect(page).toHaveTitle(/Experiment Lens/);
    await expect(page.locator('header')).toContainText('Experiment Lens');
    await expect(page.locator('header')).toContainText('PRO STUDIO');

    // Check variant table
    await expect(page.getByRole('heading', { name: '實驗組別與樣本數據' })).toBeVisible();
    await expect(page.getByPlaceholder('例如：對照組 A').first()).toBeVisible();
  });

  test('switches presets and verifies SRM warning alert', async ({ page }) => {
    // Open preset dropdown
    await page.getByRole('button', { name: '案例範本' }).click();

    // Select SRM warning preset
    await page.getByRole('button', { name: '分流比例失衡警報 (SRM 技術故障)' }).click();

    // Verify SRM warning banner is displayed
    await expect(page.locator('text=重大技術警告：檢測到樣本比例失衡')).toBeVisible();
    await expect(page.locator('text=SRM 異常無效').first()).toBeVisible();
  });

  test('updates conversion numbers and calculates lift in real-time', async ({ page }) => {
    // Open preset dropdown and reset to standard e-commerce preset to ensure clean slate
    await page.getByRole('button', { name: '案例範本' }).click();
    await page.getByRole('button', { name: '電商結帳頁簡化流程 (顯著獲勝)' }).click();

    // Find treatment conversions input
    const inputs = page.locator('input[placeholder="500"]');
    const treatmentConversions = inputs.nth(1);

    // Enter a new conversion value
    await treatmentConversions.fill('1500');

    // Verify relative lift is calculated
    await expect(page.locator('text=相對提升').first()).toBeVisible();
    await expect(page.locator('text=絕對提升').first()).toBeVisible();
  });

  test('navigates across tabs: Analysis, Power, and Business Value', async ({ page }) => {
    // Switch to Power tab
    await page.getByRole('button', { name: '樣本量與檢定力' }).click();
    await expect(page.locator('text=樣本量規劃與統計檢定力估算')).toBeVisible();
    await expect(page.locator('text=ECharts 檢定力曲線')).toBeVisible();

    // Switch to Business Value tab
    await page.getByRole('button', { name: '商業價值與假設檢驗' }).click();
    await expect(page.locator('text=商業投資回報率 (ROI 試算)')).toBeVisible();
    await page.getByRole('button', { name: '底層統計假設檢驗' }).click();
    await expect(page.locator('text=獨立同分佈假設')).toBeVisible();

    // Switch back to Analysis tab
    await page.getByRole('button', { name: 'A/B 檢定分析' }).click();
    await expect(page.getByRole('heading', { name: '實驗組別與樣本數據' })).toBeVisible();
  });

  test('opens and runs self-verification calculation suite', async ({ page }) => {
    // Click verification modal button in header
    await page.getByRole('button', { name: /計算測試/ }).click();

    // Verify modal content
    await expect(page.locator('text=統計數學運算基準測試 (Calculation Verification)')).toBeVisible();
    await expect(page.locator('text=100% PASS')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: '關閉' }).click();
    await expect(page.locator('text=統計數學運算基準測試')).not.toBeVisible();
  });

  test('opens share & export modal and verifies export formats', async ({ page }) => {
    // Click share button
    await page.getByRole('button', { name: '匯出 / 分享' }).click();

    // Verify tabs
    await expect(page.getByRole('button', { name: '可重現分享網址' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Markdown 報告' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'CSV 數據表格' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JSON 存檔與還原' })).toBeVisible();

    // Click Markdown tab and verify preview
    await page.getByRole('button', { name: 'Markdown 報告' }).click();
    await expect(page.locator('textarea')).toContainText('# 🔬 Experiment Lens 分析報告');

    // Close modal
    await page.getByRole('button', { name: '完成' }).click();
  });

  test('opens database modal and views saved experiments', async ({ page }) => {
    // Click database button in header
    await page.getByRole('button', { name: '實驗檔案庫' }).click();

    // Verify database modal
    await expect(page.locator('text=本機實驗庫 (IndexedDB 儲存庫)')).toBeVisible();
    await expect(page.getByRole('button', { name: '建立新實驗' })).toBeVisible();
    await expect(page.getByPlaceholder('搜尋實驗名稱、指標或標籤...')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: '關閉' }).click();
  });
});
