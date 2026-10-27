window.Api = {

    // =========================================================
    // COMMON REQUEST
    // =========================================================

    async request(url, options = {}) {
debugger;
        try {

            window.Loader.start();

            // -------------------------------------------------
            // GET JWT TOKEN
            // -------------------------------------------------
debugger;
            const token = localStorage.getItem("jwtToken");

            // -------------------------------------------------
            // HEADERS
            // -------------------------------------------------

            const headers = {
                "Content-Type": "application/json",
                ...(options.headers || {})
            };

            // -------------------------------------------------
            // ADD JWT AUTOMATICALLY
            // -------------------------------------------------

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            // -------------------------------------------------
            // SEND REQUEST
            // -------------------------------------------------
            console.log("API URL =", url);
            console.log("JWT =", token);
            console.log("AUTHORIZATION =", headers["Authorization"]);
            const response = await fetch(url, {
                credentials: "same-origin",
                ...options,
                headers
            });
            debugger;

            // =================================================
            // UNAUTHORIZED
            // =================================================

            if (response.status === 401) {

                localStorage.removeItem("jwtToken");
                localStorage.removeItem("currentUser");

                // Clear frontend session if available
                if (window.Session) {
                    window.Session.clear();
                }

                // Don't redirect if already on login page
                if (!window.location.pathname.endsWith("/login.html")) {

                    window.location.replace("/login.html");

                }

                throw new Error(
                    "Your session has expired. Please login again."
                );
            }

            // =================================================
            // OTHER HTTP ERRORS
            // =================================================

            if (!response.ok) {

                let message = "Something went wrong.";

                const body = await response.text();

                try {

                    const error = JSON.parse(body);

                    message = error.message || message;

                } catch {

                    message = body || message;
                }

                throw new Error(message);
            }

            // =================================================
            // RESPONSE
            // =================================================

            const contentType =
                response.headers.get("content-type");

            if (contentType?.includes("application/json")) {

                return await response.json();

            }

            return await response.text();

        } catch (error) {

            console.error("API Error:", error);

            // -------------------------------------------------
            // NETWORK ERROR
            // -------------------------------------------------

            if (!navigator.onLine) {

                alert("No internet connection.");

            } else if (error?.message) {

                // Don't show duplicate alert when 401
                // already redirected the user.

                if (
                    !error.message.includes(
                        "session has expired"
                    )
                ) {

                    alert(error.message);
                }

            } else {

                alert(
                    "Unable to connect to the server."
                );
            }

            throw error;

        } finally {

            window.Loader.stop();

        }
    },


    // =========================================================
    // GET
    // =========================================================

    get(url) {

        return this.request(url, {
            method: "GET"
        });
    },


    // =========================================================
    // POST
    // =========================================================

    post(url, body) {

        return this.request(url, {
            method: "POST",
            body: JSON.stringify(body)
        });
    },


    // =========================================================
    // PUT
    // =========================================================

    put(url, body) {

        return this.request(url, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    },


    // =========================================================
    // PATCH
    // =========================================================

    patch(url, body) {

        return this.request(url, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },


    // =========================================================
    // DELETE
    // =========================================================

    delete(url) {

        return this.request(url, {
            method: "DELETE"
        });
    },


    // =========================================================
    // POST WITHOUT RESPONSE BODY
    // =========================================================

    postWithoutResponse(url) {

        return this.request(url, {
            method: "POST"
        });
    }
};