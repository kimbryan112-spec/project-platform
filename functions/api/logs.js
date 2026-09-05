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
        console.error("[LOGS GET ERROR]", err);

        const errorMessage = err.message || "Internal Server Error";
        const isQuotaError = errorMessage.toLowerCase().includes("quota") || 
                             errorMessage.toLowerCase().includes("limit") ||
                             errorMessage.toLowerCase().includes("exceeded") ||
                             errorMessage.toLowerCase().includes("too many requests");

        return new Response(JSON.stringify({ 
            success: false,
            error: errorMessage,
            errorType: isQuotaError ? "QUOTA_EXCEEDED" : "SERVER_ERROR"
        }), {
            status: isQuotaError ? 429 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}