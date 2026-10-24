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
    const nextChar = String.fromCharCode(65 + variants.length); // A, B, C, D...
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>實驗組別與樣本數據</span>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              {variants.length} 組變體
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            請輸入各組別的「訪客樣本數 (N)」與「成功轉換數 (x)」，系統即時計算轉換率與雙樣本統計檢定。
          </p>
        </div>

        <button
          onClick={handleAddVariant}
          disabled={variants.length >= 6}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-medium transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新增變體組</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">基準組</th>
              <th className="py-3 px-3 min-w-[180px]">組別名稱</th>
              <th className="py-3 px-3 min-w-[130px]">
                訪客數 (N)
                <span className="text-[10px] text-slate-500 block normal-case font-normal">樣本總量</span>
              </th>
              <th className="py-3 px-3 min-w-[130px]">
                轉換數 (x)
                <span className="text-[10px] text-slate-500 block normal-case font-normal">成功件數</span>
              </th>
              <th className="py-3 px-3 min-w-[150px]">
                轉換率 (CR)
                <span className="text-[10px] text-slate-500 block normal-case font-normal">
                  {(confidenceLevel * 100).toFixed(0)}% Wilson CI
                </span>
              </th>
              <th className="py-3 px-3 min-w-[110px]">
                預期分流 %
                <span className="text-[10px] text-slate-500 block normal-case font-normal">SRM 權重</span>
              </th>
              <th className="py-3 px-3 w-12 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
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
                  className={`hover:bg-slate-800/40 transition-colors ${
                    v.isControl ? 'bg-blue-950/20' : ''
                  }`}
                >
                  {/* Control Radio */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetControl(v.id)}
                      className={`p-1.5 rounded-lg transition ${
                        v.isControl
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={v.isControl ? '目前為對照基準組 (Control)' : '設為對照組'}
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                  </td>

                  {/* Name Input */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleUpdate(v.id, 'name', e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500 transition text-sm"
                        placeholder="例如：對照組 A"
                      />
                      {v.isControl && (
                        <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono shrink-0">
                          Control
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Visitors (N) */}
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={v.visitors === 0 ? '' : v.visitors}
                      onChange={(e) =>
                        handleUpdate(v.id, 'visitors', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500 transition text-sm text-right"
                      placeholder="10000"
                    />
                  </td>

                  {/* Conversions (x) */}
                  <td className="py-3 px-3">
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
                        className={`w-full bg-slate-800/80 border rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none transition text-sm text-right ${
                          hasError
                            ? 'border-rose-500 text-rose-300 focus:border-rose-400'
                            : 'border-slate-700 focus:border-blue-500'
                        }`}
                        placeholder="500"
                      />
                      {hasError && (
                        <span
                          className="absolute -bottom-4 right-0 text-[10px] text-rose-400 flex items-center gap-0.5"
                          title="轉換數不可大於訪客數"
                        >
                          <AlertTriangle className="w-3 h-3" /> x &gt; N
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Conversion Rate & Wilson Interval */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono font-bold text-white text-base">
                          {cr.toFixed(2)}%
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          [{(wilson.lower * 100).toFixed(2)}% - {(wilson.upper * 100).toFixed(2)}%]
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            v.isControl ? 'bg-amber-400' : 'bg-blue-400'
                          }`}
                          style={{ width: `${Math.min(100, cr * 3)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Expected Traffic % */}
                  <td className="py-3 px-3">
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
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500 transition text-sm text-right pr-6"
                        placeholder="50"
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-mono">
                        %
                      </span>
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      disabled={variants.length <= 2}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
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
            <tr className="bg-slate-900/90 text-xs font-semibold text-slate-300 border-t border-slate-700">
              <td colSpan={2} className="py-2.5 px-3">
                總計合計
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-white">
                {totalVisitors.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-white">
                {totalConversions.toLocaleString()}
              </td>
              <td className="py-2.5 px-3">
                <span className="font-mono text-slate-400">
                  全體 CR:{' '}
                  {totalVisitors > 0
                    ? ((totalConversions / totalVisitors) * 100).toFixed(2) + '%'
                    : '0%'}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right font-mono">
                <span
                  className={
                    Math.abs(totalTrafficWeight - 100) > 0.5
                      ? 'text-amber-400'
                      : 'text-emerald-400'
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
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            注意：目前預期分流百分比總和為 {totalTrafficWeight.toFixed(1)}%（非 100%），這會影響 SRM 樣本比例檢定之期望值。
          </span>
        </div>
      )}
    </div>
  );
};
