/**
 * csvParser.js
 * -----------
 * Wraps PapaParse for CSV/TSV parsing and adds automatic column-type inference.
 *
 * Exported types:
 *   ColumnType = 'numeric' | 'date' | 'boolean' | 'text'
 *
 * Exported shape returned by parseFile():
 *   {
 *     headers: string[],
 *     rows:    Record<string, string>[],   // raw string values
 *     types:   Record<string, ColumnType>,
 *     errors:  string[],
 *   }
 */

import Papa from 'papaparse';

/** @typedef {'numeric'|'date'|'boolean'|'text'} ColumnType */

// ------------------------------------------------------------------
// Type-inference helpers
// ------------------------------------------------------------------

const BOOLEAN_VALUES = new Set([
  'true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n',
]);

/** @param {string} v */
function isBoolean(v) {
  return BOOLEAN_VALUES.has(v.trim().toLowerCase());
}

/** @param {string} v */
function isNumeric(v) {
  const trimmed = v.trim().replace(/,/g, ''); // strip thousands separators
  return trimmed !== '' && !Number.isNaN(Number(trimmed));
}

/** @param {string} v */
function isDate(v) {
  if (!v.trim()) return false;
  // Must contain a separator (-, /, space) or be ISO-8601-ish; avoid plain numbers
  if (/^\d+$/.test(v.trim())) return false;
  const d = new Date(v.trim());
  return !Number.isNaN(d.getTime());
}

/**
 * Infer the most specific type that covers all non-empty values in a column.
 * Priority: boolean > numeric > date > text
 *
 * @param {string[]} values
 * @returns {ColumnType}
 */
export function inferColumnType(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v.trim() !== '');
  if (nonEmpty.length === 0) return 'text';

  if (nonEmpty.every(isBoolean)) return 'boolean';
  if (nonEmpty.every(isNumeric)) return 'numeric';
  if (nonEmpty.every(isDate))    return 'date';
  return 'text';
}

// ------------------------------------------------------------------
// Main parser
// ------------------------------------------------------------------

/**
 * Parse a File object (CSV or TSV) and return structured data.
 *
 * @param {File} file
 * @returns {Promise<{
 *   headers: string[],
 *   rows: Record<string, string>[],
 *   types: Record<string, ColumnType>,
 *   errors: string[],
 * }>}
 */
export function parseFile(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      // Let PapaParse auto-detect delimiter (handles comma, tab, semicolon, pipe)
      delimiter: '',
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows    = results.data;
        const errors  = results.errors.map((e) => `Row ${e.row}: ${e.message}`);

        /** @type {Record<string, ColumnType>} */
        const types = {};
        for (const header of headers) {
          const columnValues = rows.map((r) => String(r[header] ?? ''));
          types[header] = inferColumnType(columnValues);
        }

        resolve({ headers, rows, types, errors });
      },
      error(err) {
        resolve({
          headers: [],
          rows:    [],
          types:   {},
          errors:  [err.message],
        });
      },
    });
  });
}

/**
 * Parse a raw CSV/TSV string (useful for testing without a File object).
 *
 * @param {string} csvString
 * @returns {{ headers: string[], rows: Record<string,string>[], types: Record<string,ColumnType>, errors: string[] }}
 */
export function parseString(csvString) {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    delimiter: '',
  });

  const headers = results.meta.fields ?? [];
  const rows    = results.data;
  const errors  = results.errors.map((e) => `Row ${e.row}: ${e.message}`);

  /** @type {Record<string, ColumnType>} */
  const types = {};
  for (const header of headers) {
    const columnValues = rows.map((r) => String(r[header] ?? ''));
    types[header] = inferColumnType(columnValues);
  }

  return { headers, rows, types, errors };
}
