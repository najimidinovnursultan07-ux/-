/**
 * Менеджер тем оформления сайта
 */
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem("aura_theme") || "dark";
        document.documentElement.setAttribute("data-theme", savedTheme);
        this.updateIcon(savedTheme);
    },
    toggle() {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("aura_theme", next);
        this.updateIcon(next);
    },
    updateIcon(theme) {
        const btn = document.getElementById("theme-toggle");
        if (btn) {
            btn.innerHTML = theme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        }
    }
};