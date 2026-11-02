import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ComparisonResult } from '../../types/experiment';
import { useTheme } from '../../context/ThemeContext';

interface ConfidenceIntervalEChartProps {
  comparisons: ComparisonResult[];
  confidenceLevel?: number;
}

export const ConfidenceIntervalEChart: React.FC<ConfidenceIntervalEChartProps> = ({
  comparisons,
  confidenceLevel = 0.95,
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
    const confidencePct = (confidenceLevel * 100).toFixed(0);
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
        ? '#a1a1aa'
        : '#71717a';

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
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderColor: isDark ? '#27272a' : '#e4e4e7',
        textStyle: { color: isDark ? '#fafafa' : '#09090b', fontSize: 12 },
        extraCssText: `box-shadow: ${isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)'}; border-radius: 8px;`,
        formatter: (params: any) => {
          const val = params.value;
          const center = Number(val[0]).toFixed(2);
          const lower = Number(val[2]).toFixed(2);
          const upper = Number(val[3]).toFixed(2);
          const variantName = val[4];
          const isSig = val[5];
          const borderC = isDark ? '#27272a' : '#e4e4e7';

          return `<div style="font-weight:600;margin-bottom:4px;border-bottom:1px solid ${borderC};padding-bottom:3px;">${variantName}</div>
            <div style="margin:2px 0;">絕對提升: <span style="font-family:monospace;font-weight:bold;color:${isDark ? '#38bdf8' : '#0284c7'};">${Number(center) > 0 ? '+' : ''}${center} pp</span></div>
            <div style="margin:2px 0;">${confidencePct}% Newcombe 信賴區間: <span style="font-family:monospace;">[${lower}%, ${upper}%]</span></div>
            <div style="margin-top:4px;font-size:11px;color:${isSig ? '#10b981' : '#a1a1aa'};">
              ${isSig ? '● 統計顯著（未跨越 0 基準線）' : '○ 未達顯著（信賴區間包含 0）'}
            </div>`;
        },
      },
      grid: {
        left: 16,
        right: 28,
        top: 24,
        bottom: 32,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: Number((-maxAbs).toFixed(2)),
        max: Number(maxAbs.toFixed(2)),
        axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#d4d4d8' } },
        splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f4f4f5' } },
        axisLabel: {
          color: isDark ? '#71717a' : '#71717a',
          fontSize: 10,
          margin: 10,
          formatter: (v: number) => `${v.toFixed(1)}%`,
        },
      },
      yAxis: {
        type: 'category',
        data: yCategories,
        axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#d4d4d8' } },
        axisLabel: {
          color: isDark ? '#a1a1aa' : '#52525b',
          fontSize: 11,
          margin: 12,
          width: 120,
          overflow: 'truncate',
          ellipsis: '...',
        },
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
              color: isDark ? '#71717a' : '#a1a1aa',
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
  }, [comparisons, resolvedTheme, confidenceLevel]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  const chartHeight = Math.max(180, comparisons.length * 60 + 50);

  return (
    <div className="w-full min-w-0" style={{ height: `${chartHeight}px` }}>
      <div ref={chartRef} className="w-full h-full min-w-0" />
    </div>
  );
};
