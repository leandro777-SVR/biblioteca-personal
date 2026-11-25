import { useCallback, useEffect, useState } from 'react';
import { obtenerLibro, actualizarLibro, eliminarLibro } from '../services/libros.js';

// Hook del DETALLE de un libro (pantalla de edición): carga uno por id, lo guarda o lo elimina.
export function useLibro(id) {
  const [libro, setLibro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setError(null);
    setLibro(null);

    obtenerLibro(id, controlador.signal)
      .then(setLibro)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return () => controlador.abort();
  }, [id]);

  const guardar = useCallback(
    async (datos) => {
      const actualizado = await actualizarLibro(id, datos);
      setLibro(actualizado);
      return actualizado;
    },
    [id]
  );

  const eliminar = useCallback(() => eliminarLibro(id), [id]);

  return { libro, cargando, error, guardar, eliminar };
}
