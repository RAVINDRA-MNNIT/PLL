const Transactions = {

    async load() {

        const container = document.getElementById("transactionContainer");

        if (!container) {
            console.error("transactionContainer not found.");
            return;
        }

        container.innerHTML = `
            <section class="card">
                <p style="color:var(--muted)">Loading Transactions...</p>
            </section>
        `;

        try {

            const html = await fetchHtml("/transaction.html");

            if (!html) {
                container.innerHTML = `
                    <section class="card">
                        <p style="color:red">Unable to load Transactions.</p>
                    </section>
                `;
                return;
            }

            container.innerHTML = html;

            this.initialize();

        } catch (e) {

            console.error(e);

            container.innerHTML = `
                <section class="card">
                    <p style="color:red">Failed to load Transactions.</p>
                </section>
            `;
        }
    },

    initialize() {

        this.loadMonths();

        const expenseDate = document.getElementById("expenseDate");

        if (expenseDate) {
            const now = new Date();

            const today =
                now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, "0") + "-" +
                String(now.getDate()).padStart(2, "0");

            expenseDate.value = today;
        }

        if (Session.isAdmin()) {

            document.getElementById("incomeTabBtn").style.display = "";
            document.getElementById("profitTabBtn").style.display = "";

            this.showIncome();

        } else {

            document.getElementById("incomeTabBtn").style.display = "none";
            document.getElementById("profitTabBtn").style.display = "none";

            this.showExpense();
        }
    },

    /* =======================================================
       Main Tabs
    ======================================================= */

    showIncome() {

        this.activateMainTab("income");

        document.getElementById("incomeView").style.display = "block";
        document.getElementById("profitView").style.display = "none";
        document.getElementById("expenseView").style.display = "none";

        this.showDailyIncome();
    },

    showProfit() {

        this.activateMainTab("profit");

        document.getElementById("incomeView").style.display = "none";
        document.getElementById("profitView").style.display = "block";
        document.getElementById("expenseView").style.display = "none";

        this.loadProfit();
    },

    showExpense() {

        this.activateMainTab("expense");

        document.getElementById("incomeView").style.display = "none";
        document.getElementById("profitView").style.display = "none";
        document.getElementById("expenseView").style.display = "block";

        this.showNewExpense();
    },

    activateMainTab(tab) {

        document
            .querySelectorAll(".transaction-tabs .transaction-tab")
            .forEach(btn => btn.classList.remove("active"));

        document
            .getElementById(tab + "TabBtn")
            .classList.add("active");
    },

    /* =======================================================
       Income
    ======================================================= */

    showDailyIncome() {

        document.getElementById("dailyIncomeBtn").classList.add("active");
        document.getElementById("monthlyIncomeBtn").classList.remove("active");

        document.getElementById("dailyIncomeView").style.display = "block";
        document.getElementById("monthlyIncomeView").style.display = "none";

        document.getElementById("monthFilter").style.display = "none";

        this.loadDailyIncome();
    },

    showMonthlyIncome() {

        document.getElementById("dailyIncomeBtn").classList.remove("active");
        document.getElementById("monthlyIncomeBtn").classList.add("active");

        document.getElementById("dailyIncomeView").style.display = "none";
        document.getElementById("monthlyIncomeView").style.display = "block";

        document.getElementById("monthFilter").style.display = "flex";

        this.loadMonthlyIncome();
    },

    async loadDailyIncome() {
        try {
            const response = await Api.get(Endpoints.admin.getDailyIncome);
            this.renderDailyIncome(response);
        } catch (error) {
            console.log(error)
        }
    },

    async loadMonthlyIncome() {

        const month = document.getElementById("incomeMonth").value;
        try {
            const response = await Api.get(Endpoints.admin.getMonthlyIncome(month));
            this.renderMonthlyIncome(response);
        } catch (error) {
            console.log(error)
        }
    },

    renderMonthlyIncome(summary) {

        const tbody = document.getElementById("monthlyIncomeRows");

        if (!tbody) {
            return;
        }

        if (!summary) {

            tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No data found.
                </td>
            </tr>
        `;

            return;
        }

        tbody.innerHTML = `
        <tr>
            <td>${formatCurrency(summary.admissionCash)}</td>
            <td>${formatCurrency(summary.admissionOnline)}</td>
            <td>${formatCurrency(summary.feeCash)}</td>
            <td>${formatCurrency(summary.feeOnline)}</td>
            <td><strong>${formatCurrency(summary.totalCash)}</strong></td>
            <td><strong>${formatCurrency(summary.totalOnline)}</strong></td>
            <td><strong>${formatCurrency(summary.grandTotal)}</strong></td>

            
        </tr>

    `;
    },

    renderDailyIncome(incomes) {

        const tbody = document.getElementById("dailyIncomeRows");

        if (!tbody) {
            return;
        }

        if (!incomes || incomes.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No income found.
                </td>
            </tr>
        `;

            return;
        }

        let html = "";

        incomes.forEach(income => {

            html += `
            <tr>
                <td>${income.id}</td>
                <td>${income.studentId}</td>
                <td>${income.sourceType ?? "-"}</td>
                <td>${formatCurrency(income.amount)}</td>
                <td>${income.paymentMode}</td>
                <td>${formatDate(income.transactionDate)}</td>
            </tr>
        `;

        });

        tbody.innerHTML = html;

    },

    /* =======================================================
       Profit
    ======================================================= */

    async loadProfit() {
        try {

            Session.isAdmin();

            const response = await Api.get(Endpoints.admin.getProfit);

            this.renderProfit(response);

        } catch (error) {
            console.error(error);
        }
    },

    renderProfit(data) {

        document.getElementById("profitIncome").textContent =
            formatCurrency(data.totalIncome);

        document.getElementById("profitExpense").textContent =
            formatCurrency(data.totalExpense);

        document.getElementById("netProfit").textContent =
            formatCurrency(data.totalProfit);

        const tbody = document.getElementById("profitRows");

        if (!data.daily || data.daily.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    No data found.
                </td>
            </tr>
        `;
            return;
        }

        tbody.innerHTML = data.daily.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>${formatCurrency(item.incomeCash)}</td>
            <td>${formatCurrency(item.incomeOnline)}</td>
            <td>${formatCurrency(item.expenseCash)}</td>
            <td>${formatCurrency(item.expenseOnline)}</td>
            <td>${formatCurrency(item.profitCash)}</td>
            <td>${formatCurrency(item.profitOnline)}</td>
            <td>${formatCurrency(item.totalProfit)}</td>
        </tr>
    `).join("");

    },

    /* =======================================================
       Expense
    ======================================================= */

    showExpenseDashboard() {

        this.activateExpenseTab("expenseDashboardBtn");

        document.getElementById("expenseDashboardView").style.display = "";
        document.getElementById("newExpenseView").style.display = "none";
        document.getElementById("expenseListView").style.display = "none";

        this.loadExpenseAnalytics();
    },

    showNewExpense() {

        this.activateExpenseTab("newExpenseBtn");

        document.getElementById("expenseDashboardView").style.display = "none";
        document.getElementById("newExpenseView").style.display = "";
        document.getElementById("expenseListView").style.display = "none";
    },

    showExpenses() {

        this.activateExpenseTab("expenseListBtn");

        document.getElementById("expenseDashboardView").style.display = "none";
        document.getElementById("newExpenseView").style.display = "none";
        document.getElementById("expenseListView").style.display = "";

        this.loadExpenses();
    },

    renderExpenseAnalytics(data) {

        document.getElementById("todayExpense").textContent =
            "₹" + formatCurrency(data.todayExpense);

        document.getElementById("monthExpense").textContent =
            "₹" + formatCurrency(data.monthExpense);

        document.getElementById("pendingAmount").textContent =
            "₹" + formatCurrency(data.pendingAmount);

        document.getElementById("averagePerDay").textContent =
            "₹" + formatCurrency(data.averagePerDay);

        document.getElementById("todayTransactionCount").textContent =
            data.todayExpenses.length;

        document.getElementById("smallExpenseCount").textContent =
            data.smallExpenseCount;

        document.getElementById("smallExpenseAmount").textContent =
            "₹" + formatCurrency(data.smallExpenseAmount);

        document.getElementById("mediumExpenseCount").textContent =
            data.mediumExpenseCount;

        document.getElementById("mediumExpenseAmount").textContent =
            "₹" + formatCurrency(data.mediumExpenseAmount);

        document.getElementById("largeExpenseCount").textContent =
            data.largeExpenseCount;

        document.getElementById("largeExpenseAmount").textContent =
            "₹" + formatCurrency(data.largeExpenseAmount);

        this.renderCategoryChart(data.categorySummary || []);

        this.renderPaymentChart(data.paymentModeSummary || []);

        this.renderCategorySummary(data.categorySummary || []);


    },

    renderCategoryChart(summary) {

        const ctx =
            document.getElementById("categoryChart");

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        this.categoryChart = new Chart(ctx, {

            type: "pie",

            data: {

                labels: summary.map(x => x.category),

                datasets: [{
                    data: summary.map(x => x.amount)
                }]

            },

            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }

        });

    },

    renderPaymentChart(summary) {

        const ctx =
            document.getElementById("paymentChart");

        if (this.paymentChart) {
            this.paymentChart.destroy();
        }

        this.paymentChart = new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: summary.map(x => x.paymentMode),

                datasets: [{
                    data: summary.map(x => x.amount)
                }]

            },

            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }

        });

    },

    renderCategorySummary(summary) {

        const tbody =
            document.getElementById("categorySummaryRows");

        tbody.innerHTML = "";

        if (!summary || summary.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center">
                    No expense found.
                </td>
            </tr>
        `;

            return;
        }

        summary.forEach(item => {

            tbody.innerHTML += `
            <tr>

                <td>${item.category}</td>

                <td>₹${formatCurrency(item.amount)}</td>

            </tr>
        `;

        });

    },

    activateExpenseTab(id) {

        [
            "expenseDashboardBtn",
            "newExpenseBtn",
            "pendingExpenseBtn"
        ].forEach(btn => {
            document.getElementById(btn)?.classList.remove("active");
        });

        document.getElementById(id)?.classList.add("active");
    },
    // showNewExpense() {
    //
    //     document.getElementById("newExpenseBtn").classList.add("active");
    //     document.getElementById("pendingExpenseBtn").classList.remove("active");
    //
    //     document.getElementById("newExpenseView").style.display = "block";
    //     document.getElementById("expenseListView").style.display = "none";
    // },
    //
    // showExpenses() {
    //
    //     document.getElementById("newExpenseBtn").classList.remove("active");
    //     document.getElementById("pendingExpenseBtn").classList.add("active");
    //
    //     document.getElementById("newExpenseView").style.display = "none";
    //     document.getElementById("expenseListView").style.display = "block";
    //
    //     this.loadExpenses();
    // },

    async loadExpenseAnalytics() {

        try {

            const analytics = await Api.get(
                Endpoints.admin.expenseAnalytics
            );

            if (!analytics) {
                return;
            }

            this.renderExpenseAnalytics(analytics);

        } catch (error) {

            console.error(error);

            alert("Unable to load expense analytics.");

        }

    },

    async loadExpenses() {
        try {
            Session.isAdmin()
            const response = await Api.get(Endpoints.admin.getExpense);
            this.renderExpenses(response);
        } catch (error) {
            console.log(error)
        }
    },

    renderExpenses(expenses) {

        const tbody = document.getElementById("expenseRows");

        if (!tbody) {
            return;
        }

        if (!expenses || expenses.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No expenses found.
                </td>
            </tr>
        `;

            return;
        }

        let html = "";

        expenses.forEach(expense => {

            html += `
            <tr>
                <td>${formatDate(expense.transactionDate)}</td>
                <td>${expense.expenseCategory ?? "-"}</td>
                <td>${expense.description ?? "-"}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${expense.paymentMode ?? "-"}</td>
                <td>
                    <span class="status ${expense.status.toLowerCase()}">
                        ${expense.status}
                    </span>
                </td>
                <td>
                       ${this.renderExpenseActions(expense)}
                </td>
            </tr>
        `;
        });

        tbody.innerHTML = html;

    },

    renderExpenseActions(expense) {

        if (expense.status === "PENDING") {

            if (Session.isAdmin()) {
                return `
                <button
                    class="icon-btn success"
                    title="Approve"
                    onclick="Transactions.approveExpense(${expense.id})">
                    <i class="fa-solid fa-check"></i>
                </button>

                <button
                    class="icon-btn danger"
                    title="Reject"
                    onclick="Transactions.rejectExpense(${expense.id})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            }

            return `
            <button
                class="icon-btn danger"
                title="Cancel"
                onclick="Transactions.cancelExpense(${expense.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        }

        // DIRECT / APPROVED
        return `
        <i
            class="fa-solid fa-circle-check text-success"
            title="${expense.status}">
        </i>
    `;
    },

    async saveExpense() {
        if (!Transactions.validateExpenseForm()) {
            return;
        }
        const expense = {
            transactionDate: document.getElementById("expenseDate").value,
            category: document.getElementById("expenseCategory").value,
            amount: document.getElementById("expenseAmount").value,
            paymentMode: document.getElementById("expensePaymentMode").value,
            description: document.getElementById("expenseDescription").value
        };

        try {
            Session.isAdmin()
            await Api.post(Session.isAdmin() ? Endpoints.admin.saveExpense : Endpoints.manager.saveExpense, expense);
            alert("Expense saved successfully.");
            this.resetExpenseForm();
        } catch (error) {
            console.log(error)
        }
    },

    async approveExpense(id) {
        if (!Session.isAdmin()) {
            await Session.logout()
            return;
        }
        if (!confirm("Are you sure to approve this expense")) {
            return;
        }
        try {
            await Api.post(Endpoints.admin.approveExpense, id);
            alert("Approved successfully.");
            await this.loadExpenses(); // Refresh list
        } catch (error) {
            console.log(error)
        }
    },

    async rejectExpense(id) {
        if (!Session.isAdmin()) {
            await Session.logout()
            return;
        }
        if (!confirm("Are you sure to reject this expense")) {
            return;
        }
        if (!Session.isAdmin()) {
            await Session.logout()
            return;
        }
        try {
            await Api.post(Endpoints.admin.rejectExpense, id);
            alert("Rejected successfully.");
            await this.loadExpenses(); // Refresh list
        } catch (error) {
            console.log(error)
        }
    },

    async cancelExpense(id) {
        try {
            await Api.post(Endpoints.manager.cancelExpense, id);
            alert("Cancelled successfully.");
            await this.loadExpenses(); // Refresh list
        } catch (error) {
            console.log(error)
        }
    },

    resetExpenseForm() {

        document.getElementById("expenseCategory").value = "";
        document.getElementById("expenseAmount").value = "";
        document.getElementById("expensePaymentMode").value = "";
        document.getElementById("expenseDescription").value = "";

        const expenseDate = document.getElementById("expenseDate");

        if (expenseDate) {
            const now = new Date();

            const today =
                now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, "0") + "-" +
                String(now.getDate()).padStart(2, "0");

            expenseDate.value = today;
        }
    },

    /* =======================================================
       Month Dropdown
    ======================================================= */

    loadMonths() {

        const select = document.getElementById("incomeMonth");

        if (!select) {
            return;
        }

        select.innerHTML = "";

        const today = new Date();

        for (let i = 0; i < 2; i++) {

            const d = new Date(
                today.getFullYear(),
                today.getMonth() - i,
                1
            );

            const value =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0");

            const text = d.toLocaleString("default", {
                month: "long",
                year: "numeric"
            });

            select.add(new Option(text, value));
        }
    },

    validateExpenseForm() {

        const category = document.getElementById("expenseCategory").value.trim();
        const amount = document.getElementById("expenseAmount").value.trim();
        const paymentMode = document.getElementById("expensePaymentMode").value;
        const description = document.getElementById("expenseDescription").value.trim();

        if (!category) {
            alert("Please select expense category.");
            document.getElementById("expenseCategory").focus();
            return false;
        }

        if (!amount) {
            alert("Please enter amount.");
            document.getElementById("expenseAmount").focus();
            return false;
        }

        if (isNaN(amount) || Number(amount) <= 0) {
            alert("Please enter a valid amount.");
            document.getElementById("expenseAmount").focus();
            return false;
        }

        if (!paymentMode) {
            alert("Please select payment mode.");
            document.getElementById("expensePaymentMode").focus();
            return false;
        }

        if (!description) {
            alert("Please enter description.");
            document.getElementById("expenseDescription").focus();
            return false;
        }

        return true;
    }

};