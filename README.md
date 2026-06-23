# PostHub — Backend

API REST + WebSockets para **PostHub**, una plataforma de publicaciones (posteos) con
comentarios, autenticación con roles, chat en tiempo real, panel de administración y
exportación de posteos a PDF.

Este repositorio corresponde al **lado del servidor** del Trabajo Práctico Final, desarrollado
íntegramente con **Node.js**.

---

## Índice

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Cómo ejecutar](#cómo-ejecutar)
- [Tests](#tests)
- [Documentación de la API](#documentación-de-la-api)
  - [Autenticación](#autenticación)
  - [Posteos](#posteos)
  - [Comentarios](#comentarios)
  - [Administración](#administración)
  - [Chat (HTTP)](#chat-http)
  - [Exportación a PDF](#exportación-a-pdf)
  - [Chat en tiempo real (WebSockets)](#chat-en-tiempo-real-websockets)
- [Modelos de datos](#modelos-de-datos)
- [Manejo de errores](#manejo-de-errores)

---

## Características

- **Autenticación** con JWT y contraseñas hasheadas con bcrypt.
- **Roles** (`user` / `admin`) con middlewares de autorización.
- **CRUD de posteos** con subida de imágenes a Cloudinary.
- **CRUD de comentarios** asociados a posteos (con borrado en cascada).
- **Panel de administración**: estadísticas y moderación de contenido.
- **Chat en tiempo real** con Socket.IO (autenticado por token) e historial persistido.
- **Exportación de un posteo a PDF** (incluye autor, contenido, imagen y comentarios).
- **Suite de tests** automatizados con base de datos en memoria.

---

## Tecnologías

| Categoría | Herramienta |
|---|---|
| Runtime | Node.js |
| Framework HTTP | Express 5 |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JSON Web Tokens (jsonwebtoken) + bcrypt |
| Validaciones | Joi + validaciones de esquema de Mongoose |
| Tiempo real | Socket.IO |
| Imágenes | Cloudinary + Multer |
| PDF | PDFKit |
| Testing | Mocha + Chai + Supertest + mongodb-memory-server |

---

## Arquitectura

El servidor sigue una arquitectura en capas, separando responsabilidades:

```
src/
├── app.js                # Configuración de Express (middlewares y rutas)
├── server.js             # Punto de entrada: conecta DB, levanta HTTP y sockets
├── config/               # Configuración (conexión a DB, Cloudinary)
├── routes/               # Definición de endpoints
├── controllers/          # Reciben la request y arman la response
├── services/             # Lógica de negocio y acceso a datos
├── models/               # Esquemas de Mongoose
├── middlewares/          # Auth, roles, manejo de errores, uploads, 404
├── sockets/              # Configuración de Socket.IO (chat en tiempo real)
├── utils/                # Helpers (tokens, errores, Cloudinary, etc.)
└── tests/                # Tests automatizados
```

Flujo de una petición: **Ruta → Middleware → Controlador → Servicio → Modelo → Base de datos**.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
- Una instancia de **MongoDB** (local o en la nube, ej. MongoDB Atlas).
- Una cuenta de **Cloudinary** (para la subida de imágenes).

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/LucasPatricioRey/Post-hub.git
cd Post-hub

# Instalar dependencias
npm install
```

---

## Variables de entorno

Crear un archivo **`.env`** en la raíz del proyecto con las siguientes variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/posthub
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=posthub
CLIENT_URL=http://localhost:5173
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto donde escucha el servidor. |
| `MONGODB_URI` | Cadena de conexión a la base de datos MongoDB. |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT. |
| `JWT_EXPIRES_IN` | Tiempo de expiración de los tokens (ej. `7d`). |
| `CLOUDINARY_*` | Credenciales de Cloudinary para la subida de imágenes. |
| `CLIENT_URL` | Origen del frontend autorizado por CORS. |

> El archivo `.env` está incluido en `.gitignore` y **no debe subirse al repositorio**.

---

## Cómo ejecutar

```bash
# Iniciar el servidor
npm start
```

Por defecto el servidor queda disponible en `http://localhost:3000`.

Endpoints de verificación rápida:

- `GET /` → mensaje de servidor funcionando.
- `GET /api/health` → estado de la API en formato JSON.

---

## Tests

El proyecto incluye tests automatizados que cubren los **casos felices** y al menos un
**caso no feliz** de cada funcionalidad. Se ejecutan contra una base de datos MongoDB
en memoria, por lo que **no requieren una base de datos real**.

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm run test:watch
```

Cobertura actual: **46 tests** (autenticación, posteos, comentarios, administración,
permisos, validaciones, chat HTTP, chat por WebSocket y exportación a PDF).

---

## Documentación de la API

- **URL base:** `http://localhost:3000/api`
- **Formato:** JSON.
- **Autenticación:** los endpoints protegidos requieren el header
  `Authorization: Bearer <token>`.

Leyenda de acceso:

- 🔓 **Público** — no requiere token.
- 🔒 **Protegido** — requiere token de usuario autenticado.
- 👑 **Admin** — requiere token de un usuario con rol `admin`.

---

### Autenticación

Base: `/api/auth`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/register` | 🔓 | Registra un nuevo usuario y devuelve su token. |
| `POST` | `/login` | 🔓 | Inicia sesión y devuelve un token. |
| `GET` | `/me` | 🔒 | Devuelve los datos del usuario autenticado. |
| `GET` | `/admin-test` | 👑 | Endpoint de prueba para verificar acceso de admin. |

**POST `/api/auth/register`**

```json
// Request body
{
  "nombre": "Lucas",
  "email": "lucas@mail.com",
  "password": "123456"
}
```

```json
// Response 201
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": "...",
    "nombre": "Lucas",
    "email": "lucas@mail.com",
    "rol": "user",
    "createdAt": "..."
  },
  "token": "<jwt>"
}
```

**POST `/api/auth/login`**

```json
// Request body
{
  "email": "lucas@mail.com",
  "password": "123456"
}
```

```json
// Response 200
{
  "message": "Login correcto",
  "user": { "id": "...", "nombre": "Lucas", "email": "lucas@mail.com", "rol": "user" },
  "token": "<jwt>"
}
```

---

### Posteos

Base: `/api/posts`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/` | 🔒 | Crea un posteo (acepta imagen vía `multipart/form-data`). |
| `GET` | `/` | 🔓 | Lista todos los posteos. |
| `GET` | `/:id` | 🔓 | Obtiene un posteo por su ID. |
| `PUT` | `/:id` | 🔒 | Edita un posteo propio (o cualquiera si es admin*). |
| `DELETE` | `/:id` | 🔒 | Elimina un posteo propio (o cualquiera si es admin). |
| `GET` | `/:id/pdf` | 🔓 | Exporta el posteo y sus comentarios a PDF. |

\* La edición está restringida al autor; la eliminación también la puede hacer un admin.

**POST `/api/posts`** — `Content-Type: multipart/form-data`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `titulo` | texto | sí | Entre 3 y 120 caracteres. |
| `contenido` | texto | sí | Entre 10 y 5000 caracteres. |
| `imagen` | archivo | no | Imagen del posteo (se sube a Cloudinary). |

```json
// Response 201
{
  "message": "Posteo creado correctamente",
  "post": { "_id": "...", "titulo": "...", "contenido": "...", "imagen": "...", "autor": "..." }
}
```

---

### Comentarios

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/posts/:postId/comments` | 🔒 | Crea un comentario en un posteo. |
| `GET` | `/api/posts/:postId/comments` | 🔓 | Lista los comentarios de un posteo. |
| `PUT` | `/api/comments/:id` | 🔒 | Edita un comentario propio. |
| `DELETE` | `/api/comments/:id` | 🔒 | Elimina un comentario propio (o cualquiera si es admin). |

**POST `/api/posts/:postId/comments`**

```json
// Request body
{ "contenido": "Muy buen posteo!" }
```

```json
// Response 201
{
  "message": "Comentario creado correctamente",
  "comment": { "_id": "...", "contenido": "Muy buen posteo!", "autor": "...", "post": "..." }
}
```

---

### Administración

Base: `/api/admin` — **todos los endpoints requieren rol `admin`** 👑

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/stats` | Estadísticas del sistema (totales y posteos por usuario). |
| `GET` | `/posts` | Lista todos los posteos para moderación. |
| `GET` | `/comments` | Lista todos los comentarios para moderación. |

**GET `/api/admin/stats`**

```json
// Response 200
{
  "message": "Estadísticas de administración obtenidas correctamente",
  "stats": {
    "totalUsuarios": 10,
    "totalPosteos": 25,
    "totalComentarios": 80,
    "posteosPorUsuario": [
      { "usuarioId": "...", "nombre": "Lucas", "email": "lucas@mail.com", "totalPosteos": 5 }
    ]
  }
}
```

---

### Chat (HTTP)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/chat/messages` | 🔓 | Devuelve los últimos 50 mensajes del chat. |

---

### Exportación a PDF

**GET `/api/posts/:id/pdf`** 🔓

Genera y descarga un archivo PDF (`application/pdf`) con el posteo completo: título, autor,
fecha, contenido, imagen (si tiene) y la lista de comentarios. Es uno de los **casos de uso
de complejidad moderada/alta** del proyecto, ya que transforma la información del sistema
para generar un documento nuevo.

---

### Chat en tiempo real (WebSockets)

El chat en vivo está implementado con **Socket.IO**. La conexión **requiere autenticación**:
el cliente debe enviar el token JWT al conectarse.

```js
// Ejemplo de conexión desde el cliente
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: "<jwt>" },
});
```

**Eventos:**

| Evento | Dirección | Payload | Descripción |
|---|---|---|---|
| `chat:sendMessage` | Cliente → Servidor | `{ contenido: "Hola!" }` | Envía un mensaje al chat. |
| `chat:newMessage` | Servidor → Clientes | mensaje completo | Se emite a todos cuando llega un nuevo mensaje. |
| `chat:error` | Servidor → Cliente | `{ message: "..." }` | Notifica un error (ej. mensaje vacío). |

Si la conexión no incluye un token válido, el servidor la rechaza con un error de
autorización.

---

## Modelos de datos

**User**

| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | String | 2–50 caracteres. |
| `email` | String | Único, formato de email válido. |
| `password` | String | Mínimo 6 caracteres, se guarda hasheada (`select: false`). |
| `rol` | String | `user` (default) o `admin`. |

**Post**

| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | String | 3–120 caracteres. |
| `contenido` | String | 10–5000 caracteres. |
| `imagen` | String | URL de Cloudinary (opcional). |
| `imagenPublicId` | String | ID público en Cloudinary (opcional). |
| `autor` | ObjectId → User | Referencia al autor. |

**Comment**

| Campo | Tipo | Notas |
|---|---|---|
| `contenido` | String | 2–1000 caracteres. |
| `autor` | ObjectId → User | Referencia al autor. |
| `post` | ObjectId → Post | Posteo al que pertenece. |

**ChatMessage**

| Campo | Tipo | Notas |
|---|---|---|
| `contenido` | String | 1–300 caracteres. |
| `autor` | ObjectId → User | Referencia al autor. |
| `nombreAutor` | String | Nombre del autor (hasta 50 caracteres). |

> Todos los modelos incluyen `timestamps` (`createdAt` y `updatedAt`).

---

## Manejo de errores

La API responde con errores en un formato JSON consistente y los códigos HTTP adecuados:

```json
{
  "message": "Descripción del error"
}
```

| Código | Significado habitual |
|---|---|
| `400` | Datos inválidos (validaciones, ID con formato incorrecto). |
| `401` | No autenticado (falta token o token inválido). |
| `403` | Sin permisos (rol insuficiente o recurso ajeno). |
| `404` | Recurso no encontrado. |
| `500` | Error interno del servidor. |

Las rutas inexistentes son capturadas por un middleware `notFound` y todos los errores
pasan por un middleware centralizado de manejo de errores.

---

## Autor

Trabajo Práctico Final — desarrollado por el grupo.
Repositorio: [github.com/LucasPatricioRey/Post-hub](https://github.com/LucasPatricioRey/Post-hub)
