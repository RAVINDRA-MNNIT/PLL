window.Api = {

    async request(url, options = {}) {
        try {
            window.Loader.start(); // ✅ START LOADER
            const response = await fetch(url, {
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },
                ...options
            });
            if (!response.ok) {

                let message = "Something went wrong.";

                try {
                    const error = await response.json();
                    message = error.message || message;
                } catch {
                    message = await response.text() || message;
                }
                switch (response.status) {

                    case 400:
                        alert(message);
                        break;

                    case 401:
                        alert("Your session has expired. Please login again.");
                        redirectToLogin();
                        break;

                    case 403:
                        alert("You are not authorized to perform this action.");
                        break;

                    case 404:
                        alert("Requested resource was not found.");
                        break;

                    case 500:
                        alert("Internal server error. Please try again.");
                        break;

                    default:
                        alert(message);
                }

                throw new Error(message);
            }

            const contentType = response.headers.get("content-type");

            if (contentType?.includes("application/json")) {
                return await response.json();
            }

            return await response.text();

        } catch (error) {

            if (!navigator.onLine) {
                alert("No internet connection.");
            } else if (error) {
                alert(error.message || "Something went wrong.");
            } else {
                alert("Unable to connect to the server.");
            }

            throw error;
        } finally {
            window.Loader.stop(); // ✅ STOP LOADER (ALWAYS)
        }
    },

    get(url) {
        return this.request(url, { method: "GET" });
    },

    post(url, body) {
        return this.request(url, {
            method: "POST",
            body: JSON.stringify(body)
        });
    },

    put(url, body) {
        return this.request(url, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    },

    patch(url, body) {
        return this.request(url, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },

    delete(url) {
        return this.request(url, {
            method: "DELETE"
        });
    },

    postWithoutResponse(url) {
        return this.request(url, {
            method: "POST"
        });
    }
};