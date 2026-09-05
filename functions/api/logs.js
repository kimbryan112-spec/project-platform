export async function onRequestGet(context) {
    try {
        const { request, env } = context;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Database not connected" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const url = new URL(request.url);
        const isCountOnly = url.searchParams.get("count") === "true";

        if (isCountOnly) {
            const { results } = await env.DB.prepare(`
                SELECT COUNT(*) as total FROM activity_logs
            `).all();
            return new Response(JSON.stringify({ count: results[0]?.total || 0 }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
            });
        }

        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const offset = parseInt(url.searchParams.get("offset")) || 0;

        const { results } = await env.DB.prepare(`
            SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).bind(limit, offset).all();

        return new Response(JSON.stringify({ logs: results || [] }), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}