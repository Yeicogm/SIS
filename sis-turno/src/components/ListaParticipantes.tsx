import { Trash2, User, Skull } from "lucide-react";
import { Participante } from "../types";
import { hablar } from "../utils/hablar";

interface Props {
  participantes: Participante[];
  onEliminar: (id: string) => void;
}

export function ListaParticipantes({ participantes, onEliminar }: Props) {
  function handleEliminar(p: Participante) {
    onEliminar(p.id);
    hablar(`${p.nombre} eliminado`);
  }

  const ordenados = [...participantes].sort((a, b) => b.pr - a.pr);

  return (
    <div className="lista-participantes">
      <h2 className="lista-titulo">Participantes ({participantes.length})</h2>
      {participantes.length === 0 ? (
        <p className="sin-datos">Sin participantes</p>
      ) : (
        <table className="tabla-participantes">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>PR</th>
              <th>Jugadas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((p) => (
              <tr key={p.id} className={p.pr > 0 ? "activo" : "inactivo"}>
                <td className="celda-nombre">
                  {p.esJugador ? (
                    <User size={14} className="icono-jugador" />
                  ) : (
                    <Skull size={14} className="icono-enemigo" />
                  )}
                  {p.nombre}
                </td>
                <td className="celda-pr">
                  <span className={`badge-pr ${p.pr > 0 ? "pr-activo" : "pr-cero"}`}>{p.pr}</span>
                </td>
                <td className="celda-jugadas">
                  <span
                    className={`badge-jugadas ${(p.vecesJugadas ?? 0) === 0 ? "jugadas-cero" : "jugadas-ok"}`}
                  >
                    {p.vecesJugadas ?? 0}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-eliminar"
                    onClick={() => handleEliminar(p)}
                    title={`Eliminar ${p.nombre}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
