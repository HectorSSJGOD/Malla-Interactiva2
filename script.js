document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const semesters = document.querySelectorAll('.semester');
    const resetButton = document.getElementById('resetButton');
    const scrollContainer = document.querySelector('.container'); 

    let completedCourses = new Set();

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
        return prerequisites.every(prereqId => isCourseCompleted(prereqId));
    }

    // Función para verificar si un SEMESTRE ha sido completamente aprobado
    function isSemesterCompleted(semesterElement) {
        const semesterCourses = semesterElement.querySelectorAll('.course');
        // Un semestre está completado si TODOS sus ramos están en el Set de completedCourses Y NO están bloqueados
        return Array.from(semesterCourses).every(course => 
            isCourseCompleted(course.dataset.courseId) && !course.classList.contains('locked')
        );
    }

    function updateCourseVisualState(courseElement) {
        if (isCourseUnlocked(courseElement)) {
            courseElement.classList.remove('locked');
            if (!isCourseCompleted(courseElement.dataset.courseId)) {
                courseElement.classList.remove('completed');
            }
        } else {
            if (isCourseCompleted(courseElement.dataset.courseId)) {
                courseElement.classList.remove('completed');
                saveCourseState(courseElement.dataset.courseId, false);
            }
            courseElement.classList.add('locked');
        }
    }

    // Función para desplazar la malla horizontalmente
    function scrollToCurrentProgress() {
        // En móviles, el scroll es vertical y no necesitamos desplazamiento automático horizontal
        if (window.innerWidth <= 768) { // Usamos el breakpoint de tu CSS
            return;
        }

        if (!scrollContainer) return;

        let lastFullyCompletedSemesterIndex = -1;

        // Iteramos para encontrar el índice del último semestre *completamente* aprobado
        semesters.forEach((semester, index) => {
            if (isSemesterCompleted(semester)) {
                lastFullyCompletedSemesterIndex = index;
            }
        });

        // Si hay semestres completamente aprobados (y no es el último semestre de la lista)
        // Y el siguiente semestre existe, nos movemos al inicio del siguiente semestre.
        // Esto evita que el scroll avance si ya estás en el último semestre aprobado.
        if (lastFullyCompletedSemesterIndex > -1 && lastFullyCompletedSemesterIndex < semesters.length -1) {
            const targetSemester = semesters[lastFullyCompletedSemesterIndex + 1]; // Apunta al siguiente semestre
            
            const margin = 50; // Margen en píxeles desde el borde izquierdo.
            let scrollPosition = targetSemester.offsetLeft - scrollContainer.offsetLeft - margin;

            if (scrollPosition < 0) {
                scrollPosition = 0;
            }
            
            scrollContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        } else if (lastFullyCompletedSemesterIndex === -1 && scrollContainer.scrollLeft > 0) {
            // Si no hay semestres completados (o se resetearon), volvemos al inicio si no estamos ya allí
            scrollContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        }
    }

    // Función principal para actualizar todos los estados de los ramos
    function updateAllCourseStates(resetting = false) {
        completedCourses.clear();
        courses.forEach(course => {
            const courseId = course.dataset.courseId;
            if (localStorage.getItem(courseId) === 'completed') {
                completedCourses.add(courseId);
            }
        });

        courses.forEach(course => {
            if (resetting) {
                course.classList.remove('completed');
            } else if (isCourseCompleted(course.dataset.courseId)) {
                course.classList.add('completed');
            } else {
                course.classList.remove('completed');
            }
            updateCourseVisualState(course);
        });

        scrollToCurrentProgress(); // Llamamos a la función de desplazamiento después de actualizar todos los estados
    }

    // Función para guardar el estado de un ramo en localStorage
    function saveCourseState(courseId, isCompleted) {
        if (isCompleted) {
            localStorage.setItem(courseId, 'completed');
            completedCourses.add(courseId);
        } else {
            localStorage.removeItem(courseId);
            completedCourses.delete(courseId);
        }
        updateAllCourseStates();
    }

    // Event listeners
    courses.forEach(course => {
        course.addEventListener('click', () => {
            if (!course.classList.contains('locked')) {
                const isCompleted = course.classList.toggle('completed');
                saveCourseState(course.dataset.courseId, isCompleted);
            } else {
                alert('¡Este ramo está bloqueado! Debes aprobar sus prerrequisitos primero.');
            }
        });
    });

    resetButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restablecer todos los ramos? Esto borrará tu progreso.')) {
            localStorage.clear();
            updateAllCourseStates(true);
            alert('¡Malla restablecida! Todos los ramos han sido desmarcados y bloqueados según sus prerrequisitos.');
        }
    });

    // Cargar los estados iniciales y desplazar al cargar la página
    updateAllCourseStates();
});
