/**
 * admin.js
 * Application bootstrap
 */

document.addEventListener("DOMContentLoaded", initializeAdmin);

async function initializeAdmin() {
    try {
        // ==========================
        // DEBUG AUTO LOGIN
        // Remove before production
        // ==========================
        // await fetch("/api/auth/login", {
        //     method: "POST",
        //     credentials: "same-origin",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify({
        //         userId: 2,
        //         password: "mr.mummy"
        //     })
        // });

        // ==========================
        // Authentication
        // ==========================
        const user = await Session.loadCurrentUser();

        if (!user) {
            Session.redirectToLogin();
            return;
        }

        if (!Session.requireRole("ADMIN")) {
            return;
        }

        // ==========================
        // Load Lookup Data
        // ==========================
        await loadLookups();
        await loadPendingCounts();
        // ==========================
        // Initialize Filters
        // ==========================
        initializeFilters();

        // ==========================
        // Initialize UI
        // ==========================
        const configNav = document.getElementById("configurationsNav");

        if (configNav) {
            configNav.style.display = Session.getSuperAdmin() ? "block" : "none";
        }
        document.getElementById("adminName").textContent =
            Session.getUserName();

        document.getElementById("pageLoading").style.display = "none";
        document.getElementById("dashboard").style.display = "flex";
        document.getElementById("adminLibraryName").textContent =
            `${getConfigurations().LIBRARY_NAME}`;
        // ==========================
        // Pagination Buttons
        // ==========================
        setPaginationButtonandAction();

        // ==========================
        // Load First Page
        // ==========================
        await loadStudents(1);

    } catch (error) {
        console.error("Admin initialization failed.", error);
        alert("Unable to load Admin Dashboard.");
        Session.redirectToLogin();
    }

}