/**
 * manager.js
 * Application bootstrap
 */

document.addEventListener("DOMContentLoaded", initializeManager);

async function initializeManager() {

    try {
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
        document.getElementById("managerName").textContent =
            Session.getUserName();
        document.getElementById("pageLoading").style.display = "none";
        document.getElementById("dashboard").style.display = "flex";
        document.getElementById("managerLibraryName").textContent =
            `${getConfigurations().LIBRARY_NAME}`;
        // ==========================
        // Pagination Buttons
        // ==========================
        setPaginationButtonAndAction();

        // ==========================
        // Load First Page
        // ==========================
        await loadStudents(1);

    } catch (error) {

        console.error("Manager initialization failed.", error);

        alert("Unable to load Manager Dashboard.");

        Session.redirectToLogin();

    }

}