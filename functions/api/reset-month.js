export async function onRequestPost(context) {

    try {

        const { month, year } = await context.request.json();

        await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE strftime('%Y', updated_at)=?
            AND strftime('%m', updated_at)=?
        `)
        .bind(
            String(year),
            String(month).padStart(2, "0")
        )
        .run();

        return Response.json({
            success: true,
            message: "Month reset completed successfully."
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