export async function onRequestGet(context) {

    try {

        console.log("[API-GET] Fetching projects...");

        const url = new URL(context.request.url);

        const year =
            Number(url.searchParams.get("year")) ||
            new Date().getFullYear();

        const month =
            Number(url.searchParams.get("month")) ||
            (new Date().getMonth() + 1);

        console.log(`[API-GET] Year: ${year}`);
        console.log(`[API-GET] Month: ${month}`);

        const { results } = await context.env.DB.prepare(`
            SELECT *
            FROM projects
            WHERE project_year = ?
              AND project_month = ?
            ORDER BY row_index ASC
        `)
        .bind(year, month)
        .all();

        console.log(
    `[API-GET] ${results.length} record(s) found.`
);

// ==========================================
// GET MONTH LOCK
// ==========================================

const { results: lockRows } =
    await context.env.DB.prepare(`

        SELECT locked
        FROM month_locks
        WHERE project_year = ?
          AND project_month = ?
        LIMIT 1

    `)
    .bind(year, month)
    .all();

const monthLocked =
    lockRows.length > 0
        ? Number(lockRows[0].locked) === 1
        : false;
const formattedData = results.map(row => ({

    rowId: row.row_index,

    coupleName: row.couple_name || "",

    status: row.status || "IN PROGRESS",

    type: row.type || "UPBEAT CINEMATIC",

    rawFiles: row.raw_files || "",


    instruction: row.instruction || "",

watchLink: row.watch_link || "",

song1: {

    link: row.song1_link || "",

    status: row.song1_status || "",

    notes: row.song1_notes || ""

},

    song2: {

        link: row.song2_link || "",

        status: row.song2_status || "",

        notes: row.song2_notes || ""

    },

    song3: {

        link: row.song3_link || "",

        status: row.song3_status || "",

        notes: row.song3_notes || ""

    },

    teaserSong: {

        link: row.teaser_link || "",

        status: row.teaser_status || "",

        notes: row.teaser_notes || ""

    },

    monthLocked: monthLocked

}));

        return new Response(

    JSON.stringify(formattedData),

    {

        headers: {

            "Content-Type": "application/json",

            "Cache-Control":
                "no-cache, no-store, must-revalidate"

        }

    }

);

    }

    catch (err) {

        console.error("[API-GET]", err);

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

export async function onRequestPost(context) {

    try {

        const url = new URL(context.request.url);

        const year =
            Number(url.searchParams.get("year")) ||
            new Date().getFullYear();

        const month =
            Number(url.searchParams.get("month")) ||
            (new Date().getMonth() + 1);

        const projects =
            await context.request.json();

        console.log(
            `[API-POST] Saving ${projects.length} records (${month}/${year})`
        );

        // ==========================================
        // SAVE PROJECTS
        // ==========================================

        for (const row of projects) {

            const rowId =
                row.rowId ||
                (projects.indexOf(row) + 1);

            await context.env.DB.prepare(`

INSERT INTO projects (

    project_year,
    project_month,
    row_index,

    couple_name,
    status,
    type,

    raw_files,
drone,
instruction,
watch_link,

song1_link,
song1_status,
song1_notes,

    song2_link,
    song2_status,
    song2_notes,

    song3_link,
    song3_status,
    song3_notes,

    teaser_link,
    teaser_status,
    teaser_notes,

    updated_at

)

VALUES (

    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP

)

ON CONFLICT(project_year, project_month, row_index)

DO UPDATE SET

    couple_name = excluded.couple_name,
    status = excluded.status,
    type = excluded.type,

    raw_files = excluded.raw_files,
drone = excluded.drone,
instruction = excluded.instruction,
watch_link = excluded.watch_link,

song1_link = excluded.song1_link,
song1_status = excluded.song1_status,
song1_notes = excluded.song1_notes,

song2_link = excluded.song2_link,
song2_status = excluded.song2_status,
song2_notes = excluded.song2_notes,

song3_link = excluded.song3_link,
song3_status = excluded.song3_status,
song3_notes = excluded.song3_notes,

teaser_link = excluded.teaser_link,
teaser_status = excluded.teaser_status,
teaser_notes = excluded.teaser_notes,

updated_at = CURRENT_TIMESTAMP

`)
.bind(

    year,

    month,

    rowId,

    row.coupleName || "",

    row.status || "IN PROGRESS",

    row.type || "UPBEAT CINEMATIC",

    row.rawFiles || "",

    row.drone || "",

row.instruction || "",

row.watchLink || "",

row.song1?.link || "",

    row.song1?.status || "",

    row.song1?.notes || "",

    row.song2?.link || "",

    row.song2?.status || "",

    row.song2?.notes || "",

    row.song3?.link || "",

    row.song3?.status || "",

    row.song3?.notes || "",

    row.teaserSong?.link || "",

    row.teaserSong?.status || "",

    row.teaserSong?.notes || ""

)
.run();

        }

        // ==========================================
// SAVE MONTH LOCK
// ==========================================

const locked =
    projects.length > 0 && projects[0].monthLocked ? 1 : 0;

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
    locked

)
.run();

return new Response(

    JSON.stringify({

        success: true,

        message: "Projects saved successfully."

    }),

    {

        headers: {

            "Content-Type": "application/json"

        }

    }

);

}

catch (err) {

    console.error("[API-POST]", err);

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

    onRequestGet,

    onRequestPost

};