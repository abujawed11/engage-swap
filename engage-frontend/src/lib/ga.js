export const GA_ID = import.meta.env.VITE_GA_ID || "G-F3NL1F1PVJ";

export function pageview(path) {
  if (import.meta.env.PROD && window.gtag && GA_ID) {
    window.gtag("config", GA_ID, { page_path: path });
  }
}

export function gaEvent(action, params = {}) {
  if (import.meta.env.PROD && window.gtag && GA_ID) {
    window.gtag("event", action, params);
  }
}
