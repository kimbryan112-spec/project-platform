export async function onRequestPost(context) {

    try {

        const {
            email,
            password
        } = await context.request.json();

        const user = await context.env.DB.prepare(`

            SELECT
                id,
                email,
                password,
                role,
                fullname,
                active

            FROM users

            WHERE email = ?

            LIMIT 1

        `)
        .bind(email.toLowerCase())
        .first();

        if (!user) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid email or password."
                },
                { status: 401 }
            );

        }

        if (!user.active) {

            return Response.json(
                {
                    success: false,
                    message: "Account is disabled."
                },
                { status: 403 }
            );

        }

        if (user.password !== password) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid email or password."
                },
                { status: 401 }
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

        const response = Response.json({

            success: true,

            user: {

                id: user.id,
                email: user.email,
                role: user.role,
                name: user.fullname

            }

        });

        response.headers.append(

            "Set-Cookie",

            `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`

        );

        return response;

    }

    catch (err) {

        return Response.json(

            {

                success: false,
                message: err.message

            },

            {

                status: 500

            }

        );

    }

}