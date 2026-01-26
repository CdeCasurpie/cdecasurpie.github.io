// Script.js - Funcionalidades principales del sitio de César Perales

document.addEventListener('DOMContentLoaded', function() {
    setupDarkModeToggle();
    setupMobileMenu();
    initializeComponents();
    loadSiteData(); // Nueva función que carga todos los datos
    setupScrollAnimations();
});

// Función para cargar todos los datos del sitio desde site-data.json
async function loadSiteData() {
    try {
        const response = await fetch('assets/data/site-data.json');
        const data = await response.json();
        
        // Cargar todos los componentes con los datos
        loadSocialLinks(data.social);
        loadContactForm(data.contacto);
        loadAboutMeContent(data.sobreMi);
        loadEducation(data.educacion);
        loadSkillsCarousel(data.skills);
        setupTypewriterEffect(data.personal.nombres);
        
    } catch (error) {
        console.error('Error cargando los datos del sitio:', error);
    }
}

// Función para configurar el toggle del modo oscuro
function setupDarkModeToggle() {
    const darkModeToggle = document.querySelector('.theme-toggle');
    
    if (!darkModeToggle) return;
    
    // Verificar si el usuario ya tiene una preferencia guardada
    let currentTheme = localStorage.getItem('theme');
    
    // Si no hay preferencia guardada, usar tema oscuro por defecto
    if (!currentTheme) {
        currentTheme = 'light';
        localStorage.setItem('theme', currentTheme);
    }
    
    // Aplicar el tema
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Actualizar el icono según el tema
    if (currentTheme === 'dark') {
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Manejar evento de click
    darkModeToggle.addEventListener('click', function() {
        let theme = document.documentElement.getAttribute('data-theme');
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            this.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            this.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}

// Función para configurar el menú móvil
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileMenuBtn || !navLinks) return;
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });
}

// Inicializar componentes dinámicos de la página
function initializeComponents() {
    // Configurar barra de progreso de lectura
    const progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / docHeight) * 100;
            progressBar.style.width = `${scrolled}%`;
        });
    }
    
    // Inicializar highlight.js si está disponible
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    }
}

// Cargar enlaces sociales
function loadSocialLinks(socialData) {
    const socialLinksContainers = document.querySelectorAll('.social-links');
    
    if (socialLinksContainers.length === 0 || !socialData) return;
    
    socialLinksContainers.forEach(container => {
        container.innerHTML = '';
        
        socialData.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'social-icon';
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.setAttribute('aria-label', link.nombre);
            linkElement.innerHTML = `<i class="${link.icono}"></i>`;
            
            container.appendChild(linkElement);
        });
    });
}

// Cargar formulario de contacto
function loadContactForm(contactoData) {
    const contactForm = document.querySelector('.contact-form');
    
    if (!contactForm || !contactoData) return;
    
    // Generar campos del formulario desde los datos
    let formHTML = '';
    contactoData.formulario.campos.forEach(campo => {
        if (campo.tipo === 'textarea') {
            formHTML += `
                <div class="form-group">
                    <label for="${campo.id}">${campo.label}</label>
                    <textarea id="${campo.id}" name="${campo.id}" class="form-control" rows="5" placeholder="${campo.placeholder}" required></textarea>
                </div>
            `;
        } else {
            formHTML += `
                <div class="form-group">
                    <label for="${campo.id}">${campo.label}</label>
                    <input type="${campo.tipo}" id="${campo.id}" name="${campo.id}" class="form-control" placeholder="${campo.placeholder}" required>
                </div>
            `;
        }
    });
    
    formHTML += `
        <button type="submit" class="btn btn-primary">
            <i class="${contactoData.formulario.botonIcono}"></i> ${contactoData.formulario.botonTexto}
        </button>
    `;
    
    contactForm.innerHTML = formHTML;
    
    // Añadir información de contacto desde los datos
    const contactInfo = document.querySelector('.contact-info');
    
    if (contactInfo) {
        // Mantener el título y subtítulo existente
        let contactHTML = '<h3>¡Hablemos!</h3>';
        contactHTML += `<p>${contactoData.mensaje}</p>`;
        
        // Agregar items de contacto desde los datos
        contactoData.items.forEach(item => {
            contactHTML += `
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="${item.icono}"></i>
                    </div>
                    <div>
                        <h4>${item.titulo}</h4>
                        <p>${item.contenido}</p>
                    </div>
                </div>
            `;
        });
        
        contactInfo.innerHTML = contactHTML;
    }
    
    // Manejar envío del formulario
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Recoger datos del formulario dinámicamente
        const formData = {};
        contactoData.formulario.campos.forEach(campo => {
            formData[campo.id] = document.getElementById(campo.id).value;
        });
        
        // Mostrar indicador de carga
        contactForm.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-circle-notch fa-spin"></i>
                <h3>Enviando mensaje...</h3>
                <p>Por favor, espera un momento.</p>
            </div>
        `;
        
        try {
            // Construir mensaje del email
            const emailMessage = `from: ${formData.nombre} <${formData.email}> (${formData.asunto})<br><br>${formData.mensaje}`;
            
            // Enviar email usando EmailJS
            const response = await emailjs.send(
                'service_aovwrdu',
                'template_nf3pcy9',
                { message: emailMessage }
            );

            console.log('Email enviado exitosamente:', response);
            
            // Mostrar mensaje de éxito
            contactForm.innerHTML = `
                <div class="success-message">
                    <h3>¡Mensaje enviado correctamente!
                    <i class="fas fa-check-circle"></i></h3>
                    <p>Gracias por contactarme. Te responderé lo más pronto posible.</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Error al enviar email:', error);
            
            // Mostrar mensaje de error
            contactForm.innerHTML = `
                <div class="error-message">
                    <h3>Error al enviar el mensaje</h3>
                    <p>Lo sentimos, ha ocurrido un problema. Por favor, intenta de nuevo más tarde o contacta directamente a ${contactoData.items[0].contenido}</p>
                    <button class="btn btn-primary mt-3" id="retry-btn">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                </div>
            `;
            
            // Permitir reintentar
            document.getElementById('retry-btn').addEventListener('click', function() {
                loadSiteData();
            });
        }
    });
}

// Cargar contenido de About Me
function loadAboutMeContent(sobreMiData) {
    const aboutText = document.querySelector('.about-text');
    
    if (!aboutText || !sobreMiData) return;
    
    // Generar párrafos desde los datos
    aboutText.innerHTML = sobreMiData.parrafos.map(parrafo => 
        `<p>${parrafo}</p>`
    ).join('');
}

// Cargar sección de Educación
function loadEducation(educacionData) {
    const container = document.querySelector('.education-container');
    if (!container || !educacionData) return;
    
    educacionData.forEach(edu => {
        const eduCard = document.createElement('div');
        eduCard.className = 'education-card';
        eduCard.innerHTML = `
            <div class="edu-header">
                <div>
                    <h3>${edu.institucion}</h3>
                    <div class="edu-degree">${edu.grado}</div>
                </div>
                <span class="edu-period">${edu.periodo}</span>
            </div>
            <div class="edu-location"><i class="fas fa-map-marker-alt"></i> ${edu.ubicacion}</div>
            <ul class="edu-achievements">
                ${edu.logros.map(logro => `<li>${logro}</li>`).join('')}
            </ul>
        `;
        container.appendChild(eduCard);
    });
}

// Cargar skills carousel con nueva estructura categorizada
function loadSkillsCarousel(skillsData) {
    const skillsTrack = document.querySelector('.skills-track');
    
    if (!skillsTrack || !skillsData) return;
    
    // Combinar todas las categorías de skills
    const allSkills = [
        ...skillsData.lenguajes,
        ...skillsData.sistemas,
        ...skillsData.herramientas
    ];
    
    // Duplicar skills para el efecto infinito
    const duplicated = [...allSkills, ...allSkills];
    
    skillsTrack.innerHTML = duplicated.map(skill => 
        `<div class="skill-item"><i class="${skill.icon}"></i> ${skill.name}</div>`
    ).join('');
}

// Configurar animaciones al scroll
function setupScrollAnimations() {
    // Verificar si IntersectionObserver es soportado
    if (!('IntersectionObserver' in window)) return;
    
    const elementsToAnimate = document.querySelectorAll('.blog-card, .project-card, .hero-text, .hero-image, .section-title, .contact-item, .about-text p');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
}

// Función para configurar el efecto de escritura tipo consola
function setupTypewriterEffect(nombres) {
    const nameElement = document.getElementById('typewriter-name');
    if (!nameElement || !nombres || nombres.length === 0) return;
    
    let currentNameIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let pauseTime = 1500;
    
    function typeEffect() {
        const currentName = nombres[currentNameIndex];
        
        if (isDeleting) {
            nameElement.textContent = currentName.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50;
        } else {
            nameElement.textContent = currentName.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100;
        }
        
        // Añadir el cursor parpadeante
        nameElement.innerHTML = nameElement.textContent + '<span class="cursor">|</span>';
        
        if (!isDeleting && currentCharIndex === currentName.length) {
            isDeleting = true;
            typingSpeed = pauseTime;
        } else if (isDeleting && currentCharIndex === 0) {
            isDeleting = false;
            currentNameIndex = (currentNameIndex + 1) % nombres.length;
        }
        
        setTimeout(typeEffect, typingSpeed);
    }
    
    typeEffect();
}