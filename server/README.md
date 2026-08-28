# 🌐 SNAKE 67 — Servidor Multijugador

Backend con Node.js + Socket.io + PostgreSQL para el juego SNAKE 67.

## Estructura

```
server/
├── server.js     # Servidor Express + Socket.io + Game Loop
├── db.js         # Conexión PostgreSQL (Railway)
├── package.json
└── .env          # NO se sube a GitHub (ver .gitignore)
```

## Variables de entorno necesarias en Railway

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `PORT` | Puerto (Railway lo asigna automáticamente) |

## Desarrollo local

```bash
cd server
npm install
npm run dev    # Inicia con --watch (auto-reload)
```

## Producción (Railway)

Railway detecta automáticamente el `package.json` y corre `npm start`.
