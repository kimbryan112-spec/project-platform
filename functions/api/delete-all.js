/* ==================================
    DELETE ALL API
    DELETE /api/delete-all
================================== */

export async function onRequestDelete(context) {
    try {
        const { env } = context;

        if (!env.DB) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Database not connected."
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        console.log("[DELETE ALL] Clearing database (projects)...");

        const result = await env.DB.prepare(`
            DELETE FROM projects
        `).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Database cleared successfully.",
                deleted: result.meta?.changes || 0
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store, no-cache, must-revalidate"
                }
            }
        );
    }
    catch (err) {
        console.error("[DELETE ALL ERROR]:", err.message);

        return new Response(
            JSON.stringify({
                success: false,
                message: "Internal Server Error"
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