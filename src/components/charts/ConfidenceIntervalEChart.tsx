import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ComparisonResult } from '../../types/experiment';
import { useTheme } from '../../context/ThemeContext';

interface ConfidenceIntervalEChartProps {
  comparisons: ComparisonResult[];
}

export const ConfidenceIntervalEChart: React.FC<ConfidenceIntervalEChartProps> = ({
  comparisons,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    const isDark = resolvedTheme === 'dark';
    chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    const chart = chartInstance.current;

    if (comparisons.length === 0) {
      chart.clear();
      return;
    }

    const yCategories = comparisons.map((c) => c.variantName).reverse();

    const customData = comparisons
      .map((c, idx) => {
        const yIdx = comparisons.length - 1 - idx;
        const lower = c.absoluteLiftNewcombeCI.lower * 100;
        const upper = c.absoluteLiftNewcombeCI.upper * 100;
        const center = c.absoluteLift * 100;
        return [center, yIdx, lower, upper, c.variantName, c.isSignificant];
      })
      .reverse();

    const renderItem = (_params: any, api: any) => {
      const center = api.coord([api.value(0), api.value(1)]);
      const lower = api.coord([api.value(2), api.value(1)]);
      const upper = api.coord([api.value(3), api.value(1)]);
      const isSignificant = api.value(5);
      const isPositive = api.value(0) > 0;

      const strokeColor = isSignificant
        ? isPositive
          ? '#10b981'
          : '#f43f5e'
        : isDark
        ? '#94a3b8'
        : '#64748b';

      const style = {
        stroke: strokeColor,
        lineWidth: 2,
      };

      return {
        type: 'group',
        children: [
          {
            type: 'line',
            shape: {
              x1: lower[0],
              y1: lower[1],
              x2: upper[0],
              y2: upper[1],
            },
            style,
          },
          {
            type: 'line',
            shape: {
              x1: lower[0],
              y1: lower[1] - 6,
              x2: lower[0],
              y2: lower[1] + 6,
            },
            style,
          },
          {
            type: 'line',
            shape: {
              x1: upper[0],
              y1: upper[1] - 6,
              x2: upper[0],
              y2: upper[1] + 6,
            },
            style,
          },
          {
            type: 'circle',
            shape: {
              cx: center[0],
              cy: center[1],
              r: 4.5,
            },
            style: {
              fill: isDark ? '#ffffff' : '#0f172a',
              stroke: strokeColor,
              lineWidth: 2,
            },
          },
        ],
      };
    };

    const allValues = comparisons.flatMap((c) => [
      c.absoluteLiftNewcombeCI.lower * 100,
      c.absoluteLiftNewcombeCI.upper * 100,
      c.absoluteLift * 100,
    ]);

    const maxAbs = Math.max(0.5, ...allValues.map((v) => Math.abs(v))) * 1.25;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#e2e8f0' : '#0f172a', fontSize: 12 },
        formatter: (params: any) => {
          const val = params.value;
          const center = Number(val[0]).toFixed(2);
          const lower = Number(val[2]).toFixed(2);
          const upper = Number(val[3]).toFixed(2);
          const variantName = val[4];
          const isSig = val[5];
          const borderC = isDark ? '#334155' : '#e2e8f0';

          return `<div style="font-weight:600;margin-bottom:4px;border-bottom:1px solid ${borderC};padding-bottom:3px;">${variantName}</div>
            <div style="margin:2px 0;">絕對提升: <span style="font-family:monospace;font-weight:bold;color:${isDark ? '#38bdf8' : '#0284c7'};">${center > '0' ? '+' : ''}${center} pp</span></div>
            <div style="margin:2px 0;">95% Newcombe 信賴區間: <span style="font-family:monospace;">[${lower}%, ${upper}%]</span></div>
            <div style="margin-top:4px;font-size:11px;color:${isSig ? '#10b981' : '#94a3b8'};">
              ${isSig ? '● 統計顯著（未跨越 0 基準線）' : '○ 未達顯著（信賴區間包含 0）'}
            </div>`;
        },
      },
      grid: {
        left: '12%',
        right: '6%',
        top: '10%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: Number((-maxAbs).toFixed(2)),
        max: Number(maxAbs.toFixed(2)),
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: {
          color: isDark ? '#64748b' : '#64748b',
          fontSize: 10,
          formatter: (v: number) => `${v.toFixed(1)}%`,
        },
      },
      yAxis: {
        type: 'category',
        data: yCategories,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#334155', fontSize: 11 },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'custom',
          renderItem: renderItem as any,
          dimensions: ['center', 'yIndex', 'lower', 'upper', 'name', 'isSig'],
          encode: {
            x: [0, 2, 3],
            y: 1,
          },
          data: customData,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: isDark ? '#64748b' : '#94a3b8',
              type: 'dashed',
              width: 1.5,
            },
            data: [{ xAxis: 0, label: { formatter: '0 基準線', color: isDark ? '#64748b' : '#64748b', fontSize: 10 } }],
          },
        },
      ],
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [comparisons, resolvedTheme]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-48 min-w-0">
      <div ref={chartRef} className="w-full h-full min-w-0" />
    </div>
  );
};
