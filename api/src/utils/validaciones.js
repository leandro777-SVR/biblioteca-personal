export const ESTADOS_VALIDOS = ['leido', 'pendiente', 'prestado'];

// Convierte un valor a un id entero positivo, o devuelve null si no lo es.
export function parsearId(valor) {
  if (typeof valor !== 'number' && typeof valor !== 'string') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Devuelve el texto sin espacios sobrantes ('' si no es un string).
export function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
