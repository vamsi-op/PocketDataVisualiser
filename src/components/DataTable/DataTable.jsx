/**
 * DataTable component
 * -------------------
 * Renders a paginated, responsive preview of parsed CSV data.
 *
 * Props:
 *   headers: string[]
 *   rows:    Record<string, string>[]
 *   types:   Record<string, ColumnType>
 */
import { useState } from 'react';
import './DataTable.css';

const PAGE_SIZE = 10;

const TYPE_BADGE = {
  numeric: { label: '123',  color: 'badge--numeric'  },
  date:    { label: '📅',   color: 'badge--date'     },
  boolean: { label: 'T/F',  color: 'badge--boolean'  },
  text:    { label: 'Abc',  color: 'badge--text'     },
};

/** @param {{ headers: string[], rows: object[], types: Record<string,string>, errors: string[] }} props */
export default function DataTable({ headers, rows, types, errors }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const visibleRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="data-table-section" aria-label="Data preview">
      <div className="data-table-meta">
        <span className="data-table-count">
          <strong>{rows.length}</strong> rows · <strong>{headers.length}</strong> columns
        </span>
        {errors.length > 0 && (
          <details className="data-table-errors">
            <summary>⚠ {errors.length} parse warning{errors.length > 1 ? 's' : ''}</summary>
            <ul>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </details>
        )}
      </div>

      <div className="data-table-wrapper" role="region" aria-label="Scrollable data table" tabIndex={0}>
        <table id="data-preview-table" className="data-table">
          <thead>
            <tr>
              {headers.map((h) => {
                const badge = TYPE_BADGE[types[h]] ?? TYPE_BADGE.text;
                return (
                  <th key={h} scope="col">
                    <div className="th-inner">
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
          <span className="pagination-info">
            Page {page + 1} of {totalPages}
          </span>
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
