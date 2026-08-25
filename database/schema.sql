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

    project_year INTEGER NOT NULL,
    project_month INTEGER NOT NULL,
    row_index INTEGER NOT NULL,

    couple_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'IN PROGRESS',
    type TEXT NOT NULL DEFAULT 'UPBEAT CINEMATIC',

    raw_files TEXT NOT NULL DEFAULT '',
drone TEXT NOT NULL DEFAULT '',
instruction TEXT NOT NULL DEFAULT '',
watch_link TEXT NOT NULL DEFAULT '',

song1_link TEXT NOT NULL DEFAULT '',
    song1_status TEXT NOT NULL DEFAULT '',
    song1_notes TEXT NOT NULL DEFAULT '',

    song2_link TEXT NOT NULL DEFAULT '',
    song2_status TEXT NOT NULL DEFAULT '',
    song2_notes TEXT NOT NULL DEFAULT '',

    song3_link TEXT NOT NULL DEFAULT '',
    song3_status TEXT NOT NULL DEFAULT '',
    song3_notes TEXT NOT NULL DEFAULT '',

    teaser_link TEXT NOT NULL DEFAULT '',
    teaser_status TEXT NOT NULL DEFAULT '',
    teaser_notes TEXT NOT NULL DEFAULT '',

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_year, project_month, row_index)
);

-- =========================
-- DEFAULT ROWS
-- =========================

INSERT OR IGNORE INTO projects (
    project_year,
    project_month,
    row_index
)
VALUES
(2025,1,1),
(2025,1,2),
(2025,1,3),
(2025,1,4),
(2025,1,5);

-- =========================
-- MONTH LOCKS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS month_locks (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    project_year INTEGER NOT NULL,

    project_month INTEGER NOT NULL,

    locked INTEGER NOT NULL DEFAULT 0,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_year, project_month)

);