window.Endpoints = {

    // ================= AUTH =================
    auth: {
        currentUser: "/api/auth/me",
        logout: "/api/auth/logout",
        studentlogin: "/api/auth/student/login"
    },

    // ================= STUDENTS =================
    students: {
        list: "/api/students",
        details(studentId) {
            return `/api/students/${studentId}`;
        },

        fees(studentId) {
            return `/api/students/${studentId}/fees`;
        },

        changeSeat(studentId) {
            return `/api/students/${studentId}/seat`;
        },
    },

    // ================= PENDING (UNIFIED SYSTEM) =================
     pending: {
         collectionSummary: "/api/pending/collection-summary",

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
        qualifications: "/api/lookups/qualifications",
        batches: "/api/lookups/batches",
        preparations: "/api/lookups/preparations",
        seats: "/api/lookups/seats"
    }
};