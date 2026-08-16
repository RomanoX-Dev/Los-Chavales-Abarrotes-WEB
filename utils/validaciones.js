// Validamos el usuario (Longitud y sin caracteres extraños)
export function esUsuarioValido(usuario) {
    const regexUsuarioSeguro = /^[a-zA-Z0-9_]+$/;
    if (usuario.length < 4) return { valido: false, mensaje: "El usuario debe tener al menos 4 caracteres." };
    if (!regexUsuarioSeguro.test(usuario)) return { valido: false, mensaje: "El usuario no puede contener espacios ni símbolos." };
    
    return { valido: true };
}

// Validamos la contraseña (Longitud y mayúsculas)
export function esPasswordValida(password) {
    const regexMayuscula = /[A-Z]/;
    if (password.length < 6) return { valido: false, mensaje: "La contraseña debe ser mayor a 6 caracteres." };
    if (!regexMayuscula.test(password)) return { valido: false, mensaje: "La contraseña debe incluir al menos una mayúscula." };
    
    return { valido: true };
}