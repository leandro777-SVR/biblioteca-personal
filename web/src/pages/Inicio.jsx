import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibros } from '../hooks/useLibros.js';
import { useAutores } from '../hooks/useAutores.js';
import FiltrosLibros from '../components/FiltrosLibros.jsx';
import ListaLibros from '../components/ListaLibros.jsx';

export default function Inicio() {
  const {
    libros, cargando, error, filtros,
    actualizarFiltro, limpiarFiltros, cambiarEstado, eliminar,
  } = useLibros();
  const { autores } = useAutores(); // para llenar el filtro por autor

  // errorAccion: errores de las acciones (cambiar estado, eliminar), distinto del error de carga.
  const [errorAccion, setErrorAccion] = useState(null);

  async function ejecutar(accion) {
    setErrorAccion(null);
    try {
      await accion();
    } catch (err) {
      setErrorAccion(err.message);
    }
  }

  const hayFiltros = Boolean(filtros.buscar || filtros.estado || filtros.autorId);
  const cantidad = `${libros.length} ${libros.length === 1 ? 'libro' : 'libros'}`;
  const resumen = {
    leidos: libros.filter((libro) => libro.estado === 'leido').length,
    pendientes: libros.filter((libro) => libro.estado === 'pendiente').length,
  };

  let contenido;
  if (error) {
    contenido = <p role="alert" className="alerta">{error}</p>;
  } else if (cargando && libros.length === 0) {
    contenido = <p className="estado-carga">Cargando libros…</p>;
  } else if (libros.length === 0) {
    contenido = hayFiltros ? (
      <div className="vacio">
        <p>Ningún libro coincide con los filtros.</p>
        <button type="button" className="btn btn-secundario" onClick={limpiarFiltros}>
          Limpiar filtros
        </button>
      </div>
    ) : (
      <div className="vacio">
        <p>Todavía no cargaste libros. Primero cargá un autor y después agregá tu primer libro.</p>
        <div className="vacio-acciones">
          <Link className="btn btn-secundario" to="/autores">Cargar autores</Link>
          <Link className="btn btn-primario" to="/libros/nuevo">Agregar libro</Link>
        </div>
      </div>
    );
  } else {
    contenido = (
      <ListaLibros
        libros={libros}
        ocupado={cargando}
        onCambiarEstado={(id, estado) => ejecutar(() => cambiarEstado(id, estado))}
        onEliminar={(id) => ejecutar(() => eliminar(id))}
      />
    );
  }

  return (
    <section>
      <div className="cabecera-biblioteca">
        <div className="cabecera-biblioteca-texto">
          <span className="eyebrow">Catálogo personal</span>
          <h1>Mis libros</h1>
          {!error && <p>{cantidad} en la vista actual</p>}
        </div>
        <Link className="btn btn-primario btn-agregar" to="/libros/nuevo">
          <span aria-hidden="true">+</span>
          Agregar libro
        </Link>
      </div>

      {!error && libros.length > 0 && (
        <div className="resumen-libros" aria-label="Resumen de la colección">
          <div className="resumen-item resumen-todos">
            <span className="resumen-icono" aria-hidden="true">A</span>
            <div><strong>{libros.length}</strong><span>En esta vista</span></div>
          </div>
          <div className="resumen-item resumen-leidos">
            <span className="resumen-punto" aria-hidden="true" />
            <div><strong>{resumen.leidos}</strong><span>Leídos</span></div>
          </div>
          <div className="resumen-item resumen-pendientes">
            <span className="resumen-punto" aria-hidden="true" />
            <div><strong>{resumen.pendientes}</strong><span>Pendientes</span></div>
          </div>
        </div>
      )}

      <FiltrosLibros
        filtros={filtros}
        autores={autores}
        hayFiltros={hayFiltros}
        onCambiar={actualizarFiltro}
        onLimpiar={limpiarFiltros}
      />

      {errorAccion && <p role="alert" className="alerta">{errorAccion}</p>}
      {contenido}
    </section>
  );
}
