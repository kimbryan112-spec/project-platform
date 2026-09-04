// ==================================
// DYNAMIC RESTORE API (All Tables)
// POST /api/restore
// ==================================

export async function onRequestPost(context) {
    try {
        console.log("[RESTORE] Starting full system restore...");

        const backup = await context.request.json();

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
        await context.env.DB.prepare(`PRAGMA foreign_keys = OFF;`).run();

        // 3. Linisin ang mga lumang laman ng bawat table (baliktad o diretso)
        for (const tableName of tableNames) {
            await context.env.DB.prepare(`DELETE FROM "${tableName}";`).run();
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
                
                await context.env.DB.prepare(query).bind(...values).run();
            }
            console.log(`[RESTORE] Restored ${rows.length} record(s) to table: ${tableName}`);
        }

        // 5. I-on ulit ang foreign keys
        await context.env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Full system restored successfully."
            }),
            {
                headers: { "Content-Type": "application/json" }
            }
        );

    }
    catch (err) {
        console.error("[RESTORE] Error:", err);

        // Siguraduhing ibabalik ang foreign keys kahit magka-error
        try {
            await context.env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();
        } catch (e) {}

        return new Response(
            JSON.stringify({
                success: false,
                message: err.message
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