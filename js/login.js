// ===============================
// PROJECT PLATFORM
// SERVER LOGIN (Connected to D1 via API)
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

    // Linisin muna ang lumang error message kung meron man
    if (errorText) {
        errorText.textContent = "";
    }

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

        // Save Current User to localStorage (Tugma sa dashboard.html at script.js checks mo)
        localStorage.setItem(
            "currentUser",
            JSON.stringify(data.user)
        );

        // Redirect base sa role ng user galing sa Database
        if (data.user.role === "admin") {
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