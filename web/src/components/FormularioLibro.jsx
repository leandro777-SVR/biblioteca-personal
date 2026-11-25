import { useRef, useState } from 'react';
import { ESTADOS } from '../constants/estados.js';
import Campo from './Campo.jsx';

const TAMANO_MAX_PDF = 10 * 1024 * 1024;

// Orden en el que se revisan los campos (y se enfoca el primero que tenga error).
const ORDEN_CAMPOS = [
  'titulo',
  'autor_id',
  'genero',
  'estado',
  'notas',
  'archivo_pdf',
  'licencia_compartir',
  'confirma_derechos',
  'confirma_descarga',
];

function validar(valores, autores, tienePdf) {
  const errores = {};
  const titulo = valores.titulo.trim();

  if (!titulo) errores.titulo = 'El título es obligatorio';
  else if (titulo.length > 200) errores.titulo = 'El título no puede superar los 200 caracteres';

  if (!valores.autor_id) errores.autor_id = 'Elegí un autor';
  else if (!autores.some((a) => String(a.id) === valores.autor_id)) {
    errores.autor_id = 'El autor elegido no existe';
  }

  if (valores.genero.trim().length > 100) errores.genero = 'El género no puede superar los 100 caracteres';
  if (!ESTADOS.some((e) => e.valor === valores.estado)) errores.estado = 'Elegí un estado válido';
  if (valores.notas.trim().length > 2000) errores.notas = 'Las notas no pueden superar los 2000 caracteres';
  if (valores.compartir_catalogo) {
    if (!tienePdf) errores.archivo_pdf = 'Adjuntá un PDF para publicar este libro';
    if (!valores.licencia_compartir) errores.licencia_compartir = 'Seleccioná una opción de derechos';
    if (!valores.confirma_derechos) {
      errores.confirma_derechos = 'Confirmá que tenés derecho a compartir este PDF';
    }
    if (valores.descarga_publica && !valores.confirma_descarga) {
      errores.confirma_descarga = 'Confirmá que podés ofrecer la descarga completa';
    }
  }

  return errores;
}

// Formulario reutilizable: sirve para CREAR (sin "inicial") y para EDITAR (con "inicial").
export default function FormularioLibro({ inicial, autores, onGuardar, textoBoton = 'Guardar libro' }) {
  const [valores, setValores] = useState({
    titulo: inicial?.titulo ?? '',
    autor_id: inicial?.autor_id ? String(inicial.autor_id) : '',
    genero: inicial?.genero ?? '',
    estado: inicial?.estado ?? 'pendiente',
    notas: inicial?.notas ?? '',
    compartir_catalogo: Boolean(inicial?.compartir_catalogo),
    licencia_compartir: inicial?.licencia_compartir ?? '',
    descarga_publica: Boolean(inicial?.descarga_publica),
    confirma_derechos: Boolean(inicial?.compartir_catalogo),
    confirma_descarga: Boolean(inicial?.descarga_publica),
  });
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [errorPdf, setErrorPdf] = useState(null);

  // useRef guarda una referencia al elemento del DOM para poder llamar a .focus()
  const refs = {
    titulo: useRef(null),
    autor_id: useRef(null),
    genero: useRef(null),
    estado: useRef(null),
    notas: useRef(null),
    archivo_pdf: useRef(null),
    licencia_compartir: useRef(null),
    confirma_derechos: useRef(null),
    confirma_descarga: useRef(null),
  };

  function enfocarPrimerError(erroresActuales) {
    const primero = ORDEN_CAMPOS.find((campo) => erroresActuales[campo]);
    if (primero) refs[primero].current?.focus();
    return Boolean(primero);
  }

  function manejarCambio(e) {
    const { name, value, checked, type } = e.target;
    const valor = type === 'checkbox' ? checked : value;
    setValores((actuales) => ({ ...actuales, [name]: valor }));
    if (errores[name]) setErrores((actuales) => ({ ...actuales, [name]: undefined }));
  }

  function manejarCambioPdf(e) {
    const archivo = e.target.files?.[0] ?? null;
    if (archivo && archivo.size > TAMANO_MAX_PDF) {
      e.target.value = '';
      setArchivoPdf(null);
      setErrorPdf('El PDF no puede superar los 10 MB');
      return;
    }

    setArchivoPdf(archivo);
    setErrorPdf(null);
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setErrorEnvio(null);

    // 1) Validación en el cliente (mejora la experiencia, ahorra una petición)
    const erroresCliente = validar(valores, autores, Boolean(archivoPdf || inicial?.pdf_nombre));
    setErrores(erroresCliente);
    if (enfocarPrimerError(erroresCliente)) return;
    if (errorPdf) return;

    // 2) Envío. "enviando" deshabilita el botón para evitar dobles envíos.
    setEnviando(true);
    try {
      await onGuardar({
        titulo: valores.titulo.trim(),
        autor_id: Number(valores.autor_id),
        genero: valores.genero.trim() || null,
        estado: valores.estado,
        notas: valores.notas.trim() || null,
        archivo_pdf: archivoPdf,
        compartir_catalogo: valores.compartir_catalogo,
        licencia_compartir: valores.compartir_catalogo ? valores.licencia_compartir : null,
        descarga_publica: valores.compartir_catalogo && valores.descarga_publica,
        confirma_derechos: valores.compartir_catalogo && valores.confirma_derechos,
        confirma_descarga: valores.compartir_catalogo && valores.confirma_descarga,
      });
    } catch (err) {
      // 3) La validación del servidor es la que manda: si rechaza algo, se muestra acá.
      if (err.detalles) {
        setErrores(err.detalles);
        enfocarPrimerError(err.detalles);
      }
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="panel formulario" onSubmit={manejarSubmit} noValidate>
      {errorEnvio && (
        <p role="alert" className="alerta">
          {errorEnvio}
        </p>
      )}

      <Campo
        ref={refs.titulo}
        etiqueta="Título"
        nombre="titulo"
        value={valores.titulo}
        onChange={manejarCambio}
        error={errores.titulo}
        maxLength={200}
        autoFocus
      />

      <div className="campo">
        <label htmlFor="autor_id">Autor</label>
        <select
          id="autor_id"
          name="autor_id"
          ref={refs.autor_id}
          value={valores.autor_id}
          onChange={manejarCambio}
          aria-invalid={errores.autor_id ? 'true' : undefined}
          aria-describedby={errores.autor_id ? 'autor_id-error' : undefined}
        >
          <option value="">Elegí un autor</option>
          {autores.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        {errores.autor_id && <p id="autor_id-error" className="error-campo">{errores.autor_id}</p>}
      </div>

      <div className="fila-doble">
        <Campo
          ref={refs.genero}
          etiqueta="Género (opcional)"
          nombre="genero"
          value={valores.genero}
          onChange={manejarCambio}
          error={errores.genero}
          maxLength={100}
        />

        <div className="campo">
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            name="estado"
            ref={refs.estado}
            value={valores.estado}
            onChange={manejarCambio}
            aria-invalid={errores.estado ? 'true' : undefined}
            aria-describedby={errores.estado ? 'estado-error' : undefined}
          >
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
            ))}
          </select>
          {errores.estado && <p id="estado-error" className="error-campo">{errores.estado}</p>}
        </div>
      </div>

      <div className="campo">
        <label htmlFor="notas">Notas (opcional)</label>
        <textarea
          id="notas"
          name="notas"
          ref={refs.notas}
          rows={4}
          value={valores.notas}
          onChange={manejarCambio}
          aria-invalid={errores.notas ? 'true' : undefined}
          aria-describedby={errores.notas ? 'notas-error' : undefined}
        />
        {errores.notas && <p id="notas-error" className="error-campo">{errores.notas}</p>}
      </div>

      <div className="campo">
        <label htmlFor="archivo_pdf">PDF del libro (opcional, máximo 10 MB)</label>
        <input
          id="archivo_pdf"
          name="archivo_pdf"
          ref={refs.archivo_pdf}
          type="file"
          accept=".pdf,application/pdf"
          onChange={manejarCambioPdf}
          aria-invalid={errorPdf || errores.archivo_pdf ? 'true' : undefined}
          aria-describedby={errorPdf || errores.archivo_pdf ? 'archivo_pdf-error' : 'archivo_pdf-ayuda'}
        />
        {errorPdf || errores.archivo_pdf ? (
          <p id="archivo_pdf-error" className="error-campo">{errorPdf ?? errores.archivo_pdf}</p>
        ) : (
          <p id="archivo_pdf-ayuda" className="suave">
            {archivoPdf
              ? `Se adjuntará: ${archivoPdf.name}`
              : inicial?.pdf_nombre
                ? `PDF actual: ${inicial.pdf_nombre}. Elegí otro para reemplazarlo.`
                : 'Podés adjuntar un archivo .pdf.'}
          </p>
        )}
      </div>

      <section className="publicacion-pdf" aria-labelledby="publicacion-titulo">
        <label className="opcion-publicacion" htmlFor="compartir_catalogo">
          <input
            id="compartir_catalogo"
            name="compartir_catalogo"
            type="checkbox"
            checked={valores.compartir_catalogo}
            onChange={manejarCambio}
            aria-invalid={errores.compartir_catalogo ? 'true' : undefined}
          />
          <span>
            <strong id="publicacion-titulo">Publicar en el catálogo compartido</strong>
            <small>Otros usuarios podrán encontrarlo y leer una vista previa de hasta 30 páginas.</small>
          </span>
        </label>

        {valores.compartir_catalogo && (
          <div className="opciones-publicacion">
            <p className="aviso-derechos">
              Publicá únicamente obras de dominio público, con licencia abierta o para las que tengas autorización.
            </p>
            <div className="campo">
              <label htmlFor="licencia_compartir">¿Con qué derecho compartís esta obra?</label>
              <select
                id="licencia_compartir"
                name="licencia_compartir"
                ref={refs.licencia_compartir}
                value={valores.licencia_compartir}
                onChange={manejarCambio}
                aria-invalid={errores.licencia_compartir ? 'true' : undefined}
                aria-describedby={errores.licencia_compartir ? 'licencia_compartir-error' : undefined}
              >
                <option value="">Elegí una opción</option>
                <option value="dominio_publico">Dominio público</option>
                <option value="licencia_abierta">Licencia abierta</option>
                <option value="permiso_titular">Permiso del titular de derechos</option>
              </select>
              {errores.licencia_compartir && (
                <p id="licencia_compartir-error" className="error-campo">{errores.licencia_compartir}</p>
              )}
            </div>
            <label className="opcion-publicacion opcion-descarga" htmlFor="descarga_publica">
              <input
                id="descarga_publica"
                name="descarga_publica"
                type="checkbox"
                checked={valores.descarga_publica}
                onChange={manejarCambio}
              />
              <span>
                <strong>Permitir descargar el PDF completo</strong>
                <small>Marcá esta opción solo si la licencia o el permiso permite la descarga.</small>
              </span>
            </label>
            {valores.descarga_publica && (
              <>
                <label className="opcion-publicacion confirmacion-derechos" htmlFor="confirma_descarga">
                  <input
                    id="confirma_descarga"
                    name="confirma_descarga"
                    ref={refs.confirma_descarga}
                    type="checkbox"
                    checked={valores.confirma_descarga}
                    onChange={manejarCambio}
                    aria-invalid={errores.confirma_descarga ? 'true' : undefined}
                    aria-describedby={errores.confirma_descarga ? 'confirma_descarga-error' : undefined}
                  />
                  <span>Confirmo que la licencia o autorización también permite descargar el PDF completo.</span>
                </label>
                {errores.confirma_descarga && (
                  <p id="confirma_descarga-error" className="error-campo">{errores.confirma_descarga}</p>
                )}
              </>
            )}
            <label className="opcion-publicacion confirmacion-derechos" htmlFor="confirma_derechos">
              <input
                id="confirma_derechos"
                name="confirma_derechos"
                ref={refs.confirma_derechos}
                type="checkbox"
                checked={valores.confirma_derechos}
                onChange={manejarCambio}
                aria-invalid={errores.confirma_derechos ? 'true' : undefined}
                aria-describedby={errores.confirma_derechos ? 'confirma_derechos-error' : undefined}
              />
              <span>Confirmo que cuento con los derechos o autorización necesarios para compartirlo.</span>
            </label>
            {errores.confirma_derechos && (
              <p id="confirma_derechos-error" className="error-campo">{errores.confirma_derechos}</p>
            )}
          </div>
        )}
      </section>

      <div className="acciones-form">
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Guardando…' : textoBoton}
        </button>
      </div>
    </form>
  );
}
