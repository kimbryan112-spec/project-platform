import { CACHE_PREFIXES } from "./constants.js";

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

export async function deleteCache(kv, key) {
    if (!kv) return;
    try {
        await kv.delete(key);
    } catch (err) {
        console.error(`[CACHE DELETE ERROR] Key: ${key}`, err.message);
    }
}

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