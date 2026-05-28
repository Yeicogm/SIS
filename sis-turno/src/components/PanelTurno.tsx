import { Play } from "lucide-react";
import { useState } from "react";
import { Participante } from "../types";
import { PR_X_TURNO } from "../utils/seleccionarSiguiente";

interface Props {
  participantes: Participante[];
  round: number;
  turnoActual: number;
  prxTurno: number;
  onSiguienteTurno: () => void;
}

export function PanelTurno({ participantes, round, turnoActual, prxTurno, onSiguienteTurno }: Props) {
  const hayParticipantes = participantes.length > 0;
  const habilitado = hayParticipantes;
  const [mostrarInfo, setMostrarInfo] = useState(false);

  return (
    <div className="panel-turno">
      <div className="contadores">
        <span className="contador">
          Round: <strong>{round}</strong>
        </span>
        <span className="contador">
          Turno: <strong>{turnoActual}</strong>
        </span>
        <span className="contador contador-prt">
          PRxT: <strong>{prxTurno}</strong>
          {prxTurno !== PR_X_TURNO && (
            <span className="prt-ajustado" title="Ajustado por diferencia de velocidad entre grupos">
              ↓
            </span>
          )}
          <button
            className="prt-hint"
            onClick={() => setMostrarInfo((v) => !v)}
            aria-label="Explicación del cálculo PRxT"
          >
            ?
          </button>
        </span>
      </div>
      <button
        className={`btn-turno ${habilitado ? "btn-turno-activo" : "btn-turno-disabled"}`}
        onClick={onSiguienteTurno}
        disabled={!habilitado}
      >
        <Play size={22} />
        SIGUIENTE TURNO
      </button>
      {!hayParticipantes && <span className="hint-turno">Agrega participantes para empezar</span>}
      {mostrarInfo && (
        <div className="prt-popover">
          <button className="prt-popover-cerrar" onClick={() => setMostrarInfo(false)}>
            ✕
          </button>
          <p className="prt-popover-titulo">
            Cálculo PRxT = {prxTurno}
            {prxTurno !== PR_X_TURNO && ` (base ${PR_X_TURNO}, ajustado por diferencia de grupos)`}
          </p>
          <ul className="prt-popover-lista">
            <li>
              <strong>Seleccionado:</strong> PR − {prxTurno} − (jugadas × 2)
            </li>
            <li>
              <strong>Sin jugar aún:</strong> max(1, PR − 1) <span className="prt-nota">no baja de 1</span>
            </li>
            <li>
              <strong>Ya jugó (PR ≥ 3):</strong> max(0, PR − 1 − jugadas)
            </li>
            <li>
              <strong>Ya jugó (PR &lt; 3):</strong> max(0, PR − 1)
            </li>
          </ul>
          <p className="prt-ejemplo">Ej: PR=24 → juega 2 veces (24−13=11, 11−15≤0)</p>
        </div>
      )}
    </div>
  );
}
