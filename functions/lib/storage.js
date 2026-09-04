/* ==================================
    STORAGE HELPER (Cloudflare R2)
================================== */

export function generateObjectKey(originalName = "file") {
    const timestamp = Date.now();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${timestamp}_${cleanName}`;
}

export async function uploadFile(bucket, key, fileStream, customMetadata = {}) {
    try {
        await bucket.put(key, fileStream, {
            customMetadata
        });
        return { success: true, key };
    } catch (err) {
        console.error("[R2 UPLOAD ERROR]:", err);
        throw err;
    }
}

export async function downloadFile(bucket, key) {
    try {
        const object = await bucket.get(key);
        if (!object) {
            return null;
        }
        return object;
    } catch (err) {
        console.error("[R2 DOWNLOAD ERROR]:", err);
        throw err;
    }
}

export async function deleteFile(bucket, key) {
    try {
        await bucket.delete(key);
        return { success: true };
    } catch (err) {
        console.error("[R2 DELETE ERROR]:", err);
        throw err;
    }
}