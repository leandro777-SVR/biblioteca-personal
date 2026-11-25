import LibroItem from './LibroItem.jsx';

export default function ListaLibros({ libros, ocupado, onCambiarEstado, onEliminar }) {
  return (
    <ul className={`estante${ocupado ? ' ocupado' : ''}`}>
      {libros.map((libro) => (
        <LibroItem
          key={libro.id}
          libro={libro}
          onCambiarEstado={onCambiarEstado}
          onEliminar={onEliminar}
        />
      ))}
    </ul>
  );
}
