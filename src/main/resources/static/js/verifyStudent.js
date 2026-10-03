const VerifyStudent = {
    currentStudent: null,
    currentStudentWarning: null,

    async load() {
        const container = document.getElementById("verifyStudentContainer");
        if (!container) {
            console.error("verifyStudentContainer not found.");
            return;
        }
        container.innerHTML = `
            <section class="card loading-card">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading Verify Student...</span>
            </section>
        `;
        try {
            const html = await fetchHtml("/verify-student.html");
            if (!html) {
                throw new Error("Unable to load verify-student.html");
            }
            container.innerHTML = html;
            this.initialize();
        } catch (error) {
            console.error("Verify Student load error:", error);
            container.innerHTML = `
                <section class="card">
                    <div class="error-state">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <h3>Unable to load Verify Student</h3>
                        <p>Please try again.</p>
                    </div>
                </section>
            `;
        }
    },


    initialize() {
        const input = document.getElementById("verifyMembershipId");
        const button = document.getElementById("verifyStudentBtn");
        const openDetailButton = document.getElementById("openStudentDetailBtn");

        if (!input || !button || !openDetailButton) {
            console.error("Verify Student elements not found.");
            return;
        }

        button.addEventListener("click", () => this.verify());
        openDetailButton.addEventListener("click", () => this.openDetail());
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.verify();
            }
        });
        input.focus();
    },

    async getStudentWarning() {
        if (this.currentStudentWarning !== null && this.currentStudentWarning !== []) {
            await this.showAddWarning();
            return
        }
        try {
            this.currentStudentWarning = await Api.get(Endpoints.students.getStudentWarning(this.currentStudent?.studentId));
            await this.showAddWarning();
        } catch (error) {
            alert(
                error.message ||
                "Something went wrong."
            );
        }
    },

    async verify() {
        const input = document.getElementById("verifyMembershipId");
        const membershipId = input?.value?.trim();
        if (!membershipId) {
            alert("Please enter Student ID.");
            input?.focus();
            return;
        }
        try {
            const student = await Api.get(Endpoints.students.verifyStudent(membershipId));
            this.currentStudent = student;
            this.currentStudentWarning = null;
            this.render(student);
        } catch (error) {
            console.error(error);
            this.currentStudent = null;
            this.currentStudentWarning = null;
            alert(error.message || "Something went wrong.");
        }
    },

    openDetail() {
        const input = document.getElementById("verifyMembershipId");
        const membershipId = input?.value?.trim();
        if (!membershipId) {
            alert("Please enter Student ID.");
            input?.focus();
            return;
        }
        window.open(`/student-details.html?id=${membershipId}`, "_blank", "noopener,noreferrer");
    },

    render(student) {
        if (!student) {
            return;
        }
        this.currentStudent = student;
        const result = document.getElementById("verifyStudentResult");
        if (!result) {
            return;
        }
        this.setValue("resultLibraryName", getConfigurations()?.LIBRARY_NAME ?? "-");
        this.setValue("resultStudentName", student.fullName ?? "-");
        this.setValue("resultStudentId", student.studentId ?? "-");
        this.setValue("resultBatch", student.batchName ?? "-");
        this.setValue("resultSeat", student.seatNumber ?? "-");
        this.setValue("resultTillDate", student.tillDate ? formatDate(student.tillDate) : "-");
        this.setValue("resultMobile", student.mobileNumber ?? "-");
        this.setValue("resultPendingApproval", student.pendingCount ?? "0");
        const status = String(student.enrollmentStatus ?? "-").toUpperCase();
        const statusElement = document.getElementById("resultStatus");
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `student-result-status ${status.toLowerCase()}`;
        }
        const issuesSection = document.getElementById("studentIssues");
        const actionsSection = document.getElementById("studentActions");
        if (issuesSection) {
            issuesSection.style.display = "none";
        }
        if (actionsSection) {
            actionsSection.style.display = "none";
        }
        // ✅ TERMINATED STUDENT
        if (status.toUpperCase() !== "TERMINATED") {
            if (issuesSection) {
                issuesSection.style.display = "";
            }
            if (actionsSection) {
                actionsSection.style.display = "";
            }
            const issues = this.renderIssues(student);
            this.renderActions(student, issues);
        }
        result.style.display = "block";
    },

    setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? "-";
        }
    },

    renderIssues(student) {
        const summary = document.getElementById("issuesSummary");
        const list = document.getElementById("studentIssuesList");
        if (!summary || !list) {
            return [];
        }

        const issues = [];
        const status = String(student.enrollmentStatus ?? "").toUpperCase();
        // 1. Enrollment status
        if (status !== "ACTIVE") {
            issues.push({
                type: "STATUS",
                title: "Status",
                value: status || "-"
            });
        }

        // 2. Last fee / validity date
        if (student.tillDate) {
            const tillDate = new Date(student.tillDate);
            const today = new Date();
            tillDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const difference = today.getTime() - tillDate.getTime();
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            if (days > 0) {
                issues.push({
                    type: "EXPIRED",
                    title: "Last Date",
                    value: formatDate(student.tillDate),
                    subtext:
                        `${days} day${days === 1 ? "" : "s"} ago`
                });
            }
        }

        // 3. Batch timing
        const batchIssue = getBatchTimingIssue(student);
        if (batchIssue) {
            issues.push({
                type: "BATCH_TIMING",
                title: "Batch Timing",
                value: batchIssue
            });
        }

        // 4. Pending fees
        const pendingAmount = Number(student.pendingAmount ?? 0);

        if (pendingAmount > 0) {
            issues.push({
                type: "PENDING_FEES",
                title: "Pending Fees",
                value: `₹${pendingAmount.toLocaleString("en-IN")}`
            });
        }

        // No issues
        if (!issues.length) {
            summary.className = "issues-summary good";
            summary.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            All Good
        `;
            list.innerHTML = "";
            return issues;
        }

        // Issues found
        summary.className = "issues-summary warning";
        summary.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Something Wrong
    `;

        list.innerHTML = issues.map((issue, index) => `
        <div class="issue-item warning">
            <strong>
                ${index + 1}. ${escape(issue.title)}:
            </strong>
            ${escape(issue.value)}
            ${
                issue.subtext
                    ? `
                        <span class="issue-subtext">
                            ${escape(issue.subtext)}
                        </span>
                      `
                    : ""
            }
        </div>
    `
        ).join("");
        return issues;
    },

    renderActions(student, issues = []) {
        const summary = document.getElementById("actionsSummary");
        const list = document.getElementById("studentActionsList");
        if (!summary || !list) {
            return;
        }
        list.innerHTML = "";

        // ================================
        // NO ISSUES
        // ================================
        if (!issues.length) {
            summary.className = "actions-summary";
            summary.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            No Action Required
        `;
            list.innerHTML = `
            <div class="actions-empty">
                <i class="fa-solid fa-check"></i>
                No action is required for this student.
            </div>
        `;
            return;
        }

        // ================================
        // ACTION REQUIRED
        // ================================
        summary.className = "actions-summary issue";
        summary.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Action Required
    `;
        const actions = [];
        const studentId = student.studentId;

        // --------------------------------
        // STATUS
        // --------------------------------
        if (issues.some(issue => issue.type === "STATUS")) {
            const status = String(student.enrollmentStatus ?? "").toUpperCase();
            if ((status === "EXPIRED") || (status === "DISCONTINUED")){
                actions.push({
                    type: "UPDATE_FEE",
                    label: "Update Fee",
                    icon: "fa-calendar-plus",
                    className: "primary"
                });
            } else {
                actions.push({
                    type: "VIEW_DETAILS",
                    label: "View Details",
                    icon: "fa-user",
                    className: "primary"
                });
            }
        }

        // --------------------------------
        // PENDING FEES
        // --------------------------------
        if (issues.some(issue => issue.type === "PENDING_FEES")) {
            actions.push({
                type: "CLEAR_PENDINGS",
                label: "Clear Pending Fees",
                icon: "fa-money-bill-transfer",
                className: "warning"
            });
        }

        // --------------------------------
        // BATCH TIMING
        // --------------------------------
        if (issues.some(issue => issue.type === "BATCH_TIMING")) {
            actions.push({
                type: "ADD_WARNING",
                label: "Add Warning",
                icon: "fa-circle-exclamation",
                className: "warning"
            });
        }

        // --------------------------------
        // ALWAYS AVAILABLE
        // --------------------------------
        if (studentId) {
            actions.push({
                type: "VIEW_DETAILS",
                label: "Open Student Details",
                icon: "fa-user",
                className: ""
            });
        }
        // Remove duplicate actions
        const uniqueActions = actions.filter((action, index, array) => array.findIndex(a => a.type === action.type) === index);

        // --------------------------------
        // RENDER
        // --------------------------------
        list.innerHTML = uniqueActions.map(action => `
        <button type="button" class="student-action-btn ${action.className}" data-action="${escape(action.type)}">
            <i class="fa-solid ${escape(action.icon)}"></i>
            ${escape(action.label)}
        </button>
    `
        ).join("");

        // --------------------------------
        // CLICK HANDLERS
        // --------------------------------
        list.querySelectorAll(".student-action-btn").forEach(button => {
            button.addEventListener("click", () => {
                    this.handleStudentAction(
                        button.dataset.action,
                        student
                    );
                }
            );
        });
    },

    handleStudentAction(action, student) {
        if (!student) {return;}
        const studentId = student.studentId;
        switch (action) {
            case "UPDATE_FEE":
                updateFees(this.currentStudent.studentId, this.currentStudent);
                break;
            case "CLEAR_PENDINGS":
                this.clearPendingFees()
                break;
            case "ADD_WARNING":
                this.getStudentWarning()
                break;
            case "VIEW_DETAILS":
                if (studentId) {
                    window.open(`/student-details.html?id=${encodeURIComponent(studentId)}`, "_blank");
                }
                break;
            default:
                console.warn("Unknown student action:", action);
        }
    },

    async clearPendingFees() {
        const pendingAmount = this.currentStudent.pendingAmount ?? 0;
        var transactionId = null;
        var paymentMode = "CASH"
        if (!confirm(`Did you receive amount of ₹${pendingAmount}`)) {
            return;
        }
        if (!confirm("Is this transaction is cash")) {
            paymentMode = "ONLINE";
        }
        if (paymentMode === "ONLINE") {
            transactionId = prompt("Enter Transaction Id.");
            if (!transactionId || !transactionId.trim()) {
                alert("Transaction Id is required");
                return;
            }
        }
        const remarks = `Clear Pending:
                                Removed Pending Amount: ${pendingAmount ?? "-"}
                                PaymentMode: ${paymentMode}`;
        const payload = {
            studentId: this.currentStudent?.studentId,
            pendingAmount: 0,
            paymentMode: paymentMode,
            transactionId: transactionId,
            remarks: remarks,
            requestedBy: Session.getUserId()
        };
        try {
            let endPoint = Endpoints.manager.createRequest("PENDING_FEES")
            if(Session.isAdmin()) {
                endPoint = Endpoints.admin.clearPendingRequest
            }
            await Api.post(
                endPoint,
                payload
            );
            let msg = Session.isAdmin() ? "✅ Pending Cleared successfully" : "✅ Clear Pending request sent for approval";
            alert(msg);
            await this.verify();
        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    },

    async showAddWarning() {
        const student = this.currentStudent;

        const html = `
        <div class="modal-content student-warning-modal">

            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Add Warning
                </h2>

                <button
                    type="button"
                    onclick="VerifyStudent.closeModal()">
                    ✕
                </button>
            </div>

            <div class="modal-body">

                <div class="student-update-summary">

                    <div class="summary-item">
                        <label>Membership ID</label>
                        <strong>
                            ${student?.studentId ?? "-"}
                        </strong>
                    </div>

                    <div class="summary-item">
                        <label>Student</label>
                        <strong>
                            ${student?.fullName ?? "-"}
                        </strong>
                    </div>

                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="verifyWarningLevel">
                            Warning Level
                        </label>

                        <select id="verifyWarningLevel">
                            ${this.getWarningLevelOptions()}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="verifyWarningCategory">
                            Category
                        </label>

                        <select id="verifyWarningCategory">
                            <option value="">
                                -- Select Category --
                            </option>
                            <option value="DISCIPLINE">Discipline</option>
                            <option value="TIMING">Timing</option>
                            <option value="ATTENDANCE">Attendance</option>
                            <option value="NOISE">Noise</option>
                            <option value="MISCONDUCT">Misconduct</option>
                            <option value="PROPERTY">Property</option>
                            <option value="SEAT">Seat</option>
                            <option value="LIBRARY_RULE">Library Rule</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                </div>

                <div class="form-group">
                    <label for="verifyWarningDescription">
                        Description
                    </label>
                
                    <textarea
                        id="verifyWarningDescription"
                        rows="5"
                        placeholder="Enter reason for warning..."
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label for="verifyWarningActionTaken">
                        Action Taken
                    </label>
                
                    <textarea
                        id="verifyWarningActionTaken"
                        rows="4"
                        placeholder="Enter action taken..."
                    ></textarea>
                </div>

                <div
                    id="verifyWarningModalMessage"
                    class="update-batch-modal-message">
                </div>

            </div>

            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="VerifyStudent.closeModal()">
                    Cancel
                </button>

                <button
                    type="button"
                    class="primary-btn"
                    id="verifySaveWarningBtn"
                    onclick="VerifyStudent.saveWarning()">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Add Warning
                </button>

            </div>

        </div>
    `;

        this.openModal(html);
    },

    getNextWarningLevel() {
        const warnings = this.currentStudentWarning ?? [];
        const activeWarnings = warnings.filter(warning => !warning.cancelledAt);
        const hasFirstWarning = activeWarnings.some(warning => String(warning.warningLevel).toUpperCase() === "FIRST_WARNING");
        const hasSecondWarning = activeWarnings.some(warning => String(warning.warningLevel).toUpperCase() === "SECOND_WARNING");
        const hasFinalWarning = activeWarnings.some(warning => String(warning.warningLevel).toUpperCase() === "FINAL_WARNING");
        const hasTerminate = activeWarnings.some(warning => String(warning.warningLevel).toUpperCase() === "TERMINATE");
        // Already terminated
        if (hasTerminate) {
            return null;
        }
        // Final warning already exists
        if (hasFinalWarning) {
            return "TERMINATE";
        }
        // Second warning already exists
        if (hasSecondWarning) {
            return "FINAL_WARNING";
        }
        // First warning already exists
        if (hasFirstWarning) {
            return "SECOND_WARNING";
        }
        // No warning exists
        return "FIRST_WARNING";
    },

    getWarningLevelLabel(level) {
        const labels = {
            FIRST_WARNING: "First Warning",
            SECOND_WARNING: "Second Warning",
            FINAL_WARNING: "Final Warning",
            TERMINATE: "Terminate"
        };
        return labels[level] ?? level;
    },

    getWarningLevelOptions() {
        const nextLevel = this.getNextWarningLevel();
        if (!nextLevel) {
            return `
            <option value="">
                No further action available
            </option>
        `;
        }
        return `
        <option value="${nextLevel}" selected>
            ${this.getWarningLevelLabel(nextLevel)}
        </option>
    `;
    },

    async saveWarning() {
        const student = this.currentStudent;
        if (!student?.studentId) {
            alert("Student information is not available.");
            return;
        }
        const warningLevel = document.getElementById("verifyWarningLevel")?.value;
        const category = document.getElementById("verifyWarningCategory")?.value;
        const description = document.getElementById("verifyWarningDescription")?.value.trim();
        const actionTaken = document.getElementById("verifyWarningActionTaken")?.value.trim();
        if (!warningLevel) {
            alert("Please select warning level.");
            return;
        }
        if (!category) {
            alert("Please select warning category.");
            return;
        }
        if (!description) {
            alert("Please enter warning description.");
            return;
        }
        const payload = {
            studentId: student.studentId,
            warningLevel,
            category,
            description,
            actionTaken,
            issuedBy: Session.getUserId(),
            issuedByName: Session.getUserName()
        };

        if (!confirm(printPayload(payload))) {
            return;
        }
        try {
            await Api.post(Endpoints.students.addWarning, payload);
            alert("✅ Warning added successfully");
            VerifyStudent.closeModal();
            await this.verify();
        } catch (err) {
            console.error("Failed to add warning:", err);
            alert(err?.message || "Failed to add warning.");
        }
    },

    openModal(html) {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },

    closeModal() {
        document.querySelector(".modal-overlay")?.remove();
    }
};