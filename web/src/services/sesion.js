// Guarda y lee la sesión (token + usuario) en localStorage.
// Es JavaScript puro: lo usan tanto api.js como el AuthContext.
const CLAVE = 'biblioteca_sesion';

export function leerSesion() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null; // JSON corrupto o localStorage bloqueado
  }
}

export function guardarSesion(sesion) {
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE);
}

export function obtenerToken() {
  return leerSesion()?.token ?? null;
}
