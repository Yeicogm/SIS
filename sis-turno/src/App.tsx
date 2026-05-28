import { useReducer, useEffect, useRef } from "react";
import { reducer, estadoInicial } from "./reducer";
import { FormularioAgregar } from "./components/FormularioAgregar";
import { ListaParticipantes } from "./components/ListaParticipantes";
import { PanelTurno } from "./components/PanelTurno";
import { AnuncioActual } from "./components/AnuncioActual";
import { Historial } from "./components/Historial";
import { ProbabilidadProximo } from "./components/ProbabilidadProximo";
import { hablar } from "./utils/hablar";
import { Participante } from "./types";
import { Trash2 } from "lucide-react";
import "./App.css";

const LS_KEY = "sis-participantes";

function cargarParticipantes(): Participante[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Participante[];
    // Restaurar PR al valor original al cargar (listos para nueva partida)
    return parsed.map((p) => ({ ...p, pr: p.prOriginal }));
  } catch {
    return [];
  }
}

function App() {
  const [estado, dispatch] = useReducer(reducer, {
    ...estadoInicial,
    participantes: cargarParticipantes(),
  });
  useEffect(() => {
    hablar("S.I.S. Sistema de Iniciativa");
  }, []);

  // TTS: anuncia nuevo round cuando todos los PR llegan a 0
  useEffect(() => {
    if (estado.esperandoNuevoRound) {
      hablar(`Round ${estado.round}. Ajusta participantes cuando estés listo.`);
    }
  }, [estado.esperandoNuevoRound, estado.round]);

  // TTS: anuncia al participante seleccionado
  useEffect(() => {
    if (estado.nombreAnunciado === null) return;
    hablar(`${estado.nombreAnunciado}, te toca`);
  }, [estado.turnoActual]);

  // Persiste participantes en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(estado.participantes));
  }, [estado.participantes]);

  function handleAgregarParticipante(p: Participante) {
    dispatch({ type: "AGREGAR_PARTICIPANTE", payload: p });
  }

  function handleEliminarParticipante(id: string) {
    dispatch({ type: "ELIMINAR_PARTICIPANTE", payload: id });
  }

  function handleSiguienteTurno() {
    dispatch({ type: "SIGUIENTE_TURNO" });
  }

  function handleLimpiar() {
    hablar("Sesión terminada");
    localStorage.removeItem(LS_KEY);
    dispatch({ type: "LIMPIAR_TODO" });
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-titulo">⚔ SIS — Sistema de Iniciativa Stróm</h1>
        <button className="btn btn-limpiar" onClick={handleLimpiar} title="Limpiar todo">
          <Trash2 size={16} />
          Limpiar
        </button>
      </header>

      <main className="layout">
        {/* Columna izquierda */}
        <aside className="columna-izquierda">
          <FormularioAgregar onAgregar={handleAgregarParticipante} />
          <ListaParticipantes participantes={estado.participantes} onEliminar={handleEliminarParticipante} />
        </aside>

        {/* Columna central */}
        <section className="columna-central">
          <AnuncioActual
            nombre={estado.nombreAnunciado}
            esJugador={estado.esJugadorAnunciado}
            esperandoNuevoRound={estado.esperandoNuevoRound}
            round={estado.round}
          />
          <PanelTurno
            participantes={estado.participantes}
            round={estado.round}
            turnoActual={estado.turnoActual}
            onSiguienteTurno={handleSiguienteTurno}
          />
          <ProbabilidadProximo participantes={estado.participantes} />
        </section>

        {/* Columna derecha */}
        <aside className="columna-derecha">
          <Historial historial={estado.historial} />
        </aside>
      </main>
    </div>
  );
}

export default App;
