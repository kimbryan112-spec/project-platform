var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/backup.js
async function onRequestGet(context) {
  try {
    console.log("[BACKUP] Starting full system backup...");
    const tablesResult = await context.env.DB.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%' 
            AND name NOT LIKE '_cf_%'
        `).all();
    const tables = tablesResult.results;
    const backupData = {};
    for (const t of tables) {
      const tableName = t.name;
      const tableRecords = await context.env.DB.prepare(`SELECT * FROM "${tableName}"`).all();
      backupData[tableName] = tableRecords.results;
      console.log(`[BACKUP] Exported ${tableRecords.results.length} record(s) from table: ${tableName}`);
    }
    const backup = {
      version: "2.0",
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      data: backupData
    };
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
  } catch (err) {
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
__name(onRequestGet, "onRequestGet");

// api/delete-all.js
async function onRequestDelete(context) {
  try {
    console.log("[DELETE ALL] Clearing database...");
    const result = await context.env.DB.prepare(`
            DELETE FROM projects
        `).run();
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database cleared successfully.",
        deleted: result.meta?.changes || 0
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("[DELETE ALL]", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
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
__name(onRequestDelete, "onRequestDelete");

// api/login.js
async function onRequestPost(context) {
  try {
    const { email, password } = await context.request.json();
    const user = await context.env.DB.prepare(`
                SELECT
                    id,
                    fullname,
                    email,
                    password,
                    role,
                    active
                FROM users
                WHERE email = ?
                LIMIT 1
            `).bind(email.trim().toLowerCase()).first();
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid email or password."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    if (!user.active) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Account is disabled."
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    if (user.password !== password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid email or password."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    const sessionId = crypto.randomUUID();
    const expires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1e3
    ).toISOString();
    await context.env.DB.prepare(`
            INSERT INTO sessions (
                id,
                user_id,
                expires_at
            )
            VALUES (?, ?, ?)
        `).bind(
      sessionId,
      user.id,
      expires
    ).run();
    const response = new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role
        }
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    response.headers.append(
      "Set-Cookie",
      `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`
    );
    return response;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
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
__name(onRequestPost, "onRequestPost");

// api/month-lock.js
async function onRequestPost2(context) {
  try {
    const { year, month, locked } = await context.request.json();
    await context.env.DB.prepare(`
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
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("[MONTH LOCK ERROR]");
    console.error(err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
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
__name(onRequestPost2, "onRequestPost");

// api/projects.js
async function onRequestGet2(context) {
  try {
    const url = new URL(context.request.url);
    const year = Number(url.searchParams.get("year")) || (/* @__PURE__ */ new Date()).getFullYear();
    const month = Number(url.searchParams.get("month")) || (/* @__PURE__ */ new Date()).getMonth() + 1;
    console.log(`[GET] ${year}-${month}`);
    const { results } = await context.env.DB.prepare(`
            SELECT *
            FROM projects
            WHERE project_year = ?
              AND project_month = ?
            ORDER BY row_index ASC
        `).bind(year, month).all();
    const { results: lockRows } = await context.env.DB.prepare(`
            SELECT project_year, project_month, locked
            FROM month_locks
            WHERE locked = 1
        `).all();
    const monthLocks = {};
    const monthNames = {
      1: "jan",
      2: "feb",
      3: "mar",
      4: "apr",
      5: "may",
      6: "jun",
      7: "jul",
      8: "aug",
      9: "sep",
      10: "oct",
      11: "nov",
      12: "dec"
    };
    lockRows.forEach((row) => {
      const monthName = monthNames[row.project_month];
      monthLocks[`${row.project_year}_${monthName}`] = true;
    });
    const { results: hasDataRows } = await context.env.DB.prepare(`
            SELECT project_month
            FROM projects
            WHERE project_year = ?
              AND (
                    TRIM(COALESCE(couple_name,'')) <> ''
                 OR TRIM(COALESCE(raw_files,'')) <> ''
              )
            GROUP BY project_month
        `).bind(year).all();
    const hasDataMonths = {};
    hasDataRows.forEach((row) => {
      const monthName = monthNames[row.project_month];
      if (monthName) {
        hasDataMonths[monthName] = true;
      }
    });
    const data = results.map((row) => ({
      rowId: row.row_index,
      coupleName: row.couple_name || "",
      status: row.status || "PLANNED",
      progress: row.progress || 0,
      type: row.type || "NOT SET",
      rawFiles: row.raw_files || "",
      drone: row.drone || "",
      instruction: row.instruction || "",
      concerns: row.concerns || "",
      watchLink: row.watch_link || "",
      filesLink: row.files_link || "",
      song1: {
        title: row.song1_title || "",
        link: row.song1_link || "",
        status: row.song1_status || "",
        notes: row.song1_notes || ""
      },
      song2: {
        title: row.song2_title || "",
        link: row.song2_link || "",
        status: row.song2_status || "",
        notes: row.song2_notes || ""
      },
      song3: {
        title: row.song3_title || "",
        link: row.song3_link || "",
        status: row.song3_status || "",
        notes: row.song3_notes || ""
      },
      teaserSong: {
        title: row.teaser_title || "",
        link: row.teaser_link || "",
        status: row.teaser_status || "",
        notes: row.teaser_notes || ""
      },
      monthLocked: monthLocks[`${year}_${monthNames[month]}`] || false
    }));
    return new Response(
      JSON.stringify({
        projects: data,
        lockedMonths: monthLocks,
        hasDataMonths
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
        stack: err.stack
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
__name(onRequestGet2, "onRequestGet");
async function onRequestPost3(context) {
  try {
    const url = new URL(context.request.url);
    const year = Number(url.searchParams.get("year")) || (/* @__PURE__ */ new Date()).getFullYear();
    const month = Number(url.searchParams.get("month")) || (/* @__PURE__ */ new Date()).getMonth() + 1;
    const projects = await context.request.json();
    console.log(`[POST] Saving ${projects.length} row(s) for ${year}-${month}`);
    for (const row of projects) {
      await context.env.DB.prepare(`
                INSERT INTO projects (
                    project_year, project_month, row_index,
                    couple_name, status, progress, type,
                    raw_files, drone, instruction, concerns, watch_link, files_link,
                    song1_title, song1_link, song1_status, song1_notes,
                    song2_title, song2_link, song2_status, song2_notes,
                    song3_title, song3_link, song3_status, song3_notes,
                    teaser_title, teaser_link, teaser_status, teaser_notes,
                    updated_at
                )
                VALUES (
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT(project_year, project_month, row_index)
                DO UPDATE SET
                    couple_name = excluded.couple_name,
                    status = excluded.status,
                    progress = excluded.progress,
                    type = excluded.type,
                    raw_files = excluded.raw_files,
                    drone = excluded.drone,
                    instruction = excluded.instruction,
                    concerns = excluded.concerns,
                    watch_link = excluded.watch_link,
                    files_link = excluded.files_link,
                    song1_title = excluded.song1_title,
                    song1_link = excluded.song1_link,
                    song1_status = excluded.song1_status,
                    song1_notes = excluded.song1_notes,
                    song2_title = excluded.song2_title,
                    song2_link = excluded.song2_link,
                    song2_status = excluded.song2_status,
                    song2_notes = excluded.song2_notes,
                    song3_title = excluded.song3_title,
                    song3_link = excluded.song3_link,
                    song3_status = excluded.song3_status,
                    song3_notes = excluded.song3_notes,
                    teaser_title = excluded.teaser_title,
                    teaser_link = excluded.teaser_link,
                    teaser_status = excluded.teaser_status,
                    teaser_notes = excluded.teaser_notes,
                    updated_at = CURRENT_TIMESTAMP
            `).bind(
        year,
        month,
        row.rowId,
        row.coupleName || "",
        row.status || "PLANNED",
        row.progress || 0,
        row.type || "NOT SET",
        row.rawFiles || "",
        row.drone || "",
        row.instruction || "",
        row.concerns || "",
        row.watchLink || "",
        row.filesLink || "",
        row.song1?.title || "",
        row.song1?.link || "",
        row.song1?.status || "",
        row.song1?.notes || "",
        row.song2?.title || "",
        row.song2?.link || "",
        row.song2?.status || "",
        row.song2?.notes || "",
        row.song3?.title || "",
        row.song3?.link || "",
        row.song3?.status || "",
        row.song3?.notes || "",
        row.teaserSong?.title || "",
        row.teaserSong?.link || "",
        row.teaserSong?.status || "",
        row.teaserSong?.notes || ""
      ).run();
    }
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("[API-POST ERROR]");
    console.error(err);
    console.error(err.stack);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
        stack: err.stack
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
__name(onRequestPost3, "onRequestPost");

// api/reset-month.js
async function onRequestPost4(context) {
  try {
    const { month, year } = await context.request.json();
    console.log(`[RESET MONTH] ${month}/${year}`);
    const result = await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
              AND project_month = ?
        `).bind(
      Number(year),
      Number(month)
    ).run();
    await context.env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
              AND project_month = ?
        `).bind(
      Number(year),
      Number(month)
    ).run();
    return new Response(
      JSON.stringify({
        success: true,
        message: `Month ${month}/${year} reset successfully.`,
        deleted: result.meta?.changes || 0
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("[RESET MONTH]", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
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
__name(onRequestPost4, "onRequestPost");

// api/reset-year.js
async function onRequestPost5(context) {
  try {
    const { year } = await context.request.json();
    console.log(`[RESET YEAR] ${year}`);
    const result = await context.env.DB.prepare(`
            DELETE FROM projects
            WHERE project_year = ?
        `).bind(
      Number(year)
    ).run();
    await context.env.DB.prepare(`
            DELETE FROM month_locks
            WHERE project_year = ?
        `).bind(
      Number(year)
    ).run();
    return new Response(
      JSON.stringify({
        success: true,
        message: `Year ${year} reset successfully.`,
        deleted: result.meta?.changes || 0
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("[RESET YEAR]", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
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
__name(onRequestPost5, "onRequestPost");

// api/restore.js
async function onRequestPost6(context) {
  try {
    console.log("[RESTORE] Starting full system restore...");
    const backup = await context.request.json();
    if (!backup || !backup.data || typeof backup.data !== "object") {
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
    const tablesData = backup.data;
    const tableNames = Object.keys(tablesData);
    await context.env.DB.prepare(`PRAGMA foreign_keys = OFF;`).run();
    for (const tableName of tableNames) {
      await context.env.DB.prepare(`DELETE FROM "${tableName}";`).run();
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
        await context.env.DB.prepare(query).bind(...values).run();
      }
      console.log(`[RESTORE] Restored ${rows.length} record(s) to table: ${tableName}`);
    }
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
  } catch (err) {
    console.error("[RESTORE] Error:", err);
    try {
      await context.env.DB.prepare(`PRAGMA foreign_keys = ON;`).run();
    } catch (e) {
    }
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
__name(onRequestPost6, "onRequestPost");

// ../.wrangler/tmp/pages-Lmky7H/functionsRoutes-0.5311150519089903.mjs
var routes = [
  {
    routePath: "/api/backup",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/delete-all",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/login",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/month-lock",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/projects",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/projects",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/reset-month",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/reset-year",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/restore",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  }
];

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
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
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
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
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
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
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
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
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
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
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
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
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
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
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
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
          passThroughOnException: /* @__PURE__ */ __name(() => {
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
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
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

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
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

// ../.wrangler/tmp/bundle-J227n7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
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
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-J227n7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
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
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
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
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.27308983871349746.mjs.map
