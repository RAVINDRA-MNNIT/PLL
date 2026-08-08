/**
 * student-actions.js
 * Fully self-contained action system (NO external modal dependency)
 */

window.StudentActionsUI = {

    container: null,
    student: null,
    modal: null,
    studentId: null,

    init(containerId, studentData) {
        this.container = document.getElementById(containerId);
        this.student = studentData;

        if (!this.container) {
            console.error("❌ Actions container not found");
            return;
        }

        console.log("Student data" + studentData)
        console.log("Student id" + studentData?.studentId)
        this.studentId = studentData?.studentId;

        this.ensureModalRoot(); // ✅ important
        this.render();
        this.bindEvents();
    },

    // ================= UI =================

    render() {
        const showSeat = this.isSeatApplicable();

        this.container.innerHTML = `
            ${this.button("feeHistory", "fa-clock-rotate-left", "Fee Records")}
            ${this.button("updateDetails", "fa-user-pen", "Update Details")}
            ${showSeat ? this.button("changeSeat", "fa-chair", "Change Seat") : ""}
            ${this.button("updateStatus", "fa-user-check", "Update Enrollment Status")}
        `;
    },

    button(action, icon, label) {
        return `
            <button class="primary-btn" data-action="${action}">
                <i class="fa-solid ${icon}"></i>
                ${label}
            </button>
        `;
    },

    // ================= EVENTS =================

    bindEvents() {
        this.container.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            const action = btn.dataset.action;
            console.log("Action clicked:", action);

            switch (action) {
                case "feeHistory":
                    this.showFeeHistory();
                    break;

                case "updateDetails":
                    this.showUpdateDetails();
                    break;

                case "changeSeat":
                    this.showChangeSeat();
                    break;

                case "updateStatus":
                    this.showUpdateStatus();
                    break;
            }
        });
    },

    // ================= MODAL SYSTEM =================

    ensureModalRoot() {
        let modal = document.getElementById("appModal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "appModal";
            modal.style = `
                position:fixed;
                top:0;
                left:0;
                width:100%;
                height:100%;
                background:rgba(0,0,0,0.5);
                display:none;
                justify-content:center;
                align-items:center;
                z-index:9999;
            `;

            modal.innerHTML = `
                <div id="appModalContainer"
                     style="background:#fff;padding:20px;border-radius:8px;max-height:80%;overflow:auto;min-width:300px;">
                </div>
            `;

            document.body.appendChild(modal);
        }

        this.modal = modal;
    },

    openModal(html) {
        const container = document.getElementById("appModalContainer");
        container.innerHTML = html;
        this.modal.style.display = "flex";
    },

    closeModal() {
        this.modal.style.display = "none";
    },

    modalWrapper(title, content) {
        return `
            <div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>${title}</h3>
                    <button onclick="StudentActionsUI.closeModal()">❌</button>
                </div>
                <hr/>
                ${content}
            </div>
        `;
    },

    // ================= ACTIONS =================

showFeeHistory() {

    const feeRecords = this.student?.feeRecords ?? [];

    let bodyContent = "";

    if (feeRecords.length === 0) {
        bodyContent = `
            <p style="padding:20px;text-align:center">
                No Fee Records Found.
            </p>
        `;
    } else {

        let rows = "";

        feeRecords.forEach((r, i) => {
            rows += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${r.batchName ?? "-"}</td>
                    <td>${r.seatNumber ?? "-"}</td>
                    <td>
                        ${formatDate(r.membershipFrom)}<br>
                        <small>to</small><br>
                        ${formatDate(r.membershipTill)}
                    </td>
                    <td>₹${Number(r.submittedAmount ?? 0).toLocaleString("en-IN")}</td>
                    <td>₹${Number(r.discountAmount ?? 0).toLocaleString("en-IN")}</td>
                    <td>₹${Number(r.pendingAmount ?? 0).toLocaleString("en-IN")}</td>
                    <td>${r.paymentMode ?? "-"}</td>
                    <td>${r.transactionId ?? "-"}</td>
                    <td>${formatDate(r.createdAt)}</td>
                </tr>
            `;
        });

        bodyContent = `
            <table class="fee-history-table" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Batch</th>
                        <th>Seat</th>
                        <th>Membership</th>
                        <th>Submitted</th>
                        <th>Discount</th>
                        <th>Pending</th>
                        <th>Payment</th>
                        <th>Transaction Id</th>
                        <th>Created On</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    const html = `
        <div class="modal-content" style="max-width:1200px; padding:0;">

            <div class="modal-header" style="padding:16px 20px;">
                <h2>
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Fee Records
                </h2>
                <button onclick="StudentActionsUI.closeModal()">✕</button>
            </div>

            <div id="feeHistoryBody"
                 class="modal-body"
                 style="padding:20px; max-height:70vh; overflow:auto;">
                 
                ${bodyContent}

            </div>

        </div>
    `;

    this.openModal(html);
},

showUpdateDetails() {

    const html = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-user-pen"></i>
                    Update Student Details
                </h2>
                <button onclick="StudentActionsUI.closeModal()">✕</button>
            </div>

            <div class="modal-body">

                <div id="updateStudentMessage" class="form-message"></div>

                <div class="form-group">
                    <label>Full Name</label>
                    <input id="updateFullName" type="text"
                        value="${this.student.fullName ?? ""}">
                </div>

                <div class="form-group">
                    <label>Mobile Number</label>
                    <input id="updateMobileNumber" type="tel"
                        value="${this.student.mobileNumber ?? ""}">
                </div>

                <div class="form-group">
                    <label>Guardian Number</label>
                    <input id="updateGuardianNumber" type="tel"
                        value="${this.student.guardianNumber ?? ""}">
                </div>

            </div>

            <div class="modal-footer">
                <button class="secondary-btn"
                        onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>

                <button class="primary-btn"
                        onclick="StudentActionsUI.saveStudentDetails()">
                    Save Changes
                </button>
            </div>
        </div>
    `;

    this.openModal(html);
},
async showChangeSeat() {

    await loadLookups();

    let options = `<option value="">-- Select Seat --</option>`;

    window.libraryLookups?.seats?.forEach(seat => {
        options += `
            <option value="${seat.id}">
                ${seat.seatNumber}
            </option>
        `;
    });

    const html = `
        <div class="modal-content" style="max-width:500px;">

            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-chair"></i>
                    Change Seat
                </h2>
                <button onclick="StudentActionsUI.closeModal()">✕</button>
            </div>

            <div class="modal-body">

                <div id="changeSeatMessage" class="form-message"></div>

                <div class="form-group">
                    <label>Seat Number</label>
                    <select id="newSeatId">
                        ${options}
                    </select>
                </div>

            </div>

            <div class="modal-footer">

                <button class="secondary-btn"
                        onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>

                <button class="primary-btn"
                        onclick="StudentActionsUI.saveSeatChange()">
                    Update Seat
                </button>

            </div>

        </div>
    `;

    this.openModal(html);
},

showUpdateStatus() {

    const html = `
        <div class="modal-content" style="max-width:500px;">

            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-user-check"></i>
                    Update Enrollment Status
                </h2>
                <button onclick="StudentActionsUI.closeModal()">✕</button>
            </div>

            <div class="modal-body">

                <div class="form-group">
                    <label>Enrollment Status</label>

                    <select id="newEnrollmentStatus">
                        <option value="">-- Select Status --</option>
                        <option value="DISCONTINUED">Discontinued</option>
                        <option value="TERMINATED">Terminated</option>
                    </select>
                </div>

            </div>

            <div class="modal-footer">

                <button class="secondary-btn"
                        onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>

                <button class="primary-btn"
                        onclick="StudentActionsUI.saveEnrollmentStatus()">
                    Update Status
                </button>

            </div>

        </div>
    `;

    this.openModal(html);
},

    // ================= HELPERS =================

    isSeatApplicable() {
        const last = this.student?.feeRecords?.at(-1);
        if (!last?.batchName) return false;

        const name = last.batchName.toUpperCase();
        return name.includes("FULL DAY") || name.includes("24 HOURS");
    },

// ================= SAVE: UPDATE DETAILS =================

    async saveStudentDetails() {

        const fullName = document.getElementById("updateFullName")?.value.trim();
        const mobile = document.getElementById("updateMobileNumber")?.value.trim();
        const guardian = document.getElementById("updateGuardianNumber")?.value.trim();

        if (!fullName) {
            alert("Full name is required");
            return;
        }

        if (!/^[0-9]{10}$/.test(mobile)) {
            alert("Enter valid 10-digit mobile number");
            return;
        }

        if (guardian && !/^[0-9]{10}$/.test(guardian)) {
            alert("Enter valid guardian number");
            return;
        }


        const payload = {
            fullName,
            mobileNumber: mobile,
            guardianNumber: guardian
        };

        try {
            await Api.post(
                Endpoints.pending.updateStudent(this.studentId),
                payload
            );

            alert("✅ Request sent for approval");
            StudentActionsUI.closeModal();

        } catch (err) {
            console.error(err);
            alert("❌ Failed to update student");
        }
    },

    async saveSeatChange() {

        const seatId = document.getElementById("newSeatId")?.value;

        if (!seatId) {
            alert("Please select a seat");
            return;
        }

        const studentId = this.studentId;

        const payload = {
            seatId: Number(seatId)
        };

        try {
            await Api.post(
                Endpoints.pending.updateSeat(this.studentId),
                payload
            );

            alert("✅ Seat change request sent for approval");
            StudentActionsUI.closeModal();

        } catch (err) {
            console.error(err);
            alert("❌ Failed to update seat");
        }
    },

    async saveEnrollmentStatus() {
        const status = document.getElementById("newEnrollmentStatus")?.value;

        if (!status) {
            alert("Please select status");
            return;
        }

        const payload = {
            enrollmentStatus: status
        };

        try {
            await Api.post(
                Endpoints.pending.updateEnrollmentStatus(this.studentId),
                payload
            );

            alert("✅ Status update request sent for approval");
            StudentActionsUI.closeModal();

        } catch (err) {
            console.error(err);
            alert("❌ Failed to update status");
        }
    }
};