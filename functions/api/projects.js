/* ==================================
    PROJECTS API (Optimized with Edge Cache API & Workers KV Cache)
    GET /api/projects?year=YYYY&month=M
    POST /api/projects?year=YYYY&month=M
================================== */

import { getCache, setCache, deleteCache } from "../lib/cache.js";
import { getCachedResponse, cacheResponse } from "../lib/edge-cache.js";
import { CACHE_PREFIXES } from "../lib/constants.js";
import { KV_CACHE_TTL } from "../lib/config.js";

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) {
            return new Response(JSON.stringify({ success: false, message: "Database not connected." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const edgeCached = await getCachedResponse(request);
        if (edgeCached) return edgeCached;

        const url = new URL(request.url);
        const year = url.searchParams.get("year");
        const month = url.searchParams.get("month");

        let cacheKey = `${CACHE_PREFIXES.PROJECTS}_all`;
        if (year && month) {
            cacheKey = `${CACHE_PREFIXES.PROJECTS}_${year}_${month}`;
        }

        if (kv) {
            const cachedData = await getCache(kv, cacheKey);
            if (cachedData) {
                const response = new Response(JSON.stringify({ success: true, projects: cachedData }), {
                    headers: { "Content-Type": "application/json" }
                });
                return await cacheResponse(request, response);
            }
        }

        let query = "SELECT * FROM projects";
        let params = [];

        if (year && month) {
            query += " WHERE project_year = ? AND project_month = ?";
            params = [year, month];
        }
        query += " ORDER BY project_year DESC, project_month ASC, row_index ASC";

        const stmt = db.prepare(query);
        const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

        const projects = results || [];

        if (kv) {
            await setCache(kv, cacheKey, projects, KV_CACHE_TTL.PROJECTS);
        }

        const response = new Response(
            JSON.stringify({ success: true, projects }),
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        return await cacheResponse(request, response);

    } catch (err) {
        console.error("[PROJECTS GET ERROR]:", err.message);
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) {
            return new Response(JSON.stringify({ success: false, message: "Database not connected." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const body = await request.json();
        const { year, month, rows } = body;

        if (!year || !month || !Array.isArray(rows)) {
            return new Response(JSON.stringify({ success: false, message: "Invalid payload parameters." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const statements = rows.map((r) => {
            return db.prepare(`
                INSERT INTO projects (
                    project_year, project_month, row_index, couple_name, status, progress, type,
                    raw_files, drone, instruction, concerns, watch_link, files_link,
                    song1_title, song1_link, song1_status, song1_notes,
                    song2_title, song2_link, song2_status, song2_notes,
                    song3_title, song3_link, song3_status, song3_notes,
                    teaser_title, teaser_link, teaser_status, teaser_notes, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(project_year, project_month, row_index) DO UPDATE SET
                    couple_name=excluded.couple_name, status=excluded.status, progress=excluded.progress, type=excluded.type,
                    raw_files=excluded.raw_files, drone=excluded.drone, instruction=excluded.instruction, concerns=excluded.concerns,
                    watch_link=excluded.watch_link, files_link=excluded.files_link,
                    song1_title=excluded.song1_title, song1_link=excluded.song1_link, song1_status=excluded.song1_status, song1_notes=excluded.song1_notes,
                    song2_title=excluded.song2_title, song2_link=excluded.song2_link, song2_status=excluded.song2_status, song2_notes=excluded.song2_notes,
                    song3_title=excluded.song3_title, song3_link=excluded.song3_link, song3_status=excluded.song3_status, song3_notes=excluded.song3_notes,
                    teaser_title=excluded.teaser_title, teaser_link=excluded.teaser_link, teaser_status=excluded.teaser_status, teaser_notes=excluded.teaser_notes,
                    updated_at=CURRENT_TIMESTAMP
            `).bind(
                year, month, r.row_index ?? 0, r.couple_name || "", r.status || "PLANNED", r.progress || 0, r.type || "NOT SET",
                r.raw_files || "", r.drone || "", r.instruction || "", r.concerns || "", r.watch_link || "", r.files_link || "",
                r.song1_title || "", r.song1_link || "", r.song1_status || "", r.song1_notes || "",
                r.song2_title || "", r.song2_link || "", r.song2_status || "", r.song2_notes || "",
                r.song3_title || "", r.song3_link || "", r.song3_status || "", r.song3_notes || "",
                r.teaser_title || "", r.teaser_link || "", r.teaser_status || "", r.teaser_notes || ""
            );
        });

        await db.batch(statements);

        if (kv) {
            await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_${year}_${month}`);
            await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Projects saved successfully." }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[PROJECTS POST ERROR]:", err.message);
        return new Response(
            JSON.stringify({ success: false, message: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

export default {
    onRequestGet,
    onRequestPost
};