// Los valores coinciden con el ENUM de MySQL y con la validación de la API.
export const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'leido', etiqueta: 'Leído' },
  { valor: 'prestado', etiqueta: 'Prestado' },
];

export function etiquetaDeEstado(valor) {
  return ESTADOS.find((e) => e.valor === valor)?.etiqueta ?? valor;
}
