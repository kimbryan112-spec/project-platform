/* ==================================
    MONTH LOCK API
    POST /api/month-lock
================================== */

import { DEFAULT_HEADERS } from "../lib/constants.js";

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
                    headers: DEFAULT_HEADERS.JSON
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
        const month = Number(body.month);
        const locked = Boolean(body.locked);

        if (!year || !month) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Year and month are required."
                }),
                {
                    status: 400,
                    headers: DEFAULT_HEADERS.JSON
                }
            );
        }

        await env.DB.prepare(`
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
                status: 200,
                headers: DEFAULT_HEADERS.NO_CACHE
            }
        );

    } catch (err) {
        console.error("[MONTH LOCK ERROR]:", err.message);

        return new Response(
            JSON.stringify({
                success: false,
                message: "Internal Server Error"
            }),
            {
                status: 500,
                headers: DEFAULT_HEADERS.JSON
            }
        );
    }
}

export default {
    onRequestPost
};