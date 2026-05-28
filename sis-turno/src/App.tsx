import { useReducer, useEffect, useRef } from "react";
import { reducer, estadoInicial } from "./reducer";
import { FormularioAgregar } from "./components/FormularioAgregar";
import { ListaParticipantes } from "./components/ListaParticipantes";
import { PanelTurno } from "./components/PanelTurno";
import { AnuncioActual } from "./components/AnuncioActual";
import { Historial } from "./components/Historial";
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
  const prevRound = useRef(estado.round);

  useEffect(() => {
    hablar("S.I.S. Sistema de Iniciativa");
  }, []);

  // TTS reactivo: se dispara cuando cambia el turno real del estado
  // Así el nombre anunciado siempre coincide con lo que muestra la UI
  useEffect(() => {
    if (estado.nombreAnunciado === null) return;
    const esNuevoRound = estado.round > prevRound.current;
    prevRound.current = estado.round;
    if (esNuevoRound) {
      hablar(`Nuevo round. ${estado.nombreAnunciado}, te toca`);
    } else {
      hablar(`${estado.nombreAnunciado}, te toca`);
    }
  }, [estado.turnoActual]); // turnoActual incrementa exactamente una vez por turno

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
          <AnuncioActual nombre={estado.nombreAnunciado} esJugador={estado.esJugadorAnunciado} />
          <PanelTurno
            participantes={estado.participantes}
            round={estado.round}
            turnoActual={estado.turnoActual}
            onSiguienteTurno={handleSiguienteTurno}
          />
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
