/* ==================================
   MONTH LOCK API
   POST /api/month-lock
================================== */

export async function onRequestPost(context) {
    try {
        const { year, month, locked } = await context.request.json();

        await context.env.DB.prepare(`
            INSERT INTO month_locks (
                project_year,
                project_month,
                locked,
                updated_at
            )
            VALUES (
                ?, ?, ?, CURRENT_TIMESTAMP
            )
            ON CONFLICT(project_year, project_month)
            DO UPDATE SET
                locked = excluded.locked,
                updated_at = CURRENT_TIMESTAMP
        `)
        .bind(
            year,
            month,
            locked ? 1 : 0
        )
        .run();

        return new Response(
            JSON.stringify({
                success: true
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (err) {
        console.error("[MONTH LOCK ERROR]");
        console.error(err);

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