/**
 * filters.js
 * Handles student search and filtering.
 */

/**
 * Returns all current filter values.
 */
function getFilters() {

    return {

        keyword:
            document.getElementById("search")
                ?.value
                .trim()
                .toLowerCase() || "",

        searchType:
            document.getElementById("searchType")
                ?.value || "all",

        batch:
            document.getElementById("batchFilter")
                ?.value || "",

        status:
            document.getElementById("statusFilter")
                ?.value || ""

    };

}

/**
 * Returns filtered students.
 */
function filterStudents(studentList) {

    const filters = getFilters();

    return studentList.filter(student => {

        return (
            matchesSearch(
                student,
                filters.keyword,
                filters.searchType
            ) &&
            matchesBatch(
                student,
                filters.batch
            ) &&
            matchesStatus(
                student,
                filters.status
            )
        );

    });

}

/**
 * Search filter.
 */
function matchesSearch(
    student,
    keyword,
    searchType
) {

    switch (searchType) {

        case "id":

            return student.studentId === Number(keyword);

        case "name":

            return (
                student.fullName ?? ""
            )
                .toLowerCase()
                .includes(keyword);

        case "mobile":

            return (
                student.mobileNumber ?? ""
            )
                .includes(keyword);

        case "seat":

            return (
                student.seatNumber ?? ""
            )
                .toLowerCase()
                .includes(keyword);

        default:

            return (

                String(student.studentId)
                    .includes(keyword)

                ||

                (
                    student.fullName ?? ""
                )
                    .toLowerCase()
                    .includes(keyword)

                ||

                (
                    student.mobileNumber ?? ""
                )
                    .includes(keyword)

                ||

                (
                    student.seatNumber ?? ""
                )
                    .toLowerCase()
                    .includes(keyword)

            );

    }

}

/**
 * Batch filter.
 */
function matchesBatch(
    student,
    batch
) {

    return (
        !batch ||
        String(student.batchId) === batch
    );

}

/**
 * Status filter.
 */
function matchesStatus(
    student,
    status
) {

    return (
        !status ||
        student.enrollmentStatus === status
    );

}

/**
 * Reset all filters.
 */
function resetFilters() {

    document.getElementById("searchType").value = "all";
    document.getElementById("search").value = "";
    document.getElementById("batchFilter").value = "";
    document.getElementById("statusFilter").value = "";

    renderStudents();

}

/**
 * Register filter events.
 */
function initializeFilters() {

    const search =
        document.getElementById("search");

    const searchType =
        document.getElementById("searchType");

    const batch =
        document.getElementById("batchFilter");

    const status =
        document.getElementById("statusFilter");

    search?.addEventListener(
        "input",
        renderStudents
    );

    searchType?.addEventListener(
        "change",
        renderStudents
    );

    batch?.addEventListener(
        "change",
        renderStudents
    );

    status?.addEventListener(
        "change",
        renderStudents
    );

}