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
                ?.value || "",

        pendingFees:
            document.getElementById("pendingFeesFilter")
                ?.checked || false,

        discount:
            document.getElementById("discountFilter")
                ?.checked || false
    };
}
/**
 * Reset all filters.
 */
function resetFilters() {
    const filters = getFilters();

    if (
        filters.batch.trim() === "" &&
        filters.searchType.trim() === "all" &&
        filters.status.trim() === "" &&
        filters.keyword.trim() === "" &&
        !filters.pendingFees &&
        !filters.discount
    ) {
        return;
    }

    document.getElementById("searchType").value = "all";
    document.getElementById("search").value = "";
    document.getElementById("batchFilter").value = "";
    document.getElementById("statusFilter").value = "";

    document.getElementById("pendingFeesFilter").checked = false;
    document.getElementById("discountFilter").checked = false;

    resetPageAndLoadStudent();
}

function debounce(fn, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
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

    const pendingFees =
        document.getElementById("pendingFeesFilter");

    const discount =
        document.getElementById("discountFilter");

    const debouncedSearch = debounce(() => {
        resetPageAndLoadStudent();
    }, 1000);

    search?.addEventListener(
        "input",
        debouncedSearch
    );

    searchType?.addEventListener("change", () => {
        if (search?.value.trim() !== "") {
            resetPageAndLoadStudent();
        }
    });

    batch?.addEventListener(
        "change",
        resetPageAndLoadStudent
    );

    status?.addEventListener(
        "change",
        resetPageAndLoadStudent
    );

    pendingFees?.addEventListener(
        "change",
        resetPageAndLoadStudent
    );

    discount?.addEventListener(
        "change",
        resetPageAndLoadStudent
    );
}