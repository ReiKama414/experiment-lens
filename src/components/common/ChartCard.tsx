import React from 'react';
import { Download } from 'lucide-react';

export interface ChartCardTestIds {
  card?: string;
  header?: string;
  description?: string;
  statistics?: string;
  plot?: string;
  footer?: string;
}

export interface ChartCardProps {
  title: string;
  description?: string;
  statistics?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  onExportPNG?: () => void;
  testIds?: ChartCardTestIds;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  statistics,
  children,
  footer,
  headerActions,
  className = '',
  onExportPNG,
  testIds,
}) => {
  return (
    <div
      data-testid={testIds?.card}
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs p-3.5 sm:p-5 flex flex-col min-w-0 max-w-full ${className}`}
    >
      {/* 1. Header & Actions (Normal Document Flow) */}
      <div
        data-testid={testIds?.header}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 min-w-0"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </h3>
          {description && (
            <p
              data-testid={testIds?.description}
              className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed"
            >
              {description}
            </p>
          )}
        </div>

        {/* Header Actions & Export Button (Normal Flex Flow - No Absolute Overlay) */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {headerActions}
          {onExportPNG && (
            <button
              onClick={onExportPNG}
              title="匯出高解析度 PNG 圖表 (2x)"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>匯出 PNG</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Statistics Section (Normal Document Flow) */}
      {statistics && (
        <div data-testid={testIds?.statistics} className="mt-3 mb-1 min-w-0">
          {statistics}
        </div>
      )}

      {/* 3. Chart Drawing Area */}
      <div data-testid={testIds?.plot} className="mt-2.5 flex-1 min-w-0 w-full">
        {children}
      </div>

      {/* 4. Legend / Footer Section (Normal Document Flow) */}
      {footer && (
        <div
          data-testid={testIds?.footer}
          className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 dark:text-zinc-500 min-w-0"
        >
          {footer}
        </div>
      )}
    </div>
  );
};
