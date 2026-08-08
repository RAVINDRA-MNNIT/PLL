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

        console.log("Resolved studentId:", studentId);

        if (!studentId) {
            console.warn("⚠️ Student ID not found");
            return;
        }

        this.loadStudent(studentId);

    } catch (error) {
        console.error(error);
    }
},

    // ================= API =================

    async loadStudent(studentId) {
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
            console.error("❌ student is null");
            return;
        }

        this.setValue("studentId", student.studentId);
        this.setValue("admissionDate", formatDate(student.dateOfAdmission));
        this.setValue("fullName", student.fullName);
        this.setValue("dateOfBirth", formatDate(student.dateOfBirth));
        this.setValue("mobileNumber", student.mobileNumber);
        this.setValue("guardianNumber", student.guardianNumber);
        this.setValue("fatherName", student.fatherName);
        this.setValue("aadharNumber", student.aadhaarNumber);
        this.setValue("localAddress", student.localAddress);
        this.setValue("permanentAddress", student.permanentAddress);
        this.setValue("qualification", student.qualification);
        this.setValue("preparationFor", student.preparationFor);

        const lastFee = student.feeRecords?.at(-1) || null;

        this.setValue("membershipFrom", formatDate(lastFee?.membershipFrom));
        this.setValue("membershipTill", formatDate(lastFee?.membershipTill));
        this.setValue("seatNumber", lastFee?.seatNumber ?? "-");
        this.setValue("batchName", lastFee?.batchName ?? "-");

        this.toggleSeatSection(this.isSeatApplicable(lastFee));
        this.updateEnrollmentStatus(student.enrollmentStatus);
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
            <table>
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

        html += `</tbody></table>`;

        StudentDetailsModal.feeHistory(html);

        // ❌ OLD (KEPT)
        // document.getElementById("feeHistoryModal").style.display = "flex";
    },

    updateStudentDetails() {
        StudentDetailsModal.updateDetails(this.currentStudent);
    },

    async changeSeat() {

        await loadLookups();

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