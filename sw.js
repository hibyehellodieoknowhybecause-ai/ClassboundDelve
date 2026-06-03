const CACHE_NAME = "classbound-delve-v16";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/styles.css",
  "./src/main.js",
  "./src/input.js",
  "./src/renderer.js",
  "./src/ui.js",
  "./src/game.js",
  "./src/combat.js",
  "./src/enemies.js",
  "./src/loot.js",
  "./src/player.js",
  "./src/settings.js",
  "./src/sprites.js",
  "./src/data/abilities.js",
  "./src/data/characters.js",
  "./src/data/rewards.js",
  "./src/data/stages.js",
  "./src/data/weapons.js",
  "./src/utils/math.js",
  "./assets/sprites/swordsman.png",
  "./assets/sprites/archer.png",
  "./assets/sprites/boss_broadcaster.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const isAppCode = url.origin === self.location.origin && (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".json")
  );

  if (isAppCode) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
