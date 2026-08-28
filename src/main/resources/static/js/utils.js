/**
 * utils.js
 * Common utility functions.
 */

/**
 * Redirect to login page.
 */
function redirectToLogin() {

    window.location.replace("/login.html");

}

/**
 * Escape HTML.
 */
function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;

}

/**
 * Format date as dd/MM/yyyy.
 */
function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const year =
        date.getFullYear();

    return `${day}/${month}/${year}`;

}

function formatHiddenDob(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");

    return `${day}/**/****`;
}

function formatHiddenMobileNumber(mobileNumber) {

    if (!mobileNumber) {
        return "-";
    }

    const mobile = String(mobileNumber);

    if (mobile.length !== 10) {
        return mobile;
    }

    return `${mobile[0]}*${mobile[2]}*${mobile[4]}*${mobile[6]}*${mobile[8]}*`;
}

function formatHiddenAadhaarNumber(aadhaarNumber) {

    if (!aadhaarNumber) {
        return "-";
    }

    const aadhaar = String(aadhaarNumber).replace(/\s/g, "");

    return aadhaar
        .split("")
        .map((digit, index) => index % 2 === 0 ? digit : "*")
        .join("");
}

function formatHiddenAddress(address) {

    if (!address) {
        return "-";
    }

    return address
        .split("")
        .map((ch, index) => {

            if (ch === " ") {
                return " ";
            }

            return index % 2 === 0 ? ch : "*";
        })
        .join("");
}

/**
 * Format amount.
 */
function formatCurrency(amount) {

    return Number(amount ?? 0)
        .toLocaleString("en-IN");

}

/**
 * GET request returning JSON.
 */
async function fetchJson(url) {

    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.json();

}

/**
 * GET request returning HTML.
 */
async function fetchHtml(url) {

    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.text();

}

/**
 * Convert HTML string to template.
 */
function createTemplate(html) {

    const template =
        document.createElement("template");

    template.innerHTML = html;

    template.content
        .querySelectorAll("script")
        .forEach(script => script.remove());

    return template;

}

/**
 * Load HTML into a container.
 */
async function loadHtmlView(
    containerId,
    url
) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    const html =
        await fetchHtml(url);

    if (!html) {
        return;
    }

    const template =
        createTemplate(html);

    container.replaceChildren(
        template.content.cloneNode(true)
    );

}

function toCommaSeparated(requestData) {
    let data = {};

    try {
        data = typeof requestData === "string"
            ? JSON.parse(requestData)
            : requestData || {};
    } catch (e) {
        console.error("Invalid JSON:", requestData);
        return "";
    }

    return [
        data.fullName,
        data.mobileNumber,
        data.guardianNumber
    ]
    .filter(Boolean)   // remove null/undefined
    .join(", ");
}

function validateDob(dob) {

    if (!dob) {
        throw new Error("Date of Birth is required.");
    }

    const dobDate = new Date(dob);
    const minimum = new Date("1980-01-01");
    const today = new Date();

    if (dobDate < minimum) {
        throw new Error("Date of Birth cannot be before 01/01/1980.");
    }

    if (dobDate > today) {
        throw new Error("Date of Birth cannot be in the future.");
    }

    let age = today.getFullYear() - dobDate.getFullYear();

    const monthDiff = today.getMonth() - dobDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dobDate.getDate())
    ) {
        age--;
    }

    if (age < 10 || age > 80) {
        throw new Error("Student age must be between 10 and 80 years.");
    }
}

function validateMobile(mobile) {

    if (!mobile) {
        throw new Error("Mobile Number is required.");
    }

    if (!/^[6-9][0-9]{9}$/.test(mobile)) {
        throw new Error("Enter a valid 10 digit Mobile Number.");
    }
}

function validateGuardian(mobile, guardian) {

    if (!guardian) {
        return;
    }

    if (!/^[6-9][0-9]{9}$/.test(guardian)) {
        throw new Error("Enter a valid Guardian Number.");
    }

    if (guardian === mobile) {
        throw new Error("Guardian Number cannot be same as Mobile Number.");
    }
}

function validateAadhaar(aadhaar) {

    if (!aadhaar) {
        throw new Error("Aadhaar Number is required.");
    }

    if (!/^\d{12}$/.test(aadhaar)) {
        throw new Error("Enter a valid 12 digit Aadhaar Number.");
    }
}

function validateAddress(address, field) {

    if (!address || address.trim() === "") {
        throw new Error(field + " is required.");
    }

    if (address.trim().length < 10) {
        throw new Error(field + " should contain at least 10 characters.");
    }
}

function validateMembershipDates(from, till) {

    if (!from) {
        throw new Error("Membership From date is required.");
    }

    if (!till) {
        throw new Error("Membership Till date is required.");
    }

    const parseDate = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new Error(`Invalid date: ${value}`);
        }

        const [year, month, day] = value.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    };

    const fromDate = parseDate(from);
    const tillDate = parseDate(till);

    const today = new Date();
    const todayDate = new Date(Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    ));

    const minimumDate = new Date(Date.UTC(1980, 0, 1));

    const maximumTillDate = new Date(todayDate);
    maximumTillDate.setUTCFullYear(maximumTillDate.getUTCFullYear() + 1);

    // Same date
    if (fromDate.getTime() === tillDate.getTime()) {
        throw new Error("Membership From and Till date cannot be the same.");
    }

    // Minimum allowed From date
    if (fromDate < minimumDate) {
        throw new Error("Membership From date cannot be before 01/01/1980.");
    }

    // From date cannot be in the future
    if (fromDate > todayDate) {
        throw new Error("Membership From date cannot be in the future.");
    }

    // Till must be after From
    if (tillDate < fromDate) {
        throw new Error("Membership Till date cannot be before Membership From date.");
    }

    // Till cannot be before today
    if (tillDate < todayDate) {
        throw new Error("Membership Till date cannot be before today.");
    }

    // Till cannot exceed one year from today
    if (tillDate > maximumTillDate) {
        throw new Error("Membership Till date cannot be more than one year from today.");
    }

    return true;
}

function validatePositiveNumber(value, fieldName) {
    value = String(value ?? "").trim();

    if (value === "") {
        throw new Error(`${fieldName} is required.`);
    }

    const number = Number(value);

    if (isNaN(number)) {
        throw new Error(`${fieldName} must be a valid number.`);
    }

    if (number <= 0) {
        throw new Error(`${fieldName} must be greater than 0.`);
    }

    return number;
}

function validateNumber(value, fieldName) {
    value = String(value ?? "").trim();

    if (value === "") {
        throw new Error(`${fieldName} is required.`);
    }

    const number = Number(value);

    if (isNaN(number)) {
        throw new Error(`${fieldName} must be a valid number.`);
    }

    if (number < 0) {
        throw new Error(`${fieldName} cannot be less than 0.`);
    }

    return number;
}

function printPayload(payload) {
    const content = Object.entries(payload)
        .map(([key, value]) => {
            let displayValue = value;

            if (key === "batchId") {
                const batch = getBatches().find(b => b.id === value);
                displayValue = batch?.batchName ?? batch?.name ?? value;
            }

            if (key === "seatId") {
                const seat = getSeats().find(s => s.id === value);
                displayValue = seat?.seatNumber ?? value;
            }

            const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, c => c.toUpperCase());

            return `${label.padEnd(20)} : ${displayValue ?? "-"}`;
        })
        .join("\n");

    return `Please review the changes before updating.

${content}

Do you want to continue?`;
}

function getDateDifferenceInDays(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

function getUpdatedEnrollment(fromDate, toDate, enrollmentStatus) {
    const diffDays = getDateDifferenceInDays(fromDate, toDate)
    const isExpired = (diffDays < 0 && (enrollmentStatus === "ACTIVE"));
    const isDiscontinued = (diffDays < -10 && (enrollmentStatus === "ACTIVE"));
    if (enrollmentStatus == "TERMINATED" || enrollmentStatus == "DISCONTINUED" || enrollmentStatus == "EXPIRED") {
        return enrollmentStatus
    } else if (isDiscontinued) {
        return "DISCONTINUED"
    }else if (isExpired) {
        return "EXPIRED"
    } else {
        return "ACTIVE"
    }
}

