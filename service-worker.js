const CACHE_NAME = "kbhfilms-v3";

const FILES_TO_CACHE = [

    "/",
    "/index.html",
    "/manifest.json",

    "/css/style.css",

    "/js/script.js",
    "/js/login.js",

    "/assets/icons/favicon.ico",
    "/assets/icons/icon-192.png",
    "/assets/icons/icon-512.png"

];

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();

});

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

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        caches.match(event.request).then(response => {

            return response || fetch(event.request);

        })

    );

});