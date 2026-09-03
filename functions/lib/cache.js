/* ==================================
    CACHE HELPER (Workers KV)
    functions/lib/cache.js
================================== */

/**
 * Kumuha ng cache mula sa Workers KV
 * @param {KVNamespace} kv - Ang CACHE binding mula sa context.env
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed JSON data o null kung wala/error
 */
export async function getCache(kv, key) {
    if (!kv) return null;
    try {
        const rawData = await kv.get(key);
        if (!rawData) return null;
        return JSON.parse(rawData);
    } catch (err) {
        console.error(`[CACHE GET ERROR] Key: ${key}`, err.message);
        return null;
    }
}

/**
 * Mag-save ng data sa Workers KV na may automatic JSON stringify at TTL
 * @param {KVNamespace} kv - Ang CACHE binding mula sa context.env
 * @param {string} key - Cache key
 * @param {any} data - Data na ise-save
 * @param {number} [ttl=null] - Time-to-live sa seconds (optional)
 */
export async function setCache(kv, key, data, ttl = null) {
    if (!kv) return;
    try {
        const options = {};
        if (ttl && typeof ttl === "number") {
            options.expirationTtl = ttl;
        }
        await kv.put(key, JSON.stringify(data), options);
    } catch (err) {
        console.error(`[CACHE SET ERROR] Key: ${key}`, err.message);
    }
}

/**
 * Burahin ang isang partikular na cache key
 * @param {KVNamespace} kv - Ang CACHE binding mula sa context.env
 * @param {string} key - Cache key
 */
export async function deleteCache(kv, key) {
    if (!kv) return;
    try {
        await kv.delete(key);
    } catch (err) {
        console.error(`[CACHE DELETE ERROR] Key: ${key}`, err.message);
    }
}

/**
 * Burahin ang lahat ng cache na may kaparehong prefix (bulk invalidation)
 * @param {KVNamespace} kv - Ang CACHE binding mula sa context.env
 * @param {string} prefix - Key prefix (halimbawa: "projects_", "settings_")
 */
export async function clearCacheByPrefix(kv, prefix) {
    if (!kv) return;
    try {
        let cursor = undefined;
        do {
            const list = await kv.list({ prefix, cursor });
            for (const keyObj of list.keys) {
                await kv.delete(keyObj.name);
            }
            cursor = list.cursor;
        } while (cursor);
    } catch (err) {
        console.error(`[CACHE PREFIX CLEAR ERROR] Prefix: ${prefix}`, err.message);
    }
}