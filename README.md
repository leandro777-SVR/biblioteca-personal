# Mi biblioteca – Biblioteca personal (autores y libros)

Aplicación Full-Stack para llevar el control de una biblioteca personal: cada usuario carga sus **autores** y sus **libros**, y marca cada libro como **leído** o **pendiente**. Cada cuenta ve y modifica **solo sus propios datos**.

- **Base de datos:** MySQL (3 tablas relacionadas; los PDFs opcionales se guardan como `LONGBLOB` en `libros`)
- **API REST:** Node.js + Express + mysql2, organizada en capas (rutas → controladores → modelos), con JWT y bcrypt
- **Frontend:** React 18 + Vite + React Router

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- MySQL 8 (o MariaDB 10.5+) corriendo en tu máquina

## Instalación paso a paso

### 1. Crear la base de datos

Desde la raíz del repositorio:

```bash
mysql -u root -p < database/schema.sql
```

En PowerShell, ejecutalo desde la raíz del proyecto usando `cmd` para que `<` se interprete como redirección:

```powershell
cmd /c "mysql -u root -p < database\schema.sql"
```

Esto crea la base `biblioteca_personal` con sus tres tablas. (También podés abrir `database/schema.sql` en MySQL Workbench y ejecutarlo.)

Si ya tenías creada la base antes de agregar estas funciones, aplicá las migraciones que te falten **una sola vez y en orden** desde la raíz del proyecto. La primera agrega soporte para PDFs:

```powershell
cmd /c "mysql -u root -p biblioteca_personal < database\migrations\001_libros_pdf.sql"
```

La segunda agrega el apellido requerido en el registro:

```powershell
cmd /c "mysql -u root -p biblioteca_personal < database\migrations\002_usuarios_apellido.sql"
```

Si `api/.env` usa otro valor para `DB_NAME`, reemplazá `biblioteca_personal` por ese nombre en los comandos y en la instrucción `USE` al principio de las migraciones `003` y `004`.

Los PDFs se guardan en MySQL junto con el registro del libro. Se aceptan archivos de hasta 10 MB; al editar un libro, adjuntar otro PDF reemplaza el anterior.
Los archivos son privados por defecto. Un usuario puede publicar una obra en el catálogo si cuenta con los derechos o autorización: el resto de usuarios recibe una vista previa de hasta 30 páginas. La descarga completa se habilita aparte y solo debe activarse cuando los derechos lo permitan.

Si ya tenías la base creada antes de agregar el catálogo, aplicá también esta migración una sola vez:

```powershell
cmd /c "mysql -u root -p biblioteca_personal < database\migrations\003_compartir_catalogo.sql"
```

Si ya tenías la base creada, aplicá también esta migración una sola vez. Reasigna los libros que estaban como `prestado` a `pendiente` y quita ese estado:

```powershell
cmd /c "mysql -u root -p biblioteca_personal < database\migrations\004_quitar_estado_prestado.sql"
```

### 2. Configurar y levantar la API

```bash
cd api
npm install
cp .env.example .env      # en Windows (cmd): copy .env.example .env
```

Abrí el archivo `.env` y completá tus valores (ver la tabla de variables más abajo). Después:

```bash
npm run dev               # modo desarrollo (reinicia solo al guardar)
# o bien: npm start
```

La API queda en `http://localhost:3000`. Para comprobarla: `http://localhost:3000/api/salud` debe responder `{"ok":true}`.

### 3. Configurar y levantar el frontend

En otra terminal:

```bash
cd web
npm install
cp .env.example .env      # en Windows (cmd): copy .env.example .env
npm run dev
```

Abrí `http://localhost:5173`, creá una cuenta y empezá a cargar autores y libros.

## Variables de entorno

### `api/.env`

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `PORT` | Puerto donde escucha la API | `3000` |
| `FRONTEND_URL` | Origen del frontend permitido por CORS | `http://localhost:5173` |
| `DB_HOST` | Servidor de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `tu_password` |
| `DB_NAME` | Nombre de la base | `biblioteca_personal` |
| `JWT_SECRET` | Clave con la que se firman los tokens. Usá una cadena larga y aleatoria | `una_cadena_larga_y_aleatoria` |

### `web/.env`

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API (incluye `/api`) | `http://localhost:3000/api` |

> Los archivos `.env` **no se suben a GitHub** (están en `.gitignore`). Se sube solo `.env.example`.

## Endpoints de la API

Los endpoints protegidos exigen la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| POST | `/api/auth/registro` | Crea la cuenta y devuelve `{ token, usuario }` | 201, 400, 409 |
| POST | `/api/auth/login` | Valida credenciales y devuelve `{ token, usuario }` | 200, 400, 401 |
| GET | `/api/autores` | Lista los autores del usuario | 200, 401 |
| POST | `/api/autores` | Crea un autor | 201, 400, 409 |
| DELETE | `/api/autores/:id` | Elimina un autor (si no tiene libros) | 204, 404, 409 |
| GET | `/api/libros?buscar=&estado=&autor_id=` | Lista los libros con filtros | 200, 400 |
| GET | `/api/libros/:id` | Detalle de un libro | 200, 404 |
| GET | `/api/libros/:id/preview` | Vista previa del PDF propio (máximo 30 páginas) | 200, 404, 422 |
| POST | `/api/libros` | Crea un libro | 201, 400 |
| PUT | `/api/libros/:id` | Edita un libro completo | 200, 400, 404 |
| PATCH | `/api/libros/:id/estado` | Cambia solo el estado | 200, 400, 404 |
| DELETE | `/api/libros/:id` | Elimina un libro | 204, 404 |
| GET | `/api/catalogo?buscar=` | Busca obras compartidas por título, autor o género | 200 |
| GET | `/api/catalogo/:id/preview` | Vista previa compartida de hasta 30 páginas | 200, 404, 422 |
| GET | `/api/catalogo/:id/pdf` | Descarga completa si fue habilitada por el titular | 200, 403, 404 |

Códigos usados: `200` OK · `201` creado · `204` sin contenido · `400` datos inválidos · `401` sin sesión o credenciales incorrectas · `404` no encontrado (también si pertenece a otro usuario) · `409` conflicto (email o autor duplicado, autor con libros) · `500` error interno.

## Pantallas (rutas de React)

| Ruta | Acceso | Qué muestra |
|---|---|---|
| `/login` | Pública | Inicio de sesión |
| `/registro` | Pública | Alta de usuario |
| `/` | **Protegida** | Listado de libros con búsqueda y filtros por estado y autor |
| `/libros/nuevo` | **Protegida** | Formulario de alta de libro |
| `/libros/:id` | **Protegida** | Edición y eliminación de un libro |
| `/autores` | **Protegida** | Gestión de autores |
| `/catalogo` | **Protegida** | Búsqueda, lectura previa y descarga autorizada de obras compartidas |
| `*` | Pública | Página 404 |

## Estructura del proyecto

```
biblioteca-app/
├── database/schema.sql
├── api/
│   └── src/
│       ├── server.js · app.js
│       ├── config/db.js                 (pool de MySQL)
│       ├── routes/                      (qué URL llama a qué controlador)
│       ├── controllers/                 (validaciones y códigos HTTP)
│       ├── models/                      (consultas SQL, siempre filtradas por usuario_id)
│       ├── middlewares/                 (requiereAutenticacion, manejo de errores)
│       └── utils/validaciones.js
└── web/
    └── src/
        ├── main.jsx · App.jsx
        ├── context/AuthContext.jsx      (sesión: AuthProvider + useAuth)
        ├── services/                    (fetch y llamadas a la API, sin React)
        ├── hooks/                       (useLibros, useLibro, useAutores)
        ├── components/                  (Layout, RutaProtegida, FormularioLibro, ...)
        └── pages/                       (una por ruta)
```

## Seguridad

- Las contraseñas se guardan hasheadas con **bcrypt**; nunca en texto plano.
- El **JWT** (vence a las 2 horas) viaja en `Authorization: Bearer`, y un único middleware lo verifica.
- Todas las consultas SQL filtran por `usuario_id`, y los valores siempre van parametrizados (`?`), lo que evita inyección SQL.
- Si alguien pide un recurso de otro usuario recibe `404`, sin revelar que existe.
- La API valida todo por su cuenta; la validación del formulario en React es solo una mejora de experiencia.

## Problemas frecuentes

- **`ECONNREFUSED` o "Access denied" al iniciar la API:** revisá `DB_HOST`, `DB_USER` y `DB_PASSWORD` en `api/.env` y que MySQL esté corriendo.
- **"No se pudo conectar con el servidor" en el navegador:** la API no está levantada, o `VITE_API_URL` no apunta a ella.
- **Error de CORS en la consola:** `FRONTEND_URL` en `api/.env` tiene que coincidir exactamente con la dirección del frontend (`http://localhost:5173`). Reiniciá la API tras cambiarlo.
