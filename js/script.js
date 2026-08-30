// =========================
// STORAGE MODE
// true = localStorage
// false = Cloudflare API
// =========================
const LOCAL_MODE =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

console.log("================================");
console.log("Host:", location.hostname);
console.log("LOCAL_MODE:", LOCAL_MODE);
console.log("================================");

let currentYear = new Date().getFullYear().toString();

let currentMonth =
    document.querySelector(".month-btn.active")?.dataset.month || "sep";
    let currentMonthLocked = false;

// =========================
// MONTH MAP
// =========================
const monthMap = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
};

const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
];
// ===========================
// LIVE CALENDAR
// ===========================

function updateLiveCalendar() {

    const now = new Date();

    const month = now.toLocaleString("en-US", {
        month: "short"
    }).toUpperCase();

    const day = now.getDate();

    const monthEl = document.getElementById("calendarMonth");
    const dayEl = document.getElementById("calendarDay");

    if (monthEl) {
        monthEl.textContent = month;
    }

    if (dayEl) {
        dayEl.textContent = day;
    }

}

document.addEventListener('DOMContentLoaded', () => {

    // Update agad pag-open ng page
    updateLiveCalendar();

    // Auto-check every minute
    setInterval(updateLiveCalendar, 60000);

    const settingsBtn = document.getElementById("settingsMenu");

    if (settingsBtn) {
        settingsBtn.style.display = IS_ADMIN ? "" : "none";
    }

    // Dashboard button (Manager only = disabled)
const dashboardMenu = document.getElementById("dashboardMenu");

if (dashboardMenu && !IS_ADMIN) {

    dashboardMenu.removeAttribute("href");
dashboardMenu.style.pointerEvents = "none";
dashboardMenu.style.cursor = "default";

}

    console.log('[INIT] Page loaded, starting data load...');

    currentYear = new Date().getFullYear().toString();

    currentMonth = monthNames[new Date().getMonth()];

// Remove current active
document.querySelectorAll(".month-btn").forEach(btn => {
    btn.classList.remove("active");
});

// Activate current month
document.querySelector(`.month-btn[data-month="${currentMonth}"]`)
    ?.classList.add("active");

// ==========================
// YEAR DROPDOWN
// ==========================

const yearSelect = document.getElementById("yearSelect");

if (yearSelect) {

    const current = new Date().getFullYear();

    // Clear existing options
    yearSelect.innerHTML = "";

    // Generate years automatically
    for (let y = 2023; y <= current + 5; y++) {

        const option = document.createElement("option");

        option.value = y;
        option.textContent = y;

        if (y === current) {
            option.selected = true;
        }

        yearSelect.appendChild(option);

    }

    currentYear = String(current);

    document.getElementById("currentYearTitle").textContent = currentYear;

    // ==========================
    // CHANGE YEAR
    // ==========================

    yearSelect.addEventListener("change", async () => {

        currentYear = yearSelect.value;

        document.getElementById("currentYearTitle").textContent = currentYear;

        // Clear old month indicators immediately
        cachedHasDataMonths = {};

        await updateMonthHasDataUI(cachedHasDataMonths);

        // Clear old table habang naglo-load
        clearProjectTable();

        // Load selected year
        await loadProjects();

    });

}

// ==========================
// INITIAL LOAD
// ==========================

loadProjects();

updateTimelineProgress();

const nextYearBtn = document.querySelector(".next-year-btn");

    if (nextYearBtn) {

        nextYearBtn.addEventListener("click", () => {

            const nextYear = String(Number(currentYear) + 1);

            const exists = [...yearSelect.options].some(
                option => option.value === nextYear
            );

            if (!exists) {

                const option = document.createElement("option");

                option.value = nextYear;
                option.textContent = nextYear;

                yearSelect.appendChild(option);

            }

            currentYear = nextYear;

            yearSelect.value = currentYear;

            document.getElementById("currentYearTitle").textContent = currentYear;

            loadProjects();

        });

    }

const tableBody = document.querySelector('.project-table tbody');

    if (tableBody) {

        tableBody.addEventListener('input', () => {
            saveProjects();
        });

        tableBody.addEventListener('change', (e) => {

    saveProjects();

    if (e.target.classList.contains('status-select')) {

    updateStatusColor(e.target);

    updateTimelineProgress();

}

    if (e.target.classList.contains('type-select')) {
        updateTypeColor(e.target);
    }

    if (e.target.classList.contains('dashboard-song-status')) {
    updateSongStatusColor(e.target);
}

if (e.target.classList.contains('drone-select')) {

    e.target.classList.toggle(
        "selected",
        e.target.value !== "NO DRONE"
    );

}

    document.querySelectorAll('.dashboard-song-status')
        .forEach(updateSongStatusColor);

});

    }

    // =======================
    // RESTORE WATCH PLAYER
    // =======================

    const savedPlayer = JSON.parse(
        localStorage.getItem("watchPlayerState")
    );

    if (savedPlayer?.open) {

        watchFrame.src = savedPlayer.link;

        watchModal.classList.add("show");

        if (savedPlayer.minimized) {

            watchPlayer.classList.add("mini-player");

            watchPlayer.style.left = "auto";
            watchPlayer.style.top = "auto";
            watchPlayer.style.right = "30px";
            watchPlayer.style.bottom = "30px";
            watchPlayer.style.transform = "none";

            watchModal.style.background = "transparent";
            watchModal.style.pointerEvents = "none";
            watchPlayer.style.pointerEvents = "auto";

            minimizeWatch.style.display = "none";
            maximizeWatch.style.display = "inline-flex";

        }

    }

});

/* ==================================
   CORE LOGIC: SAVE & LOAD (REST API)
================================== */

function collectRowData(row) {
    try {
        const cells = row.querySelectorAll('td');
        if (!cells || cells.length === 0) return null;

        const rowId = row.getAttribute('data-row-id');
        if (!rowId) {
            console.warn("Row missing data-row-id:", row);
            return null;
        }

        const getSongData = (cellIndex) => {

    const cell = cells[cellIndex];

    if (!cell) {
        return {
            title: "",
            link: "",
            status: "",
            notes: ""
        };
    }

    const titleInput = cell.querySelector(".song-link");
    const attachBtn = cell.querySelector(".attach-song-btn");

    return {
        title: titleInput?.value || "",
        link: titleInput?.dataset.songLink || "",
        status: cell.querySelector(".dashboard-song-status")?.value || "",
        notes: cell.querySelector(".comments-btn")?.dataset.notes || ""
    };
};

        return {
    rowId: parseInt(rowId, 10),

    coupleName:
    cells[0]?.querySelector(".couple-name")?.textContent.trim() || "",

    status:
    cells[1]?.querySelector(".status-select")?.value || "PLANNED",

type:
    cells[2]?.querySelector(".type-select")?.value || "",

    rawFiles:
        cells[3]?.querySelector(".dashboard-raw-input")?.value || "",

    drone:
    cells[4]?.querySelector(".drone-select")?.value || "NO DRONE",

instruction:
    cells[0]?.querySelector(".instruction-btn")?.dataset.notes || "",

concerns:
    cells[1]?.querySelector(".concerns-btn")?.dataset.notes || "",

    song1: getSongData(5),
song2: getSongData(6),
song3: getSongData(7),
teaserSong: getSongData(8),

watchLink:
    cells[0]?.querySelector(".watch-btn")?.dataset.watchLink || "",

filesLink:
    cells[1]?.querySelector(".get-files-btn")?.dataset.filesLink || "",

progress:
    parseInt(
        row.querySelector(".progress-slider")?.value || 0,
        10
    )
};
    } catch (err) {
        console.error("Error collecting row data for row:", row, err);
        return null;
    }
}

function populateRow(row, data) {

    const cells = row.querySelectorAll('td');

    console.log(`[POPULATE] Populating row ${data.rowId}:`, data);

    if (cells[0]) {

        const coupleName = cells[0].querySelector(".couple-name");

        if (coupleName) {
            coupleName.textContent = data.coupleName || "";
        }

        const instructionBtn = cells[0].querySelector(".instruction-btn");

        if (instructionBtn) {
            instructionBtn.dataset.notes = data.instruction || "";

            if (data.instruction?.trim()) {
                instructionBtn.style.background = "#22c55e";
            } else {
                instructionBtn.style.background = "#ff7a1a";
            }
        }

    }

    if (cells[1]) {

    const statusSelect = cells[1].querySelector(".status-select");

    if (statusSelect) {

    console.log("Row:", data.rowId);
    console.log("Saved status:", `"${data.status}"`);

    const savedStatus = (data.status || "").trim();

    console.log("Saved:", JSON.stringify(savedStatus));
    console.log(
        "Available:",
        [...statusSelect.options].map(o => JSON.stringify(o.value))
    );

    statusSelect.value = savedStatus;

    console.log("After:", JSON.stringify(statusSelect.value));

    console.log("Select value after assign:", statusSelect.value);

    updateStatusColor(statusSelect);

}

const concernsBtn =
    cells[1].querySelector(".concerns-btn");

if (concernsBtn) {

    const concernText = data.concerns || "";

    concernsBtn.dataset.notes = concernText;

    concernsBtn.classList.toggle(
        "has-comments",
        concernText.trim() !== ""
    );

}

const slider =
    cells[1].querySelector(".progress-slider");

    if (slider) {

        slider.value = data.progress || 0;

        updateRowProgress(
            slider.closest("tr")
        );

    }

}

    if (cells[2]) {

    const typeSelect = cells[2].querySelector(".type-select");

    if (typeSelect) {
        typeSelect.value = data.type || "NOT SET";
        updateTypeColor(typeSelect);
    }

}

    if (cells[3] && cells[3].querySelector('.dashboard-raw-input')) {
        cells[3].querySelector('.dashboard-raw-input').value =
            data.rawFiles || "";
    }

    if (cells[4]) {

    const droneSelect = cells[4].querySelector(".drone-select");

    if (droneSelect) {

        droneSelect.value = data.drone || "NO DRONE";

        droneSelect.classList.toggle(
            "selected",
            droneSelect.value !== "NO DRONE"
        );

    }

}

const setSongData = (cellIndex, songData = {}) => {

    const cell = cells[cellIndex];
    if (!cell) return;

    const titleInput = cell.querySelector(".song-link");
    const status = cell.querySelector(".dashboard-song-status");
    const commentsBtn = cell.querySelector(".comments-btn");

    if (titleInput) {

        titleInput.value = songData.title || "";
        titleInput.dataset.songLink = songData.link || "";

        updateSongLinkStyle(titleInput);

    }

    if (status) {

        status.value = songData.status || "";
        updateSongStatusColor(status);

    }

    const commentText = songData.notes || "";

    if (commentsBtn) {

        commentsBtn.dataset.notes = commentText;

        commentsBtn.classList.toggle(
            "has-comments",
            commentText.trim() !== ""
        );

    }

};

    setSongData(5, data.song1);
    setSongData(6, data.song2);
    setSongData(7, data.song3);
    setSongData(8, data.teaserSong);

    // ==========================
// WATCH LINK
// ==========================

const watchBtn =
    cells[0]?.querySelector(".watch-btn");

if (watchBtn) {

    watchBtn.dataset.watchLink =
        data.watchLink || "";

    const playIcon =
        watchBtn.querySelector(".play-icon");

    playIcon?.classList.toggle(
        "has-link",
        (data.watchLink || "").trim() !== ""
    );

}

    // ==========================
    // GET FILES LINK
    // ==========================

    const getFilesBtn =
        cells[1]?.querySelector(".get-files-btn");

    if (getFilesBtn) {

        getFilesBtn.dataset.filesLink =
            data.filesLink || "";

        getFilesBtn.classList.toggle(
            "has-link",
            !!data.filesLink
        );

    }

    const slider =
    row.querySelector(".progress-slider");

if (slider) {

    slider.value =
        data.progress || 0;

}

updateRowProgress(row);

   // Apply colors
updateStatusColor(cells[1]?.querySelector('.status-select'));
document.querySelectorAll('.dashboard-song-status')
    .forEach(updateSongStatusColor);

}

/* ==================================
   CLEAR TABLE (MONTH SWITCH)
================================== */

function clearProjectTable() {

    document.querySelectorAll(".project-table tbody tr").forEach(row => {

        const cells = row.querySelectorAll("td");

        // Couple Name
        const coupleName = cells[0]?.querySelector(".couple-name");
        if (coupleName) coupleName.textContent = "";

        // Instructions
        const instructionBtn = cells[0]?.querySelector(".instruction-btn");
        if (instructionBtn) {
            instructionBtn.dataset.notes = "";
            instructionBtn.style.background = "#ff7a1a";
        }

        // Watch Link
const watchBtn = cells[0]?.querySelector(".watch-btn");

if (watchBtn) {

    watchBtn.dataset.watchLink = "";

    const playIcon =
        watchBtn.querySelector(".play-icon");

    playIcon?.classList.remove("has-link");

}

// Get Files
const getFilesBtn = cells[1]?.querySelector(".get-files-btn");

if (getFilesBtn) {

    getFilesBtn.dataset.filesLink = "";

    getFilesBtn.classList.remove("has-link");

}

        // Status
        const status = cells[1]?.querySelector(".status-select");
        if (status) {
            status.value = "PLANNED";
            updateStatusColor(status);
        }

        // Type
        const type = cells[2]?.querySelector(".type-select");

if (type) {
    type.value = "NOT SET";
    updateTypeColor(type);
}

        // Raw Files
        const raw = cells[3]?.querySelector(".dashboard-raw-input");
        if (raw) raw.value = "";

        // Drone
        if (cells[4]) {

    const droneSelect = cells[4].querySelector(".drone-select");

    if (droneSelect) {
        droneSelect.value = "NO DRONE";
    }

}

        // Songs
        [5, 6, 7, 8].forEach(index => {

            const cell = cells[index];
            if (!cell) return;

            const titleInput = cell.querySelector(".song-link");

if (titleInput) {

    titleInput.value = "";
    titleInput.dataset.songLink = "";

    updateSongLinkStyle(titleInput);

}

const attachBtn = cell.querySelector(".attach-song-btn");

if (attachBtn) {

    attachBtn.dataset.songLink = "";
    attachBtn.classList.remove("has-link");

}

            const songStatus = cell.querySelector(".dashboard-song-status");
            if (songStatus) {
                songStatus.value = "";
                updateSongStatusColor(songStatus);
            }

            const commentsBtn = cell.querySelector(".comments-btn");

if (commentsBtn) {
    commentsBtn.dataset.notes = "";
    commentsBtn.classList.remove("has-comments");
}

        });

    });

}

function loadProjectsLocal() {

    // Clear muna ang table bago mag-load ng selected month
    clearProjectTable();

    let savedData = localStorage.getItem(`projects_${currentYear}_${currentMonth}`);

    // Backward compatibility
// Habang wala pang year-based storage,
// gamitin muna ang lumang storage key.
if (!savedData && currentYear === "2026") {

    savedData = localStorage.getItem(`projects_${currentMonth}`);

    if (!savedData && currentMonth === "sep") {
        savedData = localStorage.getItem("projects");
    }

}

    let projectsData = [];

if (!savedData) {

    console.log("[LOCAL LOAD] No saved data.");

} else {

    projectsData = JSON.parse(savedData);

}

const rows = document.querySelectorAll(".project-table tbody tr");

// Clear lahat ng existing locks bago mag-restore
document.querySelectorAll(".month-btn")
    .forEach(btn => btn.classList.remove("locked"));

rows.forEach((row) => {

    const rowId = parseInt(row.dataset.rowId);

    const data = projectsData.find(
    item => Number(item.rowId) === Number(rowId)
);

console.log("==========");
console.log("Current Row:", rowId);
console.log("Matched Data:", data);

if (data) {
    populateRow(row, data);
} else {
    console.warn("No data found for row:", rowId);
}

});

// ==================================
// RESTORE LOCKED MONTHS
// ==================================

document.querySelectorAll(".month-btn").forEach(btn => {

    const key = getMonthKey(currentYear, btn.dataset.month);

    const locked = !!monthLocks[key];

    if (IS_ADMIN) {
        btn.classList.toggle("locked", locked);
    } else {
        btn.classList.remove("locked");
    }

});

// Restore colors
document.querySelectorAll(".status-select")
    .forEach(updateStatusColor);

document.querySelectorAll(".type-select")
    .forEach(updateTypeColor);

document.querySelectorAll(".dashboard-song-status")
    .forEach(updateSongStatusColor);

document.querySelectorAll(".drone-select")
    .forEach(updateDroneColor);

// Apply editable/read-only state
updateMonthLockUI();

// Update month buttons
console.log("Calling updateMonthHasDataUI...");
updateMonthHasDataUI();

console.log("[LOCAL LOAD] Loaded from localStorage.");

} // <-- ISARADO ANG loadProjectsLocal()

// ==================================
// ONLINE LOAD FUNCTION (MAY ANTI-CACHE PARAMETER)
// ==================================
async function loadProjects() {

    console.log("========== LOAD START ==========");
    console.log("currentYear :", currentYear);
    console.log("currentMonth:", currentMonth);

    if (LOCAL_MODE) {

    const restored = restoreProjectsLocal(
        currentYear,
        currentMonth
    );

    if (!restored) {
        clearProjectTable();
    }

    await updateMonthHasDataUI();

    updateMonthLockUI();

    return;

}

    // Siguraduhing hindi nagbabago ang month habang naglo-load


    try {

    console.log(
        `[LOAD] Fetching projects (${currentYear}-${currentMonth})...`
    );

    console.log("========== LOAD ==========");
    console.log("currentYear :", currentYear);
    console.log("currentMonth:", currentMonth);
    console.log("month number:", monthMap[currentMonth]);
    console.log(
        "Request URL:",
        `/api/projects?year=${currentYear}&month=${monthMap[currentMonth]}`
    );

    const response = await fetch(

            `/api/projects?year=${currentYear}&month=${monthMap[currentMonth]}&t=${Date.now()}`,

            {

                cache: "no-store",

                headers: {

                    "Cache-Control": "no-cache"

                }

            }

        );

        if (!response.ok) {

            console.error(

                "[LOAD] API returned error:",

                response.status

            );

            return;

        }

        const responseData = await response.json();

const projectsData = responseData.projects || [];

monthLocks = responseData.lockedMonths || {};
cachedHasDataMonths = responseData.hasDataMonths || {};

// Clear ONLY kapag walang record
if (!projectsData.length) {
    clearProjectTable();
}

console.log("========== API RESPONSE ==========");

console.log(responseData);

console.log("hasDataMonths:", responseData.hasDataMonths);

console.log("projects:", responseData.projects);

        console.log(

            `[LOAD] Loaded ${projectsData.length} record(s) for ${currentYear}-${currentMonth}`

        );

        console.log(

            "[LOAD] API Response:",

            projectsData

        );

        console.log(
            "[LOAD] Total records from DB:",
            projectsData.length
        );

        const rows =
            document.querySelectorAll(
                ".project-table tbody tr"
            );

        console.log(
            "[LOAD] Total rows in HTML:",
            rows.length
        );

        if (
    Array.isArray(projectsData) &&
    projectsData.length > 0
) {

    let matchedCount = 0;

    rows.forEach((row) => {

        const rowId = parseInt(
            row.getAttribute("data-row-id"),
            10
        );

        console.log(
            `[LOAD] Processing row ${rowId}`
        );

        const data =
            projectsData.find(
                p => p.rowId === rowId
            );

        if (data) {

            populateRow(row, data);

            matchedCount++;

        } else {

            console.warn(
                `[LOAD] No matching data for row ${rowId}`
            );

        }

    });

    updateMonthLockUI();

await updateMonthHasDataUI(cachedHasDataMonths);

    // ==========================
// RESTORE MONTH LOCK BORDER
// ==========================

document.querySelectorAll(".month-btn").forEach(btn => {

    const key = getMonthKey(currentYear, btn.dataset.month);

    console.log(
        btn.dataset.month,
        key,
        monthLocks[key]
    );

    const locked = !!monthLocks[key];

    if (IS_ADMIN) {

        btn.classList.toggle("locked", locked);

    } else {

        btn.classList.remove("locked");

    }

});

updateMonthLockUI();

console.log(
    `[LOAD] Successfully matched ${matchedCount} rows`
);

} else {

    console.log(
        "[LOAD] No data returned from API"
    );

}

} catch (e) {

    console.error(
        "[LOAD] Error loading projects:",
        e
    );

}

// ==================================
// RESTORE UI COLORS
// ==================================

document.querySelectorAll(".status-select")
    .forEach(updateStatusColor);

document.querySelectorAll(".type-select")
    .forEach(updateTypeColor);

document.querySelectorAll(".dashboard-song-status")
    .forEach(updateSongStatusColor);

document.querySelectorAll(".drone-select")
    .forEach(updateDroneColor);



}

// ==================================
// ONLINE SAVE FUNCTION
// ==================================

let localSaveTimeout;
let apiSaveTimeout;

function saveProjects() {

    // Laging mag-save sa localStorage
    saveProjectsLocal();

    // Kapag localhost, dito lang hanggang localStorage
    if (LOCAL_MODE) {
        return;
    }

    const saveYear = currentYear;
    const saveMonth = currentMonth;

    clearTimeout(apiSaveTimeout);

    apiSaveTimeout = setTimeout(async () => {

        const rows = document.querySelectorAll(".project-table tbody tr");
        const projectsData = [];

        rows.forEach(row => {

            const rowData = collectRowData(row);

            if (rowData) {

                rowData.monthLocked =
                    !!monthLocks[getMonthKey(saveYear, saveMonth)];

                projectsData.push(rowData);

            }

        });

        // ... (tuloy ang existing save code mo)

        console.log("[API SAVE]");
console.log("[SAVE] API Payload");
console.table(projectsData.map(r => ({
    row: r.rowId,
    song1: r.song1?.link,
    song2: r.song2?.link,
    song3: r.song3?.link,
    teaser: r.teaserSong?.link
})));

try {

    const response = await fetch(

        `/api/projects?year=${saveYear}&month=${monthMap[saveMonth]}`,

        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(projectsData)

        }

    );

    if (response.ok) {

    console.log(
        `[SAVE] Successfully synced (${saveYear}-${saveMonth}) to Cloudflare backend!`
    );

    // =====================================
    // UPDATE LOCAL CACHE AFTER API SAVE
    // =====================================
    localStorage.setItem(
        `projects_${saveYear}_${saveMonth}`,
        JSON.stringify(projectsData)
    );

} else {

        console.error(
            "[SAVE] API error:",
            response.status
        );

    }

} catch (e) {

    console.error(
        "[SAVE] Error saving projects to Cloudflare backend:",
        e
    );

}

}, 200);

}

function saveProjectsLocal() {

    clearTimeout(localSaveTimeout);

localSaveTimeout = setTimeout(() => {

        const rows =
            document.querySelectorAll(
                ".project-table tbody tr"
            );

        const projectsData = [];

        rows.forEach(row => {

    const rowData = collectRowData(row);

    if (rowData) {

        rowData.monthLocked =
    !!monthLocks[getMonthKey(currentYear, currentMonth)];

        projectsData.push(rowData);

    }

});

console.log("[LOCAL SAVE]");

        // Save to selected Year + Month

localStorage.setItem(
    `projects_${currentYear}_${currentMonth}`,
    JSON.stringify(projectsData)
);

console.log(

    `[LOCAL SAVE] Saved ${projectsData.length} project(s) to ${currentYear}-${currentMonth}.`

);

updateMonthHasDataUI();

}, 200);

}

// ==================================
// MONTH LOCK HELPERS
// ==================================

let monthLocks = {};

function getMonthLocks() {
    return monthLocks;
}

function saveMonthLocks(locks) {
    monthLocks = locks;
}

function getMonthKey(year = currentYear, month = currentMonth) {
    return `${year}_${month}`;
}

// ==================================
// MONTH HAS DATA HELPERS
// ==================================

function monthHasData() {

    const rows = document.querySelectorAll(".project-table tbody tr");

    return [...rows].some(row => {

        const data = collectRowData(row);

        if (!data) return false;

        return (

            data.coupleName.trim() ||
            data.rawFiles.trim() ||
            data.instruction.trim() ||
            data.concerns.trim() ||
            data.watchLink.trim() ||
            data.filesLink.trim() ||

            data.song1.title.trim() ||
            data.song1.link.trim() ||
            data.song1.notes.trim() ||

            data.song2.title.trim() ||
            data.song2.link.trim() ||
            data.song2.notes.trim() ||

            data.song3.title.trim() ||
            data.song3.link.trim() ||
            data.song3.notes.trim() ||

            data.teaserSong.title.trim() ||
            data.teaserSong.link.trim() ||
            data.teaserSong.notes.trim()

        );

    });

}

function updateCurrentMonthHasData() {

    const activeBtn = document.querySelector(
        `.month-btn[data-month="${currentMonth}"]`
    );

    if (!activeBtn) return;

    activeBtn.classList.toggle(
        "has-data",
        monthHasData()
    );

}

async function updateMonthHasDataUI(hasDataMonths = null) {

    console.log("updateMonthHasDataUI() CALLED");

    document.querySelectorAll(".month-btn").forEach(btn => {
        btn.classList.remove("has-data");
    });

    if (LOCAL_MODE) {

        document.querySelectorAll(".month-btn").forEach(btn => {

            const key = `projects_${currentYear}_${btn.dataset.month}`;

            let hasData = false;

            const saved = localStorage.getItem(key);

console.log(
    key,
    saved ? "FOUND" : "NOT FOUND"
);

            if (saved) {

    console.log(
        key,
        saved ? "FOUND" : "NOT FOUND"
    );

    try {

        const projects = JSON.parse(saved);

        console.log(
            btn.dataset.month,
            projects
        );

        hasData = projects.some(project =>
            (project.coupleName || "").trim() !== "" ||
            (project.rawFiles || "").trim() !== ""
        );

        console.log(
            btn.dataset.month,
            "hasData =",
            hasData
        );

    } catch (err) {

        console.error(err);

    }

} else {

    console.log(
        key,
        "NOT FOUND"
    );

}

btn.classList.toggle("has-data", hasData);

        });

        return;

    }

    // ===== CLOUD / D1 =====

if (!hasDataMonths) {
    hasDataMonths = cachedHasDataMonths;
}

document.querySelectorAll(".month-btn").forEach(btn => {

    btn.classList.toggle(
        "has-data",
        !!hasDataMonths[btn.dataset.month]
    );

});

}

function isMonthLocked() {

    return !!monthLocks[getMonthKey()];

}

function setMonthEditable(editable) {

    // Inputs / Selects
document.querySelectorAll(`
    .status-select,
    .type-select,
    .dashboard-raw-input,
    .song-link,
    .dashboard-song-status,
    .song-notes,
    .drone-search,
    .drone-select
`).forEach(input => {

    input.disabled = !editable;

    input.style.pointerEvents = editable ? "auto" : "none";

    input.style.opacity = "1";

    input.style.filter = "none";

});

// Progress Slider
document.querySelectorAll(".progress-slider").forEach(slider => {

    if (typeof IS_ADMIN !== "undefined" && IS_ADMIN) {

    slider.disabled = false;
    slider.style.pointerEvents = "auto";
    slider.style.opacity = "1";

} else {

    slider.disabled = false;           // huwag i-disable
    slider.style.pointerEvents = "none"; // hindi mahihila
    slider.style.opacity = "1";          // hindi magiging gray

}

});

    // Couple Name (contenteditable)
    document.querySelectorAll(".couple-name").forEach(el => {
        el.contentEditable = editable;
    });

    // Drone column (contenteditable)
    document.querySelectorAll("td[contenteditable]").forEach(el => {
        el.contentEditable = editable;
    });

    // Buttons
    document.querySelectorAll(`
    .instruction-btn,
    .watch-btn,
    .comments-btn,
    .dashboard-raw-check-btn,
    .raw-check-btn,
    .generate-btn,
    .get-files-btn
`).forEach(btn => {

        // Watch button laging enabled
        if (btn.classList.contains("watch-btn")) {
            btn.disabled = false;
            btn.style.pointerEvents = "auto";
            btn.style.opacity = "1";
            return;
        }

        btn.disabled = !editable;
btn.style.pointerEvents = editable ? "auto" : "none";
btn.style.opacity = "1"; // laging full color
btn.style.filter = "none";

    });

}

function updateMonthLockUI() {

    console.log("===== updateMonthLockUI =====");
    document.querySelectorAll(".month-btn").forEach(btn => {

    const key = getMonthKey(currentYear, btn.dataset.month);

    const locked = !!monthLocks[key];

    if (IS_ADMIN) {

        btn.classList.toggle("locked", locked);

    } else {

        btn.classList.remove("locked");

    }

});

    console.log(
        "IS_ADMIN:",
        typeof IS_ADMIN !== "undefined" ? IS_ADMIN : "(undefined)"
    );

    console.log("Current Year:", currentYear);
    console.log("Current Month:", currentMonth);
    console.log("Current Key:", getMonthKey());
    console.log("All Locks:", getMonthLocks());

    // Huwag gumamit ng isMonthLocked() hangga't hindi pa alam kung may IS_ADMIN
    const locked = isMonthLocked();
    console.log("Locked:", locked);

    // Safety check
    if (typeof IS_ADMIN === "undefined") {
        console.warn("IS_ADMIN is not defined.");
        return;
    }

    if (IS_ADMIN) {
        // Admin = always editable
        setMonthEditable(true);
        return;
    }

    // Dashboard users
    setMonthEditable(!locked);

}

/* ==================================
   UI HELPERS
================================== */

function updateStatusColor(select){

    if(!select) return;

    // Always bold
    select.style.fontWeight = "700";

    // alisin muna lahat ng class
    select.classList.remove(
        "status-planned",
        "status-progress",
        "status-concerns",
        "status-review",
        "status-delivered",
        "status-ratings"
    );

    switch(select.value){

        case "PLANNED":
            select.classList.add("status-planned");
            break;

        case "IN PROGRESS":
            select.classList.add("status-progress");
            break;

        case "PROJECT CONCERNS":
            select.classList.add("status-concerns");
            break;

        case "FOR REVIEW":
            select.classList.add("status-review");
            break;

        case "DELIVERED":
            select.classList.add("status-delivered");
            break;

        case "YONG'S RATINGS":
            select.classList.add("status-ratings");
            break;

    }

    const row = select.closest("tr");

    // Show timeline only while IN PROGRESS
    const timeline = row?.querySelector(".timeline");
    const percent = row?.querySelector(".timeline-percent");

    if (timeline) {

        timeline.style.display =
            select.value === "IN PROGRESS"
                ? "block"
                : "none";

    }

    if (percent) {

        percent.style.display =
            select.value === "IN PROGRESS"
                ? "block"
                : "none";

    }

    // Show CONCERNS button only while PROJECT CONCERNS
    const concernsBtn = row?.querySelector(".concerns-btn");

    if (concernsBtn) {

        concernsBtn.style.display =
            select.value === "PROJECT CONCERNS"
                ? "block"
                : "none";

    }

    // Refresh timeline progress
    updateTimelineProgress();

}

// ====================================
// TYPE COLORS
// ====================================

function updateTypeColor(select){

    select.classList.remove(
        "type-basic",
        "type-romantic",
        "type-upbeat",
        "type-slow",
        "type-normal",
        "type-fast",
        "type-not-set"
    );

    switch(select.value){

        case "BASIC HIGHLIGHTS":
            select.classList.add("type-basic");
            break;

        case "ROMANTIC CINEMATIC":
            select.classList.add("type-romantic");
            break;

        case "UPBEAT CINEMATIC":
            select.classList.add("type-upbeat");
            break;

        case "SLOW CLASSICAL":
            select.classList.add("type-slow");
            break;

        case "NORMAL CLASSICAL":
            select.classList.add("type-normal");
            break;

        case "FAST CLASSICAL":
            select.classList.add("type-fast");
            break;

        default:
            select.classList.add("type-not-set");
    }
}

function updateSongStatusColor(select) {

    if (!select) return;

    const value = select.value;

    // Always bold
    select.style.fontWeight = "700";

    if (value === "APPROVED") {

        select.style.backgroundColor = "#dcfce7";
        select.style.color = "#15803d";

    } else if (value === "REJECT") {

        select.style.backgroundColor = "#fee2e2";
        select.style.color = "#b91c1c";

    } else if (value === "RESERVED") {

        select.style.backgroundColor = "#fef3c7";
        select.style.color = "#b45309";

    } else if (value === "REQUESTED") {

        select.style.backgroundColor = "#fdba74";
        select.style.color = "#7c2d12";

    } else {

        select.style.backgroundColor = "#ffffff";
        select.style.color = "#374151";

    }

}
/* ==================================
   MONTH RIGHT-CLICK MENU (ADMIN)
================================== */

const monthContextMenu = document.getElementById("monthContextMenu");

/* ==================================
   SAVE MONTH LOCK ONLY
================================== */

async function saveMonthLock(year, monthName, locked) {

    if (LOCAL_MODE) return;

    const monthNumber = monthMap[monthName];

    try {

        const response = await fetch("/api/month-lock", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                year: year,
                month: monthNumber,
                locked: locked

            })

        });

        const result = await response.json();

        console.log("[MONTH LOCK]", result);

    } catch (err) {

        console.error("[MONTH LOCK ERROR]", err);

    }

}

document.querySelectorAll(".month-btn").forEach(button => {

   /* ==============================
   LEFT CLICK = CHANGE MONTH
============================== */

button.addEventListener("click", async () => {

    document.querySelectorAll(".month-btn")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    currentMonth = button.dataset.month;

    console.log("========== MONTH CLICK ==========");
    console.log("Clicked:", currentMonth);
    console.log("Before Load:", button.className);

    await loadProjects();

    console.log("After Load:", button.className);

    setTimeout(() => {
        console.log("After 500ms:", button.className);
    }, 500);

});

    /* ==============================
       RIGHT CLICK = CONTEXT MENU
    ============================== */

    button.addEventListener("contextmenu", (e) => {

        e.preventDefault();

        // HUWAG BAGUHIN ANG currentMonth
        const selectedMonth = button.dataset.month;

        const lockBtn = document.getElementById("lockMonthBtn");
        const unlockBtn = document.getElementById("unlockMonthBtn");

        const key = getMonthKey(currentYear, selectedMonth);

        const locked = !!getMonthLocks()[key];

        if (locked) {

            lockBtn.style.display = "none";
            unlockBtn.style.display = "flex";

        } else {

            lockBtn.style.display = "flex";
            unlockBtn.style.display = "none";

        }

        monthContextMenu.dataset.month = selectedMonth;

        monthContextMenu.style.display = "block";
        monthContextMenu.style.left = `${e.pageX}px`;
        monthContextMenu.style.top = `${e.pageY}px`;

        console.log("Right Click Month:", selectedMonth);

    });

});

/* Hide Context Menu */

document.addEventListener("click", () => {

    if (monthContextMenu) {

        monthContextMenu.style.display = "none";

    }

});

/* ==================================
   LOCK MONTH
================================== */

document.getElementById("lockMonthBtn")?.addEventListener("click", async () => {

    const month = monthContextMenu.dataset.month;

    const button = document.querySelector(
        `.month-btn[data-month="${month}"]`
    );

    if (!button) return;

    // Update local memory
    const locks = getMonthLocks();

    locks[getMonthKey(currentYear, month)] = true;

    saveMonthLocks(locks);

    // Save only the month lock
    await saveMonthLock(currentYear, month, true);

    // Update UI
    button.classList.add("locked");

    updateMonthLockUI();

    console.log("LOCK:", `${currentYear}_${month}`);

    monthContextMenu.style.display = "none";

});

/* ==================================
   UNLOCK MONTH
================================== */

document.getElementById("unlockMonthBtn")?.addEventListener("click", async () => {

    const month = monthContextMenu.dataset.month;

    const button = document.querySelector(
        `.month-btn[data-month="${month}"]`
    );

    if (!button) return;

    // Update local memory
    const locks = getMonthLocks();

    delete locks[getMonthKey(currentYear, month)];

    saveMonthLocks(locks);

    // Save only the month lock
    await saveMonthLock(currentYear, month, false);

    // Update UI
    button.classList.remove("locked");

    updateMonthLockUI();

    console.log("UNLOCK:", `${currentYear}_${month}`);

    monthContextMenu.style.display = "none";

});
/* ==================================
   WATCH BUTTON EVENTS
================================== */

let activeWatchButton = null;
let activeFilesButton = null;

const songContextMenu = document.getElementById("songContextMenu");

// ===============================
// SONG RIGHT CLICK
// ===============================

let activeSongInput = null;

document.addEventListener("contextmenu", (e) => {

    const input = e.target.closest(".song-link");

    if (!input) return;

    e.preventDefault();
    e.stopPropagation();

    activeSongInput = input;

    const rect = input.getBoundingClientRect();

    songContextMenu.style.display = "block";

    songContextMenu.style.left =
        `${window.scrollX + rect.left}px`;

    songContextMenu.style.top =
        `${window.scrollY + rect.top - songContextMenu.offsetHeight - 8}px`;

});

const songLinkModal = document.getElementById("songLinkModal");
const songLinkInput = document.getElementById("songLinkInput");
const songTitleInput = document.getElementById("songTitleInput");
const closeSongLinkModal = document.getElementById("closeSongLinkModal");

const watchModal = document.getElementById("watchModal");
const watchFrame = document.getElementById("watchFrame");

const watchContextMenu = document.getElementById("watchContextMenu");

const watchLinkModal = document.getElementById("watchLinkModal");
const watchLinkInput = document.getElementById("watchLinkInput");
const closeWatchLinkModal = document.getElementById("closeWatchLinkModal");

// ==================================
// GET FILES
// ==================================

const filesContextMenu = document.getElementById("filesContextMenu");
const filesLinkModal = document.getElementById("filesLinkModal");
const filesLinkInput = document.getElementById("filesLinkInput");
const closeFilesLinkModal = document.getElementById("closeFilesLinkModal");

document.querySelectorAll(".watch-btn").forEach(button => {

    // LEFT CLICK
    button.addEventListener("click", () => {

        let link = button.dataset.watchLink;

if (!link) {

    alert(
        "📂 Project Files Coming Soon!\n\nPlease wait while the administrator attaches the project folder."
    );

    return;

}

// Convert supported links to embeddable format

if (link.includes("youtube.com/watch?v=")) {

    const videoId = new URL(link).searchParams.get("v");
    link = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

}

else if (link.includes("youtu.be/")) {

    const videoId = link.split("youtu.be/")[1].split("?")[0];
    link = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

}

else if (link.includes("drive.google.com/file/d/")) {

    const match = link.match(/\/d\/([^/]+)/);

    if (match) {
        link = `https://drive.google.com/file/d/${match[1]}/preview`;
    }

}

else if (link.includes("vimeo.com/")) {

    const videoId = link.split("/").pop().split("?")[0];
    link = `https://player.vimeo.com/video/${videoId}?autoplay=1`;

}

// For unsupported websites, open in a new tab
else {

    window.open(link, "_blank");
    return;

}

watchFrame.src = "";

watchFrame.src = link;

watchModal.classList.add("show");

// Save player state
localStorage.setItem("watchPlayerState", JSON.stringify({

    open: true,
    minimized: false,
    link: link

}));

});


// RIGHT CLICK
button.addEventListener("contextmenu", (e) => {

    console.log("RIGHT CLICK WORKING");

    e.preventDefault();
    e.stopPropagation();

    activeWatchButton = button;

    watchContextMenu.style.display = "block";

watchContextMenu.style.position = "fixed";

watchContextMenu.style.left = `${e.clientX}px`;

watchContextMenu.style.top = `${e.clientY}px`;

});

});

// ==================================
// GET FILES BUTTON EVENTS
// ==================================

document.querySelectorAll(".get-files-btn").forEach(button => {

    // LEFT CLICK
    button.addEventListener("click", () => {

        const link = button.dataset.filesLink;

        if (!link) {

    alert(
        "📂 Project Files Coming Soon!\n\nPlease wait while the administrator attaches the project folder."
    );

    return;

}

        window.open(link, "_blank");

    });

    // RIGHT CLICK
    button.addEventListener("contextmenu", (e) => {

        e.preventDefault();
        e.stopPropagation();

        activeFilesButton = button;

        filesContextMenu.style.display = "block";

filesContextMenu.style.position = "fixed";

filesContextMenu.style.left = `${e.clientX}px`;

filesContextMenu.style.top = `${e.clientY}px`;

    });

});

// ==================================
// HIDE ALL CONTEXT MENUS
// ==================================

document.addEventListener("click", (e) => {

    // SONG MENU
    if (
        songContextMenu &&
        !e.target.closest("#songContextMenu")
    ) {
        songContextMenu.style.display = "none";
    }

    // WATCH MENU
    if (
        watchContextMenu &&
        !e.target.closest("#watchContextMenu")
    ) {
        watchContextMenu.style.display = "none";
    }

    // FILES MENU
    if (
        filesContextMenu &&
        !e.target.closest("#filesContextMenu")
    ) {
        filesContextMenu.style.display = "none";
    }

});

document.getElementById("closeWatchModal")?.addEventListener("click", () => {

    watchModal.classList.remove("show");

    watchPlayer.classList.remove("mini-player");

    watchPlayer.style.left = "50%";
    watchPlayer.style.top = "50%";
    watchPlayer.style.right = "auto";
    watchPlayer.style.bottom = "auto";
    watchPlayer.style.transform = "translate(-50%, -50%)";

    minimizeWatch.style.display = "inline-flex";
    maximizeWatch.style.display = "none";

    watchFrame.src = "";

// Forget player state
localStorage.removeItem("watchPlayerState");

});

watchModal.addEventListener("mousedown", (e) => {

    if (watchPlayer.contains(e.target)) return;

    watchPlayer.classList.add("mini-player");

    minimizeWatch.style.display = "none";
    maximizeWatch.style.display = "inline-flex";

    // Update player state
const playerState = JSON.parse(localStorage.getItem("watchPlayerState"));

if (playerState) {

    playerState.minimized = true;

    localStorage.setItem(
        "watchPlayerState",
        JSON.stringify(playerState)
    );

}

});

document.getElementById("attachWatchLinkBtn")?.addEventListener("click", () => {

    if (!activeWatchButton) return;

    watchContextMenu.style.display = "none";

    watchLinkInput.value =
        activeWatchButton.dataset.watchLink || "";

    watchLinkModal.classList.add("show");
    watchLinkInput.focus();

});

watchLinkInput?.addEventListener("input", () => {

    if (!activeWatchButton) return;

    activeWatchButton.dataset.watchLink =
    watchLinkInput.value.trim();

const playIcon =
    activeWatchButton.querySelector(".play-icon");

playIcon?.classList.toggle(
    "has-link",
    watchLinkInput.value.trim() !== ""
);

saveProjects();

});

closeWatchLinkModal?.addEventListener("click", () => {

    watchLinkModal.classList.remove("show");

});

watchLinkModal?.addEventListener("click", (e) => {

    if (e.target === watchLinkModal) {

        watchLinkModal.classList.remove("show");

    }

});

/* ==================================
   GET FILES MODAL
================================== */

document.getElementById("attachFilesLinkBtn")?.addEventListener("click", () => {

    if (!activeFilesButton) return;

    filesContextMenu.style.display = "none";

    filesLinkInput.value =
        activeFilesButton.dataset.filesLink || "";

    filesLinkModal.classList.add("show");

    filesLinkInput.focus();

});

filesLinkInput?.addEventListener("input", () => {

    if (!activeFilesButton) return;

    activeFilesButton.dataset.filesLink =
        filesLinkInput.value.trim();

    activeFilesButton.classList.toggle(
        "has-link",
        filesLinkInput.value.trim() !== ""
    );

    saveProjects();

});

closeFilesLinkModal?.addEventListener("click", () => {

    filesLinkModal.classList.remove("show");

});

filesLinkModal?.addEventListener("click", (e) => {

    if (e.target === filesLinkModal) {

        filesLinkModal.classList.remove("show");

    }

});

// ===============================
// SONG LINK MODAL
// ===============================

document.getElementById("attachSongLinkBtn")?.addEventListener("click", () => {

    if (!activeSongInput) return;

    songContextMenu.style.display = "none";

    songTitleInput.value =
        activeSongInput.value || "";

    songLinkInput.value =
        activeSongInput.dataset.songLink || "";

    songLinkModal.classList.add("show");

    songTitleInput.focus();

});

songLinkInput?.addEventListener("input", () => {

    if (!activeSongInput) return;

    activeSongInput.dataset.songLink =
        songLinkInput.value.trim();

    updateSongLinkStyle(activeSongInput);

    saveProjects();

});

songTitleInput?.addEventListener("input", () => {

    if (!activeSongInput) return;

    activeSongInput.value =
        songTitleInput.value;

    saveProjects();

});

closeSongLinkModal?.addEventListener("click", () => {

    songLinkModal.classList.remove("show");

});

songLinkModal?.addEventListener("click", (e) => {

    if (e.target === songLinkModal) {

        songLinkModal.classList.remove("show");

    }

});

;// ===============================
// SPECIAL INSTRUCTIONS MODAL
// ===============================

let activeCoupleRow = null;

document.addEventListener("DOMContentLoaded", () => {

    const instructionButtons = document.querySelectorAll(".instruction-btn");
    const instructionModal = document.getElementById("instructionModal");
    const instructionTextarea = document.getElementById("instructionTextarea");
    const closeInstructionModal = document.getElementById("closeInstructionModal");

    console.log("Buttons:", instructionButtons.length);
    console.log("Modal:", instructionModal);

    instructionButtons.forEach((button) => {

    button.addEventListener("click", () => {

    console.log("Instruction button clicked");

    activeCoupleRow = button.closest("tr");

    const instructionBtn =
        activeCoupleRow.querySelector(".instruction-btn");

    instructionTextarea.value =
        instructionBtn.dataset.notes || "";

    instructionModal.classList.add("show");

    instructionTextarea.focus();

});

});

    closeInstructionModal.addEventListener("click", () => {
        instructionModal.classList.remove("show");
    });

    instructionModal.addEventListener("click", (e) => {
    if (e.target === instructionModal) {
        instructionModal.classList.remove("show");
    }
});

instructionTextarea.addEventListener("input", () => {

    if (!activeCoupleRow) return;

    const instructionBtn =
        activeCoupleRow.querySelector(".instruction-btn");

    instructionBtn.dataset.notes = instructionTextarea.value;

    if (instructionTextarea.value.trim()) {
        instructionBtn.style.background = "#22c55e";
    } else {
        instructionBtn.style.background = "#ff7a1a";
    }

        saveProjects();

});

});

// ===============================
// COMMENTS / CONCERNS MODAL
// ===============================

let activeNotesButton = null;

const commentsModal = document.getElementById("commentsModal");
const commentsTextarea = document.getElementById("commentsTextarea");
const closeCommentsModal = document.getElementById("closeCommentsModal");

// Open modal
document.addEventListener("click", (e) => {

    const button = e.target.closest(".comments-btn, .concerns-btn");

    if (!button) return;

    activeNotesButton = button;

    commentsTextarea.value =
        button.dataset.notes || "";

    // Switch modal theme
    if (button.classList.contains("concerns-btn")) {

        commentsModal.classList.add("concerns-mode");

    } else {

        commentsModal.classList.remove("concerns-mode");

    }

    commentsModal.classList.add("show");

    commentsTextarea.focus();

});

// Close button
closeCommentsModal?.addEventListener("click", () => {

    commentsModal.classList.remove("show");
    commentsModal.classList.remove("concerns-mode");

});

// Click outside
commentsModal?.addEventListener("click", (e) => {

    if (e.target === commentsModal) {

        commentsModal.classList.remove("show");
        commentsModal.classList.remove("concerns-mode");

    }

});

// Auto save
commentsTextarea?.addEventListener("input", () => {

    if (!activeNotesButton) return;

    activeNotesButton.dataset.notes = commentsTextarea.value;

    activeNotesButton.classList.toggle(
        "has-comments",
        commentsTextarea.value.trim() !== ""
    );

    saveProjects();

});

/* ==================================
   WATCH PLAYER WINDOW
================================== */

const watchPlayer = document.getElementById("watchBox");
const watchHeader = document.getElementById("watchHeader");

const minimizeWatch = document.getElementById("minimizeWatchBtn");
const maximizeWatch = document.getElementById("maximizeWatchBtn");

let watchDragging = false;
let watchOffsetX = 0;
let watchOffsetY = 0;

let normalWidth = "";
let normalHeight = "";
let normalLeft = "";
let normalTop = "";

if (
    watchPlayer &&
    watchHeader &&
    watchFrame &&
    minimizeWatch &&
    maximizeWatch
) {

    // Initial position
    watchPlayer.style.position = "fixed";
    watchPlayer.style.left = "50%";
    watchPlayer.style.top = "50%";
    watchPlayer.style.transform = "translate(-50%, -50%)";

    // =======================
// DRAG
// =======================

let dragRAF = null;
let dragX = 0;
let dragY = 0;

watchHeader.addEventListener("mousedown", (e) => {

    e.preventDefault();

    watchDragging = true;

    watchPlayer.classList.add("dragging");
    document.body.style.userSelect = "none";

    const rect = watchPlayer.getBoundingClientRect();

    watchPlayer.style.left = rect.left + "px";
    watchPlayer.style.top = rect.top + "px";

    watchPlayer.style.right = "auto";
    watchPlayer.style.bottom = "auto";

    watchPlayer.style.transform = "none";

    watchOffsetX = e.clientX - rect.left;
    watchOffsetY = e.clientY - rect.top;

});

document.addEventListener("mousemove", (e) => {

    if (!watchDragging) return;

    dragX = e.clientX - watchOffsetX;
    dragY = e.clientY - watchOffsetY;

    if (dragRAF) return;

    dragRAF = requestAnimationFrame(() => {

        watchPlayer.style.left = dragX + "px";
        watchPlayer.style.top = dragY + "px";

        dragRAF = null;

    });

});

document.addEventListener("mouseup", () => {

    watchDragging = false;

    watchPlayer.classList.remove("dragging");
    document.body.style.userSelect = "";

});

    // =======================
// MINIMIZE
// =======================

minimizeWatch.addEventListener("click", () => {

    if (watchPlayer.classList.contains("mini-player")) return;

    normalWidth = watchPlayer.style.width;
    normalHeight = watchPlayer.style.height;
    normalLeft = watchPlayer.style.left;
    normalTop = watchPlayer.style.top;

    watchPlayer.classList.add("mini-player");

    watchPlayer.style.left = "auto";
    watchPlayer.style.top = "auto";
    watchPlayer.style.right = "30px";
    watchPlayer.style.bottom = "30px";
    watchPlayer.style.transform = "none";

    // ADD THESE
    watchModal.style.background = "transparent";
    watchModal.style.pointerEvents = "none";
    watchPlayer.style.pointerEvents = "auto";

    minimizeWatch.style.display = "none";
    maximizeWatch.style.display = "inline-flex";

});

    // =======================
// RESTORE TO CENTER
// =======================

maximizeWatch.addEventListener("click", () => {

    watchPlayer.classList.remove("mini-player");

    watchPlayer.style.width = "";
    watchPlayer.style.height = "";

    watchPlayer.style.left = "50%";
    watchPlayer.style.top = "50%";

    watchPlayer.style.right = "auto";
    watchPlayer.style.bottom = "auto";

    watchPlayer.style.transform = "translate(-50%, -50%)";

    maximizeWatch.style.display = "none";
    minimizeWatch.style.display = "inline-flex";

// Update player state
const playerState = JSON.parse(localStorage.getItem("watchPlayerState"));

if (playerState) {

    playerState.minimized = false;

    localStorage.setItem(
        "watchPlayerState",
        JSON.stringify(playerState)
    );

}

});

    // Hide restore button initially
    maximizeWatch.style.display = "none";

    // =======================
    // AUTO PAUSE
    // =======================

    document.addEventListener("click", (e) => {

        if (
            watchPlayer.classList.contains("mini-player") &&
            !watchPlayer.contains(e.target)
        ) {

            if (watchFrame.src.includes("youtube")) {

                watchFrame.contentWindow.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}',
                    "*"
                );

            } else if (watchFrame.src.includes("vimeo")) {

                watchFrame.contentWindow.postMessage(
                    { method: "pause" },
                    "*"
                );

            }

        }

    });

    // =======================
    // RESUME
    // =======================

    watchPlayer.addEventListener("click", () => {

        if (!watchPlayer.classList.contains("mini-player")) return;

        if (watchFrame.src.includes("youtube")) {

            watchFrame.contentWindow.postMessage(
                '{"event":"command","func":"playVideo","args":""}',
                "*"
            );

        } else if (watchFrame.src.includes("vimeo")) {

            watchFrame.contentWindow.postMessage(
                { method: "play" },
                "*"
            );

        }

    });

}
// ===============================
// LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");
const logoutConfirm = document.getElementById("logoutConfirm");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

if (logoutBtn) {

    // Show / Hide popup
    logoutBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        logoutConfirm.classList.toggle("show");

    });

}

if (cancelLogout) {

    cancelLogout.addEventListener("click", (e) => {

        e.stopPropagation();

        logoutConfirm.classList.remove("show");

    });

}

if (confirmLogout) {

    confirmLogout.addEventListener("click", () => {

        localStorage.removeItem("currentUser");

        window.location.href = "../login.html";

    });

}

// Close popup when clicking outside
document.addEventListener("click", (e) => {

    if (
        logoutConfirm &&
        !logoutConfirm.contains(e.target) &&
        !logoutBtn.contains(e.target)
    ) {

        logoutConfirm.classList.remove("show");

    }

});

/* ==================================
   BUTTON CLICK SOUND
================================== */

const clickSound = new Audio("../assets/sounds/click.mp3");
clickSound.volume = 0.2;

document.querySelectorAll(`
    button,
    input[type="button"],
    input[type="submit"],
    input[type="reset"]
`).forEach(button => {

    button.addEventListener("click", () => {

        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});

    });

});


/* ==================================
   TYPING SOUND
================================== */

const typingSound = new Audio("../assets/sounds/typing.mp3");
typingSound.volume = 0.30;

let lastTypingTime = 0;

document.addEventListener("keydown", (e) => {

    const target = e.target;

    // Editable fields only
    if (
        !target.matches(`
            input,
            textarea,
            [contenteditable="true"]
        `)
    ) return;

    // Ignore modifier keys
    if (
        [
            "Shift",
            "Control",
            "Alt",
            "Meta",
            "CapsLock",
            "Tab",
            "Escape"
        ].includes(e.key)
    ) return;

    const now = Date.now();

    if (now - lastTypingTime > 40) {

        typingSound.currentTime = 0;
        typingSound.play().catch(() => {});

        lastTypingTime = now;
    }

});


/* ==================================
   BACKGROUND MUSIC
================================== */

let musicPlaylist = [];

async function loadPlaylist() {

    try {

        const response = await fetch("../assets/Music/playlist.json");

        musicPlaylist = await response.json();

        musicPlaylist = musicPlaylist.map(file =>
            `../assets/Music/${file}`
        );

        playRandomMusic();

    } catch (err) {

        console.error("Unable to load playlist.", err);

    }

}

const bgMusic = new Audio();
bgMusic.volume = 0.25;

let lastSongIndex = -1;

function playRandomMusic() {

    if (!musicPlaylist.length) return;

    let randomIndex;

    do {

        randomIndex = Math.floor(
            Math.random() * musicPlaylist.length
        );

    } while (
        musicPlaylist.length > 1 &&
        randomIndex === lastSongIndex
    );

    lastSongIndex = randomIndex;

    bgMusic.src = musicPlaylist[randomIndex];

    bgMusic.play().catch(() => {

        // Browser autoplay fallback
        document.addEventListener(
            "click",
            () => {

                bgMusic.play();

            },
            { once: true }
        );

    });

}

// Play another random song when finished
bgMusic.addEventListener("ended", () => {

    playRandomMusic();

});

// Load playlist then start music
loadPlaylist();

/* ==================================
   MUSIC PLAYER CONTROLS
================================== */

const playBtn = document.getElementById("musicPlay");
const prevBtn = document.getElementById("musicPrev");
const nextBtn = document.getElementById("musicNext");
const volumeSlider = document.getElementById("musicVolume");
const volumeValue = document.getElementById("volumeValue");
const volumeIcon = document.getElementById("volumeIcon");

/* ===========================
   PLAY / PAUSE
=========================== */

playBtn.addEventListener("click", () => {

    if (bgMusic.paused) {

        bgMusic.play();

    } else {

        bgMusic.pause();

    }

});

/* ===========================
   NEXT SONG
=========================== */

nextBtn.addEventListener("click", () => {

    playRandomMusic();

});

/* ===========================
   PREVIOUS SONG
=========================== */

prevBtn.addEventListener("click", () => {

    if (musicPlaylist.length <= 1) return;

    let randomIndex;

    do{

        randomIndex = Math.floor(
            Math.random() * musicPlaylist.length
        );

    }while(randomIndex === lastSongIndex);

    lastSongIndex = randomIndex;

    bgMusic.src = musicPlaylist[randomIndex];

    bgMusic.play();

});

/* ===========================
   VOLUME
=========================== */

volumeSlider.addEventListener("input", () => {

    bgMusic.volume = volumeSlider.value / 100;

    volumeValue.textContent = volumeSlider.value + "%";

    if (bgMusic.volume === 0) {

        volumeIcon.textContent = "🔇";

    } else {

        lastVolume = bgMusic.volume;

        volumeIcon.textContent = "🔊";

    }

});

/* ===========================
   INITIAL VOLUME
=========================== */

const initialVolume = Math.round(bgMusic.volume * 100);

volumeSlider.value = initialVolume;
volumeValue.textContent = initialVolume + "%";

/* ===========================
   BUTTON STATE
=========================== */

bgMusic.addEventListener("play", () => {

    playBtn.textContent = "⏸";

});

bgMusic.addEventListener("pause", () => {

    playBtn.textContent = "▶";

});

/* ===========================
   MUTE / UNMUTE
=========================== */

let lastVolume = bgMusic.volume;

volumeIcon.addEventListener("click", () => {

    if (bgMusic.volume > 0) {

        lastVolume = bgMusic.volume;

        bgMusic.volume = 0;

        volumeSlider.value = 0;
        volumeValue.textContent = "0%";
        volumeIcon.textContent = "🔇";

    } else {

        bgMusic.volume = lastVolume || 0.15;

        volumeSlider.value = Math.round(bgMusic.volume * 100);
        volumeValue.textContent = volumeSlider.value + "%";
        volumeIcon.textContent = "🔊";

    }

});

/* ==================================
   SONG LINK STYLE
================================== */

function updateSongLinkStyle(input){

    if(!input) return;

    input.classList.toggle(
        "has-link",
        !!input.dataset.songLink?.trim()
    );

}

document.addEventListener("input", (e) => {

    if (
        e.target.closest(".couple-name") ||
        e.target.closest(".dashboard-raw-input")
    ) {

        updateCurrentMonthHasData();

    }

});

/* ==================================
   DRONE AUTOCOMPLETE
================================== */

function updateDroneColor(select){

    if(!select) return;

    select.classList.remove("selected","client-drone");

    if(select.value === "CLIENT'S DRONE"){
        select.classList.add("client-drone");
    }
    else if(select.value !== "NO DRONE"){
        select.classList.add("selected");
    }

}

document.querySelectorAll(".drone-cell").forEach(cell => {

    const search = cell.querySelector(".drone-search");
    const select = cell.querySelector(".drone-select");
    const suggestions = cell.querySelector(".drone-suggestions");

    if (!search || !select || !suggestions) return;

    updateDroneColor(select);

    search.addEventListener("input", () => {

        const keyword = search.value.trim().toUpperCase();

        suggestions.innerHTML = "";

        if (!keyword) {
            suggestions.classList.remove("show");
            return;
        }

        [...select.options].forEach(option => {

            if (
                option.value === "NO DRONE" ||
                !option.text.toUpperCase().includes(keyword)
            ) return;

            const item = document.createElement("div");

            item.className = "drone-suggestion";

            item.innerHTML = option.text.replace(
                new RegExp(keyword, "ig"),
                match => `<b>${match}</b>`
            );

            item.addEventListener("click", () => {

                select.value = option.value;

                updateDroneColor(select);

                search.value = "";

                suggestions.innerHTML = "";
                suggestions.classList.remove("show");

                saveProjects();

            });

            suggestions.appendChild(item);

        });

        suggestions.classList.toggle(
            "show",
            suggestions.children.length > 0
        );

    });

    select.addEventListener("change", () => {
        updateDroneColor(select);
    });

       document.addEventListener("click", (e) => {

        if (!cell.contains(e.target)) {
            suggestions.classList.remove("show");
        }

    });

});

/* ==================================
   DOUBLE CLICK TO OPEN LINKS
================================== */

document.addEventListener("dblclick", (e) => {

    const input = e.target.closest(".song-link");

    if (!input) return;

    const link = input.dataset.songLink?.trim();

    if (!link) return;

    window.open(link, "_blank");

});

/* ==================================
   PROJECT TIMELINE PROGRESS
================================== */

function updateTimelineProgress() {

    document.querySelectorAll(".project-table tbody tr").forEach(row => {

        updateRowProgress(row);

    });

}

/* ==================================
   ROW PROGRESS
================================== */

function updateRowProgress(row) {

    if (!row) return;

    const status =
        row.querySelector(".status-select");

    const slider =
        row.querySelector(".progress-slider");

    const label =
        row.querySelector(".timeline-percent");

    if (
        !status ||
        !slider ||
        !label
    ) return;

    // ==================================
// SHOW / HIDE CONTROLS
// ==================================

const getFilesBtn =
    row.querySelector(".get-files-btn");

const inProgress =
    status.value === "IN PROGRESS";

const delivered =
    status.value === "DELIVERED";

// Progress controls
slider.style.display =
    inProgress ? "block" : "none";

label.style.display =
    inProgress ? "block" : "none";

// GET FILES button
if (getFilesBtn) {

    getFilesBtn.style.display =
        delivered ? "block" : "none";

}

    // Percentage
    label.textContent =
        slider.value + "%";

    // Dynamic color
    const value =
        Number(slider.value);

    const hue = value * 1.2;

slider.style.accentColor =
    `hsl(${hue}, 90%, 50%)`;

}

/* ==================================
   PROGRESS SLIDER
================================== */

document.querySelectorAll(".progress-slider").forEach(slider => {

    updateRowProgress(
        slider.closest("tr")
    );

    slider.addEventListener("input", () => {

        updateRowProgress(
            slider.closest("tr")
        );

        saveProjects();

    });

});

/* ==================================
   GET FILES BUTTON
================================== */

document.querySelectorAll(".get-files-btn").forEach(btn => {

    // Left click = Open attached folder
    btn.addEventListener("click", () => {

        const link = btn.dataset.filesLink;

        if (!link) {

            alert(
                "📂 Project Files Coming Soon!\n\nPlease wait while the administrator attaches the project folder."
            );

            return;

        }

        window.open(link, "_blank");

    });

});

// Start playlist
playRandomMusic();


// ==================================
// RESTORE PROJECTS (LOCAL CACHE)
// ==================================

function restoreProjectsLocal(year = currentYear, month = currentMonth) {

    const key = `projects_${year}_${month}`;

    const saved = localStorage.getItem(key);

    if (!saved) {

        console.log(`[LOCAL RESTORE] No cache found for ${key}`);

        return false;

    }

    try {

        const projects = JSON.parse(saved);

        const rows = document.querySelectorAll(".project-table tbody tr");

        rows.forEach(row => {

            const rowId = Number(
                row.dataset.rowId ||
                row.getAttribute("data-row-id")
            );

            const data = projects.find(
                p => Number(p.rowId) === rowId
            );

            if (data) {

                populateRow(row, data);

            }

        });

        console.log(
            `[LOCAL RESTORE] Restored ${projects.length} project(s) from ${key}`
        );

        return true;

    } catch (e) {

        console.error("[LOCAL RESTORE]", e);

        return false;

    }

}