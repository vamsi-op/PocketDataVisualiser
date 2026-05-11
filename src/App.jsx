/**
 * App.jsx — Pocket Data Visualizer
 * Main application component managing state and layout.
 */
import { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import DataTable from './components/DataTable/DataTable';
import ChartPanel from './components/ChartPanel/ChartPanel';
import CustomizationPanel from './components/CustomizationPanel/CustomizationPanel';
import { parseFile, parseString } from './utils/csvParser';
import { suggestCharts, getAxisLabels } from './utils/chartSuggest';
import { exportDataAsCsv } from './utils/exportChart';
import './App.css';

// ── Sample dataset used for the demo ──────────────────────────────────────────
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
};

export default function App() {
  const [parsed,         setParsed]         = useState(null);
  const [suggestions,    setSuggestions]     = useState([]);
  const [activeIdx,      setActiveIdx]       = useState(0);
  const [customization,  setCustomization]   = useState(DEFAULT_CUSTOMIZATION);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [loading,        setLoading]         = useState(false);
  const [fileName,       setFileName]        = useState('');

  // ── Process a parsed result ────────────────────────────────────────────────
  function applyParsed(result, name) {
    const sugs = suggestCharts(result.headers, result.types);
    setParsed(result);
    setSuggestions(sugs);
    setActiveIdx(0);
    setActiveSuggestion(sugs[0] ?? null);
    setCustomization({
      ...DEFAULT_CUSTOMIZATION,
      xLabel: sugs[0]?.xKey ?? '',
      yLabel: sugs[0]?.yKey ?? '',
    });
    setFileName(name);
  }

  // ── File upload handler ────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    setLoading(true);
    try {
      const result = await parseFile(file);
      applyParsed(result, file.name);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load demo sample ──────────────────────────────────────────────────────
  function loadSample() {
    const result = parseString(SAMPLE_CSV);
    applyParsed(result, 'sample-revenue.csv');
  }

  // ── Switch active chart suggestion ────────────────────────────────────────
  function selectSuggestion(idx) {
    setActiveIdx(idx);
    const sug = suggestions[idx];
    setActiveSuggestion(sug);
    setCustomization((prev) => ({
      ...prev,
      xLabel: sug.xKey ?? '',
      yLabel: sug.yKey  ?? '',
    }));
  }

  // ── Axis column override ──────────────────────────────────────────────────
  function handleAxisChange({ xKey, yKey }) {
    setActiveSuggestion((prev) => ({ ...prev, xKey, yKey }));
    setCustomization((prev) => ({ ...prev, xLabel: xKey, yLabel: yKey ?? '' }));
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    setParsed(null);
    setSuggestions([]);
    setActiveSuggestion(null);
    setFileName('');
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

            {/* ── Data preview ── */}
            <details className="data-preview-details" open>
              <summary className="data-preview-summary">Data Preview</summary>
              <DataTable
                headers={parsed.headers}
                rows={parsed.rows}
                types={parsed.types}
                errors={parsed.errors}
              />
            </details>

            {/* ── Chart suggestion tabs ── */}
            {suggestions.length > 0 && (
              <section className="charts-section" aria-label="Chart suggestions">
                <div className="section-header">
                  <h2 className="section-title">Suggested Charts</h2>
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

                {/* ── Chart + customize layout ── */}
                <div className="chart-customize-layout">
                  <div
                    id={`panel-${activeSuggestion?.id}-${activeIdx}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeSuggestion?.id}-${activeIdx}`}
                    className="chart-panel-area"
                  >
                    {activeSuggestion && (
                      <ChartPanel
                        suggestion={activeSuggestion}
                        rows={parsed.rows}
                        headers={parsed.headers}
                        types={parsed.types}
                        customization={customization}
                      />
                    )}
                  </div>

                  <CustomizationPanel
                    suggestion={activeSuggestion ?? suggestions[0]}
                    headers={parsed.headers}
                    customization={customization}
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
          <a href="https://github.com/VamsiKrishna" target="_blank" rel="noopener noreferrer">
            VamsiKrishna
          </a>{' '}
          · Open Source ·{' '}
          <a
            href="https://github.com/VamsiKrishna/data-visualizer"
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
