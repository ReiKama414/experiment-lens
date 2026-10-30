import React, { useState } from 'react';
import {
  Compass,
  Share2,
  CheckCircle2,
  FolderOpen,
  Database,
  Save,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';
import { PRESET_EXPERIMENTS } from '../utils/presets';
import type { PresetExperiment } from '../utils/presets';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentExperimentName: string;
  onSelectPreset: (preset: PresetExperiment) => void;
  onNewExperiment: () => void;
  onOpenShareModal: () => void;
  onOpenVerificationModal: () => void;
  onOpenDatabaseModal: () => void;
  verificationPassed: boolean;
  totalVerificationTests: number;
  lastSavedTime?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentExperimentName,
  onSelectPreset,
  onNewExperiment,
  onOpenShareModal,
  onOpenVerificationModal,
  onOpenDatabaseModal,
  verificationPassed,
  totalVerificationTests,
  lastSavedTime,
}) => {
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 select-none transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight font-mono truncate text-zinc-900 dark:text-zinc-100">
                Experiment Lens
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded shrink-0 inline-block font-mono">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden lg:block truncate">
              雙樣本比例檢定 · Wilson & Newcombe 信賴區間 · SRM 失衡診斷 · ECharts 視覺化
            </p>
          </div>

          {/* Current Experiment Badge (aligned with insight-canvas dataset badge style) */}
          <div className="hidden xl:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs shrink-0">目前實驗:</span>
            <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 max-w-[200px] truncate font-mono">
              {currentExperimentName || '自訂實驗'}
            </span>
          </div>
        </div>

        {/* Desktop Controls (hidden on mobile < 768px) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* IndexedDB Auto-save status */}
          <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono pr-2 border-r border-zinc-200 dark:border-zinc-800">
            <Save className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>
              {lastSavedTime
                ? `已存檔 ${new Date(lastSavedTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'IndexedDB 連線正常'}
            </span>
          </div>

          {/* New Experiment Button */}
          <button
            onClick={onNewExperiment}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition shadow-2xs"
            title="開立全新實驗數據"
          >
            <PlusCircle className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span className="hidden lg:inline">新實驗</span>
          </button>

          {/* Database / Experiment Manager Button */}
          <button
            onClick={onOpenDatabaseModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition shadow-2xs"
            title="開啟本機 IndexedDB 實驗檔案庫"
          >
            <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>實驗檔案庫</span>
          </button>

          {/* Preset Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition shadow-2xs"
              title="載入標準情境案例"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>案例範本</span>
            </button>

            {presetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setPresetDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-30 text-zinc-800 dark:text-zinc-200">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    快速載入範例情境
                  </div>
                  <div className="py-1 space-y-0.5">
                    {PRESET_EXPERIMENTS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onSelectPreset(preset);
                          setPresetDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {preset.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-mono border border-zinc-200 dark:border-zinc-700">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition shadow-2xs ${
              verificationPassed
                ? 'bg-white hover:bg-zinc-100 text-emerald-700 border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-emerald-400 dark:border-zinc-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
            }`}
            title="查看統計數學公式自主驗證測試"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline">計算測試</span>
            <span className="text-[10px] bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 px-1.5 py-0.2 rounded font-mono border border-zinc-200 dark:border-zinc-700">
              {totalVerificationTests} PASS
            </span>
          </button>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              title="切換主題 (跟隨系統 / 淺色模式 / 深色模式)"
              aria-label="Theme toggle"
            >
              {theme === 'system' ? (
                <Monitor className="w-4 h-4" />
              ) : resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {themeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setThemeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setTheme('system');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      theme === 'system' ? 'font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100/60 dark:bg-zinc-800/60' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-zinc-500" />
                    <span>系統預設</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('light');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      theme === 'light' ? 'font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100/60 dark:bg-zinc-800/60' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>淺色模式</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      theme === 'dark' ? 'font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100/60 dark:bg-zinc-800/60' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>深色模式</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Share & Export Primary Button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>匯出 / 分享</span>
          </button>
        </div>

        {/* Mobile Header Buttons (< 768px) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {/* Quick Theme Toggle Icon */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
            title="快速切換日夜間主題"
            aria-label="Quick theme toggle"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
            aria-label={mobileMenuOpen ? '關閉選單' : '開啟選單'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (< 768px) */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-x-0 top-14 bottom-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 right-0 bottom-0 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 z-50 p-4 flex flex-col justify-between shadow-2xl md:hidden overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  工作台快速選單
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                  aria-label="關閉選單"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme selector in Drawer */}
              <div className="space-y-1.5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  介面主題模式
                </span>
                <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setTheme('system')}
                    className={`py-1.5 rounded flex items-center justify-center gap-1 ${
                      theme === 'system'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>系統</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`py-1.5 rounded flex items-center justify-center gap-1 ${
                      theme === 'light'
                        ? 'bg-white dark:bg-zinc-700 text-amber-600 shadow-xs font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>淺色</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`py-1.5 rounded flex items-center justify-center gap-1 ${
                      theme === 'dark'
                        ? 'bg-white dark:bg-zinc-700 text-blue-400 shadow-xs font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>深色</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons in Drawer */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenDatabaseModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2 transition"
                >
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>實驗檔案庫 (IndexedDB)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenShareModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 flex items-center gap-2 transition shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>匯出 / 可重現分享</span>
                </button>

                <button
                  onClick={() => {
                    onOpenVerificationModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>統計計算測試 ({totalVerificationTests} PASS)</span>
                </button>
              </div>

              {/* Presets in Drawer */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  快速案例範本
                </span>
                <div className="space-y-1">
                  {PRESET_EXPERIMENTS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSelectPreset(preset);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs transition border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    >
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {preset.tag}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom status in Drawer */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-mono">
              <Save className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {lastSavedTime
                  ? `已自動存檔 ${new Date(lastSavedTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
                  : 'IndexedDB 離線可用'}
              </span>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
