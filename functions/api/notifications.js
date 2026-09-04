import { getCache, setCache, deleteCache } from "../lib/cache.js";
import { CACHE_PREFIXES, DEFAULT_HEADERS } from "../lib/constants.js";
import { KV_CACHE_TTL } from "../lib/config.js";

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const isCountOnly = url.searchParams.get("count") === "true";
        const userId = url.searchParams.get("userId") || "default";
        const kv = context.env.CACHE;
        const db = context.env.DB;

        if (!db) {
            throw new Error("D1 Database binding (DB) is not configured.");
        }

        if (isCountOnly) {
            const cacheKey = `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`;
            const cachedCount = await getCache(kv, cacheKey);
            
            if (cachedCount !== null && cachedCount !== undefined) {
                return new Response(
                    JSON.stringify({ success: true, unreadCount: cachedCount }),
                    { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=10" } }
                );
            }

            const countResult = await db.prepare(
                "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
            ).bind(userId).first();

            const unreadCount = countResult ? countResult.count : 0;

            await setCache(kv, cacheKey, unreadCount, KV_CACHE_TTL.NOTIFICATIONS);

            return new Response(
                JSON.stringify({ success: true, unreadCount }),
                { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=10" } }
            );
        }

        const listResult = await db.prepare(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
        ).bind(userId).all();

        return new Response(
            JSON.stringify({ success: true, notifications: listResult.results || [] }),
            { headers: DEFAULT_HEADERS.NO_CACHE }
        );

    } catch (err) {
        console.error("[NOTIFICATIONS GET ERROR]:", err);
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: DEFAULT_HEADERS.JSON }
        );
    }
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const db = env.DB;
        const kv = env.CACHE;

        const userId = body.userId || "default";
        const message = body.message || "";
        const type = body.type || "info";

        if (!db) throw new Error("D1 Database binding is missing.");

        await db.prepare(
            "INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)"
        ).bind(userId, message, type).run();

        await deleteCache(kv, `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notification created." }),
            { headers: DEFAULT_HEADERS.JSON }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: DEFAULT_HEADERS.JSON }
        );
    }
}

export async function onRequestPut(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const db = env.DB;
        const kv = env.CACHE;

        const userId = body.userId || "default";
        const notificationId = body.id;

        if (!db) throw new Error("D1 Database binding is missing.");

        if (notificationId) {
            await db.prepare(
                "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
            ).bind(notificationId, userId).run();
        } else {
            await db.prepare(
                "UPDATE notifications SET is_read = 1 WHERE user_id = ?"
            ).bind(userId).run();
        }

        await deleteCache(kv, `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notifications marked as read." }),
            { headers: DEFAULT_HEADERS.JSON }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: DEFAULT_HEADERS.JSON }
        );
    }
}

export async function onRequestDelete(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId") || "default";
        const notificationId = url.searchParams.get("id");
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) throw new Error("D1 Database binding is missing.");

        if (notificationId) {
            await db.prepare(
                "DELETE FROM notifications WHERE id = ? AND user_id = ?"
            ).bind(notificationId, userId).run();
        } else {
            await db.prepare(
                "DELETE FROM notifications WHERE user_id = ?"
            ).bind(userId).run();
        }

        await deleteCache(kv, `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notifications deleted." }),
            { headers: DEFAULT_HEADERS.JSON }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: DEFAULT_HEADERS.JSON }
        );
    }
}

export default {
    onRequestGet,
    onRequestPost,
    onRequestPut,
    onRequestDelete
};