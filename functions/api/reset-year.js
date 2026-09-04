/* ==================================
    RESET YEAR API
    POST /api/reset-year
================================== */

import { clearCacheByPrefix, deleteCache } from "../lib/cache.js";
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

        const year = Number(body.year);

        if (!year) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Year is required."
                }),
                {
                    status: 400,
                    headers: DEFAULT_HEADERS.JSON
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

        // Invalidate Workers KV Cache para sa buong taon at master list
        const kv = env.CACHE;
        if (kv) {
            try {
                // Burahin ang lahat ng buwan na nagsisimula sa taon na ito (e.g. projects_2026_)
                await clearCacheByPrefix(kv, `${CACHE_PREFIXES.PROJECTS}_${year}_`);
                await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
            } catch (kvDelErr) {
                console.error("[KV RESET YEAR CACHE ERROR]:", kvDelErr);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Year ${year} reset successfully.`,
                deleted: result.meta?.changes || 0
            }),
            {
                status: 200,
                headers: DEFAULT_HEADERS.NO_CACHE
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
                headers: DEFAULT_HEADERS.JSON
            }
        );
    }
}

export default {
    onRequestPost
};