import React from 'react';
import type { Variant, ComparisonResult } from '../types/experiment';
import { DistributionEChart } from './charts/DistributionEChart';
import { ConfidenceIntervalEChart } from './charts/ConfidenceIntervalEChart';
import { Activity, BarChart2, Info } from 'lucide-react';

interface VisualDistributionsProps {
  variants: Variant[];
  comparisons: ComparisonResult[];
}

export const VisualDistributions: React.FC<VisualDistributionsProps> = ({
  variants,
  comparisons,
}) => {
  const validVariants = variants.filter((v) => v.visitors > 0);

  return (
    <div className="space-y-5 min-w-0">
      {/* Chart Card 1: Sampling Distributions (Strict 5-Section Document Flow) */}
      <div
        data-testid="dist-chart-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm min-w-0"
      >
        {/* 1. Header */}
        <div
          data-testid="dist-chart-header"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 min-w-0"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">轉換率常態抽樣分佈 (ECharts Sampling Distributions)</span>
          </h2>
          <span className="text-[11px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0 self-start sm:self-auto">
            CLT Normal Approximation
          </span>
        </div>

        {/* 2. Description */}
        <div data-testid="dist-chart-description">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            依據中央極限定理（CLT），視覺化各組轉換率的常態近似抽樣密度曲線（μ = p̂, σ = √[p̂(1-p̂)/N]）。兩組分佈重疊面積越少，代表真實存在組間差異之機率越高。
          </p>
        </div>

        {/* 3. Statistics */}
        <div
          data-testid="dist-chart-statistics"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 min-w-0"
        >
          {validVariants.map((v) => {
            const p = v.visitors > 0 ? v.conversions / v.visitors : 0;
            const se = v.visitors > 0 ? Math.sqrt((p * (1 - p)) / v.visitors) * 100 : 0;
            return (
              <div
                key={v.id}
                className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 min-w-0"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-1">
                  <span className="truncate font-medium">{v.name}</span>
                  {v.isControl && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold shrink-0">
                      對照組
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                  {(p * 100).toFixed(2)}%
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1">
                    SE ±{se.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Chart Area */}
        <div data-testid="dist-chart-plot" className="min-w-0 pt-1">
          <DistributionEChart variants={variants} />
        </div>

        {/* 5. Legend / Footer */}
        <div
          data-testid="dist-chart-footer"
          className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2 min-w-0"
        >
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            常態近似條件檢驗：每組轉換數 N·p ≥ 5 且未轉換數 N·(1-p) ≥ 5。右上角工具箱支援匯出 2x 高解析度 PNG 圖片。
          </span>
        </div>
      </div>

      {/* Chart Card 2: Forest Plot (Strict 5-Section Document Flow) */}
      <div
        data-testid="ci-chart-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm min-w-0"
      >
        {/* 1. Header */}
        <div
          data-testid="ci-chart-header"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 min-w-0"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
            <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">絕對提升 95% Newcombe 信賴區間範圍 (Forest Plot)</span>
          </h2>
          <span className="text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-auto">
            vs. 0 基準線
          </span>
        </div>

        {/* 2. Description */}
        <div data-testid="ci-chart-description">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            呈顯各實驗組相對於對照基準組之絕對提升率（Δp = pB - pA）的 95% Newcombe 混合評分信賴區間。當整條區間未跨越垂直 0 基準線時，代表達到統計顯著。
          </p>
        </div>

        {/* 3. Statistics */}
        <div
          data-testid="ci-chart-statistics"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 min-w-0"
        >
          {comparisons.map((c) => (
            <div
              key={c.variantId}
              className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 min-w-0"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate font-medium">{c.variantName}</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    c.isSignificant
                      ? c.absoluteLift > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {c.isSignificant ? (c.absoluteLift > 0 ? 'WIN' : 'LOSS') : 'NEUTRAL'}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                {c.absoluteLift > 0 ? '+' : ''}
                {(c.absoluteLift * 100).toFixed(2)} pp
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1">
                  CI: [{(c.absoluteLiftNewcombeCI.lower * 100).toFixed(2)}%,{' '}
                  {(c.absoluteLiftNewcombeCI.upper * 100).toFixed(2)}%]
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Chart Area */}
        <div data-testid="ci-chart-plot" className="min-w-0 pt-1">
          <ConfidenceIntervalEChart comparisons={comparisons} />
        </div>

        {/* 5. Legend / Footer */}
        <div
          data-testid="ci-chart-footer"
          className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 min-w-0"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>綠色：統計顯著提升（未跨越 0）</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
              <span>紅色：統計顯著下降（未跨越 0）</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shrink-0" />
              <span>灰色：未達統計顯著（信賴區間包含 0）</span>
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            方法: Newcombe Hybrid Score CI
          </div>
        </div>
      </div>
    </div>
  );
};
