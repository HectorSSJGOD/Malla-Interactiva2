document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const resetButton = document.getElementById('resetButton');

    // Estado global para los ramos completados, para una verificación más eficiente
    let completedCourses = new Set(); // Usamos un Set para búsquedas rápidas

    // Función para verificar si un ramo ha sido completado
    function isCourseCompleted(courseId) {
        return completedCourses.has(courseId);
    }

    // Función para verificar si un ramo está desbloqueado (todos sus prerrequisitos están completos)
    function isCourseUnlocked(courseElement) {
        const prerequisitesAttr = courseElement.dataset.prerequisites;
        if (!prerequisitesAttr) {
            return true; // No tiene prerrequisitos, siempre está desbloqueado
        }

        const prerequisites = prerequisitesAttr.split(',').map(id => id.trim());
        
        // Verifica si TODOS los prerrequisitos están en el Set de completedCourses
        return prerequisites.every(prereqId => isCourseCompleted(prereqId));
    }

    // Función para actualizar el estado visual de un solo ramo (bloqueado/desbloqueado)
    function updateCourseVisualState(courseElement) {
        if (isCourseUnlocked(courseElement)) {
            courseElement.classList.remove('locked');
            // Si el ramo no está en el Set de completados (es decir, no debería estar marcado)
            if (!isCourseCompleted(courseElement.dataset.courseId)) {
                courseElement.classList.remove('completed'); // Asegúrate de que NO tenga la clase 'completed'
            }
        } else {
            // Si está bloqueado, asegúrate de que no esté marcado como completado y añade la clase 'locked'
            if (isCourseCompleted(courseElement.dataset.courseId)) {
                courseElement.classList.remove('completed');
                saveCourseState(courseElement.dataset.courseId, false); // Quitar de localStorage
            }
            courseElement.classList.add('locked');
        }
    }

    // Función para actualizar el estado de TODOS los ramos
    function updateAllCourseStates(resetting = false) { // Añadimos un parámetro para saber si estamos reseteando
        // PASO 1: Reconstruir el Set de ramos completados desde localStorage
        completedCourses.clear();
        courses.forEach(course => {
            const courseId = course.dataset.courseId;
            if (localStorage.getItem(courseId) === 'completed') {
                completedCourses.add(courseId);
            }
        });

        // PASO 2: Iterar sobre todos los ramos para aplicar/remover clases
        courses.forEach(course => {
            const courseId = course.dataset.courseId;

            if (resetting) {
                // Si estamos en modo reseteo, forzamos la remoción de 'completed'
                course.classList.remove('completed');
                // Esto es crucial para la visualización del reset
            } else if (isCourseCompleted(courseId)) {
                // Si no estamos reseteando y el ramo está en completedCourses, asegúrate que tenga 'completed'
                course.classList.add('completed');
            } else {
                // Si no está en completedCourses, asegúrate de que NO tenga 'completed'
                course.classList.remove('completed'); 
            }
            
            // PASO 3: Después de manejar 'completed', actualiza el estado de bloqueo
            updateCourseVisualState(course);
        });
    }

    // Función para guardar el estado de un ramo en localStorage
    function saveCourseState(courseId, isCompleted) {
        if (isCompleted) {
            localStorage.setItem(courseId, 'completed');
            completedCourses.add(courseId); // Añadir al Set global
        } else {
            localStorage.removeItem(courseId);
            completedCourses.delete(courseId); // Eliminar del Set global
        }
        updateAllCourseStates(); // Volver a verificar todos los estados después de un cambio (sin reseteo)
    }

    // Event listener para cada ramo
    courses.forEach(course => {
        course.addEventListener('click', () => {
            const courseId = course.dataset.courseId;

            // Solo permite marcar/desmarcar si el ramo NO está bloqueado
            if (!course.classList.contains('locked')) {
                const isCompleted = course.classList.toggle('completed');
                saveCourseState(courseId, isCompleted);
            } else {
                alert('¡Este ramo está bloqueado! Debes aprobar sus prerrequisitos primero.');
            }
        });
    });

    // Event listener para el botón de restablecer
    resetButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restablecer todos los ramos? Esto borrará tu progreso.')) {
            localStorage.clear(); // Borra todo el localStorage
            // Llamamos a updateAllCourseStates con 'true' para indicar que estamos reseteando
            updateAllCourseStates(true); 
            alert('¡Malla restablecida! Todos los ramos han sido desmarcados y bloqueados según sus prerrequisitos.');
        }
    });

    // Cargar los estados iniciales de los ramos cuando la página se carga
    updateAllCourseStates(); // Primera carga (sin reseteo)
});
