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
                
                <div class="hamburger">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>

                <div class="nav-links">
                    ${linksHTML}
                </div>
            </nav>
        `;
    }

    mount() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        const navItems = document.querySelectorAll('.nav-links span');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
                // NOTA: Ya no bloqueamos el scroll del body
            });
        }

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                
                // Cerrar menú al hacer click
                if (hamburger && navLinks) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }

                // Navegación
                if (path.startsWith('#') || path.startsWith('/#')) {
                    const targetId = path.includes('#') ? path.split('#')[1] : path;
                    const element = document.getElementById(targetId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        window.location.href = path;
                    }
                } else {
                    window.location.href = path;
                }
            });
        });
        console.log('[Navbar] Montado');
    }
}