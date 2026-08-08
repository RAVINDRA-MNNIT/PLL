window.Endpoints = {

    // ================= AUTH =================
    auth: {
        currentUser: "/api/auth/me",
        logout: "/api/auth/logout"
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

        update(studentId) {
            return `/api/students/${studentId}`;
        },

        changeSeat(studentId) {
            return `/api/students/${studentId}/seat`;
        },

        updateEnrollmentStatus(studentId) {
            return `/api/students/${studentId}/enrollment-status`;
        }
    },

    // ================= PENDING (UNIFIED SYSTEM) =================
     pending: {

        listByType(type) {
            return `/api/pending?type=${type}`;
        },

        all() {
            return `/api/pending`;
        },

        // ✅ FIX NAME (important)
        collectionSummary: "/api/pending/collection-summary",

        get(requestId) {
            return `/api/pending/${requestId}`;
        },

        approve(requestId) {
            return `/api/pending/${requestId}/approve`;
        },

        reject(requestId) {
            return `/api/pending/${requestId}/reject`;
        },

        cancel(requestId) {
            return `/api/pending/${requestId}/cancel`;
        },

        update(requestId) {
            return `/api/pending/${requestId}`;
        },

        clear() {
            return `/api/pending/clear`;
        },

        // 🔹 Update student details
        updateStudent(studentId) {
            return `/api/pending/updatedetail/${studentId}/DETAILS`;
        },

        // 🔹 Update seat
        updateSeat(studentId) {
            return `/api/pending/updatedetail/${studentId}/SEAT`;
        },

        // 🔹 Update enrollment status
        updateEnrollmentStatus(studentId) {
            return `/api/pending/updatedetail/${studentId}/ENROLLMENT`;
        }
    },

    // ================= LOOKUPS =================
    lookup: {
        qualifications: "/api/lookups/qualifications",
        batches: "/api/lookups/batches",
        preparations: "/api/lookups/preparations",
        seats: "/api/lookups/seats"
    }
};