window.AdmissionForm = (function () {

let editMode = false;
let currentRequestId = null;

//////////////////////////////////////////////////////
// ✅ SAFE HELPER
//////////////////////////////////////////////////////

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
}

//////////////////////////////////////////////////////
// ✅ TOGGLE ADDRESS
//////////////////////////////////////////////////////

function togglePermanentAddress() {
    const same = document.getElementById("sameAsLocalAddress")?.checked;
    const local = document.getElementById("localAddress");
    const permanent = document.getElementById("permanentAddress");

    if (!local || !permanent) return;

    if (same) {
        permanent.value = local.value;
        permanent.readOnly = true;
    } else {
        permanent.readOnly = false;
    }
}

window.togglePermanentAddress = togglePermanentAddress;

//////////////////////////////////////////////////////
// ✅ LOOKUPS
//////////////////////////////////////////////////////

function populateLookupSelect(id, values, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;

    (values || []).forEach(item => {
        const value = item?.seatNumber ?? item?.name ?? item?.code ?? item;
        if (!value) return;

        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = String(value).replaceAll("_", " ");
        select.appendChild(opt);
    });
}

function populateBatchSelect(values) {
    const select = document.getElementById("studentBatch");
    if (!select) return;

    select.innerHTML = `<option value="">-- Select Batch --</option>`;

    (values || []).forEach(item => {
        if (!item?.id) return;

        const opt = document.createElement("option");
        opt.value = item.id;
        // Store base amount on option
        opt.dataset.baseAmount = item.baseAmount ?? 0;
        opt.textContent = item.name;
        select.appendChild(opt);
    });
}

function populateSeatSelect(values) {
    const select = document.getElementById("seatNumber");
    if (!select) return;

    select.innerHTML = `<option value="">-- Select Seat --</option>`;

    (values || []).forEach(item => {
        if (!item?.id) return;

        const opt = document.createElement("option");

        // ID is the actual value
        opt.value = item.id;

        // Seat number is what user sees
        opt.textContent = item.seatNumber;

        select.appendChild(opt);
    });
}

function populateAdmissionLookups() {
    const lookups = window.libraryLookups || {};

    populateLookupSelect("qualification", lookups.qualifications, "-- Select Qualification --");
    populateBatchSelect(lookups.batches);
    populateLookupSelect("preparationFor", lookups.preparations, "-- Select Preparation --");
}

//////////////////////////////////////////////////////
// ✅ INIT
//////////////////////////////////////////////////////

    function init() {
        configureSubmittedAmount();
        togglePaymentMode();
        toggleSeatSelection();

        if (window.libraryLookups) {
            populateAdmissionLookups();
        } else {
            window.addEventListener("library-lookups-ready", populateAdmissionLookups, { once: true });
        }
        window.togglePaymentMode = togglePaymentMode;
        window.submitStudentRegistration = submitStudentRegistration;
        window.calculateSubmittedAmount = calculateSubmittedAmount;
    }

    function addAllListeners() {
        const batch = document.getElementById("studentBatch");

        if (batch) {
            batch.addEventListener("change", () => {
                toggleSeatSelection();
                const fromDate = document.getElementById("fromDate")?.value;
                const tillDate = document.getElementById("tillDate")?.value;
                if (fromDate && tillDate) {
                    calculateSubmittedAmount();
                }
            });
        }


        const discount = document.getElementById("discount");

        if (discount) {
            discount.addEventListener("input", calculateSubmittedAmount);
        }


        const pending = document.getElementById("pendingAmount");

        if (pending) {
            pending.addEventListener("input", calculateSubmittedAmount);
        }


        const fromDate =
            document.getElementById("fromDate");

        const tillDate =
            document.getElementById("tillDate");


        if (fromDate) {
            fromDate.addEventListener("change", () => {

                if (fromDate.value && tillDate?.value) {
                    calculateSubmittedAmount();
                }

            });
        }


        if (tillDate) {
            tillDate.addEventListener("change", () => {

                if (fromDate?.value && tillDate.value) {
                    calculateSubmittedAmount();
                }

            });
        }


        const onlineAmount =
            document.getElementById("onlineAmount");

        if (onlineAmount) {
            onlineAmount.addEventListener(
                "input",
                calculateSplitPayment
            );
        }


        const checkbox =
            document.getElementById("sameAsLocalAddress");

        if (checkbox) {
            checkbox.addEventListener(
                "change",
                togglePermanentAddress
            );
        }
    }

    //////////////////////////////////////////////////////
    // ✅ SUBMITTED AMOUNT ACCESS
    //////////////////////////////////////////////////////

    function configureSubmittedAmount() {
        const submittedAmount =
            document.getElementById("submittedAmount");

        if (!submittedAmount) return;

        if (Session.isAdmin()) {
            // Admin can edit submitted amount
            submittedAmount.readOnly = false;
        } else {
            // Manager cannot edit submitted amount
            submittedAmount.readOnly = true;
        }
    }

//////////////////////////////////////////////////////
// ✅ LOAD FORM (COMMON)
//////////////////////////////////////////////////////

async function loadFormInto(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "Loading...";

    const html = await fetchHtml("/admission.html");
    container.innerHTML = html;

    init();
    bindFormEvents();
}

//////////////////////////////////////////////////////
// ✅ NEW (PAGE)
//////////////////////////////////////////////////////

async function openNew(data = {}) {
    closeAdmissionModal();
    await loadFormInto("newAdmissionContainer");
    const seats = await filteredSeat(data.studentId)
    populateSeatSelect(seats);

    populate(data);

    editMode = false;
    currentRequestId = null;

    setTimeout(() => {
        const btn = document.getElementById("registerStudentButton");
        if (btn) btn.textContent = "Add New Member";
    }, 0);
}

//////////////////////////////////////////////////////
// ✅ EDIT (MODAL)
//////////////////////////////////////////////////////

async function openForEdit(requestId, data) {

        // ==========================================
    // REMOVE NEW ADMISSION FORM
    // ==========================================
    const newContainer =
        document.getElementById("newAdmissionContainer");

    if (newContainer) {
        newContainer.innerHTML = "";
    }

    const modal = document.getElementById("admissionModal");
    if (modal) modal.style.display = "flex";

    await loadFormInto("admissionModalBody");

    editMode = true;
    currentRequestId = requestId;
    const seats = await filteredSeat(data.studentId)
    populateSeatSelect(seats);
    setTimeout(() => {
        populate(data);

        const btn = document.getElementById("registerStudentButton");
        if (btn) btn.textContent = "Save Changes";

        const secondary = document.querySelector(".secondary-btn");
        if (secondary) secondary.style.display = "none";

    }, 0);
}


//////////////////////////////////////////////////////
// CLOSE ADMISSION MODAL
//////////////////////////////////////////////////////

function closeAdmissionModal() {

    const modal =
        document.getElementById("admissionModal");

    const body =
        document.getElementById("admissionModalBody");

    if (modal) {
        modal.style.display = "none";
    }

    if (body) {
        body.innerHTML = "";
    }

    editMode = false;
    currentRequestId = null;
}

// Make available globally
window.closeAdmissionModal = closeAdmissionModal;

//////////////////////////////////////////////////////
// ✅ BIND FORM
//////////////////////////////////////////////////////

function bindFormEvents() {
    const form = document.getElementById("studentRegistrationForm");
    if (!form) return;

    form.onsubmit = null;

    form.onsubmit = function (e) {
        e.preventDefault();
        submitStudentRegistration(e);
    };
    addAllListeners()
}

//////////////////////////////////////////////////////
// ✅ POPULATE
//////////////////////////////////////////////////////

function populate(data = {}) {
    setValue("studentName", data.fullName);
    setValue("dateOfBirth", data.dateOfBirth);
    setValue("studentMobile", data.mobileNumber);
    setValue("guardianNumber", data.guardianNumber);
    setValue("fatherName", data.fatherName);
    setValue("localAddress", data.localAddress);
    setValue("permanentAddress", data.permanentAddress);
    setValue("aadhaarNumber", data.aadhaarNumber);
    setValue("qualification", data.qualification);
    setValue("studentBatch", data.batchId);
    setValue("seatNumber", data.seatId);
    setValue("preparationFor", data.preparationFor);
    if (editMode) {
        setValue("fromDate", data.fromDate);
        setValue("tillDate", data.tillDate);
    } else {
        // Auto populate dates
        const fromDate = new Date();
        const tillDate = addOneMonth(fromDate);
        setValue("fromDate", formatInputDate(fromDate));
        setValue("tillDate", formatInputDate(tillDate));
    }

    setValue("discount", data.discount || 0);
    setValue("pendingAmount", data.pendingAmount || 0);
    setValue("onlineAmount", data.onlineAmount);
    setValue("transactionId", data.transactionId || 0);
    setValue("paymentRemarks", data.remarks);
    const mode = data.paymentMode || "CASH";
    const radio = document.querySelector(`input[name="paymentMode"][value="${mode}"]`);
    if (radio) radio.checked = true;

    // Calculate from current batch + discount + pending
    calculateSubmittedAmount();
    togglePaymentMode();
    toggleSeatSelection();
}

function validateAll() {
    // ✅ VALIDATION
    try {
        validateDob(document.getElementById("dateOfBirth")?.value || null);
        validateMobile(document.getElementById("studentMobile")?.value?.trim());
        validateGuardian(document.getElementById("studentMobile")?.value?.trim(), document.getElementById("guardianNumber")?.value?.trim() || null);
        validateAadhaar(document.getElementById("aadhaarNumber")?.value?.trim());
        validateAddress(document.getElementById("localAddress")?.value?.trim(), "Local Address");
        validateAddress(document.getElementById("permanentAddress")?.value?.trim(), "Permanent Address");
        validateMembershipDates(document.getElementById("fromDate")?.value, document.getElementById("tillDate")?.value);
        validatePositiveNumber(document.getElementById("submittedAmount")?.value, "Submitted Amount");
        validateNumber(document.getElementById("discount")?.value, "Discount");
        validateNumber(document.getElementById("pendingAmount")?.value, "Pending Amount");
        // ✅ PAYMENT VALIDATION

        const paymentMode = document.querySelector('input[name="paymentMode"]:checked')?.value;
        // ONLINE / BOTH
        if (paymentMode === "ONLINE" || paymentMode === "BOTH") {
            const transactionId = document.getElementById("transactionId")?.value?.trim();
            if (!transactionId) {
                throw new Error("Transaction ID / UTR Number is required for online payment.");
            }
        }
        // BOTH PAYMENT
        if (paymentMode === "BOTH") {
            const submittedAmount = Number(document.getElementById("submittedAmount")?.value || 0);
            const onlineAmount = Number(document.getElementById("onlineAmount")?.value || 0);
            const cashAmount = Number(document.getElementById("cashAmount")?.value || 0);
            // Online amount cannot be negative
            if (onlineAmount <= 0) {
                throw new Error("Online Amount cannot be zero or negative.");
            }

            // Cash amount cannot be negative
            if (cashAmount <= 0) {
                throw new Error("Cash Amount cannot be zero or negative.");
            }
            // Cash + Online must equal Submitted Amount
            const totalPaid = cashAmount + onlineAmount;
            if (totalPaid !== submittedAmount) {
                throw new Error(
                    `Cash Amount + Online Amount must equal Submitted Amount.\n\n` +
                    `Submitted Amount: ₹${submittedAmount}\n` +
                    `Cash Amount: ₹${cashAmount}\n` +
                    `Online Amount: ₹${onlineAmount}`
                );
            }
        }

        return true
    } catch (validationError) {
        alert(validationError.message);
        return false;
    }
}

//////////////////////////////////////////////////////
// ✅ SUBMIT
//////////////////////////////////////////////////////

async function submitStudentRegistration(event) {
    if (!validateAll()) {
        return
    }
    event?.preventDefault();
    const form=document.getElementById("studentRegistrationForm");
    const button = document.getElementById("registerStudentButton");

    if (document.getElementById("sameAsLocalAddress")?.checked) {
        const local = document.getElementById("localAddress");
        const permanent = document.getElementById("permanentAddress");
        if (local && permanent) permanent.value = local.value;
    }

    const payload = {
        id: currentRequestId,
        fullName: document.getElementById("studentName")?.value?.trim(),
        dateOfBirth: document.getElementById("dateOfBirth")?.value || null,
        mobileNumber: document.getElementById("studentMobile")?.value?.trim(),
        guardianNumber: document.getElementById("guardianNumber")?.value?.trim() || null,
        fatherName: document.getElementById("fatherName")?.value?.trim() || null,
        localAddress: document.getElementById("localAddress")?.value?.trim(),
        permanentAddress: document.getElementById("permanentAddress")?.value?.trim(),
        aadhaarNumber: document.getElementById("aadhaarNumber")?.value?.trim(),
        qualification: document.getElementById("qualification")?.value || null,
        batchId: Number(document.getElementById("studentBatch")?.value),
        preparationFor: document.getElementById("preparationFor")?.value || null,
        fromDate: document.getElementById("fromDate")?.value,
        tillDate: document.getElementById("tillDate")?.value,
        discount: Number(document.getElementById("discount")?.value || 0),
        pendingAmount: Number(document.getElementById("pendingAmount")?.value || 0),
        submittedAmount: Number(document.getElementById("submittedAmount")?.value || 0),
        paymentMode: document.querySelector('input[name="paymentMode"]:checked')?.value || "CASH",
        cashAmount: Number(document.getElementById("cashAmount")?.value || 0),
        onlineAmount: Number(document.getElementById("onlineAmount")?.value || 0),
        remarks: document.getElementById("paymentRemarks")?.value || null,
        seatId: document.querySelector("#seatNumber")?.value || null,
        transactionId: document.querySelector("#transactionId")?.value || null
    };

    if (!confirm(printPayload(payload))) {
        return
    }

    button.disabled = true;
    try {
        let response;
        if (editMode) {
            response = await Api.put(Endpoints.manager.updateRequest(), payload);
        } else {
            if (Session.isAdmin()) {
                response = await Api.post(Endpoints.admin.admissionRequest, payload);
            } else {
                response = await Api.post(Endpoints.manager.createRequest("ADMISSION"), payload);
            }
        }

        const successLines = [
            editMode
                ? "✅ Admission updated successfully."
                : "✅ Admission submitted successfully.",
            ""
        ];

        if (!Session.isAdmin()) {
            successLines.push(
                `Request ID     : ${response?.id ?? response?.requestId ?? "-"}`,
                `Status         : ${response?.status ?? "PENDING"}`
            );
        }

        successLines.push(
            `Student ID     : ${response?.studentId ?? "-"}`,
            `Full Name      : ${response?.fullName ?? payload.fullName ?? "-"}`,
            `Mobile         : ${response?.mobileNumber ?? payload.mobileNumber ?? "-"}`
        );
        const successMessage = successLines.join("\n");
        alert(successMessage);
        // ✅ SAFE REFRESH
        if (window.PendingApprovals?.current != null) {
            await window.PendingApprovals.refresh();
        }
        // ==========================================
        // EDIT → CLOSE MODAL
        // ==========================================

        if (editMode) {
            editMode = false;
            currentRequestId = null;
            if (window.closeAdmissionModal) {
                window.closeAdmissionModal();
            }
        }
        // ==========================================
        // NEW → RESET FORM
        // ==========================================
        else {
            if (form) {
                form.reset();
            }
            const permanentAddress =
                document.getElementById("permanentAddress");
            if (permanentAddress) {
                permanentAddress.readOnly = false;
            }
            togglePaymentMode();
            toggleSeatSelection();
            editMode = false;
            currentRequestId = null;
        }

    } catch (err) {
        console.error(err);
        alert(err.message || "Error");
    } finally {
        
    }

    button.disabled = false;

}

//////////////////////////////////////////////////////
// ✅ EXTRA
//////////////////////////////////////////////////////

    function togglePaymentMode() {

        const mode = document.querySelector('input[name="paymentMode"]:checked')?.value;
        const section = document.getElementById("onlinePaymentSection");
        const txnField = document.getElementById("transactionId");
        const splitSection = document.getElementById("splitPaymentSection");
        const cashAmount = document.getElementById("cashAmount");
        const onlineAmount = document.getElementById("onlineAmount");
        if (!section || !txnField) return;

        if (mode === "ONLINE") {
            section.style.display = "block";
            txnField.required = true;
            if (splitSection) {
                splitSection.style.display = "none";
            }
        } else if (mode === "BOTH") {
            section.style.display = "block";
            txnField.required = true;
            if (splitSection) {
                splitSection.style.display = "block";
            }
            calculateSplitPayment();
        } else {
            // CASH
            section.style.display = "none";
            txnField.required = false;
            txnField.value = "";
            if (splitSection) {
                splitSection.style.display = "none";
            }
            if (cashAmount) {
                cashAmount.value = "0";
            }
            if (onlineAmount) {
                onlineAmount.value = "0";
            }
        }
    }

    function calculateSplitPayment() {
        const paymentMode = document.querySelector('input[name="paymentMode"]:checked')?.value;
        if (paymentMode !== "BOTH") return;
        const submittedAmount =
            Number(document.getElementById("submittedAmount")?.value || 0);
        const onlineAmount =
            Number(document.getElementById("onlineAmount")?.value || 0);
        const cashAmount =
            document.getElementById("cashAmount");
        if (!cashAmount) return;

        cashAmount.value = Math.max(0, submittedAmount - onlineAmount);
    }

    function toggleSeatSelection() {
        const batch = document.getElementById("studentBatch");
        const seatGroup = document.getElementById("seatGroup");

        if (!batch || !seatGroup) return;

        const name = batch.options[batch.selectedIndex]?.text?.toUpperCase() || "";

        if (name.includes("FULL DAY") || name.includes("24 HOURS")) {
            seatGroup.style.display = "flex";
        } else {
            seatGroup.style.display = "none";
            const seat = document.getElementById("seatNumber");
            if (seat) seat.value = "";
        }
    }

//////////////////////////////////////////////////////
// ✅ CALCULATE SUBMITTED AMOUNT
//////////////////////////////////////////////////////

    function calculateSubmittedAmount() {

        const batch = document.getElementById("studentBatch");
        const fromDate = document.getElementById("fromDate")?.value;
        const tillDate = document.getElementById("tillDate")?.value;
        const discount = Number(document.getElementById("discount")?.value || 0);
        const pending = Number(document.getElementById("pendingAmount")?.value || 0);
        const submittedAmount = document.getElementById("submittedAmount");

        if (!batch || !submittedAmount) {
            return;
        }
        const selectedOption = batch.options[batch.selectedIndex];
        const baseAmount = Number(selectedOption?.dataset?.baseAmount || 0);
        if (!baseAmount || !fromDate || !tillDate) {
            submittedAmount.value = 0;
            calculateSplitPayment();
            return;
        }
        const membershipDays = calculateMembershipDays(fromDate, tillDate);
        if (membershipDays <= 0) {
            submittedAmount.value = 0;
            calculateSplitPayment();
            return;
        }
        const totalFee = calculateTotalFee(baseAmount, membershipDays);
        const finalAmount = Math.max(0, totalFee - discount - pending);
        submittedAmount.value = Math.round(finalAmount);
        calculateSplitPayment();
    }
//////////////////////////////////////////////////////

    return {
        openNew,
        openForEdit,
        closeAdmissionModal
    };

})();