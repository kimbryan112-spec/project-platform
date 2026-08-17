export async function onRequestGet(context) {
    try {
        const { results } = await context.env.DB.prepare(
            "SELECT * FROM projects ORDER BY row_index ASC"
        ).all();

        const formattedData = results.map(row => ({
            rowId: row.row_index,
            coupleName: row.couple_name || "",
            status: row.status || "IN PROGRESS",
            type: row.type || "UPBEAT CINEMATIC",
            rawFiles: row.raw_files || "",
            drone: row.drone || "",
            song1: { link: row.song1_link || "", status: row.song1_status || "" },
            song2: { link: row.song2_link || "", status: row.song2_status || "" },
            song3: { link: row.song3_link || "", status: row.song3_status || "" },
            teaserSong: { link: row.teaser_link || "", status: row.teaser_status || "" }
        }));

        return new Response(JSON.stringify(formattedData), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        });
    } catch (err) {
        console.error('DB Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    try {
        const projects = await context.request.json();

        for (const row of projects) {
            const rowId = row.rowId || (projects.indexOf(row) + 1);

            await context.env.DB.prepare(`
                INSERT INTO projects (
                    row_index, couple_name, status, type, raw_files, drone,
                    song1_link, song1_status, song2_link, song2_status,
                    song3_link, song3_status, teaser_link, teaser_status, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(row_index) DO UPDATE SET
                    couple_name = excluded.couple_name,
                    status = excluded.status,
                    type = excluded.type,
                    raw_files = excluded.raw_files,
                    drone = excluded.drone,
                    song1_link = excluded.song1_link,
                    song1_status = excluded.song1_status,
                    song2_link = excluded.song2_link,
                    song2_status = excluded.song2_status,
                    song3_link = excluded.song3_link,
                    song3_status = excluded.song3_status,
                    teaser_link = excluded.teaser_link,
                    teaser_status = excluded.teaser_status,
                    updated_at = CURRENT_TIMESTAMP
            `).bind(
                rowId,
                row.coupleName || "",
                row.status || "IN PROGRESS",
                row.type || "UPBEAT CINEMATIC",
                row.rawFiles || "",
                row.drone || "",
                row.song1?.link || "",
                row.song1?.status || "",
                row.song2?.link || "",
                row.song2?.status || "",
                row.song3?.link || "",
                row.song3?.status || "",
                row.teaserSong?.link || "",
                row.teaserSong?.status || ""
            ).run();
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error('DB Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export default {
  onRequestGet,
  onRequestPost
};
