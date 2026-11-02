import React, { useState, useEffect } from 'react';
import type { ExperimentRecord } from '../types/experiment';
import {
  getAllExperiments,
  deleteExperiment,
  duplicateExperiment,
  exportAllExperiments,
  importExperiments,
  saveExperiment,
} from '../db/indexedDB';
import { parseCSVToVariants, parseJSONToExperiment, downloadFile } from '../utils/fileIO';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  Database,
  Plus,
  Copy,
  Trash2,
  FolderOpen,
  Download,
  Upload,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface ExperimentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExperimentId: string;
  onSelectExperiment: (record: ExperimentRecord) => void;
  onNewExperiment: () => void;
}

export const ExperimentManagerModal: React.FC<ExperimentManagerModalProps> = ({
  isOpen,
  onClose,
  currentExperimentId,
  onSelectExperiment,
  onNewExperiment,
}) => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importStatus, setImportStatus] = useState<{ msg: string; isError: boolean } | null>(null);

  const loadList = async () => {
    try {
      const records = await getAllExperiments(searchQuery, statusFilter);
      setExperiments(records);
    } catch (err) {
      console.error('Failed to load experiments from IndexedDB', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadList();
      setImportStatus(null);
    }
  }, [isOpen, searchQuery, statusFilter]);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`確定要刪除實驗「${name}」？此操作無法復原。`)) {
      await deleteExperiment(id);
      await loadList();
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateExperiment(id);
      await loadList();
      onSelectExperiment(duplicated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportAll = async () => {
    const all = await exportAllExperiments();
    downloadFile(
      JSON.stringify(all, null, 2),
      `experiment_lens_backup_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    const filename = file.name.toLowerCase();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (filename.endsWith('.csv')) {
        const res = parseCSVToVariants(content);
        if (!res.success || !res.data) {
          setImportStatus({ msg: res.error || 'CSV 解析失敗', isError: true });
          return;
        }

        const now = Date.now();
        const newRecord: ExperimentRecord = {
          id: `exp-${now}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name.replace(/\.csv$/i, ''),
          metricName: '轉換率',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          variants: res.data,
          settings: {
            experimentName: file.name.replace(/\.csv$/i, ''),
            metricName: '轉換率',
            confidenceLevel: 0.95,
            hypothesisDirection: 'two-sided',
            useContinuityCorrection: false,
            enableMultipleTestingCorrection: false,
          },
          tags: ['CSV Import'],
        };

        await saveExperiment(newRecord);
        await loadList();
        onSelectExperiment(newRecord);
        setImportStatus({ msg: `成功自 CSV 匯入實驗「${newRecord.name}」`, isError: false });
      } else if (filename.endsWith('.json')) {
        try {
          const raw = JSON.parse(content);
          if (Array.isArray(raw)) {
            // Batch import
            const result = await importExperiments(raw);
            await loadList();
            setImportStatus({
              msg: `批次匯入完成：成功匯入 ${result.importedCount} 筆實驗。${
                result.errors.length > 0 ? `（${result.errors.length} 筆忽略）` : ''
              }`,
              isError: false,
            });
          } else {
            // Single experiment import
            const res = parseJSONToExperiment(content);
            if (!res.success || !res.data) {
              setImportStatus({ msg: res.error || 'JSON 解析失敗', isError: true });
              return;
            }
            await saveExperiment(res.data);
            await loadList();
            onSelectExperiment(res.data);
            setImportStatus({ msg: `成功匯入實驗「${res.data.name}」`, isError: false });
          }
        } catch (err: any) {
          setImportStatus({ msg: `檔案解析失敗：${err.message}`, isError: true });
        }
      } else {
        setImportStatus({ msg: '僅支援 .csv 或 .json 檔案匯入', isError: true });
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
        aria-label="本機實驗庫"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-mono">
                <span>本機實驗庫 (IndexedDB 儲存庫)</span>
                <span className="text-[11px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-700">
                  {experiments.length} 個實驗
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                所有實驗數據均安全持久化保存在瀏覽器 IndexedDB 中，離線可用且完全保障隱私。
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

        {/* Action Controls Ribbon */}
        <div className="px-4 sm:px-5 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="搜尋實驗名稱、指標或標籤..."
                aria-label="搜尋實驗"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="依狀態篩選"
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none shrink-0"
            >
              <option value="all">所有狀態</option>
              <option value="draft">草稿 (Draft)</option>
              <option value="running">進行中 (Running)</option>
              <option value="concluded">已結案 (Concluded)</option>
              <option value="archived">封存 (Archived)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onNewExperiment();
                onClose();
              }}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium transition flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>建立新實驗</span>
            </button>

            <label className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>匯入 (CSV/JSON)</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportAll}
              className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition flex items-center gap-1 shadow-2xs"
              title="備份所有實驗為 JSON"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>全庫備份</span>
            </button>
          </div>
        </div>

        {/* Import status alert */}
        {importStatus && (
          <div
            className={`px-4 sm:px-5 py-2 text-xs flex items-center gap-2 ${
              importStatus.isError
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {importStatus.isError ? (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{importStatus.msg}</span>
          </div>
        )}

        {/* Experiment Records List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1">
          {experiments.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600" />
              <p>無符合條件的實驗紀錄。</p>
            </div>
          ) : (
            experiments.map((exp) => {
              const isActive = exp.id === currentExperimentId;
              const dateStr = new Date(exp.updatedAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const statusColor =
                exp.status === 'concluded'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : exp.status === 'running'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                  : exp.status === 'archived'
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800';

              return (
                <div
                  key={exp.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isActive
                      ? 'bg-zinc-100/70 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600'
                      : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-xs">{exp.name}</span>
                      <span className={`text-[10px] px-1.5 py-px rounded-md font-mono border ${statusColor}`}>
                        {exp.status.toUpperCase()}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-1.5 py-px rounded font-mono">
                          目前開啟中
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>指標: <strong className="text-zinc-800 dark:text-zinc-300 font-mono">{exp.metricName}</strong></span>
                      <span>組別: <strong className="text-zinc-800 dark:text-zinc-300 font-mono">{exp.variants.length} 組</strong></span>
                      <span>最後更新: <span className="font-mono">{dateStr}</span></span>
                      {exp.tags && exp.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {exp.tags.map((t) => (
                            <span key={t} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 rounded text-[10px] font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 sm:self-center">
                    <button
                      onClick={() => {
                        onSelectExperiment(exp);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium transition shadow-2xs"
                    >
                      開啟載入
                    </button>

                    <button
                      onClick={() => handleDuplicate(exp.id)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition shadow-2xs"
                      title="建立副本"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(exp.id, exp.name)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700 transition shadow-2xs"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="min-w-0">支援將任何現有 A/B 數據匯入或將歷史實驗完整備份為標準 JSON / CSV。</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition text-xs font-medium shadow-2xs"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
