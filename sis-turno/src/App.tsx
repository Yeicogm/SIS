import { useReducer, useEffect } from 'react';
import { reducer, estadoInicial } from './reducer';
import { FormularioAgregar } from './components/FormularioAgregar';
import { ListaParticipantes } from './components/ListaParticipantes';
import { PanelTurno } from './components/PanelTurno';
import { AnuncioActual } from './components/AnuncioActual';
import { Historial } from './components/Historial';
import { hablar } from './utils/hablar';
import { seleccionarSiguiente } from './utils/seleccionarSiguiente';
import { Participante } from './types';
import { Trash2 } from 'lucide-react';
import './App.css';

function App() {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  useEffect(() => {
    hablar('S.I.S. Sistema de Iniciativa');
  }, []);

  function handleAgregarParticipante(p: Participante) {
    dispatch({ type: 'AGREGAR_PARTICIPANTE', payload: p });
  }

  function handleEliminarParticipante(id: string) {
    dispatch({ type: 'ELIMINAR_PARTICIPANTE', payload: id });
  }

  function handleSiguienteTurno() {
    // Verificar si al ejecutar quedará nuevo round
    const activos = estado.participantes.filter((p) => p.pr > 0);
    if (activos.length === 0) return;

    // Revisar si va a haber nuevo round (todos son 0 tras este turno)
    const resultado = seleccionarSiguiente(estado.participantes);
    if (resultado.nuevoRound) {
      hablar('Nuevo round');
    } else if (resultado.seleccionado) {
      hablar(`${resultado.seleccionado.nombre}, te toca`);
    }
    dispatch({ type: 'SIGUIENTE_TURNO' });
  }

  function handleLimpiar() {
    hablar('Sesión terminada');
    dispatch({ type: 'LIMPIAR_TODO' });
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
          <ListaParticipantes
            participantes={estado.participantes}
            onEliminar={handleEliminarParticipante}
          />
        </aside>

        {/* Columna central */}
        <section className="columna-central">
          <AnuncioActual
            nombre={estado.nombreAnunciado}
            esJugador={estado.esJugadorAnunciado}
          />
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
