import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import autoresRoutes from './routes/autores.routes.js';
import librosRoutes from './routes/libros.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import { noEncontrada, manejarErrores } from './middlewares/errores.js';

const app = express();

// CORS: solo el frontend configurado puede llamar a la API desde el navegador.
// El navegador manda antes una petición OPTIONS (preflight) y cors() la responde.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json()); // convierte el cuerpo JSON en req.body

app.get('/api/salud', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/autores', autoresRoutes);
app.use('/api/libros', librosRoutes);
app.use('/api/catalogo', catalogoRoutes);

app.use(noEncontrada);
app.use(manejarErrores);

export default app;
