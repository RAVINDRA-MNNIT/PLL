const BatchManager = {
    batches: [],
    filteredBatches: [],
    currentBatch: null,

    async load() {
        const container = document.getElementById("batchesContainer");
        if (!container) {
            console.error("batchesContainer not found.");
            return;
        }

        container.innerHTML = `
            <section class="card">
                <p style="color:var(--muted)">Loading Batches...</p>
            </section>
        `;

        try {
            const response = await fetch("/batches.html");
            if (!response.ok) {
                throw new Error("Unable to load batches page.");
            }

            const html = await response.text();
            container.innerHTML = html;
            this.initialize();
        } catch (error) {
            console.error("Failed to load batches:", error);
            container.innerHTML = `
                <section class="card">
                    <p style="color:red">Unable to load batches.</p>
                </section>
            `;
        }
    },

    initialize() {
        this.loadBatches();
        this.populateCategories();
    },

    loadBatches() {
        const tbody = document.getElementById("batchRows");
        if (!tbody) {
            return;
        }

        try {
            this.batches = typeof getBatches === "function"
                ? (getFullBatchesList() || [])
                : (window.libraryLookups?.fullBatchList || []);
            this.filteredBatches = [...this.batches];
            this.render();
        } catch (error) {
            this.batches = [];
            this.filteredBatches = [];
            this.renderError();
        }
    },

    filterByStatus(status) {
        if (status === "ALL") {
            this.filteredBatches = [...this.batches];
        } else {
            const active = status === "true";

            this.filteredBatches = this.batches.filter(
                batch => Boolean(batch.isActive) === active
            );
        }

        this.render();
    },

    populateCategories() {
        const select = document.getElementById("editBatchCategory");
        if (!select) {
            return;
        }

        const categories = [
            "4 HOURS",
            "5 HOURS",
            "6 HOURS",
            "8 HOURS",
            "9 HOURS",
            "10 HOURS",
            "11 HOURS",
            "12 HOURS",
            "24 HOURS",
            "FULL DAY",
            "NIGHT",
            "COMBO",
            "OTHER",
        ];

        select.innerHTML = `<option value="">Select Category</option>`;

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    },

    render() {
        const tbody = document.getElementById("batchRows");
        const count = document.getElementById("batchCount");

        if (!tbody) {
            return;
        }

        if (count) {
            count.textContent = this.filteredBatches.length;
        }

        if (!this.filteredBatches.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="batch-empty">
                        No batches found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredBatches
            .map(batch => this.renderRow(batch))
            .join("");
    },

    renderError() {
        const tbody = document.getElementById("batchRows");
        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="batch-empty">
                    Unable to load batches.
                </td>
            </tr>
        `;
    },

    renderRow(batch) {
        const active = batch.isActive !== false;
        const statusText = active ? "Active" : "Inactive";
        const amount = batch.baseAmount == null || batch.baseAmount === ""
            ? "—"
            : `₹${Number(batch.baseAmount).toLocaleString("en-IN")}`;

        return `
        <tr>
            <td>${this.escape(batch.id)}</td>
            <td>${this.escape(batch.name ?? batch.batchName)}</td>
            <td>${this.escape(batch.alias ?? batch.batchAlias)}</td>
            <td>${this.escape(batch.category)}</td>
            <td>${this.escape(batch.room)}</td>
            <td>${amount}</td>
            <td>
                <span class="batch-status ${active ? "active" : "inactive"}">
                    ${statusText}
                </span>
            </td>
            <td>
                <div class="batch-actions">
                    <button type="button"
                        class="batch-action-btn edit"
                        title="Edit"
                        onclick="BatchManager.edit(${Number(batch.id)})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button"
                        class="batch-action-btn delete"
                        title="Delete"
                        onclick="BatchManager.delete(${Number(batch.id)})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    },

    openAddModal() {
        const form = document.getElementById("batchForm");
        const modal = document.getElementById("batchModal");
        const title = document.getElementById("batchModalTitle");
        const saveText = document.getElementById("saveBatchText");
        const active = document.getElementById("batchActive");

        if (!form || !modal) {
            return;
        }

        form.reset();

        document.getElementById("editBatchId").value = "";

        if (active) {
            active.checked = true;
        }

        if (title) {
            title.textContent = "Create Batch";
        }

        if (saveText) {
            saveText.textContent = "Create Batch";
        }

        modal.classList.add("show");

        setTimeout(() => {
            document.getElementById("editBatchName")?.focus();
        }, 100);
    },

    edit(id) {
        const batch = this.batches.find(
            item => String(item.id) === String(id)
        );

        if (!batch) {
            console.error("Batch not found:", id);
            return;
        }

        this.currentBatch = batch;

        const modal = document.getElementById("batchModal");
        const title = document.getElementById("batchModalTitle");
        const saveText = document.getElementById("saveBatchText");

        document.getElementById("editBatchId").value = batch.id ?? "";
        document.getElementById("editBatchName").value = batch.name ?? batch.batchName ?? "";
        document.getElementById("editBatchAlias").value = batch.alias ?? batch.batchAlias ?? "";
        document.getElementById("editBatchCategory").value = batch.category ?? "";
        document.getElementById("editBatchRoom").value = batch.room ?? "";
        document.getElementById("editBaseAmount").value = batch.baseAmount ?? "";

        const active = batch.isActive !== false;
        document.getElementById("batchActive").checked = active;
        document.getElementById("batchInactive").checked = !active;

        if (title) {
            title.textContent = "Edit Batch";
        }

        if (saveText) {
            saveText.textContent = "Update Batch";
        }

        modal.classList.add("show");
    },

    async save(event) {
        event.preventDefault();

        const validationError = this.validateBatch();

        if (validationError) {
            alert(validationError);
            return;
        }

        const id = document.getElementById("editBatchId").value;

        const payload = {
            batchName: document.getElementById("editBatchName").value.trim(),
            batchAlias: document.getElementById("editBatchAlias").value.trim() || null,
            category: document.getElementById("editBatchCategory").value,
            room: document.getElementById("editBatchRoom").value.trim() || null,
            baseAmount: document.getElementById("editBaseAmount").value === ""
                ? null
                : Number(document.getElementById("editBaseAmount").value),
            isActive: document.querySelector(
                'input[name="batchStatus"]:checked'
            )?.value === "true"
        };

        try {
            if (id) {
                await Api.put(Endpoints.admin.updateBatch(id), payload);
            } else {
                await Api.post(Endpoints.admin.createBatch, payload);
            }

            if (id) {
                alert("Batch updated successfully");
            } else {
                alert("Batch added successfully");
            }

            this.closeModal();
            await reloadBatches();
            this.loadBatches();
        } catch (error) {
            alert(error.message || "Unable to save batch.");
        }
    },

    async delete(id) {
        const replaceWithBatchId = prompt("Enter replacement Batch id to update in existing fee records as it is mandatory:");
        if (!replaceWithBatchId) {
            return;
        }
        if (String(id) === String(replaceWithBatchId)) {
            alert("Replacement batch cannot be the same batch.");
            return;
        }
        if (!confirm(`Are you sure you want to delete the batch`)) {
            return;
        }
        try {
            await Api.delete(Endpoints.admin.deleteBatch(id, replaceWithBatchId));
            await reloadBatches();
            this.loadBatches();
            alert("Batch deleted successfully");
        } catch (error) {
            console.error("Failed to delete batch:", error);
            alert(error.message || "Unable to delete batch.");
        }
    },

    closeModal() {
        const modal = document.getElementById("batchModal");
        if (modal) {
            modal.classList.remove("show");
        }

        this.currentBatch = null;
    },

    escape(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    validateBatch() {
        const name = document.getElementById("editBatchName").value.trim();
        const alias = document.getElementById("editBatchAlias").value.trim();
        const category = document.getElementById("editBatchCategory").value;
        const baseAmount = document.getElementById("editBaseAmount").value.trim();
        const batchId = document.getElementById("editBatchId").value;
        if (!name) {
            return "Batch Name is required.";
        }
        if (name.length < 2) {
            return "Batch Name must contain at least 2 characters.";
        }
        if (!category) {
            return "Category is required.";
        }

        if (baseAmount.startsWith("-")) {
            return "Base Amount cannot be negative.";
        }

        if (!/^\d+(\.\d+)?$/.test(baseAmount)) {
            return "Please enter a valid Base Amount.";
        }

        if (!/^\d+(\.\d{1,2})?$/.test(baseAmount)) {
            return "Base Amount can have maximum 2 decimal places.";
        }

        const duplicateName = this.batches.some(batch => {
            const sameBatch = String(batch.id) === String(batchId);
            const batchName = String(batch.name ?? batch.batchName ?? "").trim();
            return !sameBatch && batchName.toLowerCase() === name.toLowerCase();
        });
        if (duplicateName) {
            return "A batch with this name already exists.";
        }
        if (alias) {
            const duplicateAlias = this.batches.some(batch => {
                const sameBatch = String(batch.id) === String(batchId);
                const batchAlias = String(batch.alias ?? batch.batchAlias ?? "").trim();
                return !sameBatch &&
                    batchAlias &&
                    batchAlias.toLowerCase() === alias.toLowerCase();
            });
            if (duplicateAlias) {
                return "A batch with this alias already exists.";
            }
        }
        return null;
    },

    print() {
        const table = document.querySelector("#batchesView .batch-table");
        if (!table) {
            return;
        }

        const clone = table.cloneNode(true);

        clone.querySelectorAll("tr").forEach(row => {
            const cells = Array.from(row.children);

            if (cells.length < 8) {
                return;
            }

            const category = cells[3];
            const batchName = cells[1];
            const alias = cells[2];
            const baseAmount = cells[5];

            row.innerHTML = "";

            row.appendChild(category);
            row.appendChild(batchName);
            row.appendChild(alias);
            row.appendChild(baseAmount);
        });

        const printWindow = window.open("", "_blank");

        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Batches</title>
            <style>
                @page {
                    margin: 10mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .library-name {
                    font-size: 22px;
                    font-weight: 700;
                }

                .print-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-top: 5px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 8px;
                    text-align: left;
                }

                th {
                    font-weight: 700;
                }
            </style>
        </head>
        <body>

            <div class="print-header">
                <div class="library-name">
                    ${getConfigurations().LIBRARY_NAME}
                </div>

                <div class="print-title">
                    Batches
                </div>
            </div>

            ${clone.outerHTML}

        </body>
        </html>
    `);

        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    },
};