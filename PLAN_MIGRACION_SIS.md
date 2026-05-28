# ESPECIFICACIONES TÉCNICAS: SIS - MÓDULO DE TURNO
## Sistema de Anuncio de Turno para Juegos de Rol

---

## 1. DESCRIPCIÓN GENERAL

### 1.1 Propósito
Aplicación web para gestionar y anunciar turnos en juegos de rol de mesa. Selecciona aleatoriamente un participante basándose en su valor de PR (Puntos de Ritmo) y lo anuncia mediante síntesis de voz.

### 1.2 Funcionalidad Principal
- Agregar participantes (jugadores o enemigos) con nombre y PR
- Iniciar turno que selecciona aleatoriamente un participante basándose en PR
- Anunciar por voz el nombre del seleccionado
- Mostrar historial de turnos jugados en la sesión

### 1.3 Restricciones
- Sin persistencia (todo en memoria)
- TTS debe funcionar en Chrome, Firefox, Safari, Edge
- Sin base de datos

---

## 2. ARQUITECTURA

### 2.1 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilos | CSS Modules o Tailwind CSS |
| TTS | Web Speech API (nativa del navegador) |
| Estado | React useState/useReducer |

### 2.2 Estructura de Archivos del Proyecto

```
sis-turno/
├── public/
│   └── (archivos estáticos si necesarios)
├── src/
│   ├── components/
│   │   ├── FormularioAgregar.tsx
│   │   ├── ListaParticipantes.tsx
│   │   ├── PanelTurno.tsx
│   │   ├── Historial.tsx
│   │   └── AnuncioActual.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── seleccionarSiguiente.ts
│   │   └── hablar.ts
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 3. MODELO DE DATOS

### 3.1 Tipo Participante

```typescript
interface Participante {
  id: string;           // UUID generado
  nombre: string;        // Nombre del personaje
  pr: number;           // Puntos de Ritmo (>= 0)
  esJugador: boolean;   // true = jugador, false = enemigo
}

interface TurnoJugado {
  turnoNumero: number;
  nombre: string;
  esJugador: boolean;
  prUsado: number;
  timestamp: Date;
}

interface EstadoApp {
  participantes: Participante[];
  historial: TurnoJugado[];
  turnoActual: number;
  nombreAnunciado: string | null;
}
```

---

## 4. REGLAS DE NEGOCIO

### 4.1 Selección de Siguiente Turno

1. Filtrar participantes con PR > 0
2. Crear lista ponderada: cada participante aparece en la lista N veces donde N = su PR
3. Seleccionar índice aleatorio uniformemente de la lista ponderada
4. El PR del seleccionado se reduce a 0 (para evitar repeticiones en mismo "round")
5. Los demás participantes reducen su PR en 1 (si PR > 0)
6. Cuando TODOS los participantes tienen PR = 0, se reinician los PR originales y se incrementa round

### 4.2 Ejemplo de Selección

```
Participantes:
- Heroe1: PR=3 (aparece 3 veces)
- Heroe2: PR=2 (aparece 2 veces)
- Enemigo1: PR=4 (aparece 4 veces)

Lista ponderada: [Heroe1, Heroe1, Heroe1, Heroe2, Heroe2, Enemigo1, Enemigo1, Enemigo1, Enemigo1]
Selección aleatoria → Enemigo1

Resultado:
- Enemigo1: PR = 0
- Heroe1: PR = 2 (3-1)
- Heroe2: PR = 1 (2-1)
```

### 4.3 Reinicio de Turno (Round)

Cuando todos los PR llegan a 0:
- Restaurar PR original de cada participante
- Incrementar contador de round
- Mostrar mensaje "Nuevo Round"

---

## 5. COMPONENTES UI

### 5.1 FormularioAgregar

**Ubicación:** Panel lateral izquierdo superior

**Campos:**
- Input texto: Nombre (requerido, min 2 caracteres)
- Input number: PR (requerido, default 3, min 0, max 99)
- Radio buttons: Tipo (Jugador / Enemigo)
- Botón: "Agregar"

**Validación:**
- Nombre vacío → mensaje "Nombre requerido"
- PR negativo → convertir a 0
- PR > 99 → limitar a 99

**Comportamiento:**
- Al agregar: limpiar campos, agregar a lista, hablar "Agregado: [nombre]"
- Lista actualizada inmediatamente

### 5.2 ListaParticipantes

**Ubicación:** Panel central izquierdo

**Estructura:**
- Tabla con columnas: Nombre | PR | Tipo | Acciones
- Botón eliminar (X) por fila
- Indicador visual: verde si PR > 0, rojo si PR = 0

**Estados:**
- Vacío: mensaje "Sin participantes"
- Con datos: lista ordenada por PR descendente

**Interacciones:**
- Click en X → confirmar eliminación, remover, hablar "[nombre] eliminado"
- Hover en fila → destacar

### 5.3 PanelTurno

**Ubicación:** Panel superior

**Elementos:**
- Botón grande: "SIGUIENTE TURNO"
- Contador: "Round: X"
- Contador: "Turno: Y"

**Estados del botón:**
- Disabled si: no hay participantes o todos tienen PR = 0
- Enabled: fondo verde, texto blanco

**Comportamiento al hacer click:**
1. Deshabilitar botón
2. Ejecutar selección ponderada
3. Decrementar PR según reglas
4. Agregar a historial
5. Anunciar nombre por TTS
6. Mostrar nombre en grande
7. Habilitar botón

### 5.4 AnuncioActual

**Ubicación:** Centro de la pantalla, destacado

**Diseño:**
- Nombre grande (48px font)
- Fondo con color según tipo: azul para jugadores, rojo para enemigos
- Animación fade-in al anunciar

**Estados:**
- Vacío: muestra "Esperando..."
- Con nombre: muestra nombre con animación

### 5.5 Historial

**Ubicación:** Panel derecho o inferior

**Estructura:**
- Lista de turnos jugados
- Formato: "Turno X: [nombre] ([tipo])"
- newest first

**Límite:** Mostrar últimos 50 turnos

---

## 6. SISTEMA TTS (Text-to-Speech)

### 6.1 Implementación

```typescript
function hablar(texto: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
```

### 6.2 Eventos de Voz

| Evento | Texto |
|--------|-------|
| Agregar participante | "Agregado: [nombre]" |
| Eliminar participante | "[nombre] eliminado" |
| Anunciar turno | "[nombre], te toca" |
| Nuevo round | "Nuevo round" |
| Fin de sesión | "Sesión terminada" |

### 6.3 Compatibilidad

- Chrome: Full support
- Firefox: Full support  
- Safari: Full support
- Edge: Full support

**Nota:** Si speechSynthesis no está disponible, mostrar nombre solo visualmente.

---

## 7. ESTILOS (CSS)

### 7.1 Paleta de Colores

```css
:root {
  --color-jugador: #3498db;      /* Azul */
  --color-enemigo: #e74c3c;       /* Rojo */
  --color-exito: #27ae60;         /* Verde */
  --color-fondo: #2c3e50;         /* Gris oscuro */
  --color-texto: #ecf0f1;         /* Blanco gris */
  --color-panel: #34495e;         /* Gris medio */
  --color-borde: #1abc9c;         /* Turquesa */
}
```

### 7.2 Layout Principal

```
+------------------------------------------+
|              HEADER (SIS - TURNO)        |
+----------+---------------+----------------+
| FORMULARIO|   ANUNCIO    |   HISTORIAL     |
| AGREGAR   |   GRANDE     |                |
|           |  [NOMBRE]    |                |
+----------+---------------+----------------+
|           LISTA PARTICIPANTES             |
|           [Tabla de participantes]        |
+----------+---------------+----------------+
|           PANEL TURNO                    |
|  [SIGUIENTE TURNO]  Round: X Turno: Y     |
+------------------------------------------+
```

### 7.3 Responsividad

- Desktop (>1024px): Layout de 3 columnas
- Tablet (768-1024px): Layout de 2 columnas
- Mobile (<768px): Layout vertical apilado

---

## 8. FUNCIONES AUXILIARES

### 8.1 Seleccionar Siguiente

```typescript
function seleccionarSiguiente(
  participantes: Participante[]
): { seleccionado: Participante; actualizados: Participante[] } {
  
  const activos = participantes.filter(p => p.pr > 0);
  
  if (activos.length === 0) {
    // Reiniciar PR
    const reiniciados = participantes.map(p => ({
      ...p,
      prOriginal: p.pr,
      pr: p.prOriginal || 3
    }));
    return { seleccionado: null, actualizados: reiniciados };
  }
  
  // Crear lista ponderada
  const listaPonderada: Participante[] = [];
  for (const p of activos) {
    for (let i = 0; i < p.pr; i++) {
      listaPonderada.push(p);
    }
  }
  
  const indice = Math.floor(Math.random() * listaPonderada.length);
  constseleccionado = listaPonderada[indice];
  
  // Actualizar PR de todos
  const actualizados = participantes.map(p => {
    if (p.id === seleccionado.id) {
      return { ...p, pr: 0 };
    } else if (p.pr > 0) {
      return { ...p, pr: Math.max(0, p.pr - 1) };
    }
    return p;
  });
  
  return { seleccionado, actualizados };
}
```

### 8.2 Generar ID

```typescript
const generarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
```

---

## 9. CICLO DE VIDA DE LA APLICACIÓN

### 9.1 Inicialización

1. Crear estado inicial vacío
2. Renderizar UI con estado vacío
3. TTS: "Sistema de turno iniciado"

### 9.2 Agregar Participante

1. Usuario llena formulario
2. Validar datos
3. Crear objeto Participante con ID único
4. Agregar a estado
5. Limpiar formulario
6. TTS: "Agregado: [nombre]"

### 9.3 Ejecutar Turno

1. Usuario clickea "Siguiente Turno"
2. Verificar que haya participantes activos
3. Ejecutar selección ponderada
4. Actualizar PR de todos
5. Agregar a historial
6. TTS: "[nombre], te toca"
7. Mostrar nombre en componente AnuncioActual

### 9.4 Reiniciar Round

1. Detectar cuando todos PR = 0
2. TTS: "Nuevo round"
3. Restaurar PR originales
4. Incrementar contador de round

### 9.5 Eliminar Participante

1. Usuario clickea X en fila
2. Confirmar con modal o directamente
3. Remover del estado
4. TTS: "[nombre] eliminado"

---

## 10. MANEJO DE ESTADO

### 10.1 Estado Global (useReducer)

```typescript
type Accion =
  | { type: 'AGREGAR_PARTICIPANTE'; payload: Participante }
  | { type: 'ELIMINAR_PARTICIPANTE'; payload: string }
  | { type: 'SIGUIENTE_TURNO' }
  | { type: 'REINICIAR_ROUND' }
  | { type: 'LIMPIAR_TODO' };
```

### 10.2 Reducer

```typescript
function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.type) {
    case 'AGREGAR_PARTICIPANTE':
      return {
        ...estado,
        participantes: [...estado.participantes, accion.payload]
      };
    
    case 'ELIMINAR_PARTICIPANTE':
      return {
        ...estado,
        participantes: estado.participantes.filter(p => p.id !== accion.payload)
      };
    
    case 'SIGUIENTE_TURNO':
      // Ejecutar lógica de selección
      const resultado = seleccionarSiguiente(estado.participantes);
      if (!resultado.seleccionado) {
        return { ...estado, round: estado.round + 1 };
      }
      return {
        ...estado,
        participantes: resultado.actualizados,
        historial: [...estado.historial, {
          turnoNumero: estado.turnoActual,
          nombre: resultado.seleccionado.nombre,
          esJugador: resultado.seleccionado.esJugador,
          prUsado: resultado.seleccionado.pr,
          timestamp: new Date()
        }],
        turnoActual: estado.turnoActual + 1,
        nombreAnunciado: resultado.seleccionado.nombre
      };
    
    // ... otras acciones
  }
}
```

---

## 11. COMPATIBILIDAD DE NAVEGADORES

### 11.1 Navegadores Soportados

| Navegador | Versión Mínima |
|------------|----------------|
| Chrome | 33+ |
| Firefox | 49+ |
| Safari | 7+ |
| Edge | 14+ |

### 11.2 APIs Utilizadas

- `window.speechSynthesis` - TTS
- `crypto.randomUUID()` - ID único (o fallback)
- CSS Grid/Flexbox - Layout
- CSS Variables - Theming

---

## 12. INSTALACIÓN Y EJECUCIÓN

### 12.1 Requisitos Previos

- Node.js 18+ instalado
- npm o yarn

### 12.2 Pasos de Instalación

```bash
# 1. Crear proyecto con Vite
npm create vite@latest sis-turno -- --template react-ts

# 2. Entrar al directorio
cd sis-turno

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir navegador en http://localhost:5173
```

### 12.3 Build para Producción

```bash
npm run build
# Archivos generados en dist/
```

---

## 13. ICONOGRAFÍA Y RECURSOS

### 13.1 Iconos

Usar biblioteca Lucide React o Heroicons:

```bash
npm install lucide-react
```

Iconos necesarios:
- User (jugador)
- Skull (enemigo)
- Play (siguiente turno)
- Trash2 (eliminar)
- Plus (agregar)

### 13.2 Fuentes

Usar fuente del sistema para simplicidad, o Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## 14. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup (30 min)
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Configurar estructura de carpetas
- [ ] Definir tipos TypeScript

### Fase 2: Estado (30 min)
- [ ] Crear useReducer con estado inicial
- [ ] Implementar acciones básicas
- [ ] Conectar estado a componentes

### Fase 3: UI Base (1 hora)
- [ ] Crear FormularioAgregar
- [ ] Crear ListaParticipantes
- [ ] Crear estilos CSS

### Fase 4: Lógica de Turno (1 hora)
- [ ] Implementar función seleccionarSiguiente
- [ ] Implementar lógica de round
- [ ] Conectar botón a reducer

### Fase 5: TTS (30 min)
- [ ] Implementar función hablar
- [ ] Integrar en eventos de usuario
- [ ] Probar en diferentes navegadores

### Fase 6: Historial y UI Final (1 hora)
- [ ] Crear componente Historial
- [ ] Crear componente AnuncioActual
- [ ] Ajustar estilos y layout
- [ ] Testing completo

---

## 15. CÓDIGO COMPLETO DE REFERENCIA

### 15.1 types/index.ts

```typescript
export interface Participante {
  id: string;
  nombre: string;
  pr: number;
  esJugador: boolean;
}

export interface TurnoJugado {
  turnoNumero: number;
  nombre: string;
  esJugador: boolean;
  prUsado: number;
  timestamp: Date;
}

export interface EstadoApp {
  participantes: Participante[];
  historial: TurnoJugado[];
  round: number;
  turnoActual: number;
  nombreAnunciado: string | null;
}
```

### 15.2 utils/hablar.ts

```typescript
export function hablar(texto: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
```

### 15.3 utils/seleccionarSiguiente.ts

```typescript
import { Participante } from '../types';

interface ResultadoSeleccion {
  seleccionado: Participante | null;
  actualizados: Participante[];
  nuevoRound: boolean;
}

export function seleccionarSiguiente(
  participantes: Participante[]
): ResultadoSeleccion {
  const activos = participantes.filter(p => p.pr > 0);
  
  if (activos.length === 0) {
    return {
      seleccionado: null,
      actualizados: participantes.map(p => ({ ...p })),
      nuevoRound: true
    };
  }
  
  const listaPonderada: Participante[] = [];
  for (const p of activos) {
    for (let i = 0; i < p.pr; i++) {
      listaPonderada.push(p);
    }
  }
  
  const indice = Math.floor(Math.random() * listaPonderada.length);
  const seleccionado = listaPonderada[indice];
  
  const actualizados = participantes.map(p => {
    if (p.id === seleccionado.id) {
      return { ...p, pr: 0 };
    } else if (p.pr > 0) {
      return { ...p, pr: Math.max(0, p.pr - 1) };
    }
    return p;
  });
  
  return { seleccionado, actualizados, nuevoRound: false };
}
```

---

## 16. FLUJO COMPLETO DE USUARIO

1. **Usuario abre la aplicación**
   - Ve interfaz vacía con mensaje "Sin participantes"
   - Sistema dice: "Sistema de turno iniciado"

2. **Usuario agrega un jugador**
   - Ingresa nombre "Guerrero"
   - Deja PR = 3 (default)
   - Selecciona "Jugador"
   - Click "Agregar"
   - Ve aparece "Guerrero" en lista con PR=3
   - Sistema dice: "Agregado: Guerrero"

3. **Usuario agrega enemigos**
   - Agrega "Orco" PR=4 Enemigo
   - Agrega "Goblin" PR=2 Enemigo
   - Sistema anuncia cada uno

4. **Usuario inicia turno**
   - Click "SIGUIENTE TURNO"
   - Sistema selecciona aleatorio ponderado
   - Sistema dice: "Orco, te toca"
   - Nombre aparece en grande
   - PR actualizados: Guerrero=2, Orco=0, Goblin=1

5. **Continúa turnos**
   - Click siguiente → Sistema selecciona
   - Continúa hasta que todos PR=0

6. **Nuevo round**
   - Cuando todos PR=0
   - Sistema dice: "Nuevo round"
   - PR restaurados
   - Round incrementa

---

## 17. MENSAJES DE ERROR Y EDGE CASES

| Situación | Comportamiento |
|-----------|----------------|
| Sin participantes + click turno | Botón deshabilitado |
| Nombre duplicado | Permitir (diferenciar por ID) |
| PR vacío | Default a 3 |
| TTS no disponible | Solo mostrar visual |
| Nombre muy largo | Truncar en UI, decir completo |

---

## FIN DEL DOCUMENTO

---

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Autor:** Documento de especificaciones para migración SIS