# Guía para la exposición – Mi biblioteca

Orden sugerido: base de datos → API → seguridad → React → demo → preguntas. Seguí el camino de **un dato**: nace en React, viaja por la API y termina en MySQL.

---

## 1. Qué problema resuelve (30 segundos)

"Es una biblioteca personal: cada usuario carga sus autores y sus libros, y marca si un libro está leído o pendiente. Cada usuario ve solo lo suyo."

Arquitectura: **React (puerto 5173) → API Express (puerto 3000) → MySQL**. React nunca habla con MySQL: si lo hiciera, las credenciales de la base quedarían en el navegador, visibles para cualquiera.

## 2. Base de datos (`database/schema.sql`)

Tres tablas relacionadas por claves foráneas:

- `usuarios` (email `UNIQUE`, `password_hash`).
- `autores` → pertenece a un usuario (`usuario_id`).
- `libros` → pertenece a un usuario y a un autor (`usuario_id`, `autor_id`).

Decisiones que conviene nombrar:

- `estado` es un **ENUM** (`leido`, `pendiente`): MySQL rechaza cualquier otro valor.
- `ON DELETE CASCADE` en `usuario_id`: si se borra un usuario, se borran sus datos.
- `ON DELETE RESTRICT` en `autor_id`: no se puede borrar un autor con libros. La API lo traduce a un **409** con un mensaje claro.
- `UNIQUE (usuario_id, nombre)` en autores: un usuario no repite autores.

## 3. API en capas (`api/src`)

Cada capa tiene **una sola responsabilidad**, así se puede cambiar una sin romper las otras:

1. **routes/**: solo dicen "esta URL con este verbo llama a este controlador".
2. **controllers/**: validan lo que llega, deciden el código HTTP y responden. No tienen SQL.
3. **models/**: son el único lugar con SQL. Usan `pool.execute` con `?`, que evita la inyección SQL.

Los códigos HTTP (hay que saber justificarlos): `201` al crear, `204` al borrar (sin cuerpo), `400` datos inválidos, `401` sin sesión, `404` no existe, `409` conflicto, `500` error del servidor. Los errores inesperados terminan en un único middleware (`errores.js`) que registra el detalle en el servidor y al cliente le devuelve un mensaje genérico.

CORS: el navegador manda una petición `OPTIONS` (preflight) antes de los `PUT`/`PATCH`/`DELETE` o de cualquier petición con JSON o `Authorization`. `cors()` en `app.js` la responde permitiendo solo el origen del frontend.

## 4. Seguridad: el corazón del trabajo

**Registro / login** (`auth.controller.js`):

- La contraseña se guarda con `bcrypt.hash(password, 10)`. Nunca se puede recuperar; solo se compara con `bcrypt.compare`.
- Si falla el email o la clave, el mensaje es el mismo ("Email o contraseña incorrectos"): así no se revela qué emails existen.
- Si el login es correcto, se firma un **JWT** con `{ id, email }` que vence en 2 horas.

**Middleware `requiereAutenticacion`**: lee `Authorization: Bearer <token>`, verifica firma y vencimiento y deja los datos en `req.usuario`. Se aplica con `router.use(...)` a todas las rutas de libros y autores.

**Aislamiento de datos**: todas las consultas incluyen `WHERE usuario_id = ?` con el id **que viene del token**, nunca del cuerpo de la petición. Si el usuario B pide `/api/libros/1` (que es de A), recibe `404`, igual que si no existiera. Además, al crear un libro se comprueba que el `autor_id` pertenezca al mismo usuario.

## 5. React en tres capas (`web/src`)

Es el mismo principio que en la API:

1. **services/** (JavaScript puro, sin React). `api.js` es el único archivo que llama a `fetch`:
   - agrega la URL base (`VITE_API_URL`) y el token en cada petición;
   - maneja el `204` (sin `.json()`);
   - parsea el JSON de forma segura y lanza un `Error` con el mensaje del servidor;
   - si el servidor responde `401` con sesión activa, cierra la sesión (token vencido).
2. **hooks/** (lógica y estado, sin JSX). `useLibros` guarda `libros`, `cargando`, `error` y `filtros`. El `useEffect` usa **AbortController**: si los filtros cambian antes de que llegue la respuesta, se cancela la petición vieja, así una respuesta lenta no pisa a una más nueva. Las acciones siguen la regla **"primero la API, después el estado"**.
3. **components/ y pages/** (interfaz y eventos).

**Context de sesión** (`AuthContext.jsx`): comparte `usuario`, `iniciarSesion`, `registrarse` y `cerrarSesion` con toda la app sin pasar props por cada nivel (evita el *prop drilling*). Usa **inicialización perezosa** (`useState(() => leerSesion()...)`) para recuperar la sesión desde `localStorage` al recargar con F5. `useAuth()` lanza un error claro si se usa fuera del Provider.

**React Router**: `BrowserRouter` en `main.jsx`; una ruta padre con `Layout` (barra + `<Outlet />`); rutas dinámicas con `useParams` (`/libros/:id`); `useNavigate` para volver al listado tras guardar; `<Navigate>` en `RutaProtegida` para redirigir a `/login`; y `path="*"` para el 404.

**Formulario con validación** (`FormularioLibro.jsx`):

- Una sola pieza sirve para **crear** y **editar**: si recibe `inicial`, precarga los datos.
- Valida por campo en el cliente (título obligatorio y de hasta 200 caracteres, autor obligatorio, estado válido) y usa `useRef` + `.focus()` para ir al primer campo con error.
- `enviando` deshabilita el botón para evitar dobles envíos.
- Si el servidor rechaza algo, muestra sus errores por campo: **la validación del servidor es la que manda**, la del cliente es solo comodidad.

Estados de la pantalla: `cargando` (aviso de carga), `error` (falló la carga) y `errorAccion` (falló una acción, como eliminar un autor con libros).

## 6. Demo en vivo (guion de 3 minutos)

1. Entrar a `/` sin sesión → te manda a `/login` (**ruta protegida**).
2. Crear una cuenta, primero dejando campos vacíos para mostrar la **validación y el foco**.
3. En Autores, cargar "Jorge Luis Borges". Intentar cargarlo de nuevo → mensaje de **409**.
4. Agregar un libro (con el formulario vacío, para mostrar los errores) y guardarlo.
5. Cambiar el estado desde el listado, y probar la búsqueda y los filtros.
6. Intentar borrar el autor con libros → mensaje del **409**.
7. Recargar con F5 → la sesión sigue (**localStorage + inicialización perezosa**).
8. (Opcional) Abrir otra cuenta en una ventana privada y mostrar que no ve los libros de la primera.

## 7. Preguntas que pueden hacerte

- **¿Por qué React no se conecta directo a MySQL?** Porque expondría las credenciales de la base en el navegador y no habría dónde validar ni autenticar.
- **¿Qué pasa si alguien edita el JWT?** La firma deja de coincidir con `JWT_SECRET` y `jwt.verify` falla → 401.
- **¿Por qué el `usuario_id` sale del token y no del body?** Porque el body lo controla el cliente y puede mentir; el token está firmado por el servidor.
- **¿Por qué 404 y no 403 cuando el libro es de otro usuario?** Para no revelar que ese id existe.
- **¿Por qué validar también en el servidor?** Porque alguien puede saltarse React y llamar a la API directamente (con Postman, por ejemplo).
- **¿Por qué `204` y no `200` al borrar?** No hay nada que devolver; y por eso `api.js` no llama a `.json()` en ese caso.
- **¿Para qué sirve el AbortController?** Para evitar condiciones de carrera: que una respuesta vieja y lenta pise a una más reciente.
- **¿Por qué `useMemo` en el Context?** Para que el objeto `value` no cambie en cada render y no se re-rendericen todos los consumidores sin necesidad.
- **¿Por qué guardar el token en `localStorage`?** Es simple y sobrevive al F5; la contra es que un ataque XSS podría leerlo. Una alternativa más segura son cookies `httpOnly` (lo mencionás como mejora futura).
- **¿Qué mejorarías?** Paginación del listado, *debounce* en la búsqueda, refresh tokens, límite de intentos de login y tests automáticos.
