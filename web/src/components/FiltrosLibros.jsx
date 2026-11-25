import { ESTADOS } from '../constants/estados.js';

export default function FiltrosLibros({ filtros, autores, hayFiltros, onCambiar, onLimpiar }) {
  return (
    <form className="filtros" role="search" onSubmit={(e) => e.preventDefault()}>
      <div className="campo">
        <label htmlFor="buscar">Buscar</label>
        <input
          id="buscar"
          type="search"
          placeholder="Título o autor"
          value={filtros.buscar}
          onChange={(e) => onCambiar('buscar', e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="filtro-estado">Estado</label>
        <select
          id="filtro-estado"
          value={filtros.estado}
          onChange={(e) => onCambiar('estado', e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="filtro-autor">Autor</label>
        <select
          id="filtro-autor"
          value={filtros.autorId}
          onChange={(e) => onCambiar('autorId', e.target.value)}
        >
          <option value="">Todos</option>
          {autores.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>

      {hayFiltros && (
        <button type="button" className="btn btn-secundario" onClick={onLimpiar}>
          Limpiar filtros
        </button>
      )}
    </form>
  );
}
