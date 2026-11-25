import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.js';
import { setManejadorNoAutorizado } from '../services/api.js';
import { borrarSesion, guardarSesion, leerSesion } from '../services/sesion.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicialización perezosa: la función se ejecuta UNA sola vez (al montar) y lee
  // localStorage, así la sesión sobrevive al recargar la página (F5).
  const [usuario, setUsuario] = useState(() => leerSesion()?.usuario ?? null);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setUsuario(null);
  }, []);

  // Si la API dice 401 con sesión activa (token vencido), se cierra la sesión sola.
  useEffect(() => {
    setManejadorNoAutorizado(cerrarSesion);
    return () => setManejadorNoAutorizado(null);
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (credenciales) => {
    const { token, usuario: datos } = await authService.login(credenciales);
    guardarSesion({ token, usuario: datos });
    setUsuario(datos);
  }, []);

  const registrarse = useCallback(async (datosRegistro) => {
    const { token, usuario: datos } = await authService.registro(datosRegistro);
    guardarSesion({ token, usuario: datos });
    setUsuario(datos);
  }, []);

  // useMemo evita que el objeto "value" cambie en cada render y re-renderice a todos los consumidores.
  const valor = useMemo(
    () => ({ usuario, iniciarSesion, registrarse, cerrarSesion }),
    [usuario, iniciarSesion, registrarse, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// Hook propio para consumir el contexto, con una verificación útil para detectar errores.
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (contexto === null) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return contexto;
}
