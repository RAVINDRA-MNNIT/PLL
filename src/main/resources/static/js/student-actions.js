/**
 * student-actions.js
 * Fully self-contained action system (NO external modal dependency)
 */

window.StudentActionsUI = {

    container: null,
    student: null,
    modal: null,
    studentId: null,
    UPDATE_FULL_DETAIL: true,


    init(containerId, studentData) {
        this.container = document.getElementById(containerId);
        this.student = studentData;

        if (!this.container) {
            return;
        }
        this.studentId = studentData?.studentId;
        this.UPDATE_FULL_DETAIL = this.getConfigurations().UPDATE_FULL_DETAIL ?? false;
        this.ensureModalRoot(); // ✅ important
        this.render();
        this.bindEvents();
    },

    // ================= UI =================

    button(action, icon, label) {
        return `
            <button class="primary-btn" data-action="${action}">
                <i class="fa-solid ${icon}"></i>
                ${label}
            </button>
        `;
    },

    getConfigurations() {
        const configurations = JSON.parse(
            sessionStorage.getItem("configurations")
        );
        console.log(configurations)
        return configurations;
    },

    render() {

        const STUDENT_DETAIL_UPDATE_ENABLE = this.getConfigurations().STUDENT_DETAIL_UPDATE_ENABLE ?? false;
        const STUDENT_FEE_UPDATE_ENABLE = this.getConfigurations().STUDENT_FEE_UPDATE_ENABLE ?? false;
        const STUDENT_SEAT_UPDATE_ENABLE = this.getConfigurations().STUDENT_SEAT_UPDATE_ENABLE ?? false;
debugger;
        const showSeat = this.isSeatApplicable();
        const isAdmin = Session.isAdmin();
        const isStudent = Session.isStudent();
        const isManager = Session.isManager()
        const isTerminated = this.student?.enrollmentStatus === "TERMINATED";
        const last = this.student?.lastFee;
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
                if (STUDENT_DETAIL_UPDATE_ENABLE) {
                    html += this.button("updateDetails", "fa-user-pen", "Update Details");
                }
                if (STUDENT_SEAT_UPDATE_ENABLE) {
                    if (showSeat) {
                        html += this.button("changeSeat", "fa-chair", "Change Seat");
                    }
                }
                html += this.button("updateStatus", "fa-user-check", "Update Enrollment Status");
                if (STUDENT_FEE_UPDATE_ENABLE) {
                    if (!(diffDays > 3)) {
                        html += this.button("updateFees", "fa-solid fa-money-bill-transfer", "Fees Update Request");
                    }
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

    async showFeeHistory() {
        try {
            let feeRecords = await Api.get(Endpoints.students.feeHistory(this.studentId));
            this.renderFeeHistory(feeRecords);
        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    },

    renderFeeHistory(feeRecords) {

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
            alert("You should not change the details of student if current status is terminated");
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
                    <input id="updateFullName"
                           type="text"
                           value="${this.student.fullName ?? ""}">
                </div>

                <div class="form-group">
                    <label>Mobile Number</label>
                    <input id="updateMobileNumber"
                           type="tel"
                           maxlength="10"
                           value="${this.student.mobileNumber ?? ""}">
                </div>

                <div class="form-group">
                    <label>Guardian Number</label>
                    <input id="updateGuardianNumber"
                           type="tel"
                           maxlength="10"
                           value="${this.student.guardianNumber ?? ""}">
                </div>

                ${this.UPDATE_FULL_DETAIL ? `
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input id="updateDateOfBirth"
                               type="date"
                               value="${this.student.dateOfBirth ?? ""}">
                    </div>

                    <div class="form-group">
                        <label>Father Name</label>
                        <input id="updateFatherName"
                               type="text"
                               value="${this.student.fatherName ?? ""}">
                    </div>

                    <div class="form-group">
                        <label>Aadhaar Number</label>
                        <input id="updateAadhaarNumber"
                               type="text"
                               maxlength="12"
                               value="${this.student.aadhaarNumber ?? ""}"
                               ${
            Session.isStudent() &&
            this.student.aadhaarNumber?.trim()
                ? "disabled"
                : ""
        }>
                    </div>

                    <div class="form-group">
                        <label>Local Address</label>
                        <textarea id="updateLocalAddress"
                                  rows="3">${this.student.localAddress ?? ""}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Permanent Address</label>
                        <textarea id="updatePermanentAddress"
                                  rows="3">${this.student.permanentAddress ?? ""}</textarea>
                    </div>
                ` : ""}

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

        const last = this.student?.lastFee;

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
        const last = this.student?.lastFee;
        if (!last?.batchName) return false;
        if (getUpdatedEnrollment(Date(), last.tillDate, this.student?.enrollmentStatus) != "ACTIVE") return false;
        const name = last.batchName.toUpperCase();
        return name.includes("FULL DAY") || name.includes("24 HOURS");
    },

    confirmFeeUpdate() {
        const last = this.student?.lastFee;

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

        const dateOfBirth = document.getElementById("updateDateOfBirth")?.value || null;
        const fatherName = document.getElementById("updateFatherName")?.value.trim() || "";
        const aadhaarNumber = document.getElementById("updateAadhaarNumber")?.value.trim() || "";
        const localAddress = document.getElementById("updateLocalAddress")?.value.trim() || "";
        const permanentAddress = document.getElementById("updatePermanentAddress")?.value.trim() || "";

        try {
            if (!fullName) {
                throw new Error("Full name is required");
            }
            if (guardian && !/^[0-9]{10}$/.test(guardian)) {
                throw new Error("Enter valid guardian number");
            }
            if (!fatherName) {
                throw new Error("Father Name is required");
            }
            validateMobile(mobile);

            if (this.UPDATE_FULL_DETAIL) {
                validateDob(dateOfBirth);
                validateAadhaar(aadhaarNumber);
                validateAddress(localAddress, "Local Address");
                validateAddress(permanentAddress, "Permanent Address");
            }
        } catch (validationError) {
            alert(validationError.message);
            return false;
        }
        const isUnchanged =
            fullName === (this.student.fullName || "") &&
            mobile === (this.student.mobileNumber || "") &&
            guardian === (this.student.guardianNumber || "") &&
            (!this.UPDATE_FULL_DETAIL || (
                dateOfBirth === (this.student.dateOfBirth || "") &&
                fatherName === (this.student.fatherName || "") &&
                aadhaarNumber === (this.student.aadhaarNumber || "") &&
                localAddress === (this.student.localAddress || "") &&
                permanentAddress === (this.student.permanentAddress || "")
            ));

        if (isUnchanged) {
            alert("No changes detected");
            return;
        }

        const payload = {
            studentId: this.studentId,
            requestedBy: Session.getUserId(),
            fullName,
            mobileNumber: mobile,
            guardianNumber: guardian
        };

        if (this.UPDATE_FULL_DETAIL) {
            payload.dateOfBirth = dateOfBirth;
            payload.fatherName = fatherName;
            payload.aadhaarNumber = aadhaarNumber;
            payload.localAddress = localAddress;
            payload.permanentAddress = permanentAddress;
        }

        try {

            let endPoint = Endpoints.manager.createRequest("DETAILS");

            if (Session.isAdmin()) {
                endPoint = Endpoints.admin.updateStudent;
            }

            await Api.post(endPoint, payload);

            const msg = Session.isAdmin()
                ? "✅ Student details updated successfully."
                : "✅ Student detail change request sent for approval.";

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