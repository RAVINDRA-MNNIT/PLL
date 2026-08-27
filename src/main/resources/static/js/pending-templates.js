window.PendingTemplates = {

    // ================= ADMISSION =================

    admissionTableHeader() {
        return `
            <tr>
                <th>Request ID</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Batch</th>
                <th>Admission</th>
                <th>Submitted</th>
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
                <td>${item.mobileNumber ?? "-"}</td>
                <td>${item.batchName ?? "-"}</td>
                <td>${this.formatDate(item.fromDate) ?? "-"}</td>
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
                <th>Student ID</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Duration</th>
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
                <td>${item.lastFullName ?? "-"}</td>
                <td>${item.batchName ?? "-"}</td>
                <td>
                    <div><strong>From:</strong> ${this.formatDate(item.fromDate) ?? "-"}</div>
                    <div><strong>To:</strong> ${this.formatDate(item.tillDate) ?? "-"}</div>
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
                <th>Request ID</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Current Seat</th>
                <th>New Seat</th>
                <th>Requested By</th>
                <th>Requested At</th>
                <th>Actions</th>
            </tr>
        `;
    },

    seatRow(item, actions, requestedAt) {
        return `
            <tr>
                <td>${item.requestId}</td>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.lastFullName ?? "-"}</td>
                <td>${item.lastFeeSeatNumber ?? "-"}</td>
                <td>${item.seatNumber ?? "-"}</td>
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
                <th>Request ID</th>
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
                <td>${item.requestId ?? "-"}</td>
                <td>${item.studentId ?? "-"}</td>
                <td>${this.formatDetails(item.lastFullName, item.lastMobileNumber, item.lastGuardianNumber)}</td>
                <td>${this.formatDetails(item.fullName, item.mobileNumber, item.guardianNumber)}</td>
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
                <th>Request ID</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Current Status</th>
                <th>New Status</th>
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
                <td>${item.requestId ?? "-"}</td>
                <td>${item.studentId ?? "-"}</td>
                <td>${item.lastFullName ?? "-"}</td>
                <td>${this.renderStatus(item.lastEnrollmentStatus)}</td>
                <td>${this.renderStatus(item.enrollmentStatus)}</td>
                <td>${this.formatDate(item.lastFeeTillDate)}</td>
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
                <th>Request Data</th>
                <th>Request Type</th>
                <th>Requested At</th>
                <th>Remark</th>
                <th>Requested Status</th>
            </tr>
        `;
    },

allRow(item, actions, requestedAt) {
    return `
        <tr>
            <td>${item.requestId ?? "-"}</td>
            <td>${item.studentId ?? "-"}</td>

            <td>
                <button
                    class="icon-btn"
                    title="View Request Data"
                    onclick="PendingTemplates.viewRequestData(${JSON.stringify(item.requestData).replace(/"/g, '&quot;')})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>

            <td>${item.requestType || "-"}</td>
            <td>${requestedAt}</td>
            <td>${item.remarks ?? "-"}</td>
            <td>
                ${this.renderStatus(item.requestStatus || item.status)}
            </td>
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

    actions(requestId, isAdmin, isManager, comments, shouldShowEdit) {
        const hasComments = comments && comments.trim() !== "";
        let html = "";

        if (hasComments) {
            html += `
                <button
                    class="icon-btn comment"
                    title="View Comment"
                    onclick='PendingApprovals.viewComment(${JSON.stringify(comments)})'>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </button>
            `;
        }

        if (isAdmin) {
            if (!hasComments) {
                if (shouldShowEdit) {
                    html += `
                    <button class="icon-btn view"
                        onclick="PendingApprovals.viewEdit(${requestId})">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                `;
                }
                html += `
                    <button class="icon-btn approve"
                        onclick="PendingApprovals.approveRequest(${requestId})">
                        <i class="fa-solid fa-circle-check"></i>
                    </button>
                `;
                html += `
                    <button class="icon-btn reject"
                        onclick="PendingApprovals.rejectRequest(${requestId})">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                `;
            }

        } else if (isManager) {
  
            if (shouldShowEdit) {
                html += `
                    <button class="icon-btn view"
                        onclick="PendingApprovals.viewEdit(${requestId})">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                `;
            }
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

    const key = status.toLowerCase();

    const map = {
        active: "status-active",
        pending: "status-pending",
        rejected: "status-rejected",
        approved: "status-approved",
        cancelled: "status-cancelled",
        expired: "status-expired",
        discontinued: "status-discontinued",
        terminated: "status-terminated"
    };

    const cls = map[key] || "status-default";

    return `
        <span class="status ${cls}">
            ${status.toUpperCase()}
        </span>
    `;
},

    formatDate(value) {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("en-IN");
    },

    formatDetails(name, mobile, guardianNumber) {
        return `
            <div><strong>Name:</strong> ${name}</div>
            <div><strong>Mobile:</strong> ${mobile}</div>
            <div><strong>Guardian number:</strong> ${guardianNumber}</div>
        `;
    },

    renderMembership(item) {
        if (item.fromDate || item.tillDate) {
            return `
                <div><strong>From:</strong> ${item.fromDate ?? "-"}</div>
                <div><strong>To:</strong> ${item.tillDate ?? "-"}</div>
            `;
        }
        return "-";
    },

    viewRequestData(comment) {
        alert(comment)
    }
};