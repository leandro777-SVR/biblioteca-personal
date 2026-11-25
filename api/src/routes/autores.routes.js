import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/requiereAutenticacion.js';
import { listar, crear, eliminar } from '../controllers/autores.controller.js';

const router = Router();

router.use(requiereAutenticacion); // todas las rutas de este archivo exigen token

router.get('/', listar);
router.post('/', crear);
router.delete('/:id', eliminar);

export default router;
