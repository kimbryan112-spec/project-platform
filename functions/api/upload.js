import { uploadFile, generateObjectKey } from "../lib/storage.js";
import { DEFAULT_HEADERS } from "../lib/constants.js";

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.DB) {
            return new Response(
                JSON.stringify({ success: false, message: "Database not connected." }),
                { status: 500, headers: DEFAULT_HEADERS.JSON }
            );
        }

        if (!env.MEDIA_BUCKET) {
            return new Response(
                JSON.stringify({ success: false, message: "R2 Storage binding is missing." }),
                { status: 500, headers: DEFAULT_HEADERS.JSON }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const projectId = formData.get("projectId") || formData.get("project_id") || "general";
        const category = formData.get("category") || "raw";
        const uploadedBy = formData.get("uploadedBy") || formData.get("user_name") || "Admin/User";

        if (!file || typeof file === "string") {
            return new Response(
                JSON.stringify({ success: false, message: "No valid file uploaded." }),
                { status: 400, headers: DEFAULT_HEADERS.JSON }
            );
        }

        const originalFilename = file.name || "unnamed_file";
        const mimeType = file.type || "application/octet-stream";
        const fileSize = file.size || 0;

        const r2Key = generateObjectKey(projectId, category, originalFilename);

        const uploadResult = await uploadFile(env, r2Key, file.stream(), {
            contentType: mimeType,
            customMetadata: {
                originalFilename: originalFilename,
                uploadedBy: String(uploadedBy)
            }
        });

        if (!uploadResult.success) {
            throw new Error(`R2 Upload failed: ${uploadResult.error}`);
        }

        await env.DB.prepare(`
            INSERT INTO media_files (project_id, filename, original_filename, mime_type, size, r2_key, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            projectId,
            originalFilename,
            originalFilename,
            mimeType,
            fileSize,
            r2Key,
            uploadedBy
        ).run();

        return new Response(
            JSON.stringify({
                success: true,
                message: "File uploaded successfully.",
                file: {
                    filename: originalFilename,
                    original_filename: originalFilename,
                    mime_type: mimeType,
                    size: fileSize,
                    r2_key: r2Key,
                    url: `/api/files?key=${encodeURIComponent(r2Key)}`
                }
            }),
            {
                status: 200,
                headers: DEFAULT_HEADERS.JSON
            }
        );

    } catch (err) {
        console.error("[UPLOAD API ERROR]:", err.message);
        return new Response(
            JSON.stringify({
                success: false,
                message: err.message || "Internal Server Error during upload."
            }),
            {
                status: 500,
                headers: DEFAULT_HEADERS.JSON
            }
        );
    }
}

export default {
    onRequestPost
};