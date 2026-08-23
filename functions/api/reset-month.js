export async function onRequestPost(context) {

    try {

        const { month, year } = await context.request.json();

        console.log(
            `[RESET MONTH] ${month}/${year}`
        );

        const result = await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
              AND project_month = ?
        `)
        .bind(
            Number(year),
            Number(month)
        )
        .run();

        return Response.json({

            success: true,

            message: `Month ${month}/${year} reset successfully.`,

            deleted: result.meta?.changes || 0

        });

    }

    catch (err) {

        console.error("[RESET MONTH]", err);

        return Response.json({

            success: false,

            message: err.message

        }, {

            status: 500

        });

    }

}

export default {

    onRequestPost

};