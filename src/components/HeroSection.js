import DataManager from "../core/DataManager.js";

export class HeroSection {
    constructor() {
        this.personal = DataManager.getPersonal();
        this.socialLinks = DataManager.getSocial();
    }

    /**
     * Parte 1: El Texto (Se quedará Fixed y se moverá)
     */
    renderText() {
        const socialHTML = this.socialLinks.map(link => `
            <a href="${link.url}" target="_blank" class="social-icon" aria-label="${link.nombre}">
                <i class="${link.icono}"></i>
            </a>
        `).join('');

        return `
            <div class="hero-text" id="sticky-hero-text">
                <div class="logo-icon">
                    <img src="assets/images/favicon.png" alt="Logo Icon" />
                </div>
                
                <div class="hero-name">
                    <h1>${this.personal.nombres[0]}<br>${this.personal.nombres[1] || ''}</h1>
                    
                    <h2>${this.personal.tagline.toUpperCase()}</h2>
                    
                    <div id="dynamic-text-container" class="dynamic-text"></div>

                    <div class="hero-socials">
                        ${socialHTML}
                    </div>

                    <div class="hero-actions">
                        <a href="#contacto" class="btn btn-primary">Contáctame</a>
                        <button id="btn-download-cv" class="btn btn-outline">Descargar CV</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Parte 2: La Imagen (Se quedará en la primera sección)
     */
    renderProfile() {
        return `
            <div class="profile-container" id="profile">
                <img src="${this.personal.fotoPerfil}" alt="${this.personal.nombres[0]}" class="profile-img">
            </div>
            <div class="scroll-indicator">↓</div>
        `;
    }

    /**
     * Mantenemos el render() clásico por si acaso, pero MainLayout usará los de arriba
     */
    render() {
        return `
            <div class="ui-layer hero-section">
                ${this.renderText()}
                ${this.renderProfile()}
            </div>
        `;
    }

    mount() {
        // Lógica de Parallax de la foto (Solo si existe en el DOM)
        const profile = document.getElementById('profile');
        if (profile) {
            document.addEventListener('mousemove', (e) => {
                const x = (window.innerWidth / 2 - e.clientX) / 40;
                const y = (window.innerHeight / 2 - e.clientY) / 40;
                profile.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
        console.log('[HeroSection] Montado logicamente');
    }
}