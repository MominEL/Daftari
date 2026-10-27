// Keeps the study page itself on the phone, so it opens without internet (the cards come from the phone's own copy).
// Only the page's own files are kept; GitHub's answers are never stored here.
const CACHE = 'daftari-study-1aed9f9d8e9b'
const FILES = ['./', 'index.html', 'app.js', 'app.css', 'icon.png', 'manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('daftari-study-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  // the page's files: the network first (so updates arrive), the kept copy when offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  )
})
