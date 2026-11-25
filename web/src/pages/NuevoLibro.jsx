import { Link, useNavigate } from 'react-router-dom';
import { useAutores } from '../hooks/useAutores.js';
import { crearLibro } from '../services/libros.js';
import FormularioLibro from '../components/FormularioLibro.jsx';

export default function NuevoLibro() {
  const navigate = useNavigate();
  const { autores, cargando, error } = useAutores();

  async function guardar(datos) {
    await crearLibro(datos); // si la API rechaza, el error sube al formulario
    navigate('/'); // navegación programática: vuelve al listado
  }

  let contenido;
  if (cargando) contenido = <p className="estado-carga">Cargando autores…</p>;
  else if (error) contenido = <p role="alert" className="alerta">{error}</p>;
  else if (autores.length === 0) {
    contenido = (
      <div className="vacio">
        <p>Para agregar un libro primero necesitás cargar al menos un autor.</p>
        <Link className="btn btn-primario" to="/autores">Cargar un autor</Link>
      </div>
    );
  } else {
    contenido = <FormularioLibro autores={autores} onGuardar={guardar} textoBoton="Guardar libro" />;
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h1>Agregar libro</h1>
      </div>
      {contenido}
    </section>
  );
}
