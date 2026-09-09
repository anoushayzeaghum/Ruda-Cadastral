const loadedScripts = new Map();

function loadScript(src, id, readyCheck) {
  if (readyCheck?.()) return Promise.resolve();
  if (loadedScripts.has(id)) return loadedScripts.get(id);

  const promise = new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (readyCheck?.()) {
        resolve();
        return;
      }
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.dataset.virtualTourVendor = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(id, promise);
  return promise;
}

export async function loadVirtualTourVendors() {
  const base = `${import.meta.env.BASE_URL}virtual-tour/vendor/`.replace(/([^:]\/)\/+/g, '$1');

  await loadScript(
    `${base}marzipano.js`,
    'ruda-marzipano-vendor',
    () => Boolean(window.Marzipano),
  );

  await loadScript(
    `${base}screenfull.min.js`,
    'ruda-screenfull-vendor',
    () => Boolean(window.screenfull),
  );

  if (!window.Marzipano) {
    throw new Error('Marzipano loaded but window.Marzipano is unavailable.');
  }
}
