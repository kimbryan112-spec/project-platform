/* ==================================
    LOGIN API (Optimized & Error-Handled)
    POST /api/login
================================== */

export async function onRequestPost(context) {
    try {
        let body = {};
        try {
            body = await context.request.json();
        } catch (e) {
            body = {};
        }

        const email = body.email || "";
        const password = body.password || "";

        if (!email.trim() || !password) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Email and password are required."
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Tiyaking may D1 database binding ang context
        if (!context.env || !context.env.DB) {
            throw new Error("Database binding (DB) is missing.");
        }

        // Optimized query with specific columns and LIMIT 1
        const user = await context.env.DB.prepare(`
            SELECT
                id,
                fullname,
                email,
                password,
                role,
                active
            FROM users
            WHERE email = ?
            LIMIT 1
        `)
        .bind(email.trim().toLowerCase())
        .first();

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid email or password."
                }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        if (!user.active) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Account is disabled."
                }),
                {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Plain text comparison
        if (user.password !== password) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid email or password."
                }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const sessionId = crypto.randomUUID();
        const expires = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        // Optimized session creation using prepared statement
        await context.env.DB.prepare(`
            INSERT INTO sessions (
                id,
                user_id,
                expires_at
            )
            VALUES (?, ?, ?)
        `)
        .bind(
            sessionId,
            user.id,
            expires
        )
        .run();

        const response = new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role
                }
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );

        response.headers.append(
            "Set-Cookie",
            `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`
        );

        return response;

    } catch (err) {
        console.error("[LOGIN ERROR]", err);

        // Suriin kung ang error ay tungkol sa quota o limit exceeded
        const errorMessage = err.message || "Internal Server Error";
        const isQuotaError = errorMessage.toLowerCase().includes("quota") || 
                             errorMessage.toLowerCase().includes("limit") ||
                             errorMessage.toLowerCase().includes("exceeded");

        return new Response(
            JSON.stringify({
                success: false,
                message: errorMessage,
                errorType: isQuotaError ? "QUOTA_EXCEEDED" : "SERVER_ERROR"
            }),
            {
                status: isQuotaError ? 429 : 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

export default {
    onRequestPost
};