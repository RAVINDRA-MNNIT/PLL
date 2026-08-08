/**
 * students.js
 * Handles student data and rendering.
 */
let students = [];

/**
 * Load students from server.
 */
async function loadStudents() {
    try {
        students = await Api.get(Endpoints.students.list);
    } catch (error) {
        alert(error.message || "Something went wrong.");
        console.error(error);
        students = [];
    } finally {
        renderStudents();
    }
}

/**
 * Render students.
 */
function renderStudents() {

    const filtered =
        filterStudents(students);

    renderStudentTable(filtered);

    updateStatistics(filtered);

}

/**
 * Render table.
 */
function renderStudentTable(studentList) {

    const tbody =
        document.getElementById("studentRows");

    tbody.innerHTML = "";

    if (studentList.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="11"
                    style="text-align:center;padding:30px;color:#64748b">
                    No students found.
                </td>
            </tr>
        `;

        return;

    }

    studentList.forEach(student => {

        tbody.appendChild(
            createStudentRow(student)
        );

    });

}

/**
 * Create row.
 */
function createStudentRow(student) {

    const row = document.createElement("tr");

    row.classList.add("student-row");

    row.onclick = function (event) {
        // Don't open details if Update Fees button was clicked
        if (event.target.closest(".update-fees-btn")) {
            return;
        }
        viewStudentDetails(student.studentId);
    };

    const badgeClass =
        student.enrollmentStatus === "ACTIVE"
            ? "active"
            : "expired";

    row.innerHTML = `
        <td>
            <strong>${escapeHtml(student.studentId)}</strong>
        </td>

        <td>${escapeHtml(student.fullName)}</td>

        <td>${escapeHtml(student.mobileNumber)}</td>

        <td>${escapeHtml(student.batchName)}</td>

        <td>${escapeHtml(student.seatNumber ?? "-")}</td>

        <td>
            ₹${Number(student.submittedAmount ?? 0)
                .toLocaleString("en-IN")}
        </td>

        <td>${formatDate(student.membershipFrom)}</td>

        <td>${formatDate(student.membershipTill)}</td>

        <td>
            <span class="badge ${badgeClass}">
                ${escapeHtml(student.enrollmentStatus)}
            </span>
        </td>

        <td>
            ${escapeHtml(student.pendingApprovalCount)}
        </td>

        <td>
            <button
                class="update-fees-btn"
                onclick="updateFees(${student.studentId})">

                <i class="fa-solid fa-money-bill-wave"></i>

                Update Fees

            </button>
        </td>
    `;

    return row;

}

/**
 * Update dashboard statistics.
 */
function updateStatistics(data = students) {

    document.getElementById("total").textContent =
        data.length;

    document.getElementById("activeCount").textContent =
        data.filter(student =>
            (student.enrollmentStatus ?? "")
                .toUpperCase() === "ACTIVE"
        ).length;

    document.getElementById("expiredCount").textContent =
        data.filter(student =>
            (student.enrollmentStatus ?? "")
                .toUpperCase() === "EXPIRED"
        ).length;

    document.getElementById("pendingCount").textContent =
        data.reduce(
            (count, student) =>
                count + Number(student.pendingApprovalCount ?? 0),
            0
        );

}

function viewStudentDetails(studentId) {
    window.location.href = `/student-details.html?id=${studentId}`;
}