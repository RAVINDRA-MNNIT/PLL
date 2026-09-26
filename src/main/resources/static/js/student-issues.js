const StudentIssues = {

    complaints: [],
    warnings: [],
    activeTab: "complaints",
    currentPage: 1,
    totalPages: 1,
    totalElements: 0,
    searchDebounceTimer: null,

    /* =========================================================
       LOAD
       ========================================================= */
    async load() {
        const container = document.getElementById("complaintsView");
        if (!container) {
            console.error("complaintsView not found.");
            return;
        }
        container.innerHTML = `
            <section class="card">
                <p style="color:var(--muted)">
                    Loading Complaints and Warnings...
                </p>
            </section>
        `;
        try {
            const response = await fetch("/student-issues.html");
            if (!response.ok) {
                throw new Error(
                    "Unable to load student issues page."
                );
            }
            const html = await response.text();
            container.innerHTML = html;
            await this.initialize();
        } catch (error) {
            container.innerHTML = `
                <section class="card">
                    <p style="color:red">
                        Unable to load Complaints and Warnings.
                    </p>
                </section>
            `;
        }
    },

    /* =========================================================
       INITIALIZE
       ========================================================= */
    async initialize() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalElements = 0;
        this.bindEvents();
        await this.loadComplaints();
    },

    /* =========================================================
       EVENTS
       ========================================================= */
    bindEvents() {

        document.getElementById("complaintsTab")?.addEventListener("click", () => this.switchTab("complaints"));
        document.getElementById("warningsTab")?.addEventListener("click", () => this.switchTab("warnings"));
        document.getElementById("issuesSearchBox")?.addEventListener("input", () => this.debouncedSearch());
        document.getElementById("studentIssuesFirstPageBtn")?.addEventListener("click", () => this.firstPage());
        document.getElementById("studentIssuesPrevPageBtn")?.addEventListener("click", () => this.previousPage());
        document.getElementById("studentIssuesNextPageBtn")?.addEventListener("click", () => this.nextPage());
        document.getElementById("studentIssuesLastPageBtn")?.addEventListener("click", () => this.lastPage());
    },

    /* =========================================================
       TAB SWITCH
       ========================================================= */
    async switchTab(tab) {
        if (tab !== "complaints" && tab !== "warnings") {return;}
        this.activeTab = tab;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalElements = 0;
        clearTimeout(this.searchDebounceTimer);
        document.getElementById("complaintsTab")?.classList.toggle("active", tab === "complaints");
        document.getElementById("warningsTab")?.classList.toggle("active", tab === "warnings");
        const searchBox = document.getElementById("issuesSearchBox");
        if (searchBox) {
            searchBox.value = "";
        }
        await this.loadCurrentPage();
    },

    /* =========================================================
       LOAD CURRENT PAGE
       ========================================================= */
    async loadCurrentPage() {
        if (this.activeTab === "complaints") {
            await this.loadComplaints();
        } else {
            await this.loadWarnings();
        }
    },

    /* =========================================================
       GET SEARCH
       ========================================================= */
    getSearchValue() {
        return (document.getElementById("issuesSearchBox")?.value?.trim() || "");
    },

    /* =========================================================
       BUILD PAGINATION URL
       ========================================================= */
    buildPageUrl(endpoint) {
        const params = new URLSearchParams();
        params.set("page", String(this.currentPage - 1));
        params.set("size", String(getConfigurations().PAGE_LIMIT ?? 20));
        const search = this.getSearchValue();
        if (search) {
            params.set("search", search);
        }
        return `${endpoint}?${params.toString()}`;
    },

    /* =========================================================
       LOAD COMPLAINTS
       ========================================================= */
    async loadComplaints() {
        try {
            this.showLoading();
            const url = this.buildPageUrl(Endpoints.students.getAllComplaints);
            const response = await Api.get(url);
            this.complaints = Array.isArray(response?.content) ? response.content : [];
            this.totalPages = Math.max(1, Number(response?.totalPages || 1));
            this.totalElements = Number(response?.totalElements || 0);
            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
                await this.loadComplaints();
                return;
            }
            this.updateCounts();
            this.renderComplaints();
            this.updatePagination();
        } catch (error) {
            console.error("Failed to load complaints:", error);
            this.showError("Failed to load complaints.");
        }
    },

    /* =========================================================
       LOAD WARNINGS
       ========================================================= */
    async loadWarnings() {
        try {
            this.showLoading();
            const url = this.buildPageUrl(Endpoints.students.getAllWarnings);
            const response = await Api.get(url);
            this.warnings = Array.isArray(response?.content) ? response.content : [];
            this.totalPages = Math.max(1, Number(response?.totalPages || 1));
            this.totalElements = Number(response?.totalElements || 0);
            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
                await this.loadWarnings();
                return;
            }
            this.updateCounts();
            this.renderWarnings();
            this.updatePagination();
        } catch (error) {
            console.error("Failed to load warnings:", error);
            this.showError("Failed to load warnings.");
        }
    },

    /* =========================================================
       COUNTS
       ========================================================= */
    updateCounts() {
        const complaintsCount = document.getElementById("complaintsCount");
        const warningsCount = document.getElementById("warningsCount");
        if (this.activeTab === "complaints" && complaintsCount) {
            complaintsCount.textContent = this.totalElements;
        }
        if (this.activeTab === "warnings" && warningsCount) {
            warningsCount.textContent = this.totalElements;
        }
    },

    /* =========================================================
       RENDER COMPLAINTS
       ========================================================= */
    renderComplaints(data = this.complaints) {
        const head = document.getElementById("issuesTableHead");
        const rows = document.getElementById("issuesRows");
        if (!head || !rows) {
            console.error("Student Issues table elements not found.");
            return;
        }
        head.innerHTML = `
            <tr>
                <th>Student ID</th>
                <th>Student</th>
                <th>Category</th>
                <th>Complaint</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Action</th>
            </tr>
        `;
        if (!data.length) {
            rows.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="no-data">
                        <i class="fa-solid fa-comment-slash"></i>
                        No complaints found.
                    </td>
                </tr>
            `;
            return;
        }
        const isAdmin = Session.isAdmin();
        const isManager = Session.isManager();
        rows.innerHTML =
            data.map(complaint => {
                const category = this.formatText(complaint.category);
                const status = this.formatText(complaint.status || "OPEN");
                const submittedAt = complaint.submittedAt ? new Date(complaint.submittedAt).toLocaleString() : "-";
                const isResolved = String(complaint.status || "").toUpperCase() === "RESOLVED";
                let actionHtml = "-";
                if (isAdmin) {
                    actionHtml = `
                        <div class="action-buttons">
                            <button type="button" class="action-btn" title="${
                            isResolved ? "Complaint Resolved" : "Resolve Complaint"
                            }"
                                onclick="StudentIssues.resolveComplaint(${complaint.id})"
                                ${isResolved ? "disabled": ""
                            }>
                                <i class="fa-solid fa-check"></i>
                            </button>
                            <button type="button" class="delete-btn" title="Delete Complaint" onclick="StudentIssues.deleteComplaint(${complaint.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                } else if (isManager) {
                    actionHtml = `
                        <button type="button" class="action-btn" title="${
                        isResolved ? "Complaint Resolved" : "Resolve Complaint"
                        }"
                            onclick="StudentIssues.resolveComplaint(${complaint.id})"
                            ${
                                isResolved ? "disabled": ""
                            }>
                            <i class="fa-solid fa-check"></i>
                        </button>
                    `;
                }
                return `
                    <tr>
                        <td>
                             <a href="/student-details.html?id=${complaint.studentId}">
                                ${complaint.studentId ?? "-"}
                            </a>
                        </td>
                        <td>
                            ${this.escape(complaint.fullName ?? "-")}
                        </td>
                        <td>
                            <span class="category-badge">${this.escape(category)}</span>
                        </td>
                        <td class="description-cell">
                            ${this.escape(complaint.description ?? "-")}
                        </td>
                        <td>
                            <span class="status-badge status-${String(complaint.status || "OPEN").toLowerCase()}">
                                ${this.escape(status)}
                            </span>
                        </td>
                        <td>
                            ${this.escape(submittedAt)}
                        </td>
                        <td>
                            ${actionHtml}
                        </td>
                    </tr>
                `;
            }).join("");
    },

    /* =========================================================
       RENDER WARNINGS
       ========================================================= */
    renderWarnings(data = this.warnings) {
        const head = document.getElementById("issuesTableHead");
        const rows = document.getElementById("issuesRows");
        if (!head || !rows) {
            console.error("Student Issues table elements not found.");
            return;
        }
        const isAdmin = Session.isAdmin();
        head.innerHTML = `
            <tr>
                <th>Student ID</th>
                <th>Student</th>
                <th>Warning Level</th>
                <th>Category</th>
                <th>Description</th>
                <th>Action Taken</th>
                <th>Issued By</th>
                <th>Issued At</th>
                ${
            isAdmin ? "<th>Action</th>" : ""
        }
            </tr>
        `;
        if (!data.length) {
            const colspan = isAdmin ? 9 : 8;
            rows.innerHTML = `
                <tr>
                    <td colspan="${colspan}" class="no-data">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No warnings found.
                    </td>
                </tr>
            `;
            return;
        }

        rows.innerHTML =
            data.map(warning => {
                const warningLevel = this.formatText(warning.warningLevel);
                const category = this.formatText(warning.category);
                const issuedAt = warning.issuedAt ? new Date(warning.issuedAt).toLocaleString() : "-";
                const actionHtml =
                    isAdmin
                        ? `
                            <td>
                                <button type="button" class="delete-btn" title="Delete Warning" onclick="StudentIssues.deleteWarning(${warning.id})">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                          `
                        : "";
                return `
                    <tr>
                        <td>
                             <a href="/student-details.html?id=${warning.studentId}">
                                ${warning.studentId ?? "-"}
                            </a>
                        </td>
                        <td>
                            ${this.escape(warning.fullName ?? "-")}
                        </td>
                        <td>
                            <span class="warning-level-badge"> ${this.escape(warningLevel)}
                            </span>
                        </td>
                        <td>
                            ${this.escape(category)}
                        </td>
                        <td class="description-cell">
                            ${this.escape(warning.description ?? "-")}
                        </td>
                        <td class="description-cell">
                            ${this.escape(warning.actionTaken ?? "-")}
                        </td>
                        <td>
                            ${this.escape(warning.issuedByName ?? "-")}
                        </td>
                        <td>
                            ${this.escape(issuedAt)}
                        </td>
                        ${actionHtml}
                    </tr>
                `;
            }).join("");
    },

    /* =========================================================
       DEBOUNCED SEARCH
       ========================================================= */
    debouncedSearch() {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.search();
            }, 1000);
    },

    /* =========================================================
       SEARCH
       ========================================================= */
    async search() {
        this.currentPage = 1;
        await this.loadCurrentPage();
    },

    /* =========================================================
       FIRST PAGE
       ========================================================= */
    async firstPage() {
        if (this.currentPage <= 1) {return;}
        this.currentPage = 1;
        await this.loadCurrentPage();
    },

    /* =========================================================
       PREVIOUS PAGE
       ========================================================= */
    async previousPage() {
        if (this.currentPage <= 1) {return;}
        this.currentPage--;
        await this.loadCurrentPage();
    },

    /* =========================================================
       NEXT PAGE
       ========================================================= */
    async nextPage() {
        if (this.currentPage >= this.totalPages) {return;}
        this.currentPage++;
        await this.loadCurrentPage();
    },

    /* =========================================================
       LAST PAGE
       ========================================================= */
    async lastPage() {
        if (this.currentPage >= this.totalPages) {return;}
        this.currentPage = this.totalPages;
        await this.loadCurrentPage();
    },

    /* =========================================================
       UPDATE PAGINATION
       ========================================================= */
    updatePagination() {
        const studentIssuesCurrentPage = document.getElementById("studentIssuesCurrentPage");
        const studentIssuesTotalPagesElement = document.getElementById("studentIssuesTotalPages");
        const studentIssuesFirstPageBtn = document.getElementById("studentIssuesFirstPageBtn");
        const studentIssuesPrevPageBtn = document.getElementById("studentIssuesPrevPageBtn");
        const studentIssuesNextPageBtn = document.getElementById("studentIssuesNextPageBtn");
        const studentIssuesLastPageBtn = document.getElementById("studentIssuesLastPageBtn");
        if (studentIssuesCurrentPage) {
            studentIssuesCurrentPage.textContent = this.currentPage;
        }
        if (studentIssuesTotalPagesElement) {
            studentIssuesTotalPagesElement.textContent = this.totalPages;
        }
        const isFirstPage = this.currentPage <= 1;
        const isLastPage = this.currentPage >= this.totalPages;
        if (studentIssuesFirstPageBtn) {
            studentIssuesFirstPageBtn.disabled = isFirstPage;
        }
        if (studentIssuesPrevPageBtn) {
            studentIssuesPrevPageBtn.disabled = isFirstPage;
        }
        if (studentIssuesNextPageBtn) {
            studentIssuesNextPageBtn.disabled = isLastPage;
        }
        if (studentIssuesLastPageBtn) {
            studentIssuesLastPageBtn.disabled = isLastPage;
        }
    },

    /* =========================================================
       RESOLVE COMPLAINT
       ========================================================= */
    async resolveComplaint(id) {
        if (!id) {return;}
        try {
            await Api.put(Endpoints.students.resolvecomplaint(id));
            await this.loadCurrentPage();
        } catch (error) {
            console.error("Failed to resolve complaint:", error);
            alert(error?.message || "Failed to resolve complaint.");
        }
    },

    /* =========================================================
       DELETE COMPLAINT
       ========================================================= */
    async deleteComplaint(id) {
        if (!id) {return;}
        const complaint = this.complaints.find(item => Number(item.id) === Number(id));
        if (!complaint) {return;}
        if (!confirm("Are you sure you want to delete this complaint?\n\n" + "This action cannot be undone.")) {
            return;
        }
        try {
            await Api.delete(Endpoints.students.deleteStudentComplaint(id));
            await this.loadCurrentPage();
        } catch (error) {
            console.error("Failed to delete complaint:", error);
            alert(error?.message || "Failed to delete complaint.");
        }
    },

    /* =========================================================
       DELETE WARNING
       ========================================================= */
    async deleteWarning(id) {
        if (!id) {return;}
        const warning = this.warnings.find(item => Number(item.id) === Number(id));
        if (!warning) {return;}
        if (!confirm("Are you sure you want to delete this warning?\n\n" + "This action cannot be undone.")) {
            return;
        }
        try {
            await Api.delete(Endpoints.students.deleteStudentWarning(id));
            await this.loadCurrentPage();
        } catch (error) {
            console.error("Failed to delete warning:", error);
            alert(error?.message || "Failed to delete warning.");
        }
    },

    /* =========================================================
       FORMAT TEXT
       ========================================================= */
    formatText(value) {
        if (!value) {return "-";}
        return String(value).replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
    },

    /* =========================================================
       ESCAPE HTML
       ========================================================= */
    escape(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    },

    /* =========================================================
       LOADING
       ========================================================= */
    showLoading() {
        const rows = document.getElementById("issuesRows");
        if (!rows) {return;}
        const colspan = this.activeTab === "complaints" ? 7 : Session.isAdmin() ? 9 : 8;
        rows.innerHTML = `
            <tr>
                <td
                    colspan="${colspan}"
                    class="loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Loading...
                </td>
            </tr>
        `;
    },

    /* =========================================================
       ERROR
       ========================================================= */
    showError(message) {
        const rows = document.getElementById("issuesRows");
        if (!rows) {return;}
        const colspan = this.activeTab === "complaints" ? 7 : Session.isAdmin() ? 9 : 8;
        rows.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="no-data error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    ${this.escape(message)}
                </td>
            </tr>
        `;
    }
};