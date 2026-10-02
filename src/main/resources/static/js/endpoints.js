window.Endpoints = {

    // ================= AUTH =================
    auth: {
        currentUser: "/api/auth/me",
        logout: "/api/auth/logout",
        studentLogin: "/api/auth/student/login"
    },

    // ================= STUDENTS =================
    students: {
        list(
            searchBy,
            searchKey,
            batch,
            enrollmentStatus,
            pendingFees = false,
            discount = false,
            page = 0,
            size = 20
        ) {
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
            if (pendingFees) {
                params.append("pendingFees", "true");
            }
            if (discount) {
                params.append("discount", "true");
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
        addWarning: "/api/students/addwarning",
        addComplaint: "/api/students/addcomplaint",
        deleteStudentWarning(warningId) {
            return `/api/students/deletewarning/${warningId}`;
        },
        deleteStudentComplaint(complaintId) {
            return `/api/students/deletecomplaint/${complaintId}`;
        },
        getAllComplaints: "/api/students/getallcomplaints",

        getAllWarnings: "/api/students/getallwarnings",
        resolveComplaint(complaintId) {
            return `/api/students/resolvecomplaint/${complaintId}`;
        },
    },

    // ================= PENDING (UNIFIED SYSTEM) =================
     pending: {
         collectionSummary: "/api/pending/collection-summary",
         pendingCount: "/api/pending/count",

        listByType(type) {
            return `/api/pending?type=${type}`;
        },

        nonPending: `/api/nonpending`,
    },

    // ================= Strength =================
    strength: {
        overall: "/api/students/strength/overall",
        fullDayStatus: "/api/students/strength/fullday",
        room1Status: "/api/students/strength/room1",
        room2Status: "/api/students/strength/room2",
        room3Status: "/api/students/strength/room3",
    },

    admin: {
        admissionRequest: `/api/admin/admission`,
        updateFeeRequest: `/api/admin/updatefee`,

        updateStudent: `/api/admin/updatestudent/DETAILS`,
        updateSeat: `/api/admin/updatestudent/SEAT`,
        updateEnrollmentStatus: `/api/admin/updatestudent/ENROLLMENT`,
        updateStudentBatch: `/api/admin/updatestudent/BATCH`,
        clearPendingRequest: `/api/admin/updatestudent/PENDING_FEES`,
        updateStudentDiscount: `/api/admin/updatestudent/DISCOUNT`,

        rejectRequest: `/api/admin/pending/reject`,
        approveRequest: `/api/admin/pending/approve`,
        saveExpense: `/api/admin/expense/save`,
        getExpense(month) {
            return `/api/admin/expense?month=${month}`;
        },
        approveExpense: `/api/admin/expense/approve`,
        rejectExpense: `/api/admin/expense/reject`,
        getDailyIncome(month) {
            return `/api/admin/income/daily?month=${month}`;
        },
        getMonthlyIncome(month) {
            return `/api/admin/income/monthly?month=${month}`
        },
        getProfit(month) {
            return `/api/admin/profit/summary?month=${month}`;
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
        createBatch: `/api/admin/batch/create`,
        deleteBatch(id, replaceWithBatchId) {
            return `/api/admin/batch/delete/${id}?replaceWithBatchId=${encodeURIComponent(replaceWithBatchId)}`;
        },
        updateBatch(id) {
            return `/api/admin/batch/update/${id}`;
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