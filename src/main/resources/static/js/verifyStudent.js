const VerifyStudent = {
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
            }
        );
        input.focus();
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
            const student = await Api.get(Endpoints.students.details(membershipId));
            await StudentIdCard.open(student);
        } catch (error) {
            console.error(error);
            alert(error.message || "Something went wrong.");
            this.currentStudent = null;
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
        window.location.href = `/student-details.html?id=${membershipId}`;
    },

    render(student) {
        const result = document.getElementById("verifyStudentResult");
        if (!result) {return;}
        result.innerHTML = `
            <div class="verified-student-card">
                <div class="verified-student-header">
                    <div>
                        <h3>
                            ${student.fullName ?? "-"}
                        </h3>
                        <small>
                            Membership ID:
                            ${student.studentId ?? "-"}
                        </small>
                    </div>
                    <span class="status-badge">
                        ${student.enrollmentStatus ?? "-"}
                    </span>

                </div>

                <div class="student-details-grid">

                    <div class="detail-item">
                        <label>Mobile</label>
                        <strong>
                            ${student.mobileNumber ?? "-"}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <label>Father Name</label>
                        <strong>
                            ${student.fatherName ?? "-"}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <label>Batch</label>
                        <strong>
                            ${student.batchName ?? "-"}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <label>Seat</label>
                        <strong>
                            ${student.seatNumber ?? "-"}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <label>From Date</label>
                        <strong>
                            ${formatDate(student.fromDate)}
                        </strong>
                    </div>

                    <div class="detail-item">
                        <label>Till Date</label>
                        <strong>
                            ${formatDate(student.tillDate)}
                        </strong>
                    </div>

                </div>

            </div>
        `;

        result.style.display = "block";
    }
};