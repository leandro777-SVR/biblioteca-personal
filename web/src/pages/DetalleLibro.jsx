import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLibro } from '../hooks/useLibro.js';
import { useAutores } from '../hooks/useAutores.js';
import FormularioLibro from '../components/FormularioLibro.jsx';
import InsigniaEstado from '../components/InsigniaEstado.jsx';
import VisorPdf from '../components/VisorPdf.jsx';
import { descargarPdfLibro } from '../services/libros.js';

export default function DetalleLibro() {
  const { id } = useParams(); // lee el :id de la URL /libros/:id
  const navigate = useNavigate();
  const { libro, cargando, error, guardar, eliminar } = useLibro(id);
  const { autores, cargando: cargandoAutores, error: errorAutores } = useAutores();
  const [errorAccion, setErrorAccion] = useState(null);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  async function manejarGuardar(datos) {
    await guardar(datos);
    navigate('/');
  }

  async function manejarEliminar() {
    if (!window.confirm(`¿Eliminar "${libro.titulo}"? Esta acción no se puede deshacer.`)) return;
    setErrorAccion(null);
    try {
      await eliminar();
      navigate('/');
    } catch (err) {
      setErrorAccion(err.message);
    }
  }

  async function manejarDescargarPdf() {
    setErrorAccion(null);
    setDescargandoPdf(true);
    try {
      await descargarPdfLibro(libro.id, libro.pdf_nombre);
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setDescargandoPdf(false);
    }
  }

  if (cargando || cargandoAutores) {
    return <p className="estado-carga">Cargando libro…</p>;
  }

  if (error || errorAutores) {
    return (
      <section>
        <p role="alert" className="alerta">{error ?? errorAutores}</p>
        <Link className="btn btn-secundario" to="/">Volver a mis libros</Link>
      </section>
    );
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Editar libro</h1>
          <p className="suave">
            <InsigniaEstado estado={libro.estado} />
          </p>
          {libro.pdf_nombre && (
            <div className="acciones-pdf">
              <button type="button" className="btn btn-secundario" onClick={() => setMostrarVisor(true)}>
                Leer vista previa (30 páginas)
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={manejarDescargarPdf}
                disabled={descargandoPdf}
              >
                {descargandoPdf ? 'Descargando PDF…' : 'Descargar PDF completo'}
              </button>
            </div>
          )}
        </div>
        <button type="button" className="btn btn-peligro" onClick={manejarEliminar}>
          Eliminar libro
        </button>
      </div>

      {errorAccion && <p role="alert" className="alerta">{errorAccion}</p>}

      {/* "inicial" precarga el formulario con los datos del libro */}
      <FormularioLibro
        inicial={libro}
        autores={autores}
        onGuardar={manejarGuardar}
        textoBoton="Guardar cambios"
      />
      {mostrarVisor && (
        <VisorPdf
          libroId={libro.id}
          nombre={libro.titulo}
          onCerrar={() => setMostrarVisor(false)}
        />
      )}
    </section>
  );
}
