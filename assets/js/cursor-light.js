/**
 * Cursor Light Effect
 * Script que crea un efecto de luz que sigue al cursor
 */

document.addEventListener('DOMContentLoaded', function() {
    // Crear el elemento para el efecto de luz
    const lightEffect = document.createElement('div');
    lightEffect.className = 'cursor-light';
    
    // Estilos CSS para la luz
    lightEffect.style.position = 'fixed';
    lightEffect.style.width = '300px';
    lightEffect.style.height = '300px';
    lightEffect.style.borderRadius = '50%';
    lightEffect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)';
    lightEffect.style.transform = 'translate(-50%, -50%)';
    lightEffect.style.pointerEvents = 'none';
    lightEffect.style.zIndex = '-1'; // Asegura que esté detrás de todo el contenido
    lightEffect.style.transition = 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease';
    
    // Añadir al cuerpo del documento
    document.body.appendChild(lightEffect);
    
    // Escuchar el movimiento del mouse
    document.addEventListener('mousemove', function(e) {
        // Actualizar la posición de la luz para que siga al cursor
        lightEffect.style.left = e.clientX + 'px';
        lightEffect.style.top = e.clientY + 'px';
        
        // Efecto de expansión en movimiento rápido
        clearTimeout(window.mouseTimeout);
        lightEffect.style.width = '350px';
        lightEffect.style.height = '350px';
        lightEffect.style.opacity = '1';
        
        window.mouseTimeout = setTimeout(() => {
            lightEffect.style.width = '300px';
            lightEffect.style.height = '300px';
            lightEffect.style.opacity = '0.8';
        }, 100);
    });
    
    // Evento para dispositivos táctiles - ocultar el efecto
    document.addEventListener('touchstart', function() {
        lightEffect.style.opacity = '0';
    });

    // Reiniciar el efecto cuando el cursor está inactivo
    let timeout;
    document.addEventListener('mousemove', function() {
        clearTimeout(timeout);
        lightEffect.style.opacity = '0.8';
        
        timeout = setTimeout(() => {
            lightEffect.style.opacity = '0.4';
        }, 2000);
    });
    
    // Efecto de escala al hacer clic
    document.addEventListener('mousedown', function() {
        lightEffect.style.width = '450px';
        lightEffect.style.height = '450px';
        lightEffect.style.opacity = '0.5';
    });
    
    document.addEventListener('mouseup', function() {
        lightEffect.style.width = '300px';
        lightEffect.style.height = '300px';
        lightEffect.style.opacity = '0.8';
    });
    
    // Adaptar el efecto al tema oscuro/claro
    function updateLightEffect() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            lightEffect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)';
        } else {
            lightEffect.style.background = 'radial-gradient(circle, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 70%)';
        }
    }
    
    // Observar cambios en el atributo data-theme
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'data-theme') {
                updateLightEffect();
            }
        });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Inicializar el efecto con el tema actual
    updateLightEffect();
});