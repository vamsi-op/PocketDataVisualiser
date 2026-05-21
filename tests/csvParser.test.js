/**
 * csvParser.test.js
 * -----------------
 * Unit tests for the CSV parser and column type inference utilities.
 * Run with: npm run test
 */
import { describe, it, expect } from 'vitest';
import { inferColumnType, parseString } from '../src/utils/csvParser';

// ── inferColumnType ──────────────────────────────────────────────────────────

describe('inferColumnType', () => {
  it('detects numeric columns', () => {
    expect(inferColumnType(['1', '2', '3.5', '-10'])).toBe('numeric');
  });

  it('detects numeric with thousands separators', () => {
    expect(inferColumnType(['1,000', '2,500', '10,000'])).toBe('numeric');
  });

  it('detects boolean columns', () => {
    expect(inferColumnType(['true', 'false', 'TRUE', 'FALSE'])).toBe('boolean');
    expect(inferColumnType(['yes', 'no', 'Yes', 'No'])).toBe('boolean');
    expect(inferColumnType(['1', '0', '1', '0'])).toBe('boolean');
  });

  it('detects date columns', () => {
    expect(inferColumnType(['2024-01-01', '2024-02-15', '2024-12-31'])).toBe('date');
    expect(inferColumnType(['Jan 1 2024', 'Feb 15 2024'])).toBe('date');
  });

  it('detects text columns', () => {
    expect(inferColumnType(['apple', 'banana', 'cherry'])).toBe('text');
    expect(inferColumnType(['Electronics', 'Clothing', 'Food'])).toBe('text');
  });

  it('falls back to text for mixed types', () => {
    expect(inferColumnType(['42', 'hello', '2024-01-01'])).toBe('text');
  });

  it('handles empty arrays as text', () => {
    expect(inferColumnType([])).toBe('text');
  });

  it('ignores empty strings when inferring types', () => {
    expect(inferColumnType(['', '1', '2', ''])).toBe('numeric');
  });
});

// ── parseString ──────────────────────────────────────────────────────────────

describe('parseString', () => {
  it('parses a simple CSV', () => {
    const csv = 'Name,Age,Score\nAlice,30,95.5\nBob,25,88';
    const { headers, rows, types } = parseString(csv);

    expect(headers).toEqual(['Name', 'Age', 'Score']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ Name: 'Alice', Age: '30', Score: '95.5' });
    expect(types.Name).toBe('text');
    expect(types.Age).toBe('numeric');
    expect(types.Score).toBe('numeric');
  });

  it('parses a TSV', () => {
    const tsv = 'Month\tRevenue\nJan\t42000\nFeb\t38000';
    const { headers, rows, types } = parseString(tsv);
    expect(headers).toEqual(['Month', 'Revenue']);
    expect(rows).toHaveLength(2);
    expect(types.Month).toBe('text');
    expect(types.Revenue).toBe('numeric');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'City,Population\n"New York, NY",8336817\nLos Angeles,3979576';
    const { rows } = parseString(csv);
    expect(rows[0].City).toBe('New York, NY');
  });

  it('returns empty arrays for blank input', () => {
    const { headers, rows } = parseString('');
    expect(headers).toHaveLength(0);
    expect(rows).toHaveLength(0);
  });

  it('skips empty lines', () => {
    const csv = 'A,B\n1,2\n\n3,4\n';
    const { rows } = parseString(csv);
    expect(rows).toHaveLength(2);
  });

  it('detects date column types', () => {
    const csv = 'Date,Value\n2024-01-01,100\n2024-02-01,200';
    const { types } = parseString(csv);
    expect(types.Date).toBe('date');
    expect(types.Value).toBe('numeric');
  });

  it('handles a header-only CSV without errors', () => {
    const csv = 'Col1,Col2,Col3';
    const { headers, rows, errors } = parseString(csv);
    expect(headers).toEqual(['Col1', 'Col2', 'Col3']);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});
