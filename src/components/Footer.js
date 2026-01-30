import DataManager from "../core/DataManager.js";

/**
 * Componente Footer
 * Cierre global de la aplicación con información de copyright, redes y descripción.
 */
export class Footer {
    constructor() {
        // Obtenemos todos los datos necesarios en una sola llamada
        this.data = DataManager.getFooterData();
        this.config = this.data.config || {};
        this.social = this.data.social || [];

        console.log(this.data);
    }

    render() {
        const currentYear = new Date().getFullYear();
        
        // Procesamos la frase del footer para reemplazar {corazon} por un icono
        const rawPhrase = this.config.fraseFooter || "Hecho con código";
        const processedPhrase = rawPhrase.replace(
            '{corazon}', 
            '<i class="fas fa-heart footer-heart"></i>'
        );

        return `
            <footer class="site-footer">
                <div class="footer-content">
                    
                    <div class="footer-col identity">
                        <h3 class="footer-logo">${this.config.nombre || 'César Perales'}</h3>
                        <p class="footer-desc">
                            ${this.config.descripcion || 'Developer & Educator'}
                        </p>
                    </div>

                    <div class="footer-col social">
                        <h4 class="footer-subtitle">CONECTEMOS</h4>
                        <div class="footer-social-links">
                            ${this.renderSocialLinks()}
                        </div>
                    </div>

                </div>

                <div class="footer-bottom">
                    <span class="copyright">
                        &copy; ${currentYear} ${this.config.copyright || 'César Perales'}
                    </span>
                    <span class="made-with">
                        ${processedPhrase}
                    </span>
                </div>
            </footer>
        `;
    }

    /**
     * Genera el HTML de los iconos sociales
     */
    renderSocialLinks() {
        if (!this.social.length) return '';

        return this.social.map(item => `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" 
               class="social-link" aria-label="${item.nombre}">
                <i class="${item.icono}"></i>
            </a>
        `).join('');
    }

    mount() {
        console.log('[Footer] Renderizado');
    }
}