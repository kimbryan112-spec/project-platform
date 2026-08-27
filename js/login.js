// ===============================
// LOGIN
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

    errorText.textContent = "";

    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if (!data.success) {

            errorText.textContent = data.message;
            return;

        }

        localStorage.setItem(
            "currentUser",
            JSON.stringify(data.user)
        );

        if (data.user.role === "admin") {

            window.location.href = "pages/admin.html";

        } else {

            window.location.href = "pages/dashboard.html";

        }

    } catch (err) {

        console.error(err);

        errorText.textContent =
            "Unable to connect to server.";

    }

});

// ===============================
// CREATE ACCOUNT
// ===============================

document
    .getElementById("createAccountLink")
    .addEventListener("click", function () {

        alert(
            "Create Account is not available in Local Mode yet."
        );

    });