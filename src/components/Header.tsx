import React, { useState } from 'react';
import {
  Compass,
  Share2,
  CheckCircle2,
  FolderOpen,
  Database,
  Save,
} from 'lucide-react';
import { PRESET_EXPERIMENTS } from '../utils/presets';
import type { PresetExperiment } from '../utils/presets';

interface HeaderProps {
  onSelectPreset: (preset: PresetExperiment) => void;
  onOpenShareModal: () => void;
  onOpenVerificationModal: () => void;
  onOpenDatabaseModal: () => void;
  verificationPassed: boolean;
  totalVerificationTests: number;
  lastSavedTime?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenShareModal,
  onOpenVerificationModal,
  onOpenDatabaseModal,
  verificationPassed,
  totalVerificationTests,
  lastSavedTime,
}) => {
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-white">
                Experiment Lens
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono uppercase bg-slate-800 text-blue-400 rounded border border-slate-700">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              雙樣本比例檢定 · Wilson & Newcombe 信賴區間 · SRM 失衡診斷 · ECharts
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* IndexedDB Auto-save status */}
          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-slate-400 font-mono pr-2 border-r border-slate-800">
            <Save className="w-3 h-3 text-emerald-400" />
            <span>
              {lastSavedTime
                ? `已存檔 ${new Date(lastSavedTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'IndexedDB 已連線'}
            </span>
          </div>

          {/* Database / Experiment Manager Button */}
          <button
            onClick={onOpenDatabaseModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="開啟本機 IndexedDB 實驗檔案庫"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">實驗檔案庫</span>
          </button>

          {/* Preset Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="載入標準情境案例"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">案例範本</span>
            </button>

            {presetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setPresetDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-80 bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-1.5 z-30 text-slate-200">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    快速載入範例情境
                  </div>
                  <div className="py-1">
                    {PRESET_EXPERIMENTS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onSelectPreset(preset);
                          setPresetDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-700 transition group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-white group-hover:text-blue-300">
                            {preset.name}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900 text-blue-400 font-mono">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
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
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
              verificationPassed
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}
            title="查看統計數學公式自主驗證測試"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">計算測試</span>
            <span className="text-[10px] bg-slate-900 text-slate-300 px-1 py-0.2 rounded font-mono">
              {totalVerificationTests} PASS
            </span>
          </button>

          {/* Share & Export Button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>匯出 / 分享</span>
          </button>
        </div>
      </div>
    </header>
  );
};
