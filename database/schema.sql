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

    year INTEGER NOT NULL,

    month INTEGER NOT NULL,

    row_index INTEGER NOT NULL,

    couple_name TEXT DEFAULT '',

    status TEXT DEFAULT 'IN PROGRESS',

    type TEXT DEFAULT 'UPBEAT CINEMATIC',

    raw_files TEXT DEFAULT '',

    drone TEXT DEFAULT '',

    instruction TEXT DEFAULT '',

    song1_link TEXT DEFAULT '',

    song1_status TEXT DEFAULT '',

    song1_notes TEXT DEFAULT '',

    song2_link TEXT DEFAULT '',

    song2_status TEXT DEFAULT '',

    song2_notes TEXT DEFAULT '',

    song3_link TEXT DEFAULT '',

    song3_status TEXT DEFAULT '',

    song3_notes TEXT DEFAULT '',

    teaser_link TEXT DEFAULT '',

    teaser_status TEXT DEFAULT '',

    teaser_notes TEXT DEFAULT '',

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(year, month, row_index)

);

-- =========================
-- DEFAULT ROWS
-- =========================

INSERT OR IGNORE INTO projects (

    year,

    month,

    row_index

)

VALUES

(2025, 1, 1),

(2025, 1, 2),

(2025, 1, 3),

(2025, 1, 4),

(2025, 1, 5);