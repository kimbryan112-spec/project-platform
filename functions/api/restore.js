/* ==================================
    DYNAMIC RESTORE API (All Tables)
    POST /api/restore
================================== */

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.DB) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Database not connected."
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        console.log("[RESTORE] Starting full system restore...");

        let backup = {};
        try {
            backup = await request.json();
        } catch (e) {
            backup = {};
        }

        // 1. Siguraduhing tama ang format ng file at may 'data' object
        if (!backup || !backup.data || typeof backup.data !== "object") {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Invalid backup file format."
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const tablesData = backup.data;
        const tableNames = Object.keys(tablesData);

        // 2. I-off muna ang foreign key checks para maiwasan ang conflict habang nagbubura at nagpapasok
        await env.DB.prepare(`PRAGMA foreign_keys = OFF;`).run();

        // 3. Linisin ang mga lumang laman ng bawat table
        for (const tableName of tableNames) {
            await env.DB.prepare(`DELETE FROM "${tableName}";`).run();
        }

        // 4. I-insert pabalik ang mga records para sa bawat table
        for (const tableName of tableNames) {
            const rows = tablesData[tableName];
            
            if (!Array.isArray(rows) || rows.length === 0) continue;

            for (const row of rows) {
                const columns = Object.keys(row);
                const values = Object.values(row);
                
                // Gumawa ng dynamic placeholders (?, ?, ?) base sa dami ng columns
                const placeholders = columns.map(() => "?").join(", ");
                const quotedColumns = columns.map(col => `"${col}"`).join(", ");

                const query = `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${placeholders})`;
                
                await env.DB.prepare(query).bind(...values).run();
            }
            console.log(`[RESTORE] Restored ${rows.length} record(s) to table: ${tableName}`);
        }

        // 5. I-on ulit ang foreign keys
        await env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Full system restored successfully."
            }),
            {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store, no-cache, must-revalidate"
                }
            }
        );

    }
    catch (err) {
        console.error("[RESTORE ERROR]:", err.message);

        // Siguraduhing ibabalik ang foreign keys kahit magka-error
        try {
            await context.env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();
        } catch (e) {}

        return new Response(
            JSON.stringify({
                success: false,
                message: "Internal Server Error"
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

export default {
    onRequestPost
};