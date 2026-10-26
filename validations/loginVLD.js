// Validamos el usuario (Entre 4 y 50 caracteres, sin símbolos especiales salvo guion bajo)
export function esUsuarioValido(usuario) {
    if (!usuario || typeof usuario !== 'string') {
        return { valido: false, mensaje: "El usuario no es válido." };
    }
    
    const usuarioLimpio = usuario.trim();
    const regexUsuarioSeguro = /^[a-zA-Z0-9_]+$/;

    if (usuarioLimpio.length < 4) {
        return { valido: false, mensaje: "El usuario debe tener al menos 4 caracteres." };
    }

    if (usuarioLimpio.length > 30) {
        return { valido: false, mensaje: "El usuario no puede exceder los 30 caracteres." };
    }

    if (!regexUsuarioSeguro.test(usuarioLimpio)) {
        return { valido: false, mensaje: "El usuario solo permite letras, números y guion bajo (_)." };
    }
    
    return { valido: true, mensaje: "Usuario válido." };
}

// Validamos la contraseña (Entre 6 y 72 caracteres)
export function esPasswordValida(password) {
    if (!password || typeof password !== 'string') {
        return { valido: false, mensaje: "La contraseña no es válida." };
    }

    if (password.length < 6) {
        return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
    }

    if (password.length > 40) {
        return { valido: false, mensaje: "La contraseña no puede exceder los 40 caracteres." };
    }
    
    return { valido: true, mensaje: "Contraseña válida." };
}