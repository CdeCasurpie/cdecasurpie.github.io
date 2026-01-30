/**
 * DataManager.js
 */
class DataManager {
    constructor() {
        if (DataManager.instance) return DataManager.instance;
        
        this.data = {
            config: null,
            profile: null,
            projects: null,
            blog: null,
            projectDetails: new Map()
        };

        this.isLoaded = false;
        DataManager.instance = this;
    }

    async init() {
        if (this.isLoaded) return;

        try {
            console.log('[DataManager] Cargando datos críticos...');
            const [config, profile] = await Promise.all([
                this.fetchJSON('./assets/data/app-config.json'),
                this.fetchJSON('./assets/data/profile.json')
            ]);

            this.data.config = config;
            this.data.profile = profile;
            this.isLoaded = true;
            console.log('[DataManager] Sistema de datos listo.');
        } catch (error) {
            console.error('[DataManager] Error crítico iniciando:', error);
        }
    }

    async fetchJSON(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fallo al cargar ${url}`);
        return await res.json();
    }

    // --- GETTERS ---

    getPersonal() { return this.data.profile?.personal || {}; }
    getSocial() { return this.data.profile?.social || []; }
    getNavbarConfig() { return this.data.config?.navbar || {}; }
    
    // NUEVO: Obtener la narrativa del scroll
    getScrollNarrative() {
        return this.data.config?.scrollNarrative || [];
    }

    getFooterData() {
        return {
            config: this.data.profile?.footer || {},
            personal: this.data.profile?.personal || {},
            social: this.data.profile?.social || []
        };
    }

    getAbout() { return this.data.profile?.sobreMi || {}; }
    getExperience() { return this.data.profile?.experiencia || []; }
    getSkills() { return this.data.profile?.skills || {}; }
    getEducation() { return this.data.profile?.educacion || []; }
    getContact() { return this.data.profile?.contacto || {}; }

    async loadProjectsIndex() {
        if (this.data.projects) return this.data.projects;
        try {
            this.data.projects = await this.fetchJSON('./assets/data/projects.json');
            return this.data.projects;
        } catch (e) {
            return { projects: [] };
        }
    }

    async loadProjectDetail(filename) {
        if (this.data.projectDetails.has(filename)) {
            return this.data.projectDetails.get(filename);
        }
        try {
            const detail = await this.fetchJSON(`./assets/data/content/${filename}`);
            this.data.projectDetails.set(filename, detail);
            return detail;
        } catch (e) {
            return null;
        }
    }
}

export default new DataManager();