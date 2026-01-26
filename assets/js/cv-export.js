// assets/js/cv-export.js
// Script para exportar currículum académico a PDF estilo LaTeX/Harvard (1 página)

async function exportCVtoPDF() {
    try {
        // Mostrar indicador de carga
        const exportBtn = document.getElementById('export-cv-btn');
        const originalHTML = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        exportBtn.disabled = true;

        // Cargar datos
        const [siteData, projectsData] = await Promise.all([
            fetch('assets/data/site-data.json').then(r => r.json()),
            fetch('proyectos/projects.json').then(r => r.json())
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración optimizada para 1 página
        const config = {
            margins: { top: 12, right: 15, bottom: 12, left: 15 },
            fonts: {
                header: 16,
                name: 14,
                sectionTitle: 11,
                subsectionTitle: 10,
                body: 9,
                small: 8
            },
            colors: {
                primary: [29, 27, 27],
                secondary: [100, 100, 100],
                accent: [213, 168, 158],
                link: [0, 0, 255]
            },
            spacing: {
                afterSection: 3.5,
                betweenItems: 2.5,
                lineHeight: 3.8
            }
        };
        
        let yPosition = config.margins.top;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = config.margins.left;
        const contentWidth = pageWidth - config.margins.left - config.margins.right;
        
        // Función para verificar espacio disponible
        function checkSpace(required) {
            return (yPosition + required) < (pageHeight - config.margins.bottom);
        }
        
        // Función para scoring de proyectos técnicos
        function scoreProject(project) {
            const technicalKeywords = {
                'C++': 3,
                'Algorithm': 3,
                'Algorithms': 3,
                'Architecture': 2,
                'System': 2,
                'Simulation': 2,
                'Physics': 2,
                'AI': 2,
                'Machine Learning': 2,
                'Data Structure': 3,
                'Database': 2,
                'OpenGL': 2,
                'WebGL': 2,
                'Graphics': 2,
                'Procedural': 2
            };
            
            let score = 0;
            const searchText = `${project.title} ${project.excerpt} ${project.skills.join(' ')}`;
            
            Object.entries(technicalKeywords).forEach(([keyword, points]) => {
                if (searchText.toLowerCase().includes(keyword.toLowerCase())) {
                    score += points;
                }
            });
            
            return score;
        }
        
        // ===== HEADER (NOMBRE Y CONTACTO) =====
        doc.setFont('times', 'bold');
        doc.setFontSize(config.fonts.header);
        doc.setTextColor(...config.colors.primary);
        
        // Nombre centrado
        const fullName = siteData.personal.nombres[0].toUpperCase();
        const nameWidth = doc.getTextWidth(fullName);
        doc.text(fullName, (pageWidth - nameWidth) / 2, yPosition);
        yPosition += 5;
        
        // Tagline
        doc.setFont('times', 'normal');
        doc.setFontSize(config.fonts.body);
        doc.setTextColor(...config.colors.secondary);
        const taglineWidth = doc.getTextWidth(siteData.personal.tagline);
        doc.text(siteData.personal.tagline, (pageWidth - taglineWidth) / 2, yPosition);
        yPosition += 4;
        
        // Información de contacto en una línea
        doc.setFontSize(config.fonts.small);
        const email = siteData.contacto.items[0].contenido;
        const location = siteData.contacto.items[1].contenido;
        const website = 'cdecasurpie.github.io';
        const contactLine = `${email}  |  ${location}  |  ${website}`;
        const contactWidth = doc.getTextWidth(contactLine);
        
        // Email
        doc.setTextColor(...config.colors.primary);
        doc.text(email, (pageWidth - contactWidth) / 2, yPosition);
        const emailWidth = doc.getTextWidth(email);
        
        // Separador
        doc.text('  |  ', (pageWidth - contactWidth) / 2 + emailWidth, yPosition);
        const sep1Width = doc.getTextWidth('  |  ');
        
        // Location
        doc.text(location, (pageWidth - contactWidth) / 2 + emailWidth + sep1Width, yPosition);
        const locationWidth = doc.getTextWidth(location);
        
        // Separador
        doc.text('  |  ', (pageWidth - contactWidth) / 2 + emailWidth + sep1Width + locationWidth, yPosition);
        
        // Website (con link)
        doc.setTextColor(...config.colors.link);
        doc.textWithLink(website, 
            (pageWidth - contactWidth) / 2 + emailWidth + sep1Width + locationWidth + sep1Width, 
            yPosition, 
            { url: `https://${website}` }
        );
        
        yPosition += config.spacing.afterSection + 2;
        
        // Línea horizontal separadora
        doc.setDrawColor(...config.colors.primary);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += config.spacing.afterSection;
        
        // ===== EDUCACIÓN (PRIORIDAD MÁXIMA) =====
        doc.setFont('times', 'bold');
        doc.setFontSize(config.fonts.sectionTitle);
        doc.setTextColor(...config.colors.primary);
        doc.text('EDUCATION', margin, yPosition);
        yPosition += config.spacing.afterSection;
        
        siteData.educacion.forEach((edu, index) => {
            doc.setFont('times', 'bold');
            doc.setFontSize(config.fonts.subsectionTitle);
            doc.setTextColor(...config.colors.primary);
            doc.text(edu.institucion, margin, yPosition);
            
            // Periodo alineado a la derecha
            doc.setFont('times', 'italic');
            doc.setFontSize(config.fonts.small);
            doc.setTextColor(...config.colors.secondary);
            const periodoWidth = doc.getTextWidth(edu.periodo);
            doc.text(edu.periodo, pageWidth - margin - periodoWidth, yPosition);
            yPosition += config.spacing.betweenItems + 1;
            
            // Grado y ubicación
            doc.setFont('times', 'italic');
            doc.setFontSize(config.fonts.body);
            doc.setTextColor(...config.colors.primary);
            doc.text(`${edu.grado} - ${edu.ubicacion}`, margin, yPosition);
            yPosition += config.spacing.betweenItems + 1;
            
            // Logros (bullets)
            doc.setFont('times', 'normal');
            doc.setFontSize(config.fonts.body);
            doc.setTextColor(...config.colors.primary);
            edu.logros.forEach(logro => {
                const bulletX = margin + 2;
                doc.text('•', bulletX, yPosition);
                const logroLines = doc.splitTextToSize(logro, contentWidth - 5);
                doc.text(logroLines, bulletX + 3, yPosition);
                yPosition += logroLines.length * config.spacing.lineHeight;
            });
        });
        
        yPosition += config.spacing.afterSection - 1;
        
        // ===== SKILLS (FORMATO COMPACTO INLINE) =====
        doc.setFont('times', 'bold');
        doc.setFontSize(config.fonts.sectionTitle);
        doc.setTextColor(...config.colors.primary);
        doc.text('TECHNICAL SKILLS', margin, yPosition);
        yPosition += config.spacing.afterSection;
        
        // Lenguajes
        doc.setFont('times', 'bold');
        doc.setFontSize(config.fonts.body);
        doc.text('Languages:', margin, yPosition);
        doc.setFont('times', 'normal');
        const lenguajes = siteData.skills.lenguajes.map(s => s.name).join(', ');
        doc.text(lenguajes, margin + 22, yPosition);
        yPosition += config.spacing.lineHeight;
        
        // Core/Sistemas
        doc.setFont('times', 'bold');
        doc.text('Core:', margin, yPosition);
        doc.setFont('times', 'normal');
        const sistemas = siteData.skills.sistemas.map(s => s.name).join(', ');
        const sistemasLines = doc.splitTextToSize(sistemas, contentWidth - 22);
        doc.text(sistemasLines, margin + 22, yPosition);
        yPosition += sistemasLines.length * config.spacing.lineHeight;
        
        // Herramientas
        doc.setFont('times', 'bold');
        doc.text('Tools:', margin, yPosition);
        doc.setFont('times', 'normal');
        const herramientas = siteData.skills.herramientas.map(s => s.name).join(', ');
        doc.text(herramientas, margin + 22, yPosition);
        yPosition += config.spacing.afterSection;
        
        // ===== PROYECTOS TÉCNICOS (TOP 3) =====
        doc.setFont('times', 'bold');
        doc.setFontSize(config.fonts.sectionTitle);
        doc.setTextColor(...config.colors.primary);
        doc.text('TECHNICAL PROJECTS', margin, yPosition);
        yPosition += config.spacing.afterSection;
        
        // Filtrar y seleccionar top 3 proyectos técnicos
        const topProjects = projectsData.projects
            .map(p => ({ ...p, score: scoreProject(p) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        
        topProjects.forEach((project, index) => {
            // Título del proyecto
            doc.setFont('times', 'bold');
            doc.setFontSize(config.fonts.subsectionTitle);
            doc.setTextColor(...config.colors.primary);
            doc.text(project.title, margin, yPosition);
            yPosition += config.spacing.betweenItems + 1;
            
            // Descripción
            doc.setFont('times', 'normal');
            doc.setFontSize(config.fonts.body);
            const descLines = doc.splitTextToSize(project.excerpt, contentWidth);
            doc.text(descLines, margin, yPosition);
            yPosition += descLines.length * config.spacing.lineHeight;
            
            // Skills
            doc.setFont('times', 'italic');
            doc.setFontSize(config.fonts.small);
            doc.setTextColor(...config.colors.secondary);
            const skillsText = `Technologies: ${project.skills.slice(0, 5).join(', ')}`;
            doc.text(skillsText, margin, yPosition);
            yPosition += config.spacing.betweenItems + 2;
        });
        
        yPosition += config.spacing.afterSection - 2;
        
        // ===== EXPERIENCIA (CONDENSADA - SOLO MÁS RELEVANTE) =====
        if (checkSpace(25)) {
            doc.setFont('times', 'bold');
            doc.setFontSize(config.fonts.sectionTitle);
            doc.setTextColor(...config.colors.primary);
            doc.text('RELEVANT EXPERIENCE', margin, yPosition);
            yPosition += config.spacing.afterSection;
            
            // Filtrar experiencias más relevantes (enseñanza y técnicas)
            const relevantJobs = siteData.experiencia.trabajos.filter((job, idx) => 
                idx < 2 || job.cargo.toLowerCase().includes('profesor') || 
                job.cargo.toLowerCase().includes('desarrollador')
            ).slice(0, 3);
            
            relevantJobs.forEach((job, index) => {
                // Cargo
                doc.setFont('times', 'bold');
                doc.setFontSize(config.fonts.subsectionTitle);
                doc.setTextColor(...config.colors.primary);
                doc.text(job.cargo, margin, yPosition);
                
                // Periodo a la derecha
                doc.setFont('times', 'italic');
                doc.setFontSize(config.fonts.small);
                doc.setTextColor(...config.colors.secondary);
                const periodoWidth = doc.getTextWidth(job.periodo);
                doc.text(job.periodo, pageWidth - margin - periodoWidth, yPosition);
                yPosition += config.spacing.betweenItems + 0.5;
                
                // Empresa
                doc.setFont('times', 'italic');
                doc.setFontSize(config.fonts.body);
                doc.setTextColor(...config.colors.primary);
                doc.text(job.empresa, margin, yPosition);
                yPosition += config.spacing.betweenItems + 0.5;
                
                // Descripción (compacta - solo primera línea si es muy larga)
                doc.setFont('times', 'normal');
                doc.setFontSize(config.fonts.small);
                const descShort = job.descripcion.length > 120 ? 
                    job.descripcion.substring(0, 120) + '...' : 
                    job.descripcion;
                const descLines = doc.splitTextToSize(descShort, contentWidth);
                doc.text(descLines, margin, yPosition);
                yPosition += Math.min(descLines.length, 2) * config.spacing.lineHeight;
                
                // Solo agregar tecnologías si hay espacio
                if (checkSpace(8) && index < relevantJobs.length - 1) {
                    yPosition += config.spacing.betweenItems;
                }
            });
        }
        
        // Guardar PDF
        const fileName = `CV_${siteData.personal.nombres[0].replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        // Restaurar botón
        exportBtn.innerHTML = originalHTML;
        exportBtn.disabled = false;
        
        // Mostrar mensaje de éxito
        showNotification('CV exportado exitosamente (formato académico optimizado)', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showNotification('Error al generar el currículum', 'error');
        
        // Restaurar botón
        const exportBtn = document.getElementById('export-cv-btn');
        exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar Currículum';
        exportBtn.disabled = false;
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#e4a697' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-family: 'Poppins', sans-serif;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event listener para el botón
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-cv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCVtoPDF);
    }
});
