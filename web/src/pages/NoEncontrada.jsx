import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <section className="vacio">
      <h1>Esta página no existe</h1>
      <p>La dirección que abriste no corresponde a ninguna sección de la biblioteca.</p>
      <Link className="btn btn-primario" to="/">Ir a mis libros</Link>
    </section>
  );
}
