// utils/validaciones.js

// Validamos el usuario (Longitud y sin caracteres especiales salvo guion bajo)
export function esUsuarioValido(usuario) {
    if (!usuario || typeof usuario !== 'string') {
        return { valido: false, mensaje: "El usuario no es válido." };
    }
    
    const regexUsuarioSeguro = /^[a-zA-Z0-9_]+$/;
    if (usuario.length < 4) {
        return { valido: false, mensaje: "El usuario debe tener al menos 4 caracteres." };
    }
    if (!regexUsuarioSeguro.test(usuario)) {
        return { valido: false, mensaje: "El usuario no puede contener espacios ni símbolos." };
    }
    
    return { valido: true, mensaje: "Usuario válido." };
}

// Validamos la contraseña (Longitud mínima y al menos una letra mayúscula)
export function esPasswordValida(password) {
    if (!password || typeof password !== 'string') {
        return { valido: false, mensaje: "La contraseña no es válida." };
    }

    const regexMayuscula = /[A-Z]/;
    if (password.length < 6) {
        return { valido: false, mensaje: "La contraseña debe ser mayor a 6 caracteres." };
    }
    if (!regexMayuscula.test(password)) {
        return { valido: false, mensaje: "La contraseña debe incluir al menos una letra mayúscula." };
    }
    
    return { valido: true, mensaje: "Contraseña válida." };
}