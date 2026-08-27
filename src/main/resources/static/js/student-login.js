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

        const student = await Api.post(
            Endpoints.auth.studentlogin,
            {
                userId: Number(studentId),
                password: password
            }
        );

        window.location.href = `/student-details.html?id=${studentId}`;

    } catch (e) {

        console.error(e);

        error.innerText = e.message || "Login failed.";

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Login";

    }

}