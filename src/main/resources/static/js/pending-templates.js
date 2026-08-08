window.PendingTemplates = {

    // ================= ADMISSION =================

    admissionTableHeader() {
        return `
            <tr>
                <th>Request ID</th>
                <th>Membership ID</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Batch</th>
                <th>Admission Date</th>
                <th>Submitted Amount</th>
                <th>Actions</th>
            </tr>
        `;
    },

    admissionRow(item, actions) {
        return `
            <tr>
                <td>${item.requestId}</td>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.fullName ?? "-"}</td>
                <td>${item.mobile ?? "-"}</td>
                <td>${item.batchName ?? "-"}</td>
                <td>${item.membershipFrom ?? "-"}</td>
                <td>${item.submittedAmount ?? 0}</td>
                <td>${actions}</td>
            </tr>
        `;
    },

    // ================= FEES =================

    feeTableHeader() {
        return `
            <tr>
                <th>Request ID</th>
                <th>Membership ID</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Membership Duration</th>
                <th>Submitted</th>
                <th>Discount</th>
                <th>Pending</th>
                <th>Payment Mode</th>
                <th>Requested By</th>
                <th>Requested On</th>
                <th>Actions</th>
            </tr>
        `;
    },

    feeRow(item, actions, requestedAt) {
        return `
            <tr>
                <td>${item.requestId}</td>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.fullName ?? "-"}</td>
                <td>${item.batchName ?? "-"}</td>
                <td>
                    <div><strong>From:</strong> ${item.membershipFrom ?? "-"}</div>
                    <div><strong>To:</strong> ${item.membershipTill ?? "-"}</div>
                </td>
                <td>${item.submittedAmount ?? 0}</td>
                <td>${item.discount ?? 0}</td>
                <td>${item.pendingAmount ?? 0}</td>
                <td>${item.paymentMode ?? "-"}</td>
                <td>${item.requestedBy ?? "-"}</td>
                <td>${requestedAt}</td>
                <td>${actions}</td>
            </tr>
        `;
    },

    // ================= SEAT =================

    seatTableHeader() {
        return `
            <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Current Seat</th>
                <th>Requested Seat</th>
                <th>Requested By</th>
                <th>Requested At</th>
                <th>Actions</th>
            </tr>
        `;
    },

    seatRow(item, actions, requestedAt) {
        return `
            <tr>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.studentName ?? "-"}</td>
                <td>${item.batch ?? "-"}</td>
                <td>${item.currentSeat ?? "-"}</td>
                <td>${item.requestedSeat ?? "-"}</td>
                <td>${item.requestedBy ?? "-"}</td>
                <td>${requestedAt}</td>
                <td>${actions}</td>
            </tr>
        `;
    },

    // ================= DETAILS =================

    detailTableHeader() {
        return `
            <tr>
                <th>Student ID</th>
                <th>Current Details</th>
                <th>New Details</th>
                <th>Requested By</th>
                <th>Requested At</th>
                <th>Actions</th>
            </tr>
        `;
    },

    detailRow(item, actions, requestedAt) {
        return `
            <tr>
                <td>${item.studentId ?? "-"}</td>
                <td>${this.formatDetails(item.currentDetails)}</td>
                <td>${this.formatDetails(item.newDetails)}</td>
                <td>${item.requestedBy ?? "-"}</td>
                <td>${requestedAt}</td>
                <td>${actions}</td>
            </tr>
        `;
    },

    // ================= ENROLLMENT =================

    enrollmentTableHeader() {
        return `
            <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Current Status</th>
                <th>Requested Status</th>
                <th>Valid Till</th>
                <th>Requested By</th>
                <th>Requested At</th>
                <th>Actions</th>
            </tr>
        `;
    },

    enrollmentRow(item, actions, requestedAt) {
        return `
            <tr>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.studentName ?? "-"}</td>
                <td>${this.renderStatus(item.currentStatus)}</td>
                <td>${this.renderStatus(item.requestedStatus)}</td>
                <td>${this.formatDate(item.validTill)}</td>
                <td>${item.requestedBy ?? "-"}</td>
                <td>${requestedAt}</td>
                <td>${actions}</td>
            </tr>
        `;
    },

    // ================= ALL REQUEST STATUS =================

    allTableHeader() {
        return `
            <tr>
                <th>Request ID</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Membership Duration</th>
                <th>Request Type</th>
                <th>Requested Status</th>
                <th>Remark</th>
                <th>Requested At</th>
            </tr>
        `;
    },

    allRow(item, actions, requestedAt) {
        return `
            <tr>
                <td>${item.requestId ?? "-"}</td>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.fullName || item.studentName || "-"}</td>
                <td>${item.batchName || item.batch || "-"}</td>

                <td>
                    ${this.renderMembership(item)}
                </td>

                <td>${item.type ?? "-"}</td>

                <td>
                    ${this.renderStatus(item.requestedStatus || item.status)}
                </td>

                <td>${item.remark ?? "-"}</td>

                <td>${requestedAt}</td>
            </tr>
        `;
    },

    // ================= COMMON =================

    emptyRow(colspan) {
        return `
            <tr>
                <td colspan="${colspan}" style="text-align:center;padding:30px;">
                    No pending requests found.
                </td>
            </tr>
        `;
    },

    actions(requestId, isAdmin, isManager) {
        let html = `
            <button class="icon-btn view"
                onclick="PendingApprovals.viewEdit(${requestId})">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
        `;

        if (isAdmin) {
            html += `
                <button class="icon-btn approve"
                    onclick="PendingApprovals.approveRequest(${requestId})">
                    <i class="fa-solid fa-circle-check"></i>
                </button>
                <button class="icon-btn reject"
                    onclick="PendingApprovals.rejectRequest(${requestId})">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
            `;
        } else if (isManager) {
            html += `
                <button class="icon-btn cancel"
                    onclick="PendingApprovals.cancelRequest(${requestId})">
                    <i class="fa-solid fa-ban"></i>
                </button>
            `;
        }

        return html;
    },

    // ===== HELPERS =====

    renderStatus(status) {
        if (!status) return "-";

        const map = {
            active: "status-active",
            pending: "status-pending",
            rejected: "status-rejected",
            approved: "status-approved",
            expired: "status-expired",
            discontinued: "status-discontinued",
            terminated: "status-terminated"
        };

        const cls = map[status.toLowerCase()] || "status-default";

        return `<span class="status ${cls}">${status}</span>`;
    },

    formatDate(value) {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("en-IN");
    },

    formatDetails(details) {
        if (!details) return "-";

        if (typeof details === "object") {
            return Object.entries(details)
                .map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
                .join("");
        }

        return details;
    },

    renderMembership(item) {
        if (item.membershipFrom || item.membershipTill) {
            return `
                <div><strong>From:</strong> ${item.membershipFrom ?? "-"}</div>
                <div><strong>To:</strong> ${item.membershipTill ?? "-"}</div>
            `;
        }
        return "-";
    }
};