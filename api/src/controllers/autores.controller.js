import {
  listarAutores,
  obtenerAutor,
  crearAutor,
  eliminarAutor,
} from '../models/autores.model.js';
import { parsearId, texto } from '../utils/validaciones.js';

// GET /api/autores  ->  200 [autores del usuario logueado]
export async function listar(req, res, next) {
  try {
    res.json(await listarAutores(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

// POST /api/autores  ->  201 autor creado
export async function crear(req, res, next) {
  try {
    const nombre = texto(req.body?.nombre);
    const nacionalidad = texto(req.body?.nacionalidad);

    const detalles = {};
    if (!nombre) detalles.nombre = 'El nombre es obligatorio';
    else if (nombre.length > 150) detalles.nombre = 'El nombre no puede superar los 150 caracteres';
    if (nacionalidad.length > 100) {
      detalles.nacionalidad = 'La nacionalidad no puede superar los 100 caracteres';
    }
    if (Object.keys(detalles).length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', detalles });
    }

    try {
      const autor = await crearAutor(req.usuario.id, {
        nombre,
        nacionalidad: nacionalidad || null,
      });
      res.status(201).json(autor);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya cargaste un autor con ese nombre' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// DELETE /api/autores/:id  ->  204 | 400 | 404 | 409
export async function eliminar(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const autor = await obtenerAutor(id, req.usuario.id);
    if (!autor) return res.status(404).json({ error: 'Autor no encontrado' });

    if (autor.cantidad_libros > 0) {
      return res
        .status(409)
        .json({ error: 'No se puede eliminar un autor que tiene libros cargados' });
    }

    await eliminarAutor(id, req.usuario.id);
    res.status(204).end(); // 204 = salió bien y no hay cuerpo
  } catch (err) {
    next(err);
  }
}
