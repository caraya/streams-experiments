/* eslint max-len: "off", require-jsdoc: "off", no-unused-vars: "off" */
const cacheName = 'data-cache';
const cacheVersion = 1;
const urlsToCache = [
  '/',
  'css/index.css',
  'js/zenscroll.min.js',
  'pages/404.html',
  'pages/offline.html',
  'partials/page-start.html',
  'partials/page-end.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open(`${cacheName}-v${cacheVersion}`)
          .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
          })
  );
});

self.addEventListener('activate', (event) => {});

self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);

  if (requestURL.endsWith('text/html')) {
    const stream = new ReadableStream({
      start(controller) {
        // The start comes from a cache
        const startFetch = caches.match('/page-start.inc');
        // The end comes from a cache
        const endFetch = caches.match('/page-end.inc');
        // Fetch middle from network, with fallback
        const contentFetch = fetch(requestURL)
            .catch(() => caches.match('/page-offline.inc'));

        function pushStream(stream) {
          // Get a lock on the stream
          const reader = stream.getReader();

          return reader.read().then(function process(result) {
            if (result.done) return;
            // Push the value to the combined stream
            controller.enqueue(result.value);
            // Read more & process
            return reader.read().then(process);
          });
        } // Closes pushStream

        startFetch
            .then((response) => pushStream(response.body))
        // Get the middle response
            .then(() => contentFetch)
        // Push its contents to the combined stream
            .then((response) => pushStream(response.body))
        // Get the end response
            .then(() => endFetch)
        // Push its contents to the combined stream
            .then((response) => pushStream(response.body))
        // Close our stream, we're done!
            .then(() => controller.close());
      }, // Closes start
    }); // closes ReadableStream
  } // closes endsWith
}); // closes fetch event listener
