/* ==================================
    KBHFILMS SERVICE WORKER (PWA)
================================== */

const CACHE_NAME = "kbhfilms-v3";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/login.html",
    "/manifest.json",
    "/css/style.css",
    "/js/script.js",
    "/js/login.js",
    "/assets/icons/favicon.ico",
    "/assets/icons/icon-192.png",
    "/assets/icons/icon-512.png"
];

// Install Event: I-cache ang essential static assets
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event: Linisin ang mga lumang caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch Event: Network-first/API bypass at Cache-first para sa static files
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Huwag i-cache ang mga API requests para laging sariwa ang data galing sa D1 Database
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    JSON.stringify({ success: false, message: "You are offline." }),
                    { status: 503, headers: { "Content-Type": "application/json" } }
                );
            })
        );
        return;
    }

    // Cache-first strategy para sa static assets na may network fallback
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).then(networkResponse => {
                return networkResponse;
            }).catch(() => {
                // Optional offline fallback para sa HTML pages kung kinakailangan
                if (event.request.headers.get("accept").includes("text/html")) {
                    return caches.match("/index.html");
                }
            });
        })
    );
});