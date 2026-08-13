document.addEventListener('DOMContentLoaded', () => {

    // 1. Lógica para mostrar/ocultar contraseña
    const btnVerPassword = document.getElementById('btnVerPassword');
    const inputPassword = document.getElementById('password');

    btnVerPassword.addEventListener('click', () => {
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnVerPassword.textContent = '🙈'; // Cambia el icono cuando se ve
        } else {
            inputPassword.type = 'password';
            btnVerPassword.textContent = '👁️'; // Vuelve al ojo normal
        }
    });

    // 2. Lógica del Login
    const formularioLogin = document.getElementById('formularioLogin');

    formularioLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const usuarioInput = document.getElementById('usuario').value.trim();
        const passwordValor = inputPassword.value;

        try {
            const respuesta = await fetch('http://localhost:3000/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: usuarioInput, password: passwordValor })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Guardamos datos
                localStorage.setItem('usuarioLCAW', JSON.stringify(datos.usuario));
                localStorage.setItem('rolLCAW', datos.rol);

                // Ocultamos formulario y mostramos pantalla de carga animada
                document.getElementById('contenedorFormulario').classList.add('oculto');
                document.getElementById('pantallaCarga').classList.remove('oculto');

                // Redirigimos después de 2 segundos
                setTimeout(() => {
                    window.location.href = './menu.html'; 
                }, 2000);

            } else {
                alert(datos.mensaje);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor. Revisa si tu backend está encendido.');
        }
    });

});