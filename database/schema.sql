-- ============================================================
--  Biblioteca personal - esquema de base de datos (MySQL 8 / MariaDB 10.5+)
--  Ejecutar:  mysql -u root -p < database/schema.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS biblioteca_personal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE biblioteca_personal;

-- 1) Usuarios: dueños de los datos. Nunca se guarda la contraseña, solo su hash.
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Autores: cada usuario gestiona los suyos (no se comparten entre usuarios).
CREATE TABLE IF NOT EXISTS autores (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL,
  nombre       VARCHAR(150) NOT NULL,
  nacionalidad VARCHAR(100) NULL,
  creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Un usuario no puede repetir el mismo autor.
  UNIQUE KEY uq_autor_usuario_nombre (usuario_id, nombre),
  CONSTRAINT fk_autores_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3) Libros: pertenecen a un usuario y a un autor.
CREATE TABLE IF NOT EXISTS libros (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  autor_id   INT NOT NULL,
  titulo     VARCHAR(200) NOT NULL,
  genero     VARCHAR(100) NULL,
  estado     ENUM('leido', 'pendiente', 'prestado') NOT NULL DEFAULT 'pendiente',
  notas      TEXT NULL,
  pdf_nombre VARCHAR(255) NULL,
  pdf_contenido LONGBLOB NULL,
  compartir_catalogo TINYINT(1) NOT NULL DEFAULT 0,
  licencia_compartir ENUM('dominio_publico', 'licencia_abierta', 'permiso_titular') NULL,
  descarga_publica TINYINT(1) NOT NULL DEFAULT 0,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_libros_usuario_estado (usuario_id, estado),
  -- Si se borra el usuario, se borran sus libros.
  CONSTRAINT fk_libros_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  -- No se puede borrar un autor que todavía tiene libros (la API responde 409).
  CONSTRAINT fk_libros_autor
    FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE RESTRICT
);
