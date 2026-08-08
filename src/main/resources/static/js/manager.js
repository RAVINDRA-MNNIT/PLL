/**
 * manager.js
 * Application bootstrap
 */

document.addEventListener("DOMContentLoaded", initializeManager);

async function initializeManager() {
    try {
        // ==========================
        // DEBUG AUTO LOGIN
        // Remove before production
        // ==========================
        await fetch("/api/auth/login", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: 1,
                password: "abhi1234"
            })
        });

        // ==========================
        // Authentication
        // ==========================
        const user = await Session.loadCurrentUser();

        if (!user) {
            Session.redirectToLogin();
            return;
        }

        if (!Session.requireRole("MANAGER")) {
            return;
        }

        // ==========================
        // Initialize UI
        // ==========================
        document.getElementById("managerName").textContent =
            Session.getUserName();
        document.getElementById("pageLoading").style.display = "none";
        document.getElementById("dashboard").style.display = "flex";

        // ==========================
        // Load Lookup Data
        // ==========================
        await loadLookups();

        // ==========================
        // Initialize Filters
        // ==========================
        initializeFilters();

        // ==========================
        // Load Students
        // ==========================
        await loadStudents();

    } catch (error) {
        console.error("Manager initialization failed.", error);
        alert("Unable to load Manager Dashboard.");
        Session.redirectToLogin();
    }

}