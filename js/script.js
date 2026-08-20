// =========================
// STORAGE MODE
// true = localStorage
// false = Cloudflare API
// =========================
const LOCAL_MODE = true;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] Page loaded, starting data load...');
    loadProjects();

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

            if (e.target.classList.contains('dashboard-song-status')) {
                updateSongStatusColor(e.target);
            }

            document.querySelectorAll('.dashboard-song-status')
                .forEach(updateSongStatusColor);
        });

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
    notes: cell.querySelector('.song-notes')?.value || ""
};
};

        return {
    rowId: parseInt(rowId, 10),

    coupleName:
    cells[0]?.querySelector(".couple-name")?.textContent.trim() || "",

    status:
        cells[1]?.querySelector(".status-select")?.value || "",

    type:
        cells[2]?.querySelector(".type-select")?.value || "",

    rawFiles:
        cells[3]?.querySelector(".dashboard-raw-input")?.value || "",

    drone:
    cells[4]?.innerText?.trim() || "",

instruction:
    cells[0]?.querySelector(".instruction-btn")?.dataset.notes || "",

locked: document.querySelectorAll(".month-btn.locked")
    ? Array.from(document.querySelectorAll(".month-btn.locked"))
        .map(btn => btn.dataset.month)
    : [],

    song1: getSongData(5),
    song2: getSongData(6),
    song3: getSongData(7),
    teaserSong: getSongData(8)
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
    if (cells[1] && cells[1].querySelector('.status-select')) cells[1].querySelector('.status-select').value = data.status || "IN PROGRESS";
    if (cells[2] && cells[2].querySelector('.type-select')) cells[2].querySelector('.type-select').value = data.type || "NOT SET";
    if (cells[3] && cells[3].querySelector('.dashboard-raw-input')) cells[3].querySelector('.dashboard-raw-input').value = data.rawFiles || "";
    if (cells[4]) cells[4].innerText = data.drone || "";
    
    const setSongData = (cellIndex, songData = {}) => {
    const cell = cells[cellIndex];
    if (!cell) return;

    const link = cell.querySelector(".song-link");
const status = cell.querySelector(".dashboard-song-status");
const notes = cell.querySelector(".song-notes");

if (link) link.value = songData.link || "";

if (status) {
    status.value = songData.status || "";
    updateSongStatusColor(status);
}

if (notes) {
    notes.value = songData.notes || "";
}
};

    setSongData(5, data.song1);
    setSongData(6, data.song2);
    setSongData(7, data.song3);
    setSongData(8, data.teaserSong);

if (Array.isArray(data.locked)) {
    data.locked.forEach(month => {
        document
            .querySelector(`.month-btn[data-month="${month}"]`)
            ?.classList.add("locked");
    });
}

// Apply colors after populating
    updateStatusColor(cells[1]?.querySelector('.status-select'));
    document.querySelectorAll('.dashboard-song-status').forEach(updateSongStatusColor);
}
function loadProjectsLocal() {

    const savedData = localStorage.getItem("projects");

    if (!savedData) {
        console.log("[LOCAL LOAD] No saved data.");
        return;
    }

    const projectsData = JSON.parse(savedData);

    const rows = document.querySelectorAll(".project-table tbody tr");

    rows.forEach((row) => {

        const rowId = parseInt(row.dataset.rowId);

        const data = projectsData.find(item => item.rowId === rowId);

        if (data) {
            populateRow(row, data);
        }

    });

    document.querySelectorAll(".status-select")
        .forEach(updateStatusColor);

    document.querySelectorAll(".dashboard-song-status")
        .forEach(updateSongStatusColor);

    console.log("[LOCAL LOAD] Loaded from localStorage.");

}

// ONLINE LOAD FUNCTION (MAY ANTI-CACHE PARAMETER)
async function loadProjects() {

    if (LOCAL_MODE) {
        return loadProjectsLocal();
    }

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

    document.querySelectorAll('.status-select').forEach(updateStatusColor);
    document.querySelectorAll('.dashboard-song-status').forEach(updateSongStatusColor);
}

// ONLINE SAVE FUNCTION
let saveTimeout;
function saveProjects() {

    if (LOCAL_MODE) {
        return saveProjectsLocal();
    }

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

        localStorage.setItem(
            "projects",
            JSON.stringify(projectsData)
        );

        console.log("[LOCAL SAVE] Saved to localStorage.");

    }, 500);

}

/* ==================================
   UI HELPERS
================================== */

function updateStatusColor(select) {

    if (!select) return;

    const value = select.value;

    switch (value) {

        case 'APPROVED PROJ':

        case 'DELIVERED':

            select.style.borderLeft = '5px solid #22c55e';

            break;

        case 'FOR REVIEW':

        case "YONG'S FEEDBACK":

            select.style.borderLeft = '5px solid #f59e0b';

            break;

        case 'IN PROGRESS':

            select.style.borderLeft = '5px solid #3b82f6';

            break;

        default:

            select.style.borderLeft = '1px solid #cfcfcf';

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

    button.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        monthContextMenu.style.display = "block";
        monthContextMenu.style.left = `${e.pageX}px`;
        monthContextMenu.style.top = `${e.pageY}px`;

        monthContextMenu.dataset.month = button.dataset.month;
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
    button.classList.add("locked");
saveProjects();
console.log(button.className);
}

    console.log("LOCK:", month);

    monthContextMenu.style.display = "none";

});

document.getElementById("unlockMonthBtn")?.addEventListener("click", () => {

    const month = monthContextMenu.dataset.month;

    const button = document.querySelector(`.month-btn[data-month="${month}"]`);

    if (button) {
        button.classList.remove("locked");
saveProjects();
    }

    console.log("UNLOCK:", month);

    monthContextMenu.style.display = "none";

});// ===============================
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
    instructionBtn.style.background = "#22c55e"; // green kapag may notes
} else {
    instructionBtn.style.background = "#ff7a1a"; // orange kapag wala
}

saveProjects();

});

});