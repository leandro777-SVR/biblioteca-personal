import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Inicio from './pages/Inicio.jsx';
import NuevoLibro from './pages/NuevoLibro.jsx';
import DetalleLibro from './pages/DetalleLibro.jsx';
import Autores from './pages/Autores.jsx';
import Catalogo from './pages/Catalogo.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';

export default function App() {
  return (
    <Routes>
      {/* Ruta padre: dibuja la barra de navegación y un <Outlet /> para las páginas hijas */}
      <Route element={<Layout />}>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Protegidas: sin sesión, RutaProtegida redirige a /login */}
        <Route path="/" element={<RutaProtegida><Inicio /></RutaProtegida>} />
        <Route path="/libros/nuevo" element={<RutaProtegida><NuevoLibro /></RutaProtegida>} />
        <Route path="/libros/:id" element={<RutaProtegida><DetalleLibro /></RutaProtegida>} />
        <Route path="/autores" element={<RutaProtegida><Autores /></RutaProtegida>} />
        <Route path="/catalogo" element={<RutaProtegida><Catalogo /></RutaProtegida>} />

        {/* Cualquier otra URL */}
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
