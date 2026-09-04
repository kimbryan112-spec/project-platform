export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }
        
        const { user_name, action, details, browser, os, device } = body;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Database not connected" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Sanitization and length trimming to protect D1 performance and prevent overflow
        const sanitizedUserName = String(user_name || "Admin/User").trim().slice(0, 100);
        const sanitizedAction = String(action || "Unknown Action").trim().slice(0, 150);
        const sanitizedDetails = String(details || "").trim().slice(0, 500);
        const sanitizedBrowser = String(browser || "Unknown Browser").trim().slice(0, 50);
        const sanitizedOs = String(os || "Unknown OS").trim().slice(0, 50);
        const sanitizedDevice = String(device || "Desktop").trim().slice(0, 50);

        await env.DB.prepare(`
            INSERT INTO activity_logs (user_name, action, details, browser, os, device)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            sanitizedUserName,
            sanitizedAction,
            sanitizedDetails,
            sanitizedBrowser,
            sanitizedOs,
            sanitizedDevice
        ).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error("[LOGS POST ERROR]:", err.message);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function onRequestGet(context) {
    try {
        const { env } = context;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: "Database not connected" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Kunin ang huling 50 logs nang mabilis at episyente na may limitadong field projection kung kinakailangan
        const { results } = await env.DB.prepare(`
            SELECT id, user_name, action, details, browser, os, device, created_at 
            FROM activity_logs 
            ORDER BY id DESC 
            LIMIT 50
        `).all();

        return new Response(JSON.stringify({ logs: results || [] }), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        });
    } catch (err) {
        console.error("[LOGS GET ERROR]:", err.message);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}