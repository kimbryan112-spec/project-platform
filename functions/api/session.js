export async function onRequestGet(context) {

    try {

        // ===============================
        // GET SESSION COOKIE
        // ===============================

        const cookie = context.request.headers.get("Cookie") || "";

        const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);

        if (!match) {

            return Response.json({
                loggedIn: false
            });

        }

        const sessionId = match[1];

        // ===============================
        // FIND VALID SESSION
        // ===============================

        const session = await context.env.DB.prepare(`

            SELECT
                users.id,
                users.email,
                users.role,
                users.fullname

            FROM sessions

            JOIN users
                ON users.id = sessions.user_id

            WHERE sessions.id = ?
            AND sessions.expires_at > datetime('now')

            LIMIT 1

        `)
        .bind(sessionId)
        .first();

        if (!session) {

            return Response.json({
                loggedIn: false
            });

        }

        return Response.json({

            loggedIn: true,

            user: {

                id: session.id,
                email: session.email,
                role: session.role,
                name: session.fullname

            }

        });

    }

    catch (err) {

        return Response.json({

            loggedIn: false,
            error: err.message

        }, {

            status: 500

        });

    }

}