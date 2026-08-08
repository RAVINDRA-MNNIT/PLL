window.Loader = {
    active: 0,

    show() {
        const el = document.getElementById("global-loader");
        if (el) el.style.display = "flex";
    },

    hide() {
        const el = document.getElementById("global-loader");
        if (el) el.style.display = "none";
    },

    start() {
        this.active++;
        this.show();
    },

    stop() {
        if (this.active > 0) this.active--;
        if (this.active === 0) this.hide();
    }
};