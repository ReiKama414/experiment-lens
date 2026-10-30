import React from 'react';
import type {
  Variant,
  ComparisonResult,
  ExperimentSettings,
  SRMResult,
  HypothesisDirection,
} from '../types/experiment';
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Percent,
  Scale,
} from 'lucide-react';

interface ResultsOverviewProps {
  variants: Variant[];
  comparisons: ComparisonResult[];
  srm: SRMResult;
  settings: ExperimentSettings;
  onUpdateSettings: (settings: Partial<ExperimentSettings>) => void;
}

export const ResultsOverview: React.FC<ResultsOverviewProps> = ({
  variants,
  comparisons,
  srm,
  settings,
  onUpdateSettings,
}) => {
  const control = variants.find((v) => v.isControl) || variants[0];

  return (
    <div className="space-y-4 min-w-0">
      {/* Settings Ribbon Bar (Workbench Header Style) */}
      <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs transition-colors min-w-0">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {/* Confidence Level Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">信心水準:</span>
            <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
              {[
                { label: '90%', val: 0.9 },
                { label: '95%', val: 0.95 },
                { label: '99%', val: 0.99 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onUpdateSettings({ confidenceLevel: opt.val })}
                  className={`px-2 py-0.5 text-xs font-mono font-medium rounded-md transition ${
                    settings.confidenceLevel === opt.val
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hypothesis Direction */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">檢定假設:</span>
            <select
              value={settings.hypothesisDirection}
              onChange={(e) =>
                onUpdateSettings({ hypothesisDirection: e.target.value as HypothesisDirection })
              }
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 max-w-[180px] sm:max-w-none truncate"
            >
              <option value="two-sided">雙尾檢定 (Two-Sided: pB ≠ pA)</option>
              <option value="greater">單尾檢定 (One-Sided: pB &gt; pA 優於對照)</option>
              <option value="less">單尾檢定 (One-Sided: pB &lt; pA 劣於對照)</option>
            </select>
          </div>

          {/* Continuity Correction Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 select-none shrink-0">
            <input
              type="checkbox"
              checked={settings.useContinuityCorrection}
              onChange={(e) => onUpdateSettings({ useContinuityCorrection: e.target.checked })}
              className="w-3.5 h-3.5 rounded text-zinc-900 dark:text-zinc-100 bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700"
            />
            <span>連續性校正 (Yates)</span>
          </label>

          {/* Multi-arm Correction Toggle (if > 1 treatment) */}
          {comparisons.length > 1 && (
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 select-none shrink-0">
              <input
                type="checkbox"
                checked={settings.enableMultipleTestingCorrection}
                onChange={(e) =>
                  onUpdateSettings({ enableMultipleTestingCorrection: e.target.checked })
                }
                className="w-3.5 h-3.5 rounded text-zinc-900 dark:text-zinc-100 bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700"
              />
              <span>多重比較校正 (BH-FDR)</span>
            </label>
          )}
        </div>

        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0 font-mono">
          基準對照組: <span className="font-bold text-amber-600 dark:text-amber-400">{control.name}</span>
        </div>
      </div>

      {/* SRM Critical Alert Banner (if SRM detected) */}
      {srm.hasMismatch && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 min-w-0 ${
            srm.warningLevel === 'severe'
              ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/80 dark:border-rose-700 dark:text-rose-200'
              : 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/80 dark:border-amber-700 dark:text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              srm.warningLevel === 'severe'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          />
          <div className="space-y-1 text-xs min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">
                {srm.warningLevel === 'severe'
                  ? '重大技術警告：檢測到樣本比例失衡 (Sample Ratio Mismatch, SRM)'
                  : '注意：檢測到中度樣本比例偏差 (SRM Warning)'}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-black/50 border border-black/10 dark:border-white/10 shrink-0">
                χ² = {srm.chiSquare.toFixed(2)}, p ={' '}
                {srm.pValue < 0.0001 ? '< 0.0001' : srm.pValue.toFixed(4)}
              </span>
            </div>
            <p className="opacity-90 leading-relaxed break-words">
              實際分流訪客數與設定之預期比例有極顯著差異。可能肇因於：轉址快取延遲、實驗組跳轉丟失、特定瀏覽器追蹤碼遺失或爬蟲灌水。
              <strong>在排查分流技術問題前，本實驗的所有統計檢定結論不可直接採信！</strong>
            </p>
          </div>
        </div>
      )}

      {/* Comparisons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        {comparisons.map((comp) => {
          const isWin = comp.isSignificant && comp.absoluteLift > 0;
          const isLoss = comp.isSignificant && comp.absoluteLift < 0;

          const pValToDisplay =
            settings.enableMultipleTestingCorrection && comp.adjustedPValue !== undefined
              ? comp.adjustedPValue
              : comp.pValue;

          const pFormatted = pValToDisplay < 0.0001 ? '< 0.0001' : pValToDisplay.toFixed(4);

          return (
            <div
              key={comp.variantId}
              className={`rounded-xl border p-3.5 sm:p-4.5 transition-all relative min-w-0 ${
                isWin
                  ? 'bg-white border-emerald-300 dark:bg-zinc-900 dark:border-emerald-500/50 shadow-xs'
                  : isLoss
                  ? 'bg-white border-rose-300 dark:bg-zinc-900 dark:border-rose-500/50 shadow-xs'
                  : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs'
              }`}
            >
              {/* Header of Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5 gap-2 min-w-0">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {comp.variantName}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono shrink-0">vs {control.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    雙樣本比例 Z 檢定 · 信心水準 {(settings.confidenceLevel * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="shrink-0 self-start sm:self-auto">
                  {srm.hasMismatch ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>SRM 異常無效</span>
                    </span>
                  ) : isWin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>顯著勝出 (Win)</span>
                    </span>
                  ) : isLoss ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>顯著劣於對照</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                      <Scale className="w-3.5 h-3.5" />
                      <span>未達顯著</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Lift Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3 min-w-0">
                {/* Relative Lift */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80 min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                    <span className="truncate">相對提升 (Rel Lift)</span>
                    <Percent className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  </span>
                  <div className="mt-1 min-w-0">
                    <span
                      className={`text-lg sm:text-xl font-bold font-mono truncate block ${
                        comp.relativeLift > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : comp.relativeLift < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {comp.relativeLift > 0 ? '+' : ''}
                      {(comp.relativeLift * 100).toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono block mt-0.5 truncate">
                    CI: [{(comp.relativeLiftCI.lower * 100).toFixed(1)}%,{' '}
                    {(comp.relativeLiftCI.upper * 100).toFixed(1)}%]
                  </span>
                </div>

                {/* Absolute Lift */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80 min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                    <span className="truncate">絕對提升 (Abs Lift)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  </span>
                  <div className="mt-1 flex items-baseline gap-1 min-w-0">
                    <span
                      className={`text-lg sm:text-xl font-bold font-mono truncate ${
                        comp.absoluteLift > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : comp.absoluteLift < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {comp.absoluteLift > 0 ? '+' : ''}
                      {(comp.absoluteLift * 100).toFixed(2)}%
                    </span>
                    <span className="text-xs text-zinc-400 font-mono shrink-0">pp</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono block mt-0.5 truncate">
                    Newcombe: [{(comp.absoluteLiftNewcombeCI.lower * 100).toFixed(2)}%,{' '}
                    {(comp.absoluteLiftNewcombeCI.upper * 100).toFixed(2)}%]
                  </span>
                </div>
              </div>

              {/* Statistical Parameters Footer */}
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-2.5 border border-zinc-200 dark:border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs min-w-0">
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase truncate">P 值</span>
                  <span
                    className={`font-mono font-bold truncate block ${
                      comp.isSignificant
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {pFormatted}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase truncate">Z 分數</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200 truncate block">
                    {comp.zScore.toFixed(3)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase truncate">P(B &gt; A)</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                    {(comp.probBBeatsA * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Multiple Testing Note */}
              {settings.enableMultipleTestingCorrection && comp.adjustedPValue !== undefined && (
                <div className="mt-2 text-[11px] text-zinc-700 bg-zinc-100 border border-zinc-200 dark:text-zinc-300 dark:bg-zinc-800/80 dark:border-zinc-700 px-2 py-1 rounded-md font-mono">
                  已套用 FDR 校正：原始 p = {comp.pValue.toFixed(4)} → 校正後 p ={' '}
                  {comp.adjustedPValue.toFixed(4)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
