import { test, expect } from '@playwright/test';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function doBoxesIntersect(a: BoundingBox, b: BoundingBox, allowedOverlap = 1.0): boolean {
  // Check if two bounding boxes intersect by more than allowedOverlap pixels
  const noOverlapX = a.x + a.width <= b.x + allowedOverlap || b.x + b.width <= a.x + allowedOverlap;
  const noOverlapY = a.y + a.height <= b.y + allowedOverlap || b.y + b.height <= a.y + allowedOverlap;
  return !noOverlapX && !noOverlapY;
}

function isBoxContainedWithin(child: BoundingBox, parent: BoundingBox, tolerance = 2.0): boolean {
  const childRight = child.x + child.width;
  const childBottom = child.y + child.height;
  const parentRight = parent.x + parent.width;
  const parentBottom = parent.y + parent.height;

  return (
    child.x >= parent.x - tolerance &&
    childRight <= parentRight + tolerance &&
    child.y >= parent.y - tolerance &&
    childBottom <= parentBottom + tolerance
  );
}

test.describe('Zero-Overlap & 5-Section Document Flow Architecture Verification', () => {
  const TEST_VIEWPORTS = [
    { name: '320px Mobile', width: 320, height: 600 },
    { name: '768px Tablet', width: 768, height: 1024 },
    { name: '1280px Laptop', width: 1280, height: 800 },
    { name: '1920px Desktop', width: 1920, height: 1080 },
  ];

  for (const vp of TEST_VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): 5-layer document flow in chart cards strictly non-overlapping`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test Card 1: Sampling Distribution Chart Card
      const distCard = page.locator('[data-testid="dist-chart-card"]');
      await expect(distCard).toBeVisible();

      const distHeader = page.locator('[data-testid="dist-chart-header"]');
      const distDesc = page.locator('[data-testid="dist-chart-description"]');
      const distStats = page.locator('[data-testid="dist-chart-statistics"]');
      const distPlot = page.locator('[data-testid="dist-chart-plot"]');
      const distFooter = page.locator('[data-testid="dist-chart-footer"]');

      const [cardBox, hBox, dBox, sBox, pBox, fBox] = await Promise.all([
        distCard.boundingBox(),
        distHeader.boundingBox(),
        distDesc.boundingBox(),
        distStats.boundingBox(),
        distPlot.boundingBox(),
        distFooter.boundingBox(),
      ]);

      expect(cardBox).not.toBeNull();
      expect(hBox).not.toBeNull();
      expect(dBox).not.toBeNull();
      expect(sBox).not.toBeNull();
      expect(pBox).not.toBeNull();
      expect(fBox).not.toBeNull();

      if (cardBox && hBox && dBox && sBox && pBox && fBox) {
        // 1. Verify strict vertical document flow (Header above Desc, Desc above Stats, Stats above Plot, Plot above Footer)
        expect(hBox.y + hBox.height).toBeLessThanOrEqual(dBox.y + 1);
        expect(dBox.y + dBox.height).toBeLessThanOrEqual(sBox.y + 1);
        expect(sBox.y + sBox.height).toBeLessThanOrEqual(pBox.y + 1);
        expect(pBox.y + pBox.height).toBeLessThanOrEqual(fBox.y + 1);

        // 2. Verify NO intersection between adjacent or non-adjacent layers
        expect(doBoxesIntersect(hBox, dBox)).toBe(false);
        expect(doBoxesIntersect(dBox, sBox)).toBe(false);
        expect(doBoxesIntersect(sBox, pBox)).toBe(false);
        expect(doBoxesIntersect(pBox, fBox)).toBe(false);
        expect(doBoxesIntersect(hBox, pBox)).toBe(false);

        // 3. Verify all children are strictly contained inside the card bounds
        expect(isBoxContainedWithin(hBox, cardBox)).toBe(true);
        expect(isBoxContainedWithin(dBox, cardBox)).toBe(true);
        expect(isBoxContainedWithin(pBox, cardBox)).toBe(true);
        expect(isBoxContainedWithin(fBox, cardBox)).toBe(true);
      }

      // Test Card 2: Forest Plot Chart Card
      const ciCard = page.locator('[data-testid="ci-chart-card"]');
      await expect(ciCard).toBeVisible();

      const ciHeader = page.locator('[data-testid="ci-chart-header"]');
      const ciDesc = page.locator('[data-testid="ci-chart-description"]');
      const ciStats = page.locator('[data-testid="ci-chart-statistics"]');
      const ciPlot = page.locator('[data-testid="ci-chart-plot"]');
      const ciFooter = page.locator('[data-testid="ci-chart-footer"]');

      const [ciCardBox, ciHBox, ciDBox, ciSBox, ciPBox, ciFBox] = await Promise.all([
        ciCard.boundingBox(),
        ciHeader.boundingBox(),
        ciDesc.boundingBox(),
        ciStats.boundingBox(),
        ciPlot.boundingBox(),
        ciFooter.boundingBox(),
      ]);

      expect(ciCardBox).not.toBeNull();
      expect(ciHBox).not.toBeNull();
      expect(ciDBox).not.toBeNull();
      expect(ciSBox).not.toBeNull();
      expect(ciPBox).not.toBeNull();
      expect(ciFBox).not.toBeNull();

      if (ciCardBox && ciHBox && ciDBox && ciSBox && ciPBox && ciFBox) {
        expect(ciHBox.y + ciHBox.height).toBeLessThanOrEqual(ciDBox.y + 1);
        expect(ciDBox.y + ciDBox.height).toBeLessThanOrEqual(ciSBox.y + 1);
        expect(ciSBox.y + ciSBox.height).toBeLessThanOrEqual(ciPBox.y + 1);
        expect(ciPBox.y + ciPBox.height).toBeLessThanOrEqual(ciFBox.y + 1);

        expect(doBoxesIntersect(ciHBox, ciDBox)).toBe(false);
        expect(doBoxesIntersect(ciDBox, ciSBox)).toBe(false);
        expect(doBoxesIntersect(ciSBox, ciPBox)).toBe(false);
        expect(doBoxesIntersect(ciPBox, ciFBox)).toBe(false);
      }

      // Test Card 3: Power Curve (under Power Tab)
      await page.getByRole('button', { name: '樣本量與檢定力' }).click();
      const powerCard = page.locator('[data-testid="power-chart-card"]');
      await expect(powerCard).toBeVisible();

      const powerH = page.locator('[data-testid="power-chart-header"]');
      const powerD = page.locator('[data-testid="power-chart-description"]');
      const powerS = page.locator('[data-testid="power-chart-statistics"]');
      const powerP = page.locator('[data-testid="power-chart-plot"]');
      const powerF = page.locator('[data-testid="power-chart-footer"]');

      const [pwHBox, pwDBox, pwSBox, pwPBox, pwFBox] = await Promise.all([
        powerH.boundingBox(),
        powerD.boundingBox(),
        powerS.boundingBox(),
        powerP.boundingBox(),
        powerF.boundingBox(),
      ]);

      expect(pwHBox).not.toBeNull();
      expect(pwDBox).not.toBeNull();
      expect(pwSBox).not.toBeNull();
      expect(pwPBox).not.toBeNull();
      expect(pwFBox).not.toBeNull();

      if (pwHBox && pwDBox && pwSBox && pwPBox && pwFBox) {
        expect(pwHBox.y + pwHBox.height).toBeLessThanOrEqual(pwDBox.y + 1);
        expect(pwDBox.y + pwDBox.height).toBeLessThanOrEqual(pwSBox.y + 1);
        expect(pwSBox.y + pwSBox.height).toBeLessThanOrEqual(pwPBox.y + 1);
        expect(pwPBox.y + pwPBox.height).toBeLessThanOrEqual(pwFBox.y + 1);

        expect(doBoxesIntersect(pwHBox, pwDBox)).toBe(false);
        expect(doBoxesIntersect(pwDBox, pwSBox)).toBe(false);
        expect(doBoxesIntersect(pwSBox, pwPBox)).toBe(false);
        expect(doBoxesIntersect(pwPBox, pwFBox)).toBe(false);
      }
    });
  }

  test('200% Zoom scaling verification: Layout expands naturally without overlap', async ({ page }) => {
    // Set desktop width and emulate 200% zoom via page scale / deviceScaleFactor
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // Apply 200% browser text / layout zoom via CSS zoom to simulate browser zoom
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });

    // Verify main components are rendered without crashing or horizontal overflow
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="app-title-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-workbench-tabs"]')).toBeVisible();

    const titleInfoBox = await page.locator('[data-testid="app-title-info"]').boundingBox();
    const tabsBox = await page.locator('[data-testid="app-workbench-tabs"]').boundingBox();
    const bannerBox = await page.locator('[data-testid="app-title-banner"]').boundingBox();
    const tableHeading = await page.getByRole('heading', { name: '實驗組別與樣本數據' }).boundingBox();

    expect(titleInfoBox).not.toBeNull();
    expect(tabsBox).not.toBeNull();
    expect(bannerBox).not.toBeNull();
    expect(tableHeading).not.toBeNull();

    // Verify title info and workbench tabs do not collide
    if (titleInfoBox && tabsBox) {
      expect(doBoxesIntersect(titleInfoBox, tabsBox)).toBe(false);
    }

    // Verify banner and the table below it do not collide
    if (bannerBox && tableHeading) {
      expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(tableHeading.y + 1);
      expect(doBoxesIntersect(bannerBox, tableHeading)).toBe(false);
    }
  });

  test('Multi-variant (up to 6 variants) stress test: all cards expand without clipping', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // Add variants until 6 total
    const addBtn = page.getByRole('button', { name: '新增變體組' });
    for (let i = 0; i < 4; i++) {
      if (await addBtn.isEnabled()) {
        await addBtn.click();
      }
    }

    // Verify 6 rows exist in VariantTable
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(6);

    // Verify row 0 and row 1 bounding boxes do not overlap
    const row0Box = await rows.nth(0).boundingBox();
    const row1Box = await rows.nth(1).boundingBox();
    expect(row0Box).not.toBeNull();
    expect(row1Box).not.toBeNull();
    if (row0Box && row1Box) {
      expect(doBoxesIntersect(row0Box, row1Box)).toBe(false);
    }

    // Verify both ECharts have resized and cards remain non-overlapping
    const distCard = page.locator('[data-testid="dist-chart-card"]');
    const ciCard = page.locator('[data-testid="ci-chart-card"]');

    const distBox = await distCard.boundingBox();
    const ciBox = await ciCard.boundingBox();

    expect(distBox).not.toBeNull();
    expect(ciBox).not.toBeNull();

    if (distBox && ciBox) {
      expect(distBox.y + distBox.height).toBeLessThanOrEqual(ciBox.y + 1);
      expect(doBoxesIntersect(distBox, ciBox)).toBe(false);
    }
  });

  test('Visual inspection snapshots across Light and Dark modes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Capture Light Mode snapshot
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.screenshot({ path: 'test-results/workbench-light-desktop.png', fullPage: false });

    // Capture Dark Mode snapshot
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.screenshot({ path: 'test-results/workbench-dark-desktop.png', fullPage: false });

    // Mobile 320px snapshots
    await page.setViewportSize({ width: 320, height: 600 });
    await page.screenshot({ path: 'test-results/workbench-dark-320px.png', fullPage: false });

    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.screenshot({ path: 'test-results/workbench-light-320px.png', fullPage: false });
  });
});
