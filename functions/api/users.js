/* ==================================
    USER MANAGEMENT API (Optimized with Workers KV Cache)
    GET /api/users - Retrieves all users (Cached with 12-hour TTL)
    POST /api/users - Creates a new user & invalidates users list cache
    PUT /api/users - Updates an existing user & invalidates users list cache
    DELETE /api/users - Deletes a user & invalidates users list cache
================================== */

import { getCache, setCache, deleteCache } from "../lib/cache.js";

const CACHE_KEY = "users_list";
const CACHE_TTL = 43200; // 12 Hours

export async function onRequestGet(context) {
    try {
        const { env } = context;
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) {
            throw new Error("D1 Database binding (DB) is not configured.");
        }

        // 1. Suriin muna ang Workers KV cache para iwas D1 read
        if (kv) {
            try {
                const cachedUsers = await getCache(kv, CACHE_KEY);
                if (cachedUsers) {
                    return new Response(
                        JSON.stringify({ success: true, users: cachedUsers }),
                        { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=60" } }
                    );
                }
            } catch (kvReadErr) {
                console.error("[KV USERS READ ERROR]:", kvReadErr);
            }
        }

        // 2. Kung walang cache, kunin sa D1 database (Optimized field selection)
        const { results } = await db.prepare(`
            SELECT id, email, name, role, permissions, created_at, updated_at
            FROM users
            ORDER BY id ASC
        `).all();

        const users = results || [];

        // 3. I-save sa Workers KV Cache (TTL: 12 Hours)
        if (kv) {
            try {
                await setCache(kv, CACHE_KEY, users, CACHE_TTL);
            } catch (kvWriteErr) {
                console.error("[KV USERS WRITE ERROR]:", kvWriteErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, users }),
            { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=60" } }
        );

    } catch (err) {
        console.error("[USERS GET ERROR]:", err);
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

        if (!db) throw new Error("D1 Database binding is missing.");

        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";
        const name = (body.name || "").trim();
        const role = (body.role || "user").trim();
        const permissions = body.permissions || "";

        if (!email || !password) {
            return new Response(
                JSON.stringify({ success: false, message: "Email and password are required." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        await db.prepare(`
            INSERT INTO users (email, password, name, role, permissions, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(email, password, name, role, permissions).run();

        // Invalidate / Burahin ang users list cache dahil nagbago ang data
        if (kv) {
            try {
                await deleteCache(kv, CACHE_KEY);
            } catch (kvDelErr) {
                console.error("[KV USERS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "User created successfully." }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[USERS POST ERROR]:", err);
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

        if (!db) throw new Error("D1 Database binding is missing.");

        const userId = body.id || body.userId;
        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, message: "User ID is required for update." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const name = (body.name || "").trim();
        const role = (body.role || "").trim();
        const permissions = body.permissions || "";
        const password = body.password;

        if (password) {
            await db.prepare(`
                UPDATE users 
                SET name = ?, role = ?, permissions = ?, password = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(name, role, permissions, password, userId).run();
        } else {
            await db.prepare(`
                UPDATE users 
                SET name = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(name, role, permissions, userId).run();
        }

        // Invalidate cache
        if (kv) {
            try {
                await deleteCache(kv, CACHE_KEY);
            } catch (kvDelErr) {
                console.error("[KV USERS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "User updated successfully." }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[USERS PUT ERROR]:", err);
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
        const userId = url.searchParams.get("id") || url.searchParams.get("userId");
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) throw new Error("D1 Database binding is missing.");

        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, message: "User ID is required for deletion." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        await db.prepare(
            "DELETE FROM users WHERE id = ?"
        ).bind(userId).run();

        // Invalidate cache
        if (kv) {
            try {
                await deleteCache(kv, CACHE_KEY);
            } catch (kvDelErr) {
                console.error("[KV USERS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "User deleted successfully." }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[USERS DELETE ERROR]:", err);
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