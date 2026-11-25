import jwt from 'jsonwebtoken';

// Protege las rutas: exige "Authorization: Bearer <token>", verifica firma y
// vencimiento, y deja los datos del usuario en req.usuario para los controladores.
export function requiereAutenticacion(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Falta el token de autenticación' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, email, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
