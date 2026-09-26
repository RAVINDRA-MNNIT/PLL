/**
 * student-details.js
 * Handles Student Details page.
 */ 
window.StudentDetailsPage = {

    currentStudent: null,
    studentWarnings: [],
    studentComplaints: [],

    // ================= INIT =================
init() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.initialize());
    } else {
        this.initialize(); // ✅ CRITICAL FIX
    }
},

initialize() {
    document.getElementById("detailLibraryName").textContent = `${this.getConfigurations().LIBRARY_NAME}`;
    try {
        // ✅ GET ID FROM URL (CORRECT FLOW)
        const params = new URLSearchParams(window.location.search);
        let studentId = params.get("id");
        if (!studentId) return;
        this.loadStudent(studentId);
    } catch (error) {
        console.error(error);
    }
},

    // ================= API =================

    async loadStudent(studentId) {
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
            this.currentStudent = await Api.get(Endpoints.students.details(studentId));
            this.studentWarnings = await this.getStudentWarnings(studentId);
            this.studentComplaints = await this.getStudentComplaints(studentId);
        } catch (error) {
            console.error(error);
            alert(error.message || "Something went wrong.");
            this.currentStudent = null;
        } finally {

            this.render();
            this.showWarningNotice();
        }
    },

    getConfigurations() {
        return JSON.parse(sessionStorage.getItem("configurations"));
    },

    // ================= RENDER =================

    render() {
        const student = this.currentStudent;
        if (!student) return;
        const btn = document.getElementById("headerActionBtn");
        const icon = document.getElementById("headerActionIcon");
        const text = document.getElementById("headerActionText");
        const idCardBtn = document.getElementById("idCardBtn");
        var dob = "-";
        var mobileNumber = "-";
        var guardianNumber = "-";
        var aadhaar = "-";
        var localAddress = "-";
        var permanentAddress = "-";

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
        if (idCardBtn) {
            idCardBtn.onclick = () => {
                StudentIdCard.open(student);
            };
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
        this.setValue("fromDate", formatDate(student.lastFee.fromDate));
        this.setValue("tillDate", formatDate(student.lastFee.tillDate));
        this.setValue("seatNumber", student.lastFee.seatNumber ?? "-");
        this.setValue("batchName", student.lastFee.batchName ?? "-");
        this.toggleSeatSection(this.isSeatApplicable(student.lastFee));
        const enrollmentStatus = student.enrollmentStatus;
        this.setValue("membershipTitle", enrollmentStatus === "ACTIVE" ? "Current Membership" : "Last Membership (Outdated)");
        this.updateEnrollmentStatus(enrollmentStatus);
        StudentActionsUI.init("studentActions", student, this.studentWarnings, this.studentComplaints);
    },

    showWarningNotice() {
        const warningCount = this.studentWarnings.length ?? 0;
        const isStudent = Session.isStudent();
        const notice =
            document.getElementById("studentWarningNotice");

        if (!notice) {
            return;
        }

        if (!warningCount || warningCount <= 0) {
            notice.style.display = "none";
            notice.textContent = "";
            return;
        }

        if (isStudent) {
            if (this.currentStudent.enrollmentStatus.toUpperCase() === "TERMINATED") {
                notice.textContent = `You are terminated.`;
            } else {
                notice.textContent = `You have ${warningCount} warning(s), only three warnings will be tolerated after that you will get terminated so don't make mistakes.`;
            }
        } else {
            if (this.currentStudent.enrollmentStatus.toUpperCase() === "TERMINATED") {
                notice.textContent = `This student is terminated.`;
            } else {
                notice.textContent = `This student has ${warningCount} warning(s).`;
            }
        }

        notice.style.display = "block";
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
    async changeSeat() {
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

    // ================= API =================

    async getStudentWarnings(studentId) {
        try {
            return await Api.get(
                Endpoints.students.getStudentWarnings(studentId)
            );
        } catch (error) {
            return [];
        }
    },

    async getStudentComplaints(studentId) {
        try {
            return await Api.get(
                Endpoints.students.getStudentComplaints(studentId)
            );
        } catch (error) {
            return [];
        }
    },
};
// ✅ INIT
StudentDetailsPage.init();