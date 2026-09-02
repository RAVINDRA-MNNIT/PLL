const Configurations = {
    currentTab: "general",
    admins: [],
    managers: [],

    async load() {
debugger;
        const container =
            document.getElementById("configurationsContainer");

        if (!container) {
            console.error("configurationsContainer not found.");
            return;
        }

        container.innerHTML = `
            <section class="card loading-card">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading Configuration...</span>
            </section>
        `;

        try {

            const html = await fetchHtml("/configuration.html");

            if (!html) {
                throw new Error("Unable to load configuration.html");
            }

            container.innerHTML = html;
            this.initialize();

        } catch (error) {

            console.error(error);

            container.innerHTML = `
                <section class="card">
                    <div class="error-state">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <h3>Unable to load Configuration</h3>
                        <p>Please try again.</p>
                    </div>
                </section>
            `;

        }

    },

    initialize() {

        this.initializeTabs();

        this.initializeButtons();
        this.loadConfigurations();
    },

    initializeTabs() {

        const tabs = document.querySelectorAll(".tab-button");
        const contents = document.querySelectorAll(".tab-content");

        tabs.forEach(tab => {

            tab.addEventListener("click", async () => {

                tabs.forEach(t => t.classList.remove("active"));
                contents.forEach(c => c.classList.remove("active"));

                tab.classList.add("active");

                const target = document.getElementById(tab.dataset.tab);

                if (target) {
                    target.classList.add("active");
                }
                this.currentTab = tab.dataset.tab;
                switch (this.currentTab) {

                    case "admin":
                        await this.loadAdmins();
                        break;

                    case "manager":
                        await this.loadManagers();
                        break;

                    default:
                        break;
                }

            });

        });

    },

    initializeButtons() {

        document
            .getElementById("saveGeneralBtn")
            ?.addEventListener(
                "click",
                () => this.saveGeneral()
            );

        document
            .getElementById("saveManagerBtn")
            ?.addEventListener(
                "click",
                () => this.saveManager()
            );

        document
            .getElementById("saveStudentBtn")
            ?.addEventListener(
                "click",
                () => this.saveStudent()
            );

        document
            .getElementById("createAdminBtn")
            ?.addEventListener(
                "click",
                () => this.createUser("ADMIN")
            );

        document
            .getElementById("createManagerBtn")
            ?.addEventListener(
                "click",
                () => this.createUser("MANAGER")
            );

        document
            .getElementById("clearPendingApprovalBtn")
            ?.addEventListener(
                "click",
                () => this.clearPendingApprovals()
            );

        document
            .getElementById("clearFeeRecordsBtn")
            ?.addEventListener(
                "click",
                () => this.clearFeeRecords()
            );

        document
            .getElementById("resetConfigurationBtn")
            ?.addEventListener(
                "click",
                () => this.resetConfiguration()
            );

        document
            .getElementById("resetSeatsBtn")
            ?.addEventListener(
                "click",
                () => this.resetSeats()
            );

        document
            .getElementById("clearTransactionsBtn")
            ?.addEventListener(
                "click",
                () => this.clearTransactions()
            );
    },

    loadConfigurations() {
        const config = getConfigurations();

        document.getElementById("finePerDay").value =
            config.FINE_PER_DAY ?? "";

        document.getElementById("libraryName").value =
            config.LIBRARY_NAME ?? "";

        document.getElementById("daysForExpire").value =
            config.DAYS_FOR_EXPIRE ?? "";

        document.getElementById("daysForDiscontinue").value =
            config.DAYS_FOR_DISCONTINUE ?? "";

        document.getElementById("daysBeforeNextFeeSubmit").value =
            config.DAYS_BEFORE_NEXT_FEE_SUBMIT ?? "";

        document.getElementById("pageLimit").value =
            config.PAGE_LIMIT ?? "";

        document.querySelector(
            `input[name="pageSorting"][value="${config.PAGE_SORTING}"]`
        ).checked = true;

        document.getElementById("updateFullDetail").checked =
            config.UPDATE_FULL_DETAIL;

        document.getElementById("onlineAdmission").checked =
            config.ONLINE_ADMISSION_ENABLED;

        document.getElementById("managerLogin").checked =
            config.MANAGER_LOGIN_ENABLE;

        document.getElementById("managerExpense").checked =
            config.MANAGER_CAN_UPDATE_EXPENSES;

        document.getElementById("managerCashExpense").checked =
            config.MANAGER_CAN_UPDATE_CASH_EXPENSES;

        document.getElementById("managerOnlineExpense").checked =
            config.MANAGER_CAN_UPDATE_ONLINE_EXPENSES;

        document.getElementById("studentLogin").checked =
            config.STUDENT_LOGIN_ENABLED;

        document.getElementById("studentDetailUpdate").checked =
            config.STUDENT_DETAIL_UPDATE_ENABLE;

        document.getElementById("studentFeeUpdate").checked =
            config.STUDENT_FEE_UPDATE_ENABLE;

        document.getElementById("studentSeatUpdate").checked =
            config.STUDENT_SEAT_UPDATE_ENABLE;
    },

    async createUser(user) {
        var isAdmin = user === "ADMIN";
        const fullName = document.getElementById(isAdmin ? "adminUserName" : "managerUserName").value.trim();
        const password = document.getElementById(isAdmin ? "adminPassword" : "managerPassword").value;
        // Validation
        if (!fullName) {
            alert("Please enter name.");
            return;
        }

        if (!password) {
            alert("Please enter password.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        const superAdmin = isAdmin
            ? document.getElementById("isSuperAdmin").checked
            : false;


        const request = {
            fullName,
            password,
            role: user,
            superAdmin
        };

        try {
            await Api.post(
                Endpoints.admin.addUser,
                request
            );
            alert(`${user} created successfully.`);
            // Clear form
            document.getElementById(isAdmin ? "adminUserName" : "managerUserName").value = "";
            document.getElementById(isAdmin ? "adminPassword" : "managerPassword").value = "";
            // Refresh table
            if (isAdmin) {
                await this.loadAdmins();
            } else {
                await this.loadManagers();
            }
        } catch (e) {
            alert(e.message || "Unable to create user.");
        }
    },

    async deleteUser(id) {
        if (!confirm("Are you sure you want to delete this user?")) {
            return;
        }
        try {
            await Api.delete(
                Endpoints.admin.deleteUser(id)
            );
            alert("User deleted successfully.");
            if (this.currentTab === "admin") {
                await this.loadAdmins();
            }
            if (this.currentTab === "manager"){
                await this.loadManagers();
            }
        } catch (e) {
            console.error(e);
            alert(e.message || "Unable to delete User.");
        }
    },

    async loadAdmins() {
        try {
            const admins = await Api.get(
                Endpoints.admin.getAllUsers("ADMIN")
            );
            this.admins = admins;
            this.renderAdmins(admins);
        } catch (e) {
            console.error(e);
            alert("Unable to load admins.");
        }
    },

    renderAdmins(admins) {
        const tbody = document.getElementById("adminTable");
        if (!tbody) {
            return;
        }
        if (!admins || admins.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No admins found.
                </td>
            </tr>
        `;
            return;
        }
        tbody.innerHTML = admins.map(admin => `
            <tr>
                <td>${admin.id}</td>
                <td>
                    ${admin.superAdmin ? "👑 " : ""}
                    ${admin.fullName}
                </td>
                <td>${admin.active ? "Active" : "Inactive"}</td>
                <td>
                    <button class="secondary-btn"
                        onclick="Configurations.openUserModalById(${admin.id})">
                        Edit
                    </button>
        
                    ${admin.id !== Session.getUserId() ? `
                        <button class="secondary-btn"
                                onclick="Configurations.deleteUser(${admin.id})">
                            Delete
                        </button>
                    ` : ""}
                </td>
            </tr>
        `).join("");
    },


    async loadManagers() {
        try {
            const managers = await Api.get(
                Endpoints.admin.getAllUsers("MANAGER")
            );
            this.managers = managers;
            this.renderManagers(managers);
        } catch (e) {
            console.error(e);
            alert("Unable to load managers.");
        }
    },

    renderManagers(managers) {
        const tbody = document.getElementById("managerTable");
        if (!tbody) {
            return;
        }
        if (!managers || managers.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No managers found.
                </td>
            </tr>
        `;
            return;
        }

        tbody.innerHTML = managers.map(manager => `
        <tr>
            <td>${manager.id}</td>
            <td>${manager.fullName}</td>
            <td>${manager.active ? "Active" : "Inactive"}</td>
            <td>
                <button class="secondary-btn"
                    onclick="Configurations.openUserModalById(${manager.id})">
                    Edit
                </button>

                <button class="secondary-btn"
                        onclick="Configurations.deleteUser(${manager.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
    },

    editAdmin(id) {
        this.createUserModal();
        // populate fields
    },

    editManager(id) {
        this.createUserModal();
        // populate fields
    },

    async saveGeneral() {

        const libraryName = document.getElementById("libraryName").value.trim();
        const finePerDay = document.getElementById("finePerDay").value;
        const daysForExpire = document.getElementById("daysForExpire").value;
        const daysForDiscontinue = document.getElementById("daysForDiscontinue").value;
        const daysBeforeNextFeeSubmit = document.getElementById("daysBeforeNextFeeSubmit").value;
        const pageLimit = document.getElementById("pageLimit").value;
        const pageSorting = document.querySelector(
            'input[name="pageSorting"]:checked'
        )?.value;

        if (!libraryName) {
            return alert("Library name is required.");
        }

        if (!finePerDay) {
            return alert("Fine per day is required.");
        }

        if (!daysForExpire) {
            return alert("Days for expire is required.");
        }

        if (!daysForDiscontinue) {
            return alert("Days for discontinue is required.");
        }

        if (!daysBeforeNextFeeSubmit) {
            return alert("Days before next fee submit is required.");
        }

        if (!pageLimit) {
            return alert("Page limit is required.");
        }

        if (!pageSorting) {
            return alert("Please select page sorting.");
        }

        const configuration = {
            LIBRARY_NAME: libraryName,
            FINE_PER_DAY: Number(finePerDay),
            DAYS_FOR_EXPIRE: Number(daysForExpire),
            DAYS_FOR_DISCONTINUE: Number(daysForDiscontinue),
            DAYS_BEFORE_NEXT_FEE_SUBMIT: Number(daysBeforeNextFeeSubmit),
            PAGE_LIMIT: Number(pageLimit),
            PAGE_SORTING: pageSorting,
            UPDATE_FULL_DETAIL: document.getElementById(
                "updateFullDetail"
            ).checked
        };

        try {
            await Api.put(
                Endpoints.admin.saveGeneralConfiguration,
                configuration);
            alert("General settings saved successfully.");
        } catch (error) {
            alert("Failed to general settings.");
        }
    },

    async saveManager() {
        const configuration = {
            ONLINE_ADMISSION_ENABLED: document.getElementById("onlineAdmission").checked,
            MANAGER_LOGIN_ENABLE: document.getElementById("managerLogin").checked,
            MANAGER_CAN_UPDATE_EXPENSES: document.getElementById("managerExpense").checked,
            MANAGER_CAN_UPDATE_CASH_EXPENSES: document.getElementById("managerCashExpense").checked,
            MANAGER_CAN_UPDATE_ONLINE_EXPENSES: document.getElementById("managerOnlineExpense").checked
        };

        try {
            await Api.put(
                Endpoints.admin.saveManagerConfiguration,
                configuration
            );
            alert("Manager settings saved successfully.");
        } catch (error) {
            alert("Failed to save manager settings.");
        }
    },

    async saveStudent() {
        const configuration = {
            STUDENT_LOGIN_ENABLED: document.getElementById("studentLogin").checked,
            STUDENT_DETAIL_UPDATE_ENABLE: document.getElementById("studentDetailUpdate").checked,
            STUDENT_FEE_UPDATE_ENABLE: document.getElementById("studentFeeUpdate").checked,
            STUDENT_SEAT_UPDATE_ENABLE: document.getElementById("studentSeatUpdate").checked
        };

        try {
            await Api.put(
                Endpoints.admin.saveStudentConfiguration,
                configuration
            );
            alert("Student settings saved successfully.");

        } catch (error) {
            alert("Failed to save student settings.");
        }
    },

    openUserModalById(id) {

        const activeTab = document.querySelector(".tab-button.active")?.dataset.tab;

        const users = activeTab === "admin"
            ? this.admins
            : this.managers;

        const user = users.find(u => u.id === id);

        if (!user) {
            return;
        }

        this.createUserModal();

        document.getElementById("userModalTitle").textContent =
            activeTab === "admin" ? "Edit Admin" : "Edit Manager";

        document.getElementById("editUserId").value = user.id;
        document.getElementById("editUserName").value = user.fullName;
        document.getElementById("editUserPassword").value = "";
        document.getElementById("editUserActive").checked = user.active;
        document.getElementById("editSuperAdmin").checked = user.superAdmin;
        console.log(user);
        console.log(user.superAdmin);
        const activeGroup = document.getElementById("editUserActive")
            .closest(".form-group");
        const superAdminGroup = document.getElementById("editSuperAdmin")
            .closest(".form-group");

        if (user.id === Session.getUserId()) {
            superAdminGroup.style.display = "none";
            activeGroup.style.display = "none";
        } else {
            activeGroup.style.display = "block"; // or "" if your layout handles it
            document.getElementById("editUserActive").checked = user.active;
            superAdminGroup.style.display = "block";
            document.getElementById("editSuperAdmin").checked = user.superAdmin;
        }
        document.getElementById("userModal").classList.add("show");

    },

    createUserModal() {
        if (document.getElementById("userModal")) {
            return;
        }

        document.body?.insertAdjacentHTML(
            "beforeend",
            `
        <div id="userModal" class="modal">

            <div class="modal-content">

                <div class="modal-header">

                    <h2 id="userModalTitle">Edit User</h2>

                    <button class="close-btn"
                            id="closeUserModalBtn">
                        &times;
                    </button>

                </div>

                <div class="form-grid">

                    <input
                        type="hidden"
                        id="editUserId">

                    <div class="form-group">

                        <label>Name</label>

                        <input
                            id="editUserName"
                            type="text">

                    </div>

                    <div class="form-group">

                        <label>Password</label>

                        <input
                            id="editUserPassword"
                            type="password"
                            placeholder="Leave blank to keep existing">

                    </div>

                    <div class="form-group">

                        <label>Active</label>

                        <label class="switch">

                            <input
                                id="editUserActive"
                                type="checkbox">

                            <span class="slider"></span>

                        </label>

                    </div>
                    
                    <div class="form-group">
                    <label class="switch-row">
                    <span>Super Admin</span>
                    
                    <label class="switch">
                    <input id="editSuperAdmin" type="checkbox">
                    <span class="slider"></span>
                    </label>
                    </label>
                    </div>

                </div>

                <div class="page-actions">

                    <button
                        class="secondary-btn"
                        id="cancelUserModalBtn">
                        Cancel
                    </button>

                    <button
                        class="primary-btn"
                        id="updateUserBtn">
                        Update
                    </button>

                </div>

            </div>

        </div>
        `
        );
        document.getElementById("userModal").style.display = "flex";
        document
            .getElementById("closeUserModalBtn")
            .addEventListener("click", () => this.closeUserModal());

        document
            .getElementById("cancelUserModalBtn")
            .addEventListener("click", () => this.closeUserModal());

        document
            .getElementById("updateUserBtn")
            .addEventListener("click", () => this.updateUser());

    },

    closeUserModal() {
        document.getElementById("userModal")?.remove();
    },

    async updateUser() {
        const id = document.getElementById("editUserId").value;

        const fullName = document
            .getElementById("editUserName")
            .value
            .trim();

        const password = document
            .getElementById("editUserPassword")
            .value;

        const active = document
            .getElementById("editUserActive")
            .checked;

        const superAdmin = document
            .getElementById("editSuperAdmin")
            .checked;

        if (!fullName) {
            alert("Please enter name.");
            return;
        }

        const request = {
            id,
            fullName,
            active,
            superAdmin
        };

        // Only send password if it was changed
        if (password.trim() !== "") {
            request.password = password;
        }

        try {
            await Api.put(
                Endpoints.admin.updateUser,
                request
            );

            this.closeUserModal();

            if (this.currentTab === "admin") {
                await this.loadAdmins();
            } else if (this.currentTab === "manager") {
                await this.loadManagers();
            }
            alert("User updated successfully.");
        } catch (error) {
            alert("Failed to general settings.");
        }
    },

    async clearPendingApprovals() {

        if (!confirm("Delete all pending approval requests?")) {
            return;
        }

        try {

            await Api.delete(
                Endpoints.admin.clearPendingApprovals
            );

            alert("Pending approvals cleared.");

        } catch (e) {

            alert(e.message);

        }

    },

    async clearFeeRecords() {

        try {

            await Api.post(
                Endpoints.admin.clearFeeRecords
            );

            alert("Fee records cleaned.");

        } catch (e) {

            alert(e.message);

        }

    },

    async resetConfiguration() {

        if (!confirm("Reset all configurations to default?")) {
            return;
        }

        try {

            await Api.post(
                Endpoints.admin.resetConfiguration
            );

            alert("Configuration reset.");

            this.loadConfigurations();

        } catch (e) {

            alert(e.message);

        }

    },

    async resetSeats() {

        if (!confirm("Reset all seats?")) {
            return;
        }

        try {

            await Api.post(
                Endpoints.admin.resetSeats
            );

            alert("Seats reset.");

        } catch (e) {

            alert(e.message);

        }

    },

    async clearTransactions() {

        const beforeDate =
            document.getElementById("transactionBeforeDate").value;

        if (!beforeDate) {
            return alert("Please select a date.");
        }

        if (!confirm("Delete all transactions before selected date?")) {
            return;
        }

        try {

            await Api.post(
                Endpoints.admin.clearTransactions(beforeDate)
            );

            alert("Transactions deleted.");

        } catch (e) {

            alert(e.message);

        }

    }

};