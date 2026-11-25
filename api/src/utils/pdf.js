import { PDFDocument } from 'pdf-lib';

export const MAX_PDF_PREVIEW_PAGES = 30;

export function prepararPdf(archivo) {
  if (!archivo) return { error: null, pdf: null };

  const nombreOriginal = archivo.originalname
    .split(/[\\/]/)
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

  if (!nombreOriginal.toLowerCase().endsWith('.pdf')) {
    return { error: 'El archivo debe ser un PDF', pdf: null };
  }

  const firmaPdf = Buffer.from('%PDF-');
  if (
    !Buffer.isBuffer(archivo.buffer) ||
    !archivo.buffer.subarray(0, 1024).includes(firmaPdf)
  ) {
    return { error: 'El archivo seleccionado no parece ser un PDF válido', pdf: null };
  }

  const nombre = Array.from(nombreOriginal).slice(0, 255).join('');
  return {
    error: null,
    pdf: { nombre, contenido: archivo.buffer },
  };
}

export async function crearVistaPreviaPdf(contenido) {
  try {
    const original = await PDFDocument.load(contenido);
    const cantidad = Math.min(original.getPageCount(), MAX_PDF_PREVIEW_PAGES);
    if (cantidad === 0) throw new Error('El PDF no contiene páginas');

    const vistaPrevia = await PDFDocument.create();
    const paginas = await vistaPrevia.copyPages(
      original,
      Array.from({ length: cantidad }, (_, indice) => indice)
    );
    paginas.forEach((pagina) => vistaPrevia.addPage(pagina));
    return Buffer.from(await vistaPrevia.save());
  } catch {
    const error = new Error('No se pudo generar la vista previa de este PDF');
    error.code = 'PDF_PREVIEW_FAILED';
    throw error;
  }
}
