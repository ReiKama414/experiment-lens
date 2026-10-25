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
    // Reset file input value so re-selecting same file triggers change
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>本機實驗庫 (IndexedDB 儲存庫)</span>
                <span className="text-[11px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {experiments.length} 個實驗
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                所有實驗數據均安全持久化保存在瀏覽器 IndexedDB 中，離線可用且完全保障隱私。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Ribbon */}
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋實驗名稱、指標或標籤..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">所有狀態</option>
              <option value="draft">草稿 (Draft)</option>
              <option value="running">進行中 (Running)</option>
              <option value="concluded">已結案 (Concluded)</option>
              <option value="archived">封存 (Archived)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onNewExperiment();
                onClose();
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>建立新實驗</span>
            </button>

            <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md font-medium transition flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
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
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md font-medium transition flex items-center space-x-1"
              title="備份所有實驗為 JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>全庫備份</span>
            </button>
          </div>
        </div>

        {/* Import status alert */}
        {importStatus && (
          <div
            className={`px-5 py-2 text-xs flex items-center space-x-2 ${
              importStatus.isError
                ? 'bg-rose-950/60 text-rose-300 border-b border-rose-800'
                : 'bg-emerald-950/60 text-emerald-300 border-b border-emerald-800'
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
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {experiments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-600" />
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
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : exp.status === 'running'
                  ? 'bg-blue-950 text-blue-400 border-blue-800'
                  : exp.status === 'archived'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-amber-950 text-amber-400 border-amber-800';

              return (
                <div
                  key={exp.id}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isActive
                      ? 'bg-slate-800/80 border-blue-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-xs truncate">{exp.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${statusColor}`}>
                        {exp.status.toUpperCase()}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">
                          目前開啟中
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>指標: <strong className="text-slate-300">{exp.metricName}</strong></span>
                      <span>組別: <strong className="text-slate-300">{exp.variants.length} 組</strong></span>
                      <span>最後更新: <span className="font-mono">{dateStr}</span></span>
                      {exp.tags && exp.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {exp.tags.map((t) => (
                            <span key={t} className="bg-slate-800 text-slate-400 px-1.5 rounded text-[10px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 sm:self-center">
                    <button
                      onClick={() => {
                        onSelectExperiment(exp);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                    >
                      開啟載入
                    </button>

                    <button
                      onClick={() => handleDuplicate(exp.id)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="建立副本"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(exp.id, exp.name)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
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
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>支援將任何現有 A/B 數據匯入或將歷史實驗完整備份為標準 JSON / CSV。</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
