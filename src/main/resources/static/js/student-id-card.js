const StudentIdCard = {
    timerInterval: null,
    timerEndTime: null,

    async open(student) {
        if (!student) {
            return;
        }
        let section = document.getElementById("studentIdSection");
        if (!section) {
            const loaded = await this.load();
            if (!loaded) {
                return;
            }
            section = document.getElementById("studentIdSection");
        }
        if (!section) {
            console.error("studentIdSection not found after loading.");
            return;
        }
        this.render(student);
        section.style.display = "flex";
        this.startTimer();
    },

    async load() {
        try {
            const response = await fetch(`/student-id-card.html?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`Failed to load student-id-card.html: ${response.status}`);
            }
            const html = await response.text();
            if (!html.trim()) {
                console.error("student-id-card.html is empty.");
                return false;
            }
            const container = document.createElement("div");
            container.innerHTML = html.trim();
            const section = container.querySelector("#studentIdSection");
            if (!section) {
                console.error("studentIdSection not found inside student-id-card.html.");
                return false;
            }
            document.body.appendChild(section);
            return true;
        } catch (error) {
            console.error("Failed to load student ID card:", error);
            return false;
        }
    },

    close() {
        this.stopTimer();
        const section = document.getElementById("studentIdSection");
        if (section) {
            section.style.display = "none";
        }
    },

    startTimer() {
        this.stopTimer();
        const timer = document.getElementById("idCardTimer");
        const timerValue = document.getElementById("idCardTimerValue");
        if (!timer || !timerValue) {
            console.error("ID card timer elements not found.");
            return;
        }

        timer.classList.remove("expired");
        this.timerEndTime = Date.now() + (10 * 60 * 1000);
        this.updateTimer();
        this.timerInterval = setInterval(() => {this.updateTimer();}, 1000);
    },

    updateTimer() {
        const timer = document.getElementById("idCardTimer");
        const timerValue = document.getElementById("idCardTimerValue");
        if (!timer || !timerValue || !this.timerEndTime) {
            return;
        }

        const remaining = Math.max(0, this.timerEndTime - Date.now());
        const totalSeconds = Math.ceil(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (remaining <= 0) {
            timer.classList.add("expired");
            timerValue.textContent = "EXPIRED";
            this.stopTimer();
            return;
        }
        timerValue.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerEndTime = null;
    },

    render(student) {
        if (!student) {return;}
        const lastFee = student.lastFee ?? {};
        const configurations = getConfigurations();
        this.setValue("idCardLibraryName", configurations?.LIBRARY_NAME ?? "-");
        this.setValue("idCardLibraryNameFooter", configurations?.LIBRARY_NAME ?? "-");
        this.setValue("idCardStudentName", student.fullName ?? "-");
        this.setValue("idCardStudentId", student.studentId ?? "-");
        this.setValue("idCardBatch", lastFee.batchName ?? "-");
        this.setValue("idCardSeat", lastFee.seatNumber ?? "-");
        this.setValue("idCardTillDate", lastFee.tillDate ? formatDate(lastFee.tillDate) : "-");
        const mobile = Session.isStudent() ? formatHiddenMobileNumber(student.mobileNumber) : student.mobileNumber;
        this.setValue("idCardMobile", mobile ?? "-");
        const status = String(student.enrollmentStatus ?? "-").toUpperCase();
        const statusElement = document.getElementById("idCardStatus");
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `id-card-status ${status.toLowerCase()}`;
        }
        this.renderIssues(student);
    },

    setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? "-";
        }
    },

    renderIssues(student) {
        const summary = document.getElementById("issuesSummary");
        const list = document.getElementById("studentIssuesList");
        if (!summary || !list) {
            return;
        }
        const issues = [];
        const lastFee = student.lastFee ?? {};
        const status = String(student.enrollmentStatus ?? "").toUpperCase();
        if (status !== "ACTIVE") {
            issues.push({
                title: "Status",
                value: status || "-"
            });
        }

        if (lastFee.tillDate) {
            const tillDate = new Date(lastFee.tillDate);
            const today = new Date();
            tillDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const difference = today.getTime() - tillDate.getTime();
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            if (days > 0) {
                issues.push({
                    title: "Last Date",
                    value: formatDate(lastFee.tillDate),
                    subtext: `${days} day${days === 1 ? "" : "s"} ago`
                });
            }
        }
        const batchIssue = getBatchTimingIssue(student);
        if (batchIssue) {
            issues.push({
                title: "Batch Timing",
                value: batchIssue
            });
        }
        const pendingAmount = Number(lastFee.pendingAmount ?? 0);
        if (pendingAmount > 0) {
            issues.push({
                title: "Pending Fees",
                value: `₹${pendingAmount.toLocaleString("en-IN")}`
            });
        }

        if (!issues.length) {
            summary.className = "issues-summary good";
            summary.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                All Good
            `;
            list.innerHTML = "";
            return;
        }
        summary.className = "issues-summary warning";
        summary.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            Something Wrong
        `;

        list.innerHTML =
            issues.map(
                (issue, index) => `
                    <div class="issue-item warning">
                        <strong>
                            ${index + 1}. ${escape(issue.title)}:
                        </strong>
                        ${escape(issue.value)}
                        ${issue.subtext ? `
                            <span class="issue-subtext">
                                ${escape(issue.subtext)}
                            </span>
                                ` : ""
                         }
                    </div>
                `
            ).join("");
    },
};