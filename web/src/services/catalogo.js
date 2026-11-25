import { descargarArchivo, request } from './api.js';
import { descargarBlob } from './libros.js';

export function listarCatalogo(buscar = '', signal) {
  const params = new URLSearchParams();
  if (buscar.trim()) params.set('buscar', buscar.trim());
  const consulta = params.toString();
  return request(`/catalogo${consulta ? `?${consulta}` : ''}`, { signal });
}

export function obtenerVistaPreviaCatalogo(id) {
  return descargarArchivo(`/catalogo/${id}/preview`);
}

export async function descargarPdfCatalogo(id, nombre) {
  const archivo = await descargarArchivo(`/catalogo/${id}/pdf`);
  descargarBlob(archivo, nombre);
}
