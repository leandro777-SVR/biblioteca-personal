import { pool } from '../config/db.js';

// JOIN con autores para devolver también el nombre del autor.
const SELECT_LIBRO = `
  SELECT l.id, l.titulo, l.genero, l.estado, l.notas, l.autor_id,
         l.pdf_nombre, l.compartir_catalogo, l.licencia_compartir, l.descarga_publica,
         a.nombre AS autor_nombre, l.creado_en
  FROM libros l
  JOIN autores a ON a.id = l.autor_id`;

export async function listarLibros(usuarioId, { buscar, estado, autorId } = {}) {
  // La consulta se arma con condiciones opcionales, pero SIEMPRE con valores
  // parametrizados (?) para evitar inyección SQL.
  const condiciones = ['l.usuario_id = ?'];
  const parametros = [usuarioId];

  if (buscar) {
    condiciones.push('(l.titulo LIKE ? OR a.nombre LIKE ?)');
    parametros.push(`%${buscar}%`, `%${buscar}%`);
  }
  if (estado) {
    condiciones.push('l.estado = ?');
    parametros.push(estado);
  }
  if (autorId) {
    condiciones.push('l.autor_id = ?');
    parametros.push(autorId);
  }

  const [filas] = await pool.execute(
    `${SELECT_LIBRO} WHERE ${condiciones.join(' AND ')} ORDER BY l.creado_en DESC, l.id DESC`,
    parametros
  );
  return filas;
}

export async function obtenerLibro(id, usuarioId) {
  const [filas] = await pool.execute(
    `${SELECT_LIBRO} WHERE l.id = ? AND l.usuario_id = ?`,
    [id, usuarioId]
  );
  return filas[0] ?? null;
}

export async function obtenerPdfLibro(id, usuarioId) {
  const [filas] = await pool.execute(
    `SELECT pdf_nombre, pdf_contenido
     FROM libros
     WHERE id = ? AND usuario_id = ? AND pdf_contenido IS NOT NULL`,
    [id, usuarioId]
  );
  return filas[0] ?? null;
}

export async function listarLibrosCatalogo(buscar = '') {
  const condiciones = ['l.compartir_catalogo = 1', 'l.pdf_contenido IS NOT NULL'];
  const parametros = [];

  if (buscar) {
    condiciones.push('(l.titulo LIKE ? OR a.nombre LIKE ? OR l.genero LIKE ?)');
    parametros.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  }

  const [filas] = await pool.execute(
    `SELECT l.id, l.titulo, l.genero, l.pdf_nombre, l.licencia_compartir, l.descarga_publica,
            a.nombre AS autor_nombre, a.nacionalidad
     FROM libros l
     JOIN autores a ON a.id = l.autor_id
     WHERE ${condiciones.join(' AND ')}
     ORDER BY l.creado_en DESC, l.id DESC`,
    parametros
  );
  return filas;
}

export async function obtenerPdfCatalogo(id) {
  const [filas] = await pool.execute(
    `SELECT l.id, l.titulo, l.pdf_nombre, l.pdf_contenido, l.licencia_compartir, l.descarga_publica
     FROM libros l
     WHERE l.id = ? AND l.compartir_catalogo = 1 AND l.pdf_contenido IS NOT NULL`,
    [id]
  );
  return filas[0] ?? null;
}

export async function crearLibro(usuarioId, {
  titulo,
  autor_id,
  genero,
  estado,
  notas,
  pdf_nombre,
  pdf_contenido,
  compartir_catalogo,
  licencia_compartir,
  descarga_publica,
}) {
  const [resultado] = await pool.execute(
    `INSERT INTO libros (
       usuario_id, autor_id, titulo, genero, estado, notas, pdf_nombre, pdf_contenido,
       compartir_catalogo, licencia_compartir, descarga_publica
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      usuarioId,
      autor_id,
      titulo,
      genero,
      estado,
      notas,
      pdf_nombre,
      pdf_contenido,
      compartir_catalogo,
      licencia_compartir,
      descarga_publica,
    ]
  );
  return obtenerLibro(resultado.insertId, usuarioId);
}

export async function actualizarLibro(id, usuarioId, {
  titulo,
  autor_id,
  genero,
  estado,
  notas,
  pdf_nombre,
  pdf_contenido,
  compartir_catalogo,
  licencia_compartir,
  descarga_publica,
}) {
  await pool.execute(
    `UPDATE libros
     SET autor_id = ?, titulo = ?, genero = ?, estado = ?, notas = ?,
         pdf_nombre = COALESCE(?, pdf_nombre),
         pdf_contenido = COALESCE(?, pdf_contenido),
         compartir_catalogo = ?, licencia_compartir = ?, descarga_publica = ?
     WHERE id = ? AND usuario_id = ?`,
    [
      autor_id,
      titulo,
      genero,
      estado,
      notas,
      pdf_nombre ?? null,
      pdf_contenido ?? null,
      compartir_catalogo,
      licencia_compartir,
      descarga_publica,
      id,
      usuarioId,
    ]
  );
  return obtenerLibro(id, usuarioId);
}

export async function cambiarEstadoLibro(id, usuarioId, estado) {
  await pool.execute(
    'UPDATE libros SET estado = ? WHERE id = ? AND usuario_id = ?',
    [estado, id, usuarioId]
  );
  return obtenerLibro(id, usuarioId);
}

export async function eliminarLibro(id, usuarioId) {
  const [resultado] = await pool.execute(
    'DELETE FROM libros WHERE id = ? AND usuario_id = ?',
    [id, usuarioId]
  );
  return resultado.affectedRows > 0;
}
