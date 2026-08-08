window.FeeForm = {
    studentId: null,
    editRequestId: null,
    currentFrom: null,
    currentTill: null,

    setStudent(id) {
        this.studentId = id;
    },

    isEdit() {
        return this.editRequestId != null;
    },

  setEditMode(requestId) {

    this.editRequestId = requestId;

    const extendRadio = document.querySelector(
        "input[name='durationType'][value='EXTEND']"
    );

    const customRadio = document.querySelector(
        "input[name='durationType'][value='CUSTOM']"
    );

    if (extendRadio && customRadio) {
    extendRadio.disabled = true;
    customRadio.checked = true;
    }
},

    populateLookups(lookups) {
        const batchSelect = document.getElementById("batchId");
        const seatSelect = document.getElementById("seatId");

        if (!batchSelect) {
            throw new Error("batchId select not found in fee.html");
        }

        if (!seatSelect) {
            throw new Error("seatId select not found in fee.html");
        }

        batchSelect.replaceChildren();
        seatSelect.replaceChildren();

        lookups.batches.forEach(batch => {
            batchSelect.innerHTML += `
            <option value="${batch.id}">
                ${batch.name ?? batch.batchName}
            </option>
            `;
        });

        lookups.seats.forEach(seat => {

            seatSelect.innerHTML += `
            <option value="${seat.id}">
                ${seat.seatNumber}
            </option>
            `;

        });
        document.getElementById("batchId").onchange = toggleSeatField;
    },

    async openForEdit(requestId, data) {
        await this.loadForm();
        this.setEditMode(requestId);
        this.populateLookups(window.libraryLookups);
        this.populate(data);
    },

    async loadForm() {

        const modal = document.getElementById("feeModal");
        const container = document.getElementById("feeModalBody");

        modal.style.display = "flex";

        container.innerHTML = `
            <div style="padding:20px;text-align:center">
                Loading Fee Details...
            </div>
        `;

        const html = await fetchHtml("/fee.html");

        if (!html) {
            return;
        }

        container.innerHTML = html;

    },

  populate(data) {

    // -------------------------
    // Batch & Seat
    // -------------------------

    const batchId = document.getElementById("batchId");
    const seatId = document.getElementById("seatId");

    batchId.value = String(data.batchId);

    // Show/Hide seat section depending on batch
    toggleSeatField();

    // Select seat after toggle
    if (data.seatId != null) {
        seatId.value = String(data.seatId);
    }

    // -------------------------
    // Fee Details
    // -------------------------

    document.getElementById("submittedAmount").value =
        data.submittedAmount ?? "";

    document.getElementById("pendingAmount").value =
        data.pendingAmount ?? "";

    document.getElementById("discount").value =
        data.discountAmount ?? "";

    document.getElementById("paymentMode").value =
        data.paymentMode ?? "";

    document.getElementById("transactionId").value = FeeForm.isEdit() ? (data.transactionId ?? "") : "";

    document.getElementById("paymentRemarks").value = FeeForm.isEdit() ? (data.paymentRemark ?? "") : "";

    // -------------------------
    // Membership
    // -------------------------


    if (FeeForm.isEdit()) {
        this.currentFrom = data.fromDate;
        this.currentTill = data.tillDate;
    } else {
        this.currentFrom = data.membershipFrom;
        this.currentTill = data.membershipTill;
    }

    document.getElementById("currentMembershipDuration").textContent =
        `${formatDate(this.currentFrom)} → ${formatDate(this.currentTill)}`;

    document.getElementById("membershipFrom").value =
        data.membershipFrom ?? "";

    document.getElementById("membershipTill").value =
        data.membershipTill ?? "";

    // -------------------------
    // Student Info
    // -------------------------

    document.getElementById("membershipId").textContent =
        data.studentId;

    document.getElementById("studentName").textContent =
        data.fullName;

    // -------------------------
    // Payment Mode
    // -------------------------

    document.getElementById("paymentMode").onchange =
        toggleTransactionId;

    toggleTransactionId();

    // -------------------------
    // Membership Option
    // -------------------------

    document
        .querySelectorAll("input[name='durationType']")
        .forEach(radio => {
            radio.onchange = updateMembershipOption;
        });

    updateMembershipOption();

    // -------------------------
    // Status
    // -------------------------

    const statusElement =
        document.getElementById("enrollmentStatus");

    statusElement.textContent =
        data.enrollmentStatus ?? "";

    statusElement.className = "status-badge";

    switch ((data.enrollmentStatus ?? "").toUpperCase()) {

        case "ACTIVE":
            statusElement.style.background = "#DCFCE7";
            statusElement.style.color = "#15803D";
            break;

        case "EXPIRED":
            statusElement.style.background = "#FEE2E2";
            statusElement.style.color = "#B91C1C";
            break;

        case "DISCONTINUED":
            statusElement.style.background = "#FEF3C7";
            statusElement.style.color = "#B45309";
            break;

        case "TERMINATED":
            statusElement.style.background = "#E5E7EB";
            statusElement.style.color = "#374151";
            break;

        default:
            statusElement.style.background = "#F1F5F9";
            statusElement.style.color = "#475569";
    }
},

    async save() {
        if (!validateFeeForm()) {
            return;
        }
        const body = {
            batchId: Number(document.getElementById("batchId").value),
            seatId: Number(document.getElementById("seatId").value),
            membershipFrom: document.getElementById("membershipFrom").value,
            membershipTill: document.getElementById("membershipTill").value,
            submittedAmount: Number(document.getElementById("submittedAmount").value),
            discount: Number(document.getElementById("discount").value),
            pendingAmount: Number(document.getElementById("pendingAmount").value),
            paymentMode: document.getElementById("paymentMode").value,
            transactionId: document.getElementById("transactionId")?.value.trim() || null,
            paymentRemark: document.getElementById("paymentRemarks")?.value.trim() || null
        };

        if (!confirmFeeUpdate(body)) {
            return;
        }

        try {
            if (FeeForm.isEdit()) {
                await Api.put(Endpoints.pending.fee(this.editRequestId), body);
                this.editRequestId = null;
            } else {
                await Api.post(Endpoints.students.fees(this.studentId), body);
            }
            alert("Fee request submitted successfully.");
            closeFeeModal();
            if (FeeForm.isEdit()) {
                await PendingApprovals.loadPendingFees();
            }
            await loadStudents();
        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    }
};

function toggleTransactionId() {
    const paymentMode =
        document.getElementById("paymentMode").value;
    const container =
        document.getElementById("transactionIdContainer");
    const transactionId =
        document.getElementById("transactionId");
    if (paymentMode === "ONLINE") {
        container.style.display = "flex";
        container.style.flexDirection = "column";
        transactionId.required = true;
    } else {
        container.style.display = "none";
        transactionId.required = false;
        transactionId.value = "";
    }
}

function updateMembershipOption() {
    const previewRow = document.getElementById("nextMembershipRow");
    const preview = document.getElementById("nextMembershipDuration");
    const type = document.querySelector("input[name='durationType']:checked").value;

    const customSection = document.getElementById("customDateSection");
    if (!FeeForm.currentTill) {
        return;
    }

    const currentTill = new Date(FeeForm.currentTill);

    if (isNaN(currentTill.getTime())) {
        console.error("Invalid currentTill:", FeeForm.currentTill);
        return;
    }

    const newFrom = new Date(currentTill);
    const newTill = new Date(currentTill);

    if (type === "CUSTOM") {
        customSection.style.display = "grid";
        previewRow.style.display = "none";
        if (FeeForm.editRequestId != null) {
            return;
        }
        document.getElementById("membershipFrom").value = newFrom.toISOString().split("T")[0];
        document.getElementById("membershipTill").value = "";

    } else {
        customSection.style.display = "none";
        previewRow.style.display = "flex";
        const day = newTill.getDate();
        newTill.setDate(1);
        newTill.setMonth(newTill.getMonth() + 1);
        const lastDay = new Date(
            newTill.getFullYear(),
            newTill.getMonth() + 1,
            0
        ).getDate();
        newTill.setDate(Math.min(day, lastDay));
        document.getElementById("membershipFrom").value = newFrom.toISOString().split("T")[0];
        document.getElementById("membershipTill").value = newTill.toISOString().split("T")[0];
        preview.textContent = `${formatDate(newFrom)} to ${formatDate(newTill)}`;
    }
}

function toggleSeatField() {
    const batchId = Number(document.getElementById("batchId").value);
    const batch =  window.libraryLookups.batches.find(b => b.id === batchId);

    const seatContainer = document.getElementById("seatContainer");

    if (!batch || !seatContainer) {
        return;
    }

    const batchName =(batch.batchName ?? batch.name ?? "").toUpperCase();

    if (batchName.includes("FULL DAY") || batchName.includes("24 HOURS")) {
        seatContainer.style.display = "flex";
    } else {
        seatContainer.style.display = "none";
        document.getElementById("seatId").value = "";
    }
}

function formatDate(dateString) {
    if (!dateString) {
        return "";
    }
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function validateFeeForm() {
    clearFormMessage();
    const errors = [];
    const batchId = Number(document.getElementById("batchId").value);
    const seatId = Number(document.getElementById("seatId").value);
    const membershipFrom = document.getElementById("membershipFrom").value;
    const membershipTill = document.getElementById("membershipTill").value;
    const payAmount = Number(document.getElementById("submittedAmount").value);
    const paymentMode = document.getElementById("paymentMode").value;
    const transactionId = document.getElementById("transactionId").value.trim();
    const durationType =
        document.querySelector(
            "input[name='durationType']:checked"
        ).value;

    // Batch
    if (!batchId) {
        errors.push("Please select Batch.");
    }
    // Seat (only if visible)
    const seatContainer = document.getElementById("seatContainer");
    if (seatContainer.style.display !== "none" && !seatId) {
        errors.push("Please select Seat Number.");
    }

    // Membership validation (only for Custom Date)
    if (durationType === "CUSTOM") {
        if (!membershipFrom) {
            errors.push("Please select Membership From date.");
        }
        if (!membershipTill) {
            errors.push("Please select Membership Till date.");
        }
        if (membershipFrom && membershipTill) {
            const fromDate = new Date(membershipFrom);
            const tillDate = new Date(membershipTill);
            const currentTill = new Date(FeeForm.currentTill);
            // Till >= From
            if (tillDate < fromDate) {
                errors.push(
                    "Membership Till date cannot be earlier than Membership From date."
                );
            }
            // Till > Current Till
            if (tillDate <= currentTill) {
                errors.push(
                    "New Membership Till date must be greater than the current Membership Till date."
                );
            }
            // From >= Current Till
            if (fromDate < currentTill) {
                errors.push(
                    "Membership From date cannot be earlier than the current Membership Till date."
                );
            }
        }
    }

    // Pay Amount
    if (isNaN(payAmount) || payAmount <= 0) {
        errors.push("Please enter a valid Pay Amount.");
    }


    // Payment Mode
    if (!paymentMode) {
        errors.push("Please select Payment Mode.");
    }

    // Transaction ID
    if (
        paymentMode === "ONLINE" &&
        transactionId === ""
    ) {
        errors.push(
            "Please enter Transaction ID for Online payment."
        );
    }

    if (errors.length > 0) {
        showFormMessage(errors);

        return false;
    }

    return true;
}

function showFormMessage(messages) {

    const box = document.getElementById("feeMessage");

    box.innerHTML = `
        <strong>Please correct the following:</strong>
        <ul>
            ${messages.map(m => `<li>${m}</li>`).join("")}
        </ul>
    `;

    box.style.display = "block";
}

function clearFormMessage() {

    const box = document.getElementById("feeMessage");

    if (!box) {
        return;
    }

    box.style.display = "none";
    box.innerHTML = "";
}

function confirmFeeUpdate(body) {

    const batchName =
        document.getElementById("batchId").selectedOptions[0]?.text ?? "-";

    const seatName =
        document.getElementById("seatContainer").style.display !== "none"
            ? document.getElementById("seatId").selectedOptions[0]?.text ?? "-"
            : "Not Applicable";

    const message = `
Please review the changes before updating.

Membership ID : ${document.getElementById("membershipId").textContent}
Student Name  : ${document.getElementById("studentName").textContent}

Batch          : ${batchName}
Seat           : ${seatName}

Membership From: ${formatDate(body.membershipFrom)}
Membership Till: ${formatDate(body.membershipTill)}

Pay Amount     : ₹${body.submittedAmount}
Discount       : ₹${body.discount}
Pending Amount : ₹${body.pendingAmount}

Payment Mode   : ${body.paymentMode}
${body.paymentMode === "ONLINE"
    ? `Transaction ID: ${body.transactionId}`
    : ""}
Remark         : ${body.paymentRemark || "-"}

Do you want to continue?
`;

    return confirm(message);
}

function closeFeeModal() {

    FeeForm.studentId = null;
    FeeForm.editRequestId = null;
    FeeForm.currentFrom = null;
    FeeForm.currentTill = null;

    const extendRadio = document.querySelector(
        "input[name='durationType'][value='EXTEND']"
    );

    const customRadio = document.querySelector(
        "input[name='durationType'][value='CUSTOM']"
    );

    if (extendRadio && customRadio) {

        extendRadio.disabled = false;
        extendRadio.checked = true;
        customRadio.checked = false;

    }

    document.getElementById("feeModal").style.display = "none";

    document.getElementById("feeModalBody").innerHTML = "";

}

async function updateFees(studentId) {

    const modal = document.getElementById("feeModal");
    const container = document.getElementById("feeModalBody");

    modal.style.display = "flex";

    container.innerHTML = `
        <div style="padding:20px;text-align:center">
            Loading Fee Details...
        </div>
    `;

    try {

        const html = await fetchHtml("/fee.html");

        if (!html) {
            return;
        }

        container.innerHTML = html;

        await loadLookups();

        FeeForm.populateLookups(window.libraryLookups);

        const student = students.find(
            s => s.studentId === studentId
        );

        if (!student) {
            throw new Error("Student not found.");
        }

        FeeForm.setStudent(studentId);

        FeeForm.populate(student);

    } catch (error) {

        console.error(error);

        closeFeeModal();

        alert(error.message);

    }

}