document.addEventListener('DOMContentLoaded', () => {
    // 1. I-load ang data mula sa Cloudflare KV pagkabukas ng page
    loadProjects();

    const tableBody = document.querySelector('.project-table tbody');

    if (tableBody) {
        // 2. Auto-save kapag may nag-type o nag-edit (inputs & contenteditable)
        tableBody.addEventListener('input', () => {
            saveProjects();
        });

        // 3. Auto-save kapag may pinili sa dropdowns
        tableBody.addEventListener('change', (e) => {
            saveProjects();
            
            // I-update ang UI colors
            if (e.target.classList.contains('status-select')) {
                updateStatusColor(e.target);
            }
            if (e.target.classList.contains('song-status')) {
                updateSongStatusColor(e.target);
            }
        });
    }

    // I-set ang initial colors sa pag-load
    document.querySelectorAll('.status-select').forEach(updateStatusColor);
    document.querySelectorAll('.song-status').forEach(updateSongStatusColor);
});

/* ==================================
   CORE LOGIC: SAVE & LOAD (CLOUDFLARE KV)
================================== */

function collectRowData(row) {
    try {
        const cells = row.querySelectorAll('td');
        if (!cells || cells.length === 0) return null;

        const getSongData = (cellIndex) => {
            const cell = cells[cellIndex];
            if (!cell) return { link: "", status: "" };

            return {
                link: cell.querySelector('.song-link')?.value || "",
                status: cell.querySelector('.song-status')?.value || ""
            };
        };

        return {
            coupleName: cells[0]?.innerText?.trim() || "",
            status: cells[1]?.querySelector('.status-select')?.value || "",
            type: cells[2]?.querySelector('.type-select')?.value || "",
            rawFiles: cells[3]?.querySelector('.raw-input')?.value || "",
            drone: cells[4]?.innerText?.trim() || "",
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
    
    if (cells[0]) cells[0].innerText = data.coupleName || "";
    if (cells[1] && cells[1].querySelector('.status-select')) cells[1].querySelector('.status-select').value = data.status || "IN PROGRESS";
    if (cells[2] && cells[2].querySelector('.type-select')) cells[2].querySelector('.type-select').value = data.type || "NOT SET";
    if (cells[3] && cells[3].querySelector('.raw-input')) cells[3].querySelector('.raw-input').value = data.rawFiles || "";
    if (cells[4]) cells[4].innerText = data.drone || "";
    
    const setSongData = (cellIndex, songData) => {
        if (!songData) return;
        const cell = cells[cellIndex];
        if (!cell) return;
        if (cell.querySelector('.song-link')) cell.querySelector('.song-link').value = songData.link || "";
        if (cell.querySelector('.song-status')) cell.querySelector('.song-status').value = songData.status || "";
    };

    setSongData(5, data.song1);
    setSongData(6, data.song2);
    setSongData(7, data.song3);
    setSongData(8, data.teaserSong);
}

// ONLINE LOAD FUNCTION (Cloudflare KV)
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        if (response.ok) {
            const projectsData = await response.json();
            const rows = document.querySelectorAll('.project-table tbody tr');
            if (Array.isArray(projectsData) && projectsData.length > 0) {
                rows.forEach((row, index) => {
                    if (projectsData[index]) {
                        populateRow(row, projectsData[index]);
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error loading projects from Cloudflare KV:', e);
    }

    document.querySelectorAll('.status-select').forEach(updateStatusColor);
    document.querySelectorAll('.song-status').forEach(updateSongStatusColor);
}

// ONLINE SAVE FUNCTION (Cloudflare KV)
let saveTimeout;
function saveProjects() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const rows = document.querySelectorAll('.project-table tbody tr');
        const projectsData = [];

        rows.forEach(row => {
            const rowData = collectRowData(row);
            if (rowData) projectsData.push(rowData);
        });

        try {
            await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectsData)
            });
            console.log("Successfully synced to Cloudflare KV!");
        } catch (e) {
            console.error('Error saving projects to Cloudflare KV:', e);
        }
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