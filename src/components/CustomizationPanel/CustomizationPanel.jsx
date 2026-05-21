/**
 * CustomizationPanel component v1.1
 * -----------------------------------
 * Sidebar with controls to customize chart appearance.
 *
 * Props:
 *   suggestion:       current Suggestion
 *   headers:          string[]
 *   types:            Record<string, string>
 *   customization:    { color, xLabel, yLabel, showGrid, showLegend, yKeys }
 *   onChange(updates) — partial update callback
 *   onAxisChange({ xKey, yKey }) — update axis columns
 */
import './CustomizationPanel.css';

const PRESET_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

export default function CustomizationPanel({
  suggestion,
  headers,
  types,
  customization,
  onChange,
  onAxisChange,
}) {
  const { color, xLabel, yLabel, showGrid, showLegend, yKeys = [] } = customization;
  const isPolar     = suggestion.id === 'pie' || suggestion.id === 'doughnut';
  const isMultiAble = suggestion.id === 'bar' || suggestion.id === 'line';

  // Numeric columns available for multi-series Y
  const numericHeaders = headers.filter((h) => types?.[h] === 'numeric');

  function toggleYKey(key) {
    const next = yKeys.includes(key)
      ? yKeys.filter((k) => k !== key)
      : [...yKeys, key];
    // Always keep at least one selected
    if (next.length === 0) return;
    // Only update yKeys — do NOT call onAxisChange here, as it would
    // reset yKeys to a single-item array inside handleAxisChange.
    onChange({ yKeys: next, yLabel: next[0] });
  }

  return (
    <aside className="customization-panel" aria-label="Chart customization options">
      <h3 className="cp-title">⚙ Customize</h3>

      {/* ── Color ── */}
      <div className="cp-group">
        <label className="cp-label" htmlFor="color-picker">Chart Color</label>
        <div className="color-row">
          <input
            id="color-picker"
            type="color"
            value={color}
            onChange={(e) => onChange({ color: e.target.value })}
            aria-label="Pick chart color"
          />
          <div className="color-presets">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? 'color-swatch--active' : ''}`}
                style={{ background: c }}
                onClick={() => onChange({ color: c })}
                aria-label={`Set color to ${c}`}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Axis columns ── */}
      {!isPolar && (
        <>
          <div className="cp-group">
            <label className="cp-label" htmlFor="x-axis-select">X Axis Column</label>
            <select
              id="x-axis-select"
              value={suggestion.xKey}
              onChange={(e) => onAxisChange({ xKey: e.target.value, yKey: suggestion.yKey })}
            >
              {headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          {suggestion.yKey && (
            <div className="cp-group">
              <label className="cp-label" htmlFor="y-axis-select">Y Axis Column</label>
              <select
                id="y-axis-select"
                value={suggestion.yKey}
                onChange={(e) => onAxisChange({ xKey: suggestion.xKey, yKey: e.target.value })}
              >
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}
        </>
      )}

      {/* ── Multi-series Y selector ── */}
      {isMultiAble && numericHeaders.length > 1 && (
        <div className="cp-group">
          <label className="cp-label">Multi-Series Y Columns</label>
          <p className="cp-hint">Check multiple to overlay on one chart</p>
          <div className="multi-series-list">
            {numericHeaders.map((h) => (
              <label key={h} className="toggle-row">
                <input
                  type="checkbox"
                  checked={yKeys.includes(h)}
                  onChange={() => toggleYKey(h)}
                  id={`yk-${h}`}
                  aria-label={`Include ${h} in chart`}
                />
                <span>{h}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Axis Labels ── */}
      {!isPolar && (
        <>
          <div className="cp-group">
            <label className="cp-label" htmlFor="x-label-input">X Axis Label</label>
            <input
              id="x-label-input"
              type="text"
              value={xLabel}
              placeholder="e.g. Month"
              onChange={(e) => onChange({ xLabel: e.target.value })}
            />
          </div>
          <div className="cp-group">
            <label className="cp-label" htmlFor="y-label-input">Y Axis Label</label>
            <input
              id="y-label-input"
              type="text"
              value={yLabel}
              placeholder="e.g. Sales ($)"
              onChange={(e) => onChange({ yLabel: e.target.value })}
            />
          </div>
        </>
      )}

      {/* ── Toggles ── */}
      {!isPolar && (
        <div className="cp-group">
          <label className="cp-label">Display Options</label>
          <label className="toggle-row">
            <input
              id="show-grid-toggle"
              type="checkbox"
              checked={showGrid}
              onChange={(e) => onChange({ showGrid: e.target.checked })}
              role="switch"
              aria-checked={showGrid}
            />
            <span>Show grid lines</span>
          </label>
          <label className="toggle-row">
            <input
              id="show-legend-toggle"
              type="checkbox"
              checked={showLegend}
              onChange={(e) => onChange({ showLegend: e.target.checked })}
              role="switch"
              aria-checked={showLegend}
            />
            <span>Show legend</span>
          </label>
        </div>
      )}
    </aside>
  );
}
