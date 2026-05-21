/**
 * dataInsights.js
 * ---------------
 * Lightweight, no-API heuristic insight generator.
 * Given parsed data, returns a one-line human-readable observation.
 *
 * Examples:
 *   "Revenue peaks in December ($88,000)"
 *   "Strong positive correlation between GDP and Life_Expectancy (r ≈ 0.87)"
 *   "Sales are 63% higher in the top category (Electronics) vs the average"
 */

/**
 * Format a number compactly.
 * @param {number} n
 */
function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Pearson correlation coefficient between two equal-length arrays.
 * @param {number[]} xs
 * @param {number[]} ys
 */
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Detect a simple linear trend (positive / negative / flat) for a numeric column.
 * Returns slope sign: 1, -1, or 0.
 * @param {number[]} vals
 */
function trendSign(vals) {
  const n = vals.length;
  if (n < 2) return 0;
  const xs = vals.map((_, i) => i);
  const r = pearson(xs, vals);
  if (r > 0.5) return 1;
  if (r < -0.5) return -1;
  return 0;
}

/**
 * Generate a one-line insight for the given parsed data and suggestion.
 *
 * @param {string[]} headers
 * @param {Record<string,string>[]} rows
 * @param {Record<string,string>} types
 * @param {{ xKey: string, yKey: string|null, id: string }} suggestion
 * @returns {string|null}
 */
export function generateInsight(headers, rows, types, suggestion) {
  if (!rows.length || !suggestion) return null;

  const { xKey, yKey, id } = suggestion;

  // ── Correlation insight (scatter) ─────────────────────────────────────────
  if (id === 'scatter' && yKey) {
    const xs = rows.map((r) => parseFloat(r[xKey])).filter((n) => !Number.isNaN(n));
    const ys = rows.map((r) => parseFloat(r[yKey])).filter((n) => !Number.isNaN(n));
    const n = Math.min(xs.length, ys.length);
    if (n >= 3) {
      const r = pearson(xs.slice(0, n), ys.slice(0, n));
      const abs = Math.abs(r);
      if (abs > 0.75) {
        const dir = r > 0 ? 'positive' : 'negative';
        return `📈 Strong ${dir} correlation between ${xKey} and ${yKey} (r ≈ ${r.toFixed(2)})`;
      }
      if (abs > 0.4) {
        const dir = r > 0 ? 'positive' : 'negative';
        return `📊 Moderate ${dir} correlation between ${xKey} and ${yKey} (r ≈ ${r.toFixed(2)})`;
      }
      return `🔀 Weak or no correlation between ${xKey} and ${yKey} (r ≈ ${r.toFixed(2)})`;
    }
  }

  // ── Peak/trough insight (bar / line) ─────────────────────────────────────
  if ((id === 'bar' || id === 'line') && yKey && types[yKey] === 'numeric') {
    const pairs = rows
      .map((r) => ({ label: String(r[xKey] ?? ''), val: parseFloat(r[yKey]) }))
      .filter((p) => !Number.isNaN(p.val));
    if (pairs.length >= 2) {
      const max = pairs.reduce((a, b) => (b.val > a.val ? b : a));
      const min = pairs.reduce((a, b) => (b.val < a.val ? b : a));
      const avg = pairs.reduce((a, b) => a + b.val, 0) / pairs.length;
      const pctAbove = ((max.val - avg) / avg * 100).toFixed(0);

      // Trend for line charts
      if (id === 'line') {
        const vals = pairs.map((p) => p.val);
        const sign = trendSign(vals);
        const trendText = sign === 1 ? 'upward' : sign === -1 ? 'downward' : 'flat';
        if (sign !== 0) {
          return `📈 ${yKey} shows an overall ${trendText} trend — peaks at ${max.label} (${fmt(max.val)})`;
        }
      }

      return `🏆 ${yKey} peaks at "${max.label}" (${fmt(max.val)}), which is ${pctAbove}% above average — lowest at "${min.label}" (${fmt(min.val)})`;
    }
  }

  // ── Distribution insight (histogram) ─────────────────────────────────────
  if (id === 'histogram' && types[xKey] === 'numeric') {
    const vals = rows.map((r) => parseFloat(r[xKey])).filter((n) => !Number.isNaN(n));
    if (vals.length >= 4) {
      const sorted = [...vals].sort((a, b) => a - b);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const skew = mean > median * 1.1 ? 'right-skewed' : mean < median * 0.9 ? 'left-skewed' : 'roughly symmetric';
      return `📊 ${xKey} distribution is ${skew} — mean ${fmt(mean)}, median ${fmt(median)}, range ${fmt(sorted[0])}–${fmt(sorted[sorted.length - 1])}`;
    }
  }

  // ── Pie/donut dominance insight ───────────────────────────────────────────
  if ((id === 'pie' || id === 'doughnut') && yKey) {
    const agg = {};
    rows.forEach((r) => {
      const k = String(r[xKey] ?? 'N/A');
      agg[k] = (agg[k] ?? 0) + (parseFloat(r[yKey]) || 0);
    });
    const total = Object.values(agg).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const top = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
      const pct = ((top[1] / total) * 100).toFixed(1);
      return `🥇 "${top[0]}" dominates ${yKey} with ${pct}% of the total (${fmt(top[1])} of ${fmt(total)})`;
    }
  }

  return null;
}
