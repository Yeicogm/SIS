import { Play } from 'lucide-react';
import { Participante } from '../types';

interface Props {
  participantes: Participante[];
  round: number;
  turnoActual: number;
  onSiguienteTurno: () => void;
}

export function PanelTurno({
  participantes,
  round,
  turnoActual,
  onSiguienteTurno,
}: Props) {
  const hayActivos = participantes.some((p) => p.pr > 0);
  const hayParticipantes = participantes.length > 0;
  const habilitado = hayParticipantes && hayActivos;

  return (
    <div className="panel-turno">
      <div className="contadores">
        <span className="contador">Round: <strong>{round}</strong></span>
        <span className="contador">Turno: <strong>{turnoActual}</strong></span>
      </div>
      <button
        className={`btn-turno ${habilitado ? 'btn-turno-activo' : 'btn-turno-disabled'}`}
        onClick={onSiguienteTurno}
        disabled={!habilitado}
      >
        <Play size={22} />
        SIGUIENTE TURNO
      </button>
      {!hayParticipantes && (
        <span className="hint-turno">Agrega participantes para empezar</span>
      )}
    </div>
  );
}
