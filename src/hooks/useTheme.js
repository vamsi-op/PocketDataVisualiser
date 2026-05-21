/**
 * useTheme.js
 * -----------
 * Manages dark/light theme with localStorage persistence.
 * Applies data-theme attribute to <html> which CSS vars respond to.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pdv-theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
