/* ==================================
    LOGIN API (Optimized with Workers KV Session Caching)
    POST /api/login - Authenticate and cache session in KV
    GET /api/login?token=X - Validate session from KV (Zero D1 reads)
    DELETE /api/login?token=X - Destroy session from KV on logout
================================== */

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();

        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";

        if (!email || !password) {
            return new Response(
                JSON.stringify({ success: false, message: "Email and password are required." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        if (!env.DB) {
            throw new Error("D1 Database binding (DB) is not configured.");
        }

        // 1. SELECT user from D1 database (Isang beses lang tuwing mag-a-login)
        const user = await env.DB.prepare(
            "SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1"
        ).bind(email).first();

        if (!user) {
            return new Response(
                JSON.stringify({ success: false, message: "Invalid email or password." }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Password verification (Sinusunod ang existing hashing / plain check structure ng project)
        let passwordValid = false;
        if (user.password_hash) {
            passwordValid = (user.password_hash === password || user.password === password);
        } else {
            passwordValid = (user.password === password);
        }

        if (!passwordValid) {
            return new Response(
                JSON.stringify({ success: false, message: "Invalid email or password." }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Generate secure session token
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

        const sessionPayload = {
            userId: String(user.id || user.user_id || ""),
            email: user.email,
            name: user.name || user.full_name || "Kim Bryan Hernandez",
            role: user.role || "user",
            permissions: user.permissions || "",
            loginAt: new Date().toISOString()
        };

        // 2. Store Session sa Workers KV (TTL: 86400 seconds / 24 hours)
        if (env.KV_CACHE) {
            try {
                await env.KV_CACHE.put(
                    `session:${token}`, 
                    JSON.stringify(sessionPayload), 
                    { expirationTtl: 86400 }
                );
            } catch (kvErr) {
                console.error("[KV SESSION ERROR] Failed to store session in KV:", kvErr);
            }
        }

        // 3. Ibalik ang eksaktong response format nang hindi binabago ang UI o Login flow
        return new Response(
            JSON.stringify({
                success: true,
                token: token,
                user: sessionPayload,
                message: "Login successful."
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );

    } catch (err) {
        console.error("[LOGIN API ERROR]:", err.message);
        return new Response(
            JSON.stringify({
                success: false,
                message: err.message || "Internal Server Error"
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

// Support para sa Session Check / Validation endpoint
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token || !env.KV_CACHE) {
            return new Response(
                JSON.stringify({ success: false, message: "Unauthorized" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Basahin ang session mula sa KV sa halip na D1 (Zero D1 reads para sa page navigation)
        const sessionData = await env.KV_CACHE.get(`session:${token}`, "json");

        if (!sessionData) {
            return new Response(
                JSON.stringify({ success: false, message: "Session expired or invalid." }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, user: sessionData }),
            { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

// Logout Handler (Delete KV Session)
export async function onRequestDelete(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (token && env.KV_CACHE) {
            await env.KV_CACHE.delete(`session:${token}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Logged out successfully." }),
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
    onRequestPost,
    onRequestGet,
    onRequestDelete
};