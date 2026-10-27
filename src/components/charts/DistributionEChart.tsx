import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { Variant } from '../../types/experiment';
import { normalPDF } from '../../utils/stats';
import { useTheme } from '../../context/ThemeContext';

interface DistributionEChartProps {
  variants: Variant[];
}

export const DistributionEChart: React.FC<DistributionEChartProps> = ({ variants }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose old instance on theme change or init
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    const isDark = resolvedTheme === 'dark';
    chartInstance.current = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    const chart = chartInstance.current;

    const validVariants = variants.filter((v) => v.visitors > 0);
    if (validVariants.length === 0) {
      chart.clear();
      return;
    }

    const stats = validVariants.map((v) => {
      const p = v.conversions / v.visitors;
      const se = Math.sqrt((p * (1 - p)) / v.visitors);
      return { id: v.id, name: v.name, p, se, isControl: v.isControl };
    });

    let minX = Math.min(...stats.map((s) => s.p - 3.5 * s.se));
    let maxX = Math.max(...stats.map((s) => s.p + 3.5 * s.se));
    minX = Math.max(0, minX);
    maxX = Math.min(1, maxX);

    if (minX >= maxX) {
      minX = 0;
      maxX = 0.1;
    }

    const steps = 100;
    const stepSize = (maxX - minX) / steps;
    const xData: number[] = [];
    for (let i = 0; i <= steps; i++) {
      xData.push(Number((minX + i * stepSize).toFixed(5)));
    }

    const colors = isDark
      ? ['#f59e0b', '#38bdf8', '#34d399', '#a78bfa', '#fb7185']
      : ['#d97706', '#0284c7', '#059669', '#7c3aed', '#e11d48'];

    const series: echarts.SeriesOption[] = stats.map((s, idx) => {
      const yValues = xData.map((x) => {
        if (s.se <= 0) return 0;
        const z = (x - s.p) / s.se;
        return Number((normalPDF(z) / s.se).toFixed(2));
      });

      const color = s.isControl ? colors[0] : colors[idx % colors.length];

      return {
        name: s.isControl ? `${s.name} (對照組)` : s.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: yValues,
        lineStyle: {
          width: 2,
          color,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}35` },
            { offset: 1, color: `${color}00` },
          ]),
        },
      };
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#e2e8f0' : '#0f172a', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const xIdx = params[0].dataIndex;
          const rateVal = (xData[xIdx] * 100).toFixed(2);
          const borderC = isDark ? '#334155' : '#e2e8f0';
          let str = `<div style="font-weight:600;margin-bottom:4px;border-bottom:1px solid ${borderC};padding-bottom:3px;">轉換率: ${rateVal}%</div>`;
          params.forEach((item: any) => {
            str += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0;">
              <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};margin-right:6px;"></span>${item.seriesName}</span>
              <span style="font-family:monospace;font-weight:bold;">${item.value}</span>
            </div>`;
          });
          return str;
        },
      },
      legend: {
        type: 'scroll',
        top: 6,
        left: 12,
        right: 48,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
        icon: 'circle',
      },
      grid: {
        left: 12,
        right: 16,
        top: 48,
        bottom: 28,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xData.map((v) => `${(v * 100).toFixed(2)}%`),
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        axisLabel: {
          color: isDark ? '#64748b' : '#64748b',
          fontSize: 10,
          margin: 10,
          interval: Math.floor(steps / 6),
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      toolbox: {
        feature: {
          saveAsImage: {
            title: '儲存圖表 PNG',
            pixelRatio: 2,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
          },
        },
        iconStyle: { borderColor: isDark ? '#64748b' : '#94a3b8' },
        right: 12,
        top: 6,
      },
      series,
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [variants, resolvedTheme]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-72 min-w-0">
      <div ref={chartRef} className="w-full h-full min-w-0" />
    </div>
  );
};
