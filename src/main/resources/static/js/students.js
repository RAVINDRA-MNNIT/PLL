/**
 * students.js
 * Handles student data and rendering.
 */
let students = [];
let currentPage = 1;
let pageSize = getConfigurations().PAGE_LIMIT ?? 20;
let totalPages = 1;
let totalStudents = 0;

/**
 * Load students from server.
 */
async function loadStudents(page = 1) {
    const filters = getFilters();
    try {
        const response = await Api.get(
            Endpoints.students.list(
                filters.searchType,
                filters.keyword,
                filters.batch,
                filters.status,
                page,
                pageSize
            )
        );

        students = response.students || [];
        currentPage = response.currentPage;
        totalPages = response.totalPages;
        totalStudents = response.total;

    } catch (error) {
        console.error(error);
        resetPage()
    } finally {
        renderStudents();
    }
}

async function loadPendingCounts() {
    try {
        const response = await Api.get(
            Endpoints.pending.pendingCount
        );
        document.getElementById("pendingCount").textContent = response;
    } catch (error) {
        console.error(error);
        resetPage()
    } finally {
        renderStudents();
    }
}
/**
 * Render students.
 */
function renderStudents() {
    document.getElementById("currentPage").textContent = currentPage;
    document.getElementById("totalPages").textContent = totalPages;

    // const filtered =
    //     filterStudents(students);

    renderStudentTable(students);

    updateStatistics(students);
    updatePaginationButtons();

}

function updatePaginationButtons() {

    document.getElementById("firstPageBtn").disabled = currentPage === 1;
    document.getElementById("prevPageBtn").disabled = currentPage === 1;

    document.getElementById("nextPageBtn").disabled = currentPage === totalPages;
    document.getElementById("lastPageBtn").disabled = currentPage === totalPages;
}

function setPaginationButtonandAction() {
    pageSize = getConfigurations().PAGE_LIMIT ?? 20;
    document.getElementById("firstPageBtn").onclick = () => {
        if (currentPage !== 1) {
            loadStudents(1);
        }
    };

    document.getElementById("prevPageBtn").onclick = () => {
        if (currentPage > 1) {
            loadStudents(currentPage - 1);
        }
    };

    document.getElementById("nextPageBtn").onclick = () => {
        if (currentPage < totalPages) {
            loadStudents(currentPage + 1);
        }
    };

    document.getElementById("lastPageBtn").onclick = () => {
        if (currentPage !== totalPages) {
            loadStudents(totalPages);
        }
    };
}

function  resetPage() {
    students = [];
    currentPage = 1;
    totalPages = 1;
    totalStudents = 0;
}

function resetPageAndLoadStudent() {
    resetPage();
    loadStudents(1);
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

     const diffDays = getDateDifferenceInDays(new Date(), student.tillDate)

    const badgeClassMap = {
        ACTIVE: "active",
        EXPIRED: "expired",
        DISCONTINUED: "discontinued",
        TERMINATED: "terminated"
    };
    const DAYS_BEFORE_NEXT_FEE_SUBMIT = getConfigurations().DAYS_BEFORE_NEXT_FEE_SUBMIT ?? 3
    const badgeClass =
        badgeClassMap[student.enrollmentStatus?.toUpperCase()] || "";
    let isTerminated = true;
    let buttonMsg = null;
    // console.log("diff" + diffDays);
    if (student.enrollmentStatus === "TERMINATED") {
        buttonMsg = `Student is terminated`;
    } else if (diffDays > DAYS_BEFORE_NEXT_FEE_SUBMIT) {
        buttonMsg = `You can only submit next fees if membership expires in ${DAYS_BEFORE_NEXT_FEE_SUBMIT} days`;
    } else {
        isTerminated = false
    }

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

        <td>${formatDate(student.fromDate)}</td>

        <td>${formatDate(student.tillDate)}</td>

        <td>
            <span class="badge ${badgeClass}">
                ${escapeHtml(student.enrollmentStatus)}
            </span>
        </td>

        <td>
            <button class="update-fees-btn" ${isTerminated ? `disabled title="${buttonMsg}"` : `onclick="updateFees(${student.studentId})"`}>
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

    document.getElementById("total").textContent = totalStudents;

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
}

function viewStudentDetails(studentId) {
    window.location.href = `/student-details.html?id=${studentId}`;
}