/**
 * App.jsx — Pocket Data Visualizer v1.1.0
 * ─────────────────────────────────────────
 * New in v1.1:
 *  • Dark / Light mode toggle (useTheme hook)
 *  • Shareable chart URLs (URL hash encoding)
 *  • Drag-to-reorder columns in the data table
 *  • Multi-series chart support (select multiple Y columns)
 *  • Local heuristic data insights (no API needed)
 *  • PWA offline support (via vite-plugin-pwa)
 */
import { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import DataTable from './components/DataTable/DataTable';
import ChartPanel from './components/ChartPanel/ChartPanel';
import EChartsPanel from './components/EChartsPanel/EChartsPanel';
import CustomizationPanel from './components/CustomizationPanel/CustomizationPanel';
import { parseFile, parseString } from './utils/csvParser';
import { suggestCharts } from './utils/chartSuggest';
import { exportDataAsCsv } from './utils/exportChart';
import { useTheme } from './hooks/useTheme';
import { useRenderer } from './hooks/useRenderer';
import { encodeStateToHash, decodeStateFromHash, buildShareUrl, clearHash } from './utils/urlHash';
import { generateInsight } from './utils/dataInsights';
import './App.css';

// ── Sample dataset ──────────────────────────────────────────────────────────
const SAMPLE_CSV = `Month,Revenue,Expenses,Profit
Jan,42000,28000,14000
Feb,38000,25000,13000
Mar,51000,31000,20000
Apr,47000,29000,18000
May,55000,33000,22000
Jun,61000,35000,26000
Jul,58000,34000,24000
Aug,67000,38000,29000
Sep,72000,40000,32000
Oct,69000,37000,32000
Nov,74000,41000,33000
Dec,88000,48000,40000`;

const DEFAULT_CUSTOMIZATION = {
  color:      '#6366f1',
  xLabel:     '',
  yLabel:     '',
  showGrid:   true,
  showLegend: true,
  // NOTE: yKeys lives in its own useState below — NOT here
};

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { renderer, toggle: toggleRenderer } = useRenderer();

  const [parsed,          setParsed]          = useState(null);
  const [suggestions,     setSuggestions]      = useState([]);
  const [activeIdx,       setActiveIdx]        = useState(0);
  const [customization,   setCustomization]    = useState(DEFAULT_CUSTOMIZATION);
  const [yKeys,           setYKeys]            = useState([]);   // multi-series Y columns — independent state
  const [activeSuggestion,setActiveSuggestion] = useState(null);
  const [loading,         setLoading]          = useState(false);
  const [fileName,        setFileName]         = useState('');
  const [rawCsv,          setRawCsv]           = useState('');
  const [shareMsg,        setShareMsg]         = useState('');
  const [insight,         setInsight]          = useState(null);

  // ── Restore from URL hash on mount ─────────────────────────────────────────
  useEffect(() => {
    const state = decodeStateFromHash();
    if (state?.csvString) {
      const result = parseString(state.csvString);
      applyParsed(result, state.fileName ?? 'shared.csv', state.csvString);
      if (state.customization) setCustomization((p) => ({ ...p, ...state.customization }));
      if (typeof state.chartIdx === 'number') {
        const sugs = suggestCharts(result.headers, result.types);
        setActiveIdx(state.chartIdx);
        setActiveSuggestion(sugs[state.chartIdx] ?? sugs[0] ?? null);
      }
      clearHash();
    }
  }, []);

  // ── Compute insight whenever active suggestion changes ──────────────────────
  useEffect(() => {
    if (!parsed || !activeSuggestion) { setInsight(null); return; }
    setInsight(generateInsight(parsed.headers, parsed.rows, parsed.types, activeSuggestion));
  }, [parsed, activeSuggestion]);

  // ── Process a parsed result ─────────────────────────────────────────────────
  function applyParsed(result, name, csv = '') {
    const sugs = suggestCharts(result.headers, result.types);
    setParsed(result);
    setSuggestions(sugs);
    setActiveIdx(0);
    setActiveSuggestion(sugs[0] ?? null);
    setRawCsv(csv);
    setFileName(name);
    const firstSug = sugs[0];
    setCustomization({
      ...DEFAULT_CUSTOMIZATION,
      xLabel: firstSug?.xKey ?? '',
      yLabel: firstSug?.yKey ?? '',
    });
    setYKeys(firstSug?.yKey ? [firstSug.yKey] : []);
  }

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    setLoading(true);
    try {
      // Read raw text for URL hash sharing
      const text = await file.text();
      const result = await parseFile(file);
      applyParsed(result, file.name, text);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load sample ─────────────────────────────────────────────────────────────
  function loadSample() {
    const result = parseString(SAMPLE_CSV);
    applyParsed(result, 'sample-revenue.csv', SAMPLE_CSV);
  }

  // ── Switch chart suggestion tab ──────────────────────────────────────────────
  function selectSuggestion(idx) {
    setActiveIdx(idx);
    const sug = suggestions[idx];
    setActiveSuggestion(sug);
    setCustomization((prev) => ({
      ...prev,
      xLabel: sug.xKey ?? '',
      yLabel: sug.yKey  ?? '',
    }));
    setYKeys(sug.yKey ? [sug.yKey] : []);
  }

  // ── Axis column override ─────────────────────────────────────────────────────
  function handleAxisChange({ xKey, yKey }) {
    setActiveSuggestion((prev) => ({ ...prev, xKey, yKey }));
    setCustomization((prev) => ({
      ...prev,
      xLabel: xKey,
      yLabel: yKey ?? '',
    }));
    // Only reset yKeys when changing Y-axis dropdown (single column selected)
    if (yKey) setYKeys([yKey]);
  }

  // ── Column reorder (drag) ────────────────────────────────────────────────────
  function handleColumnReorder(newHeaders) {
    setParsed((prev) => ({ ...prev, headers: newHeaders }));
  }

  // ── Share via URL hash ───────────────────────────────────────────────────────
  function handleShare() {
    if (!rawCsv) return;
    const url = buildShareUrl({
      csvString:    rawCsv,
      fileName,
      chartIdx:     activeIdx,
      customization,
    });
    if (!url) {
      setShareMsg('⚠ Dataset too large to encode in a URL (> 80 KB).');
      setTimeout(() => setShareMsg(''), 3000);
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('✅ Link copied to clipboard!');
      setTimeout(() => setShareMsg(''), 3000);
    }).catch(() => {
      // Fallback: push to hash so the user can copy the URL bar
      encodeStateToHash({ csvString: rawCsv, fileName, chartIdx: activeIdx, customization });
      setShareMsg('🔗 URL updated — copy from the address bar');
      setTimeout(() => setShareMsg(''), 4000);
    });
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    setParsed(null);
    setSuggestions([]);
    setActiveSuggestion(null);
    setFileName('');
    setRawCsv('');
    setInsight(null);
    clearHash();
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon" aria-hidden="true">📊</span>
            <span className="logo-text">Pocket Data Visualizer</span>
          </div>
          <p className="tagline">Drop a CSV. Get beautiful charts. Instantly.</p>
          <div className="header-badges">
            <span className="badge-pill">100% In-Browser</span>
            <span className="badge-pill">Privacy First</span>
            <span className="badge-pill">No Account Needed</span>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="header-glow" aria-hidden="true" />
      </header>

      <main className="app-main">
        {!parsed ? (
          /* ── Landing / Upload ── */
          <section className="upload-section" aria-label="Upload section">
            <FileUpload onFile={handleFile} />
            {loading && (
              <p className="loading-text" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                Parsing file…
              </p>
            )}
            <div className="sample-cta">
              <span className="sample-label">No file handy?</span>
              <button id="load-sample-btn" className="btn btn-ghost" onClick={loadSample}>
                Try sample dataset →
              </button>
            </div>
          </section>
        ) : (
          /* ── Results ── */
          <div className="results-layout">
            {/* ── File info bar ── */}
            <div className="file-info-bar">
              <span className="file-info-name">📄 {fileName}</span>
              <div className="file-info-actions">
                <button
                  id="share-btn"
                  className="btn btn-sm btn-ghost"
                  onClick={handleShare}
                  aria-label="Share chart via URL"
                  title="Copy shareable link"
                >
                  🔗 Share
                </button>
                <button
                  id="export-csv-btn"
                  className="btn btn-sm btn-ghost"
                  onClick={() => exportDataAsCsv(parsed.headers, parsed.rows, fileName.replace(/\.[^.]+$/, ''))}
                  aria-label="Export data as CSV"
                >
                  ↓ CSV
                </button>
                <button
                  id="new-file-btn"
                  className="btn btn-sm"
                  onClick={reset}
                  aria-label="Load a different file"
                >
                  ← New File
                </button>
              </div>
            </div>

            {/* Share feedback */}
            {shareMsg && (
              <div className="share-toast" role="status" aria-live="polite">
                {shareMsg}
              </div>
            )}

            {/* ── Data preview ── */}
            <details className="data-preview-details" open>
              <summary className="data-preview-summary">Data Preview</summary>
              <DataTable
                headers={parsed.headers}
                rows={parsed.rows}
                types={parsed.types}
                errors={parsed.errors}
                onReorder={handleColumnReorder}
              />
            </details>

            {/* ── Chart suggestion tabs ── */}
            {suggestions.length > 0 && (
              <section className="charts-section" aria-label="Chart suggestions">
                <div className="section-header">
                  <div className="section-title-row">
                    <h2 className="section-title">Suggested Charts</h2>
                    <div className="renderer-toggle" role="group" aria-label="Chart renderer">
                      <button
                        id="renderer-chartjs"
                        className={`renderer-btn ${renderer === 'chartjs' ? 'renderer-btn--active' : ''}`}
                        onClick={() => renderer !== 'chartjs' && toggleRenderer()}
                        aria-pressed={renderer === 'chartjs'}
                        title="Chart.js renderer"
                      >
                        📊 Chart.js
                      </button>
                      <button
                        id="renderer-echarts"
                        className={`renderer-btn ${renderer === 'echarts' ? 'renderer-btn--active' : ''}`}
                        onClick={() => renderer !== 'echarts' && toggleRenderer()}
                        aria-pressed={renderer === 'echarts'}
                        title="Apache ECharts — GPU-accelerated, 20+ chart types"
                      >
                        ⚡ ECharts
                      </button>
                    </div>
                  </div>
                  <p className="section-subtitle">
                    Based on your data's column types, here are the best visualizations:
                  </p>
                </div>

                <div className="suggestion-tabs" role="tablist" aria-label="Chart types">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={`${sug.id}-${idx}`}
                      id={`tab-${sug.id}-${idx}`}
                      className={`tab-btn ${idx === activeIdx ? 'tab-btn--active' : ''}`}
                      role="tab"
                      aria-selected={idx === activeIdx}
                      aria-controls={`panel-${sug.id}-${idx}`}
                      onClick={() => selectSuggestion(idx)}
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>

                {/* ── Insight banner ── */}
                {insight && (
                  <div className="insight-banner" role="note" aria-label="Data insight">
                    {insight}
                  </div>
                )}

                {/* ── Chart + customize layout ── */}
                <div className="chart-customize-layout">
                  <div
                    id={`panel-${activeSuggestion?.id}-${activeIdx}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeSuggestion?.id}-${activeIdx}`}
                    className="chart-panel-area"
                  >
                    {activeSuggestion && renderer === 'chartjs' && (
                      <ChartPanel
                        suggestion={activeSuggestion}
                        rows={parsed.rows}
                        headers={parsed.headers}
                        types={parsed.types}
                        customization={{ ...customization, yKeys }}
                      />
                    )}
                    {activeSuggestion && renderer === 'echarts' && (
                      <EChartsPanel
                        suggestion={activeSuggestion}
                        rows={parsed.rows}
                        headers={parsed.headers}
                        types={parsed.types}
                        customization={{ ...customization, yKeys }}
                      />
                    )}
                  </div>

                  <CustomizationPanel
                    suggestion={activeSuggestion ?? suggestions[0]}
                    headers={parsed.headers}
                    types={parsed.types}
                    customization={customization}
                    yKeys={yKeys}
                    onYKeysChange={setYKeys}
                    onChange={(updates) => setCustomization((prev) => ({ ...prev, ...updates }))}
                    onAxisChange={handleAxisChange}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Made with ❤️ by{' '}
          <a href="https://github.com/vamsi-op" target="_blank" rel="noopener noreferrer">
            vamsi-op
          </a>{' '}
          · Open Source ·{' '}
          <a
            href="https://github.com/vamsi-op/PocketDataVisualiser"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
