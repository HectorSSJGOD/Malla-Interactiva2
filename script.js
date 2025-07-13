document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const resetButton = document.getElementById('resetButton');

    // Función para cargar el estado de los ramos desde localStorage
    function loadCourseStates() {
        courses.forEach(course => {
            const courseId = course.dataset.courseId;
            // Verifica si el ramo está marcado como 'completed' en localStorage
            if (localStorage.getItem(courseId) === 'completed') {
                course.classList.add('completed');
            } else {
                course.classList.remove('completed'); // Asegúrate de que no tenga la clase si no está en localStorage
            }
        });
    }

    // Función para guardar el estado de un ramo en localStorage
    function saveCourseState(courseId, isCompleted) {
        if (isCompleted) {
            localStorage.setItem(courseId, 'completed');
        } else {
            localStorage.removeItem(courseId); // Elimina el item si ya no está completado
        }
    }

    // Añadir el event listener a cada ramo
    courses.forEach(course => {
        course.addEventListener('click', () => {
            const courseId = course.dataset.courseId;
            const isCompleted = course.classList.toggle('completed'); // Alterna la clase 'completed'
            saveCourseState(courseId, isCompleted); // Guarda el nuevo estado
        });
    });

    // Event listener para el botón de restablecer
    resetButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restablecer todos los ramos? Esto borrará tu progreso.')) {
            localStorage.clear(); // Borra todo el localStorage
            loadCourseStates(); // Recarga los estados para reflejar el cambio
            alert('¡Malla restablecida! Todos los ramos han sido desmarcados.');
        }
    });

    // Cargar los estados de los ramos cuando la página se carga
    loadCourseStates();
});
