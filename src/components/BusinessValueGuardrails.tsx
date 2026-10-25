import React, { useState } from 'react';
import {
  ShieldAlert,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { BusinessImpactInput, ComparisonResult } from '../types/experiment';
import { calculateBusinessImpact } from '../utils/stats';

interface BusinessValueGuardrailsProps {
  primaryComparison?: ComparisonResult;
}

export const BusinessValueGuardrails: React.FC<BusinessValueGuardrailsProps> = ({
  primaryComparison,
}) => {
  const [businessInputs, setBusinessInputs] = useState<BusinessImpactInput>({
    monthlyTraffic: 100000,
    averageOrderValue: 1200, // NTD or USD
    profitMarginPercent: 35, // 35%
    engineeringCost: 50000, // one-time implementation cost
  });

  const [expandedSection, setExpandedSection] = useState<'roi' | 'assumptions' | 'pitfalls'>('roi');

  const absoluteLift = primaryComparison ? primaryComparison.absoluteLift : 0.007; // 0.7% default

  const impact = calculateBusinessImpact(absoluteLift, businessInputs);

  const updateInput = (field: keyof BusinessImpactInput, val: number) => {
    setBusinessInputs((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <span>統計假設 · 商業價值與實質顯著性評估</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          <strong>統計顯著 (p &lt; 0.05) ≠ 具有商業價值</strong>。大樣本下極微小、無利可圖的改動也會顯著；且若違反隨機獨立性或偷窺早停，檢定結論將嚴重失真。
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 text-xs font-semibold overflow-x-auto max-w-full pb-1">
        <button
          onClick={() => setExpandedSection('roi')}
          className={`pb-2 transition flex items-center space-x-1.5 border-b-2 shrink-0 whitespace-nowrap ${
            expandedSection === 'roi'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>商業投資回報率 (ROI 試算)</span>
        </button>

        <button
          onClick={() => setExpandedSection('assumptions')}
          className={`pb-2 transition flex items-center space-x-1.5 border-b-2 shrink-0 whitespace-nowrap ${
            expandedSection === 'assumptions'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>底層統計假設檢驗</span>
        </button>

        <button
          onClick={() => setExpandedSection('pitfalls')}
          className={`pb-2 transition flex items-center space-x-1.5 border-b-2 shrink-0 whitespace-nowrap ${
            expandedSection === 'pitfalls'
              ? 'border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>常見決策偏誤與防禦</span>
        </button>
      </div>

      {/* Content Section 1: ROI & Practical Significance Calculator */}
      {expandedSection === 'roi' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            💡 <strong>超大樣本陷阱 (Massive Sample Trap)</strong>：當樣本數達數十萬甚至數百萬時，標準誤極小，即便只有
            0.02% 的提升也會跑出 p = 0.001。但若額外毛利連伺服器或工程維護成本都無法打平，上線反而損害公司利潤！請試算下方的實質經濟效益：
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium">全站每月總訪客人數</label>
              <input
                type="number"
                min={1000}
                step={10000}
                value={businessInputs.monthlyTraffic}
                onChange={(e) =>
                  updateInput('monthlyTraffic', Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium">平均客單價 (AOV, \$)</label>
              <input
                type="number"
                min={1}
                step={50}
                value={businessInputs.averageOrderValue}
                onChange={(e) =>
                  updateInput('averageOrderValue', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium">商品毛利率 (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                step={5}
                value={businessInputs.profitMarginPercent}
                onChange={(e) =>
                  updateInput('profitMarginPercent', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium">工程與維護成本 (\$)</label>
              <input
                type="number"
                min={0}
                step={5000}
                value={businessInputs.engineeringCost}
                onChange={(e) =>
                  updateInput('engineeringCost', Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">預估每月額外訂單轉換</span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {impact.monthlyAdditionalConversions > 0 ? '+' : ''}
                {impact.monthlyAdditionalConversions.toLocaleString()} 件
              </div>
              <span className="text-[10px] text-slate-500 block">
                基於觀測絕對提升 {(absoluteLift * 100).toFixed(2)} pp
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">預估每月額外總毛利</span>
              <div
                className={`text-xl font-black font-mono ${
                  impact.monthlyAdditionalGrossProfit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {impact.monthlyAdditionalGrossProfit > 0 ? '+\$' : '\$'}
                {impact.monthlyAdditionalGrossProfit.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 block">
                額外營收 \${impact.monthlyAdditionalRevenue.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">預估投資損益兩平期</span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-300">
                {impact.breakEvenMonths === 0
                  ? '立即回本'
                  : impact.breakEvenMonths === Infinity
                  ? '無法回本'
                  : `${impact.breakEvenMonths} 個月`}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {impact.isEconomicallyViable ? '✅ 具備商業可行性' : '⚠️ 經濟效益存疑'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content Section 2: Underlying Assumptions */}
      {expandedSection === 'assumptions' && (
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold">
                1
              </span>
              <span>獨立同分佈假設 (Independent and Identically Distributed, i.i.d.)</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              每位使用者的行為必須彼此獨立。若產品具備強烈社交網絡效應（例如：協作文件、社群交友、雙邊市集買賣家），改版對實驗組的影響會溢出至對照組（Network Interference），造成檢定嚴重失真。
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold">
                2
              </span>
              <span>隨機分流單位 (Unit of Randomization) 必須為「使用者層級」</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              比例檢定之分母必須是「獨立使用者 (Users)」，不可將每次點擊或造訪工作階段 (Sessions) 當作獨立樣本。同一個使用者重複造訪會造成資料自相關（Pseudoreplication），使標準誤低估多達 50%，導致大量虛假顯著！
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold">
                3
              </span>
              <span>常態近似條件 (Normal Approximation Criterion)</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              傳統 Wald 檢定要求每組轉換數與未轉換數皆滿足 <code className="text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">N·p ≥ 5</code> 且{' '}
              <code className="text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">N·(1-p) ≥ 5</code>。若轉換數極少，Wald 區間會崩潰。本工具特別整合了 <strong>Wilson Score 區間</strong> 與 <strong>Newcombe Hybrid Score</strong>，即使在極端邊界也能維持精準覆蓋率。
            </p>
          </div>
        </div>
      )}

      {/* Content Section 3: Pitfalls & Guardrails */}
      {expandedSection === 'pitfalls' && (
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>偷窺偏誤與提早結束 (The Peeking Problem & Early Stopping)</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              許多團隊每天查看數據，一看到 p &lt; 0.05 就迫不及待慶祝並結束測試。這稱為「連續監控偏誤」，在持續偷窺下，即使兩組完全無差異，累積偽陽性率（False Positive Rate）會從原本設定的 5% 暴衝至 <strong>30% ~ 40%</strong>！請務必依樣本規劃工具跑滿預定時長。
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>新奇效應 (Novelty Effect) 與主要效應 (Primacy Effect)</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              新設計剛上線時，老用戶可能因好奇而多點擊（新奇效應），讓初期指標看似暴漲；或因習慣改變而排斥（抗拒效應）。這類效應通常在 1~2 週後收斂，因此不宜在測試前 3 天驟下結論。
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>跑滿完整商業週期 (Business Cycle Seasonality)</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              週一至週五與週末的使用者輪廓與購買意圖通常大不相同。即使流量在 3 天內就達到所需樣本數，測試仍<strong>強烈建議至少持續 1 至 2 個完整星期（7 或 14 天）</strong>，避免星期幾效應（Day-of-Week Effect）引入系統性偏誤。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
