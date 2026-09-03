/* ==================================
    ACTIVITY LOGS API (Optimized with Workers KV Cache & Pagination)
    POST /api/logs - Creates a new log entry & invalidates latest cache
    GET /api/logs - Retrieves recent logs with LIMIT/OFFSET support & KV caching
================================== */

import { getCache, setCache, deleteCache } from "../lib/cache.js";
import { DEFAULT_HEADERS } from "../lib/constants.js";
import { KV_CACHE_TTL, PAGINATION_CONFIG } from "../lib/config.js";

const CACHE_BASE = "activity_logs_latest";

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }
        
        const { user_name, action, details, browser, os, device } = body;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Database not connected" }), {
                status: 500,
                headers: DEFAULT_HEADERS.JSON
            });
        }

        // Sanitization and length trimming to protect D1 performance and prevent overflow
        const sanitizedUserName = String(user_name || "Admin/User").trim().slice(0, 100);
        const sanitizedAction = String(action || "Unknown Action").trim().slice(0, 150);
        const sanitizedDetails = String(details || "").trim().slice(0, 500);
        const sanitizedBrowser = String(browser || "Unknown Browser").trim().slice(0, 50);
        const sanitizedOs = String(os || "Unknown OS").trim().slice(0, 50);
        const sanitizedDevice = String(device || "Desktop").trim().slice(0, 50);

        await env.DB.prepare(`
            INSERT INTO activity_logs (user_name, action, details, browser, os, device)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            sanitizedUserName,
            sanitizedAction,
            sanitizedDetails,
            sanitizedBrowser,
            sanitizedOs,
            sanitizedDevice
        ).run();

        // Invalidate / Burahin ang cached latest logs dahil may bagong activity na na-record
        if (env.CACHE) {
            try {
                await deleteCache(env.CACHE, CACHE_BASE);
            } catch (kvDelErr) {
                console.error("[KV LOGS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: DEFAULT_HEADERS.JSON
        });
    } catch (err) {
        console.error("[LOGS POST ERROR]:", err.message);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: DEFAULT_HEADERS.JSON
        });
    }
}

export async function onRequestGet(context) {
    try {
        const { request, env } = context;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Database not connected" }), {
                status: 500,
                headers: DEFAULT_HEADERS.JSON
            });
        }

        const url = new URL(request.url);
        const limitParam = parseInt(url.searchParams.get("limit"), 10);
        const pageParam = parseInt(url.searchParams.get("page"), 10);
        
        // Gamitin ang standard pagination limits mula sa central config
        const limit = !isNaN(limitParam) && limitParam > 0 ? Math.min(limitParam, PAGINATION_CONFIG.MAX_PAGE_SIZE) : PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
        const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
        const offset = (page - 1) * limit;

        const kv = env.CACHE;
        const cacheKey = `${CACHE_BASE}_${limit}_${page}`;

        // 1. Subukang basahin ang unang page mula sa Workers KV Cache (30s TTL) para iwas D1 read
        if (kv && page === 1) {
            try {
                const cachedLogs = await getCache(kv, cacheKey);
                if (cachedLogs) {
                    return new Response(JSON.stringify({ logs: cachedLogs }), {
                        status: 200,
                        headers: { 
                            "Content-Type": "application/json",
                            "Cache-Control": "private, max-age=10"
                        }
                    });
                }
            } catch (kvReadErr) {
                console.error("[KV LOGS READ ERROR]:", kvReadErr);
            }
        }

        // 2. Kunin ang logs mula sa D1 gamit ang optimized pagination query at field projection
        const { results } = await env.DB.prepare(`
            SELECT id, user_name, action, details, browser, os, device, created_at 
            FROM activity_logs 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `).bind(limit, offset).all();

        const logs = results || [];

        // 3. I-save sa Workers KV Cache kung ito ang unang page (gamit ang central TTL)
        if (kv && page === 1) {
            try {
                await setCache(kv, cacheKey, logs, KV_CACHE_TTL.NOTIFICATIONS);
            } catch (kvWriteErr) {
                console.error("[KV LOGS WRITE ERROR]:", kvWriteErr);
            }
        }

        return new Response(JSON.stringify({ logs }), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "private, max-age=10"
            }
        });
    } catch (err) {
        console.error("[LOGS GET ERROR]:", err.message);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: DEFAULT_HEADERS.JSON
        });
    }
}

export default {
    onRequestPost,
    onRequestGet
};