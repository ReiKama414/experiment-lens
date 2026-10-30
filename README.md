# Experiment Lens

[繁體中文](README.zh-TW.md) · **English**

> **Pure Frontend A/B Testing & Statistical Decision Studio**, 100% in-browser sandbox computation with zero server data transfer.

<p align="center">
  <img src="assets/screenshots/workbench-light.png" alt="Experiment Lens Studio Preview" width="880" />
</p>

<p align="center">
  <a href="https://github.com/ReiKama414/experiment-lens">GitHub</a> ·
  <a href="https://reikama414.vercel.app/">Portfolio</a> ·
  <a href="#key-highlights">Highlights</a> ·
  <a href="#mathematical-precision-guarantees">Math Guarantees</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#testing--validation">Validation</a> ·
  <a href="#license">License</a>
</p>

---

## Key Highlights

- **Pure In-Browser Computation** — All hypothesis testing, confidence intervals, SRM diagnostics, and power curves execute locally in the client browser with zero server dependencies or data privacy risks.
- **Rigorous Two-Sample Z-Test** — Two-sample pooled standard error proportion test with full support for two-sided testing, one-sided superiority testing, and Yates' continuity correction.
- **Robust Interval Estimation** — Wilson Score intervals for group rates, Newcombe Hybrid Score intervals for absolute differences, and Delta Method log transformations for relative lift, avoiding traditional Wald degeneration.
- **Multi-Comparison Defense** — Built-in Benjamini-Hochberg (FDR) and Bonferroni corrections to prevent cumulative Type I error inflation in multi-arm A/B/n tests.
- **Real-Time SRM Diagnostics** — Pearson Chi-Square goodness-of-fit test detects sample ratio mismatches immediately, preventing polluted telemetry from misleading product decisions.
- **Zero-Overlap 5-Tier Document Flow** — Chart cards strictly respect a 5-layer hierarchy: Header → Description → Statistics → Chart → Footer, with no absolute-positioned text overlapping visual elements.
- **Interactive ECharts Visualizations** — Central Limit Theorem normal distribution curves, confidence interval forest plots, and statistical power curves with 2x PNG rendering.
- **Business ROI & Guardrails** — Integrated profit impact calculator and assumption audit checklists to protect against novelty effects, day-of-week seasonality, and randomization unit mismatch.
- **Responsive Design & Dual Theme** — Support for System, Light, and Dark modes across 9 distinct viewports (320px to 1920px), engineered with a strict Zero-Overlap layout.
- **IndexedDB Offline Persistence** — Browser-native storage engine automatically persists experiments and enables stateless URL hash sharing.

---

## Built-in Preset Scenarios

The studio comes preloaded with standard real-world experiment templates, while also supporting custom variant additions and CSV/JSON file ingestion:

| Scenario Name | Structure | Key Metric | Focus Area |
| :--- | :--- | :--- | :--- |
| E-Commerce Checkout Flow (4 Arms) | Control (A) + 3 Test Variants | Checkout Rate (4.8% ~ 5.6%) | Multi-comparison FDR correction, Forest plot, Net Profit ROI |
| SaaS Landing Page MDE Exploration | Control (A) vs Variant (B) | Signup Conversion (12.0% vs 13.5%) | Two-sample Z-test significance, Power curves, MDE planning |
| SRM Traffic Mismatch Anomaly | Control (A) vs Variant (B) | Click-Through Rate (CTR) | Pearson Chi-square SRM alert ($p < 0.001$), Engineering telemetry defense |

---

## Mathematical Precision Guarantees

Every analytical algorithm is verified via independent unit tests (100% pass rate) to guarantee mathematical consistency with standard statistical theory:

- **Two-Sample Pooled Z-Test**:
  $$Z = \frac{p_B - p_A}{\sqrt{p_c(1 - p_c)\left(\frac{1}{n_A} + \frac{1}{n_B}\right)}}, \quad p_c = \frac{x_A + x_B}{n_A + n_B}$$
- **Wilson Score Confidence Interval**:
  $$CI = \frac{p + \frac{z^2}{2n} \pm z\sqrt{\frac{p(1 - p)}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$
- **Newcombe Hybrid Score Difference Interval**:
  $$\left[(p_B - p_A) - \sqrt{(p_B - l_B)^2 + (u_A - p_A)^2}, \quad (p_B - p_A) + \sqrt{(u_B - p_B)^2 + (p_A - l_A)^2}\right]$$
- **Relative Lift Log-Transformation (Delta Method)**:
  $$\ln(RR) \pm z \cdot \sqrt{\frac{1 - p_A}{n_A p_A} + \frac{1 - p_B}{n_B p_B}}, \quad \text{Lift} = \exp(\ln(RR)) - 1$$
- **Sample Ratio Mismatch (SRM) Chi-Square Test**:
  $$\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}, \quad df = k - 1$$
- **Evan Miller Sample Size Determination**:
  $$n = \frac{\left(z_{\alpha/2}\sqrt{2\bar{p}(1 - \bar{p})} + z_{\beta}\sqrt{p_1(1 - p_1) + p_2(1 - p_2)}\right)^2}{(p_2 - p_1)^2}$$
- **Benjamini-Hochberg False Discovery Rate Correction**:
  $$P_{(i)} \le \frac{i}{m} \cdot Q$$

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend Framework | React 19 · TypeScript 5 | Component modularity and strict type-safety guarantees |
| Build Tool | Vite 6 | Ultra-fast local development server and optimized Rollup production bundling |
| Styling & Theme | Tailwind CSS | High-density workbench aesthetic with unified dark/light design tokens |
| Data Visualization | Apache ECharts · echarts-for-react | Responsive charts, containLabel layout isolation, and 2x PNG rendering |
| Local Persistence | Native IndexedDB (`idb`) | Browser sandbox structured persistence with zero server dependencies |
| UI Iconography | Lucide Icons | Minimal, pixel-crisp geometric vector icons |
| Automated Testing | Vitest · Playwright | 16 mathematical unit tests and 30 full-resolution E2E visual tests |

---

## Getting Started

### Prerequisites

Node.js 20+ and npm.

### Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Open the printed local URL (default: `http://localhost:5173`) in your browser.

### Production Build & Preview

```bash
# Execute TypeScript checking and production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Operating Workflow

1. **Select or Create Experiment**: Switch between standard preset scenarios in the top navigation or click "New Experiment" to clear the workbench.
2. **Input Sample & Conversion Data**: Enter group names, sample size ($N$), and conversions ($x$) in the input table. Click "Add Variant" to expand to multi-arm A/B/n testing.
3. **Inspect SRM Telemetry**: Check the Pearson Chi-square result in the overview ribbon. If $p < 0.001$, traffic distribution is contaminated by tracking or caching issues.
4. **Explore Statistical Deep Dive**:
   - Adjust hypothesis direction (two-sided, greater, less) and confidence levels (90%, 95%, 99%).
   - Toggle Yates' continuity correction or Benjamini-Hochberg FDR correction.
   - Inspect Wilson Score intervals, Newcombe difference intervals, and Bayesian posterior win probability.
5. **Sample Size & Power Planning**: Switch to the "Sample Size & Power" tab, adjust baseline conversion rate, MDE, and daily traffic to inspect required duration and power decay curves.
6. **Business Guardrails**: Switch to the "Business Value & Assumptions" tab, enter traffic, AOV, gross margin, and engineering costs to verify whether statistical significance delivers real commercial profit.
7. **Export & Reproducible Share**: Click "Export / Share" to download sanitized CSV tables, copy Markdown decision briefs, backup JSON records, or generate compressed URL hash links.

---

## Testing & Validation

The project undergoes dual-layer automated validation (46 tests in total: 16 unit tests + 30 Playwright E2E tests):

```bash
# Run mathematical unit tests
npm test

# Run full Playwright browser tests
npm run test:e2e
```

Validation Checklist:

- **Statistical Precision**: Normal distribution CDF/InvCDF, Wilson boundary convergence, Newcombe difference coverage, and Delta Method standard error verified at 100% precision.
- **Input & File Defenses**: Empty files, missing columns, non-integer inputs, conversions exceeding sample size ($x > N$), and delimiter tolerance tests.
- **Full 9-Viewport RWD**: Verified across 320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, and 1920px with zero horizontal scroll.
- **Dual Theme Engine**: Seamless switching and persistence across System, Light, and Dark modes.
- **Zero-Overlap Layout**: Strict bounding box non-intersection verification across card headers, descriptions, statistics, charts, and legends, with 200% zoom scaling.

---

## Known Limitations

> **Note:**
> 1. Designed specifically for binary Bernoulli outcomes (conversion rate, click-through rate, retention). For continuous metrics (AOV, session duration, revenue per user), use two-sample t-tests or bootstrap methods.
> 2. The sample size denominator must represent independent experimental units (User ID or Cookie ID), never total sessions or clicks.
> 3. Standard testing assumes SUTVA. In products with social interaction or two-sided marketplaces, cluster randomization or switchback testing should be applied.
> 4. Data is stored in the client browser IndexedDB sandbox. In private/incognito mode or upon clearing browser data, stored records will be erased. Use the "Export" modal to save JSON backups.

---

## License

Copyright (c) ReiKama414. All rights reserved.

This project is provided solely for personal viewing and learning purposes. No permission is granted to use, copy, modify, distribute, or incorporate this software into other projects (including non-commercial use) without express written consent.

- [GitHub](https://github.com/ReiKama414/experiment-lens)
- [Portfolio](https://reikama414.vercel.app/)
- [Full License](./LICENSE)

---

<sub>Experiment Lens · Pure Frontend A/B Testing Studio · ReiKama414</sub>
