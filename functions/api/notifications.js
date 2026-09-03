/* ==================================
    NOTIFICATIONS API (Optimized with Workers KV Cache for Unread Count)
    GET /api/notifications?count=true&userId=X -> Returns unread count with KV cache (30s TTL)
    GET /api/notifications?userId=X -> Returns recent notifications (LIMIT 20, DESC)
    POST /api/notifications -> Creates a new notification & invalidates cache
    PUT /api/notifications -> Marks notification(s) as read & invalidates cache
    DELETE /api/notifications -> Deletes notification(s) & invalidates cache
================================== */

import { getCache, setCache, deleteCache } from "../lib/cache.js";

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

        // 1. Badge count request: Suriin muna ang Workers KV cache para iwas D1 read
        if (isCountOnly) {
            const cacheKey = `notification_count_${userId}`;
            const cachedCount = await getCache(kv, cacheKey);
            
            if (cachedCount !== null && cachedCount !== undefined) {
                return new Response(
                    JSON.stringify({ success: true, unreadCount: cachedCount }),
                    { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=10" } }
                );
            }

            // Kung walang cache, kunin sa D1 database
            const countResult = await db.prepare(
                "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
            ).bind(userId).first();

            const unreadCount = countResult ? countResult.count : 0;

            // I-save sa Workers KV cache (TTL: 30 seconds)
            await setCache(kv, cacheKey, unreadCount, 30);

            return new Response(
                JSON.stringify({ success: true, unreadCount }),
                { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=10" } }
            );
        }

        // 2. Full notification list request: Na-optimize gamit ang LIMIT 20 at ORDER BY DESC
        const listResult = await db.prepare(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
        ).bind(userId).all();

        return new Response(
            JSON.stringify({ success: true, notifications: listResult.results || [] }),
            { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        );

    } catch (err) {
        console.error("[NOTIFICATIONS GET ERROR]:", err);
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
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

        // Invalidate / Burahin ang unread count cache pagkatapos gumawa ng bagong notification
        await deleteCache(kv, `notification_count_${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notification created." }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
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
            // Mark all as read kung walang specific ID na ibinigay
            await db.prepare(
                "UPDATE notifications SET is_read = 1 WHERE user_id = ?"
            ).bind(userId).run();
        }

        // Invalidate cache dahil nagbago ang unread status
        await deleteCache(kv, `notification_count_${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notifications marked as read." }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
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

        // Invalidate cache dahil nabawasan ang notifications
        await deleteCache(kv, `notification_count_${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notifications deleted." }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export default {
    onRequestGet,
    onRequestPost,
    onRequestPut,
    onRequestDelete
};