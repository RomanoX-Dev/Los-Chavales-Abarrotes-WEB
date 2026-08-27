// Validamos el usuario (Longitud mínima de 4 y sin caracteres especiales salvo guion bajo)
export function esUsuarioValido(usuario) {
    if (!usuario || typeof usuario !== 'string') {
        return { valido: false, mensaje: "El usuario no es válido." };
    }
    
    const regexUsuarioSeguro = /^[a-zA-Z0-9_]+$/;
    if (usuario.length < 4) {
        return { valido: false, mensaje: "El usuario debe tener al menos 4 caracteres." };
    }
    if (!regexUsuarioSeguro.test(usuario)) {
        return { valido: false, mensaje: "El usuario no puede contener espacios ni símbolos especiales." };
    }
    
    return { valido: true, mensaje: "Usuario válido." };
}

// Validamos la contraseña (Longitud mínima de 6 caracteres)
export function esPasswordValida(password) {
    if (!password || typeof password !== 'string') {
        return { valido: false, mensaje: "La contraseña no es válida." };
    }

    if (password.length < 6) {
        return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
    }
    
    return { valido: true, mensaje: "Contraseña válida." };
}