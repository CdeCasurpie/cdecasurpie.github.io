import { HeroSection } from "./HeroSection.js";
import { AboutContent } from "./AboutContent.js";
import { ProjectsContent } from "./ProjectsContent.js";
import { ExperienceSection } from "./ExperienceSection.js";
import { ContactMe } from "./ContactMe.js";
import { Footer } from "./Footer.js";
import DataManager from "../core/DataManager.js";

/**
 * Configuración de animaciones.
 */
const ANIMATION_CONFIG = {
    FADE_START: 0.05,            // Inicio desvanecimiento elementos secundarios
    FADE_END: 0.35,              // Fin desvanecimiento elementos secundarios
    COMPRESSION_FACTOR: 0.2,     // Factor de aplastamiento visual
    EXIT_BUFFER: 0.15,           // Anticipación de salida para evitar solapamiento
    PARALLAX_FACTOR: 0.1,        // % del espacio libre que usaremos para el movimiento
    MOBILE_BREAKPOINT: 1024
};

export class MainLayout {
    constructor() {
        this.heroSection = new HeroSection();
        this.aboutContent = new AboutContent();
        this.projectsContent = new ProjectsContent();
        this.experienceSection = new ExperienceSection();
        this.contactMeSection = new ContactMe();
        this.footer = new Footer();

        // Carga de datos y ordenamiento lógico
        this.narrativeConfig = DataManager.getScrollNarrative() || [];
        if (Array.isArray(this.narrativeConfig)) {
            this.narrativeConfig.sort((a, b) => a.start - b.start);
        }
        
        // Cache de referencias DOM
        this.dom = {
            stickyText: null,
            dynamicContainer: null,
            heroTagline: null,
            heroSocials: null,
            heroActions: null
        };

        // Estado interno para cálculos de geometría
        this.metrics = {
            windowHeight: 0,
            contentHeight: 0,
            availableSpace: 0
        };
    }

    render() {
        return `
            <div class="app-container">
                <div class="ui-layer hero-section" id="home">
                    <div class="sticky-layer">
                        ${this.heroSection.renderText()}
                    </div>
                    <div class="scroll-container">
                        ${this.heroSection.renderProfile()}
                    </div>
                </div>

                <div class="scroll-container">
                    <section class="ui-layer" id="about">
                        ${this.renderSectionHeader("about")}
                        ${this.aboutContent.render()}
                    </section>
                </div>

                <div class="scroll-container">
                    <section class="ui-layer" id="projects">
                        ${this.renderSectionHeader("projects")}
                        ${this.projectsContent.render()} 
                    </section>
                </div>


                ${this.experienceSection.render()}

                ${this.contactMeSection.render()}

                ${this.footer.render()}
            </div>
        `;
    }

    renderSectionHeader(sectionID) {
        const sectionData = this.narrativeConfig.find(sec => sec.id === sectionID);
        if (!sectionData || !sectionData.text) return '';

        const title = sectionData.text[0] || '';
        const description = sectionData.text.slice(1).map(t => `<p>${t}</p>`).join('');

        return `
            <div class="section-header show-on-mobile">
                <h2 class="narrative-title" style="text-align: center; font-size: 2.3rem;">${title}</h2>
                <div class="section-description">${description}</div>
            </div>
        `;
    }

    mount() {
        [this.heroSection, this.aboutContent, this.projectsContent, this.experienceSection, this.contactMeSection, this.footer].forEach(comp => {
            if (typeof comp.mount === 'function') comp.mount();
        });

        this.cacheDOMSelectors();
        
        // Medición inicial
        this.updateMetrics();
        
        this.setupControlLogic();
        console.log('[MainLayout] Montado Dinámicamente.');
    }

    cacheDOMSelectors() {
        this.dom.stickyText = document.getElementById('sticky-hero-text');
        this.dom.dynamicContainer = document.getElementById('dynamic-text-container');
        
        if (this.dom.stickyText) {
            this.dom.heroTagline = this.dom.stickyText.querySelector('h2');
            this.dom.heroSocials = this.dom.stickyText.querySelector('.hero-socials');
            this.dom.heroActions = this.dom.stickyText.querySelector('.hero-actions');
        }
    }

    updateMetrics() {
        if (!this.dom.stickyText) return;

        this.metrics.windowHeight = window.innerHeight;
        this.metrics.contentHeight = this.dom.stickyText.offsetHeight;
        this.metrics.availableSpace = Math.max(0, this.metrics.windowHeight - this.metrics.contentHeight);
    }

    setupControlLogic() {
        const handleFrame = () => {
            // En móvil desactivamos la lógica compleja de sticky
            if (window.innerWidth <= ANIMATION_CONFIG.MOBILE_BREAKPOINT) return;
            
            // Progreso global (0 = top, 1 = 1 viewport scrolleado, etc.)
            const progress = window.scrollY / this.metrics.windowHeight;

            this.updateHeroParallax(progress);
            this.updateSecondaryElements(progress);
            this.updateNarrativeText(progress);
        };

        window.addEventListener('scroll', handleFrame, { passive: true });
        
        window.addEventListener('resize', () => {
            this.updateMetrics();
            handleFrame();
        });

        handleFrame(); // Ejecución inicial
    }

    /**
     * Mueve el bloque sticky.
     * Si llegamos al final de la narrativa, permite que el texto haga scroll con la página.
     */
    updateHeroParallax(progress) {
        if (this.dom.stickyText && this.metrics.availableSpace > 0) {
            
            // 1. Calcular posición "Sticky" normal (baja ligeramente)
            const maxParallax = this.metrics.availableSpace * ANIMATION_CONFIG.PARALLAX_FACTOR;
            let yPos = progress * maxParallax;
            
            // Clamp: No bajar más del límite visual permitido
            if (yPos > maxParallax) yPos = maxParallax;

            // 2. Lógica "Scroll Away" al final
            // Obtenemos el punto final de la última narrativa configurada
            const lastSegment = this.narrativeConfig[this.narrativeConfig.length - 1];
            
            if (lastSegment) {
                const finalEnd = lastSegment.end;

                // Si hemos pasado el final de la última narrativa...
                if (progress > finalEnd) {
                    // Calculamos cuántos píxeles nos hemos pasado
                    const pixelsPast = (progress - finalEnd) * this.metrics.windowHeight;
                    
                    // Restamos esos píxeles para que el texto suba visualmente (scrollee con la página)
                    yPos -= pixelsPast;
                }
            }

            this.dom.stickyText.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
    }

    updateSecondaryElements(progress) {
        const { heroTagline, heroSocials, heroActions } = this.dom;
        if (!heroTagline || !heroSocials || !heroActions) return;

        const { FADE_START, FADE_END, COMPRESSION_FACTOR } = ANIMATION_CONFIG;

        if (progress <= FADE_START) {
            this.applySecondaryStyles([heroTagline, heroSocials, heroActions], 1, 1, 0, 'auto');
            return;
        }

        const range = FADE_END - FADE_START;
        const localProgress = Math.min(1, (progress - FADE_START) / range);
        const opacity = 1 - localProgress;
        const scale = 1 - (localProgress * COMPRESSION_FACTOR);
        const blur = localProgress * 5;
        const pointerEvents = opacity < 0.1 ? 'none' : 'auto';

        this.applySecondaryStyles([heroTagline, heroSocials, heroActions], opacity, scale, blur, pointerEvents);
    }

    applySecondaryStyles(elements, opacity, scale, blur, pointerEvents) {
        const styleString = `
            opacity: ${opacity};
            transform: scaleY(${scale});
            transform-origin: top;
            filter: blur(${blur}px);
            pointer-events: ${pointerEvents};
        `;
        elements.forEach(el => el.style.cssText = styleString);
    }

    updateNarrativeText(progress) {
        if (!this.dom.dynamicContainer || !this.narrativeConfig.length) return;

        // 1. Encontrar segmento activo
        let activeIndex = 0;
        for (let i = 0; i < this.narrativeConfig.length; i++) {
            if (progress >= this.narrativeConfig[i].start) {
                activeIndex = i;
            } else {
                break;
            }
        }

        const activeSegment = this.narrativeConfig[activeIndex];
        
        // 2. Identificar el SIGUIENTE segmento (si existe)
        const nextSegment = this.narrativeConfig[activeIndex + 1];
        const nextStart = nextSegment ? nextSegment.start : null;

        // 3. ¿Es la intro?
        const isIntro = (activeIndex === 0);

        if (activeSegment) {
            this.renderSegment(this.dom.dynamicContainer, activeSegment, progress, isIntro, nextStart);
        }
    }

    renderSegment(container, config, globalProgress, isIntro, nextStart) {
        // A. Inyección de contenido
        if (container.dataset.activeId !== config.id) {
            container.dataset.activeId = config.id;
            
            const previousHeight = container.style.height;
            container.innerHTML = this.generateLinesHTML(config.text);
            
            container.style.height = 'auto';
            const newHeight = container.scrollHeight;

            if (newHeight > 0) {
                if (previousHeight && previousHeight !== 'auto') {
                    container.style.height = previousHeight;
                    void container.offsetHeight; // Force reflow
                }
                container.style.height = `${newHeight}px`;
            } else {
                container.style.height = 'auto';
            }
            // Recalcular métricas al cambiar contenido
            this.updateMetrics();
        }

        // B. Opacidad de Entrada
        const lines = Array.from(container.children);
        let entranceOpacity = 1;

        if (isIntro) {
            // La intro solo tiene lógica de salida
            if (globalProgress > config.end) {
                 const fadeOutZone = 0.15;
                 const p = (globalProgress - config.end) / fadeOutZone;
                 entranceOpacity = 1 - Math.min(1, p);
            }
        } else {
            // Secciones normales
            const zoneLength = config.end - config.start;
            const segmentP = zoneLength > 0 
                ? Math.max(0, (globalProgress - config.start) / zoneLength)
                : 1;
            entranceOpacity = segmentP; 
        }

        // C. Opacidad de Salida (Pre-Fade)
        let exitOpacity = 1;
        
        // IMPORTANTE: Solo calculamos salida si HAY un siguiente segmento.
        // Si nextStart es null (es el último), exitOpacity se queda en 1.
        if (nextStart !== null) {
            const exitStartPoint = nextStart - ANIMATION_CONFIG.EXIT_BUFFER;
            
            if (globalProgress > exitStartPoint) {
                const exitZone = ANIMATION_CONFIG.EXIT_BUFFER;
                const exitP = (globalProgress - exitStartPoint) / exitZone;
                exitOpacity = 1 - Math.max(0, Math.min(1, exitP));
            }
        }

        // D. Aplicar estilos
        const step = 1 / lines.length;
        lines.forEach((line, index) => {
            let lineAlpha;

            if (isIntro) {
                lineAlpha = entranceOpacity * exitOpacity;
            } else {
                const lineStart = index * (step * 0.8);
                const lineEnd = lineStart + 0.3;
                let p = (entranceOpacity - lineStart) / (lineEnd - lineStart);
                p = Math.max(0, Math.min(1, p));
                
                lineAlpha = p * exitOpacity;
            }

            line.style.opacity = lineAlpha;
            const lift = (1 - lineAlpha) * 15;
            line.style.transform = `translate3d(0, ${lift}px, 0)`;
        });
        
        container.style.opacity = 1;
    }

    generateLinesHTML(textArray) {
        return textArray.map((line, index) => {
            const className = index === 0 ? "narrative-line narrative-title" : "narrative-line";
            return `<div class="${className}">${line}</div>`;
        }).join('');
    }
}