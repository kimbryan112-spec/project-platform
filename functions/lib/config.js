/* ==================================
    CENTRALIZED CONFIGURATION FILE
    functions/lib/config.js
    Central source for all configurable values and feature flags.
    No existing behavior or business logic is modified.
================================== */

// ==========================================
// 1. CLOUDFLARE WORKERS KV CACHE TTLs (Seconds)
// ==========================================
export const KV_CACHE_TTL = {
    DEFAULT: 3600,         // 1 Hour
    PROJECTS: 3600,        // 1 Hour
    SETTINGS: 86400,       // 24 Hours
    USERS: 43200,          // 12 Hours (12 * 60 * 60)
    NOTIFICATIONS: 30,     // 30 Seconds for unread badge counts
    MUSIC_RECOMMENDATION: 86400 // 24 Hours
};

// ==========================================
// 2. EDGE CACHE & BROWSER CACHE CONFIGURATION
// ==========================================
export const EDGE_CACHE_CONFIG = {
    DEFAULT_EDGE_TTL: 3600,          // 1 Hour
    BROWSER_CACHE_TTL: 60,           // 60 Seconds
    STALE_WHILE_REVALIDATE: 300      // 5 Minutes
};

// ==========================================
// 3. PAGINATION LIMITS
// ==========================================
export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

// ==========================================
// 4. UPLOAD & FILE SIZE LIMITS (Bytes)
// ==========================================
export const UPLOAD_LIMITS = {
    MAX_UPLOAD_SIZE: 5368709120,    // 5 GB (Supports large wedding raw video files)
    MAX_BACKUP_SIZE: 1073741824,    // 1 GB
    MAX_IMAGE_SIZE: 52428800        // 50 MB
};

// ==========================================
// 5. DEFAULT SYSTEM VALUES
// ==========================================
export const SYSTEM_DEFAULTS = {
    DEFAULT_YEAR: 2026,
    DEFAULT_MONTH: 1,
    DEFAULT_TIMEZONE: "Asia/Manila",
    DEFAULT_LOCALE: "en-PH"
};

// ==========================================
// 6. FEATURE FLAGS (Reflecting existing capabilities)
// ==========================================
export const FEATURE_FLAGS = {
    ENABLE_WORKERS_KV: true,
    ENABLE_EDGE_CACHE: true,
    ENABLE_R2_STORAGE: true,
    ENABLE_AI_MUSIC_CACHE: true,
    ENABLE_DEBUG_LOGGING: true
};

// ==========================================
// 7. GROUPED CONFIGURATION OBJECT EXPORT
// ==========================================
export const CONFIG = {
    kv: KV_CACHE_TTL,
    edgeCache: EDGE_CACHE_CONFIG,
    pagination: PAGINATION_CONFIG,
    uploadLimits: UPLOAD_LIMITS,
    defaults: SYSTEM_DEFAULTS,
    features: FEATURE_FLAGS
};

export default CONFIG;