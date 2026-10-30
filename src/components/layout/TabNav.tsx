import React from 'react';
import {
  BarChart3,
  Calculator,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export type ActiveWorkbenchTab = 'analysis' | 'power' | 'business';

interface TabNavProps {
  activeTab: ActiveWorkbenchTab;
  onTabChange: (tab: ActiveWorkbenchTab) => void;
  hasSrmAlert?: boolean;
  variantCount?: number;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onTabChange,
  hasSrmAlert = false,
  variantCount = 2,
}) => {
  const tabs = [
    {
      id: 'analysis' as ActiveWorkbenchTab,
      label: 'A/B 檢定分析',
      icon: BarChart3,
      desc: '雙樣本比例 Z 檢定、Wilson 信賴區間與 SRM 診斷',
      badge: hasSrmAlert ? 'SRM 失衡' : `${variantCount} 組別`,
      badgeColor: hasSrmAlert ? 'amber' : 'zinc',
    },
    {
      id: 'power' as ActiveWorkbenchTab,
      label: '樣本量與檢定力',
      icon: Calculator,
      desc: '最小可偵測效應 (MDE)、檢定力曲線與週期規劃',
    },
    {
      id: 'business' as ActiveWorkbenchTab,
      label: '商業價值與假設檢驗',
      icon: ShieldAlert,
      desc: '超額毛利 ROI 試算、防偷窺偏差與統計假設防禦',
    },
  ];

  return (
    <nav
      data-testid="app-workbench-tabs"
      aria-label="工作台視圖導覽"
      className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none shadow-xs transition-colors"
    >
      <div className="max-w-[1700px] mx-auto px-2 sm:px-4 flex items-center overflow-x-auto no-scrollbar gap-1 min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-full border font-mono flex items-center gap-1 ${
                    tab.badgeColor === 'amber'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {tab.badgeColor === 'amber' && <AlertTriangle className="w-2.5 h-2.5" />}
                  <span>{tab.badge}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
