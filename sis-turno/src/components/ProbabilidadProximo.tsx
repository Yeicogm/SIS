import { Participante } from "../types";

interface Props {
  participantes: Participante[];
}

function colorPorRango(rango: number): string {
  if (rango <= 2) return "prob-rojo";
  if (rango <= 4) return "prob-naranja";
  return "prob-verde";
}

function calcularVelocidadGrupo(participantes: Participante[]): {
  aviso: "jugadores" | "enemigos" | null;
} {
  const jugadores = participantes.filter((p) => p.esJugador);
  const enemigos = participantes.filter((p) => !p.esJugador);

  if (jugadores.length < 1 || enemigos.length < 1) return { aviso: null };

  const avgJugadores = jugadores.reduce((s, p) => s + p.prOriginal, 0) / jugadores.length;
  const avgEnemigos = enemigos.reduce((s, p) => s + p.prOriginal, 0) / enemigos.length;
  const diferencial = Math.abs(avgEnemigos - avgJugadores) / 5;

  if (diferencial <= 1) return { aviso: null };
  return { aviso: avgEnemigos > avgJugadores ? "enemigos" : "jugadores" };
}

export function ProbabilidadProximo({ participantes }: Props) {
  if (participantes.length === 0) return null;

  const activos = [...participantes].filter((p) => p.pr > 0).sort((a, b) => b.pr - a.pr);
  const yaJugaron = participantes.filter((p) => p.pr === 0);
  const totalPR = activos.reduce((sum, p) => sum + p.pr, 0);
  const { aviso } = calcularVelocidadGrupo(participantes);

  return (
    <div className="probabilidad-panel">
      <h2 className="probabilidad-titulo">PROBABILIDAD PRÓXIMO TURNO</h2>

      {aviso === "enemigos" && (
        <div className="prob-aviso prob-aviso-enemigos">⚠ ¡LOS ENEMIGOS SON MÁS RÁPIDOS!</div>
      )}
      {aviso === "jugadores" && (
        <div className="prob-aviso prob-aviso-jugadores">⚡ ¡LOS JUGADORES SON MÁS RÁPIDOS!</div>
      )}

      {activos.length === 0 ? (
        <p className="sin-datos">Todos han jugado este round</p>
      ) : (
        <ul className="prob-lista">
          {activos.map((p, i) => {
            const prob = Math.round((p.pr * 100) / totalPR);
            const color = colorPorRango(i + 1);
            return (
              <li key={p.id} className={`prob-item ${color}`}>
                <span className="prob-nombre">{p.nombre}</span>
                <span className="prob-porcentaje">{prob}%</span>
              </li>
            );
          })}
        </ul>
      )}

      {yaJugaron.length > 0 && (
        <>
          <div className="prob-separador">YA JUGARON</div>
          <ul className="prob-lista prob-lista-jugados">
            {yaJugaron.map((p) => (
              <li key={p.id} className="prob-item prob-jugado">
                <span className="prob-nombre">{p.nombre}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
