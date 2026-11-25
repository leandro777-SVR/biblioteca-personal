import { request } from './api.js';

export function listarAutores(signal) {
  return request('/autores', { signal });
}

export function crearAutor(datos) {
  return request('/autores', { metodo: 'POST', cuerpo: datos });
}

export function eliminarAutor(id) {
  return request(`/autores/${id}`, { metodo: 'DELETE' });
}
