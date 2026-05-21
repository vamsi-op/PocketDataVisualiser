/**
 * DataTable component
 * -------------------
 * Paginated, responsive data preview with:
 *  • Column type badges
 *  • Drag-to-reorder columns
 *  • Parse error display
 *
 * Props:
 *   headers:   string[]
 *   rows:      Record<string, string>[]
 *   types:     Record<string, ColumnType>
 *   errors:    string[]
 *   onReorder: (newHeaders: string[]) => void
 */
import { useState, useRef } from 'react';
import './DataTable.css';

const PAGE_SIZE = 10;

const TYPE_BADGE = {
  numeric: { label: '123',  color: 'badge--numeric'  },
  date:    { label: '📅',   color: 'badge--date'     },
  boolean: { label: 'T/F',  color: 'badge--boolean'  },
  text:    { label: 'Abc',  color: 'badge--text'     },
};

export default function DataTable({ headers, rows, types, errors, onReorder }) {
  const [page, setPage]           = useState(0);
  const [dragOver, setDragOver]   = useState(null);
  const dragIdx = useRef(null);

  const totalPages  = Math.ceil(rows.length / PAGE_SIZE);
  const visibleRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function onDragStart(idx) { dragIdx.current = idx; }
  function onDragEnter(idx) { setDragOver(idx); }
  function onDragEnd()      { setDragOver(null); dragIdx.current = null; }

  function onDrop(targetIdx) {
    const src = dragIdx.current;
    if (src === null || src === targetIdx) { onDragEnd(); return; }
    const next = [...headers];
    const [moved] = next.splice(src, 1);
    next.splice(targetIdx, 0, moved);
    onReorder?.(next);
    onDragEnd();
  }

  return (
    <section className="data-table-section" aria-label="Data preview">
      <div className="data-table-meta">
        <span className="data-table-count">
          <strong>{rows.length}</strong> rows · <strong>{headers.length}</strong> columns
        </span>
        <span className="data-table-hint">↔ Drag column headers to reorder</span>
        {errors.length > 0 && (
          <details className="data-table-errors">
            <summary>⚠ {errors.length} parse warning{errors.length > 1 ? 's' : ''}</summary>
            <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </details>
        )}
      </div>

      <div className="data-table-wrapper" role="region" aria-label="Scrollable data table" tabIndex={0}>
        <table id="data-preview-table" className="data-table">
          <thead>
            <tr>
              {headers.map((h, idx) => {
                const badge = TYPE_BADGE[types[h]] ?? TYPE_BADGE.text;
                return (
                  <th
                    key={h}
                    scope="col"
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragEnter={() => onDragEnter(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(idx)}
                    onDragEnd={onDragEnd}
                    className={dragOver === idx ? 'th-drag-over' : ''}
                    aria-label={`${h} column — drag to reorder`}
                  >
                    <div className="th-inner">
                      <span className="drag-handle" aria-hidden="true">⠿</span>
                      <span className={`type-badge ${badge.color}`} title={`Type: ${types[h]}`}>
                        {badge.label}
                      </span>
                      {h}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'row-even' : 'row-odd'}>
                {headers.map((h) => (
                  <td key={h} data-type={types[h]}>
                    {row[h] ?? <span className="cell-empty">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Table pagination">
          <button
            id="prev-page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <span className="pagination-info">Page {page + 1} of {totalPages}</span>
          <button
            id="next-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
