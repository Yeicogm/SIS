# AGENTS.md — SIS: Sistema de Iniciativa Stróm

Guía de referencia completa para agentes de IA que trabajen en este repositorio.

---

## 1. Visión general del proyecto

**SIS** es una herramienta de mesa para gestionar iniciativa (orden de turno) en juegos de rol, usando un
sistema de **PR (Puntos de Reacción)** que determina aleatoriamente quién actúa y cuándo.

|                  | Original                            | Actual                                          |
| ---------------- | ----------------------------------- | ----------------------------------------------- |
| **Carpeta**      | `SISvb/`                            | `sis-turno/`                                    |
| **Tecnología**   | VB.NET WinForms (.NET Framework)    | React 18 + TypeScript + Vite                    |
| **TTS**          | `System.Speech.Synthesis` (Windows) | Web Speech API (`speechSynthesis`)              |
| **Persistencia** | XML (`Jugadores.xml`, `Master.xml`) | `localStorage` (solo la lista de participantes) |
| **Estado**       | Variables de clase + DataGridView   | `useReducer` centralizado                       |

**El proyecto activo es `sis-turno/`**. La carpeta `SISvb/` se conserva solo como referencia del sistema
original.

---

## 2. Estructura de `sis-turno/`

```
sis-turno/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx                          — punto de entrada
    ├── App.tsx                           — componente raíz, gestiona todo el estado global
    ├── App.css                           — todos los estilos (CSS plano, sin módulos ni Tailwind)
    ├── types/
    │   ├── index.ts                      — interfaces TypeScript: Participante, TurnoJugado, EstadoApp
    │   └── FileSystemAccess.d.ts         — declaraciones ambient (File System Access API) — actualmente sin uso
    ├── reducer/
    │   └── index.ts                      — reducer principal + estado inicial + cálculo de PRxTurno
    ├── utils/
    │   ├── seleccionarSiguiente.ts       — algoritmo de selección ponderada + generarId
    │   ├── hablar.ts                     — wrapper de Web Speech API
    │   └── archivo.ts                    — descargar/cargar plantel a archivo .sis (JSON)
    └── components/
        ├── FormularioAgregar.tsx         — formulario para añadir participantes
        ├── ListaParticipantes.tsx        — tabla de participantes con acciones
        ├── AnuncioActual.tsx             — panel central que muestra quién actúa
        ├── PanelTurno.tsx                — botón "Siguiente Turno" + contadores + popover PRxT
        ├── ProbabilidadProximo.tsx       — panel con % de probabilidad del próximo turno
        └── Historial.tsx                 — lista de turnos jugados en la sesión
```

---

## 3. Modelo de datos (tipos)

```typescript
// src/types/index.ts

interface Participante {
  id: string; // generarId() — Date.now().toString(36) + random
  nombre: string; // mínimo 2 chars, máximo 40
  pr: number; // PR actual (varía durante el combate)
  prOriginal: number; // PR base para restaurar al inicio de cada round
  esJugador: boolean; // true = jugador (azul), false = enemigo (rojo)
  vecesJugadas: number; // cuántas veces ha actuado en el round actual
  herido?: boolean; // si herido, el PR se restaura a Math.max(1, prOriginal/2)
}

interface TurnoJugado {
  turnoNumero: number;
  nombre: string;
  esJugador: boolean;
  timestamp: Date;
  round: number;
  vecesJugadas: number;
  evento?: "turno" | "herido" | "recuperado"; // undefined = turno normal
}

interface EstadoApp {
  participantes: Participante[];
  historial: TurnoJugado[]; // máximo 50 entradas (slice(0, 50))
  round: number; // número de round actual (empieza en 1)
  turnoActual: number; // contador global de turnos
  prxTurno: number; // PRxTurno efectivo (puede ser < PR_X_TURNO)
  nombreAnunciado: string | null; // nombre del último anunciado
  esJugadorAnunciado: boolean | null;
  esperandoNuevoRound: boolean; // true cuando todos los PR llegaron a 0
}
```

---

## 4. Algoritmo central: selección de turno

### Constantes

```typescript
PR_X_TURNO = 13; // penalización base al seleccionado
```

### Lógica de `seleccionarSiguiente(participantes, prxTurno)`

1. Filtrar participantes con `pr > 0` → lista `activos`
2. Si `activos.length === 0` → **nuevo round**:
   - Restaurar `pr = herido ? max(1, prOriginal/2) : prOriginal`
   - Resetear `vecesJugadas = 0`
   - Retornar `{ seleccionado: null, nuevoRound: true }`
3. Construir **lista ponderada**: cada participante aparece `pr` veces
4. Elegir índice aleatorio uniforme → `seleccionado`
5. Actualizar todos los PR:
   - **Seleccionado**: `pr = max(0, pr - prxTurno - vecesJugadas * 2)` → incrementar `vecesJugadas`
   - **Sin jugar aún** (`pr > 0 && vecesJugadas === 0`): `pr = max(1, pr - 1)` _(nunca llega a 0 antes de
     jugar)_
   - **Ya jugó, `pr >= 3`**: `pr = max(0, pr - 1 - vecesJugadas)`
   - **Ya jugó, `pr < 3`**: `pr = max(0, pr - 1)`
   - **Con `pr === 0`**: sin cambios (`return p`)

### Cálculo dinámico de `prxTurno`

```typescript
// En reducer/index.ts — calcularPRxTurno()
// Solo se aplica si hay >= 2 jugadores Y >= 2 enemigos
diferencial = |avgPR_enemigos - avgPR_jugadores| / 5
si diferencial <= 1 → prxTurno = PR_X_TURNO (13)
si no             → prxTurno = max(6, 13 - floor(diferencial * 2))
```

El ajuste penaliza menos al grupo más rápido para equilibrar la frecuencia de acción entre bandos.

---

## 5. Reducer: acciones disponibles

| Acción                  | Payload        | Efecto                                      |
| ----------------------- | -------------- | ------------------------------------------- |
| `AGREGAR_PARTICIPANTE`  | `Participante` | Añade a la lista                            |
| `ELIMINAR_PARTICIPANTE` | `string` (id)  | Elimina; limpia `nombreAnunciado` si era él |
| `SIGUIENTE_TURNO`       | —              | Ejecuta selección o confirma nuevo round    |
| `TOGGLE_HERIDO`         | `string` (id)  | Alterna `herido`; no modifica `pr` actual   |
| `LIMPIAR_TODO`          | —              | Resetea al `estadoInicial`                  |

### Flujo de `SIGUIENTE_TURNO`

```
Estado normal
    └─ seleccionarSiguiente()
           ├─ nuevoRound=false → anuncia ganador, actualiza historial
           └─ nuevoRound=true  → esperandoNuevoRound=true, round++,
                                 prxTurno=PR_X_TURNO, nombreAnunciado=null

Estado esperandoNuevoRound=true
    └─ seleccionarSiguiente() con PR recalculado → anuncia ganador, esperandoNuevoRound=false
```

> Detalle: en estado normal, el reducer reutiliza `estado.prxTurno` para turnos siguientes y solo lo recalcula
> cuando `historial.length === 0` (primer turno de la sesión) o cuando se acaba de iniciar un nuevo round.

---

## 6. Persistencia

La app soporta **dos niveles** de persistencia:

### 6.1 `localStorage` (automático, transparente)

- **Participantes** se guardan en `localStorage` (clave `"sis-participantes"`) cada vez que cambia el array.
- Al cargar la app, los PR se restauran a `prOriginal` y `vecesJugadas` se resetea a `0` (listos para nueva
  partida).
- El historial, round y `turnoActual` **no se persisten** (se pierden al recargar).

### 6.2 Archivo `.sis` (botones Guardar / Cargar en el header)

[`src/utils/archivo.ts`](sis-turno/src/utils/archivo.ts) exporta dos funciones:

- **`descargarParticipantes(participantes)`** — serializa el array a JSON, lo envuelve en un `Blob`, crea un
  `<a download="participantes.sis">` y dispara un click. Nombre de archivo fijo: `participantes.sis`.
- **`cargarParticipantesDesdeArchivo()`** — abre un `<input type="file" accept=".sis,.json">` con
  `input.showPicker()`. Lee el archivo, parsea JSON, y devuelve un array sanitizado.

> Nota: existe [`src/types/FileSystemAccess.d.ts`](sis-turno/src/types/FileSystemAccess.d.ts) que declara
> `showSaveFilePicker`/`showOpenFilePicker`, pero **no se usa** en el código actual — la app usa el enfoque
> clásico con `<input type="file">` + `<a download>` para máxima compatibilidad de navegadores.

### Sanitización al cargar

Al importar un `.sis`, cada participante es saneado:

- Se regenera el `id` con `generarId()` (evita colisiones con participantes ya presentes).
- Faltan campos → defaults: `pr = prOriginal = 3`, `esJugador = true`.
- `vecesJugadas` se fuerza a `0`.
- `herido` (opcional) se preserva si está presente.

Tras cargar, `App.handleCargarArchivo` pide confirmación y luego hace `LIMPIAR_TODO` + reinserta los
participantes. Anuncia por voz `"N participantes cargados"`.

---

## 7. TTS (Text-to-Speech)

```typescript
// src/utils/hablar.ts
hablar(texto: string): void  // Web Speech API, lang="es-ES"
```

| Momento               | Texto                                                   |
| --------------------- | ------------------------------------------------------- |
| App carga             | `"S.I.S. Sistema de Iniciativa"`                        |
| Agregar participante  | `"Agregado: [nombre]"`                                  |
| Eliminar participante | `"[nombre] eliminado"`                                  |
| Marcar herido         | `"[nombre] herido"`                                     |
| Recuperar herido      | `"[nombre] recuperado"`                                 |
| Turno (1ª vez)        | `"[nombre], te toca"`                                   |
| Turno repetido        | `"[nombre], ¡otra vez!"`                                |
| Nuevo round           | `"Round [N]. Ajusta participantes cuando estés listo."` |
| Guardar archivo       | `"Archivo guardado"`                                    |
| Cargar archivo        | `"N participantes cargados"`                            |
| Limpiar todo          | `"Sesión terminada"`                                    |

### Detección de repetición ("¡otra vez!")

- En el **TTS** se usa un `useRef` (`ultimoAnunciadoRef`) en [App.tsx](sis-turno/src/App.tsx): si el
  `nombreAnunciado` actual coincide con el último anunciado por voz, se dice `"[nombre], ¡otra vez!"`; si no,
  `"[nombre], te toca"`. El ref se actualiza después de cada anuncio.
- En el **componente `<AnuncioActual>`** (visual) se compara
  `estado.nombreAnunciado === estado.historial[1]?.nombre` para mostrar el texto "¡Te toca!" o "¡Otra vez!".

---

## 8. Componentes: responsabilidades y props

### `<App>` — `src/App.tsx`

- Único componente con acceso al `reducer`
- Maneja la lógica de TTS via `useEffect` (tres: montaje, `esperandoNuevoRound`, `turnoActual`)
- Lee/escribe `localStorage` (clave `"sis-participantes"`)
- Pasa handlers hacia abajo como props
- **Header** contiene tres botones de icono: `Save` (Guardar), `FolderOpen` (Cargar), `Trash2` (Limpiar)
- Handlers principales:
  - `handleAgregarParticipante`, `handleEliminarParticipante`, `handleToggleHerido`
  - `handleSiguienteTurno`
  - `handleLimpiar` — pide `confirm()` y anuncia `"Sesión terminada"`
  - `handleGuardarArchivo` — invoca `descargarParticipantes()`; anuncia `"Archivo guardado"`
  - `handleCargarArchivo` — invoca `cargarParticipantesDesdeArchivo()`; tras confirmar hace `LIMPIAR_TODO` +
    reinserta los participantes; anuncia `"N participantes cargados"`
- Layout: `aside.columna-izquierda` (Form + Lista) | `section.columna-central` (Anuncio + Panel +
  Probabilidad) | `aside.columna-derecha` (Historial)

### `<FormularioAgregar onAgregar>`

- Estado local: `nombre`, `pr` (default 10), `esJugador` (default true)
- Validación: nombre ≥ 2 chars; PR entre 0 y 99
- Al agregar: llama `hablar()` y limpia el formulario (PR vuelve a 3, no a 10)

### `<ListaParticipantes participantes, onEliminar, onToggleHerido>`

- Ordena por `pr DESC`
- Muestra badge de PR (verde si `pr > 0`, rojo si `pr = 0`)
- Badge de `vecesJugadas`
- Botón herido (`HeartCrack`) + botón eliminar (`Trash2`)
- Fila con clase `.herido` si `p.herido === true`

### `<AnuncioActual nombre, esJugador, esperandoNuevoRound, round, otraVez?>`

- Panel central visual destacado
- Si `esperandoNuevoRound`: muestra "ROUND N — Ajusta participantes y pulsa siguiente"
- Si hay nombre: muestra nombre grande + icono (User/Skull) + "¡Te toca!" o "¡Otra vez!"
- Animación `anuncio-fade-in` via `useEffect` + timeout de 20ms

### `<PanelTurno participantes, round, turnoActual, prxTurno, onSiguienteTurno>`

- Botón "SIGUIENTE TURNO" — siempre habilitado si hay al menos 1 participante
- Muestra Round, Turno, PRxT
- Flecha `↓` si `prxTurno < PR_X_TURNO`
- Botón `?` abre popover con la fórmula de decay explicada

### `<ProbabilidadProximo participantes>`

- Calcula `prob = round(pr * 100 / totalPR)` para cada activo
- Colores por posición: 1-2 → rojo, 3-4 → naranja, ≥5 → verde
- Sección "YA JUGARON" con los que tienen `vecesJugadas >= 1`
- Aviso de velocidad de grupo si el diferencial > 1
- La función `calcularVelocidadGrupo` **debe** usar el mismo umbral que
  [`calcularPRxTurno`](sis-turno/src/reducer/index.ts#L4-L14) (`>= 2` por bando), igual que
  el VB original ([Form1.vb:740](SISvb/Form1.vb#L740)). Mantener ambos sincronizados.

### `<Historial historial>`

- Lista newest-first de hasta 50 entradas
- Eventos normales: icono + `T[N]` + nombre + ordinal de ataque (1°, 2°, ...)
- Eventos `herido`/`recuperado`: icono HeartCrack/HeartPulse + nombre + texto
- Separador de round entre entradas de rounds distintos

---

## 9. Estilos

- **Un único archivo CSS**: `src/App.css` (sin módulos, sin Tailwind)
- Variables CSS en `:root`:

```css
--color-jugador: #3498db /* azul */ --color-enemigo: #e74c3c /* rojo */ --color-exito: #27ae60 /* verde */
  --color-fondo: #1a1f2e /* gris oscuro */ --color-fondo-alt: #232837 --color-texto: #ecf0f1
  --color-texto-muted: #8899aa --color-panel: #2c3348 --color-panel-borde: #3d4f6b --color-borde: #1abc9c
  /* turquesa (acento principal) */ --color-borde-dim: #2d5a4e --color-amarillo: #f39c12 --radio: 8px
  --radio-lg: 12px;
```

- Layout: `grid-template-columns: 340px 1fr 240px` (izquierda | central | derecha)
- Font: `"Inter", system-ui, sans-serif`

---

## 10. Stack, comandos y deployment

| Herramienta  | Versión |
| ------------ | ------- |
| React        | 18.3.1  |
| TypeScript   | ~5.7.2  |
| Vite         | 6.2.0   |
| lucide-react | 0.475.0 |

```bash
# Directorio de trabajo
cd sis-turno

# Servidor de desarrollo
npm run dev

# Build de producción (corre `tsc -b` antes de `vite build`)
npm run build

# Preview del build
npm run preview
```

### Configuración de Vite

[`vite.config.ts`](sis-turno/vite.config.ts) define **`base: "/SIS/"`** — necesario porque la app se sirve
desde `https://yeicogm.github.io/SIS/` (GitHub Pages bajo la ruta del repo). Si renombras el repo o lo mueves
a un dominio propio, hay que actualizar este valor.

### Deployment

El deploy a GitHub Pages es **automático** vía [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
al hacer push a `main`:

1. Job `build`: checkout → `setup-node@v4` con Node 20 + caché de `sis-turno/package-lock.json` → `npm ci` en
   `sis-turno/` → `npm run build` → sube artefacto desde `sis-turno/dist`.
2. Job `deploy` (con `needs: build`): publica el artefacto vía `actions/deploy-pages@v4` en el environment
   `github-pages`.

---

## 11. Lo que NO existe actualmente (referencia del original VB)

Las siguientes funcionalidades del original `SISvb` **no están implementadas** en `sis-turno`:

| Funcionalidad                                             | Estado                                              |
| --------------------------------------------------------- | --------------------------------------------------- |
| PV (Puntos de Vida) por participante                      | ❌ No implementado                                  |
| Dmin / Dmax (daño mínimo/máximo)                          | ❌ No implementado                                  |
| Campo "Incapacitado" (distinto de herido)                 | ❌ No implementado                                  |
| Guardar/cargar plantel desde archivo XML (formato VB)     | ❌ Reemplazado por archivo `.sis` (JSON) — ver §6.2 |
| Simulación de combate                                     | ❌ No implementado                                  |
| Separación visual Jugadores / Master en grillas distintas | Unificado en una sola lista                         |
| Ticker de estado en tiempo real                           | ❌ No implementado                                  |

El campo `herido` en React es la versión simplificada del flag `Incapacitado` del original.

---

## 12. Convenciones del código

- **Lenguaje de la UI**: español (botones, etiquetas, mensajes de error, TTS)
- **Nombres de variables/funciones**: camelCase en español (`esJugador`, `calcularPRxTurno`, `handleEliminar`)
- **Nombres de componentes**: PascalCase en español (`ListaParticipantes`, `PanelTurno`)
- **Nombres de acciones del reducer**: SCREAMING_SNAKE_CASE en español (`AGREGAR_PARTICIPANTE`)
- **Clases CSS**: kebab-case en español (`btn-turno-activo`, `celda-nombre`)
- **No hay tests** configurados actualmente
- **No usar** CSS modules ni Tailwind — todo en `App.css`
- **No usar** librerías de estado externas (Redux, Zustand) — solo `useReducer`
- Los iconos provienen exclusivamente de `lucide-react`
