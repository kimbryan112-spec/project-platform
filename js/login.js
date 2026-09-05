// ===============================
// PROJECT PLATFORM
// SERVER LOGIN (Offline & API Supported)
// ===============================

const loginForm = document.getElementById("loginForm");
const errorText = document.getElementById("loginError");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (errorText) {
            errorText.textContent = "";
        }

        // 1. OFFLINE / LOCAL TESTING FALLBACK (Mula sa iyong orihinal na code)
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
                    role: "Manager"
                };
                localStorage.setItem("currentUser", JSON.stringify(offlineUser));
                window.location.href = "pages/dashboard.html"; 
                return;
            }
        }

        // 2. ONLINE CLOUDFLARE / PRODUCTION API REQUEST WITH OFFLINE HYBRID FALLBACK
        try {
            // Subukan muna ang Cloudflare API kapag online
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Kung nag-fail ang API pero baka sakaling offline credentials ang gamit, subukan natin ang Hybrid Auth
                if (window.KBHybridAuth) {
                    const offlineLoginResult = await window.KBHybridAuth.verifyOfflineLogin(email, password);
                    if (offlineLoginResult.success) {
                        handleSuccessfulLogin(offlineLoginResult.user);
                        return;
                    }
                }

                if (errorText) {
                    errorText.textContent = data.message || "Invalid email or password.";
                }
                return;
            }

            const loggedInUser = data.user || {};
            handleSuccessfulLogin(loggedInUser);

        } catch (err) {
            console.warn("API login failed (Likely offline). Attempting Hybrid/Offline Authentication...", err);

            // 3. OFFLINE FALLBACK: Kapag walang internet o nag-timeout ang fetch, gamitin ang Hybrid Auth module
            if (window.KBHybridAuth) {
                try {
                    const offlineLoginResult = await window.KBHybridAuth.verifyOfflineLogin(email, password);
                    if (offlineLoginResult.success) {
                        handleSuccessfulLogin(offlineLoginResult.user);
                        return;
                    }
                } catch (offlineErr) {
                    console.error("Offline login error:", offlineErr);
                }
            }

            if (errorText) {
                errorText.textContent = "You are offline and no local credentials matched. Please check your connection.";
            }
        }
    });
}

// Helper function para sa redirect pagkatapos mag-login
function handleSuccessfulLogin(loggedInUser) {
    if (!loggedInUser.name && loggedInUser.fullname) {
        loggedInUser.name = loggedInUser.fullname;
    } else if (!loggedInUser.name && loggedInUser.email === "yongzhi@kbhfilms.com") {
        loggedInUser.name = "Yong Zhi Ng";
    }

    if (loggedInUser.role === "manager") {
        loggedInUser.role = "Manager";
    }

    localStorage.setItem(
        "currentUser",
        JSON.stringify(loggedInUser)
    );

    const userRole = (loggedInUser.role || "").toLowerCase();
    if (userRole === "admin") {
        window.location.href = "pages/admin.html";
    } else {
        window.location.href = "pages/dashboard.html";
    }
}

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