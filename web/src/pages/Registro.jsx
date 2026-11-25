import { useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Campo from '../components/Campo.jsx';

const ORDEN = ['nombre', 'apellido', 'email', 'password', 'confirmar'];

function validar({ nombre, apellido, email, password, confirmar }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio';
  else if (nombre.trim().length > 100) errores.nombre = 'El nombre no puede superar los 100 caracteres';
  if (!apellido.trim()) errores.apellido = 'El apellido es obligatorio';
  else if (apellido.trim().length > 100) errores.apellido = 'El apellido no puede superar los 100 caracteres';

  if (!email.trim()) errores.email = 'El email es obligatorio';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errores.email = 'El email no es válido';

  if (password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres';
  if (confirmar !== password) errores.confirmar = 'Las contraseñas no coinciden';
  return errores;
}

export default function Registro() {
  const { usuario, registrarse } = useAuth();
  const refs = {
    nombre: useRef(null),
    apellido: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmar: useRef(null),
  };

  const [valores, setValores] = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  function enfocarPrimerError(erroresActuales) {
    const primero = ORDEN.find((campo) => erroresActuales[campo]);
    if (primero) refs[primero].current?.focus();
    return Boolean(primero);
  }

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
    if (enfocarPrimerError(erroresCliente)) return;

    setEnviando(true);
    try {
      await registrarse({
        nombre: valores.nombre.trim(),
        apellido: valores.apellido.trim(),
        email: valores.email.trim(),
        password: valores.password,
      });
      // Al quedar la sesión iniciada, este componente redirige solo a "/".
    } catch (err) {
      if (err.detalles) {
        setErrores(err.detalles);
        enfocarPrimerError(err.detalles);
      }
      setErrorEnvio(err.message); // por ejemplo, 409: "Ya existe una cuenta con ese email"
      setEnviando(false);
    }
  }

  return (
    <section className="panel auth registro">
      <span className="eyebrow">Empezá tu biblioteca</span>
      <h1>Crear cuenta</h1>
      <p className="suave">Completá tus datos para organizar tu colección privada.</p>

      <form onSubmit={manejarSubmit} noValidate className="formulario">
        {errorEnvio && <p role="alert" className="alerta">{errorEnvio}</p>}

        <div className="registro-grupo">
          <h2>Datos personales</h2>
          <div className="fila-doble">
            <Campo ref={refs.nombre} etiqueta="Nombre" nombre="nombre" autoComplete="given-name"
              value={valores.nombre} onChange={manejarCambio} error={errores.nombre} autoFocus maxLength={100} />
            <Campo ref={refs.apellido} etiqueta="Apellido" nombre="apellido" autoComplete="family-name"
              value={valores.apellido} onChange={manejarCambio} error={errores.apellido} maxLength={100} />
          </div>
        </div>
        <div className="registro-grupo">
          <h2>Datos de acceso</h2>
          <Campo ref={refs.email} etiqueta="Email" nombre="email" type="email" autoComplete="email"
            value={valores.email} onChange={manejarCambio} error={errores.email} maxLength={255} />
          <div className="fila-doble">
            <Campo ref={refs.password} etiqueta="Contraseña (mínimo 8 caracteres)" nombre="password"
              type="password" autoComplete="new-password"
              value={valores.password} onChange={manejarCambio} error={errores.password} />
            <Campo ref={refs.confirmar} etiqueta="Confirmar contraseña" nombre="confirmar"
              type="password" autoComplete="new-password"
              value={valores.confirmar} onChange={manejarCambio} error={errores.confirmar} />
          </div>
        </div>

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="pie-form">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </section>
  );
}
