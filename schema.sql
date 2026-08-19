INSERT INTO projects (
    row_index,
    couple_name,
    status,
    type,
    raw_files,
    drone,
    instruction,

    song1_link,
    song1_status,
    song1_notes,

    song2_link,
    song2_status,
    song2_notes,

    song3_link,
    song3_status,
    song3_notes,

    teaser_link,
    teaser_status,
    teaser_notes,

    updated_at
)
VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    CURRENT_TIMESTAMP
)
ON CONFLICT(row_index) DO UPDATE SET

couple_name = excluded.couple_name,
status = excluded.status,
type = excluded.type,
raw_files = excluded.raw_files,
drone = excluded.drone,
instruction = excluded.instruction,

song1_link = excluded.song1_link,
song1_status = excluded.song1_status,
song1_notes = excluded.song1_notes,

song2_link = excluded.song2_link,
song2_status = excluded.song2_status,
song2_notes = excluded.song2_notes,

song3_link = excluded.song3_link,
song3_status = excluded.song3_status,
song3_notes = excluded.song3_notes,

teaser_link = excluded.teaser_link,
teaser_status = excluded.teaser_status,
teaser_notes = excluded.teaser_notes,

updated_at = CURRENT_TIMESTAMP