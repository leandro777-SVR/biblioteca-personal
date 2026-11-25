import { useRef, useState } from 'react';
import { useAutores } from '../hooks/useAutores.js';
import Campo from '../components/Campo.jsx';

function validar({ nombre, nacionalidad }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio';
  else if (nombre.trim().length > 150) errores.nombre = 'El nombre no puede superar los 150 caracteres';
  if (nacionalidad.trim().length > 100) errores.nacionalidad = 'La nacionalidad no puede superar los 100 caracteres';
  return errores;
}

export default function Autores() {
  const { autores, cargando, error, crear, eliminar } = useAutores();
  const nombreRef = useRef(null);
  const nacionalidadRef = useRef(null);

  const [valores, setValores] = useState({ nombre: '', nacionalidad: '' });
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);

  function manejarCambio(e) {
    const { name, value } = e.target;
    setValores((actuales) => ({ ...actuales, [name]: value }));
    if (errores[name]) setErrores((actuales) => ({ ...actuales, [name]: undefined }));
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setErrorEnvio(null);

    const erroresCliente = validar(valores);
    setErrores(erroresCliente);
    if (erroresCliente.nombre) return nombreRef.current?.focus();
    if (erroresCliente.nacionalidad) return nacionalidadRef.current?.focus();

    setEnviando(true);
    try {
      await crear({
        nombre: valores.nombre.trim(),
        nacionalidad: valores.nacionalidad.trim() || null,
      });
      setValores({ nombre: '', nacionalidad: '' });
      nombreRef.current?.focus();
    } catch (err) {
      if (err.detalles) setErrores(err.detalles);
      setErrorEnvio(err.message); // por ejemplo, 409: ya cargaste ese autor
    } finally {
      setEnviando(false);
    }
  }

  async function manejarEliminar(autor) {
    if (!window.confirm(`¿Eliminar a ${autor.nombre}?`)) return;
    setErrorAccion(null);
    try {
      await eliminar(autor.id);
    } catch (err) {
      setErrorAccion(err.message); // 409 si todavía tiene libros
    }
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Autores</h1>
          <p className="suave">Cargá acá a los autores para poder asignarlos a tus libros.</p>
        </div>
      </div>

      <form className="panel formulario formulario-autor" onSubmit={manejarSubmit} noValidate>
        {errorEnvio && <p role="alert" className="alerta">{errorEnvio}</p>}
        <div className="fila-doble">
          <Campo ref={nombreRef} etiqueta="Nombre" nombre="nombre" value={valores.nombre}
            onChange={manejarCambio} error={errores.nombre} maxLength={150} />
          <Campo ref={nacionalidadRef} etiqueta="Nacionalidad (opcional)" nombre="nacionalidad"
            value={valores.nacionalidad} onChange={manejarCambio}
            error={errores.nacionalidad} maxLength={100} />
        </div>
        <div className="acciones-form">
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? 'Agregando…' : 'Agregar autor'}
          </button>
        </div>
      </form>

      {errorAccion && <p role="alert" className="alerta">{errorAccion}</p>}

      {cargando && <p className="estado-carga">Cargando autores…</p>}
      {error && <p role="alert" className="alerta">{error}</p>}
      {!cargando && !error && autores.length === 0 && (
        <div className="vacio"><p>Todavía no cargaste autores.</p></div>
      )}

      {autores.length > 0 && (
        <ul className="estante">
          {autores.map((autor) => (
            <li key={autor.id} className="libro libro-autor-fila">
              <span className="lomo" aria-hidden="true" />
              <div className="libro-datos">
                <h2 className="libro-titulo">{autor.nombre}</h2>
                <p className="libro-autor">
                  {autor.nacionalidad ? `${autor.nacionalidad}, ` : ''}
                  {autor.cantidad_libros} {autor.cantidad_libros === 1 ? 'libro' : 'libros'}
                </p>
              </div>
              <div className="libro-acciones">
                <button type="button" className="btn btn-peligro" onClick={() => manejarEliminar(autor)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
