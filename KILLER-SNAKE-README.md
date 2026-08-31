# 🐍 KILLER SNAKE

Juego multijugador Battle Royale en tiempo real (1-4 jugadores).

## Stack
- **Backend**: Python + FastAPI + WebSockets (servidor autoritativo)
- **Frontend**: React + Vite + Tailwind CSS + HTML5 Canvas

## Arrancar en local

### 1. Backend (Python)
```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` en dos pestañas del navegador para probar el multijugador.

## Estructura
```
KILLER-SNAKE/
├── backend/
│   ├── main.py          # FastAPI + WebSocket endpoints
│   ├── game.py          # Lógica del juego (autoritativa)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── hooks/useGameSocket.js
        └── components/
            ├── MainMenu.jsx
            ├── Lobby.jsx
            ├── GameScreen.jsx
            ├── GameCanvas.jsx
            ├── DPad.jsx
            ├── Scoreboard.jsx
            └── GameOver.jsx
```
