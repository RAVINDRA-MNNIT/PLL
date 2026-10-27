window.Session = {

    currentUser: null,


    // =========================================================
    // LOAD CURRENT USER
    // =========================================================

    async loadCurrentUser() {
        debugger;
        if (this.currentUser) {
            return this.currentUser;
        }
        debugger;
        try {

            this.currentUser =
                await Api.get(Endpoints.auth.currentUser);
            debugger;
            return this.currentUser;

        } catch (error) {
            debugger;
            console.error(
                "Unable to load current user.",
                error
            );

            this.currentUser = null;

            return null;
        }
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

            console.error(
                "Logout failed.",
                error
            );

        } finally {

            // Always clear local authentication
            this.clear();

            // Redirect to login
            window.location.replace(redirectUrl);
        }
    }
};