// Register the service worker in production only — in dev a SW would cache
// Vite's module graph and serve stale code across HMR restarts.
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
});
