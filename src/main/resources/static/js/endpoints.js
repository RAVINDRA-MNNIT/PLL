window.Endpoints = {

    // ================= AUTH =================
    auth: {
        currentUser: "/api/auth/me",
        logout: "/api/auth/logout",
        studentlogin: "/api/auth/student/login"
    },

    // ================= STUDENTS =================
    students: {
        list(searchBy, searchKey, batch, enrollmentStatus, page = 0, size = 20) {
            const params = new URLSearchParams();
            if (searchBy) {
                params.append("searchBy", searchBy);
            }
            if (searchKey) {
                params.append("searchKey", searchKey);
            }
            if (batch) {
                params.append("batchId", batch);
            }
            if (enrollmentStatus) {
                params.append("enrollmentStatus", enrollmentStatus);
            }
            params.append("page", page);
            params.append("size", size);
            return `/api/students?${params.toString()}`;
        },

        details(studentId) {
            return `/api/students/${studentId}`;
        },

        feeHistory(studentId) {
            return `/api/students/feeHistory/${studentId}`;
        },
    },

    // ================= PENDING (UNIFIED SYSTEM) =================
     pending: {
         collectionSummary: "/api/pending/collection-summary",
         pendingCount: "/api/pending/count",

        listByType(type) {
            return `/api/pending?type=${type}`;
        },

        nonPending() {
            return `/api/nonpending`;
        },

        update(requestId) {
            return `/api/manager/pending/${requestId}`;
        },
    },

    admin: {
        admissionRequest: `/api/admin/admission`,
        updateFeeRequest: `/api/admin/updatefee`,
        updateStudent: `/api/admin/updatestudent/DETAILS`,
        updateSeat: `/api/admin/updatestudent/SEAT`,
        updateEnrollmentStatus: `/api/admin/updatestudent/ENROLLMENT`,
        rejectRequest: `/api/admin/pending/reject`,
        approveRequest: `/api/admin/pending/approve`,
        saveExpense: `/api/admin/expense/save`,
        getExpense: `/api/admin/expense/get`,
        approveExpense: `/api/admin/expense/approve`,
        rejectExpense: `/api/admin/expense/reject`,
        expenseAnalytics: `/api/admin/transactions/expense/dashboard`,
        getDailyIncome: `/api/admin/income/daily`,
        getMonthlyIncome(month) {
            return `/api/admin/income/monthly?month=${month}`
        },
        getProfit: `/api/admin/profit/summary`,


        clear() {
            return `/api/pending/clear`;
        },

        saveGeneralConfiguration: `/api/admin/configuration/general`,
        saveManagerConfiguration: `/api/admin/configuration/manager`,
        saveStudentConfiguration: `/api/admin/configuration/student`,

        addUser: `/api/users/addUser`,
        updateUser: `/api/users/updateUser`,
        getAllUsers(role) {
            return `/api/users/all/${role}`;
        },
        deleteUser(id) {
            return `/api/users/deleteUser/${id}`;
        },

        clearPendingApprovals: `/api/admin/pending-approvals`,
        clearFeeRecords: `/api/admin/fee-records/cleanup`,
        resetConfiguration: `/api/admin/configuration/reset`,
        resetSeats: `/api/admin/seats/reset`,
        clearTransactions(beforeDate) {
            return `/api/admin/transactions/cleanup?beforeDate=${beforeDate}`;
        },
    },

    manager: {
        createRequest(type) {
            return `/api/manager/approvalrequest/create/${type}`;
        },

        updateRequest() {
            return `/api/manager/approvalrequest/update`;
        },

        cancel() {
            return `/api/manager/approvalrequest/cancel`;
        },

        saveExpense: `/api/manager/expense/save`,
        getExpense: `/api/manager/expense/get`,
        cancelExpense: `/api/manager/expense/cancel`,
    },
    
    // ================= LOOKUPS =================
    lookups: {
        configurations: "/api/lookups/configurations",
        qualifications: "/api/lookups/qualifications",
        batches: "/api/lookups/batches",
        preparations: "/api/lookups/preparations",
        seats: "/api/lookups/seats"
    }
};