import DataManager from "../core/DataManager.js";

/**
 * Componente ContactMe
 * Responsable de renderizar la sección de contacto y manejar la interacción del formulario.
 */
export class ContactMe {
    constructor() {
        this.contactData = DataManager.getContact();
        this.dom = {
            form: null,
            btn: null
        };
        // EXTRAER EMAIL: Intentamos buscar el email en los items de contacto para usarlo en el envío
        // Si no lo encuentra, usa uno por defecto.
        const emailItem = this.contactData?.items?.find(i => i.titulo.toLowerCase().includes('email'));
        this.targetEmail = emailItem ? emailItem.contenido : "c.casurpie@gmail.com"; 
    }

    render() {
        if (!this.contactData) return '';

        return `
            <section class="ui-layer contact-me-section" id="contacto">
                <div class="cm-wrapper">
                    ${this.renderHeader()}
                    <div class="cm-content-grid">
                        <div class="cm-info-column">
                            ${this.renderContactInfo()}
                        </div>
                        <div class="cm-form-column">
                            ${this.renderForm()}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderHeader() {
        const { titulo, subtitulo, mensaje } = this.contactData;
        return `
            <div class="cm-header">
                <h2 class="cm-title">${titulo.toUpperCase()}</h2>
                <h4 class="cm-subtitle">${subtitulo}</h4>
                <p class="cm-message">${mensaje}</p>
            </div>
        `;
    }

    renderContactInfo() {
        const items = this.contactData.items || [];
        return `
            <div class="cm-info-list">
                ${items.map(item => `
                    <div class="cm-info-card">
                        <div class="cm-icon-box">
                            <i class="${item.icono}"></i>
                        </div>
                        <div class="cm-info-text">
                            <span class="cm-label">${item.titulo}</span>
                            <span class="cm-value">${item.contenido}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderForm() {
        const { campos, botonTexto, botonIcono } = this.contactData.formulario;

        const fieldsHTML = campos.map(campo => {
            const isTextArea = campo.tipo === 'textarea';
            const inputTag = isTextArea 
                ? `<textarea id="${campo.id}" name="${campo.id}" placeholder="${campo.placeholder}" rows="4" required class="cm-input"></textarea>`
                : `<input type="${campo.tipo}" id="${campo.id}" name="${campo.id}" placeholder="${campo.placeholder}" required class="cm-input">`;

            return `
                <div class="cm-field-group">
                    <label for="${campo.id}" class="cm-label-text">${campo.label}</label>
                    ${inputTag}
                </div>
            `;
        }).join('');

        // NOTA: Agregamos inputs ocultos para configuración de FormSubmit
        return `
            <form class="cm-form" id="contact-form">
                <input type="hidden" name="_subject" value="Nuevo mensaje de Portafolio!">
                <input type="hidden" name="_captcha" value="false">
                <input type="hidden" name="_template" value="table">
                
                ${fieldsHTML}
                
                <button type="submit" class="cm-submit-btn">
                    <span class="btn-text">${botonTexto}</span> <i class="${botonIcono}"></i>
                </button>
            </form>
        `;
    }
 
    mount() {
        this.dom.form = document.getElementById('contact-form');
        
        if (this.dom.form) {
            this.dom.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        console.log('[ContactMe] Renderizado Completo');
    }

    /**
     * Maneja el envío del formulario usando FormSubmit.co (AJAX)
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        const btn = this.dom.form.querySelector('button');
        const btnText = btn.querySelector('.btn-text');
        const icon = btn.querySelector('i');
        const originalContent = btnText.innerHTML;
        const originalIcon = icon.className;

        // 1. Estado de carga
        btnText.innerHTML = 'Sending...';
        icon.className = 'fas fa-spinner fa-spin';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        // 2. Preparar datos
        const formData = new FormData(this.dom.form);

        try {
            // Usamos el endpoint AJAX de FormSubmit
            const response = await fetch(`https://formsubmit.co/ajax/${this.targetEmail}`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // 3. Éxito
                alert('¡Message sent successfully! I will get back to you soon.');
                this.dom.form.reset();
            } else {
                throw new Error(result.message || 'Server error');
            }

        } catch (error) {
            // 4. Error
            console.error('[ContactMe] Error envío:', error);
            alert('There was an error sending your message. Please try again later.');
        } finally {
            // 5. Restaurar botón
            btnText.innerHTML = originalContent;
            icon.className = originalIcon;
            btn.style.opacity = '1';
            btn.disabled = false;
        }
    }
}