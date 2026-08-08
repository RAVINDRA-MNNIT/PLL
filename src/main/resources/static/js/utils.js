/**
 * utils.js
 * Common utility functions.
 */

/**
 * Redirect to login page.
 */
function redirectToLogin() {

    window.location.replace("/login.html");

}

/**
 * Escape HTML.
 */
function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;

}

/**
 * Format date as dd/MM/yyyy.
 */
function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const year =
        date.getFullYear();

    return `${day}/${month}/${year}`;

}

/**
 * Format amount.
 */
function formatCurrency(amount) {

    return Number(amount ?? 0)
        .toLocaleString("en-IN");

}

/**
 * GET request returning JSON.
 */
async function fetchJson(url) {

    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.json();

}

/**
 * GET request returning HTML.
 */
async function fetchHtml(url) {

    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.text();

}

/**
 * Convert HTML string to template.
 */
function createTemplate(html) {

    const template =
        document.createElement("template");

    template.innerHTML = html;

    template.content
        .querySelectorAll("script")
        .forEach(script => script.remove());

    return template;

}

/**
 * Load HTML into a container.
 */
async function loadHtmlView(
    containerId,
    url
) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    const html =
        await fetchHtml(url);

    if (!html) {
        return;
    }

    const template =
        createTemplate(html);

    container.replaceChildren(
        template.content.cloneNode(true)
    );

}