import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { crearUsuario, buscarPorEmail } from '../models/usuarios.model.js';
import { texto, emailValido } from '../utils/validaciones.js';

function firmarToken(usuario) {
  // El payload lleva lo mínimo (id y email). Nunca la contraseña.
  return jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });
}

// POST /api/auth/registro  ->  201 { token, usuario }
export async function registro(req, res, next) {
  try {
    const { password } = req.body ?? {};
    const nombre = texto(req.body?.nombre);
    const apellido = texto(req.body?.apellido);
    const email = texto(req.body?.email).toLowerCase();

    const detalles = {};
    if (!nombre) detalles.nombre = 'El nombre es obligatorio';
    else if (nombre.length > 100) detalles.nombre = 'El nombre no puede superar los 100 caracteres';
    if (!apellido) detalles.apellido = 'El apellido es obligatorio';
    else if (apellido.length > 100) detalles.apellido = 'El apellido no puede superar los 100 caracteres';

    if (!email) detalles.email = 'El email es obligatorio';
    else if (!emailValido(email) || email.length > 255) detalles.email = 'El email no es válido';

    if (typeof password !== 'string' || password.length < 8) {
      detalles.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (password.length > 72) {
      detalles.password = 'La contraseña no puede superar los 72 caracteres'; // límite de bcrypt
    }

    if (Object.keys(detalles).length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', detalles });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let usuario;
    try {
      usuario = await crearUsuario({ nombre, apellido, email, passwordHash });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
      }
      throw err;
    }

    res.status(201).json({ token: firmarToken(usuario), usuario });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login  ->  200 { token, usuario }
export async function login(req, res, next) {
  try {
    const { password } = req.body ?? {};
    const email = texto(req.body?.email).toLowerCase();

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'El email y la contraseña son obligatorios' });
    }

    const fila = await buscarPorEmail(email);
    const coincide = fila ? await bcrypt.compare(password, fila.password_hash) : false;

    // Mismo mensaje si falla el email o la clave: no revelamos cuál de los dos fue.
    if (!coincide) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const usuario = { id: fila.id, nombre: fila.nombre, apellido: fila.apellido, email: fila.email };
    res.json({ token: firmarToken(usuario), usuario });
  } catch (err) {
    next(err);
  }
}
