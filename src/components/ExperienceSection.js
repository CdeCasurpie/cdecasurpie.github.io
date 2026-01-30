import DataManager from "../core/DataManager.js";

export class ExperienceSection {
    constructor() {
        this.expData = DataManager.getExperience();
    }

    render() {
        // 1. Extraer Docencia
        const teaching = this.expData.docencia || [];
        const caps = teaching.find(t => t.id === 'caps') || teaching[0];
        const superprof = teaching.find(t => t.id === 'superprof') || teaching[1];

        // 2. Extraer Trabajos (Laboral)
        const jobs = this.expData.trabajos || [];
        const latestJob = jobs[0]; // El más reciente (Grande)
        const pastJobs = jobs.slice(1, 4); // Los siguientes 3 (Pequeños)

        return `
            <section class="ui-layer exp-section-container" id="experience">
                <div class="exp-main-wrapper">
                    
                    <div class="exp-col-left">
                        <div class="exp-vertical-label-container">
                            <h2 class="exp-vertical-title">${this.expData.docenciaTitulo || 'Academic Instructer'}</h2>
                        </div>
                        
                        <div class="exp-teaching-stack">
                            
                            <div class="exp-card exp-card-caps">
                                <div class="exp-card-header-row">
                                    <div class="exp-header-text">
                                        <h3>${caps.empresa}</h3>
                                        <span class="exp-period">${caps.periodo}</span>
                                    </div>
                                    ${caps.logo ? `<img src="${caps.logo}" class="exp-logo-corner" alt="logo">` : ''}
                                </div>
                                <p class="exp-desc">${caps.descripcion}</p>
                                <div class="exp-tags-container">
                                    ${this.renderStack(caps.stack)}
                                </div>
                            </div>

                            <div class="exp-card exp-card-superprof">
                                <div class="exp-card-header-row">
                                    <div class="exp-header-text">
                                        <h3>${superprof.empresa}</h3>
                                        <span class="exp-subtitle">${superprof.subtitulo || ''}</span>
                                    </div>
                                    ${superprof.logo ? `<img src="${superprof.logo}" class="exp-logo-corner" alt="logo">` : ''}
                                </div>
                                
                                <span class="exp-period highlight">${superprof.periodo}</span>
                                <p class="exp-desc">${superprof.descripcion}</p>
                                
                                ${this.renderHitos(superprof.hitos)}

                                <div class="exp-tags-container">
                                    ${this.renderStack(superprof.stack)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="exp-col-right">
                        <h2 class="exp-horizontal-title">${this.expData.trabajosTitulo || 'Professional Experience'}</h2>
                        
                        <div class="exp-jobs-layout">
                            
                            <div class="exp-card exp-card-feature">
                                <div class="exp-card-header-row">
                                    <div class="exp-header-text">
                                        <h3>${latestJob.empresa}</h3>
                                        <span class="exp-role">${latestJob.cargo}</span>
                                    </div>
                                    ${latestJob.logo ? `<img src="${latestJob.logo}" class="exp-logo-corner" alt="logo">` : ''}
                                </div>
                                
                                <span class="exp-period">${latestJob.periodo}</span>
                                <p class="exp-desc-large">${latestJob.descripcion}</p>
                                
                                ${this.renderHitos(latestJob.hitos)}

                                <div class="exp-tags-container">
                                    ${this.renderStack(latestJob.stack)}
                                </div>
                            </div>

                            <div class="exp-mini-grid">
                                ${pastJobs.map(job => `
                                    <div class="exp-card exp-card-mini">
                                        <div class="exp-mini-header">
                                            <h4 class="exp-mini-title">${job.empresa}</h4>
                                            ${job.logo ? `<img src="${job.logo}" class="exp-logo-mini" alt="logo">` : ''}
                                        </div>
                                        <span class="exp-mini-role">${job.cargo}</span>
                                        <span class="exp-period small">${job.periodo}</span>
                                        
                                        <p class="exp-mini-desc">${job.descripcion}</p>
                                        
                                        <div class="exp-tags-container mini">
                                            ${this.renderStack(job.stack, 2)} </div>
                                    </div>
                                `).join('')}
                            </div>

                        </div>
                    </div>

                </div>
            </section>
        `;
    }

    // Helper para renderizar tags
    renderStack(stack, limit = 10) {
        if (!stack || !Array.isArray(stack)) return '';
        return stack.slice(0, limit).map(t => `<span class="exp-tag">${t}</span>`).join('');
    }

    // Helper para renderizar hitos (lista)
    renderHitos(hitos) {
        if (!hitos || !Array.isArray(hitos) || hitos.length === 0) return '';
        return `
            <ul class="exp-hitos-list">
                ${hitos.map(h => `<li>${h}</li>`).join('')}
            </ul>
        `;
    }

    mount() {
        console.log('[ExperienceSection] Renderizado Completo');
    }
}