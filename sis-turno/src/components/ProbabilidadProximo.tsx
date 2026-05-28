import { Participante } from "../types";

interface Props {
  participantes: Participante[];
}

function colorPorRango(rango: number): string {
  if (rango <= 2) return "prob-rojo";
  if (rango <= 4) return "prob-naranja";
  return "prob-verde";
}

export function ProbabilidadProximo({ participantes }: Props) {
  if (participantes.length === 0) return null;

  const activos = [...participantes].filter((p) => p.pr > 0).sort((a, b) => b.pr - a.pr);

  const yaJugaron = participantes.filter((p) => p.pr === 0);

  const totalPR = activos.reduce((sum, p) => sum + p.pr, 0);

  return (
    <div className="probabilidad-panel">
      <h2 className="probabilidad-titulo">PROBABILIDAD PRÓXIMO TURNO</h2>

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
