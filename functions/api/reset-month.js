/* ==================================
    RESET MONTH API
    POST /api/reset-month
================================== */

import { deleteCache } from "../lib/cache.js";
import { CACHE_PREFIXES, DEFAULT_HEADERS } from "../lib/constants.js";

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

        const month = Number(body.month);
        const year = Number(body.year);

        if (!month || !year) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Month and year are required."
                }),
                {
                    status: 400,
                    headers: DEFAULT_HEADERS.JSON
                }
            );
        }

        console.log(`[RESET MONTH] ${month}/${year}`);

        const result = await env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
              AND project_month = ?
        `)
        .bind(year, month)
        .run();

        // I-clear din ang lock status ng buwang ito
        await env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
              AND project_month = ?
        `)
        .bind(year, month)
        .run();

        // Invalidate Workers KV Cache para sa buwang ito at sa master list
        const kv = env.CACHE;
        if (kv) {
            try {
                await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_${year}_${month}`);
                await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
            } catch (kvDelErr) {
                console.error("[KV RESET MONTH CACHE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Month ${month}/${year} reset successfully.`,
                deleted: result.meta?.changes || 0
            }),
            {
                status: 200,
                headers: DEFAULT_HEADERS.NO_CACHE
            }
        );

    }
    catch (err) {
        console.error("[RESET MONTH ERROR]:", err.message);

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