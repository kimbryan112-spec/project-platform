// =========================
// STORAGE MODE
// true = localStorage
// false = Cloudflare API
// =========================
const LOCAL_MODE = true;

let currentYear = new Date().getFullYear().toString();

let currentMonth =
    document.querySelector(".month-btn.active")?.dataset.month || "sep";

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

    console.log('[INIT] Page loaded, starting data load...');

    currentYear = new Date().getFullYear().toString();

    const monthMap = [
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

currentMonth = monthMap[new Date().getMonth()];

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

        // Kapag nagpalit ng year
        yearSelect.addEventListener("change", () => {

            currentYear = yearSelect.value;

            document.getElementById("currentYearTitle").textContent = currentYear;

            loadProjectsLocal();

        });

    }

    loadProjectsLocal();

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

            loadProjectsLocal();

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
    }

    if (e.target.classList.contains('type-select')) {
        updateTypeColor(e.target);
    }

    if (e.target.classList.contains('dashboard-song-status')) {
        updateSongStatusColor(e.target);
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
            link: "",
            status: "",
            notes: ""
        };
    }

    return {
    link: cell.querySelector('.song-link')?.value || "",
    status: cell.querySelector('.dashboard-song-status')?.value || "",
    notes: cell.querySelector('.comments-btn')?.dataset.notes || ""
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
    cells[4]?.innerText?.trim() || "",

instruction:
    cells[0]?.querySelector(".instruction-btn")?.dataset.notes || "",

    song1: getSongData(5),
song2: getSongData(6),
song3: getSongData(7),
teaserSong: getSongData(8),

watchLink:
    cells[0]?.querySelector(".watch-btn")?.dataset.watchLink || ""
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
        cells[4].innerText = data.drone || "";
    }

    const setSongData = (cellIndex, songData = {}) => {

    const cell = cells[cellIndex];
    if (!cell) return;

    const link = cell.querySelector(".song-link");
    const status = cell.querySelector(".dashboard-song-status");
    const commentsBtn = cell.querySelector(".comments-btn");

    if (link) link.value = songData.link || "";

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

    // Green kapag may comments
    if (commentsBtn) {
        commentsBtn.classList.toggle(
            "has-comments",
            !!songData.notes?.trim()
        );
    }

};

    setSongData(5, data.song1);
    setSongData(6, data.song2);
    setSongData(7, data.song3);
    setSongData(8, data.teaserSong);

    const watchBtn = cells[0]?.querySelector(".watch-btn");

    if (watchBtn) {
        watchBtn.dataset.watchLink = data.watchLink || "";
    }

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
            cells[4].innerText = "";
        }

        // Songs
        [5, 6, 7, 8].forEach(index => {

            const cell = cells[index];
            if (!cell) return;

            const link = cell.querySelector(".song-link");
            if (link) link.value = "";

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

    if (!savedData) {
        console.log("[LOCAL LOAD] No saved data.");
        return;
    }

    const projectsData = JSON.parse(savedData);

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

// Restore locked months
const locks = getMonthLocks();

const isAdmin = typeof IS_ADMIN !== "undefined" && IS_ADMIN;

document.querySelectorAll(".month-btn").forEach(btn => {

    const key = getMonthKey(currentYear, btn.dataset.month);

    if (isAdmin && locks[key]) {
        btn.classList.add("locked");
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

// Apply editable/read-only state
updateMonthLockUI();

console.log("[LOCAL LOAD] Loaded from localStorage.");

}

// ONLINE LOAD FUNCTION (MAY ANTI-CACHE PARAMETER)
async function loadProjects() {

    if (LOCAL_MODE) {
        return loadProjectsLocal();
    }

    updateMonthLockUI();

    try {
        console.log('[LOAD] Fetching projects from /api/projects...');
        const response = await fetch(`/api/projects?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
            console.error('[LOAD] API returned error:', response.status);
            return;
        }

        const projectsData = await response.json();
        console.log('[LOAD] API Response:', projectsData);
        console.log('[LOAD] Total records from DB:', projectsData.length);

        const rows = document.querySelectorAll('.project-table tbody tr');
        console.log('[LOAD] Total rows in HTML:', rows.length);
        
        if (Array.isArray(projectsData) && projectsData.length > 0) {
            let matchedCount = 0;
            // Match data by rowId instead of index
            rows.forEach((row) => {
                const rowId = parseInt(row.getAttribute('data-row-id'), 10);
                console.log(`[LOAD] Processing row with data-row-id: ${rowId}`);
                
                const data = projectsData.find(d => d.rowId === rowId);
                if (data) {
                    console.log(`[LOAD] Found matching data for rowId ${rowId}`);
                    populateRow(row, data);
                    matchedCount++;
                } else {
                    console.warn(`[LOAD] No matching data for rowId ${rowId}`);
                }
            });
            console.log(`[LOAD] Successfully matched ${matchedCount} rows with database data`);
        } else {
            console.log('[LOAD] No data returned from API');
        }
    } catch (e) {
        console.error('[LOAD] Error loading projects from Cloudflare backend:', e);
    }

    document.querySelectorAll('.status-select')
    .forEach(updateStatusColor);

document.querySelectorAll('.type-select')
    .forEach(updateTypeColor);

document.querySelectorAll('.dashboard-song-status')
    .forEach(updateSongStatusColor);
}

// ONLINE SAVE FUNCTION
let saveTimeout;
function saveProjects() {

    if (LOCAL_MODE) {
        return saveProjectsLocal();
    }

    updateMonthLockUI();

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const rows = document.querySelectorAll('.project-table tbody tr');
        const projectsData = [];

        rows.forEach(row => {
            const rowData = collectRowData(row);
            if (rowData) projectsData.push(rowData);
        });

        console.log('[SAVE] Saving to API:', projectsData);

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectsData)
            });

            if (response.ok) {
                console.log("[SAVE] Successfully synced to Cloudflare backend!");
            } else {
                console.error('[SAVE] API error:', response.status);
            }
        } catch (e) {
            console.error('[SAVE] Error saving projects to Cloudflare backend:', e);
        }
    }, 500);
}

function saveProjectsLocal() {

    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {

        const rows = document.querySelectorAll(".project-table tbody tr");
        const projectsData = [];

        rows.forEach(row => {
            const rowData = collectRowData(row);
            if (rowData) projectsData.push(rowData);
        });

        // Save to the selected month
localStorage.setItem(
    `projects_${currentYear}_${currentMonth}`,
    JSON.stringify(projectsData)
);

// Backward compatibility
if (currentYear === "2026" && currentMonth === "sep") {

    localStorage.setItem(
        "projects_sep",
        JSON.stringify(projectsData)
    );

    localStorage.setItem(
        "projects",
        JSON.stringify(projectsData)
    );

}

console.log("[LOCAL SAVE] Saved to localStorage.");

    }, 500);

}

// ==================================
// MONTH LOCK HELPERS
// ==================================

function getMonthLocks() {
    return JSON.parse(localStorage.getItem("monthLocks") || "{}");
}

function saveMonthLocks(locks) {
    localStorage.setItem("monthLocks", JSON.stringify(locks));
}

function getMonthKey(year = currentYear, month = currentMonth) {
    return `${year}_${month}`;
}

function isMonthLocked() {

    return !!getMonthLocks()[getMonthKey()];

}

function setMonthEditable(editable) {

    // Inputs / Selects
    document.querySelectorAll(`
        .status-select,
        .type-select,
        .dashboard-raw-input,
        .song-link,
        .dashboard-song-status,
        .song-notes
    `).forEach(input => {
        input.disabled = !editable;
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
        .generate-btn
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
        btn.style.opacity = editable ? "1" : "0.6";

    });

}

function updateMonthLockUI() {

    console.log("===== updateMonthLockUI =====");
    console.log("IS_ADMIN:", IS_ADMIN);
    console.log("Current Year:", currentYear);
    console.log("Current Month:", currentMonth);
    console.log("Current Key:", getMonthKey());
    console.log("All Locks:", getMonthLocks());
    console.log("Locked:", isMonthLocked());

    // Safety check
    if (typeof IS_ADMIN === "undefined") {
        return;
    }

    if (IS_ADMIN) {

        // Admin = always editable
        setMonthEditable(true);
        return;

    }

    // Dashboard
    setMonthEditable(!isMonthLocked());

}

/* ==================================
   UI HELPERS
================================== */

function updateStatusColor(select){

    if(!select) return;

    // alisin muna lahat ng class
    select.classList.remove(
        "status-planned",
        "status-progress",
        "status-review",
        "status-feedback",
        "status-approved",
        "status-delivered"
    );

    switch(select.value){

        case "PLANNED":
            select.classList.add("status-planned");
            break;

        case "IN PROGRESS":
            select.classList.add("status-progress");
            break;

        case "FOR REVIEW":
            select.classList.add("status-review");
            break;

        case "YONG'S FEEDBACK":
            select.classList.add("status-feedback");
            break;

        case "APPROVED PROJ":
            select.classList.add("status-approved");
            break;

        case "DELIVERED":
            select.classList.add("status-delivered");
            break;
    }

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
    if (value === 'APPROVED') {
        select.style.backgroundColor = '#dcfce7';
        select.style.color = '#15803d';
    } else if (value === 'REJECT') {
        select.style.backgroundColor = '#fee2e2';
        select.style.color = '#b91c1c';
    } else if (value === 'RESERVED') {
        select.style.backgroundColor = '#fef3c7';
        select.style.color = '#b45309';
    } else {
        select.style.backgroundColor = '#ffffff';
        select.style.color = 'inherit';
    }
}
/* ==================================
   MONTH RIGHT-CLICK MENU (ADMIN)
================================== */

const monthContextMenu = document.getElementById("monthContextMenu");

document.querySelectorAll(".month-btn").forEach(button => {

    // LEFT CLICK = Select Month
    button.addEventListener("click", () => {

        // Alisin ang active sa lahat
        document.querySelectorAll(".month-btn")
            .forEach(btn => btn.classList.remove("active"));

        // I-set ang active month
        button.classList.add("active");

        // Update current month
        currentMonth = button.dataset.month;

        console.log("Current Month:", currentMonth);

        // Load projects ng napiling month
        loadProjectsLocal();

    });

    // RIGHT CLICK = Context Menu
    button.addEventListener("contextmenu", (e) => {

        e.preventDefault();

        currentMonth = button.dataset.month;

        const lockBtn = document.getElementById("lockMonthBtn");
const unlockBtn = document.getElementById("unlockMonthBtn");

const key = getMonthKey(currentYear, currentMonth);
const locked = !!getMonthLocks()[key];

if (locked) {
    lockBtn.style.display = "none";
    unlockBtn.style.display = "flex";   // o "block" depende sa CSS mo
} else {
    lockBtn.style.display = "flex";
    unlockBtn.style.display = "none";
}

monthContextMenu.style.display = "block";
monthContextMenu.style.left = `${e.pageX}px`;
monthContextMenu.style.top = `${e.pageY}px`;

monthContextMenu.dataset.month = currentMonth;

        console.log("Right Click Month:", currentMonth);

    });

});

document.addEventListener("click", () => {
    if (monthContextMenu) {
        monthContextMenu.style.display = "none";
    }
});

document.getElementById("lockMonthBtn")?.addEventListener("click", () => {

    const month = monthContextMenu.dataset.month;

    const button = document.querySelector(`.month-btn[data-month="${month}"]`);

    if (button) {

        // Save lock state
        const locks = getMonthLocks();
        locks[getMonthKey(currentYear, month)] = true;
        saveMonthLocks(locks);

        // UI
        button.classList.add("locked");

        // Refresh editable/read-only state
        updateMonthLockUI();

    }

    console.log("LOCK:", `${currentYear}_${month}`);

    monthContextMenu.style.display = "none";

});

document.getElementById("unlockMonthBtn")?.addEventListener("click", () => {

    const month = monthContextMenu.dataset.month;

    const button = document.querySelector(`.month-btn[data-month="${month}"]`);

    if (button) {

        // Remove lock state
        const locks = getMonthLocks();
        delete locks[getMonthKey(currentYear, month)];
        saveMonthLocks(locks);

        // UI
        button.classList.remove("locked");

        // Refresh editable/read-only state
        updateMonthLockUI();

    }

    console.log("UNLOCK:", `${currentYear}_${month}`);

    monthContextMenu.style.display = "none";

});
/* ==================================
   WATCH BUTTON EVENTS
================================== */

let activeWatchButton = null;

const watchModal = document.getElementById("watchModal");
const watchFrame = document.getElementById("watchFrame");

const watchContextMenu = document.getElementById("watchContextMenu");

const watchLinkModal = document.getElementById("watchLinkModal");
const watchLinkInput = document.getElementById("watchLinkInput");
const closeWatchLinkModal = document.getElementById("closeWatchLinkModal");

document.querySelectorAll(".watch-btn").forEach(button => {

    // LEFT CLICK
    button.addEventListener("click", () => {

        let link = button.dataset.watchLink;

if (!link) {
    alert("No Watch Link attached.");
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
    watchContextMenu.style.left = `${e.pageX}px`;
    watchContextMenu.style.top = `${e.pageY}px`;

});

});

// Hide menu kapag nag-click sa labas
document.addEventListener("click", (e) => {

    // Kung wala ang context menu sa page, huwag mag-error
    if (!watchContextMenu) return;

    if (!e.target.closest("#watchContextMenu")) {
        watchContextMenu.style.display = "none";
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
// COMMENTS MODAL
// ===============================

let activeCommentsButton = null;

const commentsModal = document.getElementById("commentsModal");
const commentsTextarea = document.getElementById("commentsTextarea");
const closeCommentsModal = document.getElementById("closeCommentsModal");

document.querySelectorAll(".comments-btn").forEach(button => {

    button.addEventListener("click", () => {

        activeCommentsButton = button;

        commentsTextarea.value =
            button.dataset.notes || "";

        commentsModal.classList.add("show");

        commentsTextarea.focus();

    });

});

closeCommentsModal?.addEventListener("click", () => {

    commentsModal.classList.remove("show");

});

commentsModal?.addEventListener("click", (e) => {

    if (e.target === commentsModal) {

        commentsModal.classList.remove("show");

    }

});

commentsTextarea?.addEventListener("input", () => {

    if (!activeCommentsButton) return;

    activeCommentsButton.dataset.notes = commentsTextarea.value;

    activeCommentsButton.classList.toggle(
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
clickSound.volume = 0.20;

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