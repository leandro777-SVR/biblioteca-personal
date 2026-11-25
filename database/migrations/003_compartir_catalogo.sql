USE biblioteca_personal;

ALTER TABLE libros
  ADD COLUMN compartir_catalogo TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN licencia_compartir ENUM('dominio_publico', 'licencia_abierta', 'permiso_titular') NULL,
  ADD COLUMN descarga_publica TINYINT(1) NOT NULL DEFAULT 0;
