// src/main.js
import { injectCSS } from "./utils/CSSInjecter.js";
import { Renderer } from "./core/Renderer.js";
import DataManager from "./core/DataManager.js";

import { SmokeEffect } from "./components/SmokeEffect.js";
import { Navbar } from "./components/Navbar.js";
import { MainLayout } from "./components/MainContent.js";

// 1. Inyectar estilos
injectCSS('./styles/mainStyles/initial.css');
injectCSS('./styles/mainStyles/main.css');
injectCSS('./styles/navbar.css');
injectCSS('./styles/heroSection.css');
injectCSS('./styles/aboutSection.css');
injectCSS('./styles/projectsSection.css');
injectCSS('./styles/experienceSection.css');
injectCSS('./styles/contactMe.css');
injectCSS('./styles/footer.css');

// 2. Renderizar Componentes (Esperando datos)
document.addEventListener('DOMContentLoaded', async () => {
    await DataManager.init();
    
    Renderer.render(new SmokeEffect(), 'body');
    Renderer.render(new MainLayout(), 'body');
    Renderer.render(new Navbar(), 'body'); 
});