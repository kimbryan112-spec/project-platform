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

        return new Response(
            JSON.stringify({
                success: true,
                message: "Database cleared successfully.",
                deleted: result.meta?.changes || 0
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
    catch (err) {
        console.error("[DELETE ALL]", err);

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
    onRequestDelete
};