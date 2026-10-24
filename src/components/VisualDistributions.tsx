import React, { useMemo } from 'react';
import type { Variant, ComparisonResult } from '../types/experiment';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { normalPDF } from '../utils/stats';
import { Activity, BarChart2 } from 'lucide-react';

interface VisualDistributionsProps {
  variants: Variant[];
  comparisons: ComparisonResult[];
}

export const VisualDistributions: React.FC<VisualDistributionsProps> = ({
  variants,
  comparisons,
}) => {
  // Generate distribution curves for sampling distributions
  const chartData = useMemo(() => {
    const validVariants = variants.filter((v) => v.visitors > 0);
    if (validVariants.length === 0) return [];

    const stats = validVariants.map((v) => {
      const p = v.conversions / v.visitors;
      const se = Math.sqrt((p * (1 - p)) / v.visitors);
      return { id: v.id, name: v.name, p, se, isControl: v.isControl };
    });

    let minX = Math.min(...stats.map((s) => s.p - 3.5 * s.se));
    let maxX = Math.max(...stats.map((s) => s.p + 3.5 * s.se));
    minX = Math.max(0, minX);
    maxX = Math.min(1, maxX);

    if (minX >= maxX) {
      minX = 0;
      maxX = 0.1;
    }

    const steps = 70;
    const stepSize = (maxX - minX) / steps;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const x = minX + i * stepSize;
      const point: any = {
        ratePercent: Math.round(x * 10000) / 100,
      };

      for (const s of stats) {
        if (s.se > 0) {
          const z = (x - s.p) / s.se;
          point[s.id] = normalPDF(z) / s.se;
        } else {
          point[s.id] = 0;
        }
      }
      points.push(point);
    }

    return points;
  }, [variants]);

  const palette = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>轉換率常態抽樣分佈 (Sampling Distributions)</span>
          </h2>
          <p className="text-xs text-slate-400">
            視覺化各組轉換率的概似鐘型分佈曲線。兩曲線重疊越少，代表組間真實存在效應的機率越高。
          </p>
        </div>
      </div>

      {/* Bell Curves Distribution Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="controlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="variantBGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="variantCGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="ratePercent"
              tickFormatter={(v) => `${v}%`}
              stroke="#64748b"
              fontSize={11}
            />
            <YAxis hide />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                      <div className="font-semibold text-slate-300">
                        轉換率: <span className="font-mono text-white">{label}%</span>
                      </div>
                      {payload.map((entry: any) => {
                        const v = variants.find((item) => item.id === entry.dataKey);
                        return (
                          <div key={entry.dataKey} className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-300">{v ? v.name : entry.dataKey}:</span>
                            <span className="font-mono text-white">
                              {Number(entry.value).toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              formatter={(value) => {
                const v = variants.find((item) => item.id === value);
                return (
                  <span className="text-xs text-slate-300">
                    {v ? (v.isControl ? `🌟 ${v.name} (對照組)` : v.name) : value}
                  </span>
                );
              }}
            />
            {variants.map((v, idx) => {
              const color = v.isControl
                ? '#f59e0b'
                : palette[(idx - 1) % palette.length] || '#38bdf8';
              return (
                <Area
                  key={v.id}
                  type="monotone"
                  dataKey={v.id}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${
                    v.isControl
                      ? 'controlGradient'
                      : idx === 1
                      ? 'variantBGradient'
                      : 'variantCGradient'
                  })`}
                  fillOpacity={0.3}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lift Confidence Intervals Horizontal Range Visualizer */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>絕對提升 95% Newcombe 信賴區間跨距 (Relative to Baseline 0)</span>
        </h3>

        <div className="space-y-3">
          {comparisons.map((comp) => {
            const lower = comp.absoluteLiftNewcombeCI.lower * 100;
            const upper = comp.absoluteLiftNewcombeCI.upper * 100;
            const center = comp.absoluteLift * 100;

            const maxAbs = Math.max(Math.abs(lower), Math.abs(upper), 1.5);
            const toPercent = (val: number) => {
              return ((val + maxAbs) / (2 * maxAbs)) * 100;
            };

            const leftPos = Math.max(0, toPercent(lower));
            const rightPos = Math.min(100, toPercent(upper));
            const centerPos = toPercent(center);
            const zeroPos = toPercent(0);

            const isSignificantlyPositive = lower > 0;
            const isSignificantlyNegative = upper < 0;

            return (
              <div
                key={comp.variantId}
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{comp.variantName}</span>
                  <span className="font-mono text-slate-400">
                    提升: <strong className="text-white">{center > 0 ? '+' : ''}{center.toFixed(2)} pp</strong>{' '}
                    (95% CI: [{lower.toFixed(2)}%, {upper.toFixed(2)}%])
                  </span>
                </div>

                {/* Range bar */}
                <div className="relative h-6 bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                  {/* Baseline 0 vertical marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
                    style={{ left: `${zeroPos}%` }}
                    title="0 基準線"
                  />

                  {/* Confidence Interval span */}
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 opacity-80 ${
                      isSignificantlyPositive
                        ? 'bg-emerald-500'
                        : isSignificantlyNegative
                        ? 'bg-rose-500'
                        : 'bg-slate-600'
                    }`}
                    style={{
                      left: `${Math.min(leftPos, rightPos)}%`,
                      width: `${Math.max(1, Math.abs(rightPos - leftPos))}%`,
                    }}
                  />

                  {/* Center point marker */}
                  <div
                    className="absolute top-0.5 bottom-0.5 w-1 bg-white rounded-full z-20 shadow-sm"
                    style={{ left: `${centerPos}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>- {maxAbs.toFixed(1)}%</span>
                  <span className="text-slate-400 font-sans">0 (對照基準)</span>
                  <span>+ {maxAbs.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
