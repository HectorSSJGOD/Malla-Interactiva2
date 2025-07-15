document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const semesters = document.querySelectorAll('.semester');
    const resetButton = document.getElementById('resetButton');
    
    // CAMBIO CLAVE AQUÍ: Aseguramos que 'mallaGridContainer' sea el elemento que realmente tiene el overflow-x
    // Es el '.container' el que tiene 'overflow-x: auto;' en nuestro CSS.
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
        if (!scrollContainer) return; // Asegúrate de que el contenedor de scroll exista

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
        if (lastCompletedSemesterIndex > -1) { // Cambiado a -1 para incluir el semestre 0 si tiene ramos
            const targetSemester = semesters[lastCompletedSemesterIndex];
            
            // Calculamos la posición del semestre relativo al contenedor de scroll
            // .offsetLeft da la posición relativa al offsetParent más cercano.
            // .scrollLeft del contenedor es su posición actual.
            // Para centrar el elemento, restamos la mitad del ancho del contenedor y la mitad del ancho del elemento.
            const semesterPositionInContainer = targetSemester.offsetLeft - scrollContainer.offsetLeft; // Posición relativa dentro del contenedor scrollable
            const scrollOffset = (scrollContainer.offsetWidth - targetSemester.offsetWidth) / 2; // Offset para centrar

            let scrollPosition = semesterPositionInContainer - scrollOffset;
            
            // Asegurarse de no hacer scroll más allá del inicio (0)
            if (scrollPosition < 0) {
                scrollPosition = 0;
            }

            scrollContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        } else if (scrollContainer.scrollLeft > 0) {
            // Si no hay ramos completados, volvemos al inicio solo si no estamos ya al inicio
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
