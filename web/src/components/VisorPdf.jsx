import { useEffect, useState } from 'react';
import { obtenerVistaPreviaCatalogo } from '../services/catalogo.js';
import { obtenerVistaPreviaLibro } from '../services/libros.js';

export default function VisorPdf({ libroId, nombre, tipo = 'libro', onCerrar }) {
  const [url, setUrl] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    let urlTemporal = null;
    setUrl(null);
    setError(null);
    setCargando(true);

    const cargar = tipo === 'catalogo' ? obtenerVistaPreviaCatalogo : obtenerVistaPreviaLibro;
    cargar(libroId)
      .then((archivo) => {
        if (!activo) return;
        urlTemporal = URL.createObjectURL(archivo);
        setUrl(urlTemporal);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
      if (urlTemporal) URL.revokeObjectURL(urlTemporal);
    };
  }, [libroId, tipo]);

  useEffect(() => {
    function manejarTecla(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [onCerrar]);

  return (
    <div className="visor-fondo" role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onCerrar();
    }}>
      <section className="visor-pdf" role="dialog" aria-modal="true" aria-labelledby="visor-titulo">
        <header className="visor-cabecera">
          <div>
            <h2 id="visor-titulo">{nombre}</h2>
            <p>Vista previa: máximo 30 páginas</p>
          </div>
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cerrar</button>
        </header>
        <div className="visor-contenido">
          {cargando && <p className="estado-carga">Preparando vista previa…</p>}
          {error && <p role="alert" className="alerta">{error}</p>}
          {url && <iframe title={`Vista previa de ${nombre}`} src={url} />}
        </div>
      </section>
    </div>
  );
}
