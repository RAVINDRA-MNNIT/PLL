// /**
//  * manager.js
//  * Application bootstrap
//  */
//
// document.addEventListener("DOMContentLoaded", initializeManager);
//
// async function initializeManager() {
//     try {
//         // ==========================
//         // DEBUG AUTO LOGIN
//         // Remove before production
//         // ==========================
//         await fetch("/api/auth/login", {
//             method: "POST",
//             credentials: "same-origin",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 userId: 1,
//                 password: "abhi1234"
//             })
//         });
//
//         // ==========================
//         // Authentication
//         // ==========================
//         const user = await Session.loadCurrentUser();
//
//         if (!user) {
//             Session.redirectToLogin();
//             return;
//         }
//
//         if (!Session.requireRole("MANAGER")) {
//             return;
//         }
//
//         // ==========================
//         // Initialize UI
//         // ==========================
//
//
//         // ==========================
//         // Load Lookup Data
//         // ==========================
//         await loadLookups();
//
//         // ==========================
//         // Initialize Filters
//         // ==========================
//         initializeFilters();
//
//         // ==========================
//         // Load Students
//         // ==========================
//       // await loadStudents();
//         document.getElementById("managerName").textContent =
//             Session.getUserName();
//         document.getElementById("pageLoading").style.display = "none";
//         document.getElementById("dashboard").style.display = "flex";
//         document.getElementById("firstPageBtn").onclick = () => loadStudents(1);
//         document.getElementById("prevPageBtn").onclick = async () => {
//             if (currentPage > 1) {
//                 await loadStudents(currentPage - 1);
//             }
//         };
//         document.getElementById("nextPageBtn").onclick = async () => {
//             if (currentPage < totalPages) {
//                 await loadStudents(currentPage + 1);
//             }
//         };
//         document.getElementById("lastPageBtn").onclick = () => loadStudents(totalPages);
//     } catch (error) {
//         console.error("Manager initialization failed.", error);
//         alert("Unable to load Manager Dashboard.");
//         Session.redirectToLogin();
//     }
//
// }
//
//


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
        // await fetch("/api/auth/login", {
        //     method: "POST",
        //     credentials: "same-origin",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify({
        //         userId: 1,
        //         password: "abhi1234"
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
        setPaginationButtonandAction();

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