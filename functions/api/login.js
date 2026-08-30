/* ==================================
   LOGIN API
   POST /api/login
================================== */

export async function onRequestPost(context) {
    try {
        const {
            email,
            password
        } = await context.request.json();

        // Naitugma na ang full_name ayon sa schema.sql at D1 Studio
        const user = await context.env.DB.prepare(`
            SELECT
                id,
                email,
                password_hash,
                role,
                full_name,
                active
            FROM users
            WHERE email = ?
            LIMIT 1
        `)
        .bind(email.toLowerCase())
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

        // Plain text password comparison base sa database mo
        if (user.password_hash !== password) {
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

        // ===============================
        // CREATE SESSION
        // ===============================
        const sessionId = crypto.randomUUID();
        const expires = new Date(
            Date.now() + (7 * 24 * 60 * 60 * 1000)
        ).toISOString();

        await context.env.DB.prepare(`
            INSERT INTO sessions (
                id,
                user_id,
                expires_at
            )
            VALUES (
                ?, ?, ?
            )
        `)
        .bind(
            sessionId,
            user.id,
            expires
        )
        .run();

        // ===============================
        // RESPONSE
        // ===============================
        const responseObject = {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.full_name // Naka-ayos na sa full_name
            }
        };

        const response = new Response(
            JSON.stringify(responseObject),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        response.headers.append(
            "Set-Cookie",
            `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`
        );

        return response;

    }
    catch (err) {
        console.error("[LOGIN ERROR]", err);
        return new Response(
            JSON.stringify({
                success: false,
                message: err.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}

export default {
    onRequestPost
};