/**
 * lookups.js
 * Handles loading and caching lookup data.
 */

window.libraryLookups = {
    configurations: {},
    qualifications: [],
    batches: [],
    fullBatchList: [],
    preparations: [],
    seats: [],
    loaded: false
};

let lookupsLoaded = false;

/**
 * Fetch lookup data.
 */
async function fetchLookup(endpoint) {
    try {
        return await Api.get(endpoint);
    } catch (error) {
        alert(error.message || "Something went wrong.");
        return [];
    }
}

/**
 * Load all lookup data.
 */
async function loadLookups(forceReload = false) {

    if (window.libraryLookups.loaded && !forceReload) {
        return;
    }

    const [
        configurations,
        qualifications,
        batches,
        preparations,
        seats
    ] = await Promise.all([
        fetchLookup(Endpoints.lookups.configurations),
        fetchLookup(Endpoints.lookups.qualifications),
        fetchLookup(Endpoints.lookups.batches),
        fetchLookup(Endpoints.lookups.preparations),
        fetchLookup(Endpoints.lookups.seats)
    ]);
    window.libraryLookups.configurations = configurations
    window.libraryLookups.qualifications = qualifications || [];
    window.libraryLookups.fullBatchList = batches || [];
    window.libraryLookups.batches = (batches || []).filter(batch => batch.isActive === true);
    window.libraryLookups.preparations = preparations || [];
    window.libraryLookups.seats = seats || [];

    window.libraryLookups.loaded = true;   // ✅ single source of truth
    sessionStorage.setItem("configurations", JSON.stringify(configurations));
    populateBatchFilter();
    window.dispatchEvent(new CustomEvent("library-lookups-ready"));
}

async function loadConfiguration() {
    const [
        configurations,
    ] = await Promise.all([
        fetchLookup(Endpoints.lookups.configurations),
    ]);
    sessionStorage.setItem(
        "configurations",
        JSON.stringify(configurations)
    );
    window.libraryLookups.configurations = configurations
}

/**
 * Reload ONLY seats lookup
 */
async function reloadSeats() {
    try {
        const seats = await fetchLookup(Endpoints.lookups.seats);
        window.libraryLookups.seats = seats || [];
    } catch (e) {
        console.error("Failed to reload seats ❌", e);
    }
}

/**
 * Reload ONLY batches lookup
 */
async function reloadBatches() {
    try {
        const batches = await fetchLookup(Endpoints.lookups.batches);
        window.libraryLookups.fullBatchList = batches || [];
        window.libraryLookups.batches = (batches || []).filter(batch => batch.isActive === true);
    } catch (e) {
        console.error("Failed to reload batches ❌", e);
    }
}

/**
 * Populate batch filter.
 */
function populateBatchFilter() {

    const batchFilter =
        document.getElementById("batchFilter");

    if (!batchFilter) {
        return;
    }

    batchFilter.innerHTML =
        '<option value="">All Batches</option>';

    window.libraryLookups.batches.forEach(batch => {

        const option =
            document.createElement("option");

        option.value = batch.id;
        option.textContent = batch.name;

        batchFilter.appendChild(option);

    });

}

/**
 * Configurations
 */
function getConfigurations() {

    return window.libraryLookups.configurations;

}

/**
 * Qualifications
 */
function getQualifications() {

    return window.libraryLookups.qualifications;

}

/**
 * Batches
 */
function getBatches() {

    return window.libraryLookups.batches;

}

/**
 * Full Batches
 */
function getFullBatchesList() {

    return window.libraryLookups.fullBatchList;

}

/**
 * Preparations
 */
function getPreparations() {

    return window.libraryLookups.preparations;

}

/**
 * Seats
 */
function getSeats() {

    return window.libraryLookups.seats;

}

/**
 * Find Batch
 */
function findBatch(batchId) {

    return window.libraryLookups.batches.find(
        batch =>
            String(batch.id) === String(batchId)
    );

}

/**
 * Find Preparation
 */
function findPreparation(preparationId) {

    return window.libraryLookups.preparations.find(
        preparation =>
            String(preparation.id) === String(preparationId)
    );

}

/**
 * Find Seat
 */
function findSeat(seatId) {

    return window.libraryLookups.seats.find(
        seat =>
            String(seat.id) === String(seatId)
    );

}

async function filteredSeat(studentId) {
    const lookups = window.libraryLookups || {};
    var seats = lookups.seats || [];
    if (seats.length > 0) {
        return seats.filter(seat =>
            !seat.student_id ||
            String(seat.student_id) === String(studentId)
        );
    }
    try {
        await reloadSeats();
        return seats.filter(seat =>
            !seat.student_id ||
            String(seat.student_id) === String(studentId)
        );
    } catch (e) {
    }
}

async function getUpdatedBatch() {
    const lookups = window.libraryLookups || {};
    var batches = lookups.batches || [];
    if (batches.length > 0) {
        return batches
    }
    try {
        await reloadBatches();
        return getBatches();
    } catch (e) {
    }
}