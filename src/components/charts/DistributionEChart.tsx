import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { Variant } from '../../types/experiment';
import { normalPDF } from '../../utils/stats';

interface DistributionEChartProps {
  variants: Variant[];
}

export const DistributionEChart: React.FC<DistributionEChartProps> = ({ variants }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

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

    const colors = ['#f59e0b', '#38bdf8', '#34d399', '#a78bfa', '#fb7185'];

    const series: echarts.SeriesOption[] = stats.map((s, idx) => {
      const yValues = xData.map((x) => {
        if (s.se <= 0) return 0;
        const z = (x - s.p) / s.se;
        return Number((normalPDF(z) / s.se).toFixed(2));
      });

      const color = s.isControl ? '#f59e0b' : colors[(idx) % colors.length];

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
            { offset: 0, color: `${color}40` },
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
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const xIdx = params[0].dataIndex;
          const rateVal = (xData[xIdx] * 100).toFixed(2);
          let str = `<div style="font-weight:600;margin-bottom:4px;border-bottom:1px solid #334155;padding-bottom:3px;">轉換率: ${rateVal}%</div>`;
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
        top: 4,
        right: 12,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        icon: 'circle',
      },
      grid: {
        left: '2%',
        right: '3%',
        top: '14%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xData.map((v) => `${(v * 100).toFixed(2)}%`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
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
            backgroundColor: '#0f172a',
          },
        },
        iconStyle: { borderColor: '#64748b' },
        right: '1%',
        top: '2%',
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
  }, [variants]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-72">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};
