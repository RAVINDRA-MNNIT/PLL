
window.Session = {

    // =========================================================
    // CURRENT USER
    // =========================================================

    currentUser: JSON.parse(
        localStorage.getItem("currentUser") || "null"
    ),


    // =========================================================
    // LOAD CURRENT USER
    // No API call required
    // =========================================================

    async loadCurrentUser() {
        // Check JWT availability
        const token = localStorage.getItem("jwtToken");

        if (!token) {
            this.clear();
            return null;
        }

        // Restore user from localStorage if needed
        if (!this.currentUser) {
            try {
                this.currentUser = JSON.parse(
                    localStorage.getItem("currentUser") || "null"
                );
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
        window.location.replace("/login.html");
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

        // Clear in-memory user
        this.currentUser = null;

        // Clear JWT
        localStorage.removeItem("jwtToken");

        // Clear stored user
        localStorage.removeItem("currentUser");
    },


    // =========================================================
    // LOGOUT
    // =========================================================

    async logout(redirectUrl = "/login.html") {

        // Clear application-level cached lookup data
        window.libraryLookups = {
            qualifications: [],
            batches: [],
            preparations: [],
            seats: [],
            loaded: false
        };

        try {

            // Tell backend to logout
            await Api.postWithoutResponse(
                Endpoints.auth.logout
            );

        } catch (error) {

            console.error("Logout failed.", error);

        } finally {

            // Always clear local authentication
            this.clear();

            // Redirect to login
            window.location.replace(redirectUrl);
        }
    }
};
