import DataManager from "../core/DataManager.js";

export class Navbar {
    render() {
        const config = DataManager.getNavbarConfig();
        
        const links = config.links || [];
        const logoText = config.logoText || "CP";

        
        const linksHTML = links.map(link => `
            <span class="nav-item" data-path="${link.path}" data-id="${link.id}">
                ${link.text.toUpperCase()}
            </span>
        `).join('');

        return `
            <nav>
                <div class="logo">${logoText}</div>
                <div class="nav-links">
                    ${linksHTML}
                </div>
            </nav>
        `;
    }

    mount() {
        const navItems = document.querySelectorAll('.nav-links span');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const path = item.dataset.path;
                const id = item.dataset.id;

                console.log(`[Navbar] Click en ${id} -> ${path}`);

                if (path.startsWith('#')) {
                    const targetId = path.substring(1); // quitamos el #
                    const element = document.getElementById(targetId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                } 
                else {
                    window.location.href = path;
                }
            });
        });

        console.log('[Navbar] Montado y Data Bound');
    }
}