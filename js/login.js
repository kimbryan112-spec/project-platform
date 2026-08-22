// ===============================
// PROJECT PLATFORM
// LOCAL LOGIN
// ===============================

// Default Users (Local Mode)

const users = [

    {
        email: "adminyang@kbhfilms.com",
        password: "Yangyang#12",
        role: "admin",
        displayRole: "Admin",
        name: "Kim Bryan Hernandez"
    },

    {
        email: "yongzhi@kbhfilms.com",
        password: "yong2023",
        role: "dashboard",
        displayRole: "Manager",
        name: "Yong Zhi"
    },

];

// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");
const errorText = document.getElementById("loginError");

loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("password")
        .value;

    const user = users.find(u =>
        u.email === email &&
        u.password === password
    );

    if (!user) {

        errorText.textContent =
            "Invalid email or password.";

        return;

    }

    // Save Current User

    localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
    );

    // Redirect

    if (user.role === "admin") {

        window.location.href =
            "pages/admin.html";

    } else {

        window.location.href =
            "pages/dashboard.html";

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