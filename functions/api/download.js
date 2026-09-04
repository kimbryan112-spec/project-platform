/* ==================================
    DOWNLOAD API (Integrated with R2 storage.js helper & Streaming)
    GET /api/download?key=... - Retrieves and streams a file from R2 via storage.js
================================== */

import { downloadFile } from "../lib/storage.js";

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const fileKey = url.searchParams.get("key") || url.searchParams.get("fileKey") || url.searchParams.get("path");

        if (!fileKey) {
            return new Response(
                JSON.stringify({ success: false, message: "File key or path is required." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 1. Kunin ang file mula sa R2 gamit ang downloadFile() helper ng storage.js (Hindi direktang tatawag sa env.MEDIA_BUCKET)
        const r2Object = await downloadFile(env, fileKey);

        if (!r2Object) {
            return new Response(
                JSON.stringify({ success: false, message: "File not found or no longer available." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // 2. Ihanda ang mga tamang headers para sa pag-stream ng file
        const headers = new Headers();
        
        // Kunan ang tamang content-type mula sa R2 object o gumamit ng fallback
        const contentType = r2Object.httpMetadata?.contentType || "application/octet-stream";
        headers.set("Content-Type", contentType);

        if (r2Object.size) {
            headers.set("Content-Length", r2Object.size.toString());
        }

        // Kunin ang original filename mula sa R2 custom metadata kung meron man, o hanguin sa key
        const filename = r2Object.customMetadata?.originalFilename || fileKey.split("/").pop() || "downloaded-file";
        headers.set("Content-Disposition", `inline; filename="${filename}"`);

        // Magdagdag ng optimal cache control para sa media assets
        headers.set("Cache-Control", "public, max-age=86400");

        // 3. I-stream ang object katawan nang hindi inuubos ang memorya (Low memory usage)
        return new Response(r2Object.body, {
            status: 200,
            headers: headers
        });

    } catch (err) {
        console.error("[DOWNLOAD API ERROR]:", err.message);
        return new Response(
            JSON.stringify({
                success: false,
                message: "Internal Server Error during file download."
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

export default {
    onRequestGet
};