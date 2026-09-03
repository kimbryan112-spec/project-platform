var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-Kpw1Gw/functionsWorker-0.4457018496366826.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function generateObjectKey(originalName = "file") {
  const timestamp = Date.now();
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${timestamp}_${cleanName}`;
}
__name(generateObjectKey, "generateObjectKey");
__name2(generateObjectKey, "generateObjectKey");
async function uploadFile(bucket, key, fileStream, customMetadata = {}) {
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
__name(uploadFile, "uploadFile");
__name2(uploadFile, "uploadFile");
async function downloadFile(bucket, key) {
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
__name(downloadFile, "downloadFile");
__name2(downloadFile, "downloadFile");
async function deleteFile(bucket, key) {
  try {
    await bucket.delete(key);
    return { success: true };
  } catch (err) {
    console.error("[R2 DELETE ERROR]:", err);
    throw err;
  }
}
__name(deleteFile, "deleteFile");
__name2(deleteFile, "deleteFile");
var CACHE_PREFIXES = {
  PROJECTS: "projects",
  PROJECT: "project",
  USERS: "users",
  SETTINGS: "settings",
  NOTIFICATIONS: "notifications",
  MUSIC: "music",
  SESSION: "session"
};
var R2_FOLDERS = {
  PROJECTS: "projects",
  RAW: "raw",
  PREVIEWS: "previews",
  THUMBNAILS: "thumbnails",
  DOCUMENTS: "documents",
  BACKUPS: "backups",
  EXPORTS: "exports",
  TEMP: "temp"
};
var DEFAULT_HEADERS = {
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
async function onRequestPost(context) {
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      tables: {
        users: users.results || [],
        projects: projects.results || [],
        month_locks: monthLocks.results || [],
        media_files: mediaFiles.results || [],
        notifications: notifications.results || []
      }
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const backupFilename = `backup_${dateStr}_${Date.now()}.json`;
    const r2Key = `${R2_FOLDERS.BACKUPS}/${(/* @__PURE__ */ new Date()).getFullYear()}/${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}/${backupFilename}`;
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
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function getCache(kv, key) {
  if (!kv) return null;
  try {
    const rawData = await kv.get(key);
    if (!rawData) return null;
    return JSON.parse(rawData);
  } catch (err) {
    console.error(`[CACHE GET ERROR] Key: ${key}`, err.message);
    return null;
  }
}
__name(getCache, "getCache");
__name2(getCache, "getCache");
async function setCache(kv, key, data, ttl = null) {
  if (!kv) return;
  try {
    const options = {};
    if (ttl && typeof ttl === "number") {
      options.expirationTtl = ttl;
    }
    await kv.put(key, JSON.stringify(data), options);
  } catch (err) {
    console.error(`[CACHE SET ERROR] Key: ${key}`, err.message);
  }
}
__name(setCache, "setCache");
__name2(setCache, "setCache");
async function deleteCache(kv, key) {
  if (!kv) return;
  try {
    await kv.delete(key);
  } catch (err) {
    console.error(`[CACHE DELETE ERROR] Key: ${key}`, err.message);
  }
}
__name(deleteCache, "deleteCache");
__name2(deleteCache, "deleteCache");
async function clearCacheByPrefix(kv, prefix) {
  if (!kv) return;
  try {
    let cursor = void 0;
    do {
      const list = await kv.list({ prefix, cursor });
      for (const keyObj of list.keys) {
        await kv.delete(keyObj.name);
      }
      cursor = list.cursor;
    } while (cursor);
  } catch (err) {
    console.error(`[CACHE PREFIX CLEAR ERROR] Prefix: ${prefix}`, err.message);
  }
}
__name(clearCacheByPrefix, "clearCacheByPrefix");
__name2(clearCacheByPrefix, "clearCacheByPrefix");
async function onRequestDelete(context) {
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
__name(onRequestDelete, "onRequestDelete");
__name2(onRequestDelete, "onRequestDelete");
async function onRequestDelete2(context) {
  try {
    const { env } = context;
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database not connected."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("[DELETE ALL] Clearing database (projects)...");
    const result = await env.DB.prepare(`
            DELETE FROM projects
        `).run();
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database cleared successfully.",
        deleted: result.meta?.changes || 0
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch (err) {
    console.error("[DELETE ALL ERROR]:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error"
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
__name(onRequestDelete2, "onRequestDelete2");
__name2(onRequestDelete2, "onRequestDelete");
async function onRequestGet(context) {
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
    const r2Object = await downloadFile(env, fileKey);
    if (!r2Object) {
      return new Response(
        JSON.stringify({ success: false, message: "File not found or no longer available." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const headers = new Headers();
    const contentType = r2Object.httpMetadata?.contentType || "application/octet-stream";
    headers.set("Content-Type", contentType);
    if (r2Object.size) {
      headers.set("Content-Length", r2Object.size.toString());
    }
    const filename = r2Object.customMetadata?.originalFilename || fileKey.split("/").pop() || "downloaded-file";
    headers.set("Content-Disposition", `inline; filename="${filename}"`);
    headers.set("Cache-Control", "public, max-age=86400");
    return new Response(r2Object.body, {
      status: 200,
      headers
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
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
var KV_CACHE_TTL = {
  DEFAULT: 3600,
  // 1 Hour
  PROJECTS: 3600,
  // 1 Hour
  SETTINGS: 86400,
  // 24 Hours
  USERS: 43200,
  // 12 Hours (12 * 60 * 60)
  NOTIFICATIONS: 30,
  // 30 Seconds for unread badge counts
  MUSIC_RECOMMENDATION: 86400
  // 24 Hours
};
var EDGE_CACHE_CONFIG = {
  DEFAULT_EDGE_TTL: 3600,
  // 1 Hour
  BROWSER_CACHE_TTL: 60,
  // 60 Seconds
  STALE_WHILE_REVALIDATE: 300
  // 5 Minutes
};
var PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};
async function onRequestPost2(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and password are required." }),
        { status: 400, headers: DEFAULT_HEADERS.JSON }
      );
    }
    if (!env.DB) {
      throw new Error("D1 Database binding (DB) is not configured.");
    }
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1"
    ).bind(email).first();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email or password." }),
        { status: 401, headers: DEFAULT_HEADERS.JSON }
      );
    }
    let passwordValid = false;
    if (user.password_hash) {
      passwordValid = user.password_hash === password || user.password === password;
    } else {
      passwordValid = user.password === password;
    }
    if (!passwordValid) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email or password." }),
        { status: 401, headers: DEFAULT_HEADERS.JSON }
      );
    }
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const sessionPayload = {
      userId: String(user.id || user.user_id || ""),
      email: user.email,
      name: user.name || user.full_name || "Kim Bryan Hernandez",
      role: user.role || "user",
      permissions: user.permissions || "",
      loginAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const kv = env.CACHE || env.KV_CACHE;
    if (kv) {
      try {
        await kv.put(
          `${CACHE_PREFIXES.SESSION}:${token}`,
          JSON.stringify(sessionPayload),
          { expirationTtl: KV_CACHE_TTL.SETTINGS }
          // Standard 24h session TTL
        );
      } catch (kvErr) {
        console.error("[KV SESSION ERROR] Failed to store session in KV:", kvErr);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: sessionPayload,
        message: "Login successful."
      }),
      {
        status: 200,
        headers: DEFAULT_HEADERS.NO_CACHE
      }
    );
  } catch (err) {
    console.error("[LOGIN API ERROR]:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Internal Server Error"
      }),
      {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      }
    );
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
async function onRequestGet2(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const kv = env.CACHE || env.KV_CACHE;
    if (!token || !kv) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: DEFAULT_HEADERS.JSON }
      );
    }
    const sessionData = await kv.get(`${CACHE_PREFIXES.SESSION}:${token}`, "json");
    if (!sessionData) {
      return new Response(
        JSON.stringify({ success: false, message: "Session expired or invalid." }),
        { status: 401, headers: DEFAULT_HEADERS.JSON }
      );
    }
    return new Response(
      JSON.stringify({ success: true, user: sessionData }),
      { headers: DEFAULT_HEADERS.NO_CACHE }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestDelete3(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const kv = env.CACHE || env.KV_CACHE;
    if (token && kv) {
      await kv.delete(`${CACHE_PREFIXES.SESSION}:${token}`);
    }
    return new Response(
      JSON.stringify({ success: true, message: "Logged out successfully." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestDelete3, "onRequestDelete3");
__name2(onRequestDelete3, "onRequestDelete");
var CACHE_BASE = "activity_logs_latest";
async function onRequestPost3(context) {
  try {
    const { request, env } = context;
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const { user_name, action, details, browser, os, device } = body;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "Database not connected" }), {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      });
    }
    const sanitizedUserName = String(user_name || "Admin/User").trim().slice(0, 100);
    const sanitizedAction = String(action || "Unknown Action").trim().slice(0, 150);
    const sanitizedDetails = String(details || "").trim().slice(0, 500);
    const sanitizedBrowser = String(browser || "Unknown Browser").trim().slice(0, 50);
    const sanitizedOs = String(os || "Unknown OS").trim().slice(0, 50);
    const sanitizedDevice = String(device || "Desktop").trim().slice(0, 50);
    await env.DB.prepare(`
            INSERT INTO activity_logs (user_name, action, details, browser, os, device)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
      sanitizedUserName,
      sanitizedAction,
      sanitizedDetails,
      sanitizedBrowser,
      sanitizedOs,
      sanitizedDevice
    ).run();
    if (env.CACHE) {
      try {
        await deleteCache(env.CACHE, CACHE_BASE);
      } catch (kvDelErr) {
        console.error("[KV LOGS DELETE ERROR]:", kvDelErr);
      }
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: DEFAULT_HEADERS.JSON
    });
  } catch (err) {
    console.error("[LOGS POST ERROR]:", err.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: DEFAULT_HEADERS.JSON
    });
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
async function onRequestGet3(context) {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "Database not connected" }), {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      });
    }
    const url = new URL(request.url);
    const limitParam = parseInt(url.searchParams.get("limit"), 10);
    const pageParam = parseInt(url.searchParams.get("page"), 10);
    const limit = !isNaN(limitParam) && limitParam > 0 ? Math.min(limitParam, PAGINATION_CONFIG.MAX_PAGE_SIZE) : PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
    const offset = (page - 1) * limit;
    const kv = env.CACHE;
    const cacheKey = `${CACHE_BASE}_${limit}_${page}`;
    if (kv && page === 1) {
      try {
        const cachedLogs = await getCache(kv, cacheKey);
        if (cachedLogs) {
          return new Response(JSON.stringify({ logs: cachedLogs }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "private, max-age=10"
            }
          });
        }
      } catch (kvReadErr) {
        console.error("[KV LOGS READ ERROR]:", kvReadErr);
      }
    }
    const { results } = await env.DB.prepare(`
            SELECT id, user_name, action, details, browser, os, device, created_at 
            FROM activity_logs 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `).bind(limit, offset).all();
    const logs = results || [];
    if (kv && page === 1) {
      try {
        await setCache(kv, cacheKey, logs, KV_CACHE_TTL.NOTIFICATIONS);
      } catch (kvWriteErr) {
        console.error("[KV LOGS WRITE ERROR]:", kvWriteErr);
      }
    }
    return new Response(JSON.stringify({ logs }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=10"
      }
    });
  } catch (err) {
    console.error("[LOGS GET ERROR]:", err.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: DEFAULT_HEADERS.JSON
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestPost4(context) {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database not connected."
        }),
        {
          status: 500,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const year = Number(body.year);
    const month = Number(body.month);
    const locked = Boolean(body.locked);
    if (!year || !month) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Year and month are required."
        }),
        {
          status: 400,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    await env.DB.prepare(`
            INSERT INTO month_locks (
                project_year,
                project_month,
                locked,
                updated_at
            )
            VALUES (
                ?, ?, ?, CURRENT_TIMESTAMP
            )
            ON CONFLICT(project_year, project_month)
            DO UPDATE SET
                locked = excluded.locked,
                updated_at = CURRENT_TIMESTAMP
        `).bind(
      year,
      month,
      locked ? 1 : 0
    ).run();
    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        status: 200,
        headers: DEFAULT_HEADERS.NO_CACHE
      }
    );
  } catch (err) {
    console.error("[MONTH LOCK ERROR]:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error"
      }),
      {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      }
    );
  }
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
async function askOpenAI(prompt, apiKey) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // O kaya ay "gpt-4o" depende sa gusto mo
        messages: [
          {
            role: "system",
            content: "You are a professional music director and wedding film assistant. Always return valid JSON only, without markdown code blocks if possible, or formatted cleanly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[OPENAI API ERROR RESPONSE]:", errorText);
      throw new Error(`OpenAI API failed with status ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("[OPENAI HELPER ERROR]:", err.message);
    throw err;
  }
}
__name(askOpenAI, "askOpenAI");
__name2(askOpenAI, "askOpenAI");
async function generateCacheKey(project) {
  const rawString = [
    project.coupleName || "",
    project.type || "",
    project.status || "",
    project.instruction || "",
    project.concerns || "",
    project.drone || "",
    project.rawFiles || ""
  ].join("_").toLowerCase();
  const msgBuffer = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${CACHE_PREFIXES.MUSIC}_${hashHex}`;
}
__name(generateCacheKey, "generateCacheKey");
__name2(generateCacheKey, "generateCacheKey");
async function onRequestPost5(context) {
  try {
    const { request, env } = context;
    let project = {};
    try {
      project = await request.json();
    } catch (e) {
      project = {};
    }
    console.log("[AI MUSIC DIRECTOR REQUEST]", project);
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured in Cloudflare environment variables.");
    }
    const kv = env.CACHE;
    if (kv) {
      try {
        const cacheKey = await generateCacheKey(project);
        const cachedRecommendation = await getCache(kv, cacheKey);
        if (cachedRecommendation) {
          console.log("[CACHE HIT] Music recommendation retrieved from KV cache.");
          return new Response(
            JSON.stringify(cachedRecommendation),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "private, max-age=60"
              }
            }
          );
        }
      } catch (kvReadErr) {
        console.error("[KV CACHE READ ERROR]:", kvReadErr);
      }
    }
    console.log("[CACHE MISS] Generating new AI music recommendation...");
    const musicbedCatalog = [
      { title: "Bloom", artist: "The Light The Heat", mood: "Romantic", url: "https://www.musicbed.com/songs/bloom-the-light-the-heat/28451" },
      { title: "Forever", artist: "Leif Vollebekk", mood: "Emotional", url: "https://www.musicbed.com/songs/forever-leif-vollebekk/15234" },
      { title: "Golden Sky", artist: "Salt Of The Sound", mood: "Cinematic", url: "https://www.musicbed.com/songs/golden-sky-salt-of-the-sound/19821" },
      { title: "Home", artist: "Tony Anderson", mood: "Luxury", url: "https://www.musicbed.com/songs/home-tony-anderson/10492" },
      { title: "Anchor", artist: "Ryan Taubert", mood: "Elegant", url: "https://www.musicbed.com/songs/anchor-ryan-taubert/11203" },
      { title: "Rise", artist: "The Hunts", mood: "Happy", url: "https://www.musicbed.com/songs/rise-the-hunts/14892" },
      { title: "Wildflower", artist: "The Gray Havens", mood: "Romantic", url: "https://www.musicbed.com/songs/wildflower-the-gray-havens/22104" }
    ];
    const coupleName = String(project.coupleName || "Not Specified").trim().slice(0, 100);
    const projectType = String(project.type || "Not Specified").trim().slice(0, 100);
    const projectStatus = String(project.status || "Planned").trim().slice(0, 50);
    const projectInstruction = String(project.instruction || "None").trim().slice(0, 300);
    const projectConcerns = String(project.concerns || "None").trim().slice(0, 300);
    const projectDrone = String(project.drone || "NO DRONE").trim().slice(0, 50);
    const projectRawFiles = String(project.rawFiles || "None").trim().slice(0, 200);
    const prompt = `
You are the Head Music Director of KBHFILMS.
Your job is to recommend cinematic Musicbed songs for professional wedding films.

Wedding Information:
- Couple: ${coupleName}
- Wedding Type: ${projectType}
- Current Status: ${projectStatus}
- Instructions: ${projectInstruction}
- Concerns: ${projectConcerns}
- Drone: ${projectDrone}
- Raw Files: ${projectRawFiles}

Requirements:
Recommend EXACTLY 5 songs.
For each recommendation provide:
- title
- artist
- mood
- energy (Slow, Medium, or Epic)
- scene (e.g., Preparation, Ceremony, Drone, Reception, Outro)
- reason (why it fits)
- confidence (Confidence Score between 1 to 100)

Return ONLY a valid JSON object with this exact structure:
{
  "analysis": {
    "style": "Luxury Emotional",
    "editingStyle": "Slow Cinematic",
    "drone": ${projectDrone !== "NO DRONE"},
    "notes": "Custom tailored notes based on instructions."
  },
  "songs": [
    {
      "title": "Bloom",
      "artist": "The Light The Heat",
      "mood": "Romantic",
      "energy": "Medium",
      "scene": "Preparation",
      "reason": "Soft build-up ideal for bridal prep.",
      "confidence": 98
    }
  ],
  "whyText": "Overall explanation of why these songs fit the wedding narrative."
}
`;
    const aiResult = await askOpenAI(prompt, apiKey) || {};
    const analysisData = aiResult.analysis || {};
    const rawSongs = Array.isArray(aiResult.songs) ? aiResult.songs : [];
    const verifiedSongs = rawSongs.map((song) => {
      const foundInCatalog = musicbedCatalog.find(
        (cat) => cat.title.toLowerCase() === (song.title || "").toLowerCase()
      );
      return {
        title: String(song.title || "Untitled").trim().slice(0, 100),
        artist: String(song.artist || "Unknown Artist").trim().slice(0, 100),
        mood: String(song.mood || "Cinematic").trim().slice(0, 50),
        energy: String(song.energy || "Medium").trim().slice(0, 50),
        scene: String(song.scene || "Highlight").trim().slice(0, 50),
        reason: String(song.reason || "Matched with wedding production style.").trim().slice(0, 200),
        confidence: Number(song.confidence) || 95,
        url: foundInCatalog ? foundInCatalog.url : "https://www.musicbed.com"
      };
    });
    const analysisBadges = [
      `\u2714 ${String(analysisData.style || projectType).trim()}`,
      `\u2714 Editing: ${String(analysisData.editingStyle || "Professional").trim()}`,
      projectDrone !== "NO DRONE" ? `\u2714 Drone: ${projectDrone}` : "\u2714 Standard Coverage",
      projectInstruction !== "None" ? "\u2714 Custom Instructions Applied" : "\u2714 Standard Flow"
    ];
    const finalResponsePayload = {
      success: true,
      analysis: analysisBadges,
      songs: verifiedSongs,
      whyText: String(aiResult.whyText || `Curated specifically for ${coupleName} matching professional wedding standards.`).trim()
    };
    if (kv) {
      try {
        const cacheKey = await generateCacheKey(project);
        await setCache(kv, cacheKey, finalResponsePayload, 604800);
        console.log("[CACHE CREATED] Music recommendation cached in KV for 7 days.");
      } catch (kvWriteErr) {
        console.error("[KV CACHE WRITE ERROR]:", kvWriteErr);
      }
    }
    return new Response(
      JSON.stringify(finalResponsePayload),
      {
        headers: DEFAULT_HEADERS.NO_CACHE
      }
    );
  } catch (err) {
    console.error("[AI MUSIC ERROR]:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Internal Server Error"
      }),
      {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      }
    );
  }
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
async function onRequestGet4(context) {
  try {
    const url = new URL(context.request.url);
    const isCountOnly = url.searchParams.get("count") === "true";
    const userId = url.searchParams.get("userId") || "default";
    const kv = context.env.CACHE;
    const db = context.env.DB;
    if (!db) {
      throw new Error("D1 Database binding (DB) is not configured.");
    }
    if (isCountOnly) {
      const cacheKey = `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`;
      const cachedCount = await getCache(kv, cacheKey);
      if (cachedCount !== null && cachedCount !== void 0) {
        return new Response(
          JSON.stringify({ success: true, unreadCount: cachedCount }),
          { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=10" } }
        );
      }
      const countResult = await db.prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
      ).bind(userId).first();
      const unreadCount = countResult ? countResult.count : 0;
      await setCache(kv, cacheKey, unreadCount, KV_CACHE_TTL.NOTIFICATIONS);
      return new Response(
        JSON.stringify({ success: true, unreadCount }),
        { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=10" } }
      );
    }
    const listResult = await db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
    ).bind(userId).all();
    return new Response(
      JSON.stringify({ success: true, notifications: listResult.results || [] }),
      { headers: DEFAULT_HEADERS.NO_CACHE }
    );
  } catch (err) {
    console.error("[NOTIFICATIONS GET ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
async function onRequestPost6(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const db = env.DB;
    const kv = env.CACHE;
    const userId = body.userId || "default";
    const message = body.message || "";
    const type = body.type || "info";
    if (!db) throw new Error("D1 Database binding is missing.");
    await db.prepare(
      "INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)"
    ).bind(userId, message, type).run();
    await deleteCache(kv, `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`);
    return new Response(
      JSON.stringify({ success: true, message: "Notification created." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestPost6, "onRequestPost6");
__name2(onRequestPost6, "onRequestPost");
async function onRequestPut(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const db = env.DB;
    const kv = env.CACHE;
    const userId = body.userId || "default";
    const notificationId = body.id;
    if (!db) throw new Error("D1 Database binding is missing.");
    if (notificationId) {
      await db.prepare(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
      ).bind(notificationId, userId).run();
    } else {
      await db.prepare(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ?"
      ).bind(userId).run();
    }
    await deleteCache(kv, `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`);
    return new Response(
      JSON.stringify({ success: true, message: "Notifications marked as read." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestPut, "onRequestPut");
__name2(onRequestPut, "onRequestPut");
async function onRequestDelete4(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "default";
    const notificationId = url.searchParams.get("id");
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) throw new Error("D1 Database binding is missing.");
    if (notificationId) {
      await db.prepare(
        "DELETE FROM notifications WHERE id = ? AND user_id = ?"
      ).bind(notificationId, userId).run();
    } else {
      await db.prepare(
        "DELETE FROM notifications WHERE user_id = ?"
      ).bind(userId).run();
    }
    await deleteCache(kv, `${CACHE_PREFIXES.NOTIFICATIONS}_count_${userId}`);
    return new Response(
      JSON.stringify({ success: true, message: "Notifications deleted." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestDelete4, "onRequestDelete4");
__name2(onRequestDelete4, "onRequestDelete");
function buildCacheKey(request) {
  const url = new URL(typeof request === "string" ? request : request.url);
  url.searchParams.delete("_cb");
  url.searchParams.delete("t");
  return new Request(url.toString(), {
    method: "GET",
    headers: request.headers ? new Headers(request.headers) : void 0
  });
}
__name(buildCacheKey, "buildCacheKey");
__name2(buildCacheKey, "buildCacheKey");
function shouldBypassCache(request) {
  if (!request || request.method !== "GET") {
    return true;
  }
  const cacheControl = request.headers.get("Cache-Control") || "";
  if (cacheControl.includes("no-cache") || cacheControl.includes("no-store")) {
    return true;
  }
  return false;
}
__name(shouldBypassCache, "shouldBypassCache");
__name2(shouldBypassCache, "shouldBypassCache");
async function getCachedResponse(request) {
  try {
    if (shouldBypassCache(request)) {
      return null;
    }
    const cache = caches.default;
    const cacheKey = buildCacheKey(request);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const newHeaders = new Headers(cachedResponse.headers);
      newHeaders.set("X-Edge-Cache", "HIT");
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: newHeaders
      });
    }
    return null;
  } catch (err) {
    console.error("[EDGE CACHE GET ERROR]:", err.message);
    return null;
  }
}
__name(getCachedResponse, "getCachedResponse");
__name2(getCachedResponse, "getCachedResponse");
async function cacheResponse(request, response, ttlSeconds = EDGE_CACHE_CONFIG.DEFAULT_EDGE_TTL) {
  try {
    if (shouldBypassCache(request) || !response || response.status !== 200) {
      return response;
    }
    const cache = caches.default;
    const cacheKey = buildCacheKey(request);
    const responseToCache = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
    responseToCache.headers.set("Cache-Control", `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`);
    responseToCache.headers.set("X-Edge-Cache", "MISS");
    contextOrphanExecution(cache.put(cacheKey, responseToCache.clone()));
    return responseToCache;
  } catch (err) {
    console.error("[EDGE CACHE PUT ERROR]:", err.message);
    return response;
  }
}
__name(cacheResponse, "cacheResponse");
__name2(cacheResponse, "cacheResponse");
function contextOrphanExecution(promise) {
  if (typeof globalThis.caches !== "undefined" && promise) {
    Promise.resolve(promise).catch((e) => console.error("[EDGE CACHE BACKGROUND ERROR]:", e));
  }
}
__name(contextOrphanExecution, "contextOrphanExecution");
__name2(contextOrphanExecution, "contextOrphanExecution");
async function onRequestGet5(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "Database not connected." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const edgeCached = await getCachedResponse(request);
    if (edgeCached) return edgeCached;
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    let cacheKey = `${CACHE_PREFIXES.PROJECTS}_all`;
    if (year && month) {
      cacheKey = `${CACHE_PREFIXES.PROJECTS}_${year}_${month}`;
    }
    if (kv) {
      const cachedData = await getCache(kv, cacheKey);
      if (cachedData) {
        const response2 = new Response(JSON.stringify({ success: true, projects: cachedData }), {
          headers: { "Content-Type": "application/json" }
        });
        return await cacheResponse(request, response2);
      }
    }
    let query = "SELECT * FROM projects";
    let params = [];
    if (year && month) {
      query += " WHERE project_year = ? AND project_month = ?";
      params = [year, month];
    }
    query += " ORDER BY project_year DESC, project_month ASC, row_index ASC";
    const stmt = db.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    const projects = results || [];
    if (kv) {
      await setCache(kv, cacheKey, projects, KV_CACHE_TTL.PROJECTS);
    }
    const response = new Response(
      JSON.stringify({ success: true, projects }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    return await cacheResponse(request, response);
  } catch (err) {
    console.error("[PROJECTS GET ERROR]:", err.message);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestGet5, "onRequestGet5");
__name2(onRequestGet5, "onRequestGet");
async function onRequestPost7(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "Database not connected." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await request.json();
    const { year, month, rows } = body;
    if (!year || !month || !Array.isArray(rows)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid payload parameters." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const statements = rows.map((r) => {
      return db.prepare(`
                INSERT INTO projects (
                    project_year, project_month, row_index, couple_name, status, progress, type,
                    raw_files, drone, instruction, concerns, watch_link, files_link,
                    song1_title, song1_link, song1_status, song1_notes,
                    song2_title, song2_link, song2_status, song2_notes,
                    song3_title, song3_link, song3_status, song3_notes,
                    teaser_title, teaser_link, teaser_status, teaser_notes, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(project_year, project_month, row_index) DO UPDATE SET
                    couple_name=excluded.couple_name, status=excluded.status, progress=excluded.progress, type=excluded.type,
                    raw_files=excluded.raw_files, drone=excluded.drone, instruction=excluded.instruction, concerns=excluded.concerns,
                    watch_link=excluded.watch_link, files_link=excluded.files_link,
                    song1_title=excluded.song1_title, song1_link=excluded.song1_link, song1_status=excluded.song1_status, song1_notes=excluded.song1_notes,
                    song2_title=excluded.song2_title, song2_link=excluded.song2_link, song2_status=excluded.song2_status, song2_notes=excluded.song2_notes,
                    song3_title=excluded.song3_title, song3_link=excluded.song3_link, song3_status=excluded.song3_status, song3_notes=excluded.song3_notes,
                    teaser_title=excluded.teaser_title, teaser_link=excluded.teaser_link, teaser_status=excluded.teaser_status, teaser_notes=excluded.teaser_notes,
                    updated_at=CURRENT_TIMESTAMP
            `).bind(
        year,
        month,
        r.row_index ?? 0,
        r.couple_name || "",
        r.status || "PLANNED",
        r.progress || 0,
        r.type || "NOT SET",
        r.raw_files || "",
        r.drone || "",
        r.instruction || "",
        r.concerns || "",
        r.watch_link || "",
        r.files_link || "",
        r.song1_title || "",
        r.song1_link || "",
        r.song1_status || "",
        r.song1_notes || "",
        r.song2_title || "",
        r.song2_link || "",
        r.song2_status || "",
        r.song2_notes || "",
        r.song3_title || "",
        r.song3_link || "",
        r.song3_status || "",
        r.song3_notes || "",
        r.teaser_title || "",
        r.teaser_link || "",
        r.teaser_status || "",
        r.teaser_notes || ""
      );
    });
    await db.batch(statements);
    if (kv) {
      await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_${year}_${month}`);
      await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
    }
    return new Response(
      JSON.stringify({ success: true, message: "Projects saved successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PROJECTS POST ERROR]:", err.message);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestPost7, "onRequestPost7");
__name2(onRequestPost7, "onRequestPost");
async function onRequestPost8(context) {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database not connected."
        }),
        {
          status: 500,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const month = Number(body.month);
    const year = Number(body.year);
    if (!month || !year) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Month and year are required."
        }),
        {
          status: 400,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    console.log(`[RESET MONTH] ${month}/${year}`);
    const result = await env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
              AND project_month = ?
        `).bind(year, month).run();
    await env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
              AND project_month = ?
        `).bind(year, month).run();
    const kv = env.CACHE;
    if (kv) {
      try {
        await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_${year}_${month}`);
        await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
      } catch (kvDelErr) {
        console.error("[KV RESET MONTH CACHE ERROR]:", kvDelErr);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: `Month ${month}/${year} reset successfully.`,
        deleted: result.meta?.changes || 0
      }),
      {
        status: 200,
        headers: DEFAULT_HEADERS.NO_CACHE
      }
    );
  } catch (err) {
    console.error("[RESET MONTH ERROR]:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error"
      }),
      {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      }
    );
  }
}
__name(onRequestPost8, "onRequestPost8");
__name2(onRequestPost8, "onRequestPost");
async function onRequestPost9(context) {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database not connected."
        }),
        {
          status: 500,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const year = Number(body.year);
    if (!year) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Year is required."
        }),
        {
          status: 400,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    console.log(`[RESET YEAR] ${year}`);
    const result = await env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
        `).bind(year).run();
    await env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
        `).bind(year).run();
    const kv = env.CACHE;
    if (kv) {
      try {
        await clearCacheByPrefix(kv, `${CACHE_PREFIXES.PROJECTS}_${year}_`);
        await deleteCache(kv, `${CACHE_PREFIXES.PROJECTS}_all`);
      } catch (kvDelErr) {
        console.error("[KV RESET YEAR CACHE ERROR]:", kvDelErr);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: `Year ${year} reset successfully.`,
        deleted: result.meta?.changes || 0
      }),
      {
        status: 200,
        headers: DEFAULT_HEADERS.NO_CACHE
      }
    );
  } catch (err) {
    console.error("[RESET YEAR ERROR]:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error"
      }),
      {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      }
    );
  }
}
__name(onRequestPost9, "onRequestPost9");
__name2(onRequestPost9, "onRequestPost");
async function onRequestPost10(context) {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database not connected."
        }),
        {
          status: 500,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    console.log("[RESTORE] Starting full system restore...");
    let backup = {};
    try {
      backup = await request.json();
    } catch (e) {
      backup = {};
    }
    const tablesData = backup.tables || backup.data;
    if (!backup || !tablesData || typeof tablesData !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid backup file format."
        }),
        {
          status: 400,
          headers: DEFAULT_HEADERS.JSON
        }
      );
    }
    const tableNames = Object.keys(tablesData);
    await env.DB.prepare(`PRAGMA foreign_keys = OFF;`).run();
    for (const tableName of tableNames) {
      await env.DB.prepare(`DELETE FROM "${tableName}";`).run();
    }
    for (const tableName of tableNames) {
      const rows = tablesData[tableName];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map(() => "?").join(", ");
        const quotedColumns = columns.map((col) => `"${col}"`).join(", ");
        const query = `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${placeholders})`;
        await env.DB.prepare(query).bind(...values).run();
      }
      console.log(`[RESTORE] Restored ${rows.length} record(s) to table: ${tableName}`);
    }
    await env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();
    const kv = env.CACHE;
    if (kv) {
      try {
        await clearCacheByPrefix(kv, CACHE_PREFIXES.PROJECTS);
        await clearCacheByPrefix(kv, CACHE_PREFIXES.USERS);
        await clearCacheByPrefix(kv, CACHE_PREFIXES.NOTIFICATIONS);
      } catch (kvErr) {
        console.error("[KV RESTORE CACHE CLEAR ERROR]:", kvErr);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Full system restored successfully."
      }),
      {
        status: 200,
        headers: DEFAULT_HEADERS.NO_CACHE
      }
    );
  } catch (err) {
    console.error("[RESTORE ERROR]:", err.message);
    try {
      await context.env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();
    } catch (e) {
    }
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error"
      }),
      {
        status: 500,
        headers: DEFAULT_HEADERS.JSON
      }
    );
  }
}
__name(onRequestPost10, "onRequestPost10");
__name2(onRequestPost10, "onRequestPost");
async function onRequestPost11(context) {
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
        originalFilename,
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
__name(onRequestPost11, "onRequestPost11");
__name2(onRequestPost11, "onRequestPost");
var CACHE_KEY = `${CACHE_PREFIXES.USERS}_list`;
var CACHE_TTL = KV_CACHE_TTL.USERS;
async function onRequestGet6(context) {
  try {
    const { env } = context;
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) {
      throw new Error("D1 Database binding (DB) is not configured.");
    }
    if (kv) {
      try {
        const cachedUsers = await getCache(kv, CACHE_KEY);
        if (cachedUsers) {
          return new Response(
            JSON.stringify({ success: true, users: cachedUsers }),
            { headers: DEFAULT_HEADERS.STANDARD_CACHE }
          );
        }
      } catch (kvReadErr) {
        console.error("[KV USERS READ ERROR]:", kvReadErr);
      }
    }
    const { results } = await db.prepare(`
            SELECT id, email, name, role, permissions, created_at, updated_at
            FROM users
            ORDER BY id ASC
        `).all();
    const users = results || [];
    if (kv) {
      try {
        await setCache(kv, CACHE_KEY, users, CACHE_TTL);
      } catch (kvWriteErr) {
        console.error("[KV USERS WRITE ERROR]:", kvWriteErr);
      }
    }
    return new Response(
      JSON.stringify({ success: true, users }),
      { headers: DEFAULT_HEADERS.STANDARD_CACHE }
    );
  } catch (err) {
    console.error("[USERS GET ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestGet6, "onRequestGet6");
__name2(onRequestGet6, "onRequestGet");
async function onRequestPost12(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) throw new Error("D1 Database binding is missing.");
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const name = (body.name || "").trim();
    const role = (body.role || "user").trim();
    const permissions = body.permissions || "";
    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and password are required." }),
        { status: 400, headers: DEFAULT_HEADERS.JSON }
      );
    }
    await db.prepare(`
            INSERT INTO users (email, password, name, role, permissions, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(email, password, name, role, permissions).run();
    if (kv) {
      try {
        await deleteCache(kv, CACHE_KEY);
      } catch (kvDelErr) {
        console.error("[KV USERS DELETE ERROR]:", kvDelErr);
      }
    }
    return new Response(
      JSON.stringify({ success: true, message: "User created successfully." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    console.error("[USERS POST ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestPost12, "onRequestPost12");
__name2(onRequestPost12, "onRequestPost");
async function onRequestPut2(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) throw new Error("D1 Database binding is missing.");
    const userId = body.id || body.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID is required for update." }),
        { status: 400, headers: DEFAULT_HEADERS.JSON }
      );
    }
    const name = (body.name || "").trim();
    const role = (body.role || "").trim();
    const permissions = body.permissions || "";
    const password = body.password;
    if (password) {
      await db.prepare(`
                UPDATE users 
                SET name = ?, role = ?, permissions = ?, password = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(name, role, permissions, password, userId).run();
    } else {
      await db.prepare(`
                UPDATE users 
                SET name = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(name, role, permissions, userId).run();
    }
    if (kv) {
      try {
        await deleteCache(kv, CACHE_KEY);
      } catch (kvDelErr) {
        console.error("[KV USERS DELETE ERROR]:", kvDelErr);
      }
    }
    return new Response(
      JSON.stringify({ success: true, message: "User updated successfully." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    console.error("[USERS PUT ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestPut2, "onRequestPut2");
__name2(onRequestPut2, "onRequestPut");
async function onRequestDelete5(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get("id") || url.searchParams.get("userId");
    const db = env.DB;
    const kv = env.CACHE;
    if (!db) throw new Error("D1 Database binding is missing.");
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID is required for deletion." }),
        { status: 400, headers: DEFAULT_HEADERS.JSON }
      );
    }
    await db.prepare(
      "DELETE FROM users WHERE id = ?"
    ).bind(userId).run();
    if (kv) {
      try {
        await deleteCache(kv, CACHE_KEY);
      } catch (kvDelErr) {
        console.error("[KV USERS DELETE ERROR]:", kvDelErr);
      }
    }
    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully." }),
      { headers: DEFAULT_HEADERS.JSON }
    );
  } catch (err) {
    console.error("[USERS DELETE ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: DEFAULT_HEADERS.JSON }
    );
  }
}
__name(onRequestDelete5, "onRequestDelete5");
__name2(onRequestDelete5, "onRequestDelete");
var routes = [
  {
    routePath: "/api/backup",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/delete",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/delete-all",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/download",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/login",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete3]
  },
  {
    routePath: "/api/login",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/login",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/logs",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/logs",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/month-lock",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/music-recommend",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete4]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/projects",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/projects",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/reset-month",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/reset-year",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/restore",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/upload",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete5]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost12]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut2]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-eGA7Zw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-eGA7Zw/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.4457018496366826.js.map
