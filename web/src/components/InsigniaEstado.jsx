import { etiquetaDeEstado } from '../constants/estados.js';

// leído = verde, pendiente = ámbar, prestado = azul (los colores están en index.css)
export default function InsigniaEstado({ estado }) {
  return <span className={`insignia insignia-${estado}`}>{etiquetaDeEstado(estado)}</span>;
}
