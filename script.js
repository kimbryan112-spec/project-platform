const STORAGE_KEY = 'kbhfilms_projects_data';

document.addEventListener('DOMContentLoaded', () => {
    // 1. I-load ang data pagkabukas ng page
    loadProjects();

    const tableBody = document.querySelector('.project-table tbody');

    // 2. Auto-save kapag may nag-type o nag-edit (inputs & contenteditable)
    tableBody.addEventListener('input', () => {
        saveProjects();
    });

    // 3. Auto-save kapag may pinili sa dropdowns
    tableBody.addEventListener('change', (e) => {
        saveProjects();
        
        // I-update ang UI colors nang hindi binabago ang layout
        if (e.target.classList.contains('status-select')) {
            updateStatusColor(e.target);
        }
        if (e.target.classList.contains('song-status')) {
            updateSongStatusColor(e.target);
        }
    });

    // I-set ang initial colors sa pag-load
    document.querySelectorAll('.status-select').forEach(updateStatusColor);
    document.querySelectorAll('.song-status').forEach(updateSongStatusColor);
});

/* ==================================
   CORE LOGIC: SAVE & LOAD
================================== */

function collectRowData(row) {
    const cells = row.querySelectorAll('td');
    
    // Helper para sa song objects (link at status)
    const getSongData = (cellIndex) => {
        const cell = cells[cellIndex];
        return {
            link: cell.querySelector('.song-link')?.value || "",
            status: cell.querySelector('.song-status')?.value || ""
        };
    };

    return {
        coupleName: cells[0].innerText.trim(),
        status: cells[1].querySelector('.status-select')?.value || "",
        type: cells[2].querySelector('.type-select')?.value || "",
        rawFiles: cells[3].querySelector('.raw-input')?.value || "",
        drone: cells[4].innerText.trim(),
        song1: getSongData(5),
        song2: getSongData(6),
        song3: getSongData(7),
        teaserSong: getSongData(8)
    };
}

function populateRow(row, data) {
    const cells = row.querySelectorAll('td');
    
    // Ilagay ang text/values pabalik sa HTML
    cells[0].innerText = data.coupleName || "";
    if (cells[1].querySelector('.status-select')) cells[1].querySelector('.status-select').value = data.status || "IN PROGRESS";
    if (cells[2].querySelector('.type-select')) cells[2].querySelector('.type-select').value = data.type || "NOT SET";
    if (cells[3].querySelector('.raw-input')) cells[3].querySelector('.raw-input').value = data.rawFiles || "";
    cells[4].innerText = data.drone || "";
    
    // Helper para ibalik ang data ng kanta
    const setSongData = (cellIndex, songData) => {
        if (!songData) return;
        const cell = cells[cellIndex];
        if (cell.querySelector('.song-link')) cell.querySelector('.song-link').value = songData.link || "";
        if (cell.querySelector('.song-status')) cell.querySelector('.song-status').value = songData.status || "";
    };

    setSongData(5, data.song1);
    setSongData(6, data.song2);
    setSongData(7, data.song3);
    setSongData(8, data.teaserSong);
}

function saveProjects() {
    const rows = document.querySelectorAll('.project-table tbody tr');
    const projectsData = [];

    rows.forEach(row => {
        projectsData.push(collectRowData(row));
    });

    // I-save ang array of objects sa Browser Local Storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsData));
}

function loadProjects() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const rows = document.querySelectorAll('.project-table tbody tr');

    if (savedData) {
        try {
            const projectsData = JSON.parse(savedData);
            rows.forEach((row, index) => {
                // Populate lamang kung may saved data sa index na ito
                if (projectsData[index]) {
                    populateRow(row, projectsData[index]);
                }
            });
        } catch (e) {
            console.error('Error parsing saved projects data:', e);
        }
    } else {
        // Kapag first time load at walang laman ang storage, i-save ang default HTML state
        saveProjects();
    }
}

/* ==================================
   UI HELPERS (Walang binagong design)
================================== */

function updateStatusColor(select) {
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