document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const semesters = document.querySelectorAll('.semester'); // Seleccionamos todos los semestres
    const resetButton = document.getElementById('resetButton');
    const mallaGridContainer = document.querySelector('.malla-grid-container'); // El contenedor que haremos scroll

    let completedCourses = new Set();

    function isCourseCompleted(courseId) {
        return completedCourses.has(courseId);
    }

    function isCourseUnlocked(courseElement) {
        const prerequisitesAttr = courseElement.dataset.prerequisites;
        if (!prerequisitesAttr) {
            return true;
        }
        const prerequisites = prerequisitesAttr.split(',').map(id => id.trim());
        return prerequisites.every(prereqId => isCourseCompleted(prereqId));
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
        if (!mallaGridContainer) return; // Asegúrate de que el contenedor exista

        let lastCompletedSemesterIndex = -1;

        // Encontramos el índice del último semestre que contiene un ramo completado
        semesters.forEach((semester, index) => {
            const semesterCourses = semester.querySelectorAll('.course');
            const hasCompletedCourse = Array.from(semesterCourses).some(course => isCourseCompleted(course.dataset.courseId));
            if (hasCompletedCourse) {
                lastCompletedSemesterIndex = index;
            }
        });

        // Si hay ramos completados y es un semestre posterior al primero
        if (lastCompletedSemesterIndex > 0) {
            const targetSemester = semesters[lastCompletedSemesterIndex];
            const semesterOffsetLeft = targetSemester.offsetLeft;
            const containerScrollLeft = mallaGridContainer.scrollLeft;
            const containerWidth = mallaGridContainer.offsetWidth;

            // Calculamos la posición para que el semestre esté visible o cerca del centro
            // Ajustamos el desplazamiento para que el semestre quede más o menos en el centro de la vista
            // o al menos completamente visible si es uno de los primeros
            const scrollPosition = semesterOffsetLeft - (containerWidth / 4); // Desplazarlo un cuarto de pantalla desde la izquierda
            
            mallaGridContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth' // Desplazamiento suave
            });
        } else if (lastCompletedSemesterIndex === -1 && mallaGridContainer.scrollLeft > 0) {
            // Si no hay ramos completados (o se resetearon), volvemos al inicio
            mallaGridContainer.scrollTo({
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

        // Llamamos a la función de desplazamiento después de actualizar todos los estados
        scrollToCurrentProgress(); 
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
        updateAllCourseStates(); // Se llama sin el parámetro 'resetting'
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
            updateAllCourseStates(true); // Llamamos con 'true' para forzar el reseteo visual
            alert('¡Malla restablecida! Todos los ramos han sido desmarcados y bloqueados según sus prerrequisitos.');
        }
    });

    // Cargar los estados iniciales y desplazar al cargar la página
    updateAllCourseStates();
});
