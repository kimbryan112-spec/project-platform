export async function onRequestPost(context) {

    try {

        const { year } = await context.request.json();

        await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE strftime('%Y', updated_at)=?
        `)
        .bind(String(year))
        .run();

        return Response.json({
            success: true,
            message: "Year reset completed successfully."
        });

    } catch (err) {

        return Response.json({
            success: false,
            message: err.message
        }, {
            status: 500
        });

    }

}