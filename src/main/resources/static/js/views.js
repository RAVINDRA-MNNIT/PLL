/**
 * views.js
 * Handles navigation between Manager Dashboard views.
 */

/**
 * Existing HTML already calls:
 *
 * onclick="switchView('fees')"
 *
 * so keep this wrapper.
 */
/**
 * views.js
 */

async function switchView(view) {

    // Hide all views
    document.getElementById("feesView").style.display = "none";
    document.getElementById("addView").style.display = "none";
    document.getElementById("pendingView").style.display = "none";
    document.getElementById("transactionsView").style.display = "none";
    document.getElementById("strengthView")?.style.setProperty("display", "none");
    document.getElementById("configurationsView")?.style.setProperty("display", "none");
    document.getElementById("batchesView")?.style.setProperty("display", "none");
    document.getElementById("verifyStudentView")?.style.setProperty("display", "none");
    document.getElementById("complaintsView")?.style.setProperty("display", "none");

    // Remove active class
    document.querySelectorAll(".nav-item")
        .forEach(item => item.classList.remove("active"));

    switch (view) {
        case "fees":
            document.getElementById("feesView").style.display = "block";
            document.querySelectorAll(".nav-item")[0].classList.add("active");
            break;
        case "add":
            document.getElementById("addView").style.display = "block";
            document.querySelectorAll(".nav-item")[1].classList.add("active");
            if ((getConfigurations().ONLINE_ADMISSION_ENABLED ?? true) === false) {
                if (Session.isManager()) {
                    alert("Admin has disabled the online admission form, Please contact admin.")
                    return
                }
            }
            await AdmissionForm.openNew();
            break;
        case "pending":
            document.getElementById("pendingView").style.display = "block";
            document.querySelectorAll(".nav-item")[2].classList.add("active");
            await loadPendingApprovalSubview();
            break;
        case "transactions":
            document.getElementById("transactionsView").style.display = "block";
            document.querySelectorAll(".nav-item")[3].classList.add("active");
            Transactions.load();
            break;
        case "strength":
            document.getElementById("strengthView").style.display = "block";
            document.querySelectorAll(".nav-item")[4].classList.add("active");
            Strength.load();
            break;
        case "verifyStudent":
            document.getElementById("verifyStudentView").style.display = "block";
            document.querySelectorAll(".nav-item")[5].classList.add("active");
            VerifyStudent.load();
            break;
        case "complaints":
            document.getElementById("complaintsView").style.display = "block";
            document.querySelectorAll(".nav-item")[6].classList.add("active");
            StudentIssues.load();
            break;
        case "batches":
            document.getElementById("batchesView").style.display = "block";
            document.querySelectorAll(".nav-item")[7].classList.add("active");
            BatchManager.load();
            break;
        case "configurations":
            document.getElementById("configurationsView").style.display = "block";
            document.querySelectorAll(".nav-item")[8].classList.add("active");
            Configurations.load();
            break;
        default:
            console.warn("Unknown view:", view);
            document.getElementById("feesView").style.display = "block";
            document.querySelectorAll(".nav-item")[9].classList.add("active");
    }
}

let pendingApprovalLoaded = false;

async function loadPendingApprovalSubview() {
    const container = document.getElementById("pendingApprovalContainer");
    if (!container) return;
    // Don't reload if already loaded
    if (pendingApprovalLoaded) return;

    container.innerHTML = `
        <section class="card">
            <p style="color:var(--muted)">
                Loading Pending Approvals...
            </p>
        </section>
    `;

    try {
        const response = await fetch("/pending-approvals.html",
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (response.status === 401) {
            redirectToLogin();
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Unable to load Pending Approvals (HTTP ${response.status}).`
            );
        }

        const html = await response.text();
        const template = document.createElement("template");
        template.innerHTML = html;
        // pending-approvals.js is already loaded
        template.content.querySelectorAll("script").forEach(script => script.remove());
        container.replaceChildren(
            template.content.cloneNode(true)
        );
        pendingApprovalLoaded = true;
        // Initialize page if required
        if (
            window.PendingApprovals &&
            typeof PendingApprovals.init === "function"
        ) {
            await PendingApprovals.init();
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <section class="card">
                <h2>Pending Approvals</h2>
                <p style="color:red">
                    ${escapeHtml(error.message)}
                </p>
            </section>
        `;
    }
}