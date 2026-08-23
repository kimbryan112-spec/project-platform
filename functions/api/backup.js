/* ==================================
   BACKUP API
   GET /api/backup
================================== */

export async function onRequestGet(context) {

    try {

        console.log("[BACKUP] Creating backup...");

        const { results } = await context.env.DB.prepare(`
            SELECT *
            FROM projects
            ORDER BY row_index ASC
        `).all();

        console.log(
            `[BACKUP] ${results.length} project(s) exported.`
        );

        const backup = {

            version: "1.0",

            exportedAt: new Date().toISOString(),

            totalRecords: results.length,

            projects: results

        };

        return new Response(

            JSON.stringify(backup, null, 2),

            {

                headers: {

                    "Content-Type": "application/json",

                    "Content-Disposition":
                        `attachment; filename="backup-${Date.now()}.json"`,

                    "Cache-Control":
                        "no-cache, no-store, must-revalidate"

                }

            }

        );

    }

    catch (err) {

        console.error("[BACKUP] Error:", err);

        return new Response(

            JSON.stringify({

                success: false,

                error: err.message

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

    onRequestGet

};