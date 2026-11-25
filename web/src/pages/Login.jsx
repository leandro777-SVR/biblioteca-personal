import { useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Campo from '../components/Campo.jsx';

function validar({ email, password }) {
  const errores = {};
  if (!email.trim()) errores.email = 'El email es obligatorio';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errores.email = 'El email no es válido';
  if (!password) errores.password = 'La contraseña es obligatoria';
  return errores;
}

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const ubicacion = useLocation();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [valores, setValores] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión (o se acaba de iniciar), vuelve a la página que se quería visitar.
  if (usuario) return <Navigate to={ubicacion.state?.desde?.pathname ?? '/'} replace />;

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
    if (erroresCliente.email) return emailRef.current?.focus();
    if (erroresCliente.password) return passwordRef.current?.focus();

    setEnviando(true);
    try {
      await iniciarSesion({ email: valores.email.trim(), password: valores.password });
    } catch (err) {
      setErrorEnvio(err.message);
      setEnviando(false);
    }
  }

  return (
    <section className="panel auth">
      <h1>Ingresar</h1>
      <p className="suave">Entrá a tu cuenta para ver tus libros.</p>

      <form onSubmit={manejarSubmit} noValidate className="formulario">
        {errorEnvio && <p role="alert" className="alerta">{errorEnvio}</p>}

        <Campo
          ref={emailRef}
          etiqueta="Email"
          nombre="email"
          type="email"
          autoComplete="email"
          value={valores.email}
          onChange={manejarCambio}
          error={errores.email}
          autoFocus
        />
        <Campo
          ref={passwordRef}
          etiqueta="Contraseña"
          nombre="password"
          type="password"
          autoComplete="current-password"
          value={valores.password}
          onChange={manejarCambio}
          error={errores.password}
        />

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="pie-form">
        ¿No tenés cuenta? <Link to="/registro">Creá una</Link>
      </p>
    </section>
  );
}
