/* ==================================
    RESET YEAR API
    POST /api/reset-year
================================== */

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

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

        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }

        const year = Number(body.year);

        if (!year) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Year is required."
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        console.log(`[RESET YEAR] ${year}`);

        const result = await env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
        `)
        .bind(year)
        .run();

        // Para ma-clear din ang lahat ng buwan na naka-lock sa taon na ito:
        await env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
        `)
        .bind(year)
        .run();

        return new Response(
            JSON.stringify({
                success: true,
                message: `Year ${year} reset successfully.`,
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
        console.error("[RESET YEAR ERROR]:", err.message);

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
    onRequestPost
};