/* ==================================
   RESET MONTH API
   POST /api/reset-month
================================== */

export async function onRequestPost(context) {
    try {
        const { month, year } = await context.request.json();

        console.log(`[RESET MONTH] ${month}/${year}`);

        const result = await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
              AND project_month = ?
        `)
        .bind(
            Number(year),
            Number(month)
        )
        .run();

        // Opsyonal: Kung gusto nating i-clear din ang lock status ng buwang ito:
        await context.env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
              AND project_month = ?
        `)
        .bind(
            Number(year),
            Number(month)
        )
        .run();

        return new Response(
            JSON.stringify({
                success: true,
                message: `Month ${month}/${year} reset successfully.`,
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
        console.error("[RESET MONTH]", err);

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