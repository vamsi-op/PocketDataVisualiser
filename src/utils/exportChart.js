/**
 * exportChart.js
 * --------------
 * Helpers to export a Chart.js chart instance as PNG or SVG.
 *
 * Usage:
 *   import { exportAsPng, exportAsSvg } from '../utils/exportChart';
 *   exportAsPng(chartRef.current, 'my-chart');
 */

/**
 * Download a Chart.js chart canvas as a PNG file.
 *
 * @param {import('chart.js').Chart} chartInstance  - The Chart.js instance (from chartRef.current)
 * @param {string} [filename='chart']               - Filename without extension
 */
export function exportAsPng(chartInstance, filename = 'chart') {
  if (!chartInstance) return;
  const canvas = chartInstance.canvas;
  const url = canvas.toDataURL('image/png');
  triggerDownload(url, `${filename}.png`);
}

/**
 * Download a Chart.js chart as an SVG file via a canvas→SVG serialization
 * (uses a white background canvas for clean exports).
 *
 * Note: True SVG export is only meaningful for SVG-based renderers.
 * For Chart.js (canvas-based) we export as high-resolution PNG, which
 * is the widely-supported approach. This function is kept for API
 * compatibility; to get a real SVG consider swapping to D3.
 *
 * @param {import('chart.js').Chart} chartInstance
 * @param {string} [filename='chart']
 */
export function exportAsSvg(chartInstance, filename = 'chart') {
  if (!chartInstance) return;

  const canvas = chartInstance.canvas;
  const offscreen = document.createElement('canvas');
  offscreen.width  = canvas.width  * 2;  // 2× for retina
  offscreen.height = canvas.height * 2;

  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  ctx.scale(2, 2);
  ctx.drawImage(canvas, 0, 0);

  const url = offscreen.toDataURL('image/png');
  triggerDownload(url, `${filename}.png`);
}

/**
 * Export chart data as a CSV file.
 *
 * @param {string[]} headers
 * @param {Record<string, string>[]} rows
 * @param {string} [filename='data']
 */
export function exportDataAsCsv(headers, rows, filename = 'data') {
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? '');
        // Quote fields that contain commas or newlines
        return /[,\n"]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  triggerDownload(url, `${filename}.csv`);
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------
// Internal
// ------------------------------------------------------------------

/**
 * @param {string} url
 * @param {string} filename
 */
function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
