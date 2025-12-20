// assets/js/cv-export.js
// Script para exportar currículum a PDF usando jsPDF

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
        
        // Configuración de colores
        const primaryColor = [29, 27, 27]; //rgb(29, 27, 27)
        const secondaryColor = [100, 100, 100]; //rgb(100, 100, 100)
        const lightGray = [240, 240, 240]; //rgb(240, 240, 240)
        
        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        // Función para agregar nueva página si es necesario
        function checkPageBreak(requiredSpace = 30) {
            if (yPosition + requiredSpace > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
                return true;
            }
            return false;
        }
        
        // Función para convertir imagen a base64
        async function getImageBase64(url) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error cargando imagen:', error);
                return null;
            }
        }
        
        // ===== CABECERA CON FOTO =====
        // Rectángulo de fondo para header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 60, 'F');
        
        // Cargar y agregar foto de perfil
        try {
            const profileImageBase64 = await getImageBase64('perfil.jpg');
            if (profileImageBase64) {
                doc.addImage(profileImageBase64, 'JPEG', margin, 13, 35, 35, '', 'FAST');
            }
        } catch (error) {
            console.log('No se pudo cargar la imagen de perfil');
        }
        
        // Nombre y título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(siteData.personal.nombres[0], margin + 45, 25);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(siteData.personal.tagline, margin + 45, 33);
        
        // Correo y ubicacion
        doc.setFontSize(9);
        doc.text(`${siteData.contacto.items[0].contenido}`, margin + 45, 40);
        doc.text(`${siteData.contacto.items[1].contenido}`, margin + 45, 46);


        yPosition = 70;
        
        // ===== SOBRE MÍ =====
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('SOBRE MÍ', margin, yPosition);
        
        // Línea decorativa
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);
        
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Descripción
        const aboutText = siteData.sobreMi.parrafos.join(' ');
        const splitAbout = doc.splitTextToSize(aboutText, pageWidth - 2 * margin);
        doc.text(splitAbout, margin, yPosition);
        yPosition += splitAbout.length * 5 + 10;
        
        checkPageBreak(40);
        
        // ===== EXPERIENCIA PROFESIONAL =====
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('EXPERIENCIA PROFESIONAL', margin, yPosition);
        doc.line(margin, yPosition + 2, margin + 70, yPosition + 2);
        yPosition += 10;
        
        siteData.experiencia.trabajos.forEach((job, index) => {
            checkPageBreak(45);
            
            // Fondo gris para cada trabajo
            doc.setFillColor(...lightGray);
            doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 2, 2, 'F');
            
            // Empresa y cargo
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(job.cargo, margin + 5, yPosition);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...secondaryColor);
            doc.text(`${job.empresa} | ${job.periodo}`, margin + 5, yPosition + 6);
            
            // Descripción
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            const jobDesc = doc.splitTextToSize(job.descripcion, pageWidth - 2 * margin - 10);
            doc.text(jobDesc, margin + 5, yPosition + 12);
            
            // Tecnologías
            doc.setFontSize(8);
            doc.setTextColor(...primaryColor);
            const techText = 'Tecnologías: ' + job.tecnologias.join(', ');
            const splitTech = doc.splitTextToSize(techText, pageWidth - 2 * margin - 10);
            doc.text(splitTech, margin + 5, yPosition + 12 + jobDesc.length * 4);
            
            yPosition += 40;
        });
        
        yPosition += 5;
        checkPageBreak(40);
        
        // ===== PROYECTOS DESTACADOS =====
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('PROYECTOS DESTACADOS', margin, yPosition);
        doc.line(margin, yPosition + 2, margin + 65, yPosition + 2);
        yPosition += 10;
        
        // Seleccionar top 6 proyectos
        const topProjects = projectsData.projects.slice(0, 6);
        
        topProjects.forEach((project, index) => {
            checkPageBreak(30);
            
            // Título del proyecto
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(project.title, margin, yPosition);
            
            // Fecha
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(...secondaryColor);
            doc.text(project.date, pageWidth - margin - 30, yPosition);
            
            yPosition += 5;
            
            // Descripción breve
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            const projectDesc = doc.splitTextToSize(project.excerpt, pageWidth - 2 * margin);
            doc.text(projectDesc, margin, yPosition);
            yPosition += projectDesc.length * 4;
            
            // Skills
            doc.setFontSize(8);
            doc.setTextColor(...primaryColor);
            const skillsText = project.skills.slice(0, 4).join(' • ');
            doc.text(skillsText, margin, yPosition);
            
            yPosition += 8;
        });
        
        checkPageBreak(30);
        
        // ===== PIE DE PÁGINA EN TODAS LAS PÁGINAS =====
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Línea superior del footer
            doc.setDrawColor(...lightGray);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
            
            // Texto del footer
            doc.setFontSize(8);
            doc.setTextColor(...secondaryColor);
            doc.setFont(undefined, 'normal');
            doc.text('César Perales - Currículum Vitae', margin, pageHeight - 10);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
            
            // Fecha de generación
            const currentDate = new Date().toLocaleDateString('es-ES');
            doc.text(`Generado: ${currentDate}`, pageWidth / 2 - 20, pageHeight - 10);
        }
        
        // Guardar PDF
        doc.save(`CV_Cesar_Perales_${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Restaurar botón
        exportBtn.innerHTML = originalHTML;
        exportBtn.disabled = false;
        
        // Mostrar mensaje de éxito
        showNotification('Currículum exportado exitosamente', 'success');
        
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
