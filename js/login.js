// ===============================
// PROJECT PLATFORM
// SERVER LOGIN (Offline & API Supported)
// ===============================

const loginForm = document.getElementById("loginForm");
const errorText = document.getElementById("loginError");

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("password")
        .value;

    if (errorText) {
        errorText.textContent = "";
    }

    // OFFLINE / LOCAL TESTING FALLBACK
    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
        if (email === "adminyang@kbhfilms.com" && password === "Yangyang#12") {
            const offlineUser = {
                id: 1,
                name: "Kim Bryan Hernandez",
                fullname: "Kim Bryan Hernandez",
                email: email,
                role: "admin"
            };
            localStorage.setItem("currentUser", JSON.stringify(offlineUser));
            window.location.href = "pages/admin.html";
            return;
        } else if (email === "yongzhi@kbhfilms.com" && password === "yong2023") {
            const offlineUser = {
                id: 2,
                name: "Yong Zhi Ng",
                fullname: "Yong Zhi Ng",
                email: email,
                role: "Manager" // <--- Ginawa nang kapital ang M
            };
            localStorage.setItem("currentUser", JSON.stringify(offlineUser));
            window.location.href = "pages/dashboard.html"; 
            return;
        } else {
            if (errorText) {
                errorText.textContent = "Invalid email or password.";
            }
            return;
        }
    }

    // ONLINE CLOUDFLARE / PRODUCTION API REQUEST
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            if (errorText) {
                errorText.textContent = data.message || "Invalid email or password.";
            }
            return;
        }

        const loggedInUser = data.user;
        if (!loggedInUser.name && loggedInUser.fullname) {
            loggedInUser.name = loggedInUser.fullname;
        } else if (!loggedInUser.name && loggedInUser.email === "yongzhi@kbhfilms.com") {
            loggedInUser.name = "Yong Zhi Ng";
        }

        // Kung sakaling lowercase ang galing sa server, ginagawa nating Capitalized
        if (loggedInUser.role === "manager") {
            loggedInUser.role = "Manager";
        }

        localStorage.setItem(
            "currentUser",
            JSON.stringify(loggedInUser)
        );

        if (loggedInUser.role === "admin" || loggedInUser.role === "Admin") {
            window.location.href = "pages/admin.html";
        } else {
            window.location.href = "pages/dashboard.html";
        }

    } catch (err) {
        console.error("Login error:", err);
        if (errorText) {
            errorText.textContent = "A connection error occurred. Please try again.";
        }
    }
});

// ===============================
// CREATE ACCOUNT
// ===============================

const createAccountLink = document.getElementById("createAccountLink");
if (createAccountLink) {
    createAccountLink.addEventListener("click", function () {
        alert(
            "Account creation is available for KBHFILMS team members only."
        );
    });
}