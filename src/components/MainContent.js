import { HeroSection } from "./HeroSection.js";
import { TestSection } from "./TestSection.js";
import DataManager from "../core/DataManager.js";

export class MainLayout {
    constructor() {
        this.heroSection = new HeroSection();
        this.testSection = new TestSection();
        this.narrativeConfig = DataManager.getScrollNarrative();
    }

    render() {
        return `
            <div class="app-container">
                <div class="ui-layer">
                    <div class="sticky-layer">
                        ${this.heroSection.renderText()}
                    </div>
                    <div class="scroll-container">
                        ${this.heroSection.renderProfile()}
                    </div>
                </div>

                <div class="scroll-container">
                    ${this.testSection.render()}
                </div>
            </div>
        `;
    }

    mount() {
        const components = [this.heroSection];
        components.forEach(comp => {
            if (typeof comp.mount === 'function') comp.mount();
        });

        this.setupControllLogic();
        console.log('[MainLayout] Montado en el DOM');
    }

    setupControllLogic() {
        // Elementos a manipular
        const stickyText = document.getElementById('sticky-hero-text');
        const container = document.getElementById('dynamic-text-container');
        
        // Elementos secundarios que deben desaparecer (Tagline y Socials)
        // Buscamos dentro de sticky-hero-text para ser específicos
        const heroTagline = stickyText.querySelector('h2'); 
        const heroSocials = stickyText.querySelector('.hero-socials'); 
        const heroActions = stickyText.querySelector('.hero-actions'); // Los botones también

        const introConfig = this.narrativeConfig[0];
        const aboutConfig = this.narrativeConfig[1];
        let currentRenderedId = null;

        const handleScroll = () => {
            if (window.innerWidth <= 1024) return;

            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const progress = scrollY / windowHeight;

            // 1. Efecto Parallax Vertical del Bloque Entero
            if (stickyText) {
                stickyText.style.transform = `translate3d(0, ${progress * 80}px, 0)`;
            }

            // 2. Desaparición Sutil de Elementos Secundarios (Tagline, Socials, Buttons)
            // Desaparecen entre el 5% y el 25% del scroll
            if (heroTagline && heroSocials && heroActions) {
                const fadeStart = 0.05;
                const fadeEnd = 0.35;
                
                let secondaryOpacity = 1;
                let compression = 1; // Escala vertical

                if (progress > fadeStart) {
                    const fadeProgress = Math.min(1, (progress - fadeStart) / (fadeEnd - fadeStart));
                    secondaryOpacity = 1 - fadeProgress;
                    compression = 1 - (fadeProgress * 0.2); // Se comprime un 20%
                }

                // Aplicar estilos
                const secondaryStyles = `
                    opacity: ${secondaryOpacity};
                    transform: scaleY(${compression});
                    transform-origin: top;
                    filter: blur(${ (1-secondaryOpacity) * 5 }px); /* Efecto desenfoque */
                    pointer-events: ${secondaryOpacity < 0.1 ? 'none' : 'auto'};
                `;

                heroTagline.style.cssText = secondaryStyles;
                heroSocials.style.cssText = secondaryStyles;
                heroActions.style.cssText = secondaryStyles;
            }

            // 3. Lógica Narrativa (Texto Dinámico)
            if (!container || !introConfig || !aboutConfig) return;

            // --- FASE 1: INTRO (Debe verse al inicio) ---
            if (progress < aboutConfig.start) {
                this.renderSegment(container, introConfig, progress, true); // true = es la intro (fade out)
            } 
            // --- FASE 2: ABOUT (Aparece después) ---
            else {
                this.renderSegment(container, aboutConfig, progress, false); // false = es about (fade in)
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Ejecutar al inicio
    }

    // Helper para renderizar un segmento de narrativa
    // Helper para renderizar un segmento de narrativa
    renderSegment(container, config, globalProgress, isIntro) {
        // A. Renderizado del HTML (Solo si cambia el ID)
        if (container.dataset.activeId !== config.id) {
            container.dataset.activeId = config.id;
            
            // 1. Guardamos la altura actual (la "vieja") para que la animación tenga desde dónde empezar
            const previousHeight = container.style.height;

            // 2. Inyectamos el nuevo contenido (texto nuevo)
            container.innerHTML = this.generateLinesHTML(config.text);
            
            // 3. TRUCO DE MAGIA: Ponemos height 'auto' momentáneamente para medir
            // el tamaño REAL que necesita el nuevo texto.
            container.style.height = 'auto';
            const newHeight = container.scrollHeight;

            // 4. Si ya teníamos una altura, la volvemos a poner para evitar un parpadeo
            if (previousHeight && previousHeight !== 'auto') {
                container.style.height = previousHeight;
                
                // 5. FORZAR REFLOW: Leemos una propiedad geométrica.
                // Esto obliga al navegador a "darse cuenta" de que está en la altura vieja
                // antes de que le pidamos cambiar a la nueva. Sin esto, la animación no ocurre.
                void container.offsetHeight; 
            }

            // 6. Ahora sí, seteamos la nueva altura. El CSS (transition) hará la magia visual.
            container.style.height = `${newHeight}px`;
        }

        // B. Cálculo de Opacidad (El resto de tu lógica se mantiene igual)
        const lines = Array.from(container.children);
        const totalLines = lines.length;
        
        let segmentProgress;

        if (isIntro) {
            if (globalProgress < config.end) {
                segmentProgress = 1;
            } else {
                const fadeOutZone = 0.15;
                const p = (globalProgress - config.end) / fadeOutZone;
                segmentProgress = 1 - Math.min(1, p);
            }
        } else {
            const zoneLength = config.end - config.start;
            segmentProgress = Math.max(0, (globalProgress - config.start) / zoneLength);
        }

        const step = 1 / totalLines;

        lines.forEach((line, index) => {
            let lineOpacity;
            
            if (isIntro) {
                lineOpacity = segmentProgress; 
            } else {
                const lineStart = index * (step * 0.8);
                const lineEnd = lineStart + 0.3;
                let p = (segmentProgress - lineStart) / (lineEnd - lineStart);
                lineOpacity = Math.max(0, Math.min(1, p));
            }

            line.style.opacity = lineOpacity;
            const lift = (1 - lineOpacity) * 15;
            line.style.transform = `translate3d(0, ${lift}px, 0)`;
        });
        
        container.style.opacity = 1;
    }

    generateLinesHTML(textArray) {
        return textArray.map((line, index) => {
            // Si es la primera línea, usamos clase de título
            const className = index === 0 ? "narrative-line narrative-title" : "narrative-line";
            // Si es título, usamos h2 semánticamente (opcional) o div con estilo
            return `<div class="${className}">${line}</div>`;
        }).join('');
    }
}