const BulkIdCards = {
    // =========================================================
    // STATE
    // =========================================================
    selectedStudentIds: [],
    savedStudentIds: [],
    studentsCache: [],
    recentActivitiesCache: [],
    selectedRecentActivityIds: [],
    initialized: false,

    // =========================================================
    // LOAD THE ID CARDS VIEW
    // =========================================================
    async load() {
        const container = document.getElementById("idCardsContainer");
        if (!container) {
            console.error("idCardsContainer not found.");
            return;
        }

        container.innerHTML = `
            <section class="card">
                <p style="color:var(--muted)">Loading ID Cards...</p>
            </section>
        `;

        try {
            const html = await fetchHtml("/bulk-id-cards.html");
            if (!html) {
                container.innerHTML = `
                    <section class="card">
                        <p style="color:red">Unable to load ID Cards.</p>
                    </section>
                `;
                return;
            }

            const template = document.createElement("template");
            template.innerHTML = html;
            template.content.querySelectorAll("script").forEach(script => script.remove());
            container.replaceChildren(template.content.cloneNode(true));
            this.initialized = false;
            this.initialize();
            this.updateModeActions(this.getPrintMode());
        } catch (error) {
            console.error("Unable to load ID Cards view.", error);
            container.innerHTML = `
                <section class="card">
                    <p style="color:red">Failed to load ID Cards.</p>
                </section>
            `;
        }
    },

    // =========================================================
    // INITIALIZE PAGE EVENTS
    // =========================================================
    initialize() {
        const generateButton = document.getElementById("generateCardsButton");
        const clearButton = document.getElementById("clearCardsButton");
        const printButton = document.getElementById("printIdCardsButton");
        const clearAllButton = document.getElementById("clearAllLaterButton");
        const printSavedButton = document.getElementById("printSavedCardsButton");
        const selectAllLaterButton = document.getElementById("selectAllLaterButton");
        const clearSelectionLaterButton = document.getElementById("clearSelectionLaterButton");
        const deleteActivitiesButton = document.getElementById("deleteSelectedActivitiesButton");
        const refreshActivitiesButton = document.getElementById("refreshRecentActivitiesButton");
        const generateSelectedButton = document.getElementById("generateSelectedIdCardsButton");
        const checkStatusButton = document.getElementById("checkStudentStatusButton");
        const printBackButton = document.getElementById("printBackIdCardsButton");

        const statusFilter = document.getElementById("recentActivityStatusFilter");
        const printLaterFilter = document.getElementById("recentActivityPrintLaterFilter");
        const bulkStatusSelect = document.getElementById("bulkActivityStatusSelect");
        const updateStatusButton = document.getElementById("updateSelectedActivityStatusButton");
        if (statusFilter) {
            statusFilter.onchange = () => {
                this.selectedRecentActivityIds = [];
                this.renderFilteredRecentActivities();
            };
        }

        if (printLaterFilter) {
            printLaterFilter.onchange = () => {
                this.selectedRecentActivityIds = [];
                this.renderFilteredRecentActivities();
            };
        }

        if (bulkStatusSelect) {
            bulkStatusSelect.addEventListener("change", () => {
                this.updateRecentActivitySelection();
            });
        }

        if (updateStatusButton) {
            updateStatusButton.onclick = () => this.updateSelectedActivitiesStatus();
        }

        if (printBackButton) {
            printBackButton.onclick = () => this.printBackCards();
        }

        if (checkStatusButton) {
            checkStatusButton.onclick = () => this.checkStudentIdStatus();
        }

        if (generateSelectedButton) {
            generateSelectedButton.onclick = () => this.generateSelectedIdCards();
        }

        if (deleteActivitiesButton) {
            deleteActivitiesButton.onclick = () => this.deleteSelectedActivities();
        }

        if (refreshActivitiesButton) {
            refreshActivitiesButton.onclick = () => {
                // Reset Recent Activity selection
                this.selectedRecentActivityIds = [];

                // Uncheck all visible checkboxes
                document.querySelectorAll(
                    "#recentActivitiesList .recent-activity-checkbox, #selectAllRecentActivities"
                ).forEach(checkbox => {
                    checkbox.checked = false;
                    checkbox.indeterminate = false;
                });

                // Clear previously generated student cards
                this.selectedStudentIds = [];
                this.studentsCache = [];

                const printArea = document.getElementById("idCardsPrintArea");

                if (printArea) {
                    printArea.innerHTML = "";
                    printArea.style.display = "none";
                }

                // Hide Print and other card actions
                this.updateModeActions("RECENT");

                // Reset selection count and button states
                this.updateRecentActivitySelection();

                // Reload activities
                this.loadRecentActivities();
            };
        }

        if (generateButton) {
            generateButton.onclick = () => this.generateCards();
        }

        if (clearButton) {
            clearButton.onclick = () => this.clearCards();
        }

        if (printButton) {
            printButton.onclick = () => this.printCards();
        }

        if (clearAllButton) {
            clearAllButton.onclick = () => this.clearAllSavedIds();
        }

        if (printSavedButton) {
            printSavedButton.onclick = () => this.printSelectedSavedIds();
        }

        if (selectAllLaterButton) {
            selectAllLaterButton.onclick = () => this.selectAllSavedIds();
        }

        if (clearSelectionLaterButton) {
            clearSelectionLaterButton.onclick = () => this.clearSelectionSavedIds();
        }

        document.querySelectorAll('input[name="printMode"]').forEach(input => {
            input.onchange = () => this.handlePrintModeChange();
        });

        this.ensureSaveButton();
        this.handlePrintModeChange();
        this.initialized = true;
    },

    // =========================================================
    // GET CURRENT PRINT MODE
    // =========================================================
    getPrintMode() {
        const selected = document.querySelector('input[name="printMode"]:checked');
        return selected ? selected.value : "INSTANT";
    },

    // =========================================================
    // HANDLE PRINT MODE
    // =========================================================
    handlePrintModeChange() {
        const mode = this.getPrintMode();

        const idsSection = document.getElementById("studentIdsSection");
        const rangeSection = document.getElementById("studentRangeSection");
        const printLaterSection = document.getElementById("printLaterSection");
        const recentActivitiesSection = document.getElementById("recentActivitiesSection");
        const studentStatusSection = document.getElementById("studentStatusSection");
        const printArea = document.getElementById("idCardsPrintArea");
        const previewSection = document.querySelector(".id-card-preview-section");

        const isRecent = mode === "RECENT";
        const isStatus = mode === "STATUS";
        const isRange = mode === "RANGE";
        const isLater = mode === "LATER";

        // Reset all selections whenever the tab changes
        this.selectedRecentActivityIds = [];
        this.selectedStudentIds = [];
        this.studentsCache = [];

        document.querySelectorAll(
            "#recentActivitiesList .recent-activity-checkbox, " +
            "#selectAllRecentActivities, " +
            "#savedStudentIdsList .saved-student-id-checkbox"
        ).forEach(checkbox => {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        });

        // Clear generated cards and preview
        this.clearCards();

        if (printArea) {
            printArea.innerHTML = "";
            printArea.style.display = isRecent || isStatus ? "none" : "";
        }

        // Student ID input
        if (idsSection) {
            idsSection.style.display = isRecent || isStatus || isRange ? "none" : "block";
        }

        // ID range input
        if (rangeSection) {
            rangeSection.style.display = isRange ? "block" : "none";
        }

        // Print Later saved IDs list
        if (printLaterSection) {
            printLaterSection.style.display = isLater ? "block" : "none";
        }

        // Recent Activities list
        if (recentActivitiesSection) {
            recentActivitiesSection.style.display = isRecent ? "block" : "none";
        }

        // Student ID status lookup
        if (studentStatusSection) {
            studentStatusSection.style.display = isStatus ? "block" : "none";
        }

        // Clear previously generated cards when changing modes
        this.clearCards();

        // Print Preview section visibility
        if (previewSection) {
            previewSection.style.display = isStatus ? "none" : "";
        }

        // Update buttons and selection counts
        this.updateRecentActivitySelection();
        this.updateSavedPrintActions();
        this.updateModeActions(mode);

        // Load recent activities when selected
        if (isLater) {
            this.loadSavedStudentIds();
        }

        if (isRecent) {
            this.loadRecentActivities();
        }
    },

// =========================================================
// UPDATE MODE ACTIONS
// =========================================================
    updateModeActions(mode = this.getPrintMode()) {
        const generateButton = document.getElementById("generateCardsButton");
        const saveButton = document.getElementById("saveIdCardsButton");
        const clearButton = document.getElementById("clearCardsButton");
        const printButton = document.getElementById("printIdCardsButton");
        const actions = document.getElementById("idCardsActions");
        const printArea = document.getElementById("idCardsPrintArea");
        const printBackButton = document.getElementById("printBackIdCardsButton");

        const isPrintLater = mode === "LATER";
        const isRecent = mode === "RECENT";
        const isStatus = mode === "STATUS";

        const hasCards = !!printArea && printArea.querySelectorAll(".student-id-card").length > 0;

        // Recent Activities: show only Print when cards exist
        if (isRecent) {
            if (generateButton) generateButton.style.display = "none";
            if (saveButton) saveButton.style.display = "none";
            if (clearButton) clearButton.style.display = "none";
            if (printButton) {
                printButton.style.display = hasCards ? "inline-flex" : "none";
                printBackButton.style.display = hasCards ? "inline-flex" : "none";
            }
            if (actions) {
                actions.style.display = hasCards ? "flex" : "none";
            }
            return;
        }

        // Status mode: hide all card actions
        if (isStatus) {
            [generateButton, saveButton, clearButton, printButton, printBackButton].forEach(button => {
                if (button) button.style.display = "none";
            });
            if (actions) actions.style.display = "none";
            return;
        }

        // Generate: hidden in Print Later mode
        if (generateButton) {
            generateButton.style.display = isPrintLater ? "none" : "inline-flex";
        }

        // Save for Later: visible only in Print Later mode
        if (saveButton) {
            saveButton.style.display = isPrintLater ? "inline-flex" : "none";
        }

        // Clear: visible in regular modes and Print Later
        if (clearButton) {
            clearButton.style.display = "inline-flex";
        }

        // Print: visible only when cards exist
        if (printButton) {
            printButton.style.display = hasCards ? "inline-flex" : "none";
            printBackButton.style.display = hasCards ? "inline-flex" : "none";
        }

        if (actions) {
            actions.style.display = (isPrintLater || hasCards) ? "flex" : "none";
        }
    },

    // =========================================================
    // CREATE SAVE-FOR-LATER BUTTON IF MISSING
    // =========================================================
    ensureSaveButton() {
        const actions = document.querySelector(".selection-actions");
        if (!actions) return;
        let saveButton = document.getElementById("saveIdCardsButton");
        if (saveButton) {
            saveButton.onclick = () => this.saveForLater();
            return;
        }

        saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.id = "saveIdCardsButton";
        saveButton.className = "primary-button";
        saveButton.textContent = "Save for Later";
        saveButton.style.display = "none";
        saveButton.onclick = () => this.saveForLater();

        const clearButton = document.getElementById("clearCardsButton");
        if (clearButton) {
            actions.insertBefore(saveButton, clearButton);
        } else {
            actions.appendChild(saveButton);
        }
    },

    async generateSelectedIdCards() {
        const studentIds = this.getSelectedRecentStudentIds();
        if (!studentIds.length) {
            this.showError("Please select at least one student.");
            return;
        }
        const mode = this.getPrintMode();
        await this.loadStudents(studentIds, mode);
    },


    async checkStudentIdStatus() {
        const studentIdInput = document.getElementById("statusStudentId");
        const resultContainer = document.getElementById("studentStatusResult");
        if (!studentIdInput || !resultContainer) {
            console.error("Student status elements not found.");
            return;
        }
        const studentId = studentIdInput.value.trim();

        // =========================================================
        // VALIDATE STUDENT ID
        // =========================================================
        if (!studentId) {
            this.showError("Please enter a Student ID.");
            studentIdInput.focus();
            return;
        }

        if (!/^\d+$/.test(studentId)) {
            this.showError("Please enter a valid Student ID.");
            studentIdInput.focus();
            return;
        }
        resultContainer.innerHTML = `
            <p class="status-loading">
                Checking student ID status...
            </p>
        `;
        try {
            const response = await Api.get(
                `/api/id-card-activities/${encodeURIComponent(studentId)}/id-card-status`
            );

            if (!response) {
                throw new Error("No response received from server.");
            }
            const status = String(response.idCardStatus || "NOT_ISSUED").toUpperCase();
            const statusLabel = this.getRecentActivityStatusLabel(status);
            const statusClass = {
                NOT_ISSUED: "not-issued",
                PRINTED: "printed",
                ISSUED: "issued"
            }[status] || "not-issued";

            // =====================================================
            // FORMAT DATE
            // =====================================================
            const formatDate = (dateValue) => {
                if (!dateValue) {
                    return "Not available";
                }
                const date = new Date(dateValue);
                if (Number.isNaN(date.getTime())) {
                    return "Not available";
                }
                return date.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            };

            // =====================================================
            // RENDER STUDENT STATUS
            // =====================================================
            const fullName = (response.fullName || "Not available").toUpperCase();
            const studentInitial = fullName === "Not available" ? "S" : fullName.charAt(0).toUpperCase();
            resultContainer.innerHTML = `
            <div class="student-status-result-card">
                <div class="status-card-header">
                    <div>
                        <span class="status-card-eyebrow">STUDENT INFORMATION</span>
                        <h3>Student ID Card Status</h3>
                    </div>
                    <span class="status-badge ${statusClass}">
                        ${this.escapeHtml(statusLabel)}
                    </span>
                </div>
                <div class="status-student-info">
                    <div class="status-avatar">
                        ${this.escapeHtml(studentInitial)}
                    </div>
                    <div>
                        <h4>${this.escapeHtml(fullName)}</h4>
                        <p>Student ID:<strong>${this.escapeHtml(String(response.studentId ?? studentId))}</strong></p>
                    </div>
                </div>
                <div class="status-timeline">
                    <div class="status-timeline-item">
                        <span class="status-timeline-icon printed-icon">✓</span>
                        <div class="status-timeline-content">
                            <span>Card Printed</span>
                            <strong>${this.escapeHtml(formatDate(response.cardPrintedAt))}</strong>
                        </div>
                    </div>
                    <div class="status-timeline-item">
                        <span class="status-timeline-icon issued-icon">✓</span>
                        <div class="status-timeline-content">
                            <span>Card Issued</span>
                            <strong>${this.escapeHtml(formatDate(response.cardIssuedAt))}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
        } catch (error) {
            console.error("Unable to check student ID status:", error);
            resultContainer.innerHTML = `
            <p class="error-message">
                ${this.escapeHtml(
                error.message ||
                "Unable to check student ID status. Please try again."
            )}
            </p>
        `;
        }
    },

    // =========================================================
// PRINT ONLY BACK SIDE OF ID CARDS
// Does not modify existing preview or front-side printing.
// =========================================================
    printBackCards() {

        // Open a separate print window
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            alert("Please allow pop-ups for this website.");
            return;
        }

        const instructions = [
            "This ID card is strictly non-transferable.",
            "Students must carry their ID card while using library facilities.",
            "Maintain silence and discipline inside the library.",
            "Keep your study area clean and tidy.",
            "Do not damage library furniture, books, or other property.",
            "Food and beverages are not allowed inside the study area.",
            "Follow the library's assigned seating arrangements and timings.",
            "Any damage or loss of library property may attract a penalty.",
            "Fees once paid are strictly non-refundable and non-adjustable under any circumstances.",
            "In case of loss of the ID card, a replacement fee of ₹50 will be charged for issuing a new ID card."
        ];

        const backCard = () => `
        <article class="back-card">
            <header class="back-header">
                <div class="library-name">
                    PRO LEARNER'S DIGITAL LIBRARY
                </div>
            
                <div class="library-contact">
                    276/2, CHAKIYA, PRAYAGRAJ
                    <br>
                    8840932610, 6387471168
                </div>
            
                <div class="instructions-title">
                    GENERAL INSTRUCTIONS
                </div>
            </header>

            <ol class="instructions-list">
                ${instructions.map(item =>
            `<li>${this.escapeHtml(item)}</li>`
        ).join("")}
            </ol>
        </article>
    `;

        const cardsPerSheet = 9;
        const sheets = [];

        for (let i = 0; i < 9; i += cardsPerSheet) {

            const count = Math.min(
                cardsPerSheet,
                students.length - i
            );

            const cards = Array.from(
                { length: count },
                () => backCard()
            ).join("");

            sheets.push(`
            <section class="back-sheet">
                <div class="back-grid">
                    ${cards}
                </div>
            </section>
        `);
        }


        const printCss = `
            @page {
                size: A4 portrait;
                margin: 5mm 0 0 0;
            }
        
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        
            html, body {
                margin: 0;
                padding: 0;
                width: 210mm;
                background: #fff;
                font-family: Arial, sans-serif;
            }
        
            .back-grid {
                display: grid;
                grid-template-columns: repeat(3, 53.98mm);
                grid-auto-rows: 85.60mm;
                gap: 3mm;
                justify-content: center;
                align-content: start;
            }
        
            .back-card {
                display: flex;
                flex-direction: column;
                width: 53.98mm;
                height: 85.60mm;
                overflow: hidden;
                border: .25mm solid #cbd5e1;
                background: white;
                color: #172033;
                break-inside: avoid;
                page-break-inside: avoid;
            }
        
            .back-header {
                padding: 5mm 2mm 3mm;
                color: white;
                background: #173f7a;
                text-align: center;
            }
        
            .back-header .library-name {
                font-size: 9pt;
                font-weight: 900;
                color: white;
            }
        
            .back-header .library-contact {
                font-size: 7pt;
                font-weight: 700;
                color: white;
                line-height: 1.2;
                margin-top: 2mm;
            }
        
            .instructions-title {
                margin-top: 2mm;
                font-size: 7pt;
                font-weight: 800;
                color: white;
            }
        
            .instructions-list {
                display: flex;
                flex: 1;
                flex-direction: column;
                justify-content: space-evenly;
                gap: 0.3mm;
                margin: 0;
                padding: 3mm 3mm 3mm 7mm;
                font-size: 6.5pt;
                font-weight: 700;
                line-height: 1.0;
            }
        
            .instructions-list li {
                padding-left: .5mm;
            }
        `;

        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student ID Card - Back Side</title>
            <style>${printCss}</style>
        </head>
        <body>
            ${sheets.join("")}
        </body>
        </html>
    `);

        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
    },


    // =========================================================
    // LOAD RECENT ID CARD ACTIVITIES
    // =========================================================
    async loadRecentActivities() {
        const container = document.getElementById("recentActivitiesList");
        if (!container) return;
        container.innerHTML = "<p>Loading recent activities...</p>";
        try {
            const response = await Api.get(Endpoints.students.idCardActivity());
            const activities = Array.isArray(response) ? response : response?.data;
            if (!Array.isArray(activities)) {
                throw new Error("Invalid activity response from server.");
            }
            this.renderRecentActivities(activities);
        } catch (error) {
            console.error("Unable to load recent activities:", error);
            container.innerHTML = `
                <p class="error-message">Unable to load recent activities.</p>
                <button type="button" id="retryRecentActivitiesButton">Retry</button>
            `;
            document.getElementById("retryRecentActivitiesButton")?.addEventListener("click", () => this.loadRecentActivities());
        }
    },

    // =========================================================
    // GET STUDENT IDS FROM TEXTAREA
    // =========================================================
    getStudentIdsFromInput() {
        const input = document.getElementById("studentIds");
        if (!input) {
            console.error("studentIds input not found.");
            this.showError("Student ID input was not found.");
            return [];
        }
        const value = input.value.trim();
        if (!value) {
            this.showError("Please enter at least one Student ID.");
            input.focus();
            return [];
        }
        const ids = value.split(/[\s,]+/).filter(Boolean);
        if (ids.some(id => !/^\d+$/.test(id))) {
            this.showError("Student IDs must contain only numbers.");
            input.focus();
            return [];
        }
        return [...new Set(ids.map(Number))];
    },

    // =========================================================
    // RENDER RECENT ID CARD ACTIVITIES
    // =========================================================

    getRecentActivityStatus(activity) {
        const status = String(
            activity.idCardStatus || activity.status || ""
        ).toUpperCase();

        const validStatuses = [
            "NOT_ISSUED",
            "PHOTO_COLLECTED_PRINTED",
            "PHOTO_COLLECTED_NOT_PRINTED",
            "PHOTO_PENDING_PRINTED",
            "PHOTO_PENDING_NOT_PRINTED",
            "READY",
            "ISSUED"
        ];

        return validStatuses.includes(status) ? status : "NOT_ISSUED";
    },

    getRecentActivityStatusLabel(status) {
        const labels = {
            NOT_ISSUED: "Not Issued",
            PHOTO_COLLECTED_PRINTED: "Photo Collected and Printed",
            PHOTO_COLLECTED_NOT_PRINTED: "Photo Collected and Not Printed",
            PHOTO_PENDING_PRINTED: "Photo Pending and Printed",
            PHOTO_PENDING_NOT_PRINTED: "Photo Pending and Not Printed",
            READY: "Ready",
            ISSUED: "Issued"
        };

        return labels[status] || status;
    },

    renderFilteredRecentActivities() {
        const statusFilter = document.getElementById("recentActivityStatusFilter")?.value || "ALL";
        const printLaterFilter = document.getElementById("recentActivityPrintLaterFilter")?.value || "ALL";
        const activities = this.recentActivitiesCache.filter(activity => {
            const status = this.getRecentActivityStatus(activity);
            const matchesStatus = statusFilter === "ALL" || (statusFilter === "TO_BE_PRINTED" && (status === "NOT_ISSUED" || status.endsWith("_NOT_PRINTED"))) || status === statusFilter;
            const matchesPrintLater = printLaterFilter === "ALL" || String(activity.printLater === true) === printLaterFilter;
            return matchesStatus && matchesPrintLater;
        });

        this.renderRecentActivitiesTable(activities);
    },

    renderRecentActivities(activities) {
        this.recentActivitiesCache = Array.isArray(activities) ? activities : [];

        // Remove selections for records no longer present in the API response
        const availableIds = new Set(
            this.recentActivitiesCache.map(a => Number(a.studentId))
        );

        this.selectedRecentActivityIds =
            this.selectedRecentActivityIds.filter(id => availableIds.has(id));

        this.renderFilteredRecentActivities();
    },

    renderRecentActivitiesTable(activities) {
        const container = document.getElementById("recentActivitiesList");
        if (!container) return;

        if (!activities.length) {
            container.innerHTML = `
            <div class="empty-state">
                No ID card activities found for the selected filters.
            </div>
        `;

            this.updateRecentActivitySelection();
            return;
        }

        const formatDate = (dateValue) => {
            if (!dateValue) {
                return "Not available";
            }
            const date = new Date(dateValue);
            if (Number.isNaN(date.getTime())) {
                return "Not available";
            }
            return date.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        };

        container.innerHTML = `
        <div class="recent-activities-table-wrapper">
            <table class="recent-activities-table">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox"
                                   id="selectAllRecentActivities"
                                   aria-label="Select all activities">
                        </th>
                        <th>Student ID</th>
                        <th>Card Status</th>
                        <th>Print Later</th>
                        <th>Printed At</th>
                        <th>Issued At</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    ${activities.map(activity => {
            const studentId = Number(activity.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return "";
            }

            const status = this.getRecentActivityStatus(activity);
            const selected = this.selectedRecentActivityIds.includes(studentId);

            return `
                            <tr
                                data-student-id="${studentId}"
                                data-status="${status}"
                                class="recent-activity-row">

                                <td>
                                    <input
                                        type="checkbox"
                                        class="recent-activity-checkbox"
                                        value="${studentId}"
                                        ${selected ? "checked" : ""}
                                        aria-label="Select Student ID ${studentId}">
                                </td>
                                <td>
                                    <a
                                        href="/student-details.html?id=${studentId}"
                                        target="_blank"
                                        onclick="event.stopPropagation()">
                                        <strong>
                                            ${escapeHtml(studentId)}
                                        </strong>
                                    </a>
                                </td>
                                <td>
                                    <span class="id-card-status status-${status.toLowerCase()}">
                                        ${this.escapeHtml(this.getRecentActivityStatusLabel(status))}
                                    </span>
                                </td>

                                <td>${activity.printLater === true ? "Yes" : "No"}</td>
                                <td>${this.escapeHtml(formatDate(activity.printedAt))}</td>
                                <td>${this.escapeHtml(formatDate(activity.issuedAt))}</td>
                                <td>${this.escapeHtml(formatDate(activity.updatedAt))}</td>
                            </tr>
                        `;
        }).join("")}
                </tbody>
            </table>
        </div>
    `;

        const selectAll = document.getElementById("selectAllRecentActivities");

        selectAll?.addEventListener("change", () => {
            const checkboxes = [
                ...container.querySelectorAll(".recent-activity-checkbox")
            ];

            checkboxes.forEach(checkbox => {
                const studentId = Number(checkbox.value);

                checkbox.checked = selectAll.checked;

                if (selectAll.checked) {
                    if (!this.selectedRecentActivityIds.includes(studentId)) {
                        this.selectedRecentActivityIds.push(studentId);
                    }
                } else {
                    this.selectedRecentActivityIds =
                        this.selectedRecentActivityIds.filter(id => id !== studentId);
                }
            });

            this.updateRecentActivitySelection();
        });

        container.querySelectorAll(".recent-activity-checkbox").forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                const studentId = Number(checkbox.value);

                if (checkbox.checked) {
                    if (!this.selectedRecentActivityIds.includes(studentId)) {
                        this.selectedRecentActivityIds.push(studentId);
                    }
                } else {
                    this.selectedRecentActivityIds =
                        this.selectedRecentActivityIds.filter(id => id !== studentId);
                }

                this.updateRecentActivitySelection();
            });
        });

        container.querySelector("tbody")?.addEventListener("click", event => {
            const row = event.target.closest(".recent-activity-row");

            if (!row || event.target.closest(".recent-activity-checkbox")) {
                return;
            }

            const checkbox = row.querySelector(".recent-activity-checkbox");

            if (checkbox) {
                checkbox.checked = !checkbox.checked;

                checkbox.dispatchEvent(new Event("change", {
                    bubbles: true
                }));
            }
        });

        this.updateRecentActivitySelection();
    },


    // =========================================================
    // UPDATE RECENT ACTIVITY SELECTION AND BUTTON STATES
    // =========================================================

    updateRecentActivitySelection() {
        const container = document.getElementById("recentActivitiesList");
        if (!container) return;

        // Synchronize selected IDs with currently rendered checkboxes
        const visibleCheckboxes = [
            ...container.querySelectorAll(".recent-activity-checkbox")
        ];

        visibleCheckboxes.forEach(checkbox => {
            const studentId = Number(checkbox.value);

            if (checkbox.checked) {
                if (!this.selectedRecentActivityIds.includes(studentId)) {
                    this.selectedRecentActivityIds.push(studentId);
                }
            } else {
                this.selectedRecentActivityIds =
                    this.selectedRecentActivityIds.filter(id => id !== studentId);
            }
        });

        const selectedCount = this.selectedRecentActivityIds.length;

        const countElement = document.getElementById("selectedRecentActivitiesCount");
        const deleteButton = document.getElementById("deleteSelectedActivitiesButton");
        const generateButton = document.getElementById("generateSelectedIdCardsButton");

        const bulkStatusSelect = document.getElementById("bulkActivityStatusSelect");
        const updateStatusButton = document.getElementById("updateSelectedActivityStatusButton");

        const selectedRows = this.recentActivitiesCache.filter(activity =>
            this.selectedRecentActivityIds.includes(Number(activity.studentId))
        );

        if (generateButton) {
            generateButton.disabled = selectedCount === 0;
        }

        if (countElement) {
            countElement.textContent = `${selectedCount} selected`;
        }

        if (deleteButton) {
            deleteButton.disabled = selectedCount === 0;
        }

        // Update Status button
        if (updateStatusButton) {
            updateStatusButton.disabled = !(
                selectedCount > 0 &&
                bulkStatusSelect &&
                bulkStatusSelect.value !== ""
            );
        }

        const selectAll = document.getElementById("selectAllRecentActivities");

        if (selectAll) {
            selectAll.checked =
                visibleCheckboxes.length > 0 &&
                visibleCheckboxes.every(checkbox => checkbox.checked);

            selectAll.indeterminate =
                visibleCheckboxes.some(checkbox => checkbox.checked) &&
                !selectAll.checked;
        }
    },


    // =========================================================
    // GET SELECTED STUDENT IDS
    // =========================================================
    getSelectedRecentStudentIds() {
        return [...this.selectedRecentActivityIds];
    },

    // =========================================================
    // DELETE SELECTED ACTIVITIES
    // =========================================================
    async deleteSelectedActivities() {
        await this.performBulkActivityAction({
            action: "delete",
            endpoint: "/api/id-card-activities/bulk",
            confirmation: "Delete the selected ID card activity records?"
        });
    },

// =========================================================
// EXECUTE BULK ACTIVITY ACTION
// =========================================================
// =========================================================
// EXECUTE BULK ACTIVITY ACTION
// =========================================================
    async performBulkActivityAction({ action, endpoint, confirmation }) {
        const studentIds = this.getSelectedRecentStudentIds();

        if (!studentIds.length) {
            this.showError("Please select at least one Student ID.");
            return;
        }

        if (!confirm(`${confirmation}\nSelected records: ${studentIds.length}`)) {
            return;
        }

        const buttonIds = {
            delete: "deleteSelectedActivitiesButton"
        };

        const button = document.getElementById(buttonIds[action]);

        try {
            if (button) {
                button.disabled = true;
                button.textContent = "Processing...";
            }

            await Api.post(endpoint, { studentIds });

            this.selectedRecentActivityIds = [];

            await this.loadRecentActivities();

            alert("Selected activity records updated successfully.");

        } catch (error) {
            console.error(`Bulk ${action} operation failed:`, error);
            this.showError(error?.message || "Unable to process the selected records.");

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Delete";
            }

            this.updateRecentActivitySelection();
        }
    },


    // =========================================================
    // GET STUDENT IDS FROM RANGE
    // =========================================================
    getStudentIdsFromRange() {
        const fromInput = document.getElementById("fromStudentId");
        const toInput = document.getElementById("toStudentId");
        if (!fromInput || !toInput) {
            console.error("Student ID range inputs not found.");
            this.showError("Student ID range inputs were not found.");
            return [];
        }
        const fromValue = fromInput.value.trim();
        const toValue = toInput.value.trim();
        if (!fromValue || !toValue) {
            this.showError("Please enter both From Student ID and To Student ID.");
            return [];
        }
        if (!/^\d+$/.test(fromValue) || !/^\d+$/.test(toValue)) {
            this.showError("Student IDs must contain only numbers.");
            return [];
        }
        const fromId = Number(fromValue);
        const toId = Number(toValue);
        if (fromId > toId) {
            this.showError("From Student ID cannot be greater than To Student ID.");
            return [];
        }
        const totalIds = toId - fromId + 1;
        if (totalIds > 50) {
            this.showError("You can generate a maximum of 50 ID cards at a time.");
            return [];
        }
        return Array.from({ length: totalIds }, (_, index) => fromId + index);
    },

    // =========================================================
    // GET IDS BASED ON CURRENT MODE
    // =========================================================
    getSelectedIds() {
        return this.getPrintMode() === "RANGE" ? this.getStudentIdsFromRange() : this.getStudentIdsFromInput();
    },

    // =========================================================
    // GENERATE ID CARDS
    // =========================================================
    async generateCards() {
        this.clearError();
        const mode = this.getPrintMode();
        const studentIds = this.getSelectedIds();
        if (!studentIds.length) return;
        if (studentIds.length > 500) {
            this.showError("You can generate a maximum of 500 ID cards at a time.");
            return;
        }
        await this.loadStudents(studentIds, mode);
    },

    // =========================================================
    // LOAD STUDENT DETAILS FROM API
    // =========================================================
    async loadStudents(studentIds, mode = this.getPrintMode()) {
        this.showLoading();
        this.clearError();
        try {
            debugger;
            var addInActivity = true;
            if (this.getPrintMode() === "RECENT" ) {
                addInActivity = false;
            }
            const students = await Api.post(
                `${Endpoints.students.bulkIdCards()}?addInActivity=${addInActivity}`,
                studentIds
            );
            if (!Array.isArray(students) || students.length === 0) {
                this.selectedStudentIds = [];
                this.studentsCache = [];
                this.showError("No students found for the selected Student IDs.");
                this.showEmptyState("No students found.");
                this.updateModeActions(mode);
                return;
            }
            this.selectedStudentIds = [...studentIds];
            this.studentsCache = [...students];
            this.renderCards(students);
            this.updateModeActions(mode);
            if (mode === "INSTANT") {
                window.setTimeout(() => this.printCards(), 300);
            }
        } catch (error) {
            console.error("Unable to load student details.", error);
            this.showEmptyState("Unable to load student details.");
            this.showError(error?.message || "Unable to load student details.");
            this.updateModeActions(mode);
        }
    },

    // =========================================================
    // SAVE CURRENT STUDENT IDS FOR LATER (BULK API)
    // =========================================================
    async saveForLater() {
        this.clearError();
        const mode = this.getPrintMode();
        const inputIds = mode === "LATER" ? this.getStudentIdsFromInput() : [];
        const sourceIds = mode === "LATER" ? inputIds : this.selectedStudentIds;
        if (!sourceIds.length) {
            if (mode !== "LATER") {
                this.showError("Please generate ID cards first.");
            }
            return;
        }
        const studentIds = [...new Set(sourceIds.map(Number).filter(id => Number.isInteger(id) && id > 0))];
        if (!studentIds.length) {
            this.showError("No valid Student IDs selected.");
            return;
        }
        const saveButton = document.getElementById("saveIdCardsButton");
        try {
            if (saveButton) {
                saveButton.disabled = true;
                saveButton.textContent = "Saving...";
            }
            const response = await Api.post(Endpoints.students.printLater(), { studentIds });
            const savedRecords = Array.isArray(response) ? response : response?.data;
            if (!Array.isArray(savedRecords)) {
                throw new Error("Student IDs were saved, but the saved list was not returned correctly.");
            }
            this.savedStudentIds = [...new Set(savedRecords.map(record => Number(record.studentId)).filter(id => Number.isInteger(id) && id > 0))];
            this.renderSavedStudentIds();
            alert("Student IDs saved for later printing successfully.");
        } catch (error) {
            console.error("Unable to save Student IDs for later printing.", error);
            this.showError(error?.message || "Unable to save Student IDs for later printing.");
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save for Later";
            }
        }
    },

    // =========================================================
    // LOAD SAVED IDS FROM API
    // =========================================================
    async loadSavedStudentIds() {
        try {
            const response = await Api.get(Endpoints.students.printLater());
            const records = Array.isArray(response) ? response : response?.data ?? response?.activities ?? [];
            this.savedStudentIds = [...new Set(records.map(record => Number(typeof record === "object" ? record.studentId ?? record.student?.id : record)).filter(id => Number.isInteger(id) && id > 0))];
            this.renderSavedStudentIds();
        } catch (error) {
            console.error("Unable to load saved Student IDs from API.", error);
            this.savedStudentIds = [];
            this.renderSavedStudentIds();
            this.showError(error?.message || "Unable to load saved Student IDs.");
        }
    },

    // =========================================================
    // RENDER PRINT LATER LIST
    // =========================================================

    renderSavedStudentIds() {

        const container = document.getElementById("savedStudentIdsList");

        if (!container) return;

        if (!this.savedStudentIds.length) {

            container.innerHTML = `
            <div class="empty-saved-state">
                No Student IDs saved for later printing.
            </div>
        `;

            this.updateSavedPrintActions();
            return;
        }

        container.innerHTML = this.savedStudentIds.map(studentId => `
        <div class="saved-student-id-item" data-student-id="${studentId}">

            <div class="saved-student-id-left">

                <input
                    type="checkbox"
                    class="saved-student-id-checkbox"
                    value="${studentId}"
                    aria-label="Select Student ID ${studentId}"
                >

                <span class="saved-student-id-number">
                    Student ID:
                    <a
                        href="/student-details.html?id=${studentId}"
                        target="_blank"
                        onclick="event.stopPropagation()">
                        <strong>
                            ${escapeHtml(studentId)}
                        </strong>
                    </a>
                </span>

            </div>

            <div class="saved-student-id-actions">

                <button
                    type="button"
                    class="print-single-button"
                    data-student-id="${studentId}"
                >Print</button>

                <button
                    type="button"
                    class="remove-single-button"
                    data-student-id="${studentId}"
                >Remove</button>

            </div>

        </div>
    `).join("");


        // =========================================================
        // PRINT SINGLE STUDENT ID
        // =========================================================

        container.querySelectorAll(".print-single-button").forEach(button => {

            button.onclick = () => {
                this.printSavedIds([
                    Number(button.dataset.studentId)
                ]);
            };

        });


        // =========================================================
        // REMOVE SINGLE STUDENT ID
        // =========================================================

        container.querySelectorAll(".remove-single-button").forEach(button => {

            button.onclick = () => {
                this.removeSavedStudentId(
                    Number(button.dataset.studentId)
                );
            };

        });


        // =========================================================
        // CHECKBOX CHANGE
        // =========================================================

        container.querySelectorAll(".saved-student-id-checkbox").forEach(checkbox => {

            checkbox.onchange = () => {
                this.updateSavedPrintActions();
            };

        });


        // =========================================================
        // CLICK ITEM TO SELECT / DESELECT
        // =========================================================

        container.onclick = (event) => {

            const item = event.target.closest(".saved-student-id-item");

            if (!item || !container.contains(item)) return;

            // Don't interfere with Print or Remove buttons
            if (event.target.closest("button")) {
                return;
            }

            // Checkbox handles its own click
            if (event.target.closest(".saved-student-id-checkbox")) {
                return;
            }

            const checkbox = item.querySelector(
                ".saved-student-id-checkbox"
            );

            if (!checkbox) return;

            checkbox.checked = !checkbox.checked;

            checkbox.dispatchEvent(new Event("change", {
                bubbles: true
            }));

        };


        this.updateSavedPrintActions();
    },


    // =========================================================
    // UPDATE SAVED PRINT ACTIONS
    // =========================================================
    updateSavedPrintActions() {
        const actionSection = document.getElementById("savedPrintActions");
        const printButton = document.getElementById("printSavedCardsButton");
        if (!actionSection || !printButton) return;
        const selected = this.getCheckedSavedIds();
        actionSection.style.display = selected.length ? "flex" : "none";
        printButton.textContent = `Print Selected ID Cards (${selected.length})`;
        printButton.disabled = selected.length === 0;
    },

    async updateSelectedActivitiesStatus() {
        debugger;
        const studentIds = this.getSelectedRecentStudentIds();

        const statusSelect = document.getElementById("bulkActivityStatusSelect");
        const updateButton = document.getElementById("updateSelectedActivityStatusButton");

        const status = statusSelect?.value;

        if (!studentIds.length) {
            this.showError("Please select at least one Student ID.");
            return;
        }

        if (!status) {
            this.showError("Please select a new status.");
            return;
        }

        const statusLabel = this.getRecentActivityStatusLabel(status);

        if (!confirm(
            `Update the status of selected ID card activities to "${statusLabel}"?\nSelected records: ${studentIds.length}`
        )) {
            return;
        }

        try {
            if (updateButton) {
                updateButton.disabled = true;
                updateButton.textContent = "Updating...";
            }

            await Api.post(
                "/api/id-card-activities/status/bulk",
                {
                    studentIds,
                    status
                }
            );

            this.selectedRecentActivityIds = [];

            await this.loadRecentActivities();

            if (statusSelect) {
                statusSelect.value = "";
            }

            alert("Selected ID card activity statuses updated successfully.");

        } catch (error) {
            console.error("Bulk status update failed:", error);
            this.showError(error?.message || "Unable to update selected statuses.");
        } finally {
            if (updateButton) {
                updateButton.textContent = "Update Selected Status";
            }

            this.updateRecentActivitySelection();
        }
    },

    // =========================================================
    // GET CHECKED SAVED IDS
    // =========================================================
    getCheckedSavedIds() {
        return [...document.querySelectorAll(".saved-student-id-checkbox:checked")].map(checkbox => Number(checkbox.value));
    },

    // =========================================================
    // REMOVE ONE SAVED ID
    // =========================================================
    async removeSavedStudentId(studentId) {
        studentId = Number(studentId);
        if (!this.savedStudentIds.includes(studentId)) {
            return;
        }
        if (!confirm(`Remove Student ID ${studentId} from Print Later?`)) {
            return;
        }
        try {
            await Api.patch(Endpoints.students.removePrintLater(studentId));
            this.savedStudentIds = this.savedStudentIds.filter(id => id !== studentId);
            this.renderSavedStudentIds();
        } catch (error) {
            console.error("Error removing saved Student ID:", error);
            alert(error?.message || "Unable to remove the saved Student ID.");
        }
    },

    // =========================================================
    // CLEAR ALL SAVED IDS
    // =========================================================
    async clearAllSavedIds() {
        if (!this.savedStudentIds.length) {
            alert("There are no Student IDs saved for later printing.");
            return;
        }
        if (!confirm("Are you sure you want to clear all Student IDs saved for later printing?")) {
            return;
        }
        const clearButton = document.getElementById("clearAllLaterButton");
        try {
            if (clearButton) {
                clearButton.disabled = true;
                clearButton.textContent = "Clearing...";
            }
            await Api.patch(Endpoints.students.printLater());
            this.savedStudentIds = [];
            this.renderSavedStudentIds();
            alert("All saved Student IDs have been cleared.");
        } catch (error) {
            console.error("Error clearing saved Student IDs:", error);
            alert(error?.message || "Unable to clear the saved Student ID list.");
        } finally {
            if (clearButton) {
                clearButton.disabled = false;
                clearButton.textContent = "Clear all saved IDs";
            }
        }
    },

    // =========================================================
    // PRINT SELECTED SAVED IDS
    // =========================================================
    async printSelectedSavedIds() {
        const selectedIds = this.getCheckedSavedIds();
        if (!selectedIds.length) {
            alert("Please select at least one Student ID to print.");
            return;
        }
        await this.printSavedIds(selectedIds);
    },

    // =========================================================
    // LOAD AND PRINT SAVED IDS
    // Saved IDs remain saved until the user removes them.
    // The browser does not reliably report print vs. cancel.
    // =========================================================
    async printSavedIds(studentIds) {
        if (!Array.isArray(studentIds) || !studentIds.length) return;
        this.clearError();
        this.showLoading();
        try {
            const students = await Api.post(Endpoints.students.bulkIdCards(), studentIds);
            if (!Array.isArray(students) || !students.length) {
                this.showEmptyState("No students found for the selected saved IDs.");
                alert("No students found for the selected saved IDs.");
                return;
            }
            this.selectedStudentIds = [...studentIds];
            this.studentsCache = [...students];
            this.renderCards(students);
            this.updateModeActions(this.getPrintMode());
            window.setTimeout(() => this.printCards(), 300);
        } catch (error) {
            console.error("Unable to load saved ID cards.", error);
            this.showEmptyState("Unable to load saved ID cards.");
            alert(error?.message || "Unable to load saved ID cards.");
        }
    },

    // =========================================================
    // RENDER ID CARDS
    // =========================================================
    renderCards(students) {
        console.log("RENDER INPUT:", students);
        console.log("IS ARRAY:", Array.isArray(students));
        console.log("STUDENT COUNT:", students?.length);
        const container = document.getElementById("idCardsPrintArea");
        if (!container) {
            console.error("idCardsPrintArea not found.");
            return;
        }
        if (!Array.isArray(students) || students.length === 0) {
            this.showEmptyState("No students found.");
            this.updateModeActions(this.getPrintMode());
            return;
        }
        container.innerHTML = students.map(student => {
            const photoUrl = this.getSafePhotoUrl(student.photoUrl);
            const photoMarkup = photoUrl ? `<img src="${this.escapeAttribute(photoUrl)}" alt="Student Photo">` : `<span>PHOTO</span>`;
            return `
                <div class="student-id-card">
                    <div class="id-card-header">
                        <div class="library-name">PRO LEARNER'S</div>
                        <div class="library-title">DIGITAL LIBRARY</div>
                        <div class="card-title">STUDENT ID CARD</div>
                    </div>

                    <div class="id-card-body">
                        <div class="photo-section">
                            <div class="student-photo">
                                ${photoMarkup}
                            </div>
                        </div>

                        <div class="student-basic-info">
                            <div class="student-id">
                                <strong>${this.escapeHtml(student.studentId ?? "-")}</strong>
                            </div>

                            <div class="student-name">
                                ${this.escapeHtml((student.fullName ?? "-").toUpperCase())}
                            </div>

                            <div class="student-field">
                                <strong>${this.escapeHtml(student.mobileNumber ?? "-")}</strong>
                            </div>

                            <div class="student-field">
                                <strong>${this.formatDate(student.dateOfAdmission)}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="id-card-footer">
                        <span><strong>Website: pll.up.railway.app</strong></span>
                    </div>
                </div>
            `;
        }).join("");

        container.style.display = "grid";
        container.style.visibility = "visible";
        this.updateModeActions(this.getPrintMode());
    },

    // =========================================================
    // SAFE PHOTO URL
    // Allows HTTP(S) and relative URLs; rejects javascript: etc.
    // =========================================================
    getSafePhotoUrl(value) {
        if (typeof value !== "string" || !value.trim()) return "";
        const url = value.trim();
        if (/^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(url)) {
            return url;
        }
        return "";
    },

    // =========================================================
    // CLEAR CURRENT CARDS AND INPUTS
    // =========================================================
    clearCards() {
        const input = document.getElementById("studentIds");
        const fromInput = document.getElementById("fromStudentId");
        const toInput = document.getElementById("toStudentId");

        if (input) input.value = "";
        if (fromInput) fromInput.value = "";
        if (toInput) toInput.value = "";

        this.selectedStudentIds = [];
        this.studentsCache = [];

        this.showEmptyState("Enter Student IDs to generate ID cards.");
        this.clearError();
        this.updateModeActions(this.getPrintMode());
    },

    // =========================================================
    // PRINT CURRENT CARDS
    // =========================================================
    printCards() {
        const container = document.getElementById("idCardsPrintArea");
        if (!container) {
            console.error("idCardsPrintArea not found.");
            return;
        }
        if (!container.querySelector(".student-id-card")) {
            alert("Please generate ID cards before printing.");
            return;
        }
        window.print();
    },

    // =========================================================
    // SELECT ALL SAVED STUDENT IDS
    // =========================================================
    selectAllSavedIds() {
        const checkboxes = document.querySelectorAll("#savedStudentIdsList .saved-student-id-checkbox");
        if (!checkboxes.length) {
            alert("There are no Student IDs saved for later printing.");
            return;
        }
        checkboxes.forEach(checkbox => {checkbox.checked = true;});
        this.updateSavedPrintActions();
    },

    // =========================================================
    // CLEAR SAVED STUDENT ID SELECTION
    // =========================================================
    clearSelectionSavedIds() {
        const checkboxes = document.querySelectorAll("#savedStudentIdsList .saved-student-id-checkbox");
        checkboxes.forEach(checkbox => {checkbox.checked = false;});
        this.updateSavedPrintActions();
    },

    // =========================================================
    // SHOW LOADING STATE
    // =========================================================
    showLoading() {
        const container = document.getElementById("idCardsPrintArea");
        if (container) {
            container.innerHTML = `
                <div class="empty-state">Loading student details...</div>
            `;
        }
        this.updateModeActions(this.getPrintMode());
    },

    // =========================================================
    // SHOW EMPTY STATE
    // =========================================================
    showEmptyState(message) {
        const container = document.getElementById("idCardsPrintArea");
        if (!container) return;
        container.innerHTML = `
            <div class="empty-state">${this.escapeHtml(message)}</div>
        `;
    },

    // =========================================================
    // SHOW ERROR
    // =========================================================
    showError(message) {
        const errorElement = document.getElementById("cardError");
        if (!errorElement) {
            alert(message);
            return;
        }
        errorElement.textContent = message;
        errorElement.style.display = "block";
    },

    // =========================================================
    // CLEAR ERROR
    // =========================================================
    clearError() {
        const errorElement = document.getElementById("cardError");
        if (!errorElement) return;
        errorElement.textContent = "";
        errorElement.style.display = "none";
    },

    // =========================================================
    // ESCAPE HTML TEXT
    // =========================================================
    escapeHtml(value) {
        if (value === null || value === undefined) return "";
        const element = document.createElement("div");
        element.textContent = String(value);
        return element.innerHTML;
    },

    // =========================================================
    // ESCAPE HTML ATTRIBUTE
    // =========================================================
    escapeAttribute(value) {
        return this.escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    // =========================================================
    // FORMAT ADMISSION DATE
    // =========================================================
    formatDate(value) {
        if (!value) return "-";
        // Handle date-only values without timezone shifting.
        if (typeof value === "string") {
            const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) {
                return `${match[3]}/${match[2]}/${match[1]}`;
            }
        }
        try {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return this.escapeHtml(value);
            }
            return date.toLocaleDateString("en-GB");
        } catch (error) {
            return this.escapeHtml(value);
        }
    }
};

// =========================================================
// GLOBAL ACCESS
// =========================================================
window.BulkIdCards = BulkIdCards;

// =========================================================
// STANDALONE PAGE SUPPORT
// When loaded inside the manager dashboard, load() handles
// initialization after bulk-id-cards.html is inserted.
// =========================================================
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("generateCardsButton")) {
        BulkIdCards.initialize();
    }
});

