import React from 'react';
import type { Variant } from '../types/experiment';
import { Plus, Trash2, Crown, AlertTriangle } from 'lucide-react';
import { calculateWilsonCI } from '../utils/stats';

interface VariantTableProps {
  variants: Variant[];
  onChangeVariants: (variants: Variant[]) => void;
  confidenceLevel: number;
}

export const VariantTable: React.FC<VariantTableProps> = ({
  variants,
  onChangeVariants,
  confidenceLevel,
}) => {
  const handleUpdate = (id: string, field: keyof Variant, value: any) => {
    const updated = variants.map((v) => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    });
    onChangeVariants(updated);
  };

  const handleSetControl = (id: string) => {
    const updated = variants.map((v) => ({
      ...v,
      isControl: v.id === id,
    }));
    onChangeVariants(updated);
  };

  const handleAddVariant = () => {
    const nextChar = String.fromCharCode(65 + variants.length);
    const count = variants.length + 1;
    const defaultSplit = Math.round((100 / count) * 10) / 10;

    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      name: `實驗組 ${nextChar}`,
      visitors: 10000,
      conversions: 500,
      expectedTrafficPercent: defaultSplit,
      isControl: false,
    };

    const updated = [...variants, newVariant].map((v) => ({
      ...v,
      expectedTrafficPercent: defaultSplit,
    }));
    onChangeVariants(updated);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 2) return;
    const remaining = variants.filter((v) => v.id !== id);
    if (!remaining.some((v) => v.isControl)) {
      remaining[0].isControl = true;
    }
    const defaultSplit = Math.round((100 / remaining.length) * 10) / 10;
    const updated = remaining.map((v) => ({
      ...v,
      expectedTrafficPercent: defaultSplit,
    }));
    onChangeVariants(updated);
  };

  const totalVisitors = variants.reduce((sum, v) => sum + (Number(v.visitors) || 0), 0);
  const totalConversions = variants.reduce((sum, v) => sum + (Number(v.conversions) || 0), 0);
  const totalTrafficWeight = variants.reduce(
    (sum, v) => sum + (v.expectedTrafficPercent !== undefined ? Number(v.expectedTrafficPercent) : 0),
    0
  );

  return (
    <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-colors min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>實驗組別與樣本數據</span>
            <span className="text-[11px] bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-mono px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              {variants.length} 組變體
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            請輸入各組別的「訪客樣本數 (N)」與「成功轉換數 (x)」，系統即時計算轉換率與雙樣本統計檢定。
          </p>
        </div>

        <button
          onClick={handleAddVariant}
          disabled={variants.length >= 6}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 rounded-lg text-xs sm:text-sm font-medium transition self-start sm:self-auto shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>新增變體組</span>
        </button>
      </div>

      {/* Table Container - with horizontal scroll container to prevent page blowout */}
      <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
        <table className="w-full text-left text-xs sm:text-sm min-w-[620px] table-dense">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider font-mono">
              <th className="py-2.5 px-2.5 w-12 text-center">基準組</th>
              <th className="py-2.5 px-2.5 min-w-[160px]">組別名稱</th>
              <th className="py-2.5 px-2.5 min-w-[110px]">
                訪客數 (N)
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block normal-case font-normal">樣本總量</span>
              </th>
              <th className="py-2.5 px-2.5 min-w-[110px]">
                轉換數 (x)
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block normal-case font-normal">成功件數</span>
              </th>
              <th className="py-2.5 px-2.5 min-w-[150px]">
                轉換率 (CR)
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block normal-case font-normal">
                  {(confidenceLevel * 100).toFixed(0)}% Wilson CI
                </span>
              </th>
              <th className="py-2.5 px-2.5 min-w-[100px]">
                預期分流 %
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block normal-case font-normal">SRM 權重</span>
              </th>
              <th className="py-2.5 px-2.5 w-12 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {variants.map((v) => {
              const visitors = Math.max(0, Number(v.visitors) || 0);
              const conversions = Math.max(0, Number(v.conversions) || 0);
              const hasError = conversions > visitors;
              const cr = visitors > 0 ? (conversions / visitors) * 100 : 0;
              const alpha = 1 - confidenceLevel;
              const wilson = calculateWilsonCI(conversions, visitors, alpha);

              return (
                <tr
                  key={v.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                    v.isControl ? 'bg-zinc-100/40 dark:bg-zinc-800/30' : ''
                  }`}
                >
                  {/* Control Selector */}
                  <td className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetControl(v.id)}
                      className={`p-1.5 rounded-md transition ${
                        v.isControl
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                      title={v.isControl ? '目前為對照基準組 (Control)' : '設為對照組'}
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                  </td>

                  {/* Name Input */}
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleUpdate(v.id, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-xs sm:text-sm"
                        placeholder="例如：對照組 A"
                      />
                      {v.isControl && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                          Control
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Visitors (N) */}
                  <td className="py-2.5 px-2.5">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={v.visitors === 0 ? '' : v.visitors}
                      onChange={(e) =>
                        handleUpdate(v.id, 'visitors', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-xs sm:text-sm text-right"
                      placeholder="10000"
                    />
                  </td>

                  {/* Conversions (x) */}
                  <td className="py-2.5 px-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={v.conversions === 0 ? '' : v.conversions}
                        onChange={(e) =>
                          handleUpdate(
                            v.id,
                            'conversions',
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className={`w-full bg-white dark:bg-zinc-800 border rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none text-xs sm:text-sm text-right ${
                          hasError
                            ? 'border-rose-500 text-rose-600 dark:text-rose-300 focus:ring-1 focus:ring-rose-500'
                            : 'border-zinc-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500'
                        }`}
                        placeholder="500"
                      />
                      {hasError && (
                        <div
                          className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 flex items-center justify-end gap-0.5 font-mono"
                          title="轉換數不可大於訪客數"
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>x &gt; N 異常</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Conversion Rate & Wilson Interval */}
                  <td className="py-2.5 px-2.5">
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                          {cr.toFixed(2)}%
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          [{(wilson.lower * 100).toFixed(2)}% - {(wilson.upper * 100).toFixed(2)}%]
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            v.isControl ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-400'
                          }`}
                          style={{ width: `${Math.min(100, cr * 3)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Expected Traffic % */}
                  <td className="py-2.5 px-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={v.expectedTrafficPercent ?? ''}
                        onChange={(e) =>
                          handleUpdate(
                            v.id,
                            'expectedTrafficPercent',
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-xs sm:text-sm text-right pr-6"
                        placeholder="50"
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-zinc-400 font-mono">
                        %
                      </span>
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="py-2.5 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      disabled={variants.length <= 2}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title={variants.length <= 2 ? '至少保留兩組變體進行 A/B 比較' : '刪除此變體'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border-t border-zinc-200 dark:border-zinc-700 font-mono">
              <td colSpan={2} className="py-2.5 px-2.5">
                總計合計
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono text-zinc-900 dark:text-zinc-100">
                {totalVisitors.toLocaleString()}
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono text-zinc-900 dark:text-zinc-100">
                {totalConversions.toLocaleString()}
              </td>
              <td className="py-2.5 px-2.5">
                <span className="font-mono text-zinc-500 dark:text-zinc-400">
                  全體 CR:{' '}
                  {totalVisitors > 0
                    ? ((totalConversions / totalVisitors) * 100).toFixed(2) + '%'
                    : '0%'}
                </span>
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono">
                <span
                  className={
                    Math.abs(totalTrafficWeight - 100) > 0.5
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }
                  title="所有組別預期分流百分比總和應為 100%"
                >
                  {totalTrafficWeight.toFixed(1)}%
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {Math.abs(totalTrafficWeight - 100) > 0.5 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-800/40 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            注意：目前預期分流百分比總和為 {totalTrafficWeight.toFixed(1)}%（非 100%），這會影響 SRM 樣本比例檢定之期望值。
          </span>
        </div>
      )}
    </div>
  );
};
