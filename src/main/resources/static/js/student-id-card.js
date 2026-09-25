const StudentIdCard = {
    timerInterval: null,
    timerEndTime: null,

    async open(student) {
        if (!student) {
            return;
        }

        let section =
            document.getElementById("studentIdSection");

        if (!section) {
            const loaded = await this.load();

            if (!loaded) {
                return;
            }

            section =
                document.getElementById("studentIdSection");
        }

        if (!section) {
            console.error(
                "studentIdSection not found after loading."
            );
            return;
        }

        this.render(student);

        section.style.display = "flex";

        this.startTimer();
    },

    async load() {
        try {
            const response = await fetch(
                `/student-id-card.html?t=${Date.now()}`
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load student-id-card.html: ${response.status}`
                );
            }

            const html = await response.text();

            if (!html.trim()) {
                console.error("student-id-card.html is empty.");
                return false;
            }

            const container = document.createElement("div");
            container.innerHTML = html.trim();

            const section =
                container.querySelector("#studentIdSection");

            if (!section) {
                console.error(
                    "studentIdSection not found inside student-id-card.html."
                );
                return false;
            }

            document.body.appendChild(section);

            return true;
        } catch (error) {
            console.error(
                "Failed to load student ID card:",
                error
            );

            return false;
        }
    },

    close() {
        this.stopTimer();

        const section =
            document.getElementById(
                "studentIdSection"
            );

        if (section) {
            section.style.display = "none";
        }
    },

    startTimer() {
        this.stopTimer();

        const timer =
            document.getElementById(
                "idCardTimer"
            );

        const timerValue =
            document.getElementById(
                "idCardTimerValue"
            );

        if (!timer || !timerValue) {
            console.error(
                "ID card timer elements not found."
            );
            return;
        }

        timer.classList.remove(
            "expired"
        );

        this.timerEndTime =
            Date.now() +
            (10 * 60 * 1000);

        this.updateTimer();

        this.timerInterval =
            setInterval(() => {
                this.updateTimer();
            }, 1000);
    },

    updateTimer() {
        const timer =
            document.getElementById(
                "idCardTimer"
            );

        const timerValue =
            document.getElementById(
                "idCardTimerValue"
            );

        if (
            !timer ||
            !timerValue ||
            !this.timerEndTime
        ) {
            return;
        }

        const remaining =
            Math.max(
                0,
                this.timerEndTime -
                Date.now()
            );

        const totalSeconds =
            Math.ceil(
                remaining / 1000
            );

        const minutes =
            Math.floor(
                totalSeconds / 60
            );

        const seconds =
            totalSeconds % 60;

        if (remaining <= 0) {
            timer.classList.add(
                "expired"
            );

            timerValue.textContent =
                "EXPIRED";

            this.stopTimer();

            return;
        }

        timerValue.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(
                this.timerInterval
            );

            this.timerInterval = null;
        }

        this.timerEndTime = null;
    },

    render(student) {
        if (!student) {
            return;
        }

        const lastFee =
            student.lastFee ?? {};

        const configurations =
            getConfigurations();

        this.setValue(
            "idCardLibraryName",
            configurations?.LIBRARY_NAME ?? "-"
        );

        this.setValue(
            "idCardLibraryNameFooter",
            configurations?.LIBRARY_NAME ?? "-"
        );

        this.setValue(
            "idCardStudentName",
            student.fullName ?? "-"
        );

        this.setValue(
            "idCardStudentId",
            student.studentId ?? "-"
        );

        this.setValue(
            "idCardBatch",
            lastFee.batchName ?? "-"
        );

        this.setValue(
            "idCardSeat",
            lastFee.seatNumber ?? "-"
        );

        this.setValue(
            "idCardTillDate",
            lastFee.tillDate
                ? formatDate(lastFee.tillDate)
                : "-"
        );

        const mobile =
            Session.isStudent()
                ? formatHiddenMobileNumber(
                    student.mobileNumber
                )
                : student.mobileNumber;

        this.setValue(
            "idCardMobile",
            mobile ?? "-"
        );

        const status =
            String(
                student.enrollmentStatus ?? "-"
            ).toUpperCase();

        const statusElement =
            document.getElementById(
                "idCardStatus"
            );

        if (statusElement) {
            statusElement.textContent =
                status;

            statusElement.className =
                `id-card-status ${status.toLowerCase()}`;
        }

        this.renderIssues(student);
    },

    setValue(id, value) {
        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                value ?? "-";
        }
    },

    renderIssues(student) {
        const summary =
            document.getElementById(
                "issuesSummary"
            );

        const list =
            document.getElementById(
                "studentIssuesList"
            );

        if (!summary || !list) {
            return;
        }

        const issues = [];

        const lastFee =
            student.lastFee ?? {};

        const status =
            String(
                student.enrollmentStatus ?? ""
            ).toUpperCase();

        if (status !== "ACTIVE") {
            issues.push({
                title: "Status",
                value: status || "-"
            });
        }

        if (lastFee.tillDate) {
            const tillDate =
                new Date(
                    lastFee.tillDate
                );

            const today =
                new Date();

            tillDate.setHours(
                0,
                0,
                0,
                0
            );

            today.setHours(
                0,
                0,
                0,
                0
            );

            const difference =
                today.getTime() -
                tillDate.getTime();

            const days =
                Math.floor(
                    difference /
                    (1000 * 60 * 60 * 24)
                );

            if (days > 0) {
                issues.push({
                    title: "Last Date",
                    value:
                        formatDate(
                            lastFee.tillDate
                        ),
                    subtext:
                        `${days} day${days === 1 ? "" : "s"} ago`
                });
            }
        }

        const batchIssue =
            this.getBatchTimingIssue(
                student
            );

        if (batchIssue) {
            issues.push({
                title: "Batch Timing",
                value: batchIssue
            });
        }

        const pendingAmount =
            Number(
                lastFee.pendingAmount ?? 0
            );

        if (pendingAmount > 0) {
            issues.push({
                title: "Pending Fees",
                value:
                    `₹${pendingAmount.toLocaleString("en-IN")}`
            });
        }

        if (!issues.length) {
            summary.className =
                "issues-summary good";

            summary.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                All Good
            `;

            list.innerHTML = "";

            return;
        }

        summary.className =
            "issues-summary warning";

        summary.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            Something Wrong
        `;

        list.innerHTML =
            issues.map(
                (issue, index) => `
                    <div class="issue-item warning">
                        <strong>
                            ${index + 1}. ${this.escape(issue.title)}:
                        </strong>
                        ${this.escape(issue.value)}
                        ${
                    issue.subtext
                        ? `
                                    <span class="issue-subtext">
                                        ${this.escape(issue.subtext)}
                                    </span>
                                `
                        : ""
                }
                    </div>
                `
            ).join("");
    },

    parseBatchTimings(timing) {
        if (!timing) {
            return [];
        }

        return timing
            .split(",")
            .map(range => {
                const parts =
                    range
                        .trim()
                        .split(
                            /\s*[–-]\s*/
                        );

                if (parts.length !== 2) {
                    return null;
                }

                return {
                    start:
                        parts[0].trim(),
                    end:
                        parts[1].trim()
                };
            })
            .filter(Boolean);
    },

    timeToMinutes(time) {
        if (!time) {
            return null;
        }

        const match =
            time
                .trim()
                .match(
                    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
                );

        if (!match) {
            return null;
        }

        let hours =
            Number(match[1]);

        const minutes =
            Number(match[2]);

        const period =
            match[3].toUpperCase();

        if (
            hours < 1 ||
            hours > 12 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        if (period === "AM") {
            if (hours === 12) {
                hours = 0;
            }
        } else {
            if (hours !== 12) {
                hours += 12;
            }
        }

        return (
            hours * 60 +
            minutes
        );
    },

    isWithinBatchTiming(
        timing,
        currentTime = new Date()
    ) {
        const timings =
            this.parseBatchTimings(
                timing
            );

        if (!timings.length) {
            return false;
        }

        const currentMinutes =
            currentTime.getHours() * 60 +
            currentTime.getMinutes();

        return timings.some(
            ({ start, end }) => {
                const startMinutes =
                    this.timeToMinutes(
                        start
                    );

                const endMinutes =
                    this.timeToMinutes(
                        end
                    );

                if (
                    startMinutes === null ||
                    endMinutes === null
                ) {
                    return false;
                }

                if (
                    startMinutes <=
                    endMinutes
                ) {
                    return (
                        currentMinutes >=
                        startMinutes &&
                        currentMinutes <=
                        endMinutes
                    );
                }

                return (
                    currentMinutes >=
                    startMinutes ||
                    currentMinutes <=
                    endMinutes
                );
            }
        );
    },

    getBatchTimingIssue(student) {
        const batchAlias =
            String(
                student.lastFee?.batchAlias ?? ""
            ).trim();

        if (!batchAlias) {
            return null;
        }

        if (
            !this.isWithinBatchTiming(
                batchAlias
            )
        ) {
            return batchAlias;
        }

        return null;
    },

    escape(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }
};