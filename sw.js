// Cache name — bump this (v3, v4…) whenever you want to force phones to refetch.
const CACHE = 'workout-v2';

// Relative paths. These resolve against wherever sw.js lives, so they work
// under /Workout-Timer/ on GitHub Pages and at the root on any other host.
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // addAll fails the whole install if any one request fails, so add
      // them individually and let a miss be survivable.
      Promise.all(ASSETS.map(u => c.add(u).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Page loads: try the network first so an updated index.html actually shows up,
  // and fall back to the cache when there's no connection.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Everything else: cache first, then network.
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).catch(() => cached))
  );
});
