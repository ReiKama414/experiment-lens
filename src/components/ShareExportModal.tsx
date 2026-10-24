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
  downloadFile,
  copyToClipboard,
} from '../utils/export';
import {
  serializeStateToUrl,
} from '../utils/urlState';
import type { ExperimentStateSnapshot } from '../utils/urlState';
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
  Sparkles,
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
    const ok = await copyToClipboard(shareableUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMarkdown = async () => {
    const ok = await copyToClipboard(markdownContent);
    if (ok) {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
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
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.variants)) {
          onLoadSnapshot(parsed);
          onClose();
        } else {
          alert('無效的 Experiment Lens JSON 設定檔');
        }
      } catch (err) {
        alert('解析 JSON 檔案失敗，請確認檔案格式正確。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">匯出報告與重現分享設定</h3>
              <p className="text-xs text-slate-400">
                產出高階決策 Markdown 報告、CSV 數據表或產生包含所有參數的永久網址。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/90 flex space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 transition flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'link'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>可重現分享網址</span>
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`py-3 transition flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'markdown'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown 報告 (Notion/Slack)</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`py-3 transition flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'csv'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV 數據表格</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 transition flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON 存檔與還原</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Tab 1: Share Link */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  參數編碼分享網址 (URL State Hash)
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? '已複製！' : '複製網址'}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
                <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>完全無狀態 (Stateless) 與可重現性保證</span>
                </p>
                <p>
                  所有的組別數據、訪客數、轉換率、信心水準、檢定假設與實驗名稱均安全壓縮編碼在 URL Hash 中，無需後端資料庫。
                  任何團隊成員（PM、工程師、數據分析師）只要點擊該連結，都能立刻開啟一模一樣的分析畫面。
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Markdown Report */}
          {activeTab === 'markdown' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  即裝即用的高階主管 / 團隊驗證報告
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 border border-slate-700"
                  >
                    {copiedMarkdown ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedMarkdown ? '已複製！' : '複製 Markdown'}</span>
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載 .md 檔</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                rows={12}
                value={markdownContent}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Tab 3: CSV Export */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  包含轉換率、信賴區間與檢定統計量之標準 CSV
                </span>
                <button
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載 metrics.csv</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={8}
                value={csvContent}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Tab 4: JSON Export/Import */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-white block">匯出目前實驗設定</span>
                  <p className="text-xs text-slate-400">
                    下載含有完整組別數據與檢定參數的 JSON 備份檔。
                  </p>
                  <button
                    onClick={handleDownloadJSON}
                    className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>下載 config.json</span>
                  </button>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-white block">匯入過往實驗設定</span>
                  <p className="text-xs text-slate-400">
                    上傳過去保存的 JSON 設定檔以還原實驗狀態。
                  </p>
                  <label className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer">
                    <Upload className="w-4 h-4" />
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
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-medium"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
