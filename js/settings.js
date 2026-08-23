/* ==================================
   SETTINGS.JS
   PART 1
   INITIALIZATION
================================== */

// =========================
// STORAGE MODE
// true = localStorage
// false = Cloudflare API
// =========================

const LOCAL_MODE =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

console.log("================================");
console.log("SETTINGS PAGE");
console.log("Host:", location.hostname);
console.log("LOCAL_MODE:", LOCAL_MODE);
console.log("================================");

// ==================================
// GLOBAL VARIABLES
// ==================================

let currentYear = new Date().getFullYear().toString();

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

// ==================================
// LIVE CALENDAR
// ==================================

function updateLiveCalendar() {

    const now = new Date();

    const month = now.toLocaleString("en-US", {
        month: "short"
    }).toUpperCase();

    const day = now.getDate();

    const monthEl = document.getElementById("calendarMonth");
    const dayEl = document.getElementById("calendarDay");

    if (monthEl) monthEl.textContent = month;
    if (dayEl) dayEl.textContent = day;

}

// ==================================
// YEAR DROPDOWN
// ==================================

function initializeYearDropdown() {

    const yearSelect = document.getElementById("yearSelect");

    if (!yearSelect) return;

    yearSelect.innerHTML = "";

    const current = new Date().getFullYear();

    for (let year = 2023; year <= current + 5; year++) {

        const option = document.createElement("option");

        option.value = year;
        option.textContent = year;

        if (year === current) {
            option.selected = true;
        }

        yearSelect.appendChild(option);

    }

    currentYear = String(current);

    yearSelect.addEventListener("change", () => {

        currentYear = yearSelect.value;

        const yearDisplay =
            document.getElementById("dbCurrentYear");

        if (yearDisplay) {
            yearDisplay.textContent = currentYear;
        }

        loadDatabaseStatus();

    });

}

// ==================================
// NEXT YEAR BUTTON
// ==================================

function initializeNextYearButton() {

    const nextYearBtn =
        document.querySelector(".next-year-btn");

    const yearSelect =
        document.getElementById("yearSelect");

    if (!nextYearBtn || !yearSelect) return;

    nextYearBtn.addEventListener("click", () => {

        const nextYear =
            String(Number(currentYear) + 1);

        const exists = [...yearSelect.options]
            .some(option => option.value === nextYear);

        if (!exists) {

            const option =
                document.createElement("option");

            option.value = nextYear;
            option.textContent = nextYear;

            yearSelect.appendChild(option);

        }

        currentYear = nextYear;

        yearSelect.value = currentYear;

        const yearDisplay =
            document.getElementById("dbCurrentYear");

        if (yearDisplay) {
            yearDisplay.textContent = currentYear;
        }

        loadDatabaseStatus();

    });

}

// ==================================
// CURRENT MONTH LABEL
// ==================================

function updateCurrentMonthLabel() {

    const label =
        document.getElementById("dbCurrentMonth");

    if (!label) return;

    label.textContent =
        monthNames[new Date().getMonth()];

}

// ==================================
// LOGOUT
// ==================================

function initializeLogout() {

    const logoutBtn =
        document.getElementById("logoutBtn");

    const logoutConfirm =
        document.getElementById("logoutConfirm");

    const confirmLogout =
        document.getElementById("confirmLogout");

    const cancelLogout =
        document.getElementById("cancelLogout");

    if (logoutBtn) {

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

    document.addEventListener("click", (e) => {

        if (
            logoutConfirm &&
            !logoutConfirm.contains(e.target) &&
            !logoutBtn.contains(e.target)
        ) {

            logoutConfirm.classList.remove("show");

        }

    });

}

// ==================================
// PAGE INITIALIZATION
// ==================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("[INIT] Settings page loaded.");

    updateLiveCalendar();

    setInterval(updateLiveCalendar, 60000);

    initializeYearDropdown();

    initializeNextYearButton();

    updateCurrentMonthLabel();

    initializeLogout();

    loadDatabaseStatus();

});

/* ==================================
   SETTINGS.JS
   PART 2
   DATABASE STATUS
================================== */

// ==================================
// ELEMENTS
// ==================================

const dbStatus =
    document.getElementById("dbStatus");

const dbTotalRecords =
    document.getElementById("dbTotalRecords");

const dbCurrentYear =
    document.getElementById("dbCurrentYear");

const dbCurrentMonth =
    document.getElementById("dbCurrentMonth");

const dbSize =
    document.getElementById("dbSize");

const dbLastBackup =
    document.getElementById("dbLastBackup");

// ==================================
// LOCAL STORAGE RECORD COUNT
// ==================================

function countLocalRecords() {

    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (!key.startsWith("projects_")) continue;

        try {

            const data = JSON.parse(
                localStorage.getItem(key)
            );

            if (Array.isArray(data)) {
                total += data.length;
            }

        } catch {

            console.warn(
                "[STATUS] Invalid localStorage:",
                key
            );

        }

    }

    return total;

}

// ==================================
// LOCAL STORAGE SIZE
// ==================================

function getLocalStorageSize() {

    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        const value =
            localStorage.getItem(key) || "";

        total += key.length + value.length;

    }

    return (total / 1024).toFixed(2) + " KB";

}

// ==================================
// LOAD DATABASE STATUS
// ==================================

async function loadDatabaseStatus() {

    console.log("[STATUS] Loading...");

    dbCurrentYear.textContent = currentYear;

    dbCurrentMonth.textContent =
        monthNames[new Date().getMonth()];

    // ==================================
    // LOCAL MODE
    // ==================================

    if (LOCAL_MODE) {

        dbStatus.textContent =
            "🟡 Local Storage";

        dbStatus.className = "";

        dbTotalRecords.textContent =
            countLocalRecords();

        dbSize.textContent =
            getLocalStorageSize();

        dbLastBackup.textContent =
            localStorage.getItem(
                "lastBackup"
            ) || "Never";

        console.log(
            "[STATUS] Loaded from Local Storage."
        );

        return;

    }

    // ==================================
    // CLOUD MODE
    // ==================================

    try {

        dbStatus.textContent =
            "🟢 Connected";

        dbStatus.className =
            "status-online";

        const response = await fetch(
            "/api/projects?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok)
            throw new Error(response.status);

        const projects =
            await response.json();

        dbTotalRecords.textContent =
            Array.isArray(projects)
                ? projects.length
                : 0;

        dbSize.textContent =
            "--";

        dbLastBackup.textContent =
            localStorage.getItem(
                "lastBackup"
            ) || "Never";

        console.log(
            "[STATUS] Cloudflare Connected."
        );

    }

    catch (error) {

        console.error(error);

        dbStatus.textContent =
            "🔴 Offline";

        dbStatus.className =
            "status-offline";

        dbTotalRecords.textContent = "--";

        dbSize.textContent = "--";

    }

}

// ==================================
// AUTO REFRESH
// ==================================

setInterval(() => {

    loadDatabaseStatus();

}, 30000);

/* ==========================================
   PART 3
   RESET MONTH
========================================== */

async function resetMonth() {

    const month = Number(document.getElementById("resetMonth").value);
    const year = Number(document.getElementById("resetMonthYear").value);

    if (!month || !year) {

        alert("Please select both month and year.");

        return;

    }

    const confirmReset = confirm(
        `Delete ALL projects for ${month}/${year}?`
    );

    if (!confirmReset) return;

    try {

        // ==================================
        // LOCAL STORAGE
        // ==================================

        if (LOCAL_MODE) {

            const key =
                `projects_${year}_${String(month).padStart(2, "0")}`;

            localStorage.removeItem(key);

            alert("Month reset completed.");

            loadDatabaseStatus();

            return;

        }

        // ==================================
        // CLOUDFLARE API
        // ==================================

        const response = await fetch("/api/reset-month", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                month,
                year

            })

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message || "Unable to reset selected month."
            );

        }

        alert(result.message || "Month reset completed successfully.");

        loadDatabaseStatus();

    }

    catch (error) {

        console.error("Reset Month Error:", error);

        alert(error.message || "Unable to reset month.");

    }

}

document.getElementById("resetMonthBtn")
    ?.addEventListener("click", resetMonth);

/* ==========================================
   PART 4
   RESET YEAR
========================================== */

async function resetYear() {

    const year = Number(
        document.getElementById("resetYear").value
    );

    if (!year) {

        alert("Please select a year.");

        return;

    }

    const confirmReset = confirm(
        `Delete ALL projects for year ${year}?`
    );

    if (!confirmReset) return;

    try {

        // ==================================
        // LOCAL STORAGE
        // ==================================

        if (LOCAL_MODE) {

            for (let i = localStorage.length - 1; i >= 0; i--) {

                const key = localStorage.key(i);

                if (
                    key &&
                    key.startsWith(`projects_${year}_`)
                ) {

                    localStorage.removeItem(key);

                }

            }

            alert("Year reset completed successfully.");

            loadDatabaseStatus();

            return;

        }

        // ==================================
        // CLOUDFLARE API
        // ==================================

        const response = await fetch("/api/reset-year", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                year

            })

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to reset selected year."
            );

        }

        alert(result.message || "Year reset completed successfully.");

        loadDatabaseStatus();

    }

    catch (error) {

        console.error("Reset Year Error:", error);

        alert(error.message || "Unable to reset year.");

    }

}

document.getElementById("resetYearBtn")
    ?.addEventListener("click", resetYear);

/* ==========================================
   PART 5
   BACKUP DATABASE
========================================== */

async function backupDatabase() {

    try {

        let blob;

        // ==================================
        // LOCAL STORAGE
        // ==================================

        if (LOCAL_MODE) {

            const backupData = {};

            for (let i = 0; i < localStorage.length; i++) {

                const key = localStorage.key(i);

                backupData[key] =
                    localStorage.getItem(key);

            }

            blob = new Blob(
                [JSON.stringify(backupData, null, 2)],
                {
                    type: "application/json"
                }
            );

        }

        // ==================================
        // CLOUDFLARE API
        // ==================================

        else {

            const response = await fetch("/api/backup");

            if (!response.ok) {

                throw new Error("Backup failed.");

            }

            blob = await response.blob();

        }

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const today = new Date();

        link.href = url;

        link.download =
            `backup-${today.getFullYear()}-${
                String(today.getMonth() + 1).padStart(2, "0")
            }-${
                String(today.getDate()).padStart(2, "0")
            }.json`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        localStorage.setItem(
            "lastBackup",
            today.toLocaleString()
        );

        document.getElementById("dbLastBackup").textContent =
            today.toLocaleString();

        alert("Backup downloaded successfully.");

        loadDatabaseStatus();

    }

    catch (error) {

        console.error("Backup Error:", error);

        alert(error.message || "Unable to create backup.");

    }

}

document.getElementById("backupBtn")
    ?.addEventListener("click", backupDatabase);

/* ==========================================
   PART 6
   RESTORE DATABASE
========================================== */

async function restoreDatabase() {

    const fileInput =
        document.getElementById("restoreFile");

    if (!fileInput.files.length) {

        alert("Please select a backup file.");

        return;

    }

    const confirmRestore = confirm(
        "Restore database from this backup?\n\nThis will overwrite existing data."
    );

    if (!confirmRestore) return;

    try {

        const file = fileInput.files[0];

        const text = await file.text();

        const backupData = JSON.parse(text);
        if (!Array.isArray(backupData.projects)) {

    throw new Error("Invalid backup file.");

}

        // ==================================
        // LOCAL STORAGE
        // ==================================

        if (LOCAL_MODE) {

            alert(
    "Restore from backup is only supported in Cloud Mode."
);

return;

            alert("Database restored successfully.");

            fileInput.value = "";

            loadDatabaseStatus();

            return;

        }

        // ==================================
        // CLOUDFLARE API
        // ==================================

        const response = await fetch("/api/restore", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(backupData.projects)

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to restore database."
            );

        }

        alert(result.message || "Database restored successfully.");

        fileInput.value = "";

        loadDatabaseStatus();

    }

    catch (error) {

        console.error("Restore Error:", error);

        alert(error.message || "Unable to restore database.");

    }

}

document.getElementById("restoreBtn")
    ?.addEventListener("click", restoreDatabase);

/* ==========================================
   PART 7
   DELETE EVERYTHING
========================================== */

async function deleteEverything() {

    const confirmation = document
        .getElementById("confirmDelete")
        .value
        .trim();

    if (confirmation !== "RESET") {

        alert('Please type "RESET" to continue.');

        return;

    }

    const confirmDelete = confirm(
        "WARNING!\n\nThis will permanently delete ALL projects from the database.\n\nThis action cannot be undone."
    );

    if (!confirmDelete) return;

    try {

        // ==================================
        // LOCAL STORAGE
        // ==================================

        if (LOCAL_MODE) {

            for (let i = localStorage.length - 1; i >= 0; i--) {

                const key = localStorage.key(i);

                if (
                    key &&
                    (
                        key.startsWith("projects_") ||
                        key === "lastBackup"
                    )
                ) {

                    localStorage.removeItem(key);

                }

            }

            document.getElementById("confirmDelete").value = "";

            alert("Database cleared successfully.");

            loadDatabaseStatus();

            return;

        }

        // ==================================
        // CLOUDFLARE API
        // ==================================

        const response = await fetch("/api/delete-all", {

            method: "DELETE"

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message || "Unable to delete database."
            );

        }

        alert(result.message || "Database cleared successfully.");

        document.getElementById("confirmDelete").value = "";

        loadDatabaseStatus();

    }

    catch (error) {

        console.error("Delete Database Error:", error);

        alert(error.message || "Unable to delete database.");

    }

}

document
    .getElementById("deleteAllBtn")
    ?.addEventListener("click", deleteEverything);