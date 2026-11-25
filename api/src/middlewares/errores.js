import multer from 'multer';

// Ruta inexistente dentro de la API.
export function noEncontrada(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores (Express lo reconoce por tener 4 parámetros).
// Los controladores hacen next(err) y todo termina acá.
export function manejarErrores(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El PDF no puede superar los 10 MB' });
  }
  if (err.code === 'INVALID_PDF_TYPE') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'PDF_PREVIEW_FAILED') {
    return res.status(422).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'La carga del archivo no es válida' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'No se puede eliminar: hay datos que dependen de este registro' });
  }
  console.error(err); // el detalle queda en el servidor, nunca se le muestra al cliente
  res.status(500).json({ error: 'Error interno del servidor' });
}
