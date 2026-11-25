import { descargarArchivo, request } from './api.js';

function prepararCuerpo(datos) {
  const { archivo_pdf: archivoPdf, ...campos } = datos;
  if (!archivoPdf) return campos;

  const formulario = new FormData();
  for (const [campo, valor] of Object.entries(campos)) {
    formulario.append(campo, valor ?? '');
  }
  formulario.append('archivo_pdf', archivoPdf);
  return formulario;
}

// filtros: { buscar, estado, autorId }. Solo se envían los que tienen valor.
export function listarLibros({ buscar, estado, autorId } = {}, signal) {
  const params = new URLSearchParams();
  if (buscar?.trim()) params.set('buscar', buscar.trim());
  if (estado) params.set('estado', estado);
  if (autorId) params.set('autor_id', autorId);

  const consulta = params.toString();
  return request(`/libros${consulta ? `?${consulta}` : ''}`, { signal });
}

export function obtenerLibro(id, signal) {
  return request(`/libros/${id}`, { signal });
}

export function obtenerVistaPreviaLibro(id) {
  return descargarArchivo(`/libros/${id}/preview`);
}

export function crearLibro(datos) {
  return request('/libros', { metodo: 'POST', cuerpo: prepararCuerpo(datos) });
}

export function actualizarLibro(id, datos) {
  return request(`/libros/${id}`, { metodo: 'PUT', cuerpo: prepararCuerpo(datos) });
}

export async function descargarPdfLibro(id, nombre) {
  const archivo = await descargarArchivo(`/libros/${id}/pdf`);
  descargarBlob(archivo, nombre);
}

export function descargarBlob(archivo, nombre) {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function cambiarEstadoLibro(id, estado) {
  return request(`/libros/${id}/estado`, { metodo: 'PATCH', cuerpo: { estado } });
}

export function eliminarLibro(id) {
  return request(`/libros/${id}`, { metodo: 'DELETE' });
}
