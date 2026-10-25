import React, { useState } from 'react';
import type {
  Variant,
  ComparisonResult,
  SRMResult,
  ExperimentSettings,
} from '../types/experiment';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface StatisticalDeepDiveProps {
  variants: Variant[];
  comparisons: ComparisonResult[];
  srm: SRMResult;
  settings: ExperimentSettings;
}

export const StatisticalDeepDive: React.FC<StatisticalDeepDiveProps> = ({
  variants,
  comparisons,
  srm,
  settings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const control = variants.find((v) => v.isControl) || variants[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              <span>統計檢定底層運算與檢驗細節</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                Deep Dive ({(settings.confidenceLevel * 100).toFixed(0)}% CI)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              檢視標準誤 (SE)、Wald vs Newcombe 區間比較、SRM 卡方診斷與貝氏後驗損失
            </p>
          </div>
        </div>

        <div className="text-slate-400 shrink-0 ml-2">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Section 1: Detailed Comparison Breakdown */}
          {comparisons.map((comp) => {
            const v = variants.find((item) => item.id === comp.variantId);
            if (!v) return null;

            return (
              <div
                key={comp.variantId}
                className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {comp.variantName} 檢定統計量明細
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    基準: {control.name}
                  </span>
                </div>

                {/* Math Values Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      合併標準誤 (Pooled SE)
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {comp.pooledSE.toFixed(6)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      獨立標準誤 (Unpooled SE)
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {comp.unpooledSE.toFixed(6)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      標準 Z 分數 (Z-score)
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {comp.zScore.toFixed(4)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      雙尾 P 值 (Two-sided p)
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {comp.pValueTwoSided < 0.0001
                        ? '< 0.0001'
                        : comp.pValueTwoSided.toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Wald vs Newcombe CI comparison */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>信賴區間方法比較 (Confidence Interval Comparison)</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[500px]">
                      <thead>
                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-1.5 px-2">方法</th>
                          <th className="py-1.5 px-2">95% 信賴區間</th>
                          <th className="py-1.5 px-2">方法特性說明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 font-mono">
                        <tr>
                          <td className="py-2 px-2 text-slate-800 dark:text-slate-300 font-sans font-medium">
                            Newcombe Hybrid Score
                            <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
                              (本工具預設)
                            </span>
                          </td>
                          <td className="py-2 px-2 text-emerald-600 dark:text-emerald-300 font-bold">
                            [{(comp.absoluteLiftNewcombeCI.lower * 100).toFixed(3)}%,{' '}
                            {(comp.absoluteLiftNewcombeCI.upper * 100).toFixed(3)}%]
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                            結合雙邊獨立 Wilson Score 區間，樣本極小或轉換率極端時皆能嚴格保持 95% 涵蓋率，不發生簡併。
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-800 dark:text-slate-300 font-sans font-medium">
                            Wald (常態漸近區間)
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400">
                            [{(comp.absoluteLiftWaldCI.lower * 100).toFixed(3)}%,{' '}
                            {(comp.absoluteLiftWaldCI.upper * 100).toFixed(3)}%]
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                            傳統教科書公式 Δp ± z·SE。當 x 為 0 或轉換率 &lt; 1% 時，常有覆蓋率不足或超出邊界的缺陷。
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-slate-800 dark:text-slate-300 font-sans font-medium">
                            Delta Method (相對提升)
                          </td>
                          <td className="py-2 px-2 text-blue-600 dark:text-blue-300 font-bold">
                            [{(comp.relativeLiftCI.lower * 100).toFixed(2)}%,{' '}
                            {(comp.relativeLiftCI.upper * 100).toFixed(2)}%]
                          </td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                            針對對數相對風險 ln(pB / pA) 進行泰勒一階展開，避免比例除法之偏態變異。
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bayesian Details */}
                <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">貝氏決策風險 (Expected Loss):</span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2">
                      若上線 {comp.variantName}，期望潛在損失為{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {(comp.expectedLossB * 100).toFixed(4)}%
                      </strong>
                      ；若維持對照組，期望錯失收益為{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {(comp.expectedLossA * 100).toFixed(4)}%
                      </strong>
                      。
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Section 2: SRM Chi-Square Goodness-of-Fit Diagnostic */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                樣本比例檢定診斷 (SRM Pearson Chi-Square Test)
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                自由度 (df) = {srm.degreesOfFreedom}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              根據皮爾森卡方適合度檢定 (Pearson's χ² Test of Goodness-of-Fit)，檢驗觀測訪客數與期望分流權重是否吻合：
              <code className="text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 ml-1">χ² = Σ (O_i - E_i)² / E_i</code>。
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-1.5 px-2">組別</th>
                    <th className="py-1.5 px-2 text-right">觀測訪客 (O)</th>
                    <th className="py-1.5 px-2 text-right">預期訪客 (E)</th>
                    <th className="py-1.5 px-2 text-right">差值 (O - E)</th>
                    <th className="py-1.5 px-2 text-right">卡方貢獻項 (O-E)²/E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 font-mono">
                  {variants.map((v) => {
                    const expected = srm.expectedVisitors[v.id] || 0;
                    const diff = v.visitors - expected;
                    const term = expected > 0 ? (diff * diff) / expected : 0;

                    return (
                      <tr key={v.id}>
                        <td className="py-2 px-2 text-slate-800 dark:text-slate-300 font-sans">{v.name}</td>
                        <td className="py-2 px-2 text-right text-slate-900 dark:text-white font-bold">
                          {v.visitors.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-500 dark:text-slate-400">
                          {Math.round(expected).toLocaleString()}
                        </td>
                        <td
                          className={`py-2 px-2 text-right ${
                            diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {Math.round(diff).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">
                          {term.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-200">
                    <td className="py-2 px-2 font-sans">卡方統計量合計 (χ²)</td>
                    <td colSpan={3} />
                    <td className="py-2 px-2 text-right text-blue-600 dark:text-blue-400">
                      {srm.chiSquare.toFixed(4)} (p ={' '}
                      {srm.pValue < 0.0001 ? '< 0.0001' : srm.pValue.toFixed(6)})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
