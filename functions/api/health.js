/**
 * ============================================================================
 * KBHFILMS PROJECT PLATFORM — CLOUD HEALTH CHECK API
 * ============================================================================
 * Objective: 
 * Returns a lightweight status confirming if the Cloudflare Worker 
 * and D1 binding are responsive and reachable.
 * ============================================================================
 */

export async function onRequestGet(context) {
    try {
        const db = context.env.DB; // Siguraduhing 'DB' ang pangalan ng iyong D1 binding sa wrangler.toml
        
        if (!db) {
            return Response.json(
                { status: "error", message: "D1 database binding missing" },
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Pinakamagaan na query para sa D1 health check (Walang mabigat na table scan)
        await db.prepare("SELECT 1").first();

        return Response.json(
            { 
                status: "healthy", 
                timestamp: Date.now() 
            },
            { 
                status: 200, 
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store, no-cache, must-revalidate"
                } 
            }
        );

    } catch (err) {
        return Response.json(
            { 
                status: "unhealthy", 
                error: err.message 
            },
            { 
                status: 503, 
                headers: { "Content-Type": "application/json" } 
            }
        );
    }
}