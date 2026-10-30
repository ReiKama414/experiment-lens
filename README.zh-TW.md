# Experiment Lens

**繁體中文** · [English](README.md)

> **純前端 A/B 測試分析與統計決策工作台**，100% 瀏覽器本地沙盒運算，零伺服器資料傳輸

<p align="center">
  <img src="assets/screenshots/workbench-light.png" alt="Experiment Lens 工作台預覽" width="880" />
</p>

<p align="center">
  <a href="https://github.com/ReiKama414/experiment-lens">GitHub</a> ·
  <a href="https://reikama414.vercel.app/">個人網站</a> ·
  <a href="#核心亮點">核心亮點</a> ·
  <a href="#統計數學公式保證">數學保證</a> ·
  <a href="#快速開始">快速開始</a> ·
  <a href="#驗證與測試">驗證與測試</a> ·
  <a href="#license--權限">授權</a>
</p>

---

## 核心亮點

- **純瀏覽器本地沙盒運算** — 所有假設檢定、信賴區間、SRM 診斷與檢定力曲線均在瀏覽器本機端即時運算，完全零後端依賴與數據外洩風險
- **嚴謹雙樣本比例 Z 檢定** — 採用 Pooled Standard Error 雙樣本比例檢定，完整支援雙尾檢定、單尾優效性檢定與 Yates 連續性校正
- **穩健非簡併區間估計** — 各組轉換率採用 Wilson Score 區間，組間差值採用 Newcombe Hybrid Score 區間，相對提升採用 Delta Method 對數轉換，避免傳統 Wald 區間極端退化
- **多重比較防護機制** — 支援 Benjamini-Hochberg（FDR）偽發現率與 Bonferroni 校正，多組變體實驗有效抑制全域偽陽性累積
- **SRM 樣本比例失衡即時偵測** — 內建 Pearson 卡方適合度檢定，在流量分配偏離預期時即時亮起技術警報，阻止受污染數據誤導決策
- **獨立 Document Flow 零重疊排版** — 圖表卡片嚴格依循 Header → Description → Statistics → Chart → Footer 順序，完全不使用絕對定位覆蓋圖表
- **ECharts 互動分佈視覺化** — 繪製中心極限定理常態鐘型曲線、信賴區間森林圖與 MDE 檢定力衰減曲線，支援高解析度圖表輸出
- **商業價值與決策防禦守衛** — 內建 ROI 試算器與假設檢核清單，計算超額毛利並提醒防範新奇效應、星期幾效應與隨機單位不一致
- **全響應式與黑白雙主題** — 支援 System、Light 與 Dark 模態，適配 320px 至 1920px 共九種螢幕尺寸，全域採用無重疊獨立排版架構
- **IndexedDB 離線持久化儲存** — 內建瀏覽器原生資料庫儲存，實驗狀態自動同步保存，支援壓縮 URL 雜湊無狀態分享

---

## 內建實戰案例範本

系統預載三組標準實戰案例，亦支援自訂新增變體或上傳 CSV/JSON：

| 案例名稱 | 組別結構 | 關鍵指標 | 檢定與探索重點 |
| :--- | :--- | :--- | :--- |
| 電子商務結帳流程改版 (4 組別) | 對照組 (A) + 3 組實驗變體 | 結帳成功率 (4.8% ~ 5.6%) | 多重比較 FDR 校正、信賴區間森林圖、超額毛利 ROI 評估 |
| SaaS 登陸頁標題 MDE 探索 | 對照組 (A) vs 實驗組 (B) | 註冊轉換率 (12.0% vs 13.5%) | 雙樣本 Z 檢定顯著性、檢定力曲線、最小可偵測效應規劃 |
| SRM 流量分配失衡異常示範 | 對照組 (A) vs 實驗組 (B) | 點擊率 (CTR) | Pearson 卡方失衡警報 ($p < 0.001$)、工程故障排查防禦 |

---

## 統計數學公式保證

所有演算法皆經過獨立單元測試驗證（100% 通過），確保統計分析結果與數學理論標準完全一致：

- **雙樣本比例 Z 檢定 (Two-Sample Z-Test with Pooled SE)**：
  $$Z = \frac{p_B - p_A}{\sqrt{p_c(1 - p_c)\left(\frac{1}{n_A} + \frac{1}{n_B}\right)}}, \quad p_c = \frac{x_A + x_B}{n_A + n_B}$$
- **Wilson 得分信賴區間 (Wilson Score Interval)**：
  $$CI = \frac{p + \frac{z^2}{2n} \pm z\sqrt{\frac{p(1 - p)}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$
- **Newcombe 混合差值信賴區間 (Newcombe Hybrid Score Interval)**：
  $$\left[(p_B - p_A) - \sqrt{(p_B - l_B)^2 + (u_A - p_A)^2}, \quad (p_B - p_A) + \sqrt{(u_B - p_B)^2 + (p_A - l_A)^2}\right]$$
- **相對提升之 Delta Method 對數區間 (Log Ratio Interval)**：
  $$\ln(RR) \pm z \cdot \sqrt{\frac{1 - p_A}{n_A p_A} + \frac{1 - p_B}{n_B p_B}}, \quad \text{Lift} = \exp(\ln(RR)) - 1$$
- **SRM 樣本比例失衡卡方檢定 (Pearson Goodness-of-Fit)**：
  $$\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}, \quad df = k - 1$$
- **Evan Miller 樣本量推估 (Sample Size Determination)**：
  $$n = \frac{\left(z_{\alpha/2}\sqrt{2\bar{p}(1 - \bar{p})} + z_{\beta}\sqrt{p_1(1 - p_1) + p_2(1 - p_2)}\right)^2}{(p_2 - p_1)^2}$$
- **多重比較 Benjamini-Hochberg 校正 (False Discovery Rate)**：
  $$P_{(i)} \le \frac{i}{m} \cdot Q$$

---

## 技術棧

| 層級 | 技術選型 | 用途說明 |
| :--- | :--- | :--- |
| 前端框架 | React 19 · TypeScript 5 | 高型別安全、組件化介面與自訂 Hooks |
| 建置工具 | Vite 6 | 極速本機開發伺服器與 Rollup 生產打包 |
| 樣式管理 | Tailwind CSS | 高資訊密度專業工作台風格與雙主題規範 |
| 圖表繪製 | Apache ECharts · echarts-for-react | 自適應主題、包含標籤隔絕 (containLabel) 與圖表匯出 |
| 本機儲存 | 原生 IndexedDB (`idb`) | 瀏覽器沙盒結構化持久儲存，完全無外部伺服器依賴 |
| 圖示庫 | Lucide Icons | 統一、精緻的幾何向量圖示 |
| 自動化測試 | Vitest · Playwright | 16 項數學單元測試與 30 項全解析度 E2E 視覺驗證 |

---

## 快速開始

### 系統需求

需要 Node.js 20+ 與 npm

### 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 啟動本機開發伺服器
npm run dev
```

啟動後於瀏覽器開啟提示之本機網址（預設為 `http://localhost:5173`）

### 生產建置與預覽

```bash
# 執行 TypeScript 型別檢查與生產打包
npm run build

# 本機預覽生產版本
npm run preview
```

---

## 操作流程

1. **選擇或建立實驗**：在頂部導覽列可切換標準實戰範本（電商結帳、SaaS 登陸頁、SRM 失衡示範），或點擊「新實驗」開立空白畫布
2. **輸入樣本與轉換數**：在「組別數據輸入」表格填入各組名稱、訪客數（$N$）與成功轉換數（$x$），可隨時點擊「新增變體」擴充至多組 A/B/n
3. **檢查 SRM 技術診斷**：觀察組別概覽區的 SRM 卡方檢定。若 $p < 0.001$，表示分流過程有快取或追蹤遺失等工程異常，應先行排查
4. **探討統計檢定深層細節**：
   - 自由調整檢定方向（雙尾、單尾大於、單尾小於）與信賴水準（90%、95%、99%）
   - 開啟連續性校正或 Benjamini-Hochberg FDR 多重比較校正
   - 檢視 Wilson Score 區間、Newcombe 差值區間與 Beta-Binomial 貝氏勝率
5. **檢定力與樣本量規劃**：切換至「樣本量與檢定力」頁籤，輸入基準轉換率、MDE 與每日流量，查看預估天數與檢定力曲線
6. **商業價值守衛**：切換至「商業價值與假設檢驗」頁籤，輸入月流量、客單價、毛利率與工程維護成本，確認顯著結果是否足以打平成本
7. **匯出與分享**：點擊「匯出 / 可重現分享」，可下載 CSV 數據表、複製 Markdown 決策簡報、匯出 JSON 備份，或複製含有壓縮狀態的 URL 連結

---

## 驗證與測試

本專案經過嚴格統計精準度與自動化瀏覽器驗收（共 46 項測試：16 項單元測試 + 30 項 Playwright E2E 測試）：

```bash
# 執行統計數學算法單元測試
npm test

# 執行全套 Playwright 瀏覽器測試
npm run test:e2e
```

測試驗證清單：

- **統計精度保證**：標準常態分佈 CDF/InvCDF、Wilson 邊界收斂、Newcombe 差值區間、Delta Method 對數標準誤 100% 精度
- **檔案解析防禦**：空檔案、欄位缺失、非整數、轉換數大於樣本數（$x > N$）與分隔符相容性測試
- **全裝置 RWD**：驗證 320px、375px、390px、430px、768px、1024px、1280px、1440px、1920px 九種解析度，無水平溢出
- **黑白雙主題**：跟隨系統偏好、淺色模式與深色模式之切換與持久化
- **Zero-Overlap 排版完整性**：卡片標題、說明、統計數值、圖表畫布與圖例邊界嚴格非相交驗收，支援瀏覽器 200% 縮放

---

## 已知限制

> **提醒：**
> 1. 本工具專為二元伯努利事件（點擊率、轉換率、留存率）設計；若指標為連續型數值（客單價、停留時間、每人營收），應採用雙樣本 T 檢定或 Bootstrap 重抽樣法
> 2. 訪客數分母必須是獨立使用者（User ID 或 Cookie ID），不可使用造訪次數（Sessions）或點擊次數作為分母，否則會產生偽重複抽樣並低估標準誤
> 3. 本檢定建立於 SUTVA 假設；若產品具社交互動或雙邊市場效應，實驗組與對照組個體可能互相干擾，建議改採叢集成群抽樣或分區切換
> 4. 實驗數據保存於當前瀏覽器 IndexedDB 沙盒；若於無痕視窗（Incognito）操作或手動清理瀏覽快取，儲存內容將自動抹除，請善用「匯出」定期備份 JSON 檔案

---

## License / 權限

Copyright (c) ReiKama414. All rights reserved.

本專案僅供個人瀏覽與學習。未經著作權人書面同意，不得使用、複製、修改、散布或併入其他專案（含非商業用途）

- [GitHub](https://github.com/ReiKama414/experiment-lens)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<sub>Experiment Lens · 純前端 A/B 測試分析與統計決策工作台 · ReiKama414</sub>
