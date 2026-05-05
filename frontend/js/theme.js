const THEME = {
    init() {
        const savedTheme = localStorage.getItem('mongo_academy_theme') || 'dark';
        this.apply(savedTheme);
        
        // Add toggle to body if not present
        if (!document.querySelector('.theme-toggle')) {
            const btn = document.createElement('button');
            btn.className = 'theme-toggle';
            btn.innerHTML = savedTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            btn.onclick = () => this.toggle();
            document.body.appendChild(btn);
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.apply(next);
    },

    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mongo_academy_theme', theme);
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => THEME.init());
