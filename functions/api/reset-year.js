export async function onRequestPost(context) {

    try {

        const { year } = await context.request.json();

        console.log(
            `[RESET YEAR] ${year}`
        );

        const result = await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
        `)
        .bind(
            Number(year)
        )
        .run();

        return Response.json({

            success: true,

            message: `Year ${year} reset successfully.`,

            deleted: result.meta?.changes || 0

        });

    }

    catch (err) {

        console.error("[RESET YEAR]", err);

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