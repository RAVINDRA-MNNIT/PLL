
window.Session = {
    // =========================================================
    // CURRENT USER
    // =========================================================
    currentUser: JSON.parse(localStorage.getItem("currentUser") || "null"),

    // =========================================================
    // LOAD CURRENT USER
    // No API call required
    // =========================================================
    async loadCurrentUser() {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
            this.clear();
            return null;
        }
        if (!this.currentUser) {
            try {
                this.currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
            } catch (error) {
                console.error("Invalid stored user data.", error);
                this.clear();
                return null;
            }
        }
        return this.currentUser;
    },

    // =========================================================
    // GET USER
    // =========================================================
    getUser() {
        return this.currentUser;
    },

    getUserId() {
        return this.currentUser?.id;
    },

    getUserName() {
        return this.currentUser?.fullName;
    },

    getRole() {
        return this.currentUser?.role;
    },

    getSuperAdmin() {
        return this.currentUser?.superAdmin;
    },

    // =========================================================
    // ROLE CHECKS
    // =========================================================
    isAdmin() {
        return this.currentUser?.role === "ADMIN";
    },

    isStudent() {
        return this.currentUser?.role === "STUDENT";
    },

    isManager() {
        return this.currentUser?.role === "MANAGER";
    },

    hasRole(role) {
        return this.currentUser?.role === role;
    },

    // =========================================================
    // REDIRECT TO LOGIN
    // =========================================================
    redirectToLogin() {
        const redirectionUrl = this.getRedirectionUrl()
        this.clear();
        if (!window.location.pathname.endsWith(redirectionUrl)) {
            window.location.replace(redirectionUrl);
        }
    },

    // =========================================================
    // REQUIRE ROLE
    // =========================================================
    requireRole(role) {
        if (this.getRole() !== role) {
            this.redirectToLogin();
            return false;
        }
        return true;
    },

    // =========================================================
    // CLEAR SESSION
    // =========================================================
    clear() {
        this.currentUser = null;
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("currentUser");
    },

    // =========================================================
    // LOGOUT
    // =========================================================
    async logout() {
        window.libraryLookups = {
            qualifications: [],
            batches: [],
            preparations: [],
            seats: [],
            loaded: false
        };

        try {
            await Api.postWithoutResponse(Endpoints.auth.logout);
        } catch (error) {
            console.error("Logout failed.", error);
        } finally {
            this.redirectToLogin();
        }
    },

    getRedirectionUrl() {
        return Session.isStudent() ? "/student.html" : "/login.html"
    }
};
