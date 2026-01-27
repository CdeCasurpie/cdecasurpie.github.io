// src/core/Renderer.js

export class Renderer {
    /**
     * Renderiza un componente dentro de un selector.
     * @param {Object} componentInstance - Instancia del componente (ej: new Navbar())
     * @param {string} selector - Selector CSS donde se inyectará (ej: '.ui-layer')
     */
    static render(componentInstance, selector) {
        const container = document.querySelector(selector);
        
        if (!container) {
            console.error(`[Renderer] No se encontró el contenedor: ${selector}`);
            return;
        }

        // 1. Obtener el contenido (puede ser string HTML o Nodo DOM)
        const content = componentInstance.render();

        // 2. Inyectar en el DOM
        if (typeof content === 'string') {
            container.insertAdjacentHTML('afterbegin', content);
        } else if (content instanceof HTMLElement) {
            container.prepend(content);
        }

        // 3. LIFECYCLE: Ejecutar 'onMount' o 'addListeners' si existe
        if (typeof componentInstance.mount === 'function') {
            componentInstance.mount();
        }
    }
}