/* ==================================
   RESTORE API
   POST /api/restore
================================== */

export async function onRequestPost(context) {
    try {
        console.log("[RESTORE] Starting restore...");

        const backup = await context.request.json();

        if (
            !backup ||
            !Array.isArray(backup.projects)
        ) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid backup file."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // ==================================
        // CLEAR DATABASE
        // ==================================
        await context.env.DB.prepare(`
            DELETE FROM projects
        `).run();

        // ==================================
        // RESTORE PROJECTS (Fixed to match schema.sql & backup.js completely)
        // ==================================
        for (const row of backup.projects) {
            await context.env.DB.prepare(`
                INSERT INTO projects (
                    project_year,
                    project_month,
                    row_index,
                    couple_name,
                    status,
                    progress,
                    type,
                    raw_files,
                    drone,
                    instruction,
                    concerns,
                    watch_link,
                    files_link,
                    song1_title,
                    song1_link,
                    song1_status,
                    song1_notes,
                    song2_title,
                    song2_link,
                    song2_status,
                    song2_notes,
                    song3_title,
                    song3_link,
                    song3_status,
                    song3_notes,
                    teaser_title,
                    teaser_link,
                    teaser_status,
                    teaser_notes,
                    updated_at
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    CURRENT_TIMESTAMP
                )
            `).bind(
                row.project_year,
                row.project_month,
                row.row_index,
                row.couple_name || "",
                row.status || "PLANNED",
                row.progress || 0,
                row.type || "NOT SET",
                row.raw_files || "",
                row.drone || "",
                row.instruction || "",
                row.concerns || "",
                row.watch_link || "",
                row.files_link || "",
                row.song1_title || "",
                row.song1_link || "",
                row.song1_status || "",
                row.song1_notes || "",
                row.song2_title || "",
                row.song2_link || "",
                row.song2_status || "",
                row.song2_notes || "",
                row.song3_title || "",
                row.song3_link || "",
                row.song3_status || "",
                row.song3_notes || "",
                row.teaser_title || "",
                row.teaser_link || "",
                row.teaser_status || "",
                row.teaser_notes || ""
            ).run();
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Database restored successfully."
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    }
    catch (err) {
        console.error("[RESTORE]", err);

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