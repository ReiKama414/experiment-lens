import type { Variant, ExperimentSettings } from '../types/experiment';

export interface PresetExperiment {
  id: string;
  name: string;
  tag: string;
  description: string;
  settings: ExperimentSettings;
  variants: Variant[];
}

export const PRESET_EXPERIMENTS: PresetExperiment[] = [
  {
    id: 'clear-win',
    name: '電商結帳頁簡化流程 (顯著獲勝)',
    tag: 'Clear Win',
    description: '新版單頁結帳流程相較於舊版多步驟，轉換率提升約 14%，達到高度統計顯著 (p < 0.001)。',
    settings: {
      experimentName: '結帳頁一頁式流程優化測試',
      metricName: '完成付款訂單率',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: false,
    },
    variants: [
      {
        id: 'control',
        name: '對照組 (原有 3 步驟結帳)',
        visitors: 25000,
        conversions: 1250,
        expectedTrafficPercent: 50,
        isControl: true,
      },
      {
        id: 'treatment-b',
        name: '實驗組 B (簡化一頁式結帳)',
        visitors: 25000,
        conversions: 1425,
        expectedTrafficPercent: 50,
        isControl: false,
      },
    ],
  },
  {
    id: 'flat-test',
    name: '首頁主視覺 Banner 改版 (無顯著差異)',
    tag: 'Inconclusive',
    description: '新設計的 Hero Banner 與舊版相比轉換率幾乎持平 (4.00% vs 3.97%)，p 值約 0.89，無統計顯著差異。',
    settings: {
      experimentName: '首頁 Hero Banner 視覺測試',
      metricName: '首頁點擊至商品頁率',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: false,
    },
    variants: [
      {
        id: 'control',
        name: '對照組 (經典輪播圖)',
        visitors: 18000,
        conversions: 720,
        expectedTrafficPercent: 50,
        isControl: true,
      },
      {
        id: 'treatment-b',
        name: '實驗組 B (情境靜態大圖)',
        visitors: 18000,
        conversions: 715,
        expectedTrafficPercent: 50,
        isControl: false,
      },
    ],
  },
  {
    id: 'srm-warning',
    name: '分流比例失衡警報 (SRM 技術故障)',
    tag: 'SRM Mismatch',
    description: '預期 50:50 分流，但實驗組嚴重落後 (30,000 vs 27,800, p < 0.0001)，常見於轉址白屏、CDN 緩存或追蹤掉點。',
    settings: {
      experimentName: '搜尋結果頁重構測試 (潛在 Bug)',
      metricName: '加購物車率',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: false,
    },
    variants: [
      {
        id: 'control',
        name: '對照組 A (舊版搜尋)',
        visitors: 30000,
        conversions: 1500,
        expectedTrafficPercent: 50,
        isControl: true,
      },
      {
        id: 'treatment-b',
        name: '實驗組 B (新版搜尋 API)',
        visitors: 27800,
        conversions: 1473,
        expectedTrafficPercent: 50,
        isControl: false,
      },
    ],
  },
  {
    id: 'massive-sample-trivial-lift',
    name: '超大樣本微小提升 (統計顯著 vs 商業價值)',
    tag: 'Business Significance',
    description: '50 萬樣本下提升 0.15% 即具高度統計顯著 (p = 0.0007)，但需評估額外營收能否負擔系統架構維護開銷。',
    settings: {
      experimentName: '全站導航列微調陰影顏色測試',
      metricName: '訂單轉換率',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: false,
    },
    variants: [
      {
        id: 'control',
        name: '對照組 (原有灰色陰影)',
        visitors: 500000,
        conversions: 25000,
        expectedTrafficPercent: 50,
        isControl: true,
      },
      {
        id: 'treatment-b',
        name: '實驗組 B (高對比藍色陰影)',
        visitors: 500000,
        conversions: 25750,
        expectedTrafficPercent: 50,
        isControl: false,
      },
    ],
  },
  {
    id: 'multi-arm-abc',
    name: '三組變體 A/B/C 多重檢定',
    tag: 'A/B/n Test',
    description: '同時測試多組變體，示範 Bonferroni 與 Benjamini-Hochberg (FDR) 多重比較校正對 p 值的影響。',
    settings: {
      experimentName: '會員訂閱定價方案測試',
      metricName: '付費訂閱轉換率',
      confidenceLevel: 0.95,
      hypothesisDirection: 'two-sided',
      useContinuityCorrection: false,
      enableMultipleTestingCorrection: true,
    },
    variants: [
      {
        id: 'control',
        name: '對照組 (原有月繳 $299)',
        visitors: 15000,
        conversions: 450,
        expectedTrafficPercent: 33.33,
        isControl: true,
      },
      {
        id: 'treatment-b',
        name: '實驗組 B (年繳 $2990 促銷)',
        visitors: 15000,
        conversions: 495,
        expectedTrafficPercent: 33.33,
        isControl: false,
      },
      {
        id: 'treatment-c',
        name: '實驗組 C (季繳 $799 限時特價)',
        visitors: 15000,
        conversions: 540,
        expectedTrafficPercent: 33.34,
        isControl: false,
      },
    ],
  },
];
