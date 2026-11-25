import { useEffect, useState } from 'react';
import VisorPdf from '../components/VisorPdf.jsx';
import { descargarPdfCatalogo, listarCatalogo } from '../services/catalogo.js';

const ETIQUETAS_LICENCIA = {
  dominio_publico: 'Dominio público',
  licencia_abierta: 'Licencia abierta',
  permiso_titular: 'Permiso del titular',
};

export default function Catalogo() {
  const [buscar, setBuscar] = useState('');
  const [consulta, setConsulta] = useState('');
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);
  const [libroEnLectura, setLibroEnLectura] = useState(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setError(null);
    listarCatalogo(consulta, controlador.signal)
      .then(setLibros)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });
    return () => controlador.abort();
  }, [consulta]);

  async function manejarDescarga(libro) {
    setErrorAccion(null);
    setDescargandoId(libro.id);
    try {
      await descargarPdfCatalogo(libro.id, libro.pdf_nombre);
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setDescargandoId(null);
    }
  }

  function manejarBuscar(e) {
    e.preventDefault();
    setConsulta(buscar.trim());
  }

  return (
    <section className="catalogo">
      <div className="cabecera-biblioteca">
        <div className="cabecera-biblioteca-texto">
          <span className="eyebrow">Colección compartida</span>
          <h1>Catálogo</h1>
          <p>Explorá obras que otros usuarios eligieron compartir.</p>
        </div>
      </div>

      <form className="busqueda-catalogo" role="search" onSubmit={manejarBuscar}>
        <label className="sr-only" htmlFor="buscar-catalogo">Buscar por título, autor o género</label>
        <input
          id="buscar-catalogo"
          type="search"
          placeholder="Título, autor o género"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <button type="submit" className="btn btn-primario">Buscar</button>
      </form>

      {errorAccion && <p role="alert" className="alerta">{errorAccion}</p>}
      {error && <p role="alert" className="alerta">{error}</p>}
      {cargando && <p className="estado-carga">Buscando en el catálogo…</p>}
      {!cargando && !error && libros.length === 0 && (
        <div className="vacio">
          <h2>{consulta ? 'No encontramos resultados' : 'Todavía no hay obras compartidas'}</h2>
          <p>
            {consulta
              ? 'Probá con otro título, autor o género.'
              : 'Los libros aparecen acá cuando sus dueños los publican con los permisos correspondientes.'}
          </p>
        </div>
      )}
      {!cargando && !error && libros.length > 0 && (
        <>
          <p className="resultado-catalogo">
            {libros.length} {libros.length === 1 ? 'obra disponible' : 'obras disponibles'}
          </p>
          <div className="rejilla-catalogo">
            {libros.map((libro) => (
              <article className="tarjeta-catalogo" key={libro.id}>
                <div className="portada-catalogo" aria-hidden="true">
                  <span>LECTURA</span>
                  <strong>{libro.titulo.charAt(0).toUpperCase()}</strong>
                </div>
                <div className="datos-catalogo">
                  <span className="licencia-catalogo">
                    {ETIQUETAS_LICENCIA[libro.licencia_compartir] ?? 'Compartido'}
                  </span>
                  <h2>{libro.titulo}</h2>
                  <p className="catalogo-autor">{libro.autor_nombre}</p>
                  {libro.genero && <p className="catalogo-genero">{libro.genero}</p>}
                  {libro.nacionalidad && <p className="catalogo-nacionalidad">{libro.nacionalidad}</p>}
                  <p className="catalogo-lectura">Vista previa de hasta 30 páginas</p>
                  <div className="acciones-catalogo">
                    <button
                      type="button"
                      className="btn btn-primario"
                      onClick={() => setLibroEnLectura(libro)}
                    >
                      Leer vista previa
                    </button>
                    {Boolean(libro.descarga_publica) && (
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={() => manejarDescarga(libro)}
                        disabled={descargandoId === libro.id}
                      >
                        {descargandoId === libro.id ? 'Descargando…' : 'Descargar completo'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {libroEnLectura && (
        <VisorPdf
          libroId={libroEnLectura.id}
          nombre={libroEnLectura.titulo}
          tipo="catalogo"
          onCerrar={() => setLibroEnLectura(null)}
        />
      )}
    </section>
  );
}
