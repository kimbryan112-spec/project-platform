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
        // RESTORE PROJECTS
        // ==================================

        for (const row of backup.projects) {

            await context.env.DB.prepare(`
                INSERT INTO projects (

                    row_index,

                    couple_name,

                    status,

                    type,

                    raw_files,

                    drone,

                    song1_link,

                    song1_status,

                    song2_link,

                    song2_status,

                    song3_link,

                    song3_status,

                    teaser_link,

                    teaser_status,

                    updated_at

                )

                VALUES (

                    ?,?,?,?,?,?,
                    ?,?,
                    ?,?,
                    ?,?,
                    ?,?,
                    CURRENT_TIMESTAMP

                )
            `).bind(

                row.row_index,

                row.couple_name || "",

                row.status || "IN PROGRESS",

                row.type || "UPBEAT CINEMATIC",

                row.raw_files || "",

                row.drone || "",

                row.song1_link || "",

                row.song1_status || "",

                row.song2_link || "",

                row.song2_status || "",

                row.song3_link || "",

                row.song3_status || "",

                row.teaser_link || "",

                row.teaser_status || ""

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