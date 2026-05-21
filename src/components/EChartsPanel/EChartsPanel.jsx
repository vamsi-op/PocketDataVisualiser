/**
 * EChartsPanel.jsx
 * ----------------
 * Apache ECharts renderer using the echarts core directly (no echarts-for-react).
 * Cherry-picks only needed modules to minimise bundle size.
 *
 * Supports: Bar, Line, Scatter, Pie, Doughnut, Histogram
 *
 * Props: identical to ChartPanel.jsx
 */
import { useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, ScatterChart, PieChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import './EChartsPanel.css';

// Register only what we need — keeps the bundle lean
echarts.use([
  BarChart, LineChart, ScatterChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, TitleComponent,
  CanvasRenderer,
]);

const PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

function buildHistogram(values, bins = 15) {
  const nums = values.map(Number).filter((n) => !Number.isNaN(n));
  if (!nums.length) return { labels: [], counts: [] };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const size = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  const labels = [];
  for (let i = 0; i < bins; i++) {
    labels.push(`${(min + i * size).toFixed(1)}–${(min + (i + 1) * size).toFixed(1)}`);
  }
  nums.forEach((n) => {
    let idx = Math.floor((n - min) / size);
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  });
  return { labels, counts };
}

function buildOption(suggestion, rows, customization) {
  const { id, xKey, yKey } = suggestion;
  const { color = '#6366f1', xLabel, yLabel, showGrid = true, showLegend = true, yKeys = [] } = customization;
  const activeYKeys = yKeys.length > 0 ? yKeys : (yKey ? [yKey] : []);

  const tooltipBase = {
    trigger: 'axis',
    backgroundColor: 'rgba(15,17,23,0.95)',
    borderColor: 'rgba(99,102,241,0.3)',
    borderWidth: 1,
    textStyle: { color: '#f1f5f9', fontSize: 12 },
    extraCssText: 'box-shadow:0 4px 24px rgba(0,0,0,.4);border-radius:8px;',
  };

  const gridOpt = { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true };

  // ── Histogram ──────────────────────────────────────────────────────────────
  if (id === 'histogram') {
    const { labels, counts } = buildHistogram(rows.map((r) => r[xKey]));
    return {
      tooltip: { ...tooltipBase, trigger: 'item' },
      grid: gridOpt,
      xAxis: {
        type: 'category', data: labels, name: xLabel || xKey, nameLocation: 'middle', nameGap: 30,
        axisLabel: { color: '#94a3b8', rotate: 30, fontSize: 10 },
        axisLine: { lineStyle: { color: '#334155' } }, splitLine: { show: false },
      },
      yAxis: {
        type: 'value', name: 'Count',
        axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { show: showGrid, lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [{ type: 'bar', data: counts, name: xKey,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: '#818cf8' } },
      }],
    };
  }

  // ── Scatter ────────────────────────────────────────────────────────────────
  if (id === 'scatter') {
    const data = rows
      .map((r) => [parseFloat(r[xKey]), parseFloat(r[yKey])])
      .filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y));
    return {
      tooltip: { trigger: 'item', backgroundColor: tooltipBase.backgroundColor,
        borderColor: tooltipBase.borderColor, borderWidth: 1, textStyle: tooltipBase.textStyle,
        extraCssText: tooltipBase.extraCssText },
      grid: gridOpt,
      xAxis: {
        type: 'value', name: xLabel || xKey, nameLocation: 'middle', nameGap: 30,
        axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { show: showGrid, lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'value', name: yLabel || yKey, nameLocation: 'middle', nameGap: 40,
        axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { show: showGrid, lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [{ type: 'scatter', data, name: `${xKey} vs ${yKey}`,
        symbolSize: 7, itemStyle: { color, opacity: 0.75 },
        emphasis: { itemStyle: { color: '#818cf8', opacity: 1 }, scale: 1.4 },
      }],
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 0 }],
    };
  }

  // ── Pie / Doughnut ─────────────────────────────────────────────────────────
  if (id === 'pie' || id === 'doughnut') {
    const agg = {};
    rows.forEach((r) => { const k = String(r[xKey] ?? 'N/A'); agg[k] = (agg[k] ?? 0) + (parseFloat(r[yKey]) || 0); });
    const pieData = Object.entries(agg).slice(0, 12)
      .map(([name, value], i) => ({ name, value, itemStyle: { color: PALETTE[i % PALETTE.length] } }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...tooltipBase },
      legend: { show: showLegend, bottom: '2%', type: 'scroll', textStyle: { color: '#94a3b8', fontSize: 11 } },
      series: [{
        type: 'pie', radius: id === 'doughnut' ? ['40%', '65%'] : '60%',
        center: ['50%', '48%'], data: pieData,
        label: { color: '#94a3b8', fontSize: 11 },
        emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(99,102,241,0.4)' },
          label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      }],
    };
  }

  // ── Multi-series Bar / Line ────────────────────────────────────────────────
  const labels = rows.map((r) => String(r[xKey] ?? '')).slice(0, 500);
  const series = activeYKeys.map((yk, i) => {
    const c = PALETTE[i % PALETTE.length];
    const base = { name: yk, data: rows.map((r) => parseFloat(r[yk]) || null).slice(0, 500),
      itemStyle: { color: c }, emphasis: { focus: 'series' } };
    if (id === 'line') {
      return { ...base, type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
        lineStyle: { width: 2, color: c },
        areaStyle: activeYKeys.length === 1 ? {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: c + '55' }, { offset: 1, color: c + '05' }] }
        } : null,
      };
    }
    return { ...base, type: 'bar', barMaxWidth: 40, itemStyle: { ...base.itemStyle, borderRadius: [4, 4, 0, 0] } };
  });

  return {
    tooltip: { ...tooltipBase, trigger: 'axis' },
    legend: { show: showLegend && activeYKeys.length > 1, top: 0,
      textStyle: { color: '#94a3b8', fontSize: 11 }, icon: 'roundRect' },
    grid: gridOpt,
    xAxis: {
      type: 'category', data: labels, name: xLabel || xKey, nameLocation: 'middle', nameGap: 30,
      axisLabel: { color: '#94a3b8', rotate: labels.length > 12 ? 30 : 0, fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: yLabel || (activeYKeys.length === 1 ? activeYKeys[0] : ''),
      nameLocation: 'middle', nameGap: 45,
      axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { show: showGrid, lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    dataZoom: labels.length > 30
      ? [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', height: 18, bottom: 0 }]
      : [],
    series,
  };
}

export default function EChartsPanel({ suggestion, rows, headers, types, customization }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);

  // Init chart instance once
  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current, null, { renderer: 'canvas' });
    const ro = new ResizeObserver(() => chartRef.current?.resize());
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chartRef.current?.dispose(); chartRef.current = null; };
  }, []);

  // Update option whenever data or customization changes
  const option = useMemo(() => buildOption(suggestion, rows, customization), [suggestion, rows, customization]);
  useEffect(() => { chartRef.current?.setOption(option, { notMerge: true }); }, [option]);

  const handleExport = useCallback(() => {
    const url = chartRef.current?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0a0b0f' });
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suggestion.label.toLowerCase().replace(/\s+/g, '-')}-echarts.png`;
    a.click();
  }, [suggestion.label]);

  return (
    <div className="echarts-panel" role="figure" aria-label={`${suggestion.label} (ECharts) visualization`}>
      <div className="echarts-toolbar">
        <h3 className="echarts-title">{suggestion.label}</h3>
        <div className="echarts-actions">
          <span className="echarts-badge">⚡ ECharts</span>
          <button
            id={`export-echarts-png-${suggestion.id}`}
            className="btn btn-sm"
            onClick={handleExport}
            title="Download as PNG"
            aria-label="Download chart as PNG"
          >
            ↓ PNG
          </button>
        </div>
      </div>
      <p className="echarts-reason">{suggestion.reason}</p>
      <div ref={containerRef} className="echarts-canvas-wrapper" style={{ width: '100%', height: '360px' }} />
    </div>
  );
}
