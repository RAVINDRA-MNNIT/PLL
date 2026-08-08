/**
 * lookups.js
 * Handles loading and caching lookup data.
 */

window.libraryLookups = {
    qualifications: [],
    batches: [],
    preparations: [],
    seats: []
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

    if (lookupsLoaded && !forceReload) {
        return;
    }

    const [
        qualifications,
        batches,
        preparations,
        seats
    ] = await Promise.all([
        fetchLookup(Endpoints.lookup.qualifications),
        fetchLookup(Endpoints.lookup.batches),
        fetchLookup(Endpoints.lookup.preparations),
        fetchLookup(Endpoints.lookup.seats)
    ]);

    window.libraryLookups.qualifications = qualifications;
    window.libraryLookups.batches = batches;
    window.libraryLookups.preparations = preparations;
    window.libraryLookups.seats = seats;

    populateBatchFilter();

    lookupsLoaded = true;

    window.dispatchEvent(
        new CustomEvent("library-lookups-ready")
    );

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