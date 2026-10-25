# 🔬 Experiment Lens

> **專業級 A/B 測試分析與統計決策工作台 (A/B Testing Analysis & Statistical Decision Studio)**  
> 具備雙樣本比例 Z 檢定、Wilson & Newcombe 信賴區間、Apache ECharts 高精度視覺化、SRM 樣本比例失衡偵測、樣本量與檢定力曲線估算、商業價值 ROI 試算、IndexedDB 本機資料庫持久化、無狀態 URL 分享與自主計算測試。

[![GitHub Pages Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev/)
[![Apache ECharts](https://img.shields.io/badge/Charts-Apache%20ECharts-e43961?logo=apacheecharts)](https://echarts.apache.org/)
[![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB%20(idb)-success)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Tests Passing](https://img.shields.io/badge/Tests-16%20Unit%20%7C%207%20E2E%20Pass-emerald)](https://vitest.dev/)

---

## 🛠 技術棧與架構原則 (Tech Stack & Architecture)

- **前端核心**：React 19 + TypeScript + Vite + Tailwind CSS。
- **圖表引擎**：**Apache ECharts**（支援高清晰度 Canvas / SVG 渲染、縮放、自訂標記線與即時 PNG 下載）。
- **資料持久化**：**IndexedDB (`idb`)**，提供完全離線可用、無須帳號的本機實驗資料庫儲存、批次搜尋、篩選與備份。
- **UI 設計風格**：專業數據工作台風格（參照 Bloomberg Terminal / Datadog / PostHog），字體、間距、色調與操作層級高度一致；無任何花俏裝飾粒子與影響效能之多餘動畫。
- **防禦性資料處理**：所有 CSV/JSON 匯入均具備空檔案、格式破損、欄位錯位、非數值、轉換數大於訪客數 ($x > N$) 及數千列大檔案之錯誤處理能力。

---

## 📋 功能特點 (Key Capabilities)

### 1. 雙樣本比例統計檢定 (Two-Sample Hypothesis Testing)
* **檢定統計量**：
  * 合併標準誤（Pooled SE: $\sqrt{\hat{p}_{\text{pool}}(1-\hat{p}_{\text{pool}})(1/N_A + 1/N_B)}$）檢定虛無假設 $H_0: p_A = p_B$。
  * 支援**雙尾檢定**（$p_B \neq p_A$）、**單尾大於**（$p_B > p_A$）與**單尾小於**（$p_B < p_A$）。
  * Yates 連續性校正（Continuity Correction）選項。
* **高精度信賴區間**：
  * **Wilson Score 區間**：各組轉換率均採用 Wilson 評分法，在轉換數極少（$x=0$）或比率極端時皆保持精確覆蓋率，不發生 Wald 區間坍縮為 0 的病態現象。
  * **Newcombe Hybrid Score 區間**：絕對提升（$\Delta p = p_B - p_A$）採用 Newcombe 綜合法，嚴格維持名目 95% 信賴水準。
  * **Delta Method 相對提升區間**：針對對數相對風險 $\ln(p_B / p_A)$ 進行一階展開，給出精確的相對百分比區間。
* **多重比較校正**：
  * 多組實驗組（A/B/n）時提供 **Benjamini-Hochberg (FDR)** 偽發現率與 Bonferroni 校正，防止型一誤差膨脹。
* **貝氏後驗勝率與期望損失**：
  * 以均勻無資訊先驗 $\text{Beta}(1, 1)$ 為起點，估計實驗組勝出機率 $P(B > A)$ 與選擇 B 或對照組 A 的期望決策風險（Expected Loss）。

### 2. 樣本比例失衡診斷 (Sample Ratio Mismatch, SRM)
* 透過 **Pearson 卡方適合度檢定 ($\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$)** 檢驗各組分流訪客數是否偏離預期權重。
* $p < 0.001$ 時發出嚴重技術警報，提醒團隊排查：
  - 轉址白屏或快取導致實驗組流失
  - 特定裝置或瀏覽器追蹤碼丟失
  - 機器人灌水或分流隨機雜湊偏誤
* **核心防禦提醒**：若存在 SRM，代表樣本收集過程已遭污染，任何顯著性結果均不可直接採信！

### 3. ECharts 視覺化分佈與誤差圖
* **轉換率抽樣密度鐘型曲線 (Sampling Distributions)**：視覺化各組 $\mathcal{N}(\mu, \sigma^2)$ 常態近似分佈的重疊面積。
* **絕對提升信賴區間森林圖 (Forest Plot)**：直觀呈現各變體相對於 $0$ 基準線的區間跨距，綠色代表顯著勝出、紅色代表顯著落後、灰色代表未達顯著。
* **圖表工具箱**：內建一鍵輸出 2x 高解析度 PNG 圖片功能。

### 4. 樣本量與檢定力規劃器 (Power & Sample Size Planner)
* 輸入基準轉換率 ($p_1$)、最小偵測效應（MDE，相對 % 或絕對 pp）、顯著水準 $\alpha$、檢定力 $1 - \beta$ 與每日進站流量。
* 計算每組所需樣本數 ($N$)、總樣本量與預估測試時長。
* **ECharts 檢定力曲線**：以折線圖呈現樣本數與檢定力的函數關係，標注 80% 與 90% 行業基準線與目前規劃點。

### 5. 商業價值評估與假設防禦 (Business Significance & Guardrails)
* **統計顯著 $\neq$ 具有商業價值**：
  * **超大樣本陷阱（Massive Sample Trap）**：在百萬樣本下，即使只有 0.02% 的微小提升也會使 $p < 0.001$，但額外營收若無法負擔架構維護與伺服器成本，上線反而造成虧損。
  * **實質 ROI 試算機**：輸入全站每月流量、平均客單價（AOV）、毛利率與工程成本，即時換算額外毛利與回本週期。
* **決策防禦清單**：
  * 偷窺偏誤（Peeking Problem / Continuous Monitoring）：頻繁偷看並在剛顯著時提前終止，會使真實偽陽性率膨脹至 30%~40%。
  * 新奇效應（Novelty Effect）與主要習慣抗拒。
  * 至少跑滿 1~2 週完整商業週期（避免星期幾效應 Day-of-Week Effect）。
  * 隨機單位一致性：必須以獨立使用者（User-level）為分母，不可使用工作階段（Session-level）。

### 6. IndexedDB 本機儲存庫 (Experiment Database)
* 自動將目前實驗之數據、組別、設定、狀態（草稿、進行中、已結案、封存）保存至瀏覽器 IndexedDB。
* 支援實驗複製（Duplicate）、刪除、即時搜尋、標籤篩選與歷史還原。
* 支援整庫備份為標準 JSON 檔案。

### 7. 檔案匯入/匯出與無狀態 URL 重現
* **匯入容錯**：
  - 支援 CSV（自動識別逗號、分號、Tab，智慧匹配欄位名稱）。
  - 支援 JSON（支援單一實驗檔或批次整庫匯入）。
  - 自動攔截：空檔案、欄位不足、非正整數、轉換數大於訪客數 ($x > N$) 等異常。
* **匯出功能**：
  - CSV 數據表（包含各組轉化率、各項信賴區間、Z 分數與 P 值）。
  - Markdown 決策報告（可直接貼入 Slack、Jira、Notion、GitHub PR）。
  - JSON 設定檔（包含完整參數）。
  - 壓縮狀態 URL Hash（`#exp=...`，透過 Base64 安全編碼，點擊連結即可 100% 還原實驗設定）。

---

## 🧪 測試驗證 (Testing & Verification)

本專案經過嚴格的雙層自動化測試驗證：

### 1. 單元測試 (Vitest)
涵蓋統計公式精度、邊界值、檔案解析與錯誤防禦：
```bash
npm run test
```
- **16 個單元測試通過**：
  - 標準常態分佈 CDF 與逆分位數數值精度（誤差 $< 10^{-4} \sim 10^{-7}$）。
  - Wilson 區間邊界條件（$x=0$ 與 $x=N$ 非簡併測試）。
  - Newcombe 區間差值涵蓋性測試。
  - Delta Method 相對提升對數轉換測試。
  - 雙樣本 Z 檢定統計量與雙尾 P 值標準基準。
  - SRM Pearson 卡方統計量與檢定力曲線估算。
  - 檔案解析極端邊界測試（空檔案、非法欄位、非數值、$x > N$、分號/逗號分隔符）。

### 2. 端到端測試 (Playwright E2E)
涵蓋核心使用者互動流程：
```bash
npm run test:e2e
```
- **7 個 E2E 流程通過**：
  1. 完整工作台介面載入與初始組件檢查。
  2. 範本案例切換與 SRM 技術警報觸發驗證。
  3. 即時修改組別數據與提升率動態重算。
  4. 多工作頁籤切換（A/B 檢定、樣本量規劃、商業價值 ROI 試算）。
  5. 內建 9 項數學基準自主驗證 Modal 執行測試（100% PASS）。
  6. 匯出/分享 Modal 驗證（Markdown 預覽、CSV 下載、JSON 備份）。
  7. IndexedDB 本機資料庫 Modal 讀取與篩選驗證。

---

## 💻 本地安裝與運行 (Local Development)

```bash
# 1. 複製專案庫
git clone <repository-url>
cd experiment-lens

# 2. 安裝相依套件
npm install

# 3. 啟動本地開發伺服器
npm run dev

# 4. 執行型別檢查與生產打包
npm run build

# 5. 執行單元測試
npm run test

# 6. 執行 Playwright 端到端驗證
npm run test:e2e
```

---

## 🌐 部署至 GitHub Pages (Deployment)

專案已配置 `vite.config.ts` 的 `base: './'`，完全支援 GitHub Pages 靜態託管，並內建 GitHub Actions 自動部署工作流程檔 `.github/workflows/deploy.yml`。

### 部署步驟
1. 將專案推送到 GitHub：
   ```bash
   git add .
   git commit -m "feat: complete production-ready Experiment Lens studio"
   git push origin main
   ```
2. 前往儲存庫的 **Settings** -> **Pages**。
3. 在 **Build and deployment** -> **Source** 選擇 **GitHub Actions**。
4. 部署工作流程完成後，即可直接線上使用！

---

## ⚠️ 已知限制與適用範圍 (Known Limitations)

1. **二元轉換指標專用 (Binary Proportions Only)**：
   - 本工具專門針對二元伯努利事件（0 或 1，例如「點擊率 CTR」、「購買轉化率 CVR」、「註冊完成率」）設計。
   - 若您的測試指標為**連續型數值**（例如「平均客單價 AOV」、「每位使用者平均收入 ARPU」、「網頁停留秒數」），應使用雙樣本 T 檢定（Two-sample T-test）、Welch's T-test 或非參數 Bootstrap 重抽樣法，不可直接套用二項比例公式。
2. **本機 IndexedDB 儲存邊界**：
   - 實驗紀錄預設持久化儲存於當前瀏覽器的 IndexedDB 沙盒中，無須註冊帳號或依賴雲端伺服器。
   - 若使用者手動清除瀏覽器網站資料、開啟無痕模式（Incognito）或更換瀏覽器，本機儲存庫將無法跨環境讀取。強烈建議透過「匯出 / 分享」產出 JSON 備份或使用 URL 分享連結保存重要實驗。
3. **網絡外部性與干擾 (Network Interference / SUTVA)**：
   - 雙樣本獨立檢定建立於 SUTVA（Stable Unit Treatment Value Assumption）基礎上。若產品具強社交網絡效應（例如：雙邊市集買賣雙方、通訊軟體群組），實驗組與對照組使用者會互相影響，導致標準誤低估，需改採叢集成群抽樣（Cluster Randomization）或切換地區分流。
4. **隨機分流單位 (Unit of Randomization)**：
   - 訪客數分母必須是**獨立使用者（User ID / Cookie ID）**，不可將工作階段（Session）或點擊事件（Click count）作為獨立樣本分母，否則同一人重複造訪會造成偽重複抽樣，使顯著性過度樂觀。

---

## 📄 License
MIT License.
