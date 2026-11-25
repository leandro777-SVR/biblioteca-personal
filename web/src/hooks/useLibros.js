import { useCallback, useEffect, useState } from 'react';
import { listarLibros, cambiarEstadoLibro, eliminarLibro } from '../services/libros.js';

const FILTROS_INICIALES = { buscar: '', estado: '', autorId: '' };

// Hook de la LISTA de libros: datos, estados de carga/error, filtros y acciones.
// Las acciones (cambiarEstado, eliminar) hacen "primero la API, después el estado"
// y dejan que los errores suban (throw) para que la pantalla decida cómo mostrarlos.
export function useLibros() {
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setError(null);

    listarLibros(filtros, controlador.signal)
      .then(setLibros)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    // Si los filtros cambian (o el componente se desmonta) antes de que llegue la respuesta,
    // se cancela la petición vieja: evita que una respuesta lenta pise a una más nueva.
    return () => controlador.abort();
  }, [filtros]);

  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  }, []);

  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), []);

  const cambiarEstado = useCallback(
    async (id, estado) => {
      const actualizado = await cambiarEstadoLibro(id, estado); // 1) API
      setLibros((actuales) =>
        actuales
          .map((libro) => (libro.id === id ? actualizado : libro)) // 2) estado, sin mutar
          // Si hay un filtro de estado activo y el libro ya no coincide, sale de la lista.
          .filter((libro) => !filtros.estado || libro.estado === filtros.estado)
      );
    },
    [filtros.estado]
  );

  const eliminar = useCallback(async (id) => {
    await eliminarLibro(id); // 1) API (204, sin cuerpo)
    setLibros((actuales) => actuales.filter((libro) => libro.id !== id)); // 2) estado
  }, []);

  return {
    libros,
    cargando,
    error,
    filtros,
    actualizarFiltro,
    limpiarFiltros,
    cambiarEstado,
    eliminar,
  };
}
