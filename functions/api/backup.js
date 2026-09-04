// ==================================
// DYNAMIC BACKUP API (All Tables)
// GET /api/backup
// ==================================

export async function onRequestGet(context) {
    try {
        console.log("[BACKUP] Starting full system backup...");

        // 1. Kunin ang lahat ng table names sa database nang awtomatiko
        const tablesResult = await context.env.DB.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%' 
            AND name NOT LIKE '_cf_%'
        `).all();

        const tables = tablesResult.results;
        const backupData = {};

        // 2. I-loop ang bawat table para makuha ang lahat ng records nito
        for (const t of tables) {
            const tableName = t.name;
            const tableRecords = await context.env.DB.prepare(`SELECT * FROM "${tableName}"`).all();
            backupData[tableName] = tableRecords.results;
            console.log(`[BACKUP] Exported ${tableRecords.results.length} record(s) from table: ${tableName}`);
        }

        const backup = {
            version: "2.0",
            exportedAt: new Date().toISOString(),
            data: backupData
        };

        // 3. I-download bilang JSON file
        return new Response(
            JSON.stringify(backup, null, 2),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="kbhfilms-full-backup-${Date.now()}.json"`,
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }
    catch (err) {
        console.error("[BACKUP] Error:", err);

        return new Response(
            JSON.stringify({
                success: false,
                error: err.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}

export default {
    onRequestGet
};