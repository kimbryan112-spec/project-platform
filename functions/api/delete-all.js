export async function onRequestDelete(context) {

    try {

        await context.env.DB.prepare(`
            DELETE FROM projects
        `).run();

        return Response.json({
            success: true,
            message: "Database cleared successfully."
        });

    } catch (err) {

        return Response.json({
            success: false,
            message: err.message
        }, {
            status: 500
        });

    }

}