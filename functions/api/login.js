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

        return Response.json({

            success: true,

            user: {

                id: user.id,

                email: user.email,

                role: user.role,

                name: user.fullname

            }

        });

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