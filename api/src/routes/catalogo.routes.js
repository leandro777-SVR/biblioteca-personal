import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/requiereAutenticacion.js';
import {
  descargarPdfCatalogo,
  listarCatalogo,
  vistaPreviaCatalogo,
} from '../controllers/libros.controller.js';

const router = Router();

router.use(requiereAutenticacion);

router.get('/', listarCatalogo);
router.get('/:id/preview', vistaPreviaCatalogo);
router.get('/:id/pdf', descargarPdfCatalogo);

export default router;
