import React, { useState, useMemo } from 'react';
import type { PowerCalculationInput } from '../types/experiment';
import { calculateSampleSize } from '../utils/stats';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <span>樣本量規劃與統計檢定力估算 (Sample Size & Power Planner)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          在啟動測試前，依據預期最小偵測效應 (MDE) 與檢定力規劃所需樣本數與測試天數，防止樣本不足 (Underpowered) 導致的偽陰性結論。
        </p>
      </div>

      {/* Inputs Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Baseline Conversion Rate */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span>基準轉換率 (Baseline CR)</span>
            <span className="font-mono text-blue-400">
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
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* MDE Input */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">最小偵測效應 (MDE)</span>
            <div className="inline-flex rounded bg-slate-800 p-0.5 border border-slate-700 text-[10px]">
              <button
                type="button"
                onClick={() => updateParam('mdeType', 'relative')}
                className={`px-1.5 py-0.5 rounded ${
                  params.mdeType === 'relative' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                相對 %
              </button>
              <button
                type="button"
                onClick={() => updateParam('mdeType', 'absolute')}
                className={`px-1.5 py-0.5 rounded ${
                  params.mdeType === 'absolute' ? 'bg-blue-600 text-white' : 'text-slate-400'
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500 pr-8"
            />
            <span className="absolute right-2.5 top-2 text-slate-400 font-mono">
              {params.mdeType === 'relative' ? '%' : 'pp'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            目標轉換率: {(result.treatmentRate * 100).toFixed(2)}%
          </span>
        </div>

        {/* Statistical Power (1 - beta) */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span>統計檢定力 (Power: 1 - β)</span>
            <span className="font-mono text-indigo-400">{(params.power * 100).toFixed(0)}%</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[0.8, 0.85, 0.9].map((pow) => (
              <button
                key={pow}
                type="button"
                onClick={() => updateParam('power', pow)}
                className={`py-1.5 rounded-lg font-mono text-xs transition ${
                  params.power === pow
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {(pow * 100).toFixed(0)}%
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block">
            業界標準通常為 80% (容忍 20% 偽陰性)
          </span>
        </div>

        {/* Significance Level (alpha) */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span>顯著水準 (α, 偽陽性上限)</span>
            <span className="font-mono text-emerald-400">{params.alpha}</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[0.01, 0.05, 0.1].map((alp) => (
              <button
                key={alp}
                type="button"
                onClick={() => updateParam('alpha', alp)}
                className={`py-1.5 rounded-lg font-mono text-xs transition ${
                  params.alpha === alp
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {(alp * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>

        {/* Daily Traffic */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 sm:col-span-2">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span>預估每日進站總流量 (Total Daily Traffic)</span>
            <span className="text-slate-400 font-mono">
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
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
            placeholder="例如：5000"
          />
        </div>
      </div>

      {/* Calculated Results Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sample Size per Variant */}
        <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <Users className="w-4 h-4" />
            <span>每組所需樣本數 (Per Variant)</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {result.sampleSizePerVariant.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            兩組總計需 {result.totalSampleSize.toLocaleString()} 人
          </span>
        </div>

        {/* Estimated Duration */}
        <div className="bg-gradient-to-br from-blue-950/50 to-slate-900 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
            <Calendar className="w-4 h-4" />
            <span>預估測試所需天數</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {result.estimatedDays > 0 ? `${result.estimatedDays} 天` : '未提供流量'}
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            約 {(result.estimatedDays / 7).toFixed(1)} 週 (建議跑滿完整週循環)
          </span>
        </div>

        {/* Target Power */}
        <div className="bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
            <Zap className="w-4 h-4" />
            <span>偵測保證能力 (Power)</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {(params.power * 100).toFixed(0)}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            當真實提升 ≥ {params.mdeValue}
            {params.mdeType === 'relative' ? '%' : 'pp'} 時有此機率偵測出顯著
          </span>
        </div>
      </div>

      {/* Interactive Power Curve Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider">
            檢定力曲線 (Statistical Power Curve vs. Sample Size)
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            目前規劃點: N = {result.sampleSizePerVariant.toLocaleString()} (Power{' '}
            {(params.power * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={result.powerCurve}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey="sampleSize"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs space-y-1 shadow-lg">
                        <div className="text-slate-300">
                          樣本數: <strong className="text-white">{data.sampleSize.toLocaleString()}</strong>
                        </div>
                        <div className="text-indigo-300">
                          檢定力 (Power): <strong className="text-white">{data.powerPercentage}%</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '80% 門檻', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: '90% 門檻', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine
                x={result.sampleSizePerVariant}
                stroke="#6366f1"
                strokeWidth={2}
                label={{ value: '建議值', fill: '#818cf8', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="powerPercentage"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
