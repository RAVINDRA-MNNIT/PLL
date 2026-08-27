window.Session = {

    currentUser: null,

    async loadCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }
        try {
            this.currentUser = await Api.get(Endpoints.auth.currentUser);
            return this.currentUser;
        } catch (error) {
            console.error(
                "Unable to load current user.",
                error
            );
            alert(error.message || "Something went wrong.");
            this.currentUser = null;
            return null;
        }
    },

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

    redirectToLogin() {
        window.location.replace("/login.html");
    },

    requireRole(role) {
        if (this.getRole() !== role) {
            this.redirectToLogin();
            return false;
        }
        return true;
    },

    clear() {
        this.currentUser = null;
    },


    async logout(redirectUrl = "/login.html") {
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
            this.clear();
            window.location.replace(redirectUrl);
        }
    },
};