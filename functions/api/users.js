import { getCache, setCache, deleteCache } from "../lib/cache.js";
import { CACHE_PREFIXES, DEFAULT_HEADERS } from "../lib/constants.js";
import { KV_CACHE_TTL } from "../lib/config.js";

const CACHE_KEY = `${CACHE_PREFIXES.USERS}_list`;
const CACHE_TTL = KV_CACHE_TTL.USERS;

export async function onRequestGet(context) {
    try {
        const { env } = context;
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) {
            throw new Error("D1 Database binding (DB) is not configured.");
        }

        if (kv) {
            try {
                const cachedUsers = await getCache(kv, CACHE_KEY);
                if (cachedUsers) {
                    return new Response(
                        JSON.stringify({ success: true, users: cachedUsers }),
                        { headers: DEFAULT_HEADERS.STANDARD_CACHE }
                    );
                }
            } catch (kvReadErr) {
                console.error("[KV USERS READ ERROR]:", kvReadErr);
            }
        }

        const { results } = await db.prepare(`
            SELECT id, email, name, role, permissions, created_at, updated_at
            FROM users
            ORDER BY id ASC
        `).all();

        const users = results || [];

        if (kv) {
            try {
                await setCache(kv, CACHE_KEY, users, CACHE_TTL);
            } catch (kvWriteErr) {
                console.error("[KV USERS WRITE ERROR]:", kvWriteErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, users }),
            { headers: DEFAULT_HEADERS.STANDARD_CACHE }
        );

    } catch (err) {
        console.error("[USERS GET ERROR]:", err);
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

        if (!db) throw new Error("D1 Database binding is missing.");

        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";
        const name = (body.name || "").trim();
        const role = (body.role || "user").trim();
        const permissions = body.permissions || "";

        if (!email || !password) {
            return new Response(
                JSON.stringify({ success: false, message: "Email and password are required." }),
                { status: 400, headers: DEFAULT_HEADERS.JSON }
            );
        }

        await db.prepare(`
            INSERT INTO users (email, password, name, role, permissions, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(email, password, name, role, permissions).run();

        if (kv) {
            try {
                await deleteCache(kv, CACHE_KEY);
            } catch (kvDelErr) {
                console.error("[KV USERS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "User created successfully." }),
            { headers: DEFAULT_HEADERS.JSON }
        );

    } catch (err) {
        console.error("[USERS POST ERROR]:", err);
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

        if (!db) throw new Error("D1 Database binding is missing.");

        const userId = body.id || body.userId;
        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, message: "User ID is required for update." }),
                { status: 400, headers: DEFAULT_HEADERS.JSON }
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

        if (kv) {
            try {
                await deleteCache(kv, CACHE_KEY);
            } catch (kvDelErr) {
                console.error("[KV USERS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "User updated successfully." }),
            { headers: DEFAULT_HEADERS.JSON }
        );

    } catch (err) {
        console.error("[USERS PUT ERROR]:", err);
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
        const userId = url.searchParams.get("id") || url.searchParams.get("userId");
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) throw new Error("D1 Database binding is missing.");

        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, message: "User ID is required for deletion." }),
                { status: 400, headers: DEFAULT_HEADERS.JSON }
            );
        }

        await db.prepare(
            "DELETE FROM users WHERE id = ?"
        ).bind(userId).run();

        if (kv) {
            try {
                await deleteCache(kv, CACHE_KEY);
            } catch (kvDelErr) {
                console.error("[KV USERS DELETE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "User deleted successfully." }),
            { headers: DEFAULT_HEADERS.JSON }
        );

    } catch (err) {
        console.error("[USERS DELETE ERROR]:", err);
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