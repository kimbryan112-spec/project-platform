/* ==================================
    REUSABLE CONSTANTS FILE
    functions/lib/constants.js
    Centralizes all shared string literals, prefixes, folder names, and headers.
    No existing APIs or frontend codes are modified.
================================== */

// ==========================================
// 1. CACHE KEY PREFIXES
// ==========================================
export const CACHE_PREFIXES = {
    PROJECTS: "projects",
    PROJECT: "project",
    USERS: "users",
    SETTINGS: "settings",
    NOTIFICATIONS: "notifications",
    MUSIC: "music",
    SESSION: "session"
};

// ==========================================
// 2. R2 FOLDER NAMES / STORAGE PATHS
// ==========================================
export const R2_FOLDERS = {
    PROJECTS: "projects",
    RAW: "raw",
    PREVIEWS: "previews",
    THUMBNAILS: "thumbnails",
    DOCUMENTS: "documents",
    BACKUPS: "backups",
    EXPORTS: "exports",
    TEMP: "temp"
};

// ==========================================
// 3. PROJECT & TASK STATUS VALUES
// ==========================================
export const STATUS_VALUES = {
    PLANNED: "PLANNED",
    PENDING: "PENDING",
    IN_PROGRESS: "IN PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"
};

// ==========================================
// 4. SUPPORTED MIME TYPES (Upload Validation)
// ==========================================
export const SUPPORTED_MIME_TYPES = {
    // Images
    JPEG: "image/jpeg",
    PNG: "image/png",
    WEBP: "image/webp",
    GIF: "image/gif",
    
    // Videos
    MP4: "video/mp4",
    QUICKTIME: "video/quicktime", // .mov
    WEBM: "video/webm",

    // Audio
    MPEG: "audio/mpeg",           // .mp3
    WAV: "audio/wav",
    AAC: "audio/aac",

    // Documents & Archives
    PDF: "application/pdf",
    ZIP: "application/zip",
    OCTET_STREAM: "application/octet-stream"
};

// ==========================================
// 5. FILE CATEGORIES
// ==========================================
export const FILE_CATEGORIES = {
    IMAGE: "image",
    VIDEO: "video",
    AUDIO: "audio",
    DOCUMENT: "document",
    BACKUP: "backup"
};

// ==========================================
// 6. DEFAULT HTTP HEADERS
// ==========================================
export const DEFAULT_HEADERS = {
    JSON: {
        "Content-Type": "application/json"
    },
    NO_CACHE: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate"
    },
    STANDARD_CACHE: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60"
    }
};

// ==========================================
// 7. GROUPED CONSTANTS OBJECT EXPORT
// ==========================================
export const CONSTANTS = {
    cachePrefixes: CACHE_PREFIXES,
    r2Folders: R2_FOLDERS,
    status: STATUS_VALUES,
    mimeTypes: SUPPORTED_MIME_TYPES,
    fileCategories: FILE_CATEGORIES,
    headers: DEFAULT_HEADERS
};

export default CONSTANTS;