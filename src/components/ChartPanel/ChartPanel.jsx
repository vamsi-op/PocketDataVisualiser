/**
 * ChartPanel component
 * --------------------
 * Renders a chart using Chart.js (via react-chartjs-2) based on the selected
 * chart type and axis configuration. Includes an export toolbar.
 *
 * Props:
 *   suggestion: Suggestion   — from chartSuggest.js
 *   rows:       object[]
 *   headers:    string[]
 *   types:      Record<string, string>
 *   customization: { color, xLabel, yLabel, showGrid, showLegend }
 */
import { useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Scatter, Pie, Doughnut } from 'react-chartjs-2';
import { exportAsPng } from '../../utils/exportChart';
import './ChartPanel.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
);

const PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

/** Build a histogram frequency array from numeric data */
function buildHistogram(values, bins = 15) {
  const nums = values.map(Number).filter((n) => !Number.isNaN(n));
  if (!nums.length) return { labels: [], counts: [] };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const size = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  const labels = [];
  for (let i = 0; i < bins; i++) {
    const lo = min + i * size;
    const hi = lo + size;
    labels.push(`${lo.toFixed(1)}–${hi.toFixed(1)}`);
  }
  nums.forEach((n) => {
    let idx = Math.floor((n - min) / size);
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  });
  return { labels, counts };
}

export default function ChartPanel({ suggestion, rows, headers, types, customization }) {
  const chartRef = useRef(null);
  const { color = '#6366f1', xLabel, yLabel, showGrid = true, showLegend = true } = customization;

  const chartData = useMemo(() => {
    const { id, xKey, yKey } = suggestion;

    if (id === 'histogram') {
      const values = rows.map((r) => r[xKey]);
      const { labels, counts } = buildHistogram(values);
      return {
        labels,
        datasets: [{
          label: xKey,
          data: counts,
          backgroundColor: color + 'cc',
          borderColor: color,
          borderWidth: 1,
          borderRadius: 4,
        }],
      };
    }

    if (id === 'scatter') {
      return {
        datasets: [{
          label: `${xKey} vs ${yKey}`,
          data: rows
            .map((r) => ({ x: parseFloat(r[xKey]), y: parseFloat(r[yKey]) }))
            .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y)),
          backgroundColor: color + 'aa',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      };
    }

    if (id === 'pie' || id === 'doughnut') {
      // Aggregate: sum yKey per unique xKey value
      const agg = {};
      rows.forEach((r) => {
        const k = String(r[xKey] ?? 'N/A');
        agg[k] = (agg[k] ?? 0) + (parseFloat(r[yKey]) || 0);
      });
      const labels = Object.keys(agg).slice(0, 12);
      return {
        labels,
        datasets: [{
          data: labels.map((l) => agg[l]),
          backgroundColor: PALETTE.slice(0, labels.length).map((c) => c + 'cc'),
          borderColor: PALETTE.slice(0, labels.length),
          borderWidth: 1,
        }],
      };
    }

    // Bar / Line
    const labels = rows.map((r) => String(r[xKey] ?? '')).slice(0, 200);
    const values = rows.map((r) => parseFloat(r[yKey])).slice(0, 200);
    return {
      labels,
      datasets: [{
        label: yKey,
        data: values,
        backgroundColor: id === 'bar' ? color + 'cc' : color + '33',
        borderColor: color,
        borderWidth: id === 'line' ? 2 : 1,
        fill: id === 'line',
        tension: 0.35,
        borderRadius: id === 'bar' ? 4 : 0,
        pointRadius: id === 'line' ? 2 : 0,
        pointHoverRadius: 5,
      }],
    };
  }, [suggestion, rows, customization]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: showLegend },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: suggestion.id === 'pie' || suggestion.id === 'doughnut' ? {} : {
      x: {
        title: { display: !!xLabel, text: xLabel, color: '#94a3b8' },
        grid: { display: showGrid, color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', maxRotation: 45 },
      },
      y: {
        title: { display: !!yLabel, text: yLabel, color: '#94a3b8' },
        grid: { display: showGrid, color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' },
      },
    },
  };

  const ChartComponent = {
    bar: Bar, line: Line, scatter: Scatter,
    pie: Pie, doughnut: Doughnut, histogram: Bar,
  }[suggestion.id] ?? Bar;

  const chartName = suggestion.label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="chart-panel" role="figure" aria-label={`${suggestion.label} visualization`}>
      <div className="chart-toolbar">
        <h3 className="chart-panel-title">{suggestion.label}</h3>
        <div className="chart-actions">
          <button
            id={`export-png-${suggestion.id}`}
            className="btn btn-sm"
            onClick={() => exportAsPng(chartRef.current, chartName)}
            title="Download as PNG"
            aria-label="Download chart as PNG"
          >
            ↓ PNG
          </button>
        </div>
      </div>
      <p className="chart-reason">{suggestion.reason}</p>
      <div className="chart-canvas-wrapper">
        <ChartComponent
          ref={chartRef}
          data={chartData}
          options={commonOptions}
          aria-label={`${suggestion.label} chart`}
          role="img"
        />
      </div>
    </div>
  );
}
