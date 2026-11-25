import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/requiereAutenticacion.js';
import { cargarPdf } from '../middlewares/subirPdf.js';
import {
  listar,
  obtener,
  descargarPdf,
  vistaPrevia,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
} from '../controllers/libros.controller.js';

const router = Router();

router.use(requiereAutenticacion); // todas las rutas de este archivo exigen token

router.get('/', listar);
router.get('/:id', obtener);
router.get('/:id/pdf', descargarPdf);
router.get('/:id/preview', vistaPrevia);
router.post('/', cargarPdf, crear);
router.put('/:id', cargarPdf, actualizar);
router.patch('/:id/estado', cambiarEstado);
router.delete('/:id', eliminar);

export default router;
