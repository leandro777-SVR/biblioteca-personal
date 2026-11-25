import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Envuelve páginas que requieren sesión. Sin sesión, manda a /login recordando
// a qué página quería entrar (para volver ahí después de ingresar).
export default function RutaProtegida({ children }) {
  const { usuario } = useAuth();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion }} />;
  }
  return children;
}
