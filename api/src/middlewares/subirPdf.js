import multer from 'multer';

export const TAMANO_MAX_PDF = 10 * 1024 * 1024;

function filtrarPdf(req, file, callback) {
  const nombre = file.originalname.split(/[\\/]/).pop() ?? '';
  if (!nombre.toLowerCase().endsWith('.pdf')) {
    const error = new Error('El archivo debe tener extensión .pdf');
    error.code = 'INVALID_PDF_TYPE';
    return callback(error);
  }
  callback(null, true);
}

export const cargarPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAX_PDF, files: 1 },
  fileFilter: filtrarPdf,
}).single('archivo_pdf');
