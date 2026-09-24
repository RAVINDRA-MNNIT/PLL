window.PendingApprovals = {

    DEFAULT_TAB: "ADMISSION",

    current: null,

    // ✅ unified data source
    pendingRowsData: [],

    modal: null,
    modalBody: null,

    TABS: {
        ADMISSION: "ADMISSION",
        FEES: "FEES",
        SEAT: "SEAT",
        DETAILS: "DETAILS",
        ENROLLMENT: "ENROLLMENT",
        PENDING_FEES: "PENDING_FEES",
        BATCH: "BATCH",
        ALL: "ALL"
    },

    // ================= INIT =================

    async init() {
        this.current = this.DEFAULT_TAB;

        this.modal = this.get("admissionModal");
        this.modalBody = this.get("admissionModalBody");

        Object.values(this.TABS).forEach(tab => {
            const el = this.get(`${tab.toLowerCase()}Tab`);
            if (el) {
                el.onclick = () => this.switchTab(tab);
            }
        });

        const searchBox = this.get("searchBox");
        if (searchBox) {
            searchBox.addEventListener("keyup", () => this.filterTable());
        }

        const closeBtn = this.get("closePendingModal");
        if (closeBtn) closeBtn.onclick = () => this.closeModal();

        await this.refresh();
    },

    async switchTab(tab) {
        this.current = tab;

        Object.values(this.TABS).forEach(t => {
            const el = this.get(`${t.toLowerCase()}Tab`);
            if (el) el.classList.toggle("active", t === tab);
        });

        await this.refresh();
    },

    get(id) {
        return document.getElementById(id);
    },

    // ================= API =================

    async load(url) {
        const response = await fetch(url, {
            credentials: "same-origin"
        });

        if (!response.ok) {
            console.error("API failed:", url);
            return [];
        }

        return response.json();
    },

async loadData() {
    let res;

    if (this.current === this.TABS.ALL) {
        res = await this.load(Endpoints.pending.nonPending());
    } else {
        res = await this.load(Endpoints.pending.listByType(this.current));
    }

    // ✅ normalize to array
    const list = Array.isArray(res)
        ? res
        : res?.pendingRowsData
        || res?.data
        || res?.content
        || [];

    this.pendingRowsData = list//.map(x => this.mapResponse(x));
},

    async refresh() {
        await this.loadData();
        await this.loadCollectionSummary();
        this.render();
    },

    // ================= SUMMARY =================
    async loadCollectionSummary() {

        const cashCollection = this.get("cashCollection");
        const onlineCollection = this.get("onlineCollection");

        const cashExpense = this.get("cashExpense");
        const onlineExpense = this.get("onlineExpense");

        const cashProfit = this.get("cashProfit");
        const onlineProfit = this.get("onlineProfit");

        try {

            const res = await this.load(Endpoints.pending.collectionSummary);

            const cashCollectionAmount = Number(res.cashCollection || 0);
            const onlineCollectionAmount = Number(res.onlineCollection || 0);

            const cashExpenseAmount = Number(res.cashPendingExpenses || 0);
            const onlineExpenseAmount = Number(res.onlinePendingExpenses || 0);

            cashCollection.textContent = formatCurrency(cashCollectionAmount);
            onlineCollection.textContent = formatCurrency(onlineCollectionAmount);

            cashExpense.textContent = formatCurrency(cashExpenseAmount);
            onlineExpense.textContent = formatCurrency(onlineExpenseAmount);

            cashProfit.textContent = formatCurrency(
                cashCollectionAmount - cashExpenseAmount
            );

            onlineProfit.textContent = formatCurrency(
                onlineCollectionAmount - onlineExpenseAmount
            );

        } catch (e) {

            console.error(e);

            cashCollection.textContent = formatCurrency(0);
            onlineCollection.textContent = formatCurrency(0);

            cashExpense.textContent = formatCurrency(0);
            onlineExpense.textContent = formatCurrency(0);

            cashProfit.textContent = formatCurrency(0);
            onlineProfit.textContent = formatCurrency(0);
        }
    },

    // ================= RENDER =================

    render() {
        this.renderTableHeader();

        const rows = this.get("pendingRows");
        let data = this.pendingRowsData;

        if (!data.length) {
            rows.innerHTML = this.renderEmptyRow();
            return;
        }

        rows.innerHTML = data.map(item => this.renderRow(item)).join("");
    },

    renderTableHeader() {
        const tableHead = this.get("pendingTableHead");

        const map = {
            ADMISSION: PendingTemplates.admissionTableHeader(),
            FEES: PendingTemplates.feeTableHeader(),
            SEAT: PendingTemplates.seatTableHeader(),
            DETAILS: PendingTemplates.detailTableHeader(),
            ENROLLMENT: PendingTemplates.enrollmentTableHeader(),
            PENDING_FEES: PendingTemplates.pendingFeesTableHeader(),
            BATCH: PendingTemplates.batchTableHeader(),
            ALL: PendingTemplates.allTableHeader()
        };

        tableHead.innerHTML = map[this.current] || "";
    },

    renderEmptyRow() {
        return PendingTemplates.emptyRow(10);
    },

    renderRow(item) { 
        const requestedAt = this.renderRequestedAt(item.requestedAt);
        switch (this.current) {
            case this.TABS.ADMISSION:
                return PendingTemplates.admissionRow(item, this.renderActions(item));
            case this.TABS.FEES:
                return PendingTemplates.feeRow(item, this.renderActions(item), requestedAt);
            case this.TABS.SEAT:
                return PendingTemplates.seatRow(item, this.renderActions(item), requestedAt);
            case this.TABS.DETAILS:
                return PendingTemplates.detailRow(item, this.renderActions(item), requestedAt);
            case this.TABS.ENROLLMENT:
                return PendingTemplates.enrollmentRow(item, this.renderActions(item), requestedAt);
            case this.TABS.PENDING_FEES:
                return PendingTemplates.pendingFeesRow(item, this.renderActions(item), requestedAt);
            case this.TABS.BATCH:
                return PendingTemplates.batchRow(item, this.renderActions(item), requestedAt);
            case this.TABS.ALL:
                return PendingTemplates.allRow(item, this.renderActions(item), requestedAt);
            default:
                return "";
        }
    },

    renderActions(item) {
        const shouldShowEdit = ![
            this.TABS.DETAILS,
            this.TABS.SEAT,
            this.TABS.ENROLLMENT,
            this.TABS.BATCH,
            this.TABS.PENDING_FEES
        ].includes(this.current);


        const comment =
            item.status === "REJECTED" && item.remarks?.trim()
                ? item.remarks
                : "";

        return PendingTemplates.actions(
            item.requestId,
            Session.isAdmin(),
            Session.isManager(),
            comment,
            shouldShowEdit
        );
    },
    
    renderRequestedAt(value) {
        if (!value) return "-";

        const d = new Date(value);

        return `
            <div>${d.toLocaleDateString("en-IN")}</div>
            <div style="font-size:12px;color:#666;">
                ${d.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })}
            </div>
        `;
    },

    // ================= ACTIONS =================

    getRequest(id) {

        return this.pendingRowsData.find(x => x.requestId === id);
        return source.find(x => x.requestId === id);
    },

    // ✅ RESTORED OLD EDIT FLOW
async viewEdit(requestId) {

    const data = this.getRequest(requestId);

    if (!data) {
        alert("Record not found.");
        return;
    }
    if (this.current === this.TABS.ADMISSION) {

        if (window.AdmissionForm && typeof AdmissionForm.openForEdit === "function") {

            await AdmissionForm.openForEdit(requestId, data);
        }

    } else if (this.current === this.TABS.FEES) {

        if (window.FeeForm && typeof FeeForm.openForEdit === "function") {

            await FeeForm.openForEdit(requestId, data);
        }

    } else {

        this.modalBody.innerHTML =
            PendingTemplates.viewEditModal?.(data) || "<div>No template</div>";

        // ✅ FIXED
        this.modal.style.display = "flex";
    }
},

    async approveRequest(id) {
        const pendingRow = this.pendingRowsData.find(row => row.requestId === id);
        if (!pendingRow) {
            console.error("Pending row not found");
        }
        const from = new Date(pendingRow.fromDate);
        const till = new Date(pendingRow.tillDate);
        const diffInDays = Math.floor((till - from) / (1000 * 60 * 60 * 24));

        const warnings = [];

        if (pendingRow.lastFeeTillDate !== pendingRow.fromDate) {
            warnings.push(
                `• Membership gap detected.\n  Last membership till: ${pendingRow.lastFeeTillDate}\n  New membership from: ${pendingRow.fromDate}`
            );
        }

        if (diffInDays > 31) {
            warnings.push(
                `• You are updating fees for more than one month (${diffInDays} days).`
            );
        }

        if (pendingRow.pendingAmount > 0) {
            warnings.push(
                `• Current pending amount: ₹${pendingRow.pendingAmount}.`
            );
        }

        if (pendingRow.lastFeePendingAmount > 0) {
            warnings.push(
                `• Previous fee record has a pending amount of ₹${pendingRow.lastFeePendingAmount}.`
            );
        }

        if (warnings.length > 0) {
            const message =
                `Please review the following before continuing:\n ${warnings.join("\n\n")} Are you sure you want to continue?`;
            if (!confirm(message)) {
                return;
            }
        }

        if (!confirm("Approve this request?")) return;
        try {
            await Api.post(Endpoints.admin.approveRequest, id);
            await this.refresh();
        } catch (e) {
            alert(e);
        }
    },

    async rejectRequest(id) {
        const reason = prompt("Enter rejection reason:");
        if (!reason || !reason.trim()) {
            alert("Rejection reason is required");
            return;
        }
        try {
            await Api.patch(Endpoints.admin.rejectRequest, { id, reason });
            alert("Request rejected successfully");
            await this.refresh();
        } catch (e) {
            console.error(e);
            alert("Failed to reject request");
        }
    },

    async cancelRequest(id) {
        const reason = prompt("Enter cancellation reason:");
        if (!reason || !reason.trim()) {
            alert("Cancellation reason is required");
            return;
        }
        try {
            await Api.patch(Endpoints.manager.cancel(), { id, reason });
            alert("Request cancelled successfully");
            await this.refresh();
        } catch (e) {
            console.error(e);
            alert("Failed to cancel request");
        }
    },

    viewComment(comment){
        alert(comment);
    },

    closeModal() {
        if (this.modal) this.modal.style.display = "none";
        if (this.modalBody) this.modalBody.innerHTML = "";
    },

    filterTable() {
        const s = this.get("searchBox")?.value.toLowerCase() || "";
        document.querySelectorAll("#pendingRows tr").forEach(r => {
            r.style.display = r.innerText.toLowerCase().includes(s) ? "" : "none";
        });
    }
};