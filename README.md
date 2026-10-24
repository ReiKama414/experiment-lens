# 🔬 Experiment Lens

> **專業級 A/B 測試分析與統計決策工具 (A/B Testing Analysis & Statistical Decision Engine)**  
> 具備雙樣本比例檢定、Wilson & Newcombe 信賴區間、SRM 樣本比例失衡偵測、樣本量與檢定力估算、商業價值 ROI 試算、可重現分享與自主計算測試。

[![GitHub Pages Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## ✨ 核心特色 (Core Features)

### 1. 🧮 嚴謹高精度雙樣本比例統計檢定
- **雙樣本比例 Z 檢定 (Two-Sample Z-Test for Proportions)**：
  - 合併標準誤 ($SE_{\text{pool}}$) 進行原假設 $H_0: p_A = p_B$ 檢定。
  - 支援雙尾 (Two-Sided)、單尾大於 (One-Sided Greater)、單尾小於 (One-Sided Less) 檢定方向。
  - 連續性校正 (Yates' Continuity Correction) 選項。
  - 多組變體比較時支援 **Benjamini-Hochberg (FDR)** 偽發現率與 Bonferroni 校正。
- **卓越的信賴區間方法**：
  - **Wilson Score 區間**：針對個別組別轉換率，有效避免傳統 Wald 區間在轉換數極少 ($x=0$) 或極端比率時坍縮為 0 的病態缺陷。
  - **Newcombe Hybrid Score 區間**：針對兩組「絕對提升 ($\Delta p = p_B - p_A$)」，結合兩側 Wilson 區間，覆蓋率嚴格穩定在名目 $95\%$。
  - **Delta Method 相對提升區間**：針對對數相對風險 $\ln(p_B / p_A)$ 進行一階泰勒展開，給出精確的相對提升百分比區間。
- **貝氏後驗勝率 (Bayesian Win Probability & Expected Loss)**：
  - 以均勻先驗 $\text{Beta}(1, 1)$ 為基礎計算後驗分佈。
  - 計算實驗組勝出機率 $P(B > A)$ 以及選擇 B 或維持 A 的期望潛在決策損失 (Expected Loss)。

### 2. ⚠️ 樣本比例失衡警報 (Sample Ratio Mismatch, SRM)
- 採用 **Pearson 卡方適合度檢定 ($\chi^2$ Goodness-of-Fit)** 比對實際分流與預期流量分配比例。
- 當 $p < 0.001$ 時發出嚴重技術警報，提醒團隊排查：
  - 轉址快取或白屏導致流量漏失
  - 特定裝置或瀏覽器追蹤碼丟失
  - 機器人灌水或分流隨機雜湊偏誤
- **防禦性原則**：若存在 SRM，任何轉換率檢定結果不可直接採信！

### 3. 📈 樣本量與統計檢定力規劃器 (Sample Size & Power Planner)
- 輸入基準轉換率 ($p_1$)、最小偵測效應 (MDE，支援相對 % 或絕對 pp)、顯著水準 $\alpha$、檢定力 $1 - \beta$ 與分流比例。
- 自動計算每組所需樣本數 ($N$)、總樣本量與預估測試天數。
- **互動式檢定力曲線 (Interactive Power Curve)**：繪製樣本數與檢定力之函數曲線，清晰標示 $80\%$ 與 $90\%$ 門檻線。

### 4. 🛡️ 商業價值實質顯著性與決策防禦 (Business vs Statistical Significance)
- **統計顯著 $\neq$ 具有商業價值**：
  - 解構「超大樣本陷阱 (Massive Sample Trap)」：樣本數達百萬時，微小如 $0.02\%$ 的提升也會 $p < 0.001$，但可能不足以抵償伺服器擴展與工程維護成本。
- **ROI / 實質經濟效益試算機**：
  - 輸入每月流量、客單價 (AOV)、商品毛利率與工程上線成本。
  - 即時換算預估每月額外訂單數、額外營收、額外毛利與投資回本週期 (Payback Months)。
- **決策避坑防禦清單**：
  - 偷窺偏誤 (The Peeking Problem)：解釋頻繁監控數據並在剛達顯著時提前終止測試，會使真實偽陽性率膨脹至 $30\% \sim 40\%$。
  - 新奇效應 (Novelty Effect) 與主要效應 (Primacy Effect)。
  - 跑滿完整週循環 (Day-of-Week Seasonality，建議最少 1~2 週)。
  - 隨機分流單位一致性 (Unit of Randomization)：分母須為獨立使用者 (User-level) 而非造訪 (Session-level)。

### 5. 🧪 內建自主計算測試套件 (Self-Verification Suite)
- 內建 9 項基準單元測試，比對 NIST、R `prop.test` 與 SciPy 標準數值：
  1. 常態分佈 CDF 對稱性驗證 $\Phi(0) = 0.5$
  2. 常態臨界分位數 $\Phi(1.959964) = 0.975$
  3. 逆常態累積分佈 $z_{0.025} = 1.95996$ 與 $z_{0.005} = 2.57583$
  4. Wilson 區間 $x=0$ 邊界非簡併性檢驗
  5. Wilson 區間 $x=10, n=100$ 標準測試
  6. Newcombe 區間差值涵蓋性驗證
  7. 雙樣本 Pooled Z 分數與雙尾 P 值標準基準
  8. SRM 卡方統計量與卡方分佈 P 值檢驗
  9. 雙比例事前樣本量估算公式基準檢驗
- 點擊「計算測試」按鈕即可在瀏覽器端本機即時執行，顯示毫秒耗時與誤差界限 ($\epsilon < 10^{-4} \sim 10^{-7}$)。

### 6. 🔗 可重現分享與多格式匯出 (Reproducibility & Export)
- **可重現 URL 狀態分享**：所有組別參數、轉換數據、顯著水準與檢定假設皆壓縮編碼至 URL Hash（完全無需資料庫，點擊連結即還原）。
- **Markdown 決策報告**：一鍵產生並複製排版完整的報告，可直接貼入 Slack、Notion、Jira 或 GitHub PR。
- **CSV 數據匯出**：下載包含各組訪客數、轉換率、各項信賴區間下上界與檢定統計量的 CSV 檔案。
- **JSON 存檔與還原**：支援下載實驗設定檔 `.json` 與上傳還原。

---

## 🚀 本地開發與構建 (Local Development)

### 系統需求
- Node.js 18+ (建議 Node.js 20+)
- npm 9+

### 安裝與啟動
```bash
# 複製專案
git clone <repository-url>
cd experiment-lens

# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev

# 執行型別檢查與生產打包
npm run build

# 本地預覽生產打包成品
npm run preview
```

---

## 🌐 部署至 GitHub Pages (GitHub Pages Deployment)

本專案 `vite.config.ts` 已配置 `base: './'`，支援任何子路徑與根路徑託管。

### 自動部署方法 (GitHub Actions)
專案已包含 `.github/workflows/deploy.yml`。只需執行以下步驟：
1. 將代碼推送至 GitHub 倉庫的 `main` 或 `master` 分支：
   ```bash
   git add .
   git commit -m "feat: complete Experiment Lens A/B testing tool"
   git push origin main
   ```
2. 進入 GitHub 倉庫設定：
   - 點擊 **Settings** -> **Pages**
   - 在 **Build and deployment** -> **Source** 選擇 **GitHub Actions**
3. 部署工作流將自動觸發，數分鐘後即可在 `https://<your-username>.github.io/<repo-name>/` 瀏覽上線應用！

---

## 📊 統計公式與參考文獻 (Statistical Foundations)

1. **Wilson, E. B. (1927).** "Probable inference, the law of succession, and statistical inference." *Journal of the American Statistical Association*, 22(158), 209-212.
2. **Newcombe, R. G. (1998).** "Interval estimation for the difference between independent proportions: comparison of eleven methods." *Statistics in Medicine*, 17(8), 873-890.
3. **Fabijan, A., et al. (2019).** "Diagnosing Sample Ratio Mismatch in A/B Testing: A Taxonomy, Findings, and Lessons Learned." *ACM SIGKDD*.
4. **Kohavi, R., Tang, D., & Xu, Y. (2020).** *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*. Cambridge University Press.

---

## 📄 License
MIT License.
