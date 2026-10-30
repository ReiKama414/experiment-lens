import React, { useState, useMemo } from 'react';
import type { PowerCalculationInput } from '../types/experiment';
import { calculateSampleSize } from '../utils/stats';
import { PowerCurveEChart } from './charts/PowerCurveEChart';
import { Calculator, Calendar, Users, Zap } from 'lucide-react';

interface SampleSizeCalculatorProps {
  initialBaselineRate?: number;
}

export const SampleSizeCalculator: React.FC<SampleSizeCalculatorProps> = ({
  initialBaselineRate = 0.05,
}) => {
  const [params, setParams] = useState<PowerCalculationInput>({
    baselineRate: initialBaselineRate,
    mdeType: 'relative',
    mdeValue: 10,
    alpha: 0.05,
    power: 0.8,
    trafficRatio: 1.0,
    dailyTraffic: 4000,
  });

  const result = useMemo(() => {
    return calculateSampleSize(params);
  }, [params]);

  const updateParam = (field: keyof PowerCalculationInput, val: any) => {
    setParams((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 space-y-6 shadow-xs transition-colors min-w-0">
      <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>樣本量規劃與統計檢定力估算 (Sample Size & Power Planner)</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          在啟動測試前，依據預期最小偵測效應 (MDE) 與檢定力規劃所需樣本數與測試天數，防止樣本不足 (Underpowered) 導致的偽陰性結論。
        </p>
      </div>

      {/* Inputs Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Baseline Conversion Rate */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
            <span>基準轉換率 (Baseline CR)</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {(params.baselineRate * 100).toFixed(2)}%
            </span>
          </label>
          <input
            type="number"
            min={0.01}
            max={99.9}
            step={0.1}
            value={Math.round(params.baselineRate * 1000) / 10}
            onChange={(e) =>
              updateParam('baselineRate', Math.max(0.001, parseFloat(e.target.value) / 100 || 0.01))
            }
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
        </div>

        {/* MDE Input */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">最小偵測效應 (MDE)</span>
            <div className="inline-flex rounded-lg bg-zinc-200 dark:bg-zinc-800 p-0.5 border border-zinc-300 dark:border-zinc-700 text-[10px]">
              <button
                type="button"
                onClick={() => updateParam('mdeType', 'relative')}
                className={`px-2 py-0.5 rounded-md transition font-medium ${
                  params.mdeType === 'relative' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                相對 %
              </button>
              <button
                type="button"
                onClick={() => updateParam('mdeType', 'absolute')}
                className={`px-2 py-0.5 rounded-md transition font-medium ${
                  params.mdeType === 'absolute' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                絕對 pp
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min={0.01}
              step={params.mdeType === 'relative' ? 1 : 0.1}
              value={params.mdeValue}
              onChange={(e) =>
                updateParam('mdeValue', Math.max(0.0001, parseFloat(e.target.value) || 1))
              }
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 pr-8"
            />
            <span className="absolute right-2.5 top-2 text-zinc-400 font-mono">
              {params.mdeType === 'relative' ? '%' : 'pp'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-mono">
            目標轉換率: {(result.treatmentRate * 100).toFixed(2)}%
          </span>
        </div>

        {/* Statistical Power (1 - beta) */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
            <span>統計檢定力 (Power: 1 - β)</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{(params.power * 100).toFixed(0)}%</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[0.8, 0.85, 0.9].map((pow) => (
              <button
                key={pow}
                type="button"
                onClick={() => updateParam('power', pow)}
                className={`py-1 rounded-md font-mono text-xs transition ${
                  params.power === pow
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {(pow * 100).toFixed(0)}%
              </button>
            ))}
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
            業界常規門檻為 80% (容忍 20% 偽陰性)
          </span>
        </div>

        {/* Significance Level (alpha) */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
            <span>顯著水準 (α, 偽陽性上限)</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{params.alpha}</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[0.01, 0.05, 0.1].map((alp) => (
              <button
                key={alp}
                type="button"
                onClick={() => updateParam('alpha', alp)}
                className={`py-1 rounded-md font-mono text-xs transition ${
                  params.alpha === alp
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {(alp * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>

        {/* Daily Traffic */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5 sm:col-span-2">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
            <span>預估每日進站總流量 (Total Daily Traffic)</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-mono">
              {params.dailyTraffic.toLocaleString()} 人/日
            </span>
          </label>
          <input
            type="number"
            min={100}
            step={500}
            value={params.dailyTraffic}
            onChange={(e) =>
              updateParam('dailyTraffic', Math.max(10, parseInt(e.target.value) || 0))
            }
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            placeholder="例如：5000"
          />
        </div>
      </div>

      {/* Calculated Results Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sample Size per Variant */}
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span>每組所需樣本數 (Per Variant)</span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {result.sampleSizePerVariant.toLocaleString()}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono block">
            兩組總計需 {result.totalSampleSize.toLocaleString()} 人
          </span>
        </div>

        {/* Estimated Duration */}
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Calendar className="w-4 h-4" />
            <span>預估測試所需天數</span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {result.estimatedDays > 0 ? `${result.estimatedDays} 天` : '未提供流量'}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono block">
            約 {(result.estimatedDays / 7).toFixed(1)} 週 (建議跑滿完整週循環)
          </span>
        </div>

        {/* Target Power */}
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Zap className="w-4 h-4" />
            <span>目標檢定力 (Target Power)</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {(params.power * 100).toFixed(0)}%
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
            當真實效應 ≥ {params.mdeValue}
            {params.mdeType === 'relative' ? '%' : 'pp'} 時有此機率測出顯著
          </span>
        </div>
      </div>

      {/* Interactive Power Curve Chart Card (Strict 5-Section Document Flow) */}
      <div
        data-testid="power-chart-card"
        className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col min-w-0 max-w-full"
      >
        {/* 1. Header */}
        <div
          data-testid="power-chart-header"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-zinc-100 dark:border-zinc-800/80 min-w-0"
        >
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span>ECharts 檢定力曲線 (Statistical Power Curve vs. Sample Size)</span>
          </span>
          <span className="text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
            Power Function 1 - β
          </span>
        </div>

        {/* 2. Description */}
        <div data-testid="power-chart-description" className="mt-2 min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            呈現當真實效應達指定 MDE（{params.mdeValue}
            {params.mdeType === 'relative' ? '%' : 'pp'}）時，樣本量從 10% 擴展至 200% 所對應之檢定力（1 - β）。曲線越高代表成功偵測顯著差異之機率越高。
          </p>
        </div>

        {/* 3. Statistics */}
        <div
          data-testid="power-chart-statistics"
          className="mt-3 mb-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono min-w-0"
        >
          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-sans">規劃每組樣本</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {result.sampleSizePerVariant.toLocaleString()} 人
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-sans">目標檢定力</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {(params.power * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-sans">設定顯著水準 (α)</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {params.alpha}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-sans">目標轉換率</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {(result.treatmentRate * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 4. Chart Area */}
        <div data-testid="power-chart-plot" className="mt-2.5 flex-1 min-w-0 w-full">
          <PowerCurveEChart
            powerCurve={result.powerCurve}
            recommendedN={result.sampleSizePerVariant}
          />
        </div>

        {/* 5. Legend / Footer */}
        <div
          data-testid="power-chart-footer"
          className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 min-w-0"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500 inline-block shrink-0" />
              <span>黃色虛線：80% 業界常規門檻</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500 inline-block shrink-0" />
              <span>綠色虛線：90% 高檢定力門檻</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-indigo-500 inline-block shrink-0" />
              <span>紫色實線：當前推薦每組規劃點</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-400">
            N = {result.sampleSizePerVariant.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
