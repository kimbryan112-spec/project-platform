// ==================================
// DYNAMIC RESTORE API (All Tables & Cloud Backup Supported)
// POST /api/restore
// ==================================

export async function onRequestPost(context) {
    try {
        console.log("[RESTORE] Starting full system restore...");

        const backup = await context.request.json();

        // 1. Suriin kung valid ang backup data (suportahan ang parehong format)
        let tablesData = null;

        if (backup && backup.data && typeof backup.data === "object") {
            // New dynamic multi-table format
            tablesData = backup.data;
        } else if (backup && Array.isArray(backup.projects)) {
            // Classic cloud backup format (projects array lamang)
            tablesData = { projects: backup.projects };
        } else if (backup && typeof backup === "object" && !Array.isArray(backup)) {
            // LocalStorage / Key-Value backup format na ginawang object
            // Kung may mga keys na nagsisimula sa table o projects, maaari nating i-map
            tablesData = backup;
        }

        if (!tablesData || typeof tablesData !== "object" || Object.keys(tablesData).length === 0) {
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

        const tableNames = Object.keys(tablesData);

        // 2. I-off muna ang foreign key checks para maiwasan ang conflict habang nagbubura at nagpapasok
        await context.env.DB.prepare(`PRAGMA foreign_keys = OFF;`).run();

        // 3. Linisin ang mga lumang laman ng bawat table kung ito ay valid tables sa D1
        for (const tableName of tableNames) {
            // Huwag pansinin ang mga Non-table metadata keys kung galing sa LocalStorage backup
            if (tableName.startsWith("projects_") || tableName === "currentUser" || tableName === "monthLocks" || tableName === "lastBackup") {
                continue;
            }

            try {
                await context.env.DB.prepare(`DELETE FROM "${tableName}";`).run();
            } catch (tableErr) {
                console.warn(`[RESTORE] Skipping delete for non-database key: ${tableName}`);
            }
        }

        // 4. I-insert pabalik ang mga records para sa bawat table
        for (const tableName of tableNames) {
            const rows = tablesData[tableName];
            
            // Kung ito ay LocalStorage key-value pairs kaysa sa database table rows, i-handle nang maayos
            if (tableName.startsWith("projects_") || tableName === "monthLocks") {
                continue; // Ang mga ito ay client-side storage, hindi D1 tables
            }

            if (!Array.isArray(rows) || rows.length === 0) continue;

            for (const row of rows) {
                if (!row || typeof row !== "object") continue;

                const columns = Object.keys(row);
                const values = Object.values(row);
                
                if (columns.length === 0) continue;

                // Gumawa ng dynamic placeholders (?, ?, ?) base sa dami ng columns
                const placeholders = columns.map(() => "?").join(", ");
                const quotedColumns = columns.map(col => `"${col}"`).join(", ");

                const query = `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${placeholders})`;
                
                try {
                    await context.env.DB.prepare(query).bind(...values).run();
                } catch (insertErr) {
                    console.error(`[RESTORE] Error inserting into ${tableName}:`, insertErr.message);
                }
            }
            console.log(`[RESTORE] Restored record(s) to table/section: ${tableName}`);
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