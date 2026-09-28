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
                const body = await response.text();
                try {
                    const error = JSON.parse(body);
                    message = error.message || message;
                } catch {
                    message = body || message;
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