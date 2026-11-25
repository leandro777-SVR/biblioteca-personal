import {
  listarLibros,
  obtenerLibro,
  obtenerPdfLibro,
  obtenerPdfCatalogo,
  listarLibrosCatalogo,
  crearLibro,
  actualizarLibro,
  cambiarEstadoLibro,
  eliminarLibro,
} from '../models/libros.model.js';
import { obtenerAutor } from '../models/autores.model.js';
import { ESTADOS_VALIDOS, parsearId, texto } from '../utils/validaciones.js';
import { crearVistaPreviaPdf, prepararPdf } from '../utils/pdf.js';

const LICENCIAS_COMPARTIR = ['dominio_publico', 'licencia_abierta', 'permiso_titular'];

function leerBooleano(valor) {
  if ([true, 1, '1', 'true'].includes(valor)) return true;
  if ([false, 0, '0', 'false', undefined, null, ''].includes(valor)) return false;
  return null;
}

// Valida el cuerpo de POST y PUT. Devuelve los errores por campo y los datos ya limpios.
function validarLibro(body, tienePdf) {
  const detalles = {};
  const titulo = texto(body?.titulo);
  const genero = texto(body?.genero);
  const notas = texto(body?.notas);
  const estado = body?.estado ?? 'pendiente';
  const autorId = parsearId(body?.autor_id);
  const compartirCatalogo = leerBooleano(body?.compartir_catalogo);
  const descargaPublica = leerBooleano(body?.descarga_publica);
  const confirmaDerechos = leerBooleano(body?.confirma_derechos);
  const confirmaDescarga = leerBooleano(body?.confirma_descarga);
  const licenciaCompartir = body?.licencia_compartir;

  if (!titulo) detalles.titulo = 'El título es obligatorio';
  else if (titulo.length > 200) detalles.titulo = 'El título no puede superar los 200 caracteres';

  if (!autorId) detalles.autor_id = 'Elegí un autor';

  if (genero.length > 100) detalles.genero = 'El género no puede superar los 100 caracteres';

  if (!ESTADOS_VALIDOS.includes(estado)) {
    detalles.estado = `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`;
  }

  if (notas.length > 2000) detalles.notas = 'Las notas no pueden superar los 2000 caracteres';
  if (compartirCatalogo === null) {
    detalles.compartir_catalogo = 'La opción de publicación no es válida';
  }
  if (descargaPublica === null) {
    detalles.descarga_publica = 'La opción de descarga no es válida';
  }
  if (compartirCatalogo && !tienePdf) {
    detalles.archivo_pdf = 'Adjuntá un PDF para publicar este libro';
  }
  if (compartirCatalogo && !LICENCIAS_COMPARTIR.includes(licenciaCompartir)) {
    detalles.licencia_compartir = 'Seleccioná los derechos con los que compartís este PDF';
  }
  if (compartirCatalogo && confirmaDerechos !== true) {
    detalles.confirma_derechos = 'Confirmá que tenés derecho a compartir este PDF';
  }
  if (compartirCatalogo && descargaPublica && confirmaDescarga !== true) {
    detalles.confirma_descarga = 'Confirmá que tenés autorización para ofrecer la descarga completa';
  }
  if (!compartirCatalogo && descargaPublica) {
    detalles.descarga_publica = 'Para habilitar descargas primero publicá el libro';
  }

  return {
    detalles,
    datos: {
      titulo,
      autor_id: autorId,
      genero: genero || null,
      estado,
      notas: notas || null,
      compartir_catalogo: compartirCatalogo === true,
      licencia_compartir: compartirCatalogo ? licenciaCompartir : null,
      descarga_publica: compartirCatalogo && descargaPublica === true,
    },
  };
}

// El autor tiene que existir Y ser del mismo usuario (si no, podría "colgarse" de autores ajenos).
async function autorEsDelUsuario(autorId, usuarioId) {
  return Boolean(await obtenerAutor(autorId, usuarioId));
}

// GET /api/libros?buscar=&estado=&autor_id=
export async function listar(req, res, next) {
  try {
    const { buscar, estado, autor_id: autorIdCrudo } = req.query;
    const filtros = {};

    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: 'El estado del filtro no es válido' });
      }
      filtros.estado = estado;
    }
    if (autorIdCrudo) {
      const autorId = parsearId(autorIdCrudo);
      if (!autorId) return res.status(400).json({ error: 'El autor del filtro no es válido' });
      filtros.autorId = autorId;
    }
    if (typeof buscar === 'string' && buscar.trim()) {
      filtros.buscar = buscar.trim().slice(0, 100);
    }

    res.json(await listarLibros(req.usuario.id, filtros));
  } catch (err) {
    next(err);
  }
}

// GET /api/libros/:id
export async function obtener(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const libro = await obtenerLibro(id, req.usuario.id);
    // 404 tanto si no existe como si es de otro usuario: no revelamos que el id existe.
    if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });

    res.json(libro);
  } catch (err) {
    next(err);
  }
}

// GET /api/libros/:id/pdf -> descarga el PDF del libro del usuario autenticado
export async function descargarPdf(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const pdf = await obtenerPdfLibro(id, req.usuario.id);
    if (!pdf) return res.status(404).json({ error: 'PDF no encontrado' });

    res.type('application/pdf');
    res.attachment(pdf.pdf_nombre);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(pdf.pdf_contenido);
  } catch (err) {
    next(err);
  }
}

// GET /api/libros/:id/preview -> PDF con un máximo de 30 páginas del usuario autenticado
export async function vistaPrevia(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const pdf = await obtenerPdfLibro(id, req.usuario.id);
    if (!pdf) return res.status(404).json({ error: 'PDF no encontrado' });

    const vistaPreviaPdf = await crearVistaPreviaPdf(pdf.pdf_contenido);
    res.type('application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="vista-previa.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(vistaPreviaPdf);
  } catch (err) {
    next(err);
  }
}

// GET /api/catalogo -> libros publicados explícitamente por sus usuarios
export async function listarCatalogo(req, res, next) {
  try {
    const buscar = typeof req.query.buscar === 'string' ? req.query.buscar.trim().slice(0, 100) : '';
    res.json(await listarLibrosCatalogo(buscar));
  } catch (err) {
    next(err);
  }
}

// GET /api/catalogo/:id/preview -> preview publicado, limitado a 30 páginas
export async function vistaPreviaCatalogo(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const pdf = await obtenerPdfCatalogo(id);
    if (!pdf) return res.status(404).json({ error: 'Libro compartido no encontrado' });

    const vistaPreviaPdf = await crearVistaPreviaPdf(pdf.pdf_contenido);
    res.type('application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="vista-previa.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(vistaPreviaPdf);
  } catch (err) {
    next(err);
  }
}

// GET /api/catalogo/:id/pdf -> descarga completa solo con permiso declarado
export async function descargarPdfCatalogo(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const pdf = await obtenerPdfCatalogo(id);
    if (!pdf) return res.status(404).json({ error: 'Libro compartido no encontrado' });
    if (!pdf.descarga_publica) {
      return res.status(403).json({ error: 'El titular no habilitó la descarga completa' });
    }

    res.type('application/pdf');
    res.attachment(pdf.pdf_nombre);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(pdf.pdf_contenido);
  } catch (err) {
    next(err);
  }
}

// POST /api/libros  ->  201 libro creado
export async function crear(req, res, next) {
  try {
    const { detalles, datos } = validarLibro(req.body, Boolean(req.file));
    if (Object.keys(detalles).length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', detalles });
    }
    if (!(await autorEsDelUsuario(datos.autor_id, req.usuario.id))) {
      return res
        .status(400)
        .json({ error: 'Datos inválidos', detalles: { autor_id: 'El autor elegido no existe' } });
    }

    const { error: errorPdf, pdf } = prepararPdf(req.file);
    if (errorPdf) return res.status(400).json({ error: errorPdf });

    const libro = await crearLibro(req.usuario.id, {
      ...datos,
      pdf_nombre: pdf?.nombre ?? null,
      pdf_contenido: pdf?.contenido ?? null,
    });
    res.status(201).json(libro);
  } catch (err) {
    next(err);
  }
}

// PUT /api/libros/:id  ->  200 libro actualizado
export async function actualizar(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const libroActual = await obtenerLibro(id, req.usuario.id);
    if (!libroActual) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    const { detalles, datos } = validarLibro(req.body, Boolean(req.file || libroActual.pdf_nombre));
    if (Object.keys(detalles).length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', detalles });
    }
    if (!(await autorEsDelUsuario(datos.autor_id, req.usuario.id))) {
      return res
        .status(400)
        .json({ error: 'Datos inválidos', detalles: { autor_id: 'El autor elegido no existe' } });
    }

    const { error: errorPdf, pdf } = prepararPdf(req.file);
    if (errorPdf) return res.status(400).json({ error: errorPdf });

    res.json(
      await actualizarLibro(id, req.usuario.id, {
        ...datos,
        pdf_nombre: pdf?.nombre ?? null,
        pdf_contenido: pdf?.contenido ?? null,
      })
    );
  } catch (err) {
    next(err);
  }
}

// PATCH /api/libros/:id/estado  ->  200 libro actualizado (solo cambia el estado)
export async function cambiarEstado(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const estado = req.body?.estado;
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: { estado: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` },
      });
    }

    if (!(await obtenerLibro(id, req.usuario.id))) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    res.json(await cambiarEstadoLibro(id, req.usuario.id, estado));
  } catch (err) {
    next(err);
  }
}

// DELETE /api/libros/:id  ->  204
export async function eliminar(req, res, next) {
  try {
    const id = parsearId(req.params.id);
    if (!id) return res.status(400).json({ error: 'El id no es válido' });

    const eliminado = await eliminarLibro(id, req.usuario.id);
    if (!eliminado) return res.status(404).json({ error: 'Libro no encontrado' });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
