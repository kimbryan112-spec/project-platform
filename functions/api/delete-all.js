/* ==================================
   DELETE ALL API
   DELETE /api/delete-all
================================== */

export async function onRequestDelete(context) {

    try {

        console.log("[DELETE ALL] Clearing database...");

        const result = await context.env.DB.prepare(`
            DELETE FROM projects
        `).run();

        return Response.json({

            success: true,

            message: "Database cleared successfully.",

            deleted: result.meta?.changes || 0

        });

    }

    catch (err) {

        console.error("[DELETE ALL]", err);

        return Response.json({

            success: false,

            message: err.message

        }, {

            status: 500

        });

    }

}

export default {

    onRequestDelete

};