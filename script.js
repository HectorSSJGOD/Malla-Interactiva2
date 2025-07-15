document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const semesters = document.querySelectorAll('.semester');
    const resetButton = document.getElementById('resetButton');
    const scrollContainer = document.querySelector('.container'); 

    let completedCourses = new Set();

    // --- FUNCIÓN PARA APLICAR ESTILOS DE SCROLL DINÁMICAMENTE ---
    function applyMobileScrollStyles() {
        if (scrollContainer) {
            if (window.innerWidth <= 768) {
                // Forzamos los estilos para scroll vertical en móvil
                scrollContainer.style.overflowX = 'hidden';
                scrollContainer.style.overflowY = 'auto';
                // Puedes ajustar el max-height aquí si es necesario, por ejemplo:
                // scrollContainer.style.maxHeight = 'calc(100vh - 30px)'; // Asegúrate de que 30px es el padding total del container
                // O simplemente darle una altura para que el contenido desborde
                // scrollContainer.style.height = '100%'; // Esto podría funcionar si el flex del body lo permite
            } else {
                // Restauramos los estilos de desktop
                scrollContainer.style.overflowX = 'auto';
                scrollContainer.style.overflowY = 'hidden';
                // scrollContainer.style.maxHeight = 'none'; // Quitar max-height fijo
                // scrollContainer.style.height = 'auto'; // O restaurar a auto
            }
        }
    }
    // --- FIN FUNCIÓN PARA APLICAR ESTILOS ---


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

    function isSemesterFullyCompleted(semesterElement) {
        const semesterCourses = semesterElement.querySelectorAll('.course');
        return Array.from(semesterCourses).every(course => isCourseCompleted(course.dataset.courseId));
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

    function scrollToCurrentProgress() {
        if (window.innerWidth <= 768) { 
            return; // No scroll horizontal en móvil
        }

        if (!scrollContainer) return;

        let lastFullyCompletedSemesterIndex = -1;

        semesters.forEach((semester, index) => {
            if (isSemesterFullyCompleted(semester)) {
                lastFullyCompletedSemesterIndex = index;
            }
        });

        if (lastFullyCompletedSemesterIndex > -1 && lastFullyCompletedSemesterIndex < semesters.length - 1) {
            const targetSemester = semesters[lastFullyCompletedSemesterIndex + 1]; 
            
            const margin = 50; 
            let scrollPosition = targetSemester.offsetLeft - scrollContainer.offsetLeft - margin;

            if (scrollPosition < 0) {
                scrollPosition = 0;
            }
            
            scrollContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        } else if (lastFullyCompletedSemesterIndex === -1 && scrollContainer.scrollLeft > 0) {
            scrollContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        }
    }

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

    courses.forEach(course => {
        course.addEventListener('click', (event) => { 
            const clickedCourse = event.target.closest('.course'); 
            if (!clickedCourse.classList.contains('locked')) {
                const isCompleted = clickedCourse.classList.toggle('completed');
                saveCourseState(clickedCourse.dataset.courseId, isCompleted);
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

    // --- CÓDIGO NUEVO PARA APLICAR ESTILOS AL CARGAR Y REDIMENSIONAR ---
    // Aplica los estilos al cargar la página
    applyMobileScrollStyles(); 
    // Vuelve a aplicar los estilos si la ventana se redimensiona (ej. girar el teléfono)
    window.addEventListener('resize', applyMobileScrollStyles);
    // --- FIN CÓDIGO NUEVO ---

    // Cargar los estados iniciales y desplazar al cargar la página
    updateAllCourseStates();
});
