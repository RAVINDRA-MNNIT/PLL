const Strength = {

    async load() {

        const container =
            document.getElementById("strengthContainer");

        if (!container) {
            console.error("strengthContainer not found.");
            return;
        }

        container.innerHTML = `
            <section class="card loading-card">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading Student Strength...</span>
            </section>
        `;

        try {

            const html =
                await fetchHtml("/studentStrength.html");

            if (!html) {
                throw new Error("Unable to load studentStrength.html");
            }

            container.innerHTML = html;

            await this.initialize();

        } catch (error) {

            console.error(error);

            container.innerHTML = `
                <section class="card">
                    <div class="error-state">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <h3>Unable to load Student Strength</h3>
                        <p>Please try again.</p>
                    </div>
                </section>
            `;

        }

    },

    async initialize() {

        this.initializeTabs();

        this.initializeSubTabs();

        const availableSection = document.getElementById("summaryItemId");
        availableSection.style.display = "none";
        await this.loadOverall();

    },

    initializeTabs() {

        const container =
            document.getElementById("strengthContainer");

        const tabs =
            container.querySelectorAll(".strength-tab");

        const contents =
            container.querySelectorAll(".tab-content");

        const summary =
            container.querySelector("#strengthSummary");

        const availableSection =
            container.querySelector("#summaryItemId");

        tabs.forEach(tab => {

            tab.addEventListener("click", async () => {

                // Active Tab
                tabs.forEach(t =>
                    t.classList.remove("active")
                );

                tab.classList.add("active");

                // Active Content
                contents.forEach(c =>
                    c.classList.remove("active")
                );

                const target =
                    container.querySelector(`#${tab.dataset.tab}`);

                if (target) {
                    target.classList.add("active");
                }

                // Reset summary visibility
                summary.style.display = "flex";
                availableSection.style.display = "flex";

                switch (tab.dataset.tab) {

                    case "overall":

                        availableSection.style.display = "none";
                        await this.loadOverall();
                        break;

                    case "fullday":

                        await this.loadFullDay();
                        break;

                    case "room1":

                        await this.loadRoom1();
                        break;

                    case "room2":

                        summary.style.display = "none";
                        await this.loadRoom2();
                        break;

                    case "room3":

                        summary.style.display = "none";
                        await this.loadRoom3();
                        break;
                }

            });

        });

    },

    initializeSubTabs() {

        const container =
            document.getElementById("strengthContainer");

        container
            .querySelectorAll(".sub-tabs")
            .forEach(group => {

                const tabs =
                    group.querySelectorAll(".sub-tab");

                tabs.forEach(tab => {

                    tab.addEventListener("click", async () => {

                        tabs.forEach(t =>
                            t.classList.remove("active"));

                        tab.classList.add("active");

                        const room =
                            group.closest(".tab-content").id;

                        const shift =
                            tab.textContent.trim();

                        if (room === "room2") {

                            await this.loadRoom2(shift);

                        } else if (room === "room3") {

                            await this.loadRoom3(shift);

                        }

                    });

                });

            });

    },

    async loadOverall() {

        try {

            const data = await Api.get(
                Endpoints.strength.overall
            );

            this.renderOverall(data);

        } catch (e) {

            alert(e.message ?? "Unable to load student strength.");

        }

    },

    renderOverall(data) {

        const sections = {
            room1: {
                tbody: document.getElementById("room1Strength"),
                total: document.getElementById("room1Total")
            },
            room2: {
                tbody: document.getElementById("room2Strength"),
                total: document.getElementById("room2Total")
            },
            room3: {
                tbody: document.getElementById("room3Strength"),
                total: document.getElementById("room3Total")
            },
            nightShift: {
                tbody: document.getElementById("nightStrength"),
                total: document.getElementById("nightTotal")
            }
        };

        const totalStudentsElement =
            document.getElementById("totalStudents");

        Object.values(sections).forEach(section => {

            if (section.tbody) {
                section.tbody.innerHTML = "";
            }

            if (section.total) {
                section.total.textContent = "0";
            }

        });

        const totals = {
            room1: 0,
            room2: 0,
            room3: 0,
            nightShift: 0
        };

        let overallTotal = 0;

        const renderRows = (rows, sectionKey) => {

            const section = sections[sectionKey];

            if (!rows || rows.length === 0) {

                section.tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center">
                        No Records Found
                    </td>
                </tr>
            `;

                return;
            }

            rows.forEach(row => {

                const count = Number(row.count) || 0;

                totals[sectionKey] += count;
                overallTotal += count;

                section.tbody.insertAdjacentHTML(
                    "beforeend",
                    `
                <tr>
                    <td>${row.name}</td>
                    <td class="text-end">${count}</td>
                </tr>
                `
                );

            });

            section.total.textContent = totals[sectionKey];

        };

        renderRows(data.room1, "room1");
        renderRows(data.room2, "room2");
        renderRows(data.room3, "room3");
        renderRows(data.nightShift, "nightShift");

        if (totalStudentsElement) {
            totalStudentsElement.textContent = overallTotal;
        }

    },

    async loadFullDay() {

        try {

            const data = await Api.get(
                Endpoints.strength.fullDayStatus
            );

            this.renderFullDay(data);

        } catch (e) {

            alert(e.message ?? "Unable to load Full Day.");

        }

    },

    renderFullDay(data) {

        const tbody = document.getElementById("fulldayTable");

        document.getElementById("totalStudents").textContent =
            data.occupied;

        document.getElementById("availableSeats").textContent =
            data.available;

        tbody.innerHTML = "";

        if (!data.students || data.students.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No Records Found
                </td>
            </tr>
        `;

            return;
        }

        data.students.forEach(student => {

            const occupied = student.studentId != null;

            tbody.insertAdjacentHTML(
                "beforeend",
                `
            <tr class="${occupied ? "" : "vacant-row"}">
                <td>${student.seatNumber}</td>
                <td>${student.studentId ?? "—"}</td>
                <td>${student.fullName ?? "—"}</td>
                <td>${student.mobileNumber ?? "—"}</td>
                <td>${formatDate(student.tillDate ?? "") ?? "—"}</td>
                <td>
                    ${
                    occupied
                        ? `<span class="status ${student.status.toLowerCase()}">${student.status}</span>`
                        : `<span class="status available">Available</span>`
                }
                </td>
            </tr>
            `
            );

        });

    },

    async loadRoom1() {

        try {

            const data = await Api.get(
                Endpoints.strength.room1Status
            );

            this.renderRoom1(data);

        } catch (e) {

            alert(e.message ?? "Unable to load Full Day.");

        }

    },

    renderRoom1(data) {

        const tbody = document.getElementById("room1Table");

        document.getElementById("totalStudents").textContent =
            data.occupied;

        document.getElementById("availableSeats").textContent =
            data.available;

        tbody.innerHTML = "";

        if (!data.students || data.students.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No Records Found
                </td>
            </tr>
        `;

            return;
        }

        data.students.forEach(student => {

            const occupied = student.studentId != null;

            tbody.insertAdjacentHTML(
                "beforeend",
                `
            <tr class="${occupied ? "" : "vacant-row"}">
                <td>${student.seatNumber}</td>
                <td>${student.studentId ?? "—"}</td>
                <td>${student.fullName ?? "—"}</td>
                <td>${student.mobileNumber ?? "—"}</td>
                <td>${formatDate(student.tillDate ?? "") ?? "—"}</td>
                <td>
                    ${
                    occupied
                        ? `<span class="status ${student.status.toLowerCase()}">${student.status}</span>`
                        : `<span class="status available">Available</span>`
                }
                </td>
            </tr>
            `
            );

        });

    },

    printSection(sectionId, title) {

    const content = document.getElementById(sectionId).innerHTML;

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>

            <link rel="stylesheet" href="/css/manager.css">
            <link rel="stylesheet" href="/css/studentStrength.css">

            <style>
                .print-btn{
                    display:none;
                }
            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
    };
},
    async loadRoom2() {

        try {

            const data = await Api.get(
                Endpoints.strength.room2Status
            );

            this.renderRoom2Strength(data);

        } catch (e) {

            alert(e.message ?? "Unable to load Room 2 Strength.");

        }

    },

    renderRoom2Strength(data) {

        this.renderShift(
            data.firstShift,
            "room2Shift1Strength",
            "room2Shift1Total"
        );

        this.renderShift(
            data.secondShift,
            "room2Shift2Strength",
            "room2Shift2Total"
        );

        this.renderShift(
            data.thirdShift,
            "room2Shift3Strength",
            "room2Shift3Total"
        );

    },

    renderShift(items, tbodyId, totalId) {

        const tbody = document.getElementById(tbodyId);
        const total = document.getElementById(totalId);

        tbody.innerHTML = "";

        if (!items || items.length === 0) {

            tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center">
                    No Records Found
                </td>
            </tr>
        `;

            total.textContent = "0";
            return;
        }

        let sum = 0;

        items.forEach(item => {

            sum += item.count;

            tbody.insertAdjacentHTML(
                "beforeend",
                `
            <tr>
                <td>${item.batch}</td>
                <td class="text-end">${item.count}</td>
            </tr>
            `
            );

        });

        total.textContent = sum;

    },

    async loadRoom3() {

        try {

            const data = await Api.get(
                Endpoints.strength.room3Status
            );

            this.renderRoom3Strength(data);

        } catch (e) {

            alert(e.message ?? "Unable to load Room 3.");

        }

    },

    renderRoom3Strength(data) {

        this.renderShift(
            data.firstShift,
            "room3Shift1Strength",
            "room3Shift1Total"
        );

        this.renderShift(
            data.secondShift,
            "room3Shift2Strength",
            "room3Shift2Total"
        );

        this.renderShift(
            data.thirdShift,
            "room3Shift3Strength",
            "room3Shift3Total"
        );

        this.renderShift(
            data.fourthShift,
            "room3Shift4Strength",
            "room3Shift4Total"
        );

    },

};