/**
 * Service worker do ADMflow: guarda o app no aparelho para abrir sem internet.
 * O build (npm run build:admflow) preenche a versão e a lista de arquivos logo abaixo; a cada
 * build novo, o app instalado baixa a versão nova na próxima vez que abrir com internet.
 */
const VERSION = "admflow-515b80096c";
const FILES = ["./index.html","./app.js","./app.css","./fonts.css","./manifest.webmanifest","./icons/admflow-192.png","./icons/admflow-32.png","./icons/admflow-512.png","./icons/admflow-apple-180.png","./icons/admflow-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("admflow-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const hit = (await cache.match(request, { ignoreSearch: true })) || (request.mode === "navigate" ? await cache.match("./index.html") : undefined);
      if (hit) return hit;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") cache.put(request, response.clone());
        return response;
      } catch (error) {
        const shell = request.mode === "navigate" ? await cache.match("./index.html") : undefined;
        if (shell) return shell;
        throw error;
      }
    })(),
  );
});
