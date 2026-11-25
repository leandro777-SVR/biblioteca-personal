import { Link, NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const [tema, setTema] = useState(() => localStorage.getItem('biblioteca-tema') ?? 'claro');

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem('biblioteca-tema', tema);
  }, [tema]);

  return (
    <div className="app-shell">
      <header className="barra">
        <div className="barra-interna">
          <Link to="/" className="marca" aria-label="Mi biblioteca - Inicio">
            <span className="marca-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M6 3.5h10.5A1.5 1.5 0 0 1 18 5v15H7.5A2.5 2.5 0 0 1 5 17.5v-12A2 2 0 0 1 7 3.5H6Zm1 0v14.5A1.5 1.5 0 0 0 8.5 19H18M9 7h6M9 10h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="marca-texto">
              <small>BIBLIOTECA</small>
              <strong>Mi biblioteca</strong>
            </span>
          </Link>

          <nav className="navegacion" aria-label="Principal">
            {usuario ? (
              <>
                <NavLink to="/" end><span>Mis libros</span></NavLink>
                <NavLink to="/libros/nuevo"><span>Agregar</span></NavLink>
                <NavLink to="/autores"><span>Autores</span></NavLink>
                <NavLink to="/catalogo"><span>Catálogo</span></NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login"><span>Ingresar</span></NavLink>
                <NavLink to="/registro"><span>Crear cuenta</span></NavLink>
              </>
            )}
          </nav>

          {usuario && (
            <details className="menu-cuenta">
              <summary className="cuenta-boton" aria-label="Abrir configuraciones de cuenta">
                <span className="avatar" aria-hidden="true">
                  {usuario.nombre?.charAt(0).toUpperCase()}
                </span>
                <span className="cuenta-nombre">{usuario.nombre}</span>
                <span className="cuenta-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="panel-cuenta">
                <div className="cuenta-info">
                  <span>Sesión iniciada</span>
                  <strong>{[usuario.nombre, usuario.apellido].filter(Boolean).join(' ')}</strong>
                  <small>{usuario.email}</small>
                </div>
                <div className="ajuste-tema">
                  <div>
                    <strong>Modo oscuro</strong>
                    <span>Cambiar la apariencia</span>
                  </div>
                  <button
                    type="button"
                    className={`interruptor${tema === 'oscuro' ? ' activo' : ''}`}
                    role="switch"
                    aria-checked={tema === 'oscuro'}
                    aria-label="Modo oscuro"
                    onClick={() => setTema((actual) => actual === 'oscuro' ? 'claro' : 'oscuro')}
                  >
                    <span />
                  </button>
                </div>
                <button type="button" className="btn btn-secundario cuenta-salir" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            </details>
          )}
        </div>
      </header>

      <main className="contenedor principal">
        <Outlet />
      </main>

      <footer className="pie-pagina">
        <div className="pie-pagina-interna">
          <span>Mi biblioteca</span>
          <span>Administrá tu colección personal</span>
        </div>
      </footer>
    </div>
  );
}
