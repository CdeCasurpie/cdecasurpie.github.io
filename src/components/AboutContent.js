import DataManager from "../core/DataManager.js";

export class AboutContent {
    constructor() {
        this.skills = DataManager.getSkills();
        this.education = DataManager.getEducation();
    }

    render() {
        // 1. Generar HTML de Lenguajes
        const languagesHTML = this.skills.lenguajes.map(lang => `
            <div class="skill-tag">
                <i class="${lang.icon}"></i> <span>${lang.name}</span>
            </div>
        `).join('');

        // 2. Generar HTML de Sistemas/Topics
        const systemsHTML = this.skills.herramientas.map(tool => `
            <div class="skill-tag">
                <i class="${tool.icon}"></i> <span>${tool.name}</span>
            </div>
        `).join('');

        // 3. Generar HTML de Educación (Tomamos el primero)
        const edu = this.education[0];

        return `
            <div class="about-grid">
                <div class="info-card academic-card">
                    <h3 class="card-title">// ACADEMIC_LOG</h3>
                    <div class="edu-info">
                        <div class="edu-header">
                            <span class="university">${edu.institucion}</span>
                            <span class="years">${edu.periodo}</span>
                        </div>
                        <p class="degree">${edu.grado}</p>
                        <ul class="achievements-list">
                            ${edu.logros.map(logro => `<li>${logro}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div class="info-card tech-card">
                    <div class="tech-category">
                        <h4>LANGUAGES</h4>
                        <div class="tags-container">
                            ${languagesHTML}
                        </div>
                    </div>

                    <div class="tech-category">
                        <h4>TOOLS</h4>
                        <div class="tags-container">
                            ${systemsHTML}
                        </div>
                    </div>
                    
                    <div class="tech-footer">
                        <span class="os-badge"><i class="fab fa-linux"></i> Arch Linux User</span>
                    </div>
                </div>

            </div>
        `;
    }

    mount() {
        console.log('[AboutContent] Renderizado');
    }
}