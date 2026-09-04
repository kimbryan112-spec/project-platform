import { EDGE_CACHE_CONFIG } from "./config.js";

export function buildCacheKey(request) {
    const url = new URL(typeof request === "string" ? request : request.url);
    url.searchParams.delete("_cb");
    url.searchParams.delete("t");

    return new Request(url.toString(), {
        method: "GET",
        headers: request.headers ? new Headers(request.headers) : undefined
    });
}

export function shouldBypassCache(request) {
    if (!request || request.method !== "GET") {
        return true;
    }
    const cacheControl = request.headers.get("Cache-Control") || "";
    if (cacheControl.includes("no-cache") || cacheControl.includes("no-store")) {
        return true;
    }
    return false;
}

export async function getCachedResponse(request) {
    try {
        if (shouldBypassCache(request)) {
            return null;
        }
        const cache = caches.default;
        const cacheKey = buildCacheKey(request);
        
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            const newHeaders = new Headers(cachedResponse.headers);
            newHeaders.set("X-Edge-Cache", "HIT");
            
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: newHeaders
            });
        }
        return null;
    } catch (err) {
        console.error("[EDGE CACHE GET ERROR]:", err.message);
        return null;
    }
}

export async function cacheResponse(request, response, ttlSeconds = EDGE_CACHE_CONFIG.DEFAULT_EDGE_TTL) {
    try {
        if (shouldBypassCache(request) || !response || response.status !== 200) {
            return response;
        }
        const cache = caches.default;
        const cacheKey = buildCacheKey(request);

        const responseToCache = new Response(response.clone().body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers)
        });

        responseToCache.headers.set("Cache-Control", `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`);
        responseToCache.headers.set("X-Edge-Cache", "MISS");

        contextOrphanExecution(cache.put(cacheKey, responseToCache.clone()));

        return responseToCache;
    } catch (err) {
        console.error("[EDGE CACHE PUT ERROR]:", err.message);
        return response;
    }
}

export async function deleteCachedResponse(request) {
    try {
        const cache = caches.default;
        const cacheKey = buildCacheKey(request);
        return await cache.delete(cacheKey);
    } catch (err) {
        console.error("[EDGE CACHE DELETE ERROR]:", err.message);
        return false;
    }
}

function contextOrphanExecution(promise) {
    if (typeof globalThis.caches !== "undefined" && promise) {
        Promise.resolve(promise).catch(e => console.error("[EDGE CACHE BACKGROUND ERROR]:", e));
    }
}