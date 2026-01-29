import DataManager from "../core/DataManager.js";

export class ProjectsContent {
    constructor() {
        this.projectsIndex = [];
        this.dom = {
            wrapper: null,
            gridContainer: null,
            detailContainer: null,
            detailContent: null,
            backBtn: null,
            actionsContainer: null
        };
    }

    render() {
        return `
            <div class="pc-component-wrapper" id="pc-wrapper">
                
                <div class="pc-grid-view" id="pc-grid-view">
                    <div class="pc-loading-state">Inicializando proyectos...</div>
                </div>

                <div class="pc-detail-view" id="pc-detail-view">
                    <div class="pc-detail-glass-panel">
                        
                        <div class="pc-detail-top-bar">
                            <button class="pc-back-button" id="pc-back-btn">
                                <i class="fas fa-arrow-left"></i> VOLVER
                            </button>
                            
                            <div class="pc-detail-actions" id="pc-detail-actions"></div>
                        </div>

                        <div id="pc-detail-content-area" class="pc-detail-body-content">
                            </div>
                    </div>
                </div>

            </div>
        `;
    }

    async mount() {
        this.dom.wrapper = document.getElementById('pc-wrapper');
        this.dom.gridContainer = document.getElementById('pc-grid-view');
        this.dom.detailContainer = document.getElementById('pc-detail-view');
        this.dom.detailContent = document.getElementById('pc-detail-content-area');
        this.dom.backBtn = document.getElementById('pc-back-btn');
        this.dom.actionsContainer = document.getElementById('pc-detail-actions');

        // 1. Cargar Índice
        const data = await DataManager.loadProjectsIndex();
        if (data && data.projects) {
            this.projectsIndex = data.projects.slice(0, 3);
            this.renderCards();
        }

        // 2. Eventos
        if (this.dom.backBtn) {
            this.dom.backBtn.addEventListener('click', () => this.closeDetail());
        }

        // 3. Parallax Mouse (Solo Desktop)
        if (window.innerWidth > 1024) {
            this.dom.wrapper.addEventListener('mousemove', (e) => this.handleMouseParallax(e));
        }
    }

    renderCards() {
        if (!this.dom.gridContainer) return;

        this.dom.gridContainer.innerHTML = this.projectsIndex.map((proj, index) => {
            // Tags: Max 3 + Contador
            const visibleSkills = proj.skills.slice(0, 3);
            const remainingCount = proj.skills.length - 3;
            
            const skillsHTML = visibleSkills.map(s => 
                `<span class="pc-mini-tag">${s}</span>`
            ).join('');
            
            const moreTag = remainingCount > 0 
                ? `<span class="pc-mini-tag pc-more">+${remainingCount}</span>` 
                : '';

            // Delay aleatorio para la animación de flotar
            const floatDelay = Math.random() * -5;

            return `
                <div class="pc-card-compact" 
                     data-id="${proj.id}" 
                     data-json="${proj.jsonFile}"
                     style="--delay: ${floatDelay}s">
                    
                    <div class="pc-card-glass"></div>
                    <div class="pc-card-bg-img" style="background-image: url('${proj.coverImage}')"></div>
                    
                    <div class="pc-card-body">
                        <div class="pc-card-header-row">
                            <span class="pc-date-label">${proj.date}</span>
                            <i class="fas fa-arrow-right pc-arrow-icon"></i>
                        </div>
                        
                        <h4 class="pc-card-heading">${proj.title}</h4>
                        
                        <div class="pc-tags-row">
                            ${skillsHTML}
                            ${moreTag}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Listeners individuales
        this.dom.gridContainer.querySelectorAll('.pc-card-compact').forEach(card => {
            card.addEventListener('click', () => {
                this.openDetail(card.dataset.id, card.dataset.json);
            });
        });
    }

    handleMouseParallax(e) {
        if (this.dom.wrapper.classList.contains('view-mode-detail')) return;

        const cards = this.dom.gridContainer.querySelectorAll('.pc-card-compact');
        // Calculamos posición relativa al centro de la pantalla
        const mouseX = (e.clientX / window.innerWidth) - 0.5;
        const mouseY = (e.clientY / window.innerHeight) - 0.5;

        cards.forEach((card, index) => {
            // Profundidad variable según el índice para efecto 3D
            const depth = (index + 1) * 12; 
            const moveX = mouseX * depth;
            const moveY = mouseY * depth;
            
            card.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }

    async openDetail(id, jsonFilename) {
        // Estado de carga limpio
        this.dom.detailContent.innerHTML = '<div class="pc-loading-detail">Obteniendo datos...</div>';
        this.dom.actionsContainer.innerHTML = ''; // Limpiar botones anteriores
        
        // Animación de entrada
        this.dom.wrapper.classList.add('view-mode-detail');

        // Datos del índice (para preview instantánea)
        const summary = this.projectsIndex.find(p => p.id === id);
        
        // Fetch detalle completo
        let fullData = null;
        if (jsonFilename) {
            fullData = await DataManager.loadProjectDetail(jsonFilename);
        }

        const project = { ...summary, ...fullData };
        this.renderDetailContent(project);
    }

    renderDetailContent(project) {
        // 1. Botones de Acción (Demo / Repo)
        let buttonsHTML = '';
        if (project.repoUrl) {
            buttonsHTML += `
                <a href="${project.repoUrl}" target="_blank" class="pc-action-btn secondary">
                    <i class="fab fa-github"></i> <span>GitHub</span>
                </a>`;
        }
        if (project.demoUrl) {
            buttonsHTML += `
                <a href="${project.demoUrl}" target="_blank" class="pc-action-btn primary">
                    <i class="fas fa-external-link-alt"></i> <span>Ver Demo</span>
                </a>`;
        }
        this.dom.actionsContainer.innerHTML = buttonsHTML;

        // 2. Construcción del Contenido HTML
        let contentHTML = '';
        
        // Header
        contentHTML += `
            <div class="pc-content-header">
                <h1 class="pc-big-title">${project.title}</h1>
                <div class="pc-meta-tags">
                    ${(project.skills || []).map(s => `<span class="pc-tech-pill">${s}</span>`).join('')}
                </div>
            </div>
        `;

        // Parser de Bloques
        if (project.content && Array.isArray(project.content)) {
            project.content.forEach(block => {
                switch (block.type) {
                    case 'header':
                        contentHTML += `<h3 class="pc-block-header">${block.content}</h3>`;
                        break;
                    case 'text':
                        // 'pc-block-text' tiene white-space: pre-line en CSS para respetar \n
                        contentHTML += `<p class="pc-block-text">${this.formatText(block.content)}</p>`;
                        break;
                    case 'image':
                        contentHTML += `
                            <div class="pc-block-image">
                                <img src="${block.url}" alt="${block.alt || 'Imagen del proyecto'}">
                                ${block.caption ? `<span class="pc-caption">${block.caption}</span>` : ''}
                            </div>`;
                        break;
                    case 'code':
                        contentHTML += `
                            <div class="pc-block-code">
                                <span class="pc-lang-badge">${block.language}</span>
                                <pre><code>${this.escapeHtml(block.content)}</code></pre>
                            </div>`;
                        break;
                }
            });
        } else {
            // Fallback (solo excerpt)
            contentHTML += `<p class="pc-block-text">${project.excerpt || 'Sin descripción detallada.'}</p>`;
        }

        this.dom.detailContent.innerHTML = contentHTML;
    }

    closeDetail() {
        this.dom.wrapper.classList.remove('view-mode-detail');
        // Limpieza diferida
        setTimeout(() => {
            if (!this.dom.wrapper.classList.contains('view-mode-detail')) {
                this.dom.detailContent.innerHTML = '';
            }
        }, 600);
    }

    // Helper: Escapar HTML para bloques de código
    escapeHtml(text) {
        if (!text) return text;
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Helper: Formato básico de texto (por si quieres añadir negritas manuales con **)
    formatText(text) {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
}