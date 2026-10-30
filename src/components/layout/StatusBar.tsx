import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Users,
} from 'lucide-react';
import type { Variant, SRMResult } from '../../types/experiment';

interface StatusBarProps {
  variants: Variant[];
  srm: SRMResult;
  onOpenVerificationModal: () => void;
  verificationPassed: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  variants,
  srm,
  onOpenVerificationModal,
  verificationPassed,
}) => {
  const totalVisitors = variants.reduce((sum, v) => sum + (v.visitors || 0), 0);
  const totalConversions = variants.reduce((sum, v) => sum + (v.conversions || 0), 0);
  const overallRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

  return (
    <footer
      data-testid="app-footer"
      className="bg-zinc-900 dark:bg-black text-zinc-400 border-t border-zinc-800 text-[11px] py-2 px-3 sm:px-4 sticky bottom-0 z-30 select-none transition-colors w-full"
    >
      <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
        {/* Left Stats: Total Sample, Conversions, Variants, SRM status */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">總樣本:</span>
            <span className="font-mono font-semibold">{totalVisitors.toLocaleString()}</span>
            <span className="text-zinc-500 font-mono text-[10px]">
              ({totalConversions.toLocaleString()} 轉換 · {overallRate.toFixed(2)}%)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <span className="text-zinc-400">組別:</span>
            <span className="font-mono text-zinc-300 font-semibold">{variants.length} 組</span>
          </div>

          {/* SRM Health Diagnostic Indicator */}
          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <span className="text-zinc-400">SRM 分流:</span>
            {srm.hasMismatch ? (
              <span className="flex items-center gap-1 font-mono text-amber-400 font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>比例失衡 (p &lt; 0.001)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>分流正常 (p = {srm.pValue.toFixed(3)})</span>
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>儲存:</span>
            <span className="font-mono text-zinc-300">IndexedDB 本地沙盒</span>
          </div>
        </div>

        {/* Right Status: Mathematical verification, Privacy, Author & Copyright */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-400 min-w-0">
          <button
            onClick={onOpenVerificationModal}
            className="flex items-center gap-1 text-zinc-300 hover:text-white transition font-mono truncate"
            title="開啟數學基準自主驗證清單"
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${
                verificationPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
            <span className="underline underline-offset-2 truncate">通過 9 項統計數學基準測試</span>
          </button>

          <span className="text-zinc-700 shrink-0">·</span>

          <div className="hidden sm:flex items-center gap-1 text-emerald-400 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono font-medium text-[10px] sm:text-[11px]">
              本地 Sandbox 零傳輸
            </span>
          </div>

          <span className="hidden sm:inline text-zinc-700 shrink-0">·</span>

          <a
            href="https://reikama414.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-100 transition font-mono shrink-0"
          >
            ReiKama414
          </a>

          <span className="text-zinc-700 shrink-0">·</span>

          <span className="font-mono text-zinc-500 shrink-0">All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
};
