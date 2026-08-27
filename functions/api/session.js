export async function onRequestGet(context) {

    try {

        const user = context.request.headers.get("x-user");

        if (!user) {

            return Response.json({

                loggedIn: false

            });

        }

        return Response.json({

            loggedIn: true,

            user: JSON.parse(user)

        });

    }

    catch (err) {

        return Response.json({

            loggedIn: false

        });

    }

}