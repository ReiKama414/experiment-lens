import type {
  Variant,
  ComparisonResult,
  ExperimentSettings,
  SRMResult,
  BusinessImpactResult,
} from '../types/experiment';

/**
 * Generates an executive Markdown report suitable for Notion, Slack, Jira, or GitHub
 */
export function generateMarkdownReport(
  experimentName: string,
  metricName: string,
  variants: Variant[],
  comparisons: ComparisonResult[],
  srm: SRMResult,
  settings: ExperimentSettings,
  businessImpact?: BusinessImpactResult | null
): string {
  const timestamp = new Date().toLocaleString('zh-TW', { timeZoneName: 'short' });
  const control = variants.find((v) => v.isControl) || variants[0];

  let md = `# 🔬 Experiment Lens 分析報告: ${experimentName}\n\n`;
  md += `> **評估指標**: ${metricName} | **信心水準**: ${(settings.confidenceLevel * 100).toFixed(0)}% (α = ${(1 - settings.confidenceLevel).toFixed(2)}) | **檢定假設**: ${settings.hypothesisDirection} | **報告產出時間**: ${timestamp}\n\n`;

  // 1. SRM Check
  md += `## 1. 樣本比例檢驗 (SRM Check)\n\n`;
  if (srm.hasMismatch) {
    md += `⚠️ **警告：檢測到樣本比例失衡 (Sample Ratio Mismatch, p = ${srm.pValue < 0.0001 ? '< 0.0001' : srm.pValue.toFixed(4)})！**\n`;
    md += `觀測分流與預期分流有極顯著差異，可能肇因於追蹤掉包、跳轉快取延遲或機器人流量。**在排查分流技術問題前，本實驗的統計結論可能不可靠！**\n\n`;
  } else {
    md += `✅ **分流比例正常 (p = ${srm.pValue.toFixed(4)})**，無發現樣本比例失衡現象。\n\n`;
  }

  // 2. Summary Table
  md += `## 2. 實驗組數據概覽\n\n`;
  md += `| 組別 | 訪客數 (N) | 轉換數 (x) | 轉換率 (CR) | 95% Wilson 信賴區間 | 備註 |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

  for (const v of variants) {
    const cr = v.visitors > 0 ? ((v.conversions / v.visitors) * 100).toFixed(2) + '%' : '0%';
    const role = v.isControl ? '🌟 對照組 (Control)' : '實驗組';
    md += `| ${v.name} | ${v.visitors.toLocaleString()} | ${v.conversions.toLocaleString()} | ${cr} | - | ${role} |\n`;
  }
  md += `\n`;

  // 3. Statistical Comparison
  md += `## 3. 雙樣本比例檢定與提升率比較 (基準: ${control.name})\n\n`;
  md += `| 實驗組 | 絕對提升 (Abs Lift) | 相對提升 (Rel Lift) | 95% Newcombe 信賴區間 | Z 分數 | P 值 | 統計顯著性 | P(B > A) |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

  for (const comp of comparisons) {
    const absLift = (comp.absoluteLift * 100).toFixed(2) + '%';
    const relLift = (comp.relativeLift > 0 ? '+' : '') + (comp.relativeLift * 100).toFixed(2) + '%';
    const ci = `[${(comp.absoluteLiftNewcombeCI.lower * 100).toFixed(2)}%, ${(comp.absoluteLiftNewcombeCI.upper * 100).toFixed(2)}%]`;
    const sigText = comp.isSignificant ? (comp.absoluteLift > 0 ? '🟢 顯著提升 (Win)' : '🔴 顯著劣於對照組') : '⚪ 未達顯著';
    const pStr = comp.pValue < 0.0001 ? '< 0.0001' : comp.pValue.toFixed(4);
    const bayesP = (comp.probBBeatsA * 100).toFixed(1) + '%';

    md += `| ${comp.variantName} | ${absLift} | ${relLift} | ${ci} | ${comp.zScore.toFixed(3)} | ${pStr} | ${sigText} | ${bayesP} |\n`;
  }
  md += `\n`;

  // 4. Practical & Business Significance
  md += `## 4. 商業價值與實質顯著性提醒 (Statistical vs. Business Significance)\n\n`;
  md += `- **統計顯著 ≠ 商業價值**：統計檢定僅代表「兩組差異大概率非純抽樣雜訊」，若樣本數極大（如數百萬），即便微小至 0.02% 的提升也會達顯著，但可能無法覆蓋上線的工程維護與伺服器成本。\n`;
  md += `- **避免偷窺偏誤 (Peeking Problem)**：若在測試進行中頻繁查看並在剛達顯著時立刻截停，會使真實偽陽性率膨脹至 30% 以上。請依事前規劃樣本數跑滿完整商業週期（至少 1~2 週）。\n`;

  if (businessImpact && businessImpact.isEconomicallyViable !== undefined) {
    md += `\n### 預估商業收益分析\n`;
    md += `- 每月額外預估轉換: **+${businessImpact.monthlyAdditionalConversions.toLocaleString()}** 次\n`;
    md += `- 每月額外預估營收: **+\$${businessImpact.monthlyAdditionalRevenue.toLocaleString()}**\n`;
    md += `- 預估回本週期: **${businessImpact.breakEvenMonths === 0 ? '立即' : businessImpact.breakEvenMonths.toFixed(1) + ' 個月'}**\n`;
  }

  md += `\n---\n*由 [Experiment Lens](https://github.com/) 自動產出，可透過分享連結還原完整計算參數。*\n`;

  return md;
}

/**
 * Generates CSV content of the experiment data and results
 */
export function generateCSV(
  variants: Variant[],
  comparisons: ComparisonResult[]
): string {
  const headers = [
    '組別名稱',
    '是否為對照組',
    '訪客數',
    '轉換數',
    '轉換率(%)',
    '絕對提升(%)',
    '相對提升(%)',
    '95%信賴區間下界(%)',
    '95%信賴區間上界(%)',
    'Z分數',
    'P值',
    '統計顯著',
    '貝氏勝率P(B>A)(%)',
  ];

  const rows = variants.map((v) => {
    const comp = comparisons.find((c) => c.variantId === v.id);
    const cr = v.visitors > 0 ? ((v.conversions / v.visitors) * 100).toFixed(4) : '0';

    if (v.isControl || !comp) {
      return [
        `"${v.name}"`,
        '是',
        v.visitors,
        v.conversions,
        cr,
        '0.00',
        '0.00',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ].join(',');
    }

    return [
      `"${v.name}"`,
      '否',
      v.visitors,
      v.conversions,
      cr,
      (comp.absoluteLift * 100).toFixed(4),
      (comp.relativeLift * 100).toFixed(4),
      (comp.absoluteLiftNewcombeCI.lower * 100).toFixed(4),
      (comp.absoluteLiftNewcombeCI.upper * 100).toFixed(4),
      comp.zScore.toFixed(4),
      comp.pValue.toFixed(6),
      comp.isSignificant ? '是' : '否',
      (comp.probBBeatsA * 100).toFixed(2),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Downloads a string as a text file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies text to user clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
}
