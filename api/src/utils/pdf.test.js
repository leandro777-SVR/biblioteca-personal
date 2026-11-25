import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { crearVistaPreviaPdf, prepararPdf } from './pdf.js';

test('prepara un PDF conservando su nombre y contenido', () => {
  const contenido = Buffer.from('%PDF-1.7\ncontenido de prueba');
  const resultado = prepararPdf({ originalname: 'mi-libro.pdf', buffer: contenido });

  assert.equal(resultado.error, null);
  assert.equal(resultado.pdf.nombre, 'mi-libro.pdf');
  assert.deepEqual(resultado.pdf.contenido, contenido);
});

test('rechaza archivos con extensión PDF pero sin firma PDF', () => {
  const resultado = prepararPdf({
    originalname: 'no-es-pdf.pdf',
    buffer: Buffer.from('contenido cualquiera'),
  });

  assert.match(resultado.error, /no parece ser un PDF válido/);
  assert.equal(resultado.pdf, null);
});

test('la vista previa de un PDF de más de 30 páginas contiene solo las primeras 30', async () => {
  const original = await PDFDocument.create();
  for (let pagina = 1; pagina <= 35; pagina += 1) original.addPage([pagina, 100]);

  const vistaPrevia = await crearVistaPreviaPdf(Buffer.from(await original.save()));
  const documento = await PDFDocument.load(vistaPrevia);

  assert.equal(documento.getPageCount(), 30);
  assert.equal(documento.getPage(0).getWidth(), 1);
  assert.equal(documento.getPage(29).getWidth(), 30);
});

test('la vista previa conserva todas las páginas si son menos de 30', async () => {
  const original = await PDFDocument.create();
  original.addPage();
  original.addPage();

  const vistaPrevia = await crearVistaPreviaPdf(Buffer.from(await original.save()));
  const documento = await PDFDocument.load(vistaPrevia);

  assert.equal(documento.getPageCount(), 2);
});

test('informa si el archivo no se puede procesar como PDF', async () => {
  await assert.rejects(
    crearVistaPreviaPdf(Buffer.from('no es un PDF')),
    { code: 'PDF_PREVIEW_FAILED' }
  );
});
