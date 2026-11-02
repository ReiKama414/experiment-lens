import React, { useState } from 'react';
import type {
  Variant,
  ComparisonResult,
  ExperimentSettings,
  SRMResult,
  BusinessImpactResult,
} from '../types/experiment';
import {
  generateMarkdownReport,
  generateCSV,
} from '../utils/export';
import {
  serializeStateToUrl,
} from '../utils/urlState';
import type { ExperimentStateSnapshot } from '../utils/urlState';
import { downloadFile, parseJSONToExperiment } from '../utils/fileIO';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Link as LinkIcon,
  X,
  AlertTriangle,
} from 'lucide-react';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  variants: Variant[];
  comparisons: ComparisonResult[];
  srm: SRMResult;
  settings: ExperimentSettings;
  businessImpact?: BusinessImpactResult | null;
  onLoadSnapshot: (snapshot: ExperimentStateSnapshot) => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  variants,
  comparisons,
  srm,
  settings,
  businessImpact,
  onLoadSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'markdown' | 'csv' | 'json'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const snapshot: ExperimentStateSnapshot = {
    version: 1,
    experimentName: settings.experimentName,
    metricName: settings.metricName,
    variants,
    settings,
  };

  const shareableUrl = serializeStateToUrl(snapshot);
  const markdownContent = generateMarkdownReport(
    settings.experimentName,
    settings.metricName,
    variants,
    comparisons,
    srm,
    settings,
    businessImpact
  );
  const csvContent = generateCSV(variants, comparisons);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadMarkdown = () => {
    downloadFile(
      markdownContent,
      `${settings.experimentName.replace(/\s+/g, '_')}_A-B_Report.md`,
      'text/markdown'
    );
  };

  const handleDownloadCSV = () => {
    downloadFile(
      csvContent,
      `${settings.experimentName.replace(/\s+/g, '_')}_metrics.csv`,
      'text/csv'
    );
  };

  const handleDownloadJSON = () => {
    downloadFile(
      JSON.stringify(snapshot, null, 2),
      `${settings.experimentName.replace(/\s+/g, '_')}_config.json`,
      'application/json'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseJSONToExperiment(content);
      if (res.success && res.data) {
        onLoadSnapshot({
          version: 1,
          experimentName: res.data.settings.experimentName,
          metricName: res.data.settings.metricName,
          variants: res.data.variants,
          settings: res.data.settings,
        });
        onClose();
      } else {
        setImportError(res.error || '無效的 JSON 檔案結構');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="匯出報告與重現分享設定"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
              <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">匯出報告與重現分享設定</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                產出高階決策 Markdown 報告、CSV 數據表或產生包含所有參數的永久網址。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-3 sm:gap-4 text-xs font-semibold overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-2.5 transition flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === 'link'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>可重現分享網址</span>
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`py-2.5 transition flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === 'markdown'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Markdown 報告 (Notion/Jira)</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`py-2.5 transition flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
            <span>CSV 數據表格</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-2.5 transition flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>JSON 存檔與還原</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {importError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Tab 1: Share Link */}
          {activeTab === 'link' && (
            <div className="space-y-3">
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block font-mono">
                  參數編碼分享網址 (URL State Hash)
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none select-all text-xs"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium transition flex items-center justify-center gap-1 shrink-0 shadow-2xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? '已複製！' : '複製網址'}</span>
                  </button>
                </div>
              </div>

              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                所有的組別數據、訪客數、轉換率、信心水準、檢定假設與實驗名稱均安全壓縮編碼在 URL Hash 中，無需後端資料庫。
                任何團隊成員（PM、工程師、數據分析師）點擊該連結即可完整開啟一模一樣的分析畫面。
              </p>
            </div>
          )}

          {/* Tab 2: Markdown Report */}
          {activeTab === 'markdown' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  即裝即用的高階主管 / 團隊驗證報告
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-medium transition flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                  >
                    {copiedMarkdown ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedMarkdown ? '已複製！' : '複製 Markdown'}</span>
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium transition flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載 .md 檔</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                rows={11}
                value={markdownContent}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none leading-relaxed text-[11px]"
              />
            </div>
          )}

          {/* Tab 3: CSV Export */}
          {activeTab === 'csv' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  包含轉換率、信賴區間與檢定統計量之標準 CSV
                </span>
                <button
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium transition flex items-center gap-1 self-start sm:self-auto shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載 metrics.csv</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={8}
                value={csvContent}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none leading-relaxed text-[11px]"
              />
            </div>
          )}

          {/* Tab 4: JSON Export/Import */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">匯出目前實驗設定</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    下載含有完整組別數據與檢定參數的 JSON 備份檔。
                  </p>
                  <button
                    onClick={handleDownloadJSON}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium transition flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載 config.json</span>
                  </button>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">匯入過往實驗設定</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    上傳過去保存的 JSON 設定檔以還原實驗狀態。
                  </p>
                  <label className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>選擇 JSON 檔案還原</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition text-xs font-medium shadow-2xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
