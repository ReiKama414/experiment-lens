import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface PowerCurveEChartProps {
  powerCurve: Array<{
    sampleSize: number;
    power: number;
    powerPercentage: number;
  }>;
  recommendedN: number;
}

export const PowerCurveEChart: React.FC<PowerCurveEChartProps> = ({
  powerCurve,
  recommendedN,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const chart = chartInstance.current;
    if (powerCurve.length === 0) {
      chart.clear();
      return;
    }

    const dataPoints = powerCurve.map((item) => [item.sampleSize, item.powerPercentage]);

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
          const [n, p] = params[0].data;
          return `<div style="font-weight:600;margin-bottom:3px;">每組樣本數: <span style="font-family:monospace;color:#38bdf8;">${Number(n).toLocaleString()}</span></div>
            <div>檢定力 (Power): <span style="font-family:monospace;font-weight:bold;color:#a78bfa;">${p}%</span></div>`;
        },
      },
      grid: {
        left: '4%',
        right: '4%',
        top: '12%',
        bottom: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`),
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: '{value}%',
        },
      },
      toolbox: {
        feature: {
          saveAsImage: {
            title: '儲存檢定力曲線 PNG',
            pixelRatio: 2,
            backgroundColor: '#0f172a',
          },
        },
        iconStyle: { borderColor: '#64748b' },
        right: '1%',
        top: '2%',
      },
      series: [
        {
          name: 'Power',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: dataPoints,
          lineStyle: {
            width: 2.5,
            color: '#6366f1',
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                yAxis: 80,
                lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.5 },
                label: { formatter: '80% 門檻', color: '#f59e0b', fontSize: 10, position: 'insideEndTop' },
              },
              {
                yAxis: 90,
                lineStyle: { color: '#10b981', type: 'dashed', width: 1.5 },
                label: { formatter: '90% 門檻', color: '#10b981', fontSize: 10, position: 'insideEndTop' },
              },
              {
                xAxis: recommendedN,
                lineStyle: { color: '#818cf8', type: 'solid', width: 2 },
                label: {
                  formatter: `規劃點: ${recommendedN.toLocaleString()}`,
                  color: '#818cf8',
                  fontSize: 10,
                  position: 'insideEndTop',
                },
              },
            ],
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
  }, [powerCurve, recommendedN]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};
