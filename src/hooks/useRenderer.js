/**
 * useRenderer.js
 * --------------
 * Stores the user's preferred chart renderer (chartjs | echarts)
 * in localStorage so it persists across sessions.
 */
import { useState } from 'react';

const STORAGE_KEY = 'pdv-renderer';

export function useRenderer() {
  const [renderer, setRenderer] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? 'chartjs'
  );

  function toggle() {
    setRenderer((r) => {
      const next = r === 'chartjs' ? 'echarts' : 'chartjs';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return { renderer, toggle };
}
