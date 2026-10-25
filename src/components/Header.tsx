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
  Laptop,
  Menu,
  X,
} from 'lucide-react';
import { PRESET_EXPERIMENTS } from '../utils/presets';
import type { PresetExperiment } from '../utils/presets';
import { useTheme } from '../context/ThemeContext';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <header className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between min-w-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Experiment Lens
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono uppercase bg-slate-100 text-blue-600 border border-slate-200 dark:bg-slate-800 dark:text-blue-400 rounded dark:border-slate-700 shrink-0">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block truncate">
              雙樣本比例檢定 · Wilson & Newcombe 信賴區間 · SRM 失衡診斷 · ECharts
            </p>
          </div>
        </div>

        {/* Desktop Controls (hidden on mobile < 768px) */}
        <div className="hidden md:flex items-center space-x-2 shrink-0">
          {/* IndexedDB Auto-save status */}
          <div className="hidden xl:flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono pr-2 border-r border-slate-200 dark:border-slate-800">
            <Save className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>
              {lastSavedTime
                ? `已存檔 ${new Date(lastSavedTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'IndexedDB 連線正常'}
            </span>
          </div>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="切換主題 (System / Light / Dark)"
              aria-label="Theme toggle"
            >
              {theme === 'system' ? (
                <Laptop className="w-4 h-4" />
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
                <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setTheme('system');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      theme === 'system' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>系統預設</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('light');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      theme === 'light' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
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
                    className={`w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      theme === 'dark' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>深色模式</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Database / Experiment Manager Button */}
          <button
            onClick={onOpenDatabaseModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition"
            title="開啟本機 IndexedDB 實驗檔案庫"
          >
            <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>實驗檔案庫</span>
          </button>

          {/* Preset Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition"
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
                <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-30 text-slate-800 dark:text-slate-200">
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
                        className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300">
                            {preset.name}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-mono">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
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
                ? 'bg-slate-100 hover:bg-slate-200 text-emerald-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-emerald-400 dark:border-slate-700'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
            }`}
            title="查看統計數學公式自主驗證測試"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline">計算測試</span>
            <span className="text-[10px] bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300 px-1 py-0.2 rounded font-mono border border-slate-200 dark:border-slate-800">
              {totalVerificationTests} PASS
            </span>
          </button>

          {/* Share & Export Button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>匯出 / 分享</span>
          </button>
        </div>

        {/* Mobile Header Buttons (< 768px) */}
        <div className="flex md:hidden items-center space-x-1.5 shrink-0">
          {/* Quick Theme Toggle Icon */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
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
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
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
            className="fixed inset-x-0 top-14 bottom-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 right-0 bottom-0 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 p-4 flex flex-col justify-between shadow-2xl md:hidden overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  工作台快速選單
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  aria-label="關閉選單"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Theme selector in Drawer */}
              <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  介面主題模式
                </span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setTheme('system')}
                    className={`py-1.5 rounded flex items-center justify-center space-x-1 ${
                      theme === 'system'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>系統</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`py-1.5 rounded flex items-center justify-center space-x-1 ${
                      theme === 'light'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>淺色</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`py-1.5 rounded flex items-center justify-center space-x-1 ${
                      theme === 'dark'
                        ? 'bg-white dark:bg-slate-700 text-blue-400 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400'
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
                  className="w-full h-11 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 transition"
                >
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>實驗檔案庫 (IndexedDB)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenShareModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-2 transition shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>匯出 / 可重現分享</span>
                </button>

                <button
                  onClick={() => {
                    onOpenVerificationModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>統計計算測試 ({totalVerificationTests} PASS)</span>
                </button>
              </div>

              {/* Presets in Drawer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {preset.tag}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom status in Drawer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
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
