window.PendingApprovals = {

    DEFAULT_TAB: "ADMISSION",

    current: null,

    // ✅ unified data source
    pendingRowsData: [],

    // ✅ old arrays (NOT REMOVED)
    admission: [],
    fees: [],

    modal: null,
    modalBody: null,

    TABS: {
        ADMISSION: "ADMISSION",
        FEES: "FEES",
        SEAT: "SEAT",
        DETAILS: "DETAILS",
        ENROLLMENT: "ENROLLMENT",
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
        let data = [];

        if (this.current === this.TABS.ALL) {
            data = await this.load(Endpoints.pending.all());
        } else {
            data = await this.load(Endpoints.pending.listByType(this.current));
        }

        // ❌ OLD
        // this.pendingRowsData = data;

        // ✅ NEW (mapped safely)
        this.pendingRowsData = (data || []).map(x => this.mapResponse(x));

        // ✅ KEEP OLD STRUCTURE
        // this.admission = this.pendingRowsData.filter(x => x.requestType === "ADMISSION");
        // this.fees = this.pendingRowsData.filter(x => x.requestType === "FEES");
    },

    // ================= MAPPING =================

    mapResponse(item) {

        // ❌ OLD (breaks new API)
        // const data = item.requestData || {};

        // ✅ NEW (supports both)
        const data = item.requestData || item;

        return {
            requestId: item.id || item.requestId,
            requestType: item.requestType,

            studentId: data.studentId ?? item.studentId,
            fullName: data.fullName ?? item.fullName,
            mobile: data.mobile ?? item.mobile,
            batchName: data.batchName ?? item.batchName,
            membershipFrom: data.membershipFrom ?? item.membershipFrom,
            membershipTill: data.membershipTill ?? item.membershipTill,
            submittedAmount: data.submittedAmount ?? item.submittedAmount,
            discount: data.discount ?? item.discount,
            pendingAmount: data.pendingAmount ?? item.pendingAmount,
            paymentMode: data.paymentMode ?? item.paymentMode,

            requestedBy: item.requestedBy,
            requestedAt: item.requestedAt
        };
    },

    async refresh() {
        await this.loadData();
        await this.loadCollectionSummary();
        this.render();
    },

    // ================= SUMMARY =================

    async loadCollectionSummary() {
        const cash = this.get("cashCollection");
        const online = this.get("onlineCollection");

        try {
            const res = await this.load(Endpoints.pending.collectionSummary);

            cash.textContent = formatCurrency(res.totalCash || 0);
            online.textContent = formatCurrency(res.totalOnline || 0);

        } catch (e) {
            console.error(e);
            cash.textContent = formatCurrency(0);
            online.textContent = formatCurrency(0);
        }
    },

    // ================= RENDER =================

    render() {
        this.renderTableHeader();

        const rows = this.get("pendingRows");
        let data = [];

        switch (this.current) {
            case this.TABS.ADMISSION:
                data = this.admission;
                break;
            case this.TABS.FEES:
                data = this.fees;
                break;
            default:
                data = this.pendingRowsData;
        }

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
            case this.TABS.ALL:
                return PendingTemplates.allRow(item, this.renderActions(item), requestedAt);
            default:
                return "";
        }
    },

    renderActions(item) {
        return PendingTemplates.actions(
            item.requestId,
            Session.isAdmin(),
            Session.isManager()
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

        // ❌ NEW (not tab aware)
        // return this.pendingRowsData.find(x => x.requestId === id);

        // ✅ OLD LOGIC RESTORED
        const source =
            this.current === this.TABS.ADMISSION
                ? this.admission
                : this.current === this.TABS.FEES
                    ? this.fees
                    : this.pendingRowsData;

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
            if (window.AdmissionForm?.openForEdit) {
                await AdmissionForm.openForEdit(requestId, data);
            }
        } else if (this.current === this.TABS.FEES) {
            if (window.FeeForm?.openForEdit) {
                await FeeForm.openForEdit(requestId, data);
            }
        } else {
            // fallback modal
            this.modalBody.innerHTML =
                PendingTemplates.viewEditModal?.(data) || "<div>No template</div>";

            this.modal.style.display = "block";
        }
    },

    async approveRequest(id) {
        if (!confirm("Approve this request?")) return;

        await fetch(Endpoints.pending.approve(id), {
            method: "POST",
            credentials: "same-origin"
        });

        await this.refresh();
    },

    async rejectRequest(id) {
        const reason = prompt("Reason?");
        if (!reason?.trim()) return;

        await fetch(Endpoints.pending.reject(id), {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason })
        });

        await this.refresh();
    },

    async cancelRequest(id) {
        if (!confirm("Cancel request?")) return;

        await fetch(Endpoints.pending.cancel(id), {
            method: "PATCH",
            credentials: "same-origin"
        });

        await this.refresh();
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