// Script.js - Funcionalidades principales del sitio de César Perales

document.addEventListener('DOMContentLoaded', function() {
    setupDarkModeToggle();
    setupMobileMenu();
    initializeComponents();
    loadSocialLinks();
    loadContactForm();
    loadAboutMeContent();
    setupScrollAnimations();
    setupTypewriterEffect(); // Añadida nueva función para el efecto de escritura
});

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
function loadSocialLinks() {
    const socialLinksContainers = document.querySelectorAll('.social-links');
    
    if (socialLinksContainers.length === 0) return;
    
    const socialLinks = [
        { icon: 'fab fa-github', url: 'https://github.com/cdecasurpie', label: 'GitHub' },
        { icon: 'fab fa-linkedin-in', url: 'https://www.linkedin.com/in/cesar-perales/', label: 'LinkedIn' },
        { icon: 'fab fa-instagram', url: 'https://www.instagram.com/causa_code/', label: 'Instagram' },
        { icon: 'fa-solid fa-mug-saucer', url: 'https://ko-fi.com/cdecasurpie', label: 'Donate me a coffee' },
    ];
    
    socialLinksContainers.forEach(container => {
        container.innerHTML = '';
        
        socialLinks.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'social-icon';
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.setAttribute('aria-label', link.label);
            linkElement.innerHTML = `<i class="${link.icon}"></i>`;
            
            container.appendChild(linkElement);
        });
    });
}

// Cargar formulario de contacto
function loadContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (!contactForm) return;
    
    contactForm.innerHTML = `
        <div class="form-group">
            <label for="name">Nombre</label>
            <input type="text" id="name" name="name" class="form-control" required>
        </div>
        
        <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" name="email" class="form-control" required>
        </div>
        
        <div class="form-group">
            <label for="subject">Asunto</label>
            <input type="text" id="subject" name="subject" class="form-control" required>
        </div>
        
        <div class="form-group">
            <label for="message">Mensaje</label>
            <textarea id="message" name="message" class="form-control" rows="5" required></textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i> Enviar mensaje
        </button>
    `;
    
    // Añadir información de contacto
    const contactInfo = document.querySelector('.contact-info');
    
    if (contactInfo) {
        const contactItems = `
            <div class="contact-item">
                <div class="contact-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <div>
                    <h4>Email</h4>
                    <p>contacto@cesarperales.com</p>
                </div>
            </div>
            
            <div class="contact-item">
                <div class="contact-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div>
                    <h4>Ubicación</h4>
                    <p>Lima, Perú</p>
                </div>
            </div>
            
            <div class="contact-item">
                <div class="contact-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div>
                    <h4>Horario</h4>
                    <p>Lunes a viernes, 9am - 6pm</p>
                </div>
            </div>
        `;
        
        contactInfo.insertAdjacentHTML('beforeend', contactItems);
    }
    
    // Manejar envío del formulario
contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Recoger datos del formulario
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Mostrar indicador de carga
    contactForm.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-circle-notch fa-spin"></i>
            <h3>Enviando mensaje...</h3>
            <p>Por favor, espera un momento.</p>
        </div>
    `;
    
    try {
        // Enviar email usando EmailJS
        const response = await emailjs.send(
            'service_aovwrdu',    // Service ID
            'template_nf3pcy9',   // Template ID
            {
                message: "from: " + name + " <" + email + "> (" + subject + ")<br><br>" + message
            }
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
        
        // Mostrar mensaje de error al usuario
        contactForm.innerHTML = `
            <div class="error-message">
                <h3>Error al enviar el mensaje</h3>
                <p>Lo sentimos, ha ocurrido un problema. Por favor, intenta de nuevo más tarde o contacta directamente a cesar.cap20.p@gmail.com</p>
                <button class="btn btn-primary mt-3" id="retry-btn">
                    <i class="fas fa-redo"></i> Intentar de nuevo
                </button>
            </div>
        `;
        
        // Permitir al usuario intentar de nuevo
        document.getElementById('retry-btn').addEventListener('click', function() {
            loadContactForm(); // Recargar el formulario
        });
    }
});
}

// Cargar contenido de About Me
function loadAboutMeContent() {
    const aboutText = document.querySelector('.about-text');
    
    if (!aboutText) return;
    
    aboutText.innerHTML = `
        <p>Me fascina el punto donde la tecnología se encuentra con el arte, y cómo podemos utilizar algoritmos para crear experiencias visuales que imiten fenómenos naturales.</p>
        
        <p>Además de crear software, me dedico a la enseñanza. Creo firmemente que compartir conocimiento es tan importante como adquirirlo, y disfruto ayudando a otros a descubrir el fascinante mundo de la programación creativa.</p>
    `;
    
    
    // Cargar skills para el carousel
    const skillsTrack = document.querySelector('.skills-track');
    
    if (skillsTrack) {
        const skills = [
            { name: 'JavaScript', icon: 'fa-brands fa-js' },
            { name: 'Python', icon: 'fa-brands fa-python' },
            { name: 'Three.js', icon: 'fa-solid fa-shapes'},
            { name: 'WebGL', icon: 'fas fa-cubes' },
            { name: 'React', icon: 'fab fa-react' },
            { name: 'Node.js', icon: 'fab fa-node-js' },
            { name: 'Física Simulada', icon: 'fas fa-atom' },
        ];
        
        // Duplicar skills para el efecto infinito
        const allSkills = [...skills, ...skills];
        
        skillsTrack.innerHTML = allSkills.map(skill => {
            const iconClass = skill.icon.includes('-') ? `fab fa-${skill.icon}` : `fas fa-${skill.icon}`;
            return `<div class="skill-item"><i class="${skill.icon}"></i> ${skill.name}</div>`;
        }).join('');
    }
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
function setupTypewriterEffect() {
    const nameElement = document.getElementById('typewriter-name');
    if (!nameElement) return;
    
    // Cargar los nombres desde el archivo JSON
    fetch('/assets/data/site-data.json')
        .then(response => response.json())
        .then(data => {
            const names = data.personal.nombres;
            if (!names || names.length === 0) return;
            
            let currentNameIndex = 0;
            let currentCharIndex = 0;
            let isDeleting = false;
            let typingSpeed = 100;
            let pauseTime = 1500; // Tiempo de pausa cuando el nombre está completamente escrito
            
            function typeEffect() {
                const currentName = names[currentNameIndex];
                
                if (isDeleting) {
                    // Si estamos borrando, quitar un carácter
                    nameElement.textContent = currentName.substring(0, currentCharIndex - 1);
                    currentCharIndex--;
                    typingSpeed = 50; // Borrar más rápido que escribir
                } else {
                    // Si estamos escribiendo, añadir un carácter
                    nameElement.textContent = currentName.substring(0, currentCharIndex + 1);
                    currentCharIndex++;
                    typingSpeed = 100; // Escribir a velocidad normal
                }
                
                // Añadir el cursor parpadeante después del texto
                nameElement.innerHTML = nameElement.textContent + '<span class="cursor">|</span>';
                
                // Lógica para cambiar entre escribir y borrar
                if (!isDeleting && currentCharIndex === currentName.length) {
                    // Si terminamos de escribir, pausar antes de borrar
                    isDeleting = true;
                    typingSpeed = pauseTime;
                } else if (isDeleting && currentCharIndex === 0) {
                    // Si terminamos de borrar, cambiar al siguiente nombre
                    isDeleting = false;
                    currentNameIndex = (currentNameIndex + 1) % names.length;
                }
                
                // Continuar con el efecto
                setTimeout(typeEffect, typingSpeed);
            }
            
            // Iniciar el efecto
            typeEffect();
        })
        .catch(error => console.error('Error cargando los datos:', error));
}