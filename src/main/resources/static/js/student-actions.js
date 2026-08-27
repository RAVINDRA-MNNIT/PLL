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
            return;
        }

        this.studentId = studentData?.studentId;

        this.ensureModalRoot(); // ✅ important
        this.render();
        this.bindEvents();
    },

    // ================= UI =================

    // render() {
    //     const showSeat = this.isSeatApplicable();
    //
    //     this.container.innerHTML = `
    //         ${this.button("feeHistory", "fa-clock-rotate-left", "Fee Records")}
    //         ${this.button("updateDetails", "fa-user-pen", "Update Details")}
    //         ${showSeat ? this.button("changeSeat", "fa-chair", "Change Seat") : ""}
    //         ${this.button("updateStatus", "fa-user-check", "Update Enrollment Status")}
    //     `;
    // },

    button(action, icon, label) {
        return `
            <button class="primary-btn" data-action="${action}">
                <i class="fa-solid ${icon}"></i>
                ${label}
            </button>
        `;
    },

    render() {
        debugger;
        const showSeat = this.isSeatApplicable();
        const isAdmin = Session.isAdmin();
        const isStudent = Session.isStudent();
        const isManager = Session.isManager()
        const isTerminated = this.student?.enrollmentStatus === "TERMINATED";
        const last = this.student?.feeRecords?.at(0);
        const diffDays = getDateDifferenceInDays(new Date(), last.tillDate)
        let html = this.button("feeHistory", "fa-clock-rotate-left", "Fee Records");

        if (isTerminated) {
            if (isAdmin) {
                html += this.button("updateStatus", "fa-user-check", "Update Enrollment Status");
            }
        } else {
            if (isAdmin || isManager) {
                html += this.button("updateDetails", "fa-user-pen", "Update Details");
                if (showSeat) {
                    html += this.button("changeSeat", "fa-chair", "Change Seat");
                }
                html += this.button("updateStatus", "fa-user-check", "Update Enrollment Status");
            } else if (isStudent) {
                html += this.button("updateStatus", "fa-user-check", "Update Enrollment Status");
                if (!(diffDays > 3)) {
                    html += this.button("updateFees", "fa-solid fa-money-bill-transfer", "Fees Update Request");
                }
            }
        }
        this.container.innerHTML = html;
    },

    // ================= EVENTS =================

    bindEvents() {
        this.container.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            const action = btn.dataset.action;
            switch (action) {
                case "feeHistory":
                    this.showFeeHistory();
                    break;

                case "updateDetails":
                    this.showUpdateDetails(this.student.enrollmentStatus);
                    break;

                case "changeSeat":
                    this.showChangeSeat(this.student.enrollmentStatus);
                    break;

                case "updateStatus":
                    this.showUpdateStatus(this.student.enrollmentStatus);
                    break;
                case "updateFees":
                    this.showFeeUpdate();
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
                        ${formatDate(r.fromDate)}<br>
                        <small>to</small><br>
                        ${formatDate(r.tillDate)}
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

showUpdateDetails(currentStatus) {
    if (currentStatus === "TERMINATED") {
        alert("You should not change the details of student if current status is terminated")
        return;
    }
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
async showChangeSeat(currentStatus) {
    if (currentStatus === "TERMINATED") {
        alert("You should not change the seat of student if current status is terminated")
        return;
    }
    const seats = await filteredSeat(this.studentId);

    let options = `<option value="">-- Select Seat --</option>`;
    seats?.forEach(seat => {
        options += `
            <option 
                value="${seat.id}" 
                data-seat="${seat.seatNumber}">
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

showUpdateStatus(currentStatus) {
    let options = `<option value="">-- Select Status --</option>`;

    // Admin can reactivate terminated students
    if (currentStatus === "TERMINATED") {
        if (Session.isAdmin()) {
            options += `<option value="ACTIVE">Active</option>`;
        } else {
            alert("Only Admin can update the status in case of student is terminated !")
            return
        }
    } else {
        if (Session.isStudent()) {
            options += `<option value="DISCONTINUED">Discontinued</option>`;
        } else {
            // Normal status changes
            if (currentStatus === "DISCONTINUED") {
                options += `<option value="ACTIVE">Active</option>`;
            }

            if (currentStatus !== "DISCONTINUED") {
                options += `<option value="DISCONTINUED">Discontinued</option>`;
            }

            if (currentStatus !== "TERMINATED") {
                options += `<option value="TERMINATED">Terminated</option>`;
            }
        }
    }
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
                        onclick="StudentActionsUI.saveEnrollmentStatus()">
                    Update Status
                </button>

            </div>

        </div>
    `;

    this.openModal(html);
},

    async showFeeUpdate() {
        if (!confirm("As a student you cannot change anything like batch, seat, amount everything will be same as your previous fee record \n and only one month fees you can update. \n\n Do you want to want to continue?")) {
            return;
        }
        if (!this.confirmFeeUpdate()) {
            return;
        }

        const transactionId = prompt("Enter Transaction Id, \n\n !!!Make sure not to repeat previous transaction id, In case of duplicate transaction id, your registration might be cancel:");
        if (!transactionId || !transactionId.trim()) {
            alert("Transaction Id is required");
            return;
        }

        const last = this.student?.feeRecords?.at(0);

        const newTill = new Date(last.tillDate);
        const day = newTill.getDate();
        newTill.setDate(1);
        newTill.setMonth(newTill.getMonth() + 1);
        const lastDay = new Date(
            newTill.getFullYear(),
            newTill.getMonth() + 1,
            0
        ).getDate();
        newTill.setDate(Math.min(day, lastDay));

        const payload = {
            studentId: this.studentId ,
            batchId: last.batchId,
            seatId: last.seatId,
            fromDate: last.tillDate,
            tillDate: newTill.toISOString().split("T")[0],
            submittedAmount: last.submittedAmount,
            pendingAmount: last.pendingAmount ?? 0,
            discount: last.discount ?? last.discountAmount ?? 0,
            paymentMode: "ONLINE",
            transactionId: transactionId,
            requestedBy: Session.getUserId()
        };

        if (!confirm(printPayload(payload))) {
            return
        }

        try {
            await Api.post(Endpoints.manager.createRequest("FEES"), payload);
            alert("Fee request submitted successfully.");
        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    },

    // ================= HELPERS =================

    isSeatApplicable() {
        const last = this.student?.feeRecords?.at(0);
        if (!last?.batchName) return false;
        if (getUpdatedEnrollment(Date(), last.tillDate, this.student?.enrollmentStatus) != "ACTIVE") return false;
        const name = last.batchName.toUpperCase();
        return name.includes("FULL DAY") || name.includes("24 HOURS");
    },

    confirmFeeUpdate() {
        const last = this.student?.feeRecords?.at(0);

        const newTill = new Date(last.tillDate);
        const day = newTill.getDate();
        newTill.setDate(1);
        newTill.setMonth(newTill.getMonth() + 1);
        const lastDay = new Date(
            newTill.getFullYear(),
            newTill.getMonth() + 1,
            0
        ).getDate();
        newTill.setDate(Math.min(day, lastDay));

        const message = `
        Please review before request.
        Student ID : ${this.studentId}
        Student Name  : ${this.student.fullName}
        Batch          : ${last.batchName}
        Seat           : ${last.seatNumber}
        Next From Date: ${formatDate(last.tillDate)}
        Next Till Date: ${formatDate(newTill)}
        Pay Amount     : ₹${last.submittedAmount}
        Pending Amount : ₹${last.pendingAmount}
        Payment Mode   : Online
        Do you want to continue?
                        `;
        return confirm(message);
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

        const isUnchanged =
            fullName === (this.student.fullName || "") &&
            mobile === (this.student.mobileNumber || "") &&
            guardian === (this.student.guardianNumber || "");

        if (isUnchanged) {
            alert("No changes detected");
            return;
        }


        const payload = {
            fullName,
            mobileNumber: mobile,
            guardianNumber: guardian,
            studentId: this.studentId,
            requestedBy: Session.getUserId()
        };
        console.log("url" + Endpoints.manager.createRequest("DETAILS"));
        try {
            let endPoint = Endpoints.manager.createRequest("DETAILS")
            if(Session.isAdmin()) {
                endPoint = Endpoints.admin.updateStudent
            }
            await Api.post(
                endPoint,
                payload
            );
            let msg = Session.isAdmin() ? "✅ Student detail changed successfully" : "✅ Student detail change request sent for approval";
            alert(msg);
            StudentActionsUI.closeModal();
            if (Session.isAdmin()) {
                await StudentDetailsPage.loadStudent(this.studentId);
            }
        } catch (err) {
            console.error(err);
        }
    },

    async saveSeatChange() {

        const select = document.getElementById("newSeatId");
        const option = select.options[select.selectedIndex];
        const seatId = select.value;
        const seatNumber = option.dataset.seat;

        if (!seatId) {
            alert("Please select a seat");
            return;
        }

        const studentId = this.studentId;

        const payload = {
            seatId: Number(seatId),
            seatNumber: seatNumber,
            studentId: this.studentId,
            requestedBy: Session.getUserId()
        };

        try {
            let endPoint = Endpoints.manager.createRequest("SEAT")
            if(Session.isAdmin()) {
                endPoint = Endpoints.admin.updateSeat
            }
            await Api.post(
                endPoint,
                payload
            );
            let msg = Session.isAdmin() ? "✅ Seat changed successfully" : "✅ Seat change request sent for approval";
            alert(msg);
            StudentActionsUI.closeModal();
            if (Session.isAdmin()) {
                await StudentDetailsPage.loadStudent(this.studentId);
            }
        } catch (err) {
            console.error(err);
        }
    },

    async saveEnrollmentStatus() {
        const status = document.getElementById("newEnrollmentStatus")?.value;

        if (!status) {
            alert("Please select status");
            return;
        }
        let message = `Are you to update status as ${status}?`;
        if (status.toUpperCase() == "TERMINATED") {
            if (!Session.isAdmin()) {
                message = `Are you to update status as ${status}?\n\n After termination this students can become active only admin`;
            }
        }

        if (!confirm(message)) {
            return;
        }

        const payload = {
            enrollmentStatus: status,
            studentId: this.studentId,
            requestedBy: Session.getUserId()
        };

        try {
            let endPoint = Endpoints.manager.createRequest("ENROLLMENT")
            if(Session.isAdmin()) {
                endPoint = Endpoints.admin.updateEnrollmentStatus
            }
            await Api.post(
                endPoint,
                payload
            );

            let msg = Session.isAdmin() ? "✅ Status changed successfully" : "✅ Status change request sent for approval";
            alert(msg);
            StudentActionsUI.closeModal();
            if (Session.isAdmin()) {
                await StudentDetailsPage.loadStudent(this.studentId);
            }
        } catch (err) {
            console.error(err);
        }
    }
};