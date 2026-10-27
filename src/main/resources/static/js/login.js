const userType = document.getElementById("userType");
const personSelect = document.getElementById("personName");
const personLabel = document.getElementById("personLabel");
const passwordInput = document.getElementById("password");
const error = document.getElementById("errorMsg");
const form = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");


// =========================================================
// USER TYPE CHANGE
// =========================================================
userType.addEventListener("change", updatePersonList);

// =========================================================
// LOGIN FORM SUBMIT
// =========================================================
form.addEventListener("submit", login);


// =========================================================
// LOAD USERS BASED ON ROLE
// =========================================================
async function updatePersonList() {
    const selectedType = userType.value;
    error.innerText = "";
    personSelect.disabled = true;
    if (!selectedType) {
        personLabel.innerText = "Select Person";
        personSelect.innerHTML = '<option value="">-- Select User Type First --</option>';
        return;
    }

    const role = selectedType === "Manager" ? "MANAGER" : "ADMIN";
    personLabel.innerText = selectedType;
    personSelect.innerHTML = `<option value="">-- Loading ${selectedType} --</option>`;
    try {
        const response = await fetch(`/api/users?role=${encodeURIComponent(role)}`,
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const users = await response.json();
        personSelect.innerHTML = `<option value="">-- Select ${selectedType} --</option>`;

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.fullName;
            personSelect.appendChild(option);
        });
        if (users.length === 0) {
            personSelect.innerHTML =
                `<option value="">
                    -- No active ${selectedType} found --
                </option>`;
            return;
        }
        personSelect.disabled = false;
    } catch (err) {
        console.error(err);
        personSelect.innerHTML = '<option value="">-- Unable to load users --</option>';
        error.innerText = "Could not connect to the server. Make sure Spring Boot is running.";
    }
}

// =========================================================
// LOGIN
// =========================================================
async function login(event) {
    event.preventDefault();
    const selectedType = userType.value;
    const userId = personSelect.value;
    const password = passwordInput.value;
    error.innerText = "";

    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------
    if (!selectedType) {
        error.innerText = "Please select Admin or Manager.";
        return;
    }
    if (!userId) {
        error.innerText = `Please select a ${selectedType}.`;
        return;
    }
    if (password.length < 8) {
        error.innerText = "Password must be exactly 8 characters.";
        return;
    }

    // ---------------------------------------------------------
    // DISABLE LOGIN BUTTON
    // ---------------------------------------------------------
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    try {
        // -----------------------------------------------------
        // LOGIN API
        // -----------------------------------------------------
        const response = await fetch("/api/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: Number(userId),
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

        // -----------------------------------------------------
        // REDIRECT BASED ON ROLE
        // -----------------------------------------------------
        if (user.role === "ADMIN") {
            window.location.href = "/admin.html";
        } else if (user.role === "MANAGER") {
            window.location.href = "/manager.html";
        } else {
            error.innerText = "Unknown user role.";
        }
    } catch (err) {
        console.error(err);
        error.innerText = err.message ?? "Could not connect to the server. Make sure Spring Boot is running.";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
}