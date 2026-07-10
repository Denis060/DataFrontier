export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "df-theme";

/**
 * Runs blocking in <head>, before first paint, so the correct palette is on
 * <html> by the time the body renders. Any React-side approach would repaint.
 * Kept as a string because it must execute before hydration.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
      return;
    }
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = prefersLight ? 'light' : 'dark';
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`.trim();
