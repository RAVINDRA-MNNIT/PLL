window.FeeForm = {
    studentId: null,
    editRequestId: null,
    currentFrom: null,
    currentTill: null,
    currentPending: null,
    prevPending: null,
    allowedDiscount: null,
    currentBatchId: null,
    requestedBy: null,

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

    populateLookups(seats) {
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

        getBatches().forEach(batch => {
            batchSelect.innerHTML += `
            <option value="${batch.id}">
                ${batch.name ?? batch.batchName}
            </option>
            `;
        });

        document.getElementById("batchId").onchange = () => {
            toggleSeatField();
            this.calculateFeeSubmittedAmount();
        };

        seats.forEach(seat => {

            seatSelect.innerHTML += `
            <option value="${seat.id}">
                ${seat.seatNumber}
            </option>
            `;
        });
    },

    async openForEdit(requestId, data) {
        FeeForm.reset();
        await this.loadForm();
        const seats = await filteredSeat(data.studentId)
        this.setEditMode(requestId);
        this.populateLookups(seats);
        this.populate(data);
    },

    async loadForm() {
        closeFeeModal();
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
      this.requestedBy = data.requestedBy;
      this.currentPending = Number(data.pendingAmount ?? 0);
      this.prevPending = Number(data.lastFeePendingAmount ?? 0);
      document.getElementById("pendingAmount")?.addEventListener("input", this.calculateFeeSubmittedAmount);
      document.getElementById("discount")?.addEventListener("input", this.calculateFeeSubmittedAmount);
      document.getElementById("onlineAmount")?.addEventListener("input", FeeForm.calculateSplitPayment);
      const fromDate = document.getElementById("fromDate");
      const tillDate = document.getElementById("tillDate");
      if (fromDate) {
          fromDate.addEventListener("change", () => {
              const newFrom = parseLocalDate(fromDate.value);
              const newTill = addOneMonth(newFrom);
              document.getElementById("tillDate").value = formatInputDate(newTill);
              if (fromDate.value && tillDate?.value) {
                  this.calculateFeeSubmittedAmount();
              }
          });
      }

      if (tillDate) {
          tillDate.addEventListener("change", () => {
              if (fromDate?.value && tillDate.value) {
                  this.calculateFeeSubmittedAmount();
              }
          });
      }

      // -------------------------
    // Batch & Seat
    // -------------------------

    const batchId = document.getElementById("batchId");
    const seatId = document.getElementById("seatId");
      FeeForm.currentBatchId = data.batchId ?? 0;
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
      if (data.lastFeePendingAmount > 0) {
          document.getElementById("pendingAmountGroup").style.display = "none";
      }
    document.getElementById("pendingAmount").value = data.pendingAmount ?? "";
    FeeForm.allowedDiscount = data.allowedDiscount ?? 0;
    document.getElementById("paymentMode").value = this.isEdit() ? (data.paymentMode ?? "CASH") : "CASH";
      document.getElementById("onlineAmount").value = data.onlineAmount ?? "0";
      document.getElementById("transactionId").value = FeeForm.isEdit() ? (data.transactionId ?? "") : "";
    document.getElementById("paymentRemarks").value = FeeForm.isEdit() ? (data.remarks ?? "") : "";
    // -------------------------
    // Membership
    // -------------------------


    if (FeeForm.isEdit()) {
        this.currentFrom = data.lastFeeFromDate;
        this.currentTill = data.lastFeeTillDate;
    } else {
        this.currentFrom = data.fromDate;
        this.currentTill = data.tillDate;
    }

    document.getElementById("currentMembershipDuration").textContent =
        `${formatDate(this.currentFrom)} → ${formatDate(this.currentTill)}`;

    document.getElementById("fromDate").value =
        data.fromDate ?? "";

    document.getElementById("tillDate").value =
        data.tillDate ?? "";

    // -------------------------
    // Student Info
    // -------------------------

    document.getElementById("membershipId").textContent =
        data.studentId;

    document.getElementById("studentName").textContent =
        data.fullName ?? data.lastFullName;

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
      this.calculateFeeSubmittedAmount();

    // -------------------------
    // Status
    // -------------------------

    const statusElement =
        document.getElementById("enrollmentStatus");

    statusElement.textContent =
        data.enrollmentStatus ?? data.lastEnrollmentStatus ?? "";

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
        let studentIdTemp = document.getElementById("membershipId").textContent;
        if (!validateFeeForm()) {
            return;
        }
        const paymentMode = document.getElementById("paymentMode").value;
        const body = {
            id: this.editRequestId,
            studentId: this.studentId ?? studentIdTemp,
            batchId: Number(document.getElementById("batchId").value),
            seatId: document.getElementById("seatId").value.trim() || null,
            fromDate: document.getElementById("fromDate").value,
            tillDate: document.getElementById("tillDate").value,
            submittedAmount: Number(document.getElementById("submittedAmount").value),
            discount: Number(document.getElementById("discount").value),
            pendingAmount: Number(document.getElementById("pendingAmount").value),
            paymentMode: paymentMode,
            cashAmount: (paymentMode === "BOTH") ? Number(document.getElementById("cashAmount").value || 0) : 0,
            onlineAmount: (paymentMode === "BOTH") ? Number(document.getElementById("onlineAmount").value || 0) : 0,
            transactionId: document.getElementById("transactionId")?.value.trim() || null,
            remarks: document.getElementById("paymentRemarks")?.value.trim() || null,
            requestedBy: this.isEdit() ? this.requestedBy : Session.getUserId()
        };
        if (this.currentPending > 0) {
            if (!confirm(`Current pending amount of this student is ₹${this.currentPending}.\n\n Make sure you have received the amount!`)) {
                // User clicked Cancel
                return;
            }
        }
        if (!confirm(printPayload(body))) {
            return
        }

        try {
            if (FeeForm.isEdit()) {
                await Api.put(Endpoints.manager.updateRequest(), body);
                this.editRequestId = null;
            } else {
                if (Session.isAdmin()) {
                    await Api.post(Endpoints.admin.updateFeeRequest, body);
                } else {
                    await Api.post(Endpoints.manager.createRequest("FEES"), body);
                }
            }
            if (Session.isAdmin()) {
                alert("Fee submitted successfully.");
            } else {
                alert("Fee request submitted successfully.");
            }
            closeFeeModal();
            // ✅ SAFE REFRESH
            if (window.PendingApprovals?.current != null) {
                await window.PendingApprovals.refresh();
            }
            await loadStudents();
        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    },


    reset() {
        this.studentId = null;
        this.editRequestId = null;
        this.currentFrom = null;
        this.currentTill = null;
        this.currentPending = null;
    },

    //////////////////////////////////////////////////////
    // ✅ CALCULATE SUBMITTED AMOUNT
    //////////////////////////////////////////////////////

    calculateFeeSubmittedAmount() {
        debugger;
        const batchId = Number(document.getElementById("batchId").value);
        const batch = window.libraryLookups.batches.find(b => Number(b.id) === batchId);
        const fromDate = document.getElementById("fromDate")?.value;
        const tillDate = document.getElementById("tillDate")?.value;
        const pending = Number(document.getElementById("pendingAmount")?.value || 0);
        const submittedAmount = document.getElementById("submittedAmount");

        if (FeeForm.currentBatchId !== batchId) {
            document.getElementById("discount").value = 0;
        } else {
            document.getElementById("discount").value = FeeForm.allowedDiscount;
        }
        const discount = Number(document.getElementById("discount")?.value || 0);
        if (!batch || !submittedAmount) {
            document.getElementById("submittedAmount").value = "";
            return;
        }
        const baseAmount = Number(batch.baseAmount ?? batch.base_amount ?? 0);
        if (!baseAmount || !fromDate || !tillDate) {
            submittedAmount.value = 0;
            FeeForm.calculateSplitPayment();
            return;
        }
        const membershipDays = calculateMembershipDays(fromDate, tillDate);
        if (membershipDays <= 0) {
            submittedAmount.value = 0;
            FeeForm.calculateSplitPayment();
            return;
        }
        const prevPending = FeeForm.isEdit() ?  FeeForm.prevPending : 0;
        const currentPendingAmount = (FeeForm.isEdit() && Number(FeeForm.prevPending ?? 0) === 0) ? 0 : (FeeForm.currentPending ?? 0);
        const totalFee = (calculateTotalFee(baseAmount, membershipDays) + currentPendingAmount + prevPending);
        const finalAmount = Math.max(0, (totalFee - (discount + pending)));
        submittedAmount.value = Math.round(finalAmount);
        FeeForm.calculateSplitPayment();
    },

    calculateSplitPayment() {
        const paymentMode = document.getElementById("paymentMode").value;
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
};

function toggleTransactionId() {
    const paymentMode = document.getElementById("paymentMode").value;
    const cashContainer = document.getElementById("cashAmountContainer");
    const onlineContainer = document.getElementById("onlineAmountContainer");
    const transactionContainer = document.getElementById("transactionIdContainer");
    const cashAmount = document.getElementById("cashAmount");
    const onlineAmount = document.getElementById("onlineAmount");
    const transactionId = document.getElementById("transactionId");

    // Reset
    cashContainer.style.display = "none";
    onlineContainer.style.display = "none";
    transactionContainer.style.display = "none";

    cashAmount.required = false;
    onlineAmount.required = false;
    transactionId.required = false;

    if (paymentMode === "ONLINE") {
        transactionContainer.style.display = "flex";
        transactionId.required = true;
    } else if (paymentMode === "BOTH") {
        cashContainer.style.display = "flex";
        onlineContainer.style.display = "flex";
        transactionContainer.style.display = "flex";

        cashAmount.required = true;
        onlineAmount.required = true;
        transactionId.required = true;
        FeeForm.calculateSplitPayment();
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

    const newFrom = parseLocalDate(FeeForm.currentTill);
    const newTill = addOneMonth(newFrom);

    if (type === "CUSTOM") {
        customSection.style.display = "grid";
        previewRow.style.display = "none";
        if (FeeForm.editRequestId != null) { return; }
    }  else {
        customSection.style.display = "none";
        previewRow.style.display = "flex";
        preview.textContent = `${formatDate(newFrom)} to ${formatDate(newTill)}`;
    }
    document.getElementById("fromDate").value = formatInputDate(newFrom);
    document.getElementById("tillDate").value = formatInputDate(newTill);
}

function setMembershipFromToday() {
    const today = new Date();
    const tillDate = addOneMonth(today);
    document.getElementById("fromDate").value = formatInputDate(today);
    document.getElementById("tillDate").value = formatInputDate(tillDate);
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
    const fromDate = document.getElementById("fromDate").value;
    const tillDate = document.getElementById("tillDate").value;
    const submittedAmountInput = document.getElementById("submittedAmount");
    const discountInput = document.getElementById("discount");
    const pendingAmountInput = document.getElementById("pendingAmount");
    const cashAmount = Number(document.getElementById("cashAmount").value || 0);
    const onlineAmount = Number(document.getElementById("onlineAmount").value || 0);
    const paymentMode = document.getElementById("paymentMode").value;
    const transactionId = document.getElementById("transactionId").value.trim();
    const durationType = document.querySelector("input[name='durationType']:checked").value;

    const payAmount = Number(submittedAmountInput.value);
    const discount = Number(discountInput.value);
    const pendingAmount = Number(pendingAmountInput.value);
    const DAYS_BEFORE_NEXT_FEE_SUBMIT = getConfigurations().DAYS_BEFORE_NEXT_FEE_SUBMIT ?? 3

    // Batch
    if (!batchId) {
        errors.push("Please select Batch.");
    }
    // Seat (only if visible)
    const seatContainer = document.getElementById("seatContainer");
    if (seatContainer.style.display !== "none" && !seatId) {
        errors.push("Please select Seat Number.");
    }

    if (getDateDifferenceInDays(new Date(), FeeForm.currentTill) > DAYS_BEFORE_NEXT_FEE_SUBMIT) {
        alert(`You can only submit next fees if membership expires in ${DAYS_BEFORE_NEXT_FEE_SUBMIT} days`);
        return false;
    }

    // Membership validation (only for Custom Date)
    if (durationType === "CUSTOM") {
        if (!fromDate) {
            errors.push("Please select Membership From date.");
        }
        if (!tillDate) {
            errors.push("Please select Membership Till date.");
        }
        if (fromDate && tillDate) {
            const fromDateTemp = new Date(fromDate);
            const tillDateTemp = new Date(tillDate);
            const currentTill = new Date(FeeForm.currentTill);
            // Till >= From
            if (tillDateTemp < fromDateTemp) {
                errors.push(
                    "Membership Till date cannot be earlier than Membership From date."
                );
            }
            // Till > Current Till
            if (tillDateTemp <= currentTill) {
                errors.push(
                    "New Membership Till date must be greater than the current Membership Till date."
                );
            }
            // From >= Current Till
            if (fromDateTemp < currentTill) {
                errors.push(
                    "Membership From date cannot be earlier than the current Membership Till date."
                );
            }
        }
    }

    // Pay Amount
    if (payAmount <= 0) {
        errors.push("Please enter a valid Submitted Amount.");
    }

    if (discount < 0) {
        errors.push("Please enter a valid Discount Amount.");
    }

    if (pendingAmount < 0) {
        errors.push("Please enter a valid Pending Amount.");
    }

    if ((FeeForm.currentPending > 0) && (Number(pendingAmount ?? 0) > 0)) {
        errors.push("You cannot submit next fees until not clearing the previous pending fees.");
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
    if (paymentMode === "BOTH") {
        if (cashAmount <= 0) {
            errors.push("Cash Amount cannot be empty, negative or 0 in case of both payment option.");
        }

        if (onlineAmount <= 0) {
            errors.push("Online Amount cannot be empty, negative or 0 in case of both payment option.");
        }

        if (cashAmount + onlineAmount !== payAmount) {
            errors.push(`Cash Amount + Online Amount must equal ₹${payAmount}.`);
        }

        if (!transactionId) {
            errors.push("Please enter Transaction ID for Online payment.");
        }
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

function closeFeeModal() {
    FeeForm.reset();

    const modal = document.getElementById("feeModal");
    const body = document.getElementById("feeModalBody");

    if (modal) modal.style.display = "none";
    if (body) body.innerHTML = "";
}

async function updateFees(studentId) {
    FeeForm.reset();

    const modal = document.getElementById("feeModal");
    const container = document.getElementById("feeModalBody");

    modal.style.display = "flex";

    container.innerHTML = `
        <div style="padding:20px;text-align:center">
            Loading Fee Details...
        </div>
    `;

    try {
        const seats = await filteredSeat(studentId)
        const html = await fetchHtml("/fee.html");
        if (!html) {
            return;
        }

        container.innerHTML = html;

        FeeForm.populateLookups(seats);

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

