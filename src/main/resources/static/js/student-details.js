/**
 * student-details.js
 * Handles Student Details page.
 */ 
window.StudentDetailsPage = {

    currentStudent: null,

    // ================= INIT =================
init() {
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => this.initialize()
        );
    } else {
        this.initialize(); // ✅ CRITICAL FIX
    }
},

initialize() {

    try {
        // ✅ GET ID FROM URL (CORRECT FLOW)
        const params = new URLSearchParams(window.location.search);
        let studentId = params.get("id");

        if (!studentId) {
            return;
        }

        this.loadStudent(studentId);

    } catch (error) {
        console.error(error);
    }
},

    // ================= API =================

    async loadStudent(studentId) {
        // debugger;
        // await fetch(Endpoints.auth.studentlogin, {
        //     method: "POST",
        //     credentials: "same-origin",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify({
        //         userId: 1,
        //         password: "AK2531993"
        //     })
        // });
        await Session.loadCurrentUser();
        if (Session.getUser() == null) {
            await Api.postWithoutResponse(Endpoints.auth.logout);
            window.location.href = "/student.html";
            return
        }
        else if (Session.isStudent()) {
            const loggedInStudentId = Number(Session.getUserId());
            const requestedStudentId = Number(studentId);
            if (loggedInStudentId !== requestedStudentId) {
                await Api.postWithoutResponse(Endpoints.auth.logout);
                window.location.href = "/student.html";
                return;
            }
        }
        try {
            this.currentStudent = await Api.get(
                Endpoints.students.details(studentId)
            );
        } catch (error) {
            console.error(error);
            alert(error.message || "Something went wrong.");
            this.currentStudent = null;
        } finally {
            this.render();
        }
    },

    // ================= RENDER =================

    render() {
        const student = this.currentStudent;

        if (!student) {
            return;
        }

        const btn = document.getElementById("headerActionBtn");
        const icon = document.getElementById("headerActionIcon");
        const text = document.getElementById("headerActionText");

        var dob = "-";
        var mobileNumber = "-";
        var guardianNumber = "-";
        var aadhaar = "-";
        var localAddress = "-";
        var permanentAddress = "-";

        (Session.isStudent()) ? formatHiddenDob(student.dateOfBirth) : formatDate(student.dateOfBirth);

        if (Session.isStudent()) {
            dob = formatHiddenDob(student.dateOfBirth);
            mobileNumber = formatHiddenMobileNumber(student.mobileNumber);
            guardianNumber = formatHiddenMobileNumber(student.guardianNumber);
            aadhaar = formatHiddenAadhaarNumber(student.aadhaarNumber);
            localAddress = formatHiddenAddress(student.localAddress);
            permanentAddress = formatHiddenAddress(student.permanentAddress);

            icon.className = "fa-solid fa-right-from-bracket";
            text.textContent = "Logout";

            btn.onclick = async () => {
                await Api.postWithoutResponse(Endpoints.auth.logout);
                window.location.href = "/student.html";
            };

        } else {
            dob = formatDate(student.dateOfBirth);
            mobileNumber = student.mobileNumber;
            guardianNumber = student.guardianNumber;
            aadhaar = student.aadhaarNumber;
            localAddress = student.localAddress;
            permanentAddress = student.permanentAddress;

            icon.className = "fa-solid fa-arrow-left";
            text.textContent = "Back";
            btn.onclick = () => history.back();

        }

        this.setValue("studentId", student.studentId);
        this.setValue("admissionDate", formatDate(student.dateOfAdmission));
        this.setValue("fullName", student.fullName);
        this.setValue("dateOfBirth", dob);
        this.setValue("mobileNumber", mobileNumber);
        this.setValue("guardianNumber", guardianNumber);
        this.setValue("fatherName", student.fatherName);
        this.setValue("aadhaarNumber", aadhaar);
        this.setValue("localAddress", localAddress);
        this.setValue("permanentAddress", permanentAddress);
        this.setValue("qualification", student.qualification);
        this.setValue("preparationFor", student.preparationFor);

        const lastFee = student.feeRecords?.[0] || null;

        this.setValue("fromDate", formatDate(lastFee?.fromDate));
        this.setValue("tillDate", formatDate(lastFee?.tillDate));
        this.setValue("seatNumber", lastFee?.seatNumber ?? "-");
        this.setValue("batchName", lastFee?.batchName ?? "-");
        this.toggleSeatSection(this.isSeatApplicable(lastFee));
        const enrollmentStatus = getUpdatedEnrollment(Date(), lastFee?.tillDate , student.enrollmentStatus)
        this.setValue("membershipTitle", enrollmentStatus === "ACTIVE" ? "Current Membership" : "Last Membership (Outdated)");
        this.updateEnrollmentStatus(enrollmentStatus);
        StudentActionsUI.init("studentActions", student);
    },

    // ================= HELPERS =================

    setValue(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value ?? "-";
    },

    updateEnrollmentStatus(status) {
        const badge = document.getElementById("enrollmentStatus");
        if (!badge) return;

        badge.textContent = status ?? "-";
        badge.className = "badge";

        const map = {
            ACTIVE: "active",
            EXPIRED: "expired",
            DISCONTINUED: "discontinued",
            TERMINATED: "terminated"
        };

        if (status && map[status.toUpperCase()]) {
            badge.classList.add(map[status.toUpperCase()]);
        }
    },

    toggleSeatSection(show) {
        const seatRow = document.getElementById("seatRow");
        const btn = document.getElementById("changeSeatButton");

        if (seatRow) seatRow.style.display = show ? "" : "none";
        if (btn) btn.style.display = show ? "inline-flex" : "none";
    },

    isSeatApplicable(feeRecord) {
        if (!feeRecord?.batchName) return false;

        const name = feeRecord.batchName.toUpperCase();

        return name.includes("FULL DAY") || name.includes("24 HOURS");
    },

    // ================= MODALS (UNCHANGED) =================

    showFeeHistory() {

        const records = this.currentStudent?.feeRecords ?? [];

        if (!records.length) {
            StudentDetailsModal.feeHistory(`
                <p style="padding:20px;text-align:center">
                    No Fee Records Found.
                </p>
            `);
            return;
        }
        let html = `
            <table class="fee-history-table">
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
        `;

        records.forEach((r, i) => {
            html += `
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

        html += `</tbody></table>`;

        StudentDetailsModal.feeHistory(html);
    },

    updateStudentDetails() {
        StudentDetailsModal.updateDetails(this.currentStudent);
    },

    async changeSeat() {

    //    await loadLookups();

        const currentSeatId =
            this.currentStudent?.feeRecords?.at(-1)?.seatId;

        let options = "";

        window.libraryLookups?.seats?.forEach(seat => {
            options += `
                <option value="${seat.id}" 
                    ${seat.id === currentSeatId ? "selected" : ""}>
                    ${seat.seatNumber}
                </option>
            `;
        });

        StudentDetailsModal.changeSeat(options);
    },

    openUpdateEnrollmentStatusModal() {
        StudentDetailsModal.updateStatus();
    }
};

// ✅ INIT
StudentDetailsPage.init();