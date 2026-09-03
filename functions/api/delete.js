import { deleteFile } from "../lib/storage.js";
import { deleteCache } from "../lib/cache.js";
import { CACHE_PREFIXES, DEFAULT_HEADERS } from "../lib/constants.js";

export async function onRequestDelete(context) {
    try {
        const { request, env } = context;
        const db = env.DB;
        const kv = env.CACHE;

        if (!db) {
            return new Response(
                JSON.stringify({ success: false, message: "Database not connected." }),
                { status: 500, headers: DEFAULT_HEADERS.JSON }
            );
        }

        const url = new URL(request.url);
        const fileKey = url.searchParams.get("key") || url.searchParams.get("fileKey") || url.searchParams.get("path");
        const fileId = url.searchParams.get("id");

        if (!fileKey && !fileId) {
            return new Response(
                JSON.stringify({ success: false, message: "File key or file ID is required for deletion." }),
                { status: 400, headers: DEFAULT_HEADERS.JSON }
            );
        }

        let targetKey = fileKey;
        let projectId = null;

        if (!targetKey && fileId) {
            const record = await db.prepare(
                `SELECT r2_key, project_id FROM media_files WHERE id = ?`
            ).bind(fileId).first();

            if (record) {
                targetKey = record.r2_key;
                projectId = record.project_id;
            }
        } else if (targetKey) {
            const record = await db.prepare(
                `SELECT project_id FROM media_files WHERE r2_key = ?`
            ).bind(targetKey).first();

            if (record) {
                projectId = record.project_id;
            }
        }

        if (!targetKey) {
            return new Response(
                JSON.stringify({ success: false, message: "File record not found." }),
                { status: 404, headers: DEFAULT_HEADERS.JSON }
            );
        }

        const r2DeleteResult = await deleteFile(env, targetKey);

        if (!r2DeleteResult.success) {
            throw new Error(`Failed to delete file from R2 storage: ${r2DeleteResult.error}`);
        }

        if (fileId) {
            await db.prepare(`DELETE FROM media_files WHERE id = ?`).bind(fileId).run();
        } else {
            await db.prepare(`DELETE FROM media_files WHERE r2_key = ?`).bind(targetKey).run();
        }

        if (kv) {
            try {
                if (projectId) {
                    await deleteCache(kv, `${CACHE_PREFIXES.PROJECT}_${projectId}`);
                }
                await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
            } catch (kvErr) {
                console.error("[KV CACHE INVALIDATION ERROR]:", kvErr);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "File deleted successfully from R2 and database."
            }),
            {
                status: 200,
                headers: DEFAULT_HEADERS.JSON
            }
        );

    } catch (err) {
        console.error("[DELETE API ERROR]:", err.message);
        return new Response(
            JSON.stringify({
                success: false,
                message: err.message || "Internal Server Error during file deletion."
            }),
            {
                status: 500,
                headers: DEFAULT_HEADERS.JSON
            }
        );
    }
}

export default {
    onRequestDelete
};