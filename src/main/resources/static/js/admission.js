window.AdmissionForm = (function () {

    //
    // ALL YOUR EXISTING FUNCTIONS
    //
let editMode = false;
let currentRequestId = null;

  function escapeAdmissionHtml(value){
    const div=document.createElement("div");
    div.textContent=value==null?"":String(value);
    return div.innerHTML;
  }


    async function openForEdit(requestId, data) {
        await loadAdmissionForm();
        setEditMode(requestId);
        populateAdmissionLookups();
        populate(data);
    }

 async function loadAdmissionForm() {

    const modal = document.getElementById("admissionModal");
    const body = document.getElementById("admissionModalBody");

    modal.style.display = "flex";

    body.innerHTML = `
        <div style="padding:20px;text-align:center">
            Loading...
        </div>
    `;

    const html = await fetchHtml("/admission.html");

    body.innerHTML = html;

    // ✅ ADD THIS LINE (MOST IMPORTANT)
    bindFormEvents();
}

function bindFormEvents() {

    const form = document.getElementById("studentRegistrationForm");

    if (!form) {
        console.error("Form not found");
        return;
    }

    // ✅ REMOVE old binding (important)
    form.onsubmit = null;

    form.onsubmit = function (e) {
        e.preventDefault();
        submitStudentRegistration(e);
    };
}

function setEditMode(requestId) {

    editMode = true;
    currentRequestId = requestId;

    // delay ensures DOM is ready
    setTimeout(() => {

        const button = document.getElementById("registerStudentButton");

        if (button) {
            button.textContent = "Save Changes";
        }

        const clearButton = document.querySelector(".secondary-btn");

        if (clearButton) {
            clearButton.style.display = "none";
        }

    }, 0);
}

  function populateLookupSelect(selectId,values,placeholder){
    const select=document.getElementById(selectId);
    if(!select)return;

    select.innerHTML='<option value="">'+placeholder+'</option>';

    (values||[]).forEach(item=>{
      const value=typeof item==="string"
        ? item
        : (item.value ?? item.name ?? item.code);

      if(value==null)return;

      const option=document.createElement("option");
      option.value=value;
      option.textContent=String(value).replaceAll("_"," ");
      select.appendChild(option);
    });
  }

function togglePaymentMode() {

    const radio = document.querySelector(
        'input[name="paymentMode"]:checked'
    );

    if (!radio) {
        return;
    }

    const section = document.getElementById("onlinePaymentSection");

    if (!section) {
        return;
    }

    section.style.display =
        radio.value === "ONLINE"
            ? "block"
            : "none";
}

  function toggleSeatSelection() {

    const batch =
        document.getElementById("studentBatch");

    const seatGroup =
        document.getElementById("seatGroup");

    if (!batch || !seatGroup) return;

    const batchName =
        batch.options[batch.selectedIndex]?.text
            .toUpperCase();

    if (batchName.includes("FULL DAY")) {

        seatGroup.style.display = "flex";

    } else {

        seatGroup.style.display = "none";
        document.getElementById("seatNumber").value = "";
    }
}

    function populateBatchSelect(values){
    const select=document.getElementById("studentBatch");
    if(!select)return;

    select.innerHTML='<option value="">-- Select Batch --</option>';

    (values||[]).forEach(item=>{
      const id=typeof item==="object" ? item.id : null;
      const name=typeof item==="object"
        ? (item.name ?? item.batchName ?? item.value)
        : item;

      if(id==null || name==null)return;

      const option=document.createElement("option");
      option.value=String(id);
      option.textContent=String(name).replaceAll("_"," ");
      select.appendChild(option);
    });
  }

 function populateAdmissionLookups() {

    const lookups = window.libraryLookups || {};

    populateLookupSelect(
        "qualification",
        lookups.qualifications,
        "-- Select Qualification --"
    );

    populateBatchSelect(lookups.batches);

    populateLookupSelect(
        "preparationFor",
        lookups.preparations,
        "-- Select Preparation --"
    );

    populateLookupSelect(
        "seatNumber",
        lookups.seats,
        "-- Select Seat Number --"
    );
}
  function showValidationError(message) {
    const messageBox = document.getElementById("registrationMessage");
    messageBox.textContent = message;
    messageBox.className = "form-message error";
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

    const membershipFrom = new Date(from);
    const membershipTill = new Date(till);

    const minimum = new Date("1980-01-01");
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const maximumTill = new Date(today);
    maximumTill.setFullYear(maximumTill.getFullYear() + 1);

    if (membershipFrom < minimum) {
        throw new Error("Membership From date cannot be before 01/01/1980.");
    }

    if (membershipFrom > today) {
        throw new Error("Membership From date cannot be in the future.");
    }

    if (membershipTill < today) {
        throw new Error("Membership Till date cannot be before today.");
    }

    if (membershipTill > maximumTill) {
        throw new Error("Membership Till date cannot be more than one year from today.");
    }

    if (membershipTill < membershipFrom) {
        throw new Error("Membership Till date cannot be before Membership From date.");
    }
}

function closeAdmissionModal() {

    const modal = document.getElementById("admissionModal");
    const body = document.getElementById("admissionModalBody");

    if (modal) {
        modal.style.display = "none";
    }

    if (body) {
        body.innerHTML = "";
    }
}

async function submitStudentRegistration(event) {
    event.preventDefault();

    const form = document.getElementById("studentRegistrationForm");
    const message = document.getElementById("registrationMessage");
    const button = document.getElementById("registerStudentButton");

    if (document.getElementById("sameAsLocalAddress").checked) {
        document.getElementById("permanentAddress").value =
            document.getElementById("localAddress").value;
    }

    // ✅ GET VALUES
    const fullName = document.getElementById("studentName").value.trim();
    const mobile = document.getElementById("studentMobile").value.trim();
    const localAddress = document.getElementById("localAddress").value.trim();
    const permanentAddress = document.getElementById("permanentAddress").value.trim();
    const aadharNumber = document.getElementById("aadharNumber").value.trim();
    const guardianNumber = document.getElementById("guardianNumber").value.trim();
    const batchValue = document.getElementById("studentBatch").value;
    const membershipFrom = document.getElementById("membershipFrom").value;
    const membershipTill = document.getElementById("membershipTill").value;
    const fatherName = document.getElementById("fatherName").value.trim();
    const seatNumber = document.getElementById("seatNumber")?.value || null;

    const paymentMode =
        document.querySelector('input[name="paymentMode"]:checked')?.value || "CASH";

    const transactionId =
        document.getElementById("transactionId")?.value.trim() || null;

    const paymentRemarks =
        document.getElementById("paymentRemarks")?.value.trim() || null;

    message.textContent = "";
    message.className = "form-message";

    if (!batchValue) {
        showValidationError("Please select a Batch.");
        return;
    }

    // ✅ VALIDATION
    try {
        validateDob(document.getElementById("dateOfBirth").value);
        validateMobile(mobile);
        validateGuardian(mobile, guardianNumber);
        validateAadhaar(aadharNumber);
        validateAddress(localAddress, "Local Address");
        validateAddress(permanentAddress, "Permanent Address");
        validateMembershipDates(membershipFrom, membershipTill);
    } catch (validationError) {
        showValidationError(validationError.message);
        return;
    }

    // ✅ PAYLOAD
    const payload = {
        fullName,
        dateOfBirth: document.getElementById("dateOfBirth").value || null,
        mobile,
        guardianNumber: guardianNumber || null,
        fatherName: fatherName || null,
        localAddress,
        permanentAddress,
        aadharNumber,
        qualification: document.getElementById("qualification").value || null,
        batchId: Number(batchValue),
        preparationFor: document.getElementById("preparationFor").value || null,
        membershipFrom,
        membershipTill,
        discount: Number(document.getElementById("discount").value || 0),
        pendingAmount: Number(document.getElementById("pendingAmount").value || 0),
        submittedAmount: Number(document.getElementById("submittedAmount").value || 0),
        seatNumber,
        paymentMode,
        transactionId,
        paymentRemarks
    };

    button.disabled = true;
    button.textContent = editMode ? "Updating..." : "Sending to Admin...";

    try {

        let result;

        if (editMode) {
            result = await Api.put(Endpoints.pending.admission(currentRequestId), payload);
        } else {
            result = await Api.post(Endpoints.manager.admissionRequest, payload);
        }

        const membershipId = result?.membershipId ?? result?.id ?? "Generated";
        const status = result?.status ?? "PENDING";

        // ✅ SUCCESS UI
        showAdmissionSuccess({
            title: editMode
                ? "Admission updated successfully."
                : "Admission submitted successfully.",
            membershipId,
            fullName,
            mobile,
            seatNumber,
            status
        });

        if (editMode) {
            editMode = false;
            currentRequestId = null;

            if (window.closeAdmissionModal) {
                window.closeAdmissionModal();
            }

            if (window.PendingApprovals.refreshAll()) {
                await window.PendingApprovals.refreshAll();
            } else {
                console.error("❌ refreshAll STILL NOT FOUND");
            }
        } else {
            form.reset();
            document.getElementById("permanentAddress").readOnly = false;
        }

    } catch (error) {

        console.error("SUBMIT ERROR:", error);
        alert(error || "Unable to send application.")
        // ✅ SHOW ERROR MESSAGE FROM BACKEND
        message.textContent = 
            error.message || "Unable to send application.";

        message.className = "form-message error";

    } finally {

        button.disabled = false;
        button.textContent = "Add New Member";

    }
}


function showAdmissionSuccess({
    title,
    membershipId,
    fullName,
    mobile,
    seatNumber,
    status
}) {
    const message = [
        `✅ ${title}`,
        "",
        `Request ID      : ${membershipId}`,
        `Full Name       : ${fullName}`,
        `Mobile          : ${mobile}`,
        `Seat            : ${seatNumber || "-"}`,
        `Status          : ${status}`
    ].join("\n");

    alert(message);
}

    // alert(
    //     "✅ Admission Updated successfully.\n\n" +
    //     "Request ID      : " + membershipId + "\n" +
    //     "Full Name       : " + fullName + "\n" +
    //     "Date of Birth   : " + (document.getElementById("dateOfBirth").value || "") + "\n" +
    //     "Mobile          : " + mobile + "\n" +
    //     "Guardian Number : " + (guardianNumber || "-") + "\n" +
    //     "Father Name     : " + (fatherName || "-") + "\n" +
    //     "Qualification   : " + (document.getElementById("qualification").value || "-") + "\n" +
    //     "Batch           : " + document.getElementById("studentBatch").selectedOptions[0].text + "\n" +
    //     "Seat            : " + seatNumber + "\n" +
    //     "Preparation     : " + (document.getElementById("preparationFor").value || "-") + "\n" +
    //     "Membership From : " + membershipFrom + "\n" +
    //     "Membership Till : " + membershipTill + "\n" +
    //     "Discount        : " + document.getElementById("discount").value + "\n" +
    //     "Submitted Amt   : " + document.getElementById("submittedAmount").value + "\n" +
    //     "Pending Amt     : " + document.getElementById("pendingAmount").value + "\n" +
    //     "Payment Mode    : " + paymentMode + "\n" +
    //     "Transaction id  : " + transactionId + "\n" +
    //     "Payment Remarks : " + paymentRemarks + "\n" +
    //     "Status          : " + status
    // );


    function togglePermanentAddress(){
    const same=document.getElementById("sameAsLocalAddress").checked;
    const local=document.getElementById("localAddress");
    const permanent=document.getElementById("permanentAddress");
    if(same){
      permanent.value=local.value;
      permanent.readOnly=true;
    }else{
      permanent.readOnly=false;
    }
  };

    function init(){
        const batch = document.getElementById("studentBatch");

        if (batch) {
            batch.addEventListener("change", toggleSeatSelection);
        }
        togglePaymentMode();
        toggleSeatSelection();
        const local =
            document.getElementById("localAddress");

        if(local){

            local.addEventListener(
                "input",
                function(){

                    if(document.getElementById("sameAsLocalAddress")?.checked){

                        document.getElementById(
                            "permanentAddress"
                        ).value = local.value;

                    }

                }
            );

        }

        populateAdmissionLookups();

        window.addEventListener(
            "library-lookups-ready",
            populateAdmissionLookups,
            { once:true }
        );

        window.togglePermanentAddress =
            togglePermanentAddress;

        window.submitStudentRegistration =
            submitStudentRegistration;

        window.togglePaymentMode =  togglePaymentMode;
    }

    function populate(data){

        document.getElementById("studentName").value =
            data.fullName ?? "";

        document.getElementById("dateOfBirth").value =
            data.dateOfBirth ?? "";

        document.getElementById("studentMobile").value =
            data.mobile ?? "";

        document.getElementById("guardianNumber").value =
            data.guardianNumber ?? "";

        document.getElementById("fatherName").value =
            data.fatherName ?? "";

        document.getElementById("localAddress").value =
            data.localAddress ?? "";

        document.getElementById("permanentAddress").value =
            data.permanentAddress ?? "";

        document.getElementById("aadharNumber").value =
            data.aadharNumber ?? "";

        document.getElementById("qualification").value =
            data.qualification ?? "";

        document.getElementById("studentBatch").value =
            String(data.batchId ?? "");

        document.getElementById("seatNumber").value =
             data.seatNumber ?? "";

        toggleSeatSelection();

        document.getElementById("preparationFor").value =
            data.preparationFor ?? "";

        document.getElementById("membershipFrom").value =
            data.membershipFrom ?? "";

        document.getElementById("membershipTill").value =
            data.membershipTill ?? "";

        document.getElementById("discount").value =
            data.discount ?? 0;

        document.getElementById("submittedAmount").value =
            data.submittedAmount ?? 0;

        document.getElementById("pendingAmount").value =
            data.pendingAmount ?? 0;

        document.getElementById("seatNumber").value =
            data.seatNumber ?? "";

        const paymentMode = data.paymentMode ?? "CASH";

        const paymentRadio = document.querySelector(
            `input[name="paymentMode"][value="${paymentMode}"]`
        );

        if (paymentRadio) {
            paymentRadio.checked = true;
        }

        togglePaymentMode();

        document.getElementById("transactionId").value =
            data.transactionId ?? "";
                document.getElementById("paymentRemarks").value =
            data.paymentRemarks ?? "";

    }

window.closeAdmissionModal = closeAdmissionModal;

return {

    init,

    populate,

    populateAdmissionLookups,

    openForEdit,

    setEditMode,

    submitStudentRegistration

};

})();
