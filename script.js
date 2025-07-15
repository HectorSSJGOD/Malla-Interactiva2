document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const semesters = document.querySelectorAll('.semester');
    const resetButton = document.getElementById('resetButton');
    const scrollContainer = document.querySelector('.container'); 

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
        if (!scrollContainer) return;

        let lastCompletedSemesterIndex = -1;

        semesters.forEach((semester, index) => {
            const semesterCourses = semester.querySelectorAll('.course');
            const hasCompletedCourse = Array.from(semesterCourses).some(course => isCourseCompleted(course.dataset.courseId));
            if (hasCompletedCourse) {
                lastCompletedSemesterIndex = index;
            }
        });

        if (lastCompletedSemesterIndex > -1) {
            const targetSemester = semesters[lastCompletedSemesterIndex];
            
            // --- INICIO DEL AJUSTE ---
            // Calcular la posición para que el semestre de destino quede visible,
            // con un pequeño margen desde el borde izquierdo del contenedor de scroll.
            const margin = 50; // Margen en píxeles desde el borde izquierdo. Puedes ajustar este valor.
            let scrollPosition = targetSemester.offsetLeft - scrollContainer.offsetLeft - margin;

            // Asegurarse de no hacer scroll más allá del inicio (0)
            if (scrollPosition < 0) {
                scrollPosition = 0;
            }
            // --- FIN DEL AJUSTE ---

            scrollContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        } else if (scrollContainer.scrollLeft > 0) {
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

    updateAllCourseStates();
});
