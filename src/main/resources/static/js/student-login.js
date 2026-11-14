const form = document.getElementById("studentLoginForm");
const studentIdInput = document.getElementById("studentId");
const passwordInput = document.getElementById("password");
const error = document.getElementById("errorMsg");
const loginButton = document.getElementById("loginButton");

// Allow only numeric Student ID
studentIdInput.addEventListener("input", () => {
    studentIdInput.value = studentIdInput.value.replace(/\D/g, "");
});

form.addEventListener("submit", login);

async function login(event) {
    event.preventDefault();
    error.innerText = "";
    const studentId = studentIdInput.value.trim();
    const password = passwordInput.value.trim();

    // ==========================
    // Validation
    // ==========================
    if (!studentId) {
        error.innerText = "Please enter Student ID.";
        studentIdInput.focus();
        return;
    }
    if (!/^\d+$/.test(studentId)) {
        error.innerText = "Student ID must contain only numbers.";
        studentIdInput.focus();
        return;
    }
    if (!password) {
        error.innerText = "Please enter Password.";
        passwordInput.focus();
        return;
    }

    // ==========================
    // Login
    // ==========================
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        const response = await fetch(Endpoints.auth.studentLogin, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: Number(studentId),
                password: password
            })
        });


        // -----------------------------------------------------
        // INVALID LOGIN
        // -----------------------------------------------------
        if (response.status === 401) {
            const data = await response.json();
            error.innerText = data.message || "Invalid login.";
            return;
        }

        // -----------------------------------------------------
        // OTHER SERVER ERROR
        // -----------------------------------------------------
        if (!response.ok) {
            error.innerText = "Login failed. Please try again.";
            return;
        }

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------
        const data = await response.json();
        const token = data.token;
        const user = data.user;

        // -----------------------------------------------------
        // STORE JWT
        // -----------------------------------------------------
        if (token) {
            localStorage.setItem("jwtToken", token);
        }

        // -----------------------------------------------------
        // STORE USER
        // -----------------------------------------------------
        if (user) {
            localStorage.setItem("currentUser", JSON.stringify(user));
        }
        await loadConfiguration();
        window.location.href = `/student-details.html?id=${studentId}`;
    } catch (e) {
        console.error(e);
        error.innerText = e.message || "Login failed.";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
}