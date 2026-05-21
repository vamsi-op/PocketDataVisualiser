/**
 * chartSuggest.test.js
 * --------------------
 * Unit tests for the chart suggestion algorithm.
 */
import { describe, it, expect } from 'vitest';
import { suggestCharts } from '../src/utils/chartSuggest';

describe('suggestCharts', () => {
  it('returns empty array for no headers', () => {
    expect(suggestCharts([], {})).toEqual([]);
  });

  it('suggests bar + histogram for text + numeric data', () => {
    const headers = ['Category', 'Sales'];
    const types = { Category: 'text', Sales: 'numeric' };
    const suggestions = suggestCharts(headers, types);
    const ids = suggestions.map((s) => s.id);
    expect(ids).toContain('bar');
    expect(ids).toContain('histogram');
  });

  it('suggests line chart highest for date + numeric data', () => {
    const headers = ['Date', 'Revenue'];
    const types = { Date: 'date', Revenue: 'numeric' };
    const suggestions = suggestCharts(headers, types);
    expect(suggestions[0].id).toBe('line');
    expect(suggestions[0].xKey).toBe('Date');
    expect(suggestions[0].yKey).toBe('Revenue');
  });

  it('suggests scatter for two numeric columns', () => {
    const headers = ['X', 'Y'];
    const types = { X: 'numeric', Y: 'numeric' };
    const suggestions = suggestCharts(headers, types);
    const ids = suggestions.map((s) => s.id);
    expect(ids).toContain('scatter');
  });

  it('suggests pie and doughnut for text + numeric', () => {
    const headers = ['Country', 'Population'];
    const types = { Country: 'text', Population: 'numeric' };
    const suggestions = suggestCharts(headers, types);
    const ids = suggestions.map((s) => s.id);
    expect(ids).toContain('pie');
    expect(ids).toContain('doughnut');
  });

  it('returns at most 5 suggestions', () => {
    const headers = ['Date', 'A', 'B', 'C', 'Label'];
    const types = { Date: 'date', A: 'numeric', B: 'numeric', C: 'numeric', Label: 'text' };
    const suggestions = suggestCharts(headers, types);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('all suggestions have required fields', () => {
    const headers = ['Month', 'Value'];
    const types = { Month: 'text', Value: 'numeric' };
    const suggestions = suggestCharts(headers, types);
    for (const s of suggestions) {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('reason');
      expect(s).toHaveProperty('xKey');
      expect(s).toHaveProperty('score');
      expect(typeof s.score).toBe('number');
    }
  });

  it('suggestions are sorted by score descending', () => {
    const headers = ['Date', 'Revenue', 'Expenses'];
    const types = { Date: 'date', Revenue: 'numeric', Expenses: 'numeric' };
    const suggestions = suggestCharts(headers, types);
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
    }
  });
});
