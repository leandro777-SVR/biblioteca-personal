USE biblioteca_personal;

UPDATE libros
SET estado = 'pendiente'
WHERE estado = 'prestado';

ALTER TABLE libros
  MODIFY COLUMN estado ENUM('leido', 'pendiente') NOT NULL DEFAULT 'pendiente';
