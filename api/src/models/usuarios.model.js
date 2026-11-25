import { pool } from '../config/db.js';

export async function crearUsuario({ nombre, apellido, email, passwordHash }) {
  const [resultado] = await pool.execute(
    'INSERT INTO usuarios (nombre, apellido, email, password_hash) VALUES (?, ?, ?, ?)',
    [nombre, apellido, email, passwordHash]
  );
  return { id: resultado.insertId, nombre, apellido, email };
}

export async function buscarPorEmail(email) {
  const [filas] = await pool.execute(
    'SELECT id, nombre, apellido, email, password_hash FROM usuarios WHERE email = ?',
    [email]
  );
  return filas[0] ?? null;
}
