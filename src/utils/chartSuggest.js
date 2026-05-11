/**
 * chartSuggest.js
 * ---------------
 * Given a parsed dataset (headers + column types), returns a ranked list
 * of chart-type recommendations, each with:
 *   - id:      unique chart identifier (used to render the right component)
 *   - label:   human-readable chart name
 *   - reason:  why this chart fits the data
 *   - xKey:    suggested X-axis column
 *   - yKey:    suggested Y-axis column (may be null for single-column charts)
 *   - score:   relevance score (higher = better match)
 *
 * @typedef {'numeric'|'date'|'boolean'|'text'} ColumnType
 * @typedef {'bar'|'line'|'scatter'|'pie'|'doughnut'|'histogram'} ChartId
 *
 * @typedef {{ id: ChartId, label: string, reason: string, xKey: string, yKey: string|null, score: number }} Suggestion
 */

/**
 * @param {string[]} headers
 * @param {Record<string, ColumnType>} types
 * @returns {Suggestion[]}
 */
export function suggestCharts(headers, types) {
  if (!headers.length) return [];

  const numericCols = headers.filter((h) => types[h] === 'numeric');
  const dateCols    = headers.filter((h) => types[h] === 'date');
  const textCols    = headers.filter((h) => types[h] === 'text');
  const boolCols    = headers.filter((h) => types[h] === 'boolean');

  /** @type {Suggestion[]} */
  const suggestions = [];

  // ── Bar chart ──────────────────────────────────────────────────────
  // Best when there's at least one categorical (text/boolean) column + one numeric
  if ((textCols.length > 0 || boolCols.length > 0) && numericCols.length > 0) {
    const xKey = textCols[0] ?? boolCols[0];
    const yKey = numericCols[0];
    suggestions.push({
      id:     'bar',
      label:  'Bar Chart',
      reason: `Comparing "${yKey}" across "${xKey}" categories is exactly what bar charts do best.`,
      xKey,
      yKey,
      score:  90,
    });
  }

  // ── Line chart ─────────────────────────────────────────────────────
  // Best when there's a date/time axis + numeric values
  if (dateCols.length > 0 && numericCols.length > 0) {
    const xKey = dateCols[0];
    const yKey = numericCols[0];
    suggestions.push({
      id:     'line',
      label:  'Line Chart',
      reason: `"${xKey}" is a date column — line charts reveal trends and patterns over time.`,
      xKey,
      yKey,
      score:  95,
    });
  } else if (numericCols.length >= 2) {
    // Fallback: sequential numeric as X
    suggestions.push({
      id:     'line',
      label:  'Line Chart',
      reason: `Two numeric columns detected — a line chart can show how "${numericCols[1]}" changes relative to "${numericCols[0]}".`,
      xKey:   numericCols[0],
      yKey:   numericCols[1],
      score:  65,
    });
  }

  // ── Scatter plot ───────────────────────────────────────────────────
  // Best when there are 2+ numeric columns
  if (numericCols.length >= 2) {
    suggestions.push({
      id:     'scatter',
      label:  'Scatter Plot',
      reason: `Multiple numeric columns — a scatter plot reveals correlations between "${numericCols[0]}" and "${numericCols[1]}".`,
      xKey:   numericCols[0],
      yKey:   numericCols[1],
      score:  80,
    });
  }

  // ── Pie / Doughnut ─────────────────────────────────────────────────
  // Best for part-of-whole with a small number of categories
  if ((textCols.length > 0 || boolCols.length > 0) && numericCols.length > 0) {
    const xKey = textCols[0] ?? boolCols[0];
    const yKey = numericCols[0];
    suggestions.push({
      id:     'pie',
      label:  'Pie Chart',
      reason: `Shows the proportion each "${xKey}" category contributes to the total "${yKey}".`,
      xKey,
      yKey,
      score:  70,
    });
    suggestions.push({
      id:     'doughnut',
      label:  'Doughnut Chart',
      reason: `A cleaner alternative to pie — highlights part-of-whole distribution of "${yKey}".`,
      xKey,
      yKey,
      score:  68,
    });
  }

  // ── Histogram ──────────────────────────────────────────────────────
  // Best for a single numeric column distribution
  if (numericCols.length >= 1) {
    suggestions.push({
      id:     'histogram',
      label:  'Histogram',
      reason: `Shows the frequency distribution of "${numericCols[0]}" — great for spotting skewness or outliers.`,
      xKey:   numericCols[0],
      yKey:   null,
      score:  75,
    });
  }

  // Sort by score descending; limit to top 5 suggestions
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Given a chart suggestion, return human-readable axis labels.
 * @param {Suggestion} suggestion
 * @returns {{ xLabel: string, yLabel: string }}
 */
export function getAxisLabels(suggestion) {
  return {
    xLabel: suggestion.xKey ?? '',
    yLabel: suggestion.yKey ?? 'Count',
  };
}
