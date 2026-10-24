import React, { useState } from 'react';
import {
  Compass,
  Share2,
  CheckCircle2,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { PRESET_EXPERIMENTS } from '../utils/presets';
import type { PresetExperiment } from '../utils/presets';

interface HeaderProps {
  onSelectPreset: (preset: PresetExperiment) => void;
  onOpenShareModal: () => void;
  onOpenVerificationModal: () => void;
  verificationPassed: boolean;
  totalVerificationTests: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenShareModal,
  onOpenVerificationModal,
  verificationPassed,
  totalVerificationTests,
}) => {
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Experiment Lens
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                A/B 決策統計檢定
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              專業雙樣本比例檢定 · 信賴區間 · 樣本量與檢定力 · SRM 失衡警報
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Preset Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="載入預設真實案例"
            >
              <FolderOpen className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">案例情境</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded ml-1">
                {PRESET_EXPERIMENTS.length}
              </span>
            </button>

            {presetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setPresetDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-2 z-30 text-slate-200 divide-y divide-slate-700/50">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>快速載入範例情境</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="py-1">
                    {PRESET_EXPERIMENTS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onSelectPreset(preset);
                          setPresetDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/70 transition group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-white group-hover:text-blue-300">
                            {preset.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-900/80 text-blue-400 font-mono text-[10px]">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Statistical Verification Suite Button */}
          <button
            onClick={onOpenVerificationModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              verificationPassed
                ? 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-600/40'
                : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-600/40'
            }`}
            title="查看統計數學公式自主驗證測試"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">計算測試</span>
            <span className="text-xs bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
              {totalVerificationTests} 通過
            </span>
          </button>

          {/* Share & Export Button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>分享 / 匯出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
