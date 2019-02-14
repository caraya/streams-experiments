/* eslint max-len: 'off', require-jsdoc: 'off' */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.0.0-rc2/workbox-sw.js');

// Place holder for precached assets
workbox.precaching.precacheAndRoute([]);

// Make this a debug build
workbox.setConfig({
  debug: true,
});

const HEAD = 'partials/page-top.html';
const FOOT = 'partials/page-bottom.html';
const ERROR = 'partials/page-error.html';

const cacheStrategy = workbox.strategies.cacheFirst({
  cacheName: workbox.core.cacheNames.precache,
});

const networkStrategy = workbox.strategies.staleWhileRevalidate({
  cacheName: 'content',
  plugins: [
    new workbox.expiration.Plugin({
      maxEntries: 50,
    }),
  ],
});

workbox.routing.registerRoute(
    new RegExp('\\.html$'),
    workbox.streams.strategy([
      () => cacheStrategy.makeRequest({
        request: HEAD,
      }),
      async ({event}) => {
        try {
          const contentResponse = networkStrategy.makeRequest({
            request: event.request.url,
          });
          const contentData = await contentResponse.text();
          return contentData;
        } catch (error) {
          return cacheStrategy.makeRequest({
            request: ERROR,
          });
        }
      },
      () => cacheStrategy.makeRequest({
        request: FOOT,
      }),
    ])
);
