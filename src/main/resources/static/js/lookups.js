/**
 * lookups.js
 * Handles loading and caching lookup data.
 */

window.libraryLookups = {
    configurations: {},
    qualifications: [],
    batches: [],
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
    window.libraryLookups.batches = batches || [];
    window.libraryLookups.preparations = preparations || [];
    window.libraryLookups.seats = seats || [];

    window.libraryLookups.loaded = true;   // ✅ single source of truth
    sessionStorage.setItem(
        "configurations",
        JSON.stringify(configurations)
    );
    populateBatchFilter();

    window.dispatchEvent(
        new CustomEvent("library-lookups-ready")
    );
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
        console.log("Reloading seats...");

        const seats = await fetchLookup(Endpoints.lookups.seats);

        window.libraryLookups.seats = seats || [];

        console.log("Seats updated ✅");

        // optional event (if UI depends on seats)
        window.dispatchEvent(
            new CustomEvent("library-seats-updated")
        );

    } catch (e) {
        console.error("Failed to reload seats ❌", e);
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
    try {
        await reloadSeats();
        const lookups = window.libraryLookups || {};
        const seats = lookups.seats || [];

        return seats.filter(seat =>
            !seat.student_id ||
            String(seat.student_id) === String(studentId)
        );
    } catch (e) {
    }
}