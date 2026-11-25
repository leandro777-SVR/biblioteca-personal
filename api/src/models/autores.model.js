import { pool } from '../config/db.js';

const SELECT_AUTOR = `
  SELECT a.id, a.nombre, a.nacionalidad, a.creado_en,
         (SELECT COUNT(*) FROM libros l WHERE l.autor_id = a.id) AS cantidad_libros
  FROM autores a`;

// Toda consulta filtra por usuario_id: así cada usuario solo ve lo suyo.
export async function listarAutores(usuarioId) {
  const [filas] = await pool.execute(
    `${SELECT_AUTOR} WHERE a.usuario_id = ? ORDER BY a.nombre`,
    [usuarioId]
  );
  return filas;
}

export async function obtenerAutor(id, usuarioId) {
  const [filas] = await pool.execute(
    `${SELECT_AUTOR} WHERE a.id = ? AND a.usuario_id = ?`,
    [id, usuarioId]
  );
  return filas[0] ?? null;
}

export async function crearAutor(usuarioId, { nombre, nacionalidad }) {
  const [resultado] = await pool.execute(
    'INSERT INTO autores (usuario_id, nombre, nacionalidad) VALUES (?, ?, ?)',
    [usuarioId, nombre, nacionalidad]
  );
  return obtenerAutor(resultado.insertId, usuarioId);
}

export async function eliminarAutor(id, usuarioId) {
  const [resultado] = await pool.execute(
    'DELETE FROM autores WHERE id = ? AND usuario_id = ?',
    [id, usuarioId]
  );
  return resultado.affectedRows > 0;
}
