import { HeroSection } from "./HeroSection.js";
import { AboutContent } from "./AboutContent.js";
import { ProjectsContent } from "./ProjectsContent.js";
import DataManager from "../core/DataManager.js";

/**
 * Configuración de animaciones.
 * PARALLAX_SPEED se eliminó porque ahora es dinámico.
 */
const ANIMATION_CONFIG = {
    FADE_START: 0.05,            // Inicio desvanecimiento elementos secundarios
    FADE_END: 0.35,              // Fin desvanecimiento elementos secundarios
    COMPRESSION_FACTOR: 0.2,     // Factor de aplastamiento visual
    EXIT_BUFFER: 0.15,           // Anticipación de salida para evitar solapamiento
    PARALLAX_FACTOR: 0.1         // % del espacio libre que usaremos para el movimiento (10%)
};

export class MainLayout {
    constructor() {
        this.heroSection = new HeroSection();
        this.aboutContent = new AboutContent();
        this.projectsContent = new ProjectsContent();

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

        // Estado interno para cálculos de geometría (Optimización de FPS)
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
            </div>
        `;
    }

    renderSectionHeader(sectionID) {
        const sectionData = this.narrativeConfig.find(sec => sec.id === sectionID);
        if (!sectionData || !sectionData.text) return '';

        const title = sectionData.text[0] || '';
        const description = sectionData.text.slice(1).map(t => `${t}`).join('');

        return `
            <div class="section-header show-on-mobile">
                <h2 class="narrative-title" style="text-align: center; font-size: 2.3rem;">${title}</h2>
                <div class="section-description"><p>${description}</p></div>
            </div>
        `;
    }

    mount() {
        [this.heroSection, this.aboutContent, this.projectsContent].forEach(comp => {
            if (typeof comp.mount === 'function') comp.mount();
        });

        this.cacheDOMSelectors();
        
        // Medición inicial de geometría
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

    /**
     * Calcula las dimensiones críticas para la animación.
     * Se llama en Resize y cuando cambia el contenido del texto.
     * Evita leer offsetHeight en cada frame de scroll.
     */
    updateMetrics() {
        if (!this.dom.stickyText) return;

        this.metrics.windowHeight = window.innerHeight;
        this.metrics.contentHeight = this.dom.stickyText.offsetHeight;
        // Calculamos cuánto espacio libre vertical hay en pantalla
        this.metrics.availableSpace = this.metrics.windowHeight - this.metrics.contentHeight;
    }

    setupControlLogic() {
        const handleFrame = () => {
            const progress = window.scrollY / this.metrics.windowHeight;

            this.updateHeroParallax(progress);
            this.updateSecondaryElements(progress);
            this.updateNarrativeText(progress);
        };

        window.addEventListener('scroll', handleFrame, { passive: true });
        
        window.addEventListener('resize', () => {
            this.updateMetrics(); // Recalcular límites al redimensionar
            handleFrame();
        });

        handleFrame(); // Ejecución inicial
    }

    /**
     * Mueve el bloque sticky verticalmente (Parallax).
     * El límite de movimiento se calcula dinámicamente según la altura del contenido
     * para asegurar que siempre se mantenga visualmente centrado/visible.
     */
    updateHeroParallax(progress) {
        if (this.dom.stickyText && this.metrics.availableSpace > 0) {
            
            // Calculamos el límite máximo de movimiento.
            // Usamos un factor (ej. 30% del espacio libre) para que el movimiento sea sutil
            // y el texto nunca toque los bordes de la pantalla.
            const maxParallax = this.metrics.availableSpace * ANIMATION_CONFIG.PARALLAX_FACTOR;

            // Calculamos la posición actual
            let yPos = progress * maxParallax;
            
            // Clamp estricto para seguridad
            if (yPos > maxParallax) yPos = maxParallax;

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
        
        // 2. Identificar el siguiente segmento para calcular salida anticipada
        const nextSegment = this.narrativeConfig[activeIndex + 1];
        const nextStart = nextSegment ? nextSegment.start : null;

        const isIntro = (activeIndex === 0);

        if (activeSegment) {
            this.renderSegment(this.dom.dynamicContainer, activeSegment, progress, isIntro, nextStart);
        }
    }

    renderSegment(container, config, globalProgress, isIntro, nextStart) {
        // A. Inyección de contenido con medición de altura
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

            // CRÍTICO: Recalcular métricas de parallax porque la altura del texto cambió
            this.updateMetrics();
        }

        // B. Cálculo de Opacidad de Entrada
        const lines = Array.from(container.children);
        let entranceOpacity = 1;

        if (isIntro) {
            if (globalProgress > config.end) {
                 const fadeOutZone = 0.15;
                 const p = (globalProgress - config.end) / fadeOutZone;
                 entranceOpacity = 1 - Math.min(1, p);
            }
        } else {
            const zoneLength = config.end - config.start;
            const segmentP = zoneLength > 0 
                ? Math.max(0, (globalProgress - config.start) / zoneLength)
                : 1;
            entranceOpacity = segmentP; 
        }

        // C. Cálculo de Opacidad de Salida (Pre-Fade)
        // El texto empieza a desaparecer EXIT_BUFFER antes de que inicie el siguiente
        let exitOpacity = 1;
        if (nextStart !== null) {
            const exitStartPoint = nextStart - ANIMATION_CONFIG.EXIT_BUFFER;
            
            if (globalProgress > exitStartPoint) {
                const exitZone = ANIMATION_CONFIG.EXIT_BUFFER;
                const exitP = (globalProgress - exitStartPoint) / exitZone;
                exitOpacity = 1 - Math.max(0, Math.min(1, exitP));
            }
        }

        // D. Aplicación de estilos
        const step = 1 / lines.length;
        lines.forEach((line, index) => {
            let lineAlpha;

            if (isIntro) {
                // La intro se ve afectada uniformemente por la salida
                lineAlpha = entranceOpacity * exitOpacity;
            } else {
                const lineStart = index * (step * 0.8);
                const lineEnd = lineStart + 0.3;
                let p = (entranceOpacity - lineStart) / (lineEnd - lineStart);
                p = Math.max(0, Math.min(1, p));
                
                // Combina entrada en cascada con salida uniforme
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