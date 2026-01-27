// src/core/CSSInjecter.js

/**
 * Inyecta un archivo CSS externo en el head del documento.
 * @param {string} href - La ruta al archivo CSS.
 */
export function injectCSS(href) {
    // Evitar duplicados si ya existe
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
    console.log(`[CSSInjecter] Estilo inyectado: ${href}`);
}

