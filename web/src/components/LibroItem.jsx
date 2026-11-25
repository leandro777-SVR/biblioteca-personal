import { Link } from 'react-router-dom';
import { ESTADOS } from '../constants/estados.js';
import InsigniaEstado from './InsigniaEstado.jsx';

export default function LibroItem({ libro, onCambiarEstado, onEliminar }) {
  function confirmarEliminar() {
    if (window.confirm(`¿Eliminar "${libro.titulo}"? Esta acción no se puede deshacer.`)) {
      onEliminar(libro.id);
    }
  }

  return (
    <li className={`libro libro-${libro.estado}`}>
      {/* El "lomo" de color es el estado del libro, como en un estante real */}
      <span className="lomo" aria-hidden="true" />

      <div className="libro-datos">
        <h2 className="libro-titulo">
          <Link to={`/libros/${libro.id}`}>{libro.titulo}</Link>
        </h2>
        <p className="libro-autor">
          {libro.autor_nombre}
          {libro.genero ? `, ${libro.genero}` : ''}
        </p>
      </div>

      <div className="libro-acciones">
        <InsigniaEstado estado={libro.estado} />

        <select
          aria-label={`Cambiar el estado de ${libro.titulo}`}
          value=""
          onChange={(e) => e.target.value && onCambiarEstado(libro.id, e.target.value)}
        >
          <option value="">Cambiar estado</option>
          {ESTADOS.filter((e) => e.valor !== libro.estado).map((e) => (
            <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
          ))}
        </select>

        <Link className="btn btn-secundario" to={`/libros/${libro.id}`}>Editar</Link>
        <button type="button" className="btn btn-peligro" onClick={confirmarEliminar}>
          Eliminar
        </button>
      </div>
    </li>
  );
}
