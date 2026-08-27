window.StudentDetailsModal = {

    el: null,
    container: null,
    isInitialized: false,

    init() {
        if (this.isInitialized) return;

        this.el = document.getElementById("appModal");
        this.container = document.getElementById("appModalContainer");

        if (!this.el || !this.container) {
            console.error("❌ Modal root not found");
            return;
        }

        // ✅ Close on background click
        this.el.addEventListener("click", (e) => {
            if (e.target === this.el) {
                this.close();
            }
        });

        // ✅ Close on ESC
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.close();
            }
        });

        this.isInitialized = true;
    },

    open(html) {
        this.init();

        if (!this.el || !this.container) return;

        this.container.innerHTML = html;
        this.el.style.display = "block";
    },

    close() {
        if (this.el) this.el.style.display = "none";
        if (this.container) this.container.innerHTML = "";
    },

    // ================= VIEWS =================

    feeHistory(bodyHtml = "") {
        this.open(`
        <div class="modal-content" style="max-width:1200px;">
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Fee Records
                </h2>
                <button onclick="StudentDetailsModal.close()">✕</button>
            </div>

            <div class="modal-body">
                ${bodyHtml}
            </div>
        </div>
        `);
    },

    updateDetails(data = {}) {
        this.open(`
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-user-pen"></i>
                    Update Student Details
                </h2>
                <button onclick="StudentDetailsModal.close()">✕</button>
            </div>

            <div class="modal-body">

                <div id="updateStudentMessage" class="form-message"></div>

                <div class="form-group">
                    <label>Full Name</label>
                    <input id="updateFullName" type="text" value="${data.fullName || ""}">
                </div>

                <div class="form-group">
                    <label>Mobile Number</label>
                    <input id="updateMobileNumber" type="tel" maxlength="10" value="${data.mobileNumber || ""}">
                </div>

                <div class="form-group">
                    <label>Guardian Number</label>
                    <input id="updateGuardianNumber" type="tel" maxlength="10" value="${data.guardianNumber || ""}">
                </div>

            </div>

            <div class="modal-footer">
                <button class="secondary-btn" onclick="StudentDetailsModal.close()">Cancel</button>
                <button class="primary-btn" onclick="StudentActions.saveDetails()">
                    Save Changes
                </button>
            </div>
        </div>
        `);
    },

    changeSeat(optionsHtml = "") {
        this.open(`
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-chair"></i>
                    Change Seat
                </h2>
                <button onclick="StudentDetailsModal.close()">✕</button>
            </div>

            <div class="modal-body">

                <div id="changeSeatMessage" class="form-message"></div>

                <div class="form-group">
                    <label>Seat Number</label>
                    <select id="newSeatId">
                        <option value="">-- Select Seat --</option>
                        ${optionsHtml}
                    </select>
                </div>

            </div>

            <div class="modal-footer">
                <button class="secondary-btn" onclick="StudentDetailsModal.close()">Cancel</button>
                <button class="primary-btn" onclick="SeatActions.save()">
                    Update Seat
                </button>
            </div>
        </div>
        `);
    },

    updateStatus(currentStatus) {
        let options = `<option value="">-- Select Status --</option>`;

        // Admin can reactivate terminated students
        if (Session.isAdmin() && currentStatus === "TERMINATED") {
            options += `<option value="ACTIVE">Active</option>`;
        } else {
            // Normal status changes
            if (currentStatus !== "DISCONTINUED") {
                options += `<option value="DISCONTINUED">Discontinued</option>`;
            }

            if (currentStatus !== "TERMINATED") {
                options += `<option value="TERMINATED">Terminated</option>`;
            }
        }

        this.open(`
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h2>
                    <i class="fa-solid fa-user-check"></i>
                    Update Enrollment Status
                </h2>
                <button onclick="StudentDetailsModal.close()">✕</button>
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
                <button class="secondary-btn" onclick="StudentDetailsModal.close()">Cancel</button>
                <button class="primary-btn" onclick="EnrollmentActions.save()">
                    Update Status
                </button>
            </div>
        </div>
        `);
    }
};