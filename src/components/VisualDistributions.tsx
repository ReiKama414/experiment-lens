import React from 'react';
import type { Variant, ComparisonResult } from '../types/experiment';
import { DistributionEChart } from './charts/DistributionEChart';
import { ConfidenceIntervalEChart } from './charts/ConfidenceIntervalEChart';
import { Activity, BarChart2 } from 'lucide-react';

interface VisualDistributionsProps {
  variants: Variant[];
  comparisons: ComparisonResult[];
}

export const VisualDistributions: React.FC<VisualDistributionsProps> = ({
  variants,
  comparisons,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>轉換率常態抽樣分佈 (ECharts Sampling Distribution)</span>
          </h2>
          <p className="text-xs text-slate-400">
            視覺化各組轉換率的常態近似抽樣密度曲線（μ = p̂, σ = √[p̂(1-p̂)/N]）。重疊面積越少代表真實存在組間差異之機率越高。
          </p>
        </div>
      </div>

      {/* Bell Curves Distribution Chart */}
      <DistributionEChart variants={variants} />

      {/* Confidence Intervals Error Bar Forest Plot */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>絕對提升 95% Newcombe 信賴區間範圍 (Forest Plot vs. 0 基準線)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            綠色/紅色代表統計顯著（未跨越 0），灰色代表未達顯著
          </span>
        </div>

        <ConfidenceIntervalEChart comparisons={comparisons} />
      </div>
    </div>
  );
};
