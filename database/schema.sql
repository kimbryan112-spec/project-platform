-- =========================
-- USERS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    full_name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'dashboard',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- =========================
-- PROJECTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS projects (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    row_index INTEGER NOT NULL UNIQUE,

    couple_name TEXT DEFAULT '',

    status TEXT DEFAULT 'IN PROGRESS',

    type TEXT DEFAULT 'UPBEAT CINEMATIC',

    raw_files TEXT DEFAULT '',

    drone TEXT DEFAULT '',

    song1_link TEXT DEFAULT '',

    song1_status TEXT DEFAULT '',

    song2_link TEXT DEFAULT '',

    song2_status TEXT DEFAULT '',

    song3_link TEXT DEFAULT '',

    song3_status TEXT DEFAULT '',

    teaser_link TEXT DEFAULT '',

    teaser_status TEXT DEFAULT '',

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- =========================
-- DEFAULT ROWS
-- =========================

INSERT OR IGNORE INTO projects (row_index)
VALUES
(1),
(2),
(3),
(4),
(5);