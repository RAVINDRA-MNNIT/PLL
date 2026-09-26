/**
 * student-actions.js
 * Fully self-contained action system (NO external modal dependency)
 */

window.StudentActionsUI = {

    container: null,
    student: null,
    modal: null,
    studentId: null,
    warnings: [],
    complaints: [],
    UPDATE_FULL_DETAIL: true,


    init(containerId, studentData, warnings = [], complaints = []) {
        this.container = document.getElementById(containerId);
        this.student = studentData;
        if (!this.container) return;
        this.studentId = studentData?.studentId;
        this.UPDATE_FULL_DETAIL = this.getConfigurations().UPDATE_FULL_DETAIL ?? false;
        this.warnings = warnings
        this.complaints = complaints
        this.ensureModalRoot();
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
        return JSON.parse(sessionStorage.getItem("configurations"));
    },

    render() {
        const STUDENT_DETAIL_UPDATE_ENABLE = this.getConfigurations().STUDENT_DETAIL_UPDATE_ENABLE ?? false;
        const STUDENT_FEE_UPDATE_ENABLE = this.getConfigurations().STUDENT_FEE_UPDATE_ENABLE ?? false;
        const STUDENT_SEAT_UPDATE_ENABLE = this.getConfigurations().STUDENT_SEAT_UPDATE_ENABLE ?? false;
        const STUDENT_ADD_COMPLAINT_ENABLE = this.getConfigurations().STUDENT_FEE_UPDATE_ENABLE ?? false;
        const showSeat = this.isSeatApplicable();
        const isAdmin = Session.isAdmin();
        const isStudent = Session.isStudent();
        const isManager = Session.isManager()
        const isTerminated = this.student?.enrollmentStatus === "TERMINATED";
        const isActive = this.student?.enrollmentStatus === "ACTIVE";
        const last = this.student?.lastFee;
        const diffDays = getDateDifferenceInDays(new Date(), last.tillDate);
        const hasWarning = this.warnings.length > 0
        const hasComplaint = this.complaints.length > 0

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
                if (!isTerminated) {
                    if (Number(last.pendingAmount ?? 0) > 0) {
                        html += this.button("clearPendingFees", "fa-money-bill-transfer", "Clear Pending Fees");
                    }
                }
                if (isActive) {
                    if ((Number(last?.pendingAmount) <= 0) && !(last?.paymentRemark?.toLowerCase().includes("batch change"))) {
                        html += this.button("updateBatch", "fa-layer-group", "Update Batch");
                    }
                }
                if (isAdmin) {
                    if (!isTerminated) {
                       html += this.button("updateDiscount", "fa-percent", "Update Discount");
                    }
                }
                html += this.button("addWarning", "fa-circle-exclamation", "Add Warning");
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
                if (STUDENT_ADD_COMPLAINT_ENABLE) {
                    html += this.button("addComplaint", "fa-comment-medical", "Add Complaint");
                }
            }
        }
        if (hasWarning) {
            html += this.button("viewWarnings", "fa-list", "View Warnings");
        }
        if (hasComplaint) {
            html += this.button("viewComplaints", "fa-comments", "View Complaints");
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
                case "clearPendingFees":
                    this.clearPendingFees();
                    break;
                 case "updateBatch":
                    this.showUpdateBatch();
                    break;
                case "updateDiscount":
                    this.showUpdateDiscount();
                    break;
                case "addWarning":
                    this.showAddWarning();
                    break;
                case "addComplaint":
                    this.showAddComplaint();
                    break;
                case "viewWarnings":
                    this.showWarnings();
                    break;
                case "viewComplaints":
                    this.showComplaints();
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
    const isStudent = Session.isStudent();
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
                        <td>${r.paymentMode ?? "-"}</td>
                        ${
                            !isStudent ? `
                            <td>
                                <strong>₹${r.submittedAmount ?? 0}</strong>
                                ${String(r.paymentMode).toUpperCase() === "BOTH" ? `
                                       ${r.cashAmount != null && r.cashAmount !== "" ? `<br><small>Cash: ₹${r.cashAmount}</small>` : ""}
                                       ${r.onlineAmount != null && r.onlineAmount !== "" ? `<br><small>Online: ₹${r.onlineAmount}</small>` : ""}
                                        ` : ""
                                }
                            </td>
                            <td>${r.pendingAmount ?? "-"}</td>
                            <td>${r.discountAmount ?? "-"}</td>
                            <td>${r.paymentRemark ?? "-"}</td>
                            ` : ""
                        }

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
                        <th>Payment Mode</th>
                        ${
                            !isStudent ? `
                            <th>Amount</th>
                            <th>Pending</th>
                            <th>Discount</th>
                            <th>Remarks</th>
                            ` : ""
                        }
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

            <div id="feeHistoryBody" class="modal-body" style="padding:20px; max-height:70vh; overflow:auto;"> 
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
                    <input id="updateFullName" type="text" value="${this.student.fullName ?? ""}">
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input id="updateMobileNumber" type="tel" maxlength="10" value="${this.student.mobileNumber ?? ""}">
                </div>
                <div class="form-group">
                    <label>Guardian Number</label>
                    <input id="updateGuardianNumber" type="tel" maxlength="10" value="${this.student.guardianNumber ?? ""}">
                </div>

                ${this.UPDATE_FULL_DETAIL ? `
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input id="updateDateOfBirth" type="date" value="${this.student.dateOfBirth ?? ""}">
                    </div>

                    <div class="form-group">
                        <label>Father Name</label>
                        <input id="updateFatherName" type="text" value="${this.student.fatherName ?? ""}">
                    </div>

                    <div class="form-group">
                        <label>Aadhaar Number</label>
                        <input id="updateAadhaarNumber" type="text" maxlength="12" value="${this.student.aadhaarNumber ?? ""}"
                               ${
                                    Session.isStudent() &&
                                    this.student.aadhaarNumber?.trim()
                                        ? "disabled"
                                        : ""
                                }>
                    </div>
                    <div class="form-group">
                        <label>Local Address</label>
                        <textarea id="updateLocalAddress" rows="3">${this.student.localAddress ?? ""}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Permanent Address</label>
                        <textarea id="updatePermanentAddress" rows="3">${this.student.permanentAddress ?? ""}</textarea>
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
            options += `<option value="DISCONTINUED">Discontinued</option>`;
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

    // showUpdateBatch() {
    //
    //     const student = this.student;

   async showUpdateBatch() {
       const student = this.student;
       const lastFee = student.lastFee;
       if (Number(lastFee?.pendingAmount) > 0) {
           alert(`You cannot update batch of this student, student has pending fees of Rupees ₹${lastFee?.pendingAmount}`);
           return;
       }
       if (lastFee?.paymentRemark?.toLowerCase().includes("batch change")) {
           alert("This student has recently updated the batch please wait till due date.");
           return;
       }
       const batches = await getUpdatedBatch() || [];
        await filteredSeat(this.studentId)
        if (!batches.length) {
            alert("Batch lookup data is not available.");
            return;
        }
        /*
         * Build batch options.
         */
        let batchOptions = `
        <option value="">
            -- Select New Batch --
        </option>
        `;
        batches.forEach(batch => {
            const batchId = batch.id;
            const batchName = batch.name ?? "-";
            const baseAmount = batch.baseAmount ?? 0;
            batchOptions += `
            <option value="${batchId}" data-base-amount="${baseAmount}" data-batch-name="${batchName}">
                ${batchName}
            </option>
            `;
        });
        const currentBatch = lastFee?.batchName ?? "-";
        const currentSeat = lastFee?.seatNumber ?? "-";
        const currentFromDate = lastFee?.fromDate ? formatDate(lastFee?.fromDate) : "-";
        const currentTillDate = lastFee?.tillDate ? formatDate(lastFee?.tillDate) : "-";
        let currentDays = 0;

        const html = `
        <div class="modal-content update-batch-modal">
            <!-- =====================================
                 HEADER
            ====================================== -->
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-layer-group"></i>
                    Update Batch
                </h2>
                <button type="button" onclick="StudentActionsUI.closeModal()">
                    ✕
                </button>
            </div>

            <!-- =====================================
                 BODY
            ====================================== -->
            <div class="modal-body">
                <!-- =================================
                     CURRENT STUDENT DETAILS
                ================================== -->
                <div class="student-update-summary">
                    <!-- MEMBERSHIP ID -->
                    <div class="summary-item">
                        <label>
                            Membership ID
                        </label>
                        <strong>
                            ${student.studentId ?? "-"}
                        </strong>
                    </div>
                    <!-- STUDENT -->
                    <div class="summary-item">
                        <label>
                            Student
                        </label>
                        <strong>
                            ${student.fullName ?? "-"}
                        </strong>
                    </div>
                    <!-- CURRENT BATCH -->
                    <div class="summary-item">
                        <label>
                            Current Batch
                        </label>
                        <strong>
                            ${currentBatch}
                        </strong>
                    </div>
                    <!-- CURRENT SEAT -->
                    <div class="summary-item">
                        <label>
                            Current Seat
                        </label>
                        <strong>
                            ${currentSeat}
                        </strong>
                    </div>
                    <!-- CURRENT MEMBERSHIP -->
                    <div class="summary-item membership-duration-item">
                        <label>
                            Current Membership Duration
                        </label>
                        <strong class="current-membership-duration">
                            <span>
                                ${currentFromDate}
                            </span>
                            <span class="duration-arrow">
                                →
                            </span>
                            <span>
                                ${currentTillDate}
                            </span>
                            ${ currentDays > 0 ? `
                                        <span class="duration-days">
                                            (${currentDays} Days)
                                        </span>
                                      `
                : ""
        }
                        </strong>
                    </div>
                </div>
                <!-- =================================
                     NEW BATCH DETAILS
                ================================== -->
                <div class="update-batch-select-grid">
                    <div class="form-group">
                        <label for="updateBatchSelect">
                            New Batch
                        </label>
                        <select id="updateBatchSelect" onchange="StudentActionsUI.onUpdateBatchChange()">
                            ${batchOptions}
                        </select>
                    </div>
                    <!-- SEAT NUMBER -->
                    <div class="form-group" id="updateBatchSeatGroup" style="display:none;">
                        <label for="updateBatchSeat">
                            Seat Number
                        </label>
                        <select id="updateBatchSeat">
                            <option value="">
                                -- Select Seat --
                            </option>
                        </select>
                    </div>
                </div>
                <!-- =================================
                     FEE CALCULATION
                ================================== -->
                <div class="update-batch-fee-card">
                    <div class="fee-card-header">
                        <i class="fa-solid fa-calculator"></i>
                        Fee Adjustment
                    </div>
                    <!-- Adjustment Type -->
                    <div class="form-group">
                        <label for="updateBatchAdjustmentType">
                            Select Type of Adjustment
                        </label>
                        <select id="updateBatchAdjustmentType" onchange="StudentActionsUI.calculateBatchAdjustment()">
                            <option value="DATE">Date</option>
                            <option value="AMOUNT">Amount</option>
                        </select>
                    </div>
                    <!-- Current Calculation -->
                    <div class="update-batch-adjustment-grid">
                        <div class="fee-info-item">
                            <label>Days Used</label>
                            <strong id="updateBatchDaysUsed">0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>Remaining Days</label>
                            <strong id="updateBatchRemainingDays">0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>Previous Fees</label>
                            <strong id="updateBatchPreviousFees">₹0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>Amount Used</label>
                            <strong id="updateBatchAmountUsed">₹0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>Remaining Amount</label>
                            <strong id="updateBatchRemainingAmount">₹0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>New Batch Base Amount</label>
                            <strong id="updateBatchBaseAmount">₹0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>Per Day According to New</label>
                            <strong id="updateBatchPerDay">₹0</strong>
                        </div>
                        <div class="fee-info-item">
                            <label>New Total Fees</label>
                            <strong id="updateBatchNewTotalFees">₹0</strong>
                        </div>
                    </div>
                    <!-- DATE ADJUSTMENT -->
                    <div id="updateBatchDateAdjustment" class="update-batch-result-card">
                        <label>Total New Remaining Days</label>
                        <strong id="updateBatchNewRemainingDays">0 Days</strong>
                        <label>New Membership Till Date</label>
                        <strong id="updateBatchNewTillDate">-</strong>
                    </div>
                    <!-- AMOUNT ADJUSTMENT -->
                    <div id="updateBatchAmountAdjustment" class="update-batch-result-card" style="display:none;">
                        <label id="updateBatchAmountResultLabel">Student Needs to Pay</label>
                        <strong id="updateBatchAmountResult" class="amount-payable">₹0</strong>
                    </div>
                </div>
                <!-- =================================
                     MESSAGE
                ================================== -->
                <div id="updateBatchModalMessage" class="update-batch-modal-message">
                </div>
            </div>
            <!-- =====================================
                 FOOTER
            ====================================== -->
            <div class="modal-footer">
                <button type="button" class="secondary-btn" onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>
                <button
                    type="button" class="primary-btn" id="saveUpdateBatchBtn" onclick="StudentActionsUI.saveUpdateBatch()">
                    <i class="fa-solid fa-layer-group"></i>
                    Update Batch
                </button>
            </div>
        </div>
    `;
        this.openModal(html);
    },

    async onUpdateBatchChange() {

        const batchSelect = document.getElementById("updateBatchSelect");
        const seatGroup = document.getElementById("updateBatchSeatGroup");
        const seatSelect = document.getElementById("updateBatchSeat");
        const batchGrid = document.querySelector(".update-batch-select-grid");
        if (!batchSelect) {return}
        const batchId = batchSelect.value;
        if (!batchId) {
            if (seatGroup) {
                seatGroup.style.display = "none";
            }
            if (batchGrid) {
                batchGrid.classList.remove("has-seat");
            }
            if (seatSelect) {
                seatSelect.innerHTML = `
                    <option value="">
                        -- Select Seat --
                    </option>
                `;
                seatSelect.value = "";
            }
            return;
        }

        const selectedBatch = findBatch(batchId)
        if (!selectedBatch) {
            console.error("Selected batch not found in lookup:", batchId);
            if (seatGroup) {
                seatGroup.style.display = "none";
            }
            if (batchGrid) {
                batchGrid.classList.remove("has-seat");
            }
            if (seatSelect) {
                seatSelect.innerHTML = `
                    <option value="">
                        -- Select Seat --
                    </option>
                `;
            }
            return;
        }
        const batchName = String(selectedBatch.name ?? "");
        const baseAmount = Number(selectedBatch.baseAmount ?? selectedBatch.base_amount ?? 0);
        const isFullDay = batchName.toLowerCase().includes("24 hours") || batchName.toLowerCase().includes("full day")
        if (isFullDay) {
            if (seatGroup) {
                seatGroup.style.display = "block";
            }
            if (batchGrid) {
                batchGrid.classList.add("has-seat");
            }
            await this.loadUpdateBatchSeats()
        } else {
            if (seatGroup) {
                seatGroup.style.display = "none";
            }
            if (batchGrid) {
                batchGrid.classList.remove("has-seat");
            }
            if (seatSelect) {
                seatSelect.innerHTML = `
                    <option value="">
                        -- Select Seat --
                    </option>
                `;
                seatSelect.value = "";
            }
        }
        const baseAmountElement = document.getElementById("updateBatchBaseAmount");
        if (baseAmountElement) {
            baseAmountElement.textContent = `₹${baseAmount}`;
        }
       this.calculateBatchAdjustment();
    },

    calculateBatchAdjustment() {
        const student = this.student;
        const lastFee = student?.lastFee;
        const allowedDiscount = student.allowedDiscount ?? 0;
        const lastBatch = findBatch(lastFee?.batchId);
        const lastFees = lastBatch?.baseAmount ?? 0;
        if (!student) return;
        const adjustmentType = document.getElementById("updateBatchAdjustmentType")?.value || "DATE";

        const fromDate = lastFee?.fromDate;
        const tillDate = lastFee?.tillDate;
        if (!fromDate || !tillDate) return;
        const totalDays = getDateDifferenceInDays(fromDate, tillDate);
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const daysUsed = Math.max(0, getDateDifferenceInDays(fromDate, todayOnly));
        const remainingDays = Math.max(0, totalDays - daysUsed);
        const previousFees = Number((lastFees - allowedDiscount) ?? 0);
        const amountUsed = totalDays > 0 ? Math.round((previousFees / totalDays) * daysUsed) : 0;
        const remainingAmount = Math.max(0, previousFees - amountUsed);
        const batchSelect = document.getElementById("updateBatchSelect");
        const selectedOption = batchSelect?.selectedOptions?.[0];
        if (!selectedOption || !selectedOption.value) return;
        const newBaseAmount = Number(selectedOption.dataset.baseAmount || 0);
        const newPerDay = newBaseAmount / 30;
        const newTotalFees = Math.round(newPerDay * remainingDays);

        this.setBatchAdjustmentValue("updateBatchDaysUsed", daysUsed);
        this.setBatchAdjustmentValue("updateBatchRemainingDays", remainingDays);
        this.setBatchAdjustmentValue("updateBatchPreviousFees", `₹${previousFees}`);
        this.setBatchAdjustmentValue("updateBatchAmountUsed", `₹${amountUsed}`);
        this.setBatchAdjustmentValue("updateBatchRemainingAmount", `₹${remainingAmount}`);
        this.setBatchAdjustmentValue("updateBatchBaseAmount", `₹${newBaseAmount}`);
        this.setBatchAdjustmentValue("updateBatchPerDay", `₹${newPerDay.toFixed(3)}`);
        this.setBatchAdjustmentValue("updateBatchNewTotalFees", `₹${newTotalFees}`);

        /*
         * ==========================================
         * DATE ADJUSTMENT
         * ==========================================
         */

        const dateAdjustment = document.getElementById("updateBatchDateAdjustment");
        const amountAdjustment = document.getElementById("updateBatchAmountAdjustment");
        if (adjustmentType === "DATE") {dateAdjustment.style.display = "block";
            amountAdjustment.style.display = "none";
            let newRemainingDays = 0;
            if (newPerDay > 0) {
                newRemainingDays = Math.floor(remainingAmount / newPerDay);
            }
            const newTillDate = this.addDaysToDate(new Date(), newRemainingDays);
            const newTillDateString = this.formatDateForInput(newTillDate);
            this.setBatchAdjustmentValue("updateBatchNewRemainingDays", `${newRemainingDays} Days`);
            this.setBatchAdjustmentValue("updateBatchNewTillDate", formatDate(newTillDateString));
            this.updateBatchAdjustment = {
                type: "DATE",
                daysUsed,
                remainingDays,
                previousFees,
                amountUsed,
                remainingAmount,
                newBaseAmount,
                newPerDay,
                newTotalFees,
                newRemainingDays,
                newTillDate:
                newTillDateString
            };
        } else {
            /*
             * ======================================
             * AMOUNT ADJUSTMENT
             * ======================================
             */
            dateAdjustment.style.display = "none";
            amountAdjustment.style.display = "block";
            /*
             * Student needs to pay:
             *
             * New Total Fees
             * -
             * Remaining Amount
             *
             * Example:
             *
             * ₹400 - ₹200 = ₹200
             */
            const difference = newTotalFees - remainingAmount;
            const resultElement = document.getElementById("updateBatchAmountResult");
            const resultLabel = document.getElementById("updateBatchAmountResultLabel");
            if (difference >= 0) {
                resultLabel.textContent = "Student Needs to Pay";
                resultElement.textContent = `₹${difference}`;
                resultElement.classList.remove("amount-refund");
                resultElement.classList.add("amount-payable");
            } else {
                const amount = Math.abs(difference);
                resultLabel.textContent = "Amount to Pay";
                resultElement.textContent = `₹${amount}`;
                resultElement.classList.remove("amount-payable");
                resultElement.classList.add("amount-refund");
            }

            this.updateBatchAdjustment = {
                type: "AMOUNT",
                daysUsed,
                remainingDays,
                previousFees,
                amountUsed,
                remainingAmount,
                newBaseAmount,
                newPerDay,
                newTotalFees,
                adjustmentAmount: Math.abs(difference),
                studentNeedsToPay: difference >= 0,
                newTillDate: tillDate
            };
        }
    },

    async loadUpdateBatchSeats() {
        const seatSelect = document.getElementById("updateBatchSeat");
        if (!seatSelect) return;
        const seats = await filteredSeat(this.studentId);
        seatSelect.innerHTML = `
            <option value="">
                -- Select Seat --
            </option>
        `;
        seats.forEach(seat => {
            const option = document.createElement("option");
            option.value = seat.id;
            option.textContent = seat.seatNumber;
            seatSelect.appendChild(option);
        });
    },

    setBatchAdjustmentValue(elementId, value) {
        const element =
            document.getElementById(elementId);

        if (element) {
            element.textContent = value;
        }
    },

    addDaysToDate(date, days) {
        const result =
            new Date(date);

        result.setDate(
            result.getDate() + days
        );

        return result;
    },

    formatDateForInput(date) {
        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;
    },

    async showFeeUpdate() {
        await getUpdatedBatch();
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
        const batch = findBatch(last.batchId);
        const baseAmount = Number(batch.baseAmount ?? 0);
        const newTill = addOneMonth(last.tillDate);
        const allowedDiscount = this.student?.allowedDiscount ?? 0;
        const totalFee = ((calculateTotalFee(baseAmount, 30) + (last.pendingAmount ?? 0)) - allowedDiscount);

        const payload = {
            studentId: this.studentId ,
            batchId: last.batchId,
            seatId: last.seatId,
            fromDate: last.tillDate,
            tillDate: newTill.toISOString().split("T")[0],
            submittedAmount: totalFee,
            pendingAmount: 0,
            discount: allowedDiscount ?? 0,
            paymentMode: "ONLINE",
            transactionId: transactionId,
            requestedBy: Session.getUserId()
        };

        try {
            await Api.post(Endpoints.manager.createRequest("FEES"), payload);
            alert("Fee request submitted successfully.");
        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    },

    async clearPendingFees() {
        const last = this.student?.lastFee;
        const pendingAmount = last.pendingAmount ?? 0;
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
            studentId: this.studentId ,
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
            StudentActionsUI.closeModal();
            if (Session.isAdmin()) {
                await StudentDetailsPage.loadStudent(this.studentId);
            }
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
        const batch = findBatch(last.batchId);
        const baseAmount = Number(batch.baseAmount ?? 0);
        const newTill = addOneMonth(last.tillDate);
        const allowedDiscount = this.student?.allowedDiscount ?? 0;
        const totalFee = ((calculateTotalFee(baseAmount, 30) + (last.pendingAmount ?? 0)) - allowedDiscount);

        const message = `
        Please review before request.
        Student ID : ${this.studentId}
        Student Name  : ${this.student.fullName}
        Batch          : ${batch.name}
        Seat           : ${last.seatNumber}
        Next From Date: ${formatDate(last.tillDate)}
        Next Till Date: ${formatDate(newTill)}
        Pay Amount     : ₹${totalFee}
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
            validateMobile(mobile);

            if (this.UPDATE_FULL_DETAIL) {
                if (!fatherName) {
                    throw new Error("Father Name is required");
                }
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
        var reason = ""
        if (!status) {
            alert("Please select status");
            return;
        }
        let message = `Are you to update status as ${status}?`;
        if (status.toUpperCase() === "TERMINATED") {
            reason = prompt("Please enter reason for termination");
            if (reason.length === 0) {
                alert("Reason is required for termination")
            }
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
            requestedBy: Session.getUserId(),
            remarks: reason,
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
    },

    async saveUpdateBatch() {
        const student = this.student;
        const batchSelect = document.getElementById("updateBatchSelect");
        const seatSelect = document.getElementById("updateBatchSeat");
        const adjustmentType = document.getElementById("updateBatchAdjustmentType")?.value;
        const adjustment = this.updateBatchAdjustment;
        var transactionId = ""
        var paymentMode = "";

        if (!student) {
            alert("Student information not found.");
            return;
        }

        if (!batchSelect?.value) {
            alert("Please select a new batch.");
            return;
        }

        if (Number(batchSelect?.value ?? 0) === this.student?.lastFee?.batchId) {
            alert("Selected batch is already assigned, select new batch.");
            return;
        }

        if (!adjustment) {
            alert("Unable to calculate batch adjustment.");
            return;
        }

        if (adjustmentType === "AMOUNT" && (adjustment.studentNeedsToPay ?? true)){
            if (confirm("Is the payment Online?")) {
                paymentMode = "ONLINE";
            } else {
                paymentMode = "CASH"
            }

            if (paymentMode === "ONLINE") {
                transactionId = prompt("Please enter transaction Id in case of Online.")
                if (!transactionId) {
                    alert("Transaction id is mandatory!!")
                    return
                }
            }
        }


        const remarks = `Batch Change: ${this.student?.lastFee?.batchName ?? "-"} → ${batchSelect?.value ?? "-"}
                                Adjustment Type: ${adjustmentType ?? "-"}
                                Did Student Pay: ${adjustment.studentNeedsToPay ?? false}
                                Adjustment Amount: ₹${adjustment.adjustmentAmount ?? 0}
                                Previous Till Date: ${this.student?.lastFee?.tillDate ?? "-"}
                                New Till Date: ${adjustment.newTillDate ?? "-"}`;
        const payload = {
            studentId: this.studentId,
            batchId: batchSelect?.value,
            seatId: seatSelect.value ?? null,
            tillDate: adjustmentType === "DATE" ? adjustment.newTillDate : null,
            submittedAmount: (adjustmentType === "DATE" ? null : ((adjustment.studentNeedsToPay ?? true) ? (adjustment.adjustmentAmount ?? 0) : 0)),
            paymentMode: paymentMode,
            transactionId: transactionId,
            remarks: remarks,
            requestedBy: Session.getUserId(),
        };

        if (!confirm(printPayload(payload))) {
            return
        }

        try {
            let endPoint = Endpoints.manager.createRequest("BATCH")
            if(Session.isAdmin()) {
                endPoint = Endpoints.admin.updateStudentBatch
            }
            await Api.post(
                endPoint,
                payload
            );

            let msg = Session.isAdmin() ? "✅ Batch changed successfully" : "✅ Batch change request sent for approval";
            alert(msg);
            StudentActionsUI.closeModal();
            if (Session.isAdmin()) {
                await StudentDetailsPage.loadStudent(this.studentId);
            }
        } catch (err) {
            console.error(err);
        }
    },

    async showUpdateDiscount() {
        const student = this.student;

        if (!student) {
            alert("Student information not found.");
            return;
        }

        if (student.enrollmentStatus === "TERMINATED") {
            alert("You should not update discount of a terminated student.");
            return;
        }

        const allowedDiscount = Number(student.allowedDiscount ?? 0);

        const html = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-percent"></i>
                    Update Discount
                </h2>
                <button onclick="StudentActionsUI.closeModal()">✕</button>
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label>Current Allowed Discount</label>
                    <strong style="display:block; margin-top:6px;">
                        ₹${allowedDiscount.toFixed(2)}
                    </strong>
                </div>

                <div class="form-group">
                    <label for="newDiscountAmount">
                        New Discount Amount
                    </label>
                    <input
                        type="number"
                        id="newDiscountAmount"
                        min="0"
                        step="0.01"
                        value="${allowedDiscount}"
                        placeholder="Enter discount amount">
                </div>
            </div>

            <div class="modal-footer">
                <button class="secondary-btn"
                        onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>

                <button class="primary-btn"
                        onclick="StudentActionsUI.saveDiscountChange()">
                    Update Discount
                </button>
            </div>
        </div>
    `;

        this.openModal(html);
    },

    async saveDiscountChange() {
        const student = this.student;

        if (!student) {
            alert("Student information not found.");
            return;
        }

        const input = document.getElementById("newDiscountAmount");
        const amount = Number(input?.value);

        if (!Number.isFinite(amount) || amount < 0) {
            alert("Please enter a valid discount amount.");
            input?.focus();
            return;
        }

        if (!confirm(`You are going to update ₹${amount}, Do you want to continue?`)) {
            return
        }

        const payload = {
            studentId: this.studentId,
            discount: amount,
        };

        try {
            await Api.post(
                Endpoints.admin.updateStudentDiscount,
                payload
            );
            alert("✅ Discount updated successfully" );
            StudentActionsUI.closeModal();
            await StudentDetailsPage.loadStudent(this.studentId);
        } catch (err) {
            console.error(err);
        }
    },

    async showAddWarning() {

        const student = this.student;

        const html = `
        <div class="modal-content student-warning-modal">

            <!-- HEADER -->
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Add Warning
                </h2>

                <button
                    type="button"
                    onclick="StudentActionsUI.closeModal()">
                    ✕
                </button>
            </div>

            <!-- BODY -->
            <div class="modal-body">

                <!-- STUDENT DETAILS -->
                <div class="student-update-summary">

                    <div class="summary-item">
                        <label>
                            Membership ID
                        </label>

                        <strong>
                            ${student.studentId ?? "-"}
                        </strong>
                    </div>

                    <div class="summary-item">
                        <label>
                            Student
                        </label>

                        <strong>
                            ${student.fullName ?? "-"}
                        </strong>
                    </div>

                </div>

                <!-- WARNING DETAILS -->
                <div class="form-grid">

                    <div class="form-group">

                        <label for="warningLevel">
                            Warning Level
                        </label>

                        <select id="warningLevel">
                            ${this.getWarningLevelOptions()}
                        </select>

                    </div>

                    <div class="form-group">

                        <label for="warningCategory">
                            Category
                        </label>

                        <select id="warningCategory">

                            <option value="">
                                -- Select Category --
                            </option>

                            <option value="DISCIPLINE">
                                Discipline
                            </option>

                            <option value="TIMING">
                                Timing
                            </option>

                            <option value="ATTENDANCE">
                                Attendance
                            </option>

                            <option value="NOISE">
                                Noise
                            </option>

                            <option value="MISCONDUCT">
                                Misconduct
                            </option>

                            <option value="PROPERTY">
                                Property
                            </option>

                            <option value="SEAT">
                                Seat
                            </option>

                            <option value="LIBRARY_RULE">
                                Library Rule
                            </option>

                            <option value="OTHER">
                                Other
                            </option>

                        </select>

                    </div>

                </div>

                <!-- DESCRIPTION -->
                <div class="form-group">

                    <label for="warningDescription">
                        Description
                    </label>

                    <textarea
                        id="warningDescription"
                        rows="5"
                        placeholder="Enter reason for warning..."
                    ></textarea>

                </div>

                <!-- ACTION TAKEN -->
                <div class="form-group">

                    <label for="warningActionTaken">
                        Action Taken
                    </label>

                    <textarea
                        id="warningActionTaken"
                        rows="4"
                        placeholder="Enter action taken..."
                    ></textarea>

                </div>

                <div
                    id="warningModalMessage"
                    class="update-batch-modal-message">
                </div>

            </div>

            <!-- FOOTER -->
            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>

                <button
                    type="button"
                    class="primary-btn"
                    id="saveWarningBtn"
                    onclick="StudentActionsUI.saveWarning()">

                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Add Warning

                </button>

            </div>

        </div>
    `;

        this.openModal(html);
    },

    getNextWarningLevel() {

        const warnings = this.warnings ?? [];

        // Only active warnings should count
        const activeWarnings = warnings.filter(
            warning => !warning.cancelledAt
        );

        const hasFirstWarning = activeWarnings.some(
            warning =>
                String(warning.warningLevel).toUpperCase() === "FIRST_WARNING"
        );

        const hasSecondWarning = activeWarnings.some(
            warning =>
                String(warning.warningLevel).toUpperCase() === "SECOND_WARNING"
        );

        const hasFinalWarning = activeWarnings.some(
            warning =>
                String(warning.warningLevel).toUpperCase() === "FINAL_WARNING"
        );

        const hasTerminate = activeWarnings.some(
            warning =>
                String(warning.warningLevel).toUpperCase() === "TERMINATE"
        );


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

        const student = this.student;
        const warningLevel = document.getElementById("warningLevel")?.value;
        const category = document.getElementById("warningCategory")?.value;
        const description = document.getElementById("warningDescription")?.value.trim();
        const actionTaken = document.getElementById("warningActionTaken")?.value.trim();

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
            issuedByName: Session.getUserName(),
        };
        if (!confirm(printPayload(payload))) {
            return
        }
        try {
            await Api.post(
                Endpoints.students.addWarning,
                payload
            );
            alert("✅ Warning updated successfully" );
            StudentActionsUI.closeModal();
            await StudentDetailsPage.loadStudent(this.studentId);
        } catch (err) {
            console.error(err);
        }
    },

    async deleteWarning(warningId) {

        if (!warningId) {
            console.error("Warning ID is missing.");
            return;
        }


        const warning = (this.warnings ?? []).find(
            item => Number(item.id) === Number(warningId)
        );


        if (!warning) {
            console.error("Warning not found:", warningId);
            return;
        }


        const warningLevel =
            formatWarningLevel(warning.warningLevel);


        const confirmed = confirm(
            `Are you sure you want to delete this ${warningLevel}?\n\n` +
            `This action cannot be undone.`
        );


        if (!confirmed) {
            return;
        }


        try {

            await Api.delete(
                Endpoints.students.deleteStudentWarning(warningId)
            );


            // Remove from local list
            this.warnings = (this.warnings ?? []).filter(
                item => Number(item.id) !== Number(warningId)
            );


            // Re-render warnings modal
            this.showWarnings();


        } catch (error) {

            console.error(
                "Failed to delete warning:",
                error
            );


            alert(
                error?.message ||
                "Failed to delete warning."
            );
        }
    },

    async showAddComplaint() {

        const student = this.student;

        const html = `
        <div class="modal-content student-complaint-modal">

            <!-- HEADER -->
            <div class="modal-header">

                <h2>
                    <i class="fa-solid fa-comment-dots"></i>
                    Add Complaint
                </h2>

                <button type="button"
                        onclick="StudentActionsUI.closeModal()">
                    ✕
                </button>

            </div>

            <!-- BODY -->
            <div class="modal-body">

                <!-- STUDENT SUMMARY -->
                <div class="student-update-summary">

                    <div class="summary-item">
                        <label>
                            Membership ID
                        </label>

                        <strong>
                            ${student.studentId ?? "-"}
                        </strong>
                    </div>

                    <div class="summary-item">
                        <label>
                            Student
                        </label>

                        <strong>
                            ${student.fullName ?? "-"}
                        </strong>
                    </div>

                </div>

                <!-- COMPLAINT DETAILS -->
                <div class="form-group">

                    <label for="complaintCategory">
                        Category
                    </label>

                    <select id="complaintCategory">

                        <option value="">
                            -- Select Category --
                        </option>

                        <option value="FACILITY">
                            Facility
                        </option>

                        <option value="BATCH">
                            Batch
                        </option>

                        <option value="FEES">
                            Fees
                        </option>

                        <option value="SEAT">
                            Seat
                        </option>

                        <option value="STAFF">
                            Staff
                        </option>

                        <option value="LIBRARY">
                            Library
                        </option>

                        <option value="CLEANLINESS">
                            Cleanliness
                        </option>

                        <option value="TIMING">
                            Timing
                        </option>

                        <option value="OTHER">
                            Other
                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label for="complaintDescription">
                        Complaint
                    </label>

                    <textarea
                        id="complaintDescription"
                        rows="7"
                        placeholder="Enter complaint..."
                    ></textarea>

                </div>

                <div id="complaintModalMessage"
                     class="update-batch-modal-message">
                </div>

            </div>

            <!-- FOOTER -->
            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="StudentActionsUI.closeModal()">
                    Cancel
                </button>

                <button
                    type="button"
                    class="primary-btn"
                    id="saveComplaintBtn"
                    onclick="StudentActionsUI.saveComplaint()">

                    <i class="fa-solid fa-comment-dots"></i>
                    Add Complaint

                </button>

            </div>

        </div>
    `;

        this.openModal(html);
    },

    async saveComplaint() {

        const student = this.student;

        const category =
            document.getElementById("complaintCategory")?.value;

        const description =
            document.getElementById("complaintDescription")
                ?.value
                .trim();


        if (!category) {
            alert("Please select complaint category.");
            return;
        }


        if (!description) {
            alert("Please enter complaint description.");
            return;
        }


        const payload = {
            studentId: student.studentId,
            category,
            description
        };


        if (!confirm(printPayload(payload))) {
            return;
        }


        try {

            await Api.post(
                Endpoints.students.addComplaint,
                payload
            );


            alert("✅ Complaint submitted successfully");


            StudentActionsUI.closeModal();


            await StudentDetailsPage.loadStudent(
                this.studentId
            );


        } catch (err) {

            console.error(
                "Failed to save complaint:",
                err
            );


            alert(
                err?.message ||
                "Failed to submit complaint."
            );
        }
    },

    async deleteComplaint(complaintId) {

        if (!complaintId) {

            console.error(
                "Complaint ID is missing."
            );

            return;
        }


        const complaint =
            (this.complaints ?? []).find(
                item =>
                    Number(item.id) === Number(complaintId)
            );


        if (!complaint) {

            console.error(
                "Complaint not found:",
                complaintId
            );

            return;
        }


        const confirmed = confirm(
            "Are you sure you want to delete this complaint?\n\n" +
            "This action cannot be undone."
        );


        if (!confirmed) {
            return;
        }


        try {

            await Api.delete(
                Endpoints.students.deleteStudentComplaint(
                    complaintId
                )
            );


            // Remove from local list
            this.complaints =
                (this.complaints ?? []).filter(
                    item =>
                        Number(item.id) !== Number(complaintId)
                );


            // Re-render complaints modal
            this.showComplaints();


        } catch (error) {

            console.error(
                "Failed to delete complaint:",
                error
            );


            alert(
                error?.message ||
                "Failed to delete complaint."
            );
        }
    },

    showWarnings() {

        const warnings = this.warnings ?? [];
        const student = this.student;
        const canDeleteWarning = (this.student.enrollmentStatus.toUpperCase() === "TERMINATED") ? false : Session.isAdmin();
        let content = "";

        if (!warnings.length) {

            content = `
            <div class="student-warning-empty">
                <i class="fa-solid fa-circle-check"></i>
                <p>No warnings found for this student.</p>
            </div>
        `;

        } else {

            content = warnings.map((warning, index) => {

                const issuedAt = warning.issuedAt
                    ? renderRequestedAt(warning.issuedAt)
                    : "-";

                const cancelledAt = warning.cancelledAt
                    ? renderRequestedAt(warning.cancelledAt)
                    : null;

                // Only the latest/last warning gets delete button
                const isLatestWarning = index === 0;

                return `
                <div class="student-warning-card">

                    <div class="student-warning-card-header">

                        <div class="student-warning-title">

                            <span class="student-warning-number">
                                Warning #${warnings.length - index}
                            </span>

                            <span class="student-warning-level">
                                ${formatWarningLevel(warning.warningLevel)}
                            </span>

                        </div>


                        <div class="student-warning-header-right">

                            <span class="student-warning-date">
                                ${issuedAt}
                            </span>

                            ${
                    canDeleteWarning && isLatestWarning
                        ? `
                                        <button
                                            type="button"
                                            class="student-warning-delete-btn"
                                            title="Delete Warning"
                                            onclick="StudentActionsUI.deleteWarning(${warning.id})">

                                            <i class="fa-solid fa-trash"></i>

                                        </button>
                                    `
                        : ""
                }

                        </div>

                    </div>


                    <div class="student-warning-card-body">

                        <div class="student-warning-line">

                            <span class="student-warning-label">
                                Category:
                            </span>

                            <span class="student-warning-value">
                                ${formatWarningCategory(warning.category)}
                            </span>

                        </div>


                        <div class="student-warning-line">

                            <span class="student-warning-label">
                                Description:
                            </span>

                            <span class="student-warning-value">
                                ${warning.description ?? "-"}
                            </span>

                        </div>
                        
                        <div class="student-warning-line">
                            <span class="student-warning-label">
                                Issued By:
                            </span>
                            <span class="student-warning-value">
                                ${warning.issuedByName ?? "-"}
                            </span>
                        </div>

                        <div class="student-warning-line">

                            <span class="student-warning-label">
                                Action Taken:
                            </span>

                            <span class="student-warning-value">
                                ${warning.actionTaken || "-"}
                            </span>

                        </div>


                        ${
                    cancelledAt
                        ? `
                                    <div class="student-warning-line student-warning-cancelled">

                                        <span class="student-warning-label">
                                            Cancelled:
                                        </span>

                                        <span class="student-warning-value">
                                            ${cancelledAt}${
                            warning.cancellationReason
                                ? ` — ${warning.cancellationReason}`
                                : ""
                        }
                                        </span>

                                    </div>
                                `
                        : ""
                }

                    </div>

                </div>
            `;

            }).join("");
        }


        const html = `
        <div class="modal-content student-warning-modal">

            <div class="modal-header">

                <h2>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Warnings
                </h2>

                <button
                    type="button"
                    onclick="StudentActionsUI.closeModal()">
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


                    <div class="summary-item">

                        <label>Total Warnings</label>

                        <strong>
                            ${warnings.length}
                        </strong>

                    </div>

                </div>


                <div class="student-warning-list">
                    ${content}
                </div>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="StudentActionsUI.closeModal()">

                    <i class="fa-solid fa-xmark"></i>
                    Close

                </button>

            </div>

        </div>
    `;

        this.openModal(html);
    },

    async showComplaints() {

        const complaints = this.complaints ?? [];

        const canDeleteComplaint =
            Session.isAdmin() || Session.isStudent();

        const html = `
    <div class="modal-content student-complaints-modal">

        <!-- HEADER -->
        <div class="modal-header">

            <h2>
                <i class="fa-solid fa-comments"></i>
                Student Complaints
            </h2>

            <button
                type="button"
                onclick="StudentActionsUI.closeModal()">
                ✕
            </button>

        </div>

        <!-- BODY -->
        <div class="modal-body">

            ${
            complaints.length === 0
                ? `
                    <div class="student-no-data">
                        <i class="fa-solid fa-comment-slash"></i>
                        <span>No complaints found.</span>
                    </div>
                  `
                : `
                    <div class="student-complaints-list">

                        ${complaints.map((complaint, index) => {

                    const submittedAt =
                        complaint.submittedAt
                            ? new Date(
                                complaint.submittedAt
                            ).toLocaleString()
                            : "-";

                    const resolvedAt =
                        complaint.resolvedAt
                            ? new Date(
                                complaint.resolvedAt
                            ).toLocaleString()
                            : null;

                    const closedAt =
                        complaint.closedAt
                            ? new Date(
                                complaint.closedAt
                            ).toLocaleString()
                            : null;

                    const status =
                        String(
                            complaint.status ?? "OPEN"
                        ).toUpperCase();

                    const statusLabel =
                        status
                            .replaceAll("_", " ")
                            .replace(
                                /\b\w/g,
                                c => c.toUpperCase()
                            );

                    const category =
                        String(
                            complaint.category ?? "-"
                        )
                            .replaceAll("_", " ")
                            .replace(
                                /\b\w/g,
                                c => c.toUpperCase()
                            );
                    const complaintStatus =
                        String(complaint.status || "OPEN").toUpperCase();
                    
                    return `
                                <div class="student-complaint-card">

                                    <!-- CARD HEADER -->
                                    <div class="student-complaint-card-header">

                                        <div class="student-complaint-title">

                                            <span class="student-complaint-number">
                                                Complaint #${complaints.length - index}
                                            </span>

                                            <span class="student-complaint-category">
                                                ${category}
                                            </span>

                                        </div>

                                        <div class="student-complaint-header-right">

                                            <span class="student-complaint-date">
                                                ${submittedAt}
                                            </span>

                                            ${
                        canDeleteComplaint
                            ? `
                                                        <button
                                                            type="button"
                                                            class="student-complaint-delete-btn"
                                                            title="Delete Complaint"
                                                            onclick="StudentActionsUI.deleteComplaint(${complaint.id})">
                                                            <i class="fa-solid fa-trash"></i>
                                                        </button>
                                                      `
                            : ""
                    }

                                        </div>

                                    </div>

                                    <!-- CARD BODY -->
                                    <div class="student-complaint-card-body">

                                        <div class="student-complaint-line">

                                            <span class="student-complaint-label">
                                                Category:
                                            </span>

                                            <span class="student-complaint-value">
                                                ${category}
                                            </span>

                                        </div>

                                        <div class="student-complaint-line">

                                            <span class="student-complaint-label">
                                                Complaint:
                                            </span>

                                            <span class="student-complaint-value">
                                                ${complaint.description ?? "-"}
                                            </span>

                                        </div>

                                        <div class="student-complaint-line">

                                            <span class="student-complaint-label">
                                                Status:
                                            </span>

<span class="student-complaint-value complaint-status-badge status-${status.toLowerCase()}">
    ${statusLabel}
</span>

                                        </div>

                                        ${
                        complaint.resolution
                            ? `
                                                    <div class="student-complaint-line">

                                                        <span class="student-complaint-label">
                                                            Resolution:
                                                        </span>

                                                        <span class="student-complaint-value">
                                                            ${complaint.resolution}
                                                        </span>

                                                    </div>
                                                  `
                            : ""
                    }

                                        ${
                        resolvedAt
                            ? `
                                                    <div class="student-complaint-line">

                                                        <span class="student-complaint-label">
                                                            Resolved:
                                                        </span>

                                                        <span class="student-complaint-value">
                                                            ${resolvedAt}
                                                        </span>

                                                    </div>
                                                  `
                            : ""
                    }

                                        ${
                        closedAt
                            ? `
                                                    <div class="student-complaint-line">

                                                        <span class="student-complaint-label">
                                                            Closed:
                                                        </span>

                                                        <span class="student-complaint-value">
                                                            ${closedAt}
                                                        </span>

                                                    </div>
                                                  `
                            : ""
                    }

                                    </div>

                                </div>
                            `;

                }).join("")}

                    </div>
                  `
        }

        </div>

        <!-- FOOTER -->
        <div class="modal-footer">

            <button
                type="button"
                class="secondary-btn"
                onclick="StudentActionsUI.closeModal()">
                Close
            </button>

        </div>

    </div>
`;

        this.openModal(html);
    },

};