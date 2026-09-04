import { uploadFile } from "../lib/storage.js";
import { R2_FOLDERS, DEFAULT_HEADERS } from "../lib/constants.js";

export async function onRequestPost(context) {
    try {
        const { env } = context;
        const db = env.DB;

        if (!db) {
            return new Response(
                JSON.stringify({ success: false, message: "Database not connected." }),
                { status: 500, headers: DEFAULT_HEADERS.JSON }
            );
        }

        const users = await db.prepare("SELECT * FROM users").all();
        const projects = await db.prepare("SELECT * FROM projects").all();
        const monthLocks = await db.prepare("SELECT * FROM month_locks").all();
        const mediaFiles = await db.prepare("SELECT * FROM media_files").all();
        const notifications = await db.prepare("SELECT * FROM notifications").all();

        const backupData = {
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            tables: {
                users: users.results || [],
                projects: projects.results || [],
                month_locks: monthLocks.results || [],
                media_files: mediaFiles.results || [],
                notifications: notifications.results || []
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const dateStr = new Date().toISOString().slice(0, 10);
        const backupFilename = `backup_${dateStr}_${Date.now()}.json`;
        const r2Key = `${R2_FOLDERS.BACKUPS}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${backupFilename}`;

        if (env.MEDIA_BUCKET) {
            await uploadFile(env, r2Key, jsonString, {
                contentType: "application/json",
                customMetadata: { type: "system_backup" }
            });
        }

        return new Response(jsonString, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${backupFilename}"`,
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        });

    } catch (err) {
        console.error("[BACKUP API ERROR]:", err.message);
        return new Response(
            JSON.stringify({ success: false, message: err.message || "Internal Server Error during backup." }),
            { status: 500, headers: DEFAULT_HEADERS.JSON }
        );
    }
}

export default {
    onRequestPost
};