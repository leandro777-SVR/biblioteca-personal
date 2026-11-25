import { useCallback, useEffect, useState } from 'react';
import { listarAutores, crearAutor, eliminarAutor } from '../services/autores.js';

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre);

export function useAutores() {
  const [autores, setAutores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controlador = new AbortController();

    listarAutores(controlador.signal)
      .then(setAutores)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return () => controlador.abort();
  }, []);

  const crear = useCallback(async (datos) => {
    const nuevo = await crearAutor(datos); // 201 con el id real que asignó MySQL
    setAutores((actuales) => [...actuales, nuevo].sort(porNombre));
    return nuevo;
  }, []);

  const eliminar = useCallback(async (id) => {
    await eliminarAutor(id);
    setAutores((actuales) => actuales.filter((autor) => autor.id !== id));
  }, []);

  return { autores, cargando, error, crear, eliminar };
}
