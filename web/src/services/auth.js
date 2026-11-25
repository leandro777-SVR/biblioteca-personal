import { request } from './api.js';

export function login({ email, password }) {
  return request('/auth/login', { metodo: 'POST', cuerpo: { email, password } });
}

export function registro({ nombre, apellido, email, password }) {
  return request('/auth/registro', { metodo: 'POST', cuerpo: { nombre, apellido, email, password } });
}
