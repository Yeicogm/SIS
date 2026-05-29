# SIS — Sistema de Iniciativa Stróm

Herramienta web para gestionar el orden de turno en juegos de rol de mesa. Determina aleatoriamente quién
actúa y cuándo usando un sistema de **PR (Puntos de Reacción)** con selección ponderada.

🔗 **[Abrir la app](https://yeicogm.github.io/SIS/)**

---

## ¿Cómo funciona?

Cada participante tiene un valor de **PR** que representa su velocidad de reacción. En cada turno, la
probabilidad de ser seleccionado es proporcional a su PR actual. Al actuar, su PR se reduce; cuando todos
llegan a 0 se inicia un nuevo round.

- **PR alto** → más probable actuar primero y con más frecuencia
- **Herido** → al iniciar el round, el PR se restaura a la mitad del valor base
- **Ajuste dinámico (PRxT)** → si un bando tiene ventaja clara de velocidad, la penalización se reduce para
  equilibrar la frecuencia de acción entre jugadores y enemigos

## Características

- Selección aleatoria ponderada por PR
- Anuncio por voz (Web Speech API, español)
- Distinción visual entre jugadores y enemigos
- Panel de probabilidades del siguiente turno en tiempo real
- Historial de turnos de la sesión
- Persistencia de participantes en `localStorage`

## Stack

|                       |                      |
| --------------------- | -------------------- |
| React 18 + TypeScript | Lógica y componentes |
| Vite                  | Bundler y dev server |
| lucide-react          | Iconografía          |
| Web Speech API        | Text-to-Speech       |
| GitHub Pages          | Hosting              |

## Desarrollo local

```bash
cd sis-turno
npm install
npm run dev
```

## Build y deploy

El deploy a GitHub Pages es automático al hacer push a `main` mediante GitHub Actions.

Para probar el build localmente:

```bash
cd sis-turno
npm run build
npm run preview
```
