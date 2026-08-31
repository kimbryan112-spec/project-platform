export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Headers para sa lokal at deployed app
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. GET PROJECTS API
      if (path === "/api/projects" && method === "GET") {
        const year = url.searchParams.get("year");
        const month = url.searchParams.get("month");

        if (!year || !month) {
          return new Response(JSON.stringify({ error: "Missing year or month" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const stmt = env.DB.prepare(
          "SELECT data FROM projects WHERE year = ? AND month = ?"
        );
        const result = await stmt.bind(year, month).first();

        let projects = [];
        if (result && result.data) {
          projects = JSON.parse(result.data);
        }

        // Kunin din ang locked months at hasData months
        const lockStmt = env.DB.prepare("SELECT month_key, locked FROM month_locks WHERE year = ?");
        const locksResult = await lockStmt.bind(year).all();
        let lockedMonths = {};
        if (locksResult && locksResult.results) {
          locksResult.results.forEach(row => {
            lockedMonths[row.month_key] = row.locked === 1;
          });
        }

        return new Response(JSON.stringify({ projects, lockedMonths }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 2. POST PROJECTS API (SAVE)
      if (path === "/api/projects" && method === "POST") {
        const year = url.searchParams.get("year");
        const month = url.searchParams.get("month");
        const body = await request.json();

        if (!year || !month) {
          return new Response(JSON.stringify({ error: "Missing year or month" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const dataStr = JSON.stringify(body);

        await env.DB.prepare(
          `INSERT INTO projects (year, month, data) VALUES (?, ?, ?)
           ON CONFLICT(year, month) DO UPDATE SET data = ?`
        ).bind(year, month, dataStr, dataStr).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. MONTH LOCK API
      if (path === "/api/month-lock" && method === "POST") {
        const { year, month, locked } = await request.json();
        const monthKey = `${year}_${month}`;
        const isLocked = locked ? 1 : 0;

        await env.DB.prepare(
          `INSERT INTO month_locks (year, month_key, locked) VALUES (?, ?, ?)
           ON CONFLICT(year, month_key) DO UPDATE SET locked = ?`
        ).bind(year, monthKey, isLocked, isLocked).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 4. ACTIVITY LOGS API (GET & POST)
      if (path === "/api/logs") {
        if (method === "GET") {
          const limit = url.searchParams.get("limit") || 50;
          const result = await env.DB.prepare(
            "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?"
          ).bind(Number(limit)).all();

          return new Response(JSON.stringify({ logs: result.results || [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (method === "POST") {
          const logData = await request.json();
          const {
            user_name, action, details, ip_address, country, browser, os, device
          } = logData;

          await env.DB.prepare(
            `INSERT INTO activity_logs (user_name, action, details, ip_address, country, browser, os, device)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            user_name || "Unknown",
            action || "ACTION",
            details || "",
            ip_address || request.headers.get("CF-Connecting-IP") || "127.0.0.1",
            country || request.headers.get("CF-IPCountry") || "PH",
            browser || "",
            os || "",
            device || ""
          ).run();

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};