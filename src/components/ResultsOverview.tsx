import React, { useEffect } from 'react';
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
import confetti from 'canvas-confetti';

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
  const hasSignificantWinner =
    !srm.hasMismatch && comparisons.some((c) => c.isSignificant && c.absoluteLift > 0);

  // Trigger subtle confetti on fresh conclusive win
  useEffect(() => {
    if (hasSignificantWinner) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#818cf8', '#34d399'],
        });
      } catch (e) {
        // ignore if confetti unavailable
      }
    }
  }, [hasSignificantWinner]);

  return (
    <div className="space-y-5">
      {/* Settings Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Confidence Level Selector */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              統計信心水準 (1 - α)
            </span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {[
                { label: '90% (α=0.10)', val: 0.9 },
                { label: '95% (α=0.05)', val: 0.95 },
                { label: '99% (α=0.01)', val: 0.99 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onUpdateSettings({ confidenceLevel: opt.val })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                    settings.confidenceLevel === opt.val
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hypothesis Direction */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              對立假設檢定方向
            </span>
            <select
              value={settings.hypothesisDirection}
              onChange={(e) =>
                onUpdateSettings({ hypothesisDirection: e.target.value as HypothesisDirection })
              }
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="two-sided">雙尾檢定 (Two-Sided: pB ≠ pA)</option>
              <option value="greater">單尾檢定 (One-Sided: pB &gt; pA 優於對照)</option>
              <option value="less">單尾檢定 (One-Sided: pB &lt; pA 劣於對照)</option>
            </select>
          </div>

          {/* Continuity Correction Checkbox */}
          <div className="flex items-center space-x-2 pt-4">
            <input
              type="checkbox"
              id="continuityCC"
              checked={settings.useContinuityCorrection}
              onChange={(e) => onUpdateSettings({ useContinuityCorrection: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="continuityCC" className="text-xs text-slate-300 cursor-pointer select-none">
              連續性校正 (Yates' CC)
            </label>
          </div>

          {/* Multi-arm Correction Toggle (if > 1 treatment) */}
          {comparisons.length > 1 && (
            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="multiArmFDR"
                checked={settings.enableMultipleTestingCorrection}
                onChange={(e) =>
                  onUpdateSettings({ enableMultipleTestingCorrection: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="multiArmFDR" className="text-xs text-slate-300 cursor-pointer select-none">
                多重比較校正 (Benjamini-Hochberg FDR)
              </label>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 hidden lg:block">
          基準組: <span className="font-semibold text-amber-300">{control.name}</span>
        </div>
      </div>

      {/* SRM Critical Alert Banner (if SRM detected) */}
      {srm.hasMismatch && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-lg ${
            srm.warningLevel === 'severe'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-6 h-6 shrink-0 mt-0.5 ${
              srm.warningLevel === 'severe' ? 'text-rose-400' : 'text-amber-400'
            }`}
          />
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span>
                {srm.warningLevel === 'severe'
                  ? '重大技術警告：檢測到樣本比例失衡 (Sample Ratio Mismatch, SRM)'
                  : '注意：檢測到中度樣本比例偏差 (SRM Warning)'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/40">
                χ² = {srm.chiSquare.toFixed(2)}, p ={' '}
                {srm.pValue < 0.0001 ? '< 0.0001' : srm.pValue.toFixed(4)}
              </span>
            </h3>
            <p className="text-xs opacity-90 leading-relaxed">
              實際分流訪客數與設定的預期權重存在極顯著統計差異。常見於：分流伺服器快取延遲、實驗組跳轉白屏導致流失、特定瀏覽器追蹤程式碼丟失、或機器人灌水。
              <strong>在排查分流技術問題前，本實驗的所有轉換率檢定結果不可直接採信！</strong>
            </p>
          </div>
        </div>
      )}

      {/* Comparisons Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparisons.map((comp) => {
          const isWin = comp.isSignificant && comp.absoluteLift > 0;
          const isLoss = comp.isSignificant && comp.absoluteLift < 0;

          const pValToDisplay = settings.enableMultipleTestingCorrection && comp.adjustedPValue !== undefined
            ? comp.adjustedPValue
            : comp.pValue;

          const pFormatted = pValToDisplay < 0.0001 ? '< 0.0001' : pValToDisplay.toFixed(4);

          return (
            <div
              key={comp.variantId}
              className={`rounded-2xl border p-5 shadow-xl transition-all relative overflow-hidden ${
                isWin
                  ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-500/5'
                  : isLoss
                  ? 'bg-slate-900 border-rose-500/40 shadow-rose-500/5'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Header of Card */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white">{comp.variantName}</span>
                    <span className="text-xs text-slate-400 font-mono">vs {control.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    雙樣本比例 Z 檢定 · 信心水準 {(settings.confidenceLevel * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Verdict Badge */}
                {srm.hasMismatch ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>SRM 異常無效</span>
                  </span>
                ) : isWin ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>顯著勝出 (Win)</span>
                  </span>
                ) : isLoss ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>顯著劣於對照 (Loss)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    <Scale className="w-3.5 h-3.5" />
                    <span>未達顯著 (Inconclusive)</span>
                  </span>
                )}
              </div>

              {/* Lift Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Relative Lift */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>相對提升 (Relative Lift)</span>
                    <Percent className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  <div className="mt-1 flex items-baseline space-x-1.5">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        comp.relativeLift > 0
                          ? 'text-emerald-400'
                          : comp.relativeLift < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {comp.relativeLift > 0 ? '+' : ''}
                      {(comp.relativeLift * 100).toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    {(settings.confidenceLevel * 100).toFixed(0)}% CI: [
                    {(comp.relativeLiftCI.lower * 100).toFixed(1)}%,{' '}
                    {(comp.relativeLiftCI.upper * 100).toFixed(1)}%]
                  </span>
                </div>

                {/* Absolute Lift */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>絕對提升 (Absolute Lift)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                  <div className="mt-1 flex items-baseline space-x-1.5">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        comp.absoluteLift > 0
                          ? 'text-emerald-400'
                          : comp.absoluteLift < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {comp.absoluteLift > 0 ? '+' : ''}
                      {(comp.absoluteLift * 100).toFixed(2)}%
                    </span>
                    <span className="text-xs text-slate-400">pp</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    Newcombe: [{(comp.absoluteLiftNewcombeCI.lower * 100).toFixed(2)}%,{' '}
                    {(comp.absoluteLiftNewcombeCI.upper * 100).toFixed(2)}%]
                  </span>
                </div>
              </div>

              {/* Statistical Parameters Footer */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">P 值 (p-value)</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      comp.isSignificant ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {pFormatted}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Z 分數 (Z-Score)</span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {comp.zScore.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">貝氏勝率 P(B &gt; A)</span>
                  <span className="font-mono font-bold text-sm text-indigo-300">
                    {(comp.probBBeatsA * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Multiple Testing Note */}
              {settings.enableMultipleTestingCorrection && comp.adjustedPValue !== undefined && (
                <div className="mt-2 text-[11px] text-indigo-300/90 bg-indigo-500/10 px-2 py-1 rounded">
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
