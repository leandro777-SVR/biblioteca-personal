import { obtenerToken } from './sesion.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// El AuthContext registra acá qué hacer si el servidor responde 401 con sesión activa
// (token vencido): cerrar la sesión. Así este archivo no depende de React.
let alNoAutorizado = null;
export function setManejadorNoAutorizado(funcion) {
  alNoAutorizado = funcion;
}

// Único lugar de toda la app que llama a fetch.
export async function request(ruta, { metodo = 'GET', cuerpo, signal } = {}) {
  const headers = {};
  const esFormData = typeof FormData !== 'undefined' && cuerpo instanceof FormData;
  if (cuerpo !== undefined && !esFormData) headers['Content-Type'] = 'application/json';

  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`; // el JWT viaja en cada petición

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : esFormData ? cuerpo : JSON.stringify(cuerpo),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err; // petición cancelada a propósito
    throw new Error('No se pudo conectar con el servidor. Revisá que la API esté corriendo.');
  }

  // 204 No Content: salió bien pero NO hay cuerpo (llamar a .json() fallaría).
  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null); // parseo seguro

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token && alNoAutorizado) alNoAutorizado();
    const error = new Error(datos?.error ?? `Error ${respuesta.status}`);
    error.status = respuesta.status;
    error.detalles = datos?.detalles ?? null; // errores por campo que manda la API
    throw error;
  }

  return datos;
}

export async function descargarArchivo(ruta) {
  const headers = {};
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisá que la API esté corriendo.');
  }

  if (respuesta.status === 401 && token && alNoAutorizado) alNoAutorizado();
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new Error(datos?.error ?? `Error ${respuesta.status}`);
  }

  return respuesta.blob();
}
